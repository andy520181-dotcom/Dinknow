const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  console.log('[createActivity] 收到请求:', JSON.stringify(event))
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  console.log('[createActivity] openid:', openid)
  if (!openid) {
    console.error('[createActivity] 未登录，openid 为空')
    return { success: false, message: '未登录，请先登录' }
  }

  const {
    title,
    startDate,
    startTime,
    endTime,
    address,
    venueName,
    latitude,
    longitude,
    maxParticipants = 8,
    fee = 0,
    contactInfo,
    contactType,
    duprLevel,
    activityType = '不限',
    description,
    images
  } = event || {}

  console.log('[createActivity] 解析参数:', { title, startDate, startTime, address, latitude, longitude, maxParticipants, fee, duprLevel })

  if (!title || !startDate || !startTime || !address || !contactInfo || !String(contactInfo).trim()) {
    const missing = []
    if (!title) missing.push('活动主题')
    if (!startDate) missing.push('日期')
    if (!startTime) missing.push('时间')
    if (!address) missing.push('地址')
    if (!contactInfo || !String(contactInfo).trim()) missing.push('联系方式')
    console.error('[createActivity] 必填项缺失:', missing)
    return { success: false, message: `请填写：${missing.join('、')}` }
  }

  // 检查用户是否已在个人中心完成登录（users 表中有记录且有昵称）
  let hostName = '匹克球友'
  let hostAvatar = ''
  try {
    const userRes = await db.collection('users').where({ openid }).get()
    const user = userRes.data && userRes.data[0]
    if (!user || !user.nickName) {
      return { success: false, message: '请先登录后再发布活动' }
    }
    hostName = user.nickName || hostName
    hostAvatar = user.avatarUrl || ''
  } catch (e) {
    console.error('createActivity 检查用户登录状态失败:', e)
    return { success: false, message: '登录检查失败，请重试' }
  }

  const now = Date.now()

  const startTimeStr = String(startTime)
  const endTimeStr = (endTime != null && String(endTime).trim()) ? String(endTime).trim() : startTimeStr
  const doc = {
    title: String(title).trim(),
    startDate: String(startDate),
    startTime: startTimeStr,
    endTime: endTimeStr,
    address: String(address).trim(),
    venueName: venueName != null && String(venueName).trim() ? String(venueName).trim() : undefined,
    latitude: latitude != null ? Number(latitude) : undefined,
    longitude: longitude != null ? Number(longitude) : undefined,
    maxParticipants: Math.min(20, Math.max(2, Number(maxParticipants) || 8)),
    fee: Number(fee) || 0,
    contactInfo: String(contactInfo).trim().slice(0, 50),
    duprLevel: duprLevel ? String(duprLevel).trim() : undefined,
    activityType: activityType != null ? String(activityType).trim() : '不限',
    description: description ? String(description).trim() : undefined,
    contactType: contactType || 'phone',
    images: Array.isArray(images) && images.length > 0 ? images : undefined,
    hostId: openid,
    hostName,
    hostAvatar,
    status: 'pending',
    createdAt: now
  }

  console.log('[createActivity] 准备写入数据库:', JSON.stringify(doc))
  try {
    const { _id } = await db.collection('activities').add({ data: doc })
    console.log('[createActivity] 写入成功，_id:', _id)
    return { success: true, _id }
  } catch (e) {
    console.error('[createActivity] 数据库写入失败:', e)
    const errMsg = e?.message || e?.errMsg || String(e)
    const errCode = e?.errCode || e?.code
    let msg = '发布失败'

    // 根据错误码和错误信息给出具体提示
    if (errCode === -502001 || errCode === -502005) {
      // -502001: 数据库请求失败
      // -502005: 数据库集合不存在
      if (errCode === -502005 || errMsg?.includes('not exist') || errMsg?.includes('不存在') || errMsg?.includes('not found')) {
        msg = '数据库集合不存在：请在云开发控制台创建 activities 集合，并确保云函数环境配置正确'
      } else if (errMsg?.includes('permission') || errMsg?.includes('权限') || errMsg?.includes('Permission')) {
        msg = '数据库权限不足：请将 activities 集合的写入权限设置为"所有用户可写"或"auth != null"'
      } else if (errMsg?.includes('collection') || errMsg?.includes('集合')) {
        msg = '数据库集合不存在：请在云开发控制台创建 activities 集合'
      } else {
        msg = `数据库错误 [${errCode}]：${errMsg || '请检查数据库集合和权限设置'}`
      }
    } else if (errCode === -504011) {
      msg = '云函数执行错误：请检查云函数是否已部署，或查看云函数日志'
    } else if (errCode) {
      msg = `错误 [${errCode}]：${errMsg || '未知错误'}`
    } else if (errMsg) {
      msg = errMsg
    }

    console.error('[createActivity] 返回错误:', msg, '原始错误:', e)
    return { success: false, message: msg, errCode, errMsg: errMsg || String(e) }
  }
}
