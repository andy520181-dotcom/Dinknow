/** 活动 */
export interface Activity {
  _id?: string
  title: string
  startDate: string
  startTime: string
  address: string
  latitude?: number
  longitude?: number
  maxParticipants: number
  fee: number // 0 表示免费
  feeNote?: string
  description?: string
  hostId: string
  hostName?: string
  hostAvatar?: string
  currentCount?: number
  status?: 'pending' | 'ongoing' | 'ended'
  createdAt?: number
}

/** 用户 */
export interface User {
  _id?: string
  openid: string
  nickName: string
  avatarUrl: string
  gender: 0 | 1 | 2 // 0 未知 1 男 2 女
  duprLevel: string
  createdAt?: number
}

/** 报名记录 */
export interface Registration {
  _id?: string
  activityId: string
  userId: string
  joinedAt?: number
  status?: string
}

/** 定位信息 */
export interface LocationInfo {
  name?: string
  address?: string
  latitude: number
  longitude: number
}
