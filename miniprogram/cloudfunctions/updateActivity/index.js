const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// NOTE: 订阅消息模板 ID
const TMPL_CLOSE_REG = 'b8AL_GV0DSTErOB8Nf9gEIkToN74gNAo_TYH56y9pEE' // 报名截止通知
const TMPL_CANCEL_ACT = 'aiot1Xyg2C0SOU8vDww1hCop-VGNgHgHM5WP1yR5D30'  // 活动取消通知

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) return { success: false, message: '未登录' }

  const {
    activityId,
    title,
    startDate,
    startTime,
    endTime,
    address,
    venueName,
    latitude,
    longitude,
    maxParticipants,
    fee,
    contactInfo,
    contactType,
    duprLevel,
    activityType,
    description,
    images
  } = event || {}

  if (!activityId) return { success: false, message: '缺少活动ID' }

  try {
    // 检查活动是否存在且是当前用户发起的
    const actRes = await db.collection('activities').doc(activityId).get()
    if (!actRes.data || !actRes.data._id) {
      return { success: false, message: '活动不存在' }
    }
    const activity = actRes.data

    // 验证是否是活动发起人
    if (activity.hostId !== openid) {
      return { success: false, message: '无权编辑此活动' }
    }

    // 构建更新数据
    const updateData = {
      updatedAt: Date.now()
    }
    if (title != null) updateData.title = String(title).trim()
    if (startDate != null) updateData.startDate = String(startDate)
    if (startTime != null) updateData.startTime = String(startTime)
    if (endTime != null) updateData.endTime = String(endTime).trim()
    if (address != null) updateData.address = String(address).trim()
    if (venueName != null) updateData.venueName = String(venueName).trim() || undefined
    if (latitude != null) updateData.latitude = Number(latitude)
    if (longitude != null) updateData.longitude = Number(longitude)
    if (maxParticipants != null) updateData.maxParticipants = Math.min(20, Math.max(2, Number(maxParticipants) || 8))
    if (fee != null) updateData.fee = Number(fee) || 0
    // NOTE: 手机号/微信号最多 50 字；微信二维码为图片 URL，最多 500 字
    if (contactInfo != null) updateData.contactInfo = contactType === 'wechat'
      ? (String(contactInfo).trim().slice(0, 500) || undefined)
      : (String(contactInfo).trim().slice(0, 50) || undefined)
    if (duprLevel != null) updateData.duprLevel = String(duprLevel).trim() || undefined
    if (activityType != null) updateData.activityType = String(activityType).trim() || '不限'
    if (description != null) updateData.description = String(description).trim() || undefined
    if (contactType != null) updateData.contactType = contactType
    if (images != null) updateData.images = Array.isArray(images) && images.length > 0 ? images : undefined
    // NOTE: status 仅允许合法值，防止客户端传入非法状态
    let newStatus = null
    if (event.status != null) {
      const validStatuses = ['pending', 'closed', 'cancelled']
      if (validStatuses.includes(event.status)) {
        updateData.status = event.status
        updateData.statusChangedAt = Date.now()
        newStatus = event.status
      }
    }

    // NOTE: 内容安全检测 —— 编辑活动同样需要检测
    try {
      const textToCheck = [updateData.title, updateData.address, updateData.description, updateData.contactInfo, updateData.venueName]
        .filter(v => v && String(v).trim())
        .map(v => String(v).trim())
        .join(' ')

      if (textToCheck) {
        const checkResult = await cloud.openapi.security.msgSecCheck({
          openid: openid,
          scene: 2,
          version: 2,
          content: textToCheck
        })
        console.log('[updateActivity] 内容检测结果:', JSON.stringify(checkResult))

        if (checkResult.result && checkResult.result.suggest !== 'pass') {
          console.warn('[updateActivity] 内容违规，已拦截:', checkResult.result)
          return {
            success: false,
            contentRisk: true,
            message: '内容包含违规信息，请修改后重试'
          }
        }
      }
    } catch (checkErr) {
      // HACK: 检测接口异常时放行，避免阻塞正常业务
      console.error('[updateActivity] 内容检测异常（已放行）:', checkErr)
    }

    // 更新活动
    await db.collection('activities').doc(activityId).update({ data: updateData })

    // NOTE: 状态变更为「截止报名」或「取消」时，批量推送订阅消息给所有已报名参与者
    if (newStatus === 'closed' || newStatus === 'cancelled') {
      const actTitle = (updateData.title || activity.title || '').slice(0, 20)
      const actDateStr = (activity.startDate || '').slice(0, 20)
      const actTimeStr = [activity.startDate, activity.startTime].filter(Boolean).join(' ').slice(0, 20)
      const actVenue = (activity.venueName || activity.address || '—').slice(0, 20)

      // 格式化当前截止时间
      const now = new Date()
      const nowTimeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      // 查询所有已报名者
      db.collection('registrations').where({ activityId, status: 'joined' }).get()
        .then(async regRes => {
          const participants = (regRes.data || []).filter(r => r.userId !== openid)

          // 活动取消时需要发起人昵称（name4 字段）
          let hostName = '发起人'
          if (newStatus === 'cancelled') {
            try {
              const hostRes = await db.collection('users').where({ openid }).get()
              hostName = (hostRes.data?.[0]?.nickName || hostRes.data?.[0]?.nickname || '发起人').slice(0, 10)
            } catch (_) { }
          }

          const sends = participants.map(r => {
            // NOTE: 两个模板字段不同，分别构造
            const msgData = newStatus === 'cancelled'
              ? {
                // 活动取消通知：thing1=活动名称, date2=活动时间, thing3=活动地点, name4=取消人, thing11=温馨提示
                thing1: { value: actTitle },
                date2: { value: actDateStr },
                thing3: { value: actVenue },
                name4: { value: hostName },
                thing11: { value: '活动已取消，期待下次见' }
              }
              : {
                // 报名截止通知：thing1=报名标题, time2=活动时间, thing3=活动地址, thing5=报名状态, time8=截止时间
                thing1: { value: actTitle },
                time2: { value: actTimeStr },
                thing3: { value: actVenue },
                thing5: { value: '报名通道已关闭' },
                time8: { value: nowTimeStr }
              }

            return cloud.callFunction({
              name: 'sendSubscribeMsg',
              data: {
                touser: r.userId,
                templateId: newStatus === 'cancelled' ? TMPL_CANCEL_ACT : TMPL_CLOSE_REG,
                page: `pages/index/index`,
                data: msgData
              }
            }).catch(e => console.error('[updateActivity] 推送失败:', r.userId, e))
          })

          return Promise.all(sends)
        })
        .catch(e => console.error('[updateActivity] 查询报名者失败:', e))
    }

    return { success: true, message: '更新成功' }
  } catch (e) {
    console.error('updateActivity', e)
    return { success: false, message: '更新失败' }
  }
}

