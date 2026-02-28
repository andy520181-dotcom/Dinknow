import { callCloudFunction } from './cloud'
import type { Activity } from '../types'

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
 * 获取活动详情
 */
export async function getActivityDetail(activityId: string) {
  const result = await callCloudFunction('getActivityDetail', { activityId })
  return (result?.activity || null) as Activity | null
}

/**
 * 创建活动
 */
export async function createActivity(data: {
  title: string
  startDate: string
  startTime: string
  endTime?: string
  address: string
  venueName?: string
  latitude?: number
  longitude?: number
  maxParticipants: number
  fee: number
  contactInfo?: string
  duprLevel?: string
  activityType?: string
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

/**
 * 更新活动
 */
export async function updateActivity(activityId: string, data: {
  title?: string
  startDate?: string
  startTime?: string
  endTime?: string
  address?: string
  venueName?: string
  latitude?: number
  longitude?: number
  maxParticipants?: number
  fee?: number
  contactInfo?: string
  duprLevel?: string
  activityType?: string
  description?: string
}) {
  return await callCloudFunction('updateActivity', { activityId, ...data })
}

/**
 * 删除活动
 */
export async function deleteActivity(activityId: string) {
  return await callCloudFunction('deleteActivity', { activityId })
}

/**
 * 退出活动报名
 */
export async function leaveActivity(activityId: string) {
  return await callCloudFunction('leaveActivity', { activityId })
}
