import { callCloudFunction } from './cloud'
import { User } from '../types'

/**
 * 用户登录（获取 openid）
 */
export async function login() {
  const result = await callCloudFunction('login')
  return result as { openid: string }
}

/**
 * 获取用户信息
 */
export async function getProfile(openid: string) {
  const result = await callCloudFunction('getProfile', { openid })
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
}) {
  return await callCloudFunction('updateProfile', data)
}
