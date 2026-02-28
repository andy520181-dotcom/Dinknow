import { callCloudFunction } from './cloud'
import { Activity } from '../types'

/**
 * 获取活动列表
 */
export async function getActivities(params?: {
  keyword?: string
  latitude?: number
  longitude?: number
}) {
  const result = await callCloudFunction('getActivities', params)
  return (result?.list || []) as Activity[]
}

/**
 * 创建活动
 */
export async function createActivity(data: {
  title: string
  startDate: string
  startTime: string
  address: string
  latitude?: number
  longitude?: number
  maxParticipants: number
  fee: number
  description?: string
}) {
  return await callCloudFunction('createActivity', data)
}

/**
 * 加入活动
 */
export async function joinActivity(activityId: string) {
  return await callCloudFunction('joinActivity', { activityId })
}

/**
 * 获取用户活动（我发起的和我参与的）
 */
export async function getUserActivities() {
  const result = await callCloudFunction('getUserActivities')
  return {
    created: (result?.created || []) as Activity[],
    joined: (result?.joined || []) as Activity[]
  }
}
