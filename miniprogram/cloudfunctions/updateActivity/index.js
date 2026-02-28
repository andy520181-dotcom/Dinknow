const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

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
    duprLevel,
    activityType,
    description
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
    if (contactInfo != null) updateData.contactInfo = String(contactInfo).trim().slice(0, 50) || undefined
    if (duprLevel != null) updateData.duprLevel = String(duprLevel).trim() || undefined
    if (activityType != null) updateData.activityType = String(activityType).trim() || '不限'
    if (description != null) updateData.description = String(description).trim() || undefined

    // 更新活动
    await db.collection('activities').doc(activityId).update({ data: updateData })

    return { success: true, message: '更新成功' }
  } catch (e) {
    console.error('updateActivity', e)
    return { success: false, message: '更新失败' }
  }
}
