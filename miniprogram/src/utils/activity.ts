/**
 * 活动开始时间解析与「是否已结束」判断（与广场/详情/个人页一致）
 * - 支持 startDate 为 YYYY-MM-DD 或 ISO 字符串（带 T 时按本地日期解释，避免云返回 Date 序列化后误判）
 * - 缺 startTime 时视为当天 23:59，避免误判为已结束
 * - 仅当当前时间超过开始时间 1 分钟后才视为已结束
 */

export interface ActivityStartLike {
  startDate?: string | null
  startTime?: string | null
}

/**
 * 将活动的 startDate + startTime 解析为本地时间戳（毫秒）。
 * 解析失败或缺少 startDate 时返回 null。
 */
export function parseActivityStartTime(activity: ActivityStartLike): number | null {
  const rawDate = activity.startDate
  const rawTime = activity.startTime
  if (rawDate == null || rawDate === '') return null

  const d = String(rawDate).trim()
  const t = (rawTime != null && rawTime !== '') ? String(rawTime).trim() : '23:59'

  let y: number
  let m: number
  let day: number

  // 云可能返回 ISO 字符串（如 2025-02-09T16:00:00.000Z），按“本地日期”解释，避免 UTC 日期导致误判已结束
  if (d.includes('T')) {
    const dateObj = new Date(d)
    if (isNaN(dateObj.getTime())) return null
    y = dateObj.getFullYear()
    m = dateObj.getMonth() + 1
    day = dateObj.getDate()
  } else {
    const parts = d.split('-')
    if (parts.length !== 3) return null
    y = parseInt(parts[0], 10)
    m = parseInt(parts[1], 10)
    const dayPart = parts[2]
    const dayStr = dayPart.includes('T') ? dayPart.split('T')[0] : dayPart
    day = parseInt(dayStr, 10)
    if (isNaN(y) || isNaN(m) || isNaN(day) || y < 2000 || m < 1 || m > 12 || day < 1 || day > 31) return null
  }

  const timeStr = t.length <= 5 ? t + ':00' : t.slice(0, 8)
  const timeParts = timeStr.split(':').map((x: string) => parseInt(x, 10) || 0)
  const h = Math.min(23, Math.max(0, timeParts[0] ?? 0))
  const min = Math.min(59, Math.max(0, timeParts[1] ?? 0))
  const start = new Date(y, m - 1, day, h, min, 0, 0)
  if (isNaN(start.getTime())) return null
  return start.getTime()
}

const END_BUFFER_MS = 60 * 1000

/**
 * 活动是否已结束：仅当当前时间超过开始时间 1 分钟后才视为已结束（与广场/详情/个人页一致）
 */
export function isActivityEnded(activity: ActivityStartLike): boolean {
  const start = parseActivityStartTime(activity)
  if (start == null) return false
  const now = Date.now()
  if (now < start) return false
  return (now - start) > END_BUFFER_MS
}

/** 解析后的本地日期，用于展示 */
export interface ParsedActivityDate {
  y: number
  m: number
  day: number
  ymd: string
}

/**
 * 解析活动 startDate 为本地年/月/日及 YYYY-MM-DD 字符串（用于展示）。
 * 支持 YYYY-MM-DD 或 ISO 字符串（带 T 时按本地日期）。
 */
export function parseActivityDate(activity: ActivityStartLike): ParsedActivityDate | null {
  const rawDate = activity.startDate
  if (rawDate == null || rawDate === '') return null
  const d = String(rawDate).trim()
  let y: number
  let m: number
  let day: number
  if (d.includes('T')) {
    const dateObj = new Date(d)
    if (isNaN(dateObj.getTime())) return null
    y = dateObj.getFullYear()
    m = dateObj.getMonth() + 1
    day = dateObj.getDate()
  } else {
    const parts = d.split('-')
    if (parts.length !== 3) return null
    y = parseInt(parts[0], 10)
    m = parseInt(parts[1], 10)
    const dayPart = parts[2]
    const dayStr = dayPart.includes('T') ? dayPart.split('T')[0] : dayPart
    day = parseInt(dayStr, 10)
    if (isNaN(y) || isNaN(m) || isNaN(day) || y < 2000 || m < 1 || m > 12 || day < 1 || day > 31) return null
  }
  const ymd = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return { y, m, day, ymd }
}
