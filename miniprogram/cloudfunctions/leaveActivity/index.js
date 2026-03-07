const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// NOTE: 取消报名通知 → 发起人
const TMPL_CANCEL_NOTIFY = 'Xj24M5_YdfmnpSpwNGI69w__rcm63e8EBE5fgLYWY2k'

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) return { success: false, message: '未登录' }

  const { activityId } = event || {}
  if (!activityId) return { success: false, message: '缺少活动ID' }

  try {
    // 1. 检查是否已报名
    const existRes = await db.collection('registrations').where({
      activityId,
      userId: openid,
      status: 'joined'
    }).get()

    if (!existRes.data || existRes.data.length === 0) {
      return { success: false, message: '未报名该活动' }
    }

    // 2. 更新报名状态为已退出
    const registrationId = existRes.data[0]._id
    await db.collection('registrations').doc(registrationId).update({
      data: {
        status: 'left',
        leftAt: Date.now()
      }
    })

    // 3. 订阅消息：向发起人推送「有人取消报名」（异步，失败不影响结果）
    cloud.callFunction({
      name: 'getActivityDetail',
      data: { activityId }
    }).then(async (actRes) => {
      const activity = actRes.result?.activity
      if (!activity || !activity.hostId || activity.hostId === openid) return

      // 获取取消者昵称
      let cancellerName = '匹克球友'
      try {
        const userRes = await db.collection('users').where({ openid }).get()
        cancellerName = userRes.data?.[0]?.nickName || userRes.data?.[0]?.nickname || '匹克球友'
      } catch (_) { }

      const activityTimeStr = [activity.startDate, activity.startTime].filter(Boolean).join(' ')

      await cloud.callFunction({
        name: 'sendSubscribeMsg',
        data: {
          touser: activity.hostId,
          templateId: TMPL_CANCEL_NOTIFY,
          page: `pages/activity-detail/index?id=${activityId}`,
          data: {
            thing1: { value: (activity.title || '').slice(0, 20) },
            time2: { value: activityTimeStr.slice(0, 20) },
            thing3: { value: cancellerName.slice(0, 20) },
            thing4: { value: '点击查看最新报名情况' }
          }
        }
      })
    }).catch(e => console.error('[leaveActivity] 推送失败:', e))

    return { success: true }
  } catch (e) {
    console.error('leaveActivity', e)
    return { success: false, message: '退出失败' }
  }
}
