// 云函数：bindPhone
// 功能：接收前端 getPhoneNumber 返回的 code，调用微信 API 换取手机号，写入用户记录
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { code } = event

    if (!code) {
        return { success: false, message: '缺少 code 参数' }
    }

    try {
        // NOTE: 调用微信 getPhoneNumber API，用 code 换取手机号明文
        const phoneRes = await cloud.openapi.phonenumber.getPhoneNumber({ code })
        const phoneNumber = phoneRes?.phoneInfo?.phoneNumber

        if (!phoneNumber) {
            return { success: false, message: '获取手机号失败，请重试' }
        }

        // 查找或创建用户记录
        const usersCol = db.collection('users')
        const existing = await usersCol.where({ openid }).limit(1).get()

        if (existing.data.length > 0) {
            // 已有记录，更新手机号
            await usersCol.doc(existing.data[0]._id).update({
                data: {
                    phone: phoneNumber,
                    updatedAt: db.serverDate()
                }
            })
        } else {
            // 新用户，创建记录
            await usersCol.add({
                data: {
                    openid,
                    phone: phoneNumber,
                    nickName: '',
                    avatarUrl: '',
                    gender: 0,
                    duprLevel: '',
                    region: '',
                    signature: '',
                    createdAt: db.serverDate()
                }
            })
        }

        return {
            success: true,
            phone: phoneNumber,
            openid
        }
    } catch (err) {
        console.error('bindPhone 云函数错误:', err)
        return { success: false, message: '服务端错误，请重试' }
    }
}
