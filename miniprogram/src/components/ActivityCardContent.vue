<template>
  <view class="activity-card-content">
    <!-- 活动标题 -->
    <view class="title-row">
      <text class="activity-title">{{ activity.title }}</text>
    </view>

    <!-- 与发起活动页一致：时间、地点、DUPR水平、人数、费用（iOS 风格图标） -->
    <view class="activity-info activity-info--compact">
      <view class="info-row">
        <view class="info-chunk">
          <image class="info-icon-img" src="/static/icons/icon-time.png" mode="aspectFit" />
          <text class="info-text">{{ dateTimeFull }}</text>
        </view>
        <text class="info-sep">·</text>
        <view class="info-chunk">
          <image class="info-icon-img" src="/static/icons/icon-venue.png" mode="aspectFit" />
          <text class="info-text">{{ activity.venueName || activity.address || '—' }}</text>
        </view>
      </view>

      <view class="info-row">
        <view class="info-chunk">
          <image class="info-icon-img" src="/static/icons/icon-dupr.png" mode="aspectFit" />
          <text class="info-text">{{ duprLevel || '—' }}</text>
        </view>
        <text class="info-sep">·</text>
        <view class="info-chunk">
          <image class="info-icon-img" src="/static/icons/icon-people.png" mode="aspectFit" />
          <text class="info-text">{{ activity.maxParticipants }}人</text>
        </view>
        <text class="info-sep">·</text>
        <view class="info-chunk">
          <image class="info-icon-img" src="/static/icons/icon-fee.png" mode="aspectFit" />
          <text class="info-text">{{ feeText }}</text>
        </view>
      </view>
    </view>

    <view class="activity-footer">
      <slot name="footerRight" />
    </view>
  </view>
</template>

<script setup lang="ts">
import type { Activity } from '../types'
import { isActivityEnded, parseActivityDate } from '../utils/activity'
import { computed } from 'vue'

const props = defineProps<{
  activity: Activity
}>()

const max = computed(() => props.activity.maxParticipants)

// 根据活动形式计算可报名人数（不包括创建者）
const availableSlots = computed(() => {
  const activityType = props.activity.activityType || '不限'
  if (activityType === '单打') {
    return 1 // 除了创建者，还剩1人
  } else if (activityType === '双打' || activityType === '混双') {
    return 3 // 除了创建者，还剩3人
  } else {
    // 不限：总人数减1（创建者）
    return max.value - 1
  }
})

// 已报名人数（不包括创建者）
const registeredCount = computed(() => {
  const count = props.activity.currentCount ?? 0
  // currentCount 是已报名用户数（不包括创建者），所以直接返回
  return count
})


// 是否已满
const isFull = computed(() => registeredCount.value >= availableSlots.value)

const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// 将 "HH:mm" 加 1 小时，用于无 endTime 时显示时间段（如 21:00 -> 22:00）
function addOneHour(timeStr: string): string {
  const part = (timeStr || '00:00').trim().slice(0, 5)
  const [h, m] = part.split(':').map(Number)
  const mins = (h * 60 + (m || 0) + 60) % (24 * 60)
  const nh = Math.floor(mins / 60)
  const nm = mins % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

// 时间栏：选择器第二列=开始时间、第三列=截止时间；与详情页一致：无 endTime 或 endTime=startTime 时截止显示为开始+1小时
const dateTimeFull = computed(() => {
  const parsed = parseActivityDate(props.activity)
  const startTime = props.activity.startTime || '00:00'
  const endTime = props.activity.endTime
  const startPart = startTime.length <= 5 ? startTime : startTime.slice(0, 5)
  const endPart = (endTime && String(endTime).trim() && String(endTime).trim() !== startPart)
    ? (String(endTime).trim().length <= 5 ? String(endTime).trim() : String(endTime).trim().slice(0, 5))
    : addOneHour(startPart)
  const timeRange = `${startPart}-${endPart}`
  if (!parsed) return timeRange
  const actDate = new Date(parsed.y, parsed.m - 1, parsed.day)
  const weekday = weekdays[actDate.getDay()] ?? ''
  return `${parsed.m}月${parsed.day}日 ${weekday} ${timeRange}`
})

const dateTime = computed(() => {
  const parsed = parseActivityDate(props.activity)
  const time = props.activity.startTime
  if (!parsed) return time || ''
  const actDate = new Date(parsed.y, parsed.m - 1, parsed.day)
  const weekday = weekdays[actDate.getDay()] ?? ''
  return time ? `${parsed.ymd} ${weekday} ${time}` : `${parsed.ymd} ${weekday}`
})

const feeText = computed(() => {
  const fee = props.activity.fee
  if (fee === undefined || fee === null) return '—'
  return fee === 0 ? '免费' : `${fee}元/人`
})

// 活动是否已结束（与 utils/activity 一致：支持 ISO 日期、缺 startTime 默认 23:59、超过开始时间 1 分钟才视为已结束）
const isEnded = computed(() => isActivityEnded(props.activity))

const duprLevel = computed(() => {
  const level = (props.activity as any).duprLevel
  return level || null
})

defineExpose({
  isEnded,
  dateTime,
  dateTimeFull,
  duprLevel,
  max,
  isFull,
  availableSlots,
  registeredCount
})
</script>

<style lang="scss" scoped>
.activity-card-content {
  display: block;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: $ios-spacing-md;
  min-width: 0;
}

.activity-title {
  font-size: 16px;
  font-weight: $ios-font-weight-semibold;
  color: $ios-text-primary;
  flex: 1;
  min-width: 0;
  line-height: 1.4;
  letter-spacing: -0.2px;
}

.activity-info {
  margin-bottom: $ios-spacing-md;

  &--compact {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: $ios-spacing-sm;
  }
}

.info-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0 4px;
  row-gap: 2px;
}

.info-chunk {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  flex-shrink: 0;
}

.info-icon-img {
  width: 12px;
  height: 12px;
  margin-right: 4px;
  flex-shrink: 0;
}

.activity-info--compact .info-icon-img {
  width: 12px;
  height: 12px;
  margin-right: 3px;
  flex-shrink: 0;
}

.info-sep {
  font-size: 12px;
  color: $ios-text-tertiary;
  flex-shrink: 0;
  margin: 0 2px;
}

.info-text {
  font-size: 14px;
  color: $ios-text-secondary;
  line-height: 1.5;
  min-width: 0;
}

.activity-info--compact .info-text {
  font-size: 13px;
  line-height: 1.4;
}

.activity-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: $ios-spacing-md;
  padding-top: $ios-spacing-md;
  border-top: 1px solid $ios-separator;
}

</style>
