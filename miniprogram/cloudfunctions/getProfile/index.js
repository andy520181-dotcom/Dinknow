const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const openid = event?.openid || cloud.getWXContext().OPENID
  if (!openid) return { profile: null }

  try {
    const res = await db.collection('users').where({ openid }).get()
    const raw = res.data && res.data[0] ? res.data[0] : null
    if (!raw) return { profile: null }
    // 显式返回完整资料（含地区、球风），供活动详情页点击头像弹层展示
    const profile = {
      openid: raw.openid,
      nickName: raw.nickName,
      avatarUrl: raw.avatarUrl,
      gender: raw.gender,
      duprLevel: raw.duprLevel,
      region: raw.region,
      signature: raw.signature,
      age: raw.age,
      createdAt: raw.createdAt
    }
    return { profile }
  } catch (e) {
    console.error('getProfile', e)
    return { profile: null }
  }
}
