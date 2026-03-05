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
 * 检查用户是否已登录
 * NOTE: 改为用 phone 字段判断是否完成注册，phone 为空则显示登录页
 * 同时兼容旧用户（有 nickName 但无 phone 视为已登录）
 */
export async function checkLogin(): Promise<{ ok: boolean; openid?: string }> {
  try {
    const loginRes = await login()
    if (!loginRes?.openid) {
      console.log('[checkLogin] 未获取到 openid')
      return { ok: false }
    }
    const profile = await getProfile()
    // NOTE: 有手机号 OR 有昵称（兼容旧用户）即视为已完成注册
    const hasPhone = profile && typeof (profile as any).phone === 'string' && (profile as any).phone.length > 0
    const hasNickName = profile && typeof profile.nickName === 'string' && profile.nickName.trim().length > 0
    const ok = !!(hasPhone || hasNickName)
    console.log('[checkLogin] 检查结果:', { openid: loginRes.openid, hasProfile: !!profile, hasPhone, hasNickName, ok })
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
 * 绑定手机号（首次注册专用）
 * NOTE: 微信 getPhoneNumber 返回 code，需云端调用 getPhoneNumber API 解密
 */
export async function bindPhone(code: string) {
  return await callCloudFunction('bindPhone', { code })
}

/**
 * 更新用户信息
 */
export async function updateProfile(data: {
  nickName?: string
  avatarUrl?: string
  gender?: 0 | 1 | 2
  duprLevel?: string
  age?: number
  signature?: string
  region?: string
  phone?: string
}) {
  return await callCloudFunction('updateProfile', data)
}

