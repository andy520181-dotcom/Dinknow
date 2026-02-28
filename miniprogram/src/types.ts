/** 活动 */
export interface Activity {
  _id?: string
  title: string
  startDate: string
  startTime: string
  endTime?: string // 结束时刻，如 "21:00"，与 startTime 组成时间段
  address: string
  venueName?: string // 球馆名称（发起活动页选择的地点名称）
  latitude?: number
  longitude?: number
  maxParticipants: number
  fee: number // 0 表示免费
  feeNote?: string
  contactInfo?: string // 联系方式：手机号或微信号，选填
  description?: string
  duprLevel?: string // DUPR要求（如"2.0-2.5"、"3.0-3.5"、"4.0+"）
  activityType?: string // 活动形式：单打、双打、混双、不限
  hostId: string
  hostName?: string
  hostAvatar?: string
  hostGender?: number
  hostDuprLevel?: string
  hostRegion?: string
  hostSignature?: string
  currentCount?: number
  status?: 'pending' | 'ongoing' | 'ended'
  createdAt?: number
  participants?: Array<{ userId: string; avatarUrl?: string; nickName?: string; gender?: number; duprLevel?: string; region?: string; signature?: string }> // 已报名用户列表（含公开资料供详情页资料弹层）
}

/** 用户 */
export interface User {
  _id?: string
  openid: string
  nickName: string
  avatarUrl: string
  gender: 0 | 1 | 2 // 0 未知 1 男 2 女
  duprLevel: string
  age?: number // 年龄
  signature?: string // 个性签名
  region?: string // 地区（城市名称）
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
  city?: string // 城市名称，如"萍乡"
  latitude: number
  longitude: number
}
