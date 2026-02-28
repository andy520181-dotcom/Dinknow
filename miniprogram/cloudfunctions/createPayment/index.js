const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) return { success: false, message: '未登录' }

  const { activityId, amount, title } = event || {}
  if (!activityId || !amount) {
    return { success: false, message: '缺少必要参数' }
  }

  // 检查用户是否已登录（users 表中有记录且有昵称）
  try {
    const userRes = await db.collection('users').where({ openid }).get()
    const user = userRes.data && userRes.data[0]
    if (!user || !user.nickName) {
      return { success: false, message: '请先在个人中心完成登录' }
    }
  } catch (e) {
    console.error('createPayment 检查用户登录状态失败:', e)
    return { success: false, message: '登录检查失败，请重试' }
  }

  // 检查活动是否存在
  try {
    const actRes = await db.collection('activities').doc(activityId).get()
    if (!actRes.data || !actRes.data._id) {
      return { success: false, message: '活动不存在' }
    }
    const activity = actRes.data

    // 检查是否已报名
    const existRes = await db.collection('registrations').where({
      activityId,
      userId: openid
    }).get()
    if (existRes.data && existRes.data.length > 0) {
      return { success: false, message: '已报名过该活动' }
    }

    // 检查人数是否已满
    const countRes = await db.collection('registrations').where({ activityId, status: 'joined' }).count()
    if (countRes.total >= (activity.maxParticipants || 20)) {
      return { success: false, message: '活动人数已满' }
    }

    // 创建支付订单
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const orderData = {
      orderId,
      activityId,
      userId: openid,
      amount: Number(amount),
      title: title || activity.title,
      status: 'pending', // pending, paid, cancelled
      createdAt: Date.now()
    }

    await db.collection('orders').add({ data: orderData })

    // 调用微信支付统一下单接口
    // 注意：这里需要配置微信支付商户号和密钥
    // 实际项目中应该调用微信支付API生成支付参数
    // 这里返回模拟的支付参数（实际使用时需要替换为真实的支付参数生成逻辑）
    const paymentParams = {
      timeStamp: String(Math.floor(Date.now() / 1000)),
      nonceStr: Math.random().toString(36).substr(2, 15),
      package: `prepay_id=${orderId}`,
      signType: 'RSA',
      paySign: 'mock_sign' // 实际应该是通过微信支付API生成的签名
    }

    return {
      success: true,
      orderId,
      paymentParams
    }
  } catch (e) {
    console.error('createPayment 失败:', e)
    return { success: false, message: '创建支付订单失败' }
  }
}
