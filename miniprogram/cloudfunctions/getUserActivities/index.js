const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const isFileID = (url) => typeof url === 'string' && url.trim() !== '' && !url.startsWith('http://') && !url.startsWith('https://')

// 为活动列表中的每项附加 currentCount、participants（含头像临时 URL）、host 信息，与 getActivities 一致
async function attachActivityDetails(activities) {
  if (!Array.isArray(activities) || activities.length === 0) return activities
  const result = []
  for (const a of activities) {
    let currentCount = 0
    let participants = []
    let hostAvatar = null
    let hostName = null
    let hostAvatarUrl = null
    let participantsWithUrl = []

    try {
      const countRes = await db.collection('registrations').where({ activityId: a._id, status: 'joined' }).count()
      currentCount = countRes.total || 0

      if (currentCount > 0) {
        const regRes = await db.collection('registrations')
          .where({ activityId: a._id, status: 'joined' })
          .orderBy('joinedAt', 'asc')
          .limit(17)
          .get()

        if (regRes.data && regRes.data.length > 0) {
          const openids = regRes.data.map(r => r.userId).filter(Boolean)
          if (openids.length > 0) {
            const usersRes = await db.collection('users')
              .where({ openid: db.command.in(openids) })
              .get()

            const userMap = {}
            if (usersRes.data) {
              usersRes.data.forEach(u => {
                userMap[u.openid] = { userId: u.openid, avatarUrl: u.avatarUrl, nickName: u.nickName }
              })
            }
            participants = regRes.data.map(r => userMap[r.userId] || { userId: r.userId })
          }
        }
      }

      if (a.hostId) {
        try {
          const hostRes = await db.collection('users').where({ openid: a.hostId }).get()
          if (hostRes.data && hostRes.data.length > 0) {
            const host = hostRes.data[0]
            hostAvatar = host.avatarUrl || null
            hostName = host.nickName || null
          }
        } catch (e) {
          console.error('getUserActivities host', a._id, e)
        }
      }

      // 与 getActivities 一致：云端将 cloud:// 头像换为临时 https，避免前端闪烁、报名用户头像不显示
      const avatarFileIDs = []
      if (hostAvatar && isFileID(hostAvatar)) avatarFileIDs.push(hostAvatar)
      participants.forEach(p => {
        if (p && p.avatarUrl && isFileID(p.avatarUrl)) avatarFileIDs.push(p.avatarUrl)
      })
      const fileIDToUrl = {}
      if (avatarFileIDs.length > 0) {
        try {
          const tempRes = await cloud.getTempFileURL({ fileList: avatarFileIDs })
          if (tempRes.fileList && Array.isArray(tempRes.fileList)) {
            tempRes.fileList.forEach(item => {
              if (item.tempFileURL) fileIDToUrl[item.fileID] = item.tempFileURL
            })
          }
        } catch (e) {
          console.error('getUserActivities 获取头像临时链接失败', a._id, e)
        }
      }
      if (hostAvatar && isFileID(hostAvatar)) {
        hostAvatarUrl = fileIDToUrl[hostAvatar] || hostAvatar
      } else {
        hostAvatarUrl = hostAvatar
      }
      participantsWithUrl = participants.map(p => {
        const raw = p.avatarUrl || ''
        const avatarUrl = (raw && fileIDToUrl[raw]) ? fileIDToUrl[raw] : (raw && !isFileID(raw) ? raw : raw || '')
        return { userId: p.userId, nickName: p.nickName, avatarUrl: avatarUrl || '' }
      })
    } catch (e) {
      console.error('getUserActivities details', a._id, e)
    }

    result.push({
      ...a,
      currentCount,
      participants: participantsWithUrl.length > 0 ? participantsWithUrl : participants,
      hostAvatar: hostAvatarUrl != null ? hostAvatarUrl : hostAvatar,
      hostName
    })
  }
  return result
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) return { created: [], joined: [] }

  try {
    const [createdRes, regRes] = await Promise.all([
      db.collection('activities').where({ hostId: openid }).orderBy('createdAt', 'desc').limit(50).get(),
      db.collection('registrations').where({ userId: openid, status: 'joined' }).orderBy('joinedAt', 'desc').limit(50).get()
    ])
    const createdRaw = createdRes.data || []
    const regs = regRes.data || []
    const activityIds = [...new Set(regs.map(r => r.activityId))]

    let joined = []
    if (activityIds.length > 0) {
      const joinedRes = await db.collection('activities').where({
        _id: db.command.in(activityIds)
      }).get()
      const map = (joinedRes.data || []).reduce((acc, a) => { acc[a._id] = a; return acc }, {})
      joined = regs.map(r => map[r.activityId]).filter(Boolean)
    }

    const created = await attachActivityDetails(createdRaw)
    const joinedWithDetails = await attachActivityDetails(joined)
    return { created, joined: joinedWithDetails }
  } catch (e) {
    console.error('getUserActivities', e)
    return { created: [], joined: [] }
  }
}
