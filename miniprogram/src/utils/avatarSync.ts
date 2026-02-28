/**
 * 头像同步：个人页修改头像后，活动列表/详情中的当前用户头像同步更新
 * 与个人页、广场页、发起活动页共用同一套「当前用户头像」来源（profile 缓存）
 */
import type { Activity } from '../types'
import { getTempFileURLs } from '../services/cloud'

const isCloudId = (id: string) => typeof id === 'string' && id.startsWith('cloud://')

const PROFILE_CACHE_KEY = 'profile_user_cache'

export interface CurrentUserCache {
  openid: string
  avatarUrl: string
}

/** 从本地 profile 缓存读取当前用户 openid 与头像（个人页登录/更新头像时写入） */
export function getCurrentUserFromCache(): CurrentUserCache | null {
  try {
    const raw = uni.getStorageSync(PROFILE_CACHE_KEY)
    if (!raw || typeof raw !== 'object') return null
    const openid = (raw as any).openid
    const avatarUrl = (raw as any).avatarUrl
    if (openid && avatarUrl) return { openid, avatarUrl }
  } catch (_) {}
  return null
}

/**
 * 将当前用户的最新头像合并进活动数据（发起人或报名人之一为当前用户时，用缓存头像覆盖）
 * 仅当缓存头像为 http(s) 时才覆盖，避免用 cloud:// 覆盖已解析的 https 导致闪烁
 */
export function mergeCurrentUserAvatar<T extends Activity>(
  activity: T,
  current: CurrentUserCache | null
): T {
  if (!current || !activity) return activity
  const cacheIsHttp = current.avatarUrl && (current.avatarUrl.startsWith('http://') || current.avatarUrl.startsWith('https://'))
  if (!cacheIsHttp) return activity
  const out = { ...activity } as T
  if (activity.hostId === current.openid && current.avatarUrl) {
    out.hostAvatar = current.avatarUrl
  }
  if (Array.isArray(activity.participants)) {
    out.participants = activity.participants.map((p) => {
      if (p.userId === current.openid && current.avatarUrl) {
        return { ...p, avatarUrl: current.avatarUrl }
      }
      return { ...p }
    })
  }
  return out
}

/**
 * 在设置列表前预解析活动中的 cloud:// 头像为临时 https，避免「重新登录打开」时头像先出再闪一次
 * 用于个人页、我参加的/我发起的列表首次加载
 */
export async function resolveActivityAvatarUrls<T extends Activity>(activities: T[]): Promise<T[]> {
  if (!activities?.length) return activities
  const fileIDs: string[] = []
  for (const act of activities) {
    if (act.hostAvatar && isCloudId(act.hostAvatar)) fileIDs.push(act.hostAvatar)
    for (const p of act.participants || []) {
      if (p.avatarUrl && isCloudId(p.avatarUrl)) fileIDs.push(p.avatarUrl)
    }
  }
  const uniq = [...new Set(fileIDs)]
  if (uniq.length === 0) return activities
  let urlMap: Record<string, string> = {}
  try {
    urlMap = await getTempFileURLs(uniq)
  } catch (e) {
    return activities
  }
  return activities.map((act) => {
    const out = { ...act } as T
    if (out.hostAvatar && isCloudId(out.hostAvatar) && urlMap[out.hostAvatar]) {
      out.hostAvatar = urlMap[out.hostAvatar]
    }
    if (Array.isArray(out.participants)) {
      out.participants = out.participants.map((p) => {
        if (p.avatarUrl && isCloudId(p.avatarUrl) && urlMap[p.avatarUrl]) {
          return { ...p, avatarUrl: urlMap[p.avatarUrl] }
        }
        return { ...p }
      })
    }
    return out
  })
}
