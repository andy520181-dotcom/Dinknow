const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) return { success: false, message: '未登录' }

  // 检查用户是否已在个人中心完成登录（users 表中有记录且有昵称）
  let currentUser
  try {
    const userRes = await db.collection('users').where({ openid }).get()
    currentUser = userRes.data && userRes.data[0]
    if (!currentUser || !currentUser.nickName) {
      return { success: false, message: '请先在个人中心完成登录' }
    }
  } catch (e) {
    console.error('joinActivity 检查用户登录状态失败:', e)
    return { success: false, message: '登录检查失败，请重试' }
  }

  const { activityId } = event || {}
  if (!activityId) return { success: false, message: '缺少活动ID' }

  try {
    // 1. 获取活动信息
    const actRes = await db.collection('activities').doc(activityId).get()
    if (!actRes.data || !actRes.data._id) return { success: false, message: '活动不存在' }
    const activity = actRes.data
    const maxParticipants = activity.maxParticipants || 20
    const activityType = activity.activityType || '不限'
    const hostId = activity.hostId

    // 2. 检查是否已报名（只检查 status 为 'joined' 的记录，已退出的用户可以重新报名）
    const existRes = await db.collection('registrations').where({
      activityId,
      userId: openid,
      status: 'joined'
    }).get()
    if (existRes.data && existRes.data.length > 0) {
      return { success: false, message: '已报名过该活动' }
    }
    
    // 如果用户之前退出过（status 为 'left'），更新记录为 'joined'，而不是创建新记录
    const leftRes = await db.collection('registrations').where({
      activityId,
      userId: openid,
      status: 'left'
    }).get()
    
    if (leftRes.data && leftRes.data.length > 0) {
      // 更新已退出的记录为重新报名
      const registrationId = leftRes.data[0]._id
      await db.collection('registrations').doc(registrationId).update({
        data: {
          status: 'joined',
          joinedAt: Date.now(),
          leftAt: null // 清除退出时间
        }
      })
      return { success: true, message: '重新报名成功' }
    }

    // 3. 检查是否是创建者本人
    if (hostId === openid) {
      return { success: false, message: '创建者无需报名' }
    }

    // 4. 获取创建者信息（性别）
    let hostGender = 0 // 0=未知, 1=男, 2=女
    try {
      const hostRes = await db.collection('users').where({ openid: hostId }).get()
      if (hostRes.data && hostRes.data[0]) {
        hostGender = hostRes.data[0].gender || 0
      }
    } catch (e) {
      console.error('获取创建者信息失败:', e)
    }

    // 5. 获取已报名用户列表（不包括创建者）
    const registrationsRes = await db.collection('registrations')
      .where({ activityId, status: 'joined' })
      .get()
    
    const registeredUserIds = registrationsRes.data.map(r => r.userId)
    const registeredCount = registeredUserIds.length

    // 6. 根据活动形式计算可报名人数（不包括创建者）
    let availableSlots = 0
    if (activityType === '单打') {
      availableSlots = 1 // 除了创建者，还剩1人
    } else if (activityType === '双打' || activityType === '混双') {
      availableSlots = 3 // 除了创建者，还剩3人
    } else {
      // 不限：总人数减1（创建者）
      availableSlots = maxParticipants - 1
    }

    // 7. 检查是否已满
    if (registeredCount >= availableSlots) {
      return { success: false, message: '报名已满' }
    }

    // 8. 根据活动形式验证性别匹配
    if (activityType === '单打') {
      // 单打：创建者为男性，只能男性报名；创建者为女性，只能女性报名
      if (hostGender === 1 && currentUser.gender !== 1) {
        return { success: false, message: '单打活动，创建者为男性，只能男性报名' }
      }
      if (hostGender === 2 && currentUser.gender !== 2) {
        return { success: false, message: '单打活动，创建者为女性，只能女性报名' }
      }
    } else if (activityType === '双打') {
      // 双打：创建者为男性，剩下的3人只能是男性；创建者为女性，剩下的3人只能是女性
      if (hostGender === 1 && currentUser.gender !== 1) {
        return { success: false, message: '双打活动，创建者为男性，只能男性报名' }
      }
      if (hostGender === 2 && currentUser.gender !== 2) {
        return { success: false, message: '双打活动，创建者为女性，只能女性报名' }
      }
    } else if (activityType === '混双') {
      // 混双：需要获取已报名用户的性别信息
      let maleCount = 0
      let femaleCount = 0

      if (registeredUserIds.length > 0) {
        const usersRes = await db.collection('users')
          .where({
            openid: db.command.in(registeredUserIds)
          })
          .get()
        
        usersRes.data.forEach(u => {
          if (u.gender === 1) maleCount++
          else if (u.gender === 2) femaleCount++
        })
      }

      // 如果创建者为男性，剩下的3人性别只能是1男2女
      if (hostGender === 1) {
        const totalMaleCount = maleCount + (currentUser.gender === 1 ? 1 : 0)
        const totalFemaleCount = femaleCount + (currentUser.gender === 2 ? 1 : 0)
        // 总人数应该是3人（1男2女）
        if (totalMaleCount + totalFemaleCount > 3) {
          return { success: false, message: '报名已满' }
        }
        // 检查性别比例
        if (totalMaleCount > 1) {
          return { success: false, message: '混双活动，创建者为男性，剩余名额需要1男2女，男性名额已满' }
        }
        if (totalFemaleCount > 2) {
          return { success: false, message: '混双活动，创建者为男性，剩余名额需要1男2女，女性名额已满' }
        }
      }
      // 如果创建者为女性，剩下的3人性别只能是1女2男
      if (hostGender === 2) {
        const totalMaleCount = maleCount + (currentUser.gender === 1 ? 1 : 0)
        const totalFemaleCount = femaleCount + (currentUser.gender === 2 ? 1 : 0)
        // 总人数应该是3人（1女2男）
        if (totalMaleCount + totalFemaleCount > 3) {
          return { success: false, message: '报名已满' }
        }
        // 检查性别比例
        if (totalFemaleCount > 1) {
          return { success: false, message: '混双活动，创建者为女性，剩余名额需要1女2男，女性名额已满' }
        }
        if (totalMaleCount > 2) {
          return { success: false, message: '混双活动，创建者为女性，剩余名额需要1女2男，男性名额已满' }
        }
      }
    }
    // 不限：不做性别限制

    // 9. 创建报名记录
    await db.collection('registrations').add({
      data: {
        activityId,
        userId: openid,
        status: 'joined',
        joinedAt: Date.now()
      }
    })
    return { success: true }
  } catch (e) {
    console.error('joinActivity', e)
    return { success: false, message: '加入失败' }
  }
}
