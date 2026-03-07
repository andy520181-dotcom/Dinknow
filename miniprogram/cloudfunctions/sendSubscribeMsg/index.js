const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 统一的订阅消息发送云函数
 * 由 joinActivity / leaveActivity / updateActivity 内部调用
 *
 * event 参数：
 *   touser     {string}  目标用户 openid
 *   templateId {string}  订阅消息模板 ID
 *   page       {string}  点击消息后跳转的页面路径（可选）
 *   data       {object}  模板变量，格式：{ key: { value: '...' } }
 */
exports.main = async (event) => {
    const { touser, templateId, page, data } = event || {}

    if (!touser || !templateId || !data) {
        console.error('[sendSubscribeMsg] 参数缺失:', event)
        return { success: false, message: '参数缺失' }
    }

    try {
        const result = await cloud.openapi.subscribeMessage.send({
            touser,
            templateId,
            page: page || 'pages/index/index',
            data,
            // NOTE: miniprogramState 不传时默认 formal（正式版），开发阶段可改为 developer
            // miniprogramState: 'developer',
        })
        console.log('[sendSubscribeMsg] 发送成功:', touser, templateId, result)
        return { success: true }
    } catch (e) {
        // NOTE: 订阅消息发送失败不影响主业务，仅记录日志
        console.error('[sendSubscribeMsg] 发送失败:', e.errCode, e.errMsg, { touser, templateId })
        return { success: false, errCode: e.errCode, message: e.errMsg }
    }
}
