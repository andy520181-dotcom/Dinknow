const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

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

    // 2. 删除报名记录（或更新状态为已退出）
    const registrationId = existRes.data[0]._id
    await db.collection('registrations').doc(registrationId).update({
      data: {
        status: 'left',
        leftAt: Date.now()
      }
    })

    return { success: true }
  } catch (e) {
    console.error('leaveActivity', e)
    return { success: false, message: '退出失败' }
  }
}
