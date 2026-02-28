const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { keyword, latitude, longitude } = event || {}

  try {
    let query = db.collection('activities')
    if (keyword && String(keyword).trim()) {
      query = query.where({
        title: db.RegExp({ regexp: String(keyword).trim(), options: 'i' })
      })
    }
    const { data } = await query.orderBy('createdAt', 'desc').limit(100).get()
    const list = Array.isArray(data) ? data : []

    const withCount = []
    for (const a of list) {
      let currentCount = 0
      let participants = []
      let hostAvatar = null
      let hostName = null
      let hostAvatarUrl = null
      let participantsWithUrl = []

      try {
        // 先统计总数
        const countRes = await db.collection('registrations').where({ activityId: a._id, status: 'joined' }).count()
        currentCount = countRes.total || 0
        
        // 获取已报名用户信息（最多17个，与发起人合计最多18个头像展示）
        if (currentCount > 0) {
          const regRes = await db.collection('registrations')
            .where({ activityId: a._id, status: 'joined' })
            .orderBy('joinedAt', 'asc')
            .limit(17)
            .get()
          
          // 获取已报名用户的头像和昵称
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
              
              // 按报名顺序组装participants
              participants = regRes.data.map(r => userMap[r.userId] || { userId: r.userId })
            }
          }
        }
        
        // 获取创建者信息（hostAvatar 和 hostName）
        if (a.hostId) {
          try {
            const hostRes = await db.collection('users').where({ openid: a.hostId }).get()
            if (hostRes.data && hostRes.data.length > 0) {
              const host = hostRes.data[0]
              hostAvatar = host.avatarUrl || null
              hostName = host.nickName || null
            }
          } catch (e) {
            console.error('获取创建者信息失败:', e)
          }
        }

        // 统一获取所有头像的临时 URL（含报名人），非 http 的均视为云存储 fileID 并换取临时链接
        const isFileID = (url) => typeof url === 'string' && url.trim() !== '' && !url.startsWith('http://') && !url.startsWith('https://')
        const avatarFileIDs = []
        if (hostAvatar && isFileID(hostAvatar)) {
          avatarFileIDs.push(hostAvatar)
        }
        participants.forEach(p => {
          if (p && p.avatarUrl && isFileID(p.avatarUrl)) {
            avatarFileIDs.push(p.avatarUrl)
          }
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
            console.error('获取头像临时链接失败:', e)
          }
        }
        // 发起人头像：优先用临时链接，若批量失败则单独再试一次
        if (hostAvatar && isFileID(hostAvatar)) {
          hostAvatarUrl = fileIDToUrl[hostAvatar] || hostAvatar
          if (!fileIDToUrl[hostAvatar]) {
            try {
              const hostRes = await cloud.getTempFileURL({ fileList: [hostAvatar] })
              if (hostRes.fileList && hostRes.fileList[0] && hostRes.fileList[0].tempFileURL) {
                hostAvatarUrl = hostRes.fileList[0].tempFileURL
              }
            } catch (e2) {
              console.error('获取发起人头像临时链接失败:', e2)
            }
          }
        } else {
          hostAvatarUrl = hostAvatar
        }
        // 报名人头像：与发起人相同，非 http 的均换临时链接，缺失时单独拉取
        participantsWithUrl = await Promise.all(participants.map(async (p) => {
          const raw = p.avatarUrl || ''
          let avatarUrl = (raw && fileIDToUrl[raw]) ? fileIDToUrl[raw] : (raw && !isFileID(raw) ? raw : '')
          if (raw && isFileID(raw) && !fileIDToUrl[raw]) {
            try {
              const oneRes = await cloud.getTempFileURL({ fileList: [raw] })
              if (oneRes.fileList && oneRes.fileList[0] && oneRes.fileList[0].tempFileURL) {
                avatarUrl = oneRes.fileList[0].tempFileURL
              } else {
                avatarUrl = raw
              }
            } catch (e2) {
              console.error('获取报名人头像临时链接失败:', e2)
              avatarUrl = raw
            }
          }
          return { userId: p.userId, nickName: p.nickName, avatarUrl: avatarUrl || '' }
        }))
      } catch (e) {
        console.error('获取报名信息失败:', e)
      }
      withCount.push({
        ...a,
        currentCount,
        participants: participantsWithUrl.length > 0 ? participantsWithUrl : participants,
        hostAvatar: hostAvatarUrl != null ? hostAvatarUrl : hostAvatar,
        hostName
      })
    }
    return { list: withCount }
  } catch (e) {
    console.error('getActivities', e)
    return { list: [] }
  }
}
