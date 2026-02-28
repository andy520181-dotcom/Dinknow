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
    // 检查活动是否存在且是当前用户发起的
    const actRes = await db.collection('activities').doc(activityId).get()
    if (!actRes.data || !actRes.data._id) {
      return { success: false, message: '活动不存在' }
    }
    const activity = actRes.data

    // 验证是否是活动发起人
    if (activity.hostId !== openid) {
      return { success: false, message: '无权删除此活动' }
    }

    // 检查是否有已报名用户（可选：如果有报名用户，可以提示或阻止删除）
    const regRes = await db.collection('registrations').where({ activityId, status: 'joined' }).count()
    if (regRes.total > 0) {
      // 可以选择阻止删除，或者允许删除但提示
      // 这里选择允许删除，但会同时删除所有报名记录
      await db.collection('registrations').where({ activityId }).remove()
    }

    // 删除活动
    await db.collection('activities').doc(activityId).remove()

    return { success: true, message: '删除成功' }
  } catch (e) {
    console.error('deleteActivity', e)
    return { success: false, message: '删除失败' }
  }
}
