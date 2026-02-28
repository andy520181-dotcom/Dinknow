import { callCloudFunction } from './cloud'
import type { User } from '../types'

/**
 * 用户登录（获取 openid）
 */
export async function login() {
  const result = await callCloudFunction('login')
  return result as { openid: string }
}

/**
 * 检查用户是否已登录（已获取 openid 且已在个人中心完成头像/昵称登录）
 * 用于报名、发布活动等需要登录才能执行的操作
 * 使用云函数当前上下文 OPENID 查 profile，避免客户端传参在真机上不一致
 */
export async function checkLogin(): Promise<{ ok: boolean; openid?: string }> {
  try {
    const loginRes = await login()
    if (!loginRes?.openid) {
      console.log('[checkLogin] 未获取到 openid')
      return { ok: false }
    }
    // 不传 openid，让云函数用 getWXContext().OPENID 查询，与真机环境一致
    const profile = await getProfile()
    const hasValidNickName =
      profile &&
      typeof profile.nickName === 'string' &&
      profile.nickName.trim().length > 0
    const ok = !!hasValidNickName
    console.log('[checkLogin] 检查结果:', {
      openid: loginRes.openid,
      hasProfile: !!profile,
      hasNickName: hasValidNickName,
      ok,
    })
    if (!ok) {
      console.log('[checkLogin] 用户未登录：', profile ? '缺少有效昵称' : '用户记录不存在')
    } else {
      console.log('[checkLogin] 已登录：云端已有该 openid 的 profile 且昵称有效（可能曾在个人中心完成过头像/昵称登录）')
    }
    return { ok, openid: loginRes.openid }
  } catch (error) {
    console.error('[checkLogin] 检查失败:', error)
    return { ok: false }
  }
}

/**
 * 获取当前用户信息（云函数使用 getWXContext().OPENID 查询，不传 openid 更可靠）
 */
export async function getProfile(openid?: string) {
  const data = openid ? { openid } : {}
  const result = await callCloudFunction('getProfile', data)
  return (result?.profile || null) as User | null
}

/**
 * 更新用户信息
 */
export async function updateProfile(data: {
  nickName: string
  avatarUrl?: string
  gender: 0 | 1 | 2
  duprLevel: string
  age?: number
  signature?: string
  region?: string
}) {
  return await callCloudFunction('updateProfile', data)
}
