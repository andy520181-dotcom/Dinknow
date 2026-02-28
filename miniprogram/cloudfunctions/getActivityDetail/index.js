const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { activityId } = event || {}
  if (!activityId) return { activity: null }

  try {
    // 获取活动信息
    const actRes = await db.collection('activities').doc(activityId).get()
    if (!actRes.data || !actRes.data._id) {
      return { activity: null }
    }
    const activity = actRes.data

    // 统计报名人数
    let currentCount = 0
    let participants = []
    try {
      const countRes = await db.collection('registrations').where({ activityId, status: 'joined' }).count()
      currentCount = countRes.total || 0

      // 获取已报名用户信息（最多17个，与发起人合计最多18个头像展示，与广场页一致）
      if (currentCount > 0) {
        const regRes = await db.collection('registrations')
          .where({ activityId, status: 'joined' })
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
                userMap[u.openid] = {
                  userId: u.openid,
                  avatarUrl: u.avatarUrl,
                  nickName: u.nickName,
                  gender: u.gender,
                  duprLevel: u.duprLevel,
                  region: u.region,
                  signature: u.signature
                }
              })
            }

            // 按报名顺序组装participants（含公开资料，供详情页点击头像弹层展示）
            participants = regRes.data.map(r => userMap[r.userId] || { userId: r.userId })
          }
        }
      }
    } catch (e) {
      console.error('获取报名信息失败:', e)
    }

    // 从 users 表拉取发起人最新头像与昵称（活动文档中的 hostAvatar/hostName 为创建时快照）
    let hostAvatar = activity.hostAvatar || null
    let hostName = activity.hostName || null
    let hostGender = null
    let hostDuprLevel = null
    let hostRegion = null
    let hostSignature = null
    if (activity.hostId) {
      try {
        const hostRes = await db.collection('users').where({ openid: activity.hostId }).get()
        if (hostRes.data && hostRes.data.length > 0) {
          const host = hostRes.data[0]
          hostAvatar = host.avatarUrl || hostAvatar
          hostName = host.nickName || hostName
          hostGender = host.gender
          hostDuprLevel = host.duprLevel
          hostRegion = host.region
          hostSignature = host.signature
        }
      } catch (e) {
        console.error('获取发起人信息失败:', e)
      }
    }

    // 统一换取头像临时 URL，使详情页与资料弹层都能显示发起人及报名人头像
    const isFileID = (url) => typeof url === 'string' && url.trim() !== '' && !url.startsWith('http://') && !url.startsWith('https://')
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
        console.error('getActivityDetail 获取头像临时链接失败:', e)
      }
    }
    let hostAvatarUrl = hostAvatar
    if (hostAvatar && isFileID(hostAvatar)) {
      hostAvatarUrl = fileIDToUrl[hostAvatar] || hostAvatar
      if (!fileIDToUrl[hostAvatar]) {
        try {
          const one = await cloud.getTempFileURL({ fileList: [hostAvatar] })
          if (one.fileList && one.fileList[0] && one.fileList[0].tempFileURL) hostAvatarUrl = one.fileList[0].tempFileURL
        } catch (e2) {}
      }
    }
    const participantsWithUrl = await Promise.all(participants.map(async (p) => {
      const raw = p.avatarUrl || ''
      let avatarUrl = (raw && fileIDToUrl[raw]) ? fileIDToUrl[raw] : (raw && !isFileID(raw) ? raw : '')
      if (raw && isFileID(raw) && !fileIDToUrl[raw]) {
        try {
          const one = await cloud.getTempFileURL({ fileList: [raw] })
          if (one.fileList && one.fileList[0] && one.fileList[0].tempFileURL) avatarUrl = one.fileList[0].tempFileURL
          else avatarUrl = raw
        } catch (e2) {
          avatarUrl = raw
        }
      }
      return {
        userId: p.userId,
        nickName: p.nickName,
        avatarUrl: avatarUrl || '',
        gender: p.gender,
        duprLevel: p.duprLevel,
        region: p.region,
        signature: p.signature
      }
    }))

    return {
      activity: {
        ...activity,
        currentCount,
        participants: participantsWithUrl,
        hostAvatar: hostAvatarUrl,
        hostName,
        hostGender,
        hostDuprLevel,
        hostRegion,
        hostSignature
      }
    }
  } catch (e) {
    console.error('getActivityDetail', e)
    return { activity: null }
  }
}
