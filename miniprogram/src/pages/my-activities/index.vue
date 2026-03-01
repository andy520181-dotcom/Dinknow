<template>
  <view class="my-activities-page">
    <view v-if="loading" class="loading-wrap">
      <text>加载中...</text>
    </view>
    <view v-else class="activity-list">
      <view v-if="list.length === 0" class="empty">
        <text>{{ type === 'joined' ? '暂无参加的活动' : '暂无发起的活动' }}</text>
      </view>
      <view
        v-for="activity in list"
        :key="activity._id"
        :class="['activity-card-wrap', { 'activity-card-wrap--ended': isActivityEnded(activity) }]"
        @tap="handleViewActivity(activity)"
      >
        <ActivityCard
          :activity="activity"
          variant="my-joined"
        >
          <!-- 我参加的 / 我发起的：右上角都不显示分享 -->
          <template #topRight>
            <view class="card-top-right-placeholder" />
          </template>

          <!-- 我参加的：卡片底部显示退订按钮 -->
          <template v-if="type === 'joined'" #footer>
            <button
              class="leave-btn"
              :class="{ 'leave-btn--disabled': isActivityEnded(activity) }"
              :disabled="isActivityEnded(activity)"
              @tap.stop="handleLeaveActivity(activity)"
            >
              退出
            </button>
          </template>
          <!-- 我发起的：已过活动时间不可编辑、可删除；未过可编辑可删除 -->
          <template v-else-if="type === 'created'" #footer>
            <view class="footer-actions" @tap.stop>
              <button
                class="edit-btn"
                :class="{ 'edit-btn--disabled': isActivityEnded(activity) }"
                :disabled="isActivityEnded(activity)"
                @tap.stop="handleEditActivity(activity)"
              >
                编辑
              </button>
              <button class="delete-btn" @tap.stop="handleDeleteActivity(activity)">删除</button>
            </view>
          </template>
        </ActivityCard>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { onLoad, onShow, onHide, onPullDownRefresh } from '@dcloudio/uni-app'
import { getUserActivities, getActivityDetail, deleteActivity, leaveActivity } from '../../services/activity'
import type { Activity } from '../../types'
import { isActivityEnded } from '../../utils/activity'
import { getCurrentUserFromCache, mergeCurrentUserAvatar, resolveActivityAvatarUrls } from '../../utils/avatarSync'
import ActivityCard from '../../components/ActivityCard.vue'

const type = ref<'joined' | 'created'>('joined')
const list = ref<Activity[]>([])
const loading = ref(true)

onLoad((options: any) => {
  const t = options?.type === 'created' ? 'created' : 'joined'
  type.value = t
  uni.setNavigationBarTitle({ title: t === 'joined' ? '我参加的活动' : '我发起的活动' })
  loadList()
})

onShow(() => {
  loadList()
  startListRefreshTimer()
  if (uni.getStorageSync('activity_just_joined') || uni.getStorageSync('activity_just_left') ||
      uni.getStorageSync('activity_just_updated') || uni.getStorageSync('activity_just_deleted') ||
      uni.getStorageSync('activity_just_published')) {
    uni.removeStorageSync('activity_just_joined')
    uni.removeStorageSync('activity_just_left')
    uni.removeStorageSync('activity_just_updated')
    uni.removeStorageSync('activity_just_deleted')
    uni.removeStorageSync('activity_just_published')
  }
})

onHide(() => {
  clearListRefreshTimer()
})

onPullDownRefresh(async () => {
  await loadList()
  uni.stopPullDownRefresh()
})

/** 与广场页一致：定时静默刷新报名数据，使活动卡实时同步最新报名人数与头像 */
const LIST_REFRESH_INTERVAL_MS = 2000
let listRefreshTimer: ReturnType<typeof setInterval> | null = null

function clearListRefreshTimer() {
  if (listRefreshTimer != null) {
    clearInterval(listRefreshTimer)
    listRefreshTimer = null
  }
}

function startListRefreshTimer() {
  clearListRefreshTimer()
  listRefreshTimer = setInterval(() => {
    loadList(true)
  }, LIST_REFRESH_INTERVAL_MS)
}

async function loadList(silent = false) {
  if (!silent) loading.value = true
  try {
    const res = await getUserActivities()
    const arr = type.value === 'joined' ? (res.joined || []) : (res.created || [])
    const prevList = list.value

    // 静默刷新时：已有 http/https 头像一律保留，不覆盖，避免闪烁；保留旧数据的 participants 避免被覆盖为空
    let data = Array.isArray(arr)
      ? arr.map((act: Activity) => {
          const old = prevList.find((a: Activity) => a._id === act._id)
          if (!old) return act
          const out = { ...act }
          const keepHost =
            old.hostAvatar &&
            (String(old.hostAvatar).startsWith('http') || String(old.hostAvatar).startsWith('cloud://'))
          out.hostAvatar = keepHost ? old.hostAvatar : (act.hostAvatar ?? old.hostAvatar)
          if (Array.isArray(act.participants) && act.participants.length > 0) {
            const oldParts = Array.isArray(old.participants) ? old.participants : []
            out.participants = act.participants.map(
              (p: { userId?: string; avatarUrl?: string; nickName?: string }) => {
                const op = oldParts.find((x: { userId?: string }) => x.userId === p.userId)
                const keepUrl =
                  op?.avatarUrl &&
                  (String(op.avatarUrl).startsWith('http') || String(op.avatarUrl).startsWith('cloud://'))
                return { ...p, avatarUrl: op && keepUrl ? op.avatarUrl : p.avatarUrl ?? op?.avatarUrl }
              }
            )
          } else if (Array.isArray(old.participants) && old.participants.length > 0) {
            out.participants = old.participants
          }
          return out
        })
      : Array.isArray(arr)
      ? arr
      : []

    // 所有活动都用详情接口补全 hostAvatar/participants（与活动详情页同源，解决发起人头像不显示、报名人头像不显示）
    const withId = data.filter((act: Activity) => act._id)
    if (withId.length > 0) {
      const results = await Promise.allSettled(
        withId.map((act: Activity) => getActivityDetail(act._id!))
      )
      const detailMap = new Map<string, Activity>()
      results.forEach((r, i) => {
        const d = r.status === 'fulfilled' ? r.value : null
        if (d && withId[i]?._id) detailMap.set(withId[i]._id!, d)
      })
      data = data.map((act: Activity) => {
        const detail = act._id ? detailMap.get(act._id) : null
        if (!detail) return act
        return {
          ...act,
          hostAvatar: detail.hostAvatar !== undefined && detail.hostAvatar !== null && String(detail.hostAvatar).trim() !== ''
            ? detail.hostAvatar
            : act.hostAvatar,
          hostName: detail.hostName ?? act.hostName,
          participants: Array.isArray(detail.participants) ? detail.participants : (Array.isArray(act.participants) ? act.participants : []),
          currentCount: detail.currentCount ?? act.currentCount
        }
      })
    }

    // 先解析 cloud:// 为 https，再合并当前用户头像（merge 仅用 http 覆盖，避免闪烁）
    data = await resolveActivityAvatarUrls(data)
    const currentUser = getCurrentUserFromCache()
    if (currentUser) {
      data = data.map((act: Activity) => mergeCurrentUserAvatar(act, currentUser))
    }

    // 规范化：保证每条活动必有 participants 数组且为新引用，方便卡片响应式更新
    const normalized = data.map((act: Activity) => ({
      ...act,
      participants: Array.isArray(act.participants) ? act.participants.map((p: { userId?: string; avatarUrl?: string; nickName?: string }) => ({ ...p })) : []
    }))

    if (silent && prevList.length === normalized.length) {
      const nextList = normalized.map((act: Activity) => {
        const old = prevList.find((a: Activity) => a._id === act._id)
        if (!old) return act
        const oldHasAvatar = !!(old.hostAvatar && String(old.hostAvatar).startsWith('http'))
        const newHasAvatar = !!(act.hostAvatar && String(act.hostAvatar).startsWith('http'))
        if (
          oldHasAvatar &&
          newHasAvatar &&
          old.currentCount === act.currentCount &&
          (old.participants?.length ?? 0) === (act.participants?.length ?? 0)
        ) {
          return old
        }
        return act
      })
      list.value = nextList
    } else {
      list.value = normalized
    }
  } catch (e) {
    if (!silent) list.value = []
  } finally {
    if (!silent) loading.value = false
  }
}

function handleAvatarUpdated() {
  loadList()
}

function handleActivityJoined() {
  setTimeout(() => loadList(), 500)
}
function handleActivityCreated() {
  loadList()
}
function handleActivityUpdated() {
  loadList()
}
function handleActivityDeleted() {
  loadList()
}

onMounted(() => {
  uni.$on('avatar-updated', handleAvatarUpdated)
  uni.$on('activity-joined', handleActivityJoined)
  uni.$on('activity-left', handleActivityJoined)
  uni.$on('activity-created', handleActivityCreated)
  uni.$on('activity-updated', handleActivityUpdated)
  uni.$on('activity-deleted', handleActivityDeleted)
})

onUnmounted(() => {
  clearListRefreshTimer()
  uni.$off('avatar-updated', handleAvatarUpdated)
  uni.$off('activity-joined', handleActivityJoined)
  uni.$off('activity-left', handleActivityJoined)
  uni.$off('activity-created', handleActivityCreated)
  uni.$off('activity-updated', handleActivityUpdated)
  uni.$off('activity-deleted', handleActivityDeleted)
})

function handleViewActivity(activity: Activity) {
  if (!activity._id) return
  const activities = uni.getStorageSync('activity_detail_cache') || []
  const existingIndex = activities.findIndex((a: Activity) => a._id === activity._id)
  if (existingIndex >= 0) {
    activities[existingIndex] = activity
  } else {
    activities.push(activity)
  }
  uni.setStorageSync('activity_detail_cache', activities)
  uni.navigateTo({ url: `/pages/activity-detail/index?id=${activity._id}` })
}

function handleEditActivity(activity: Activity) {
  if (!activity._id) return
  if (isActivityEnded(activity)) {
    uni.showToast({ title: '活动已过开始时间，无法编辑', icon: 'none' })
    return
  }
  uni.setStorageSync('editing_activity', {
    _id: activity._id,
    title: activity.title,
    startDate: activity.startDate,
    startTime: activity.startTime,
    endTime: (activity as any).endTime,
    address: activity.address,
    venueName: activity.venueName,
    latitude: activity.latitude,
    longitude: activity.longitude,
    maxParticipants: activity.maxParticipants,
    fee: activity.fee,
    duprLevel: activity.duprLevel,
    description: (activity as any).description,
    contactInfo: (activity as any).contactInfo
  })
  uni.switchTab({ url: '/pages/create-activity/index' })
}

async function handleDeleteActivity(activity: Activity) {
  if (!activity._id) return
  uni.showModal({
    title: '确认删除',
    content: `确定要删除活动"${activity.title}"吗？删除后无法恢复。`,
    confirmText: '删除',
    confirmColor: '#FF3B30',
    success: async (res) => {
      if (!res.confirm) return
      try {
        uni.showLoading({ title: '删除中...' })
        const result = await deleteActivity(activity._id!)
        uni.hideLoading()
        if (result?.success === false) {
          uni.showToast({ title: result.message || '删除失败', icon: 'none' })
          return
        }
        uni.showToast({ title: '删除成功', icon: 'success' })
        uni.setStorageSync('activity_just_deleted', true)
        uni.$emit('activity-deleted', { activityId: activity._id })
        await loadList()
      } catch (err: any) {
        uni.hideLoading()
        uni.showToast({ title: err?.errMsg || err?.message || '删除失败', icon: 'none' })
      }
    }
  })
}

async function handleLeaveActivity(activity: Activity) {
  if (!activity._id) return
  if (isActivityEnded(activity)) {
    uni.showToast({ title: '活动已开始，无法退出', icon: 'none' })
    return
  }
  uni.showModal({
    title: '确认退出',
    content: `确定要退出活动"${activity.title}"吗？`,
    confirmText: '退出',
    confirmColor: '#FF3B30',
    success: async (res) => {
      if (!res.confirm) return
      try {
        uni.showLoading({ title: '退出中...' })
        const result = await leaveActivity(activity._id!)
        uni.hideLoading()
        if (result?.success === false) {
          uni.showToast({ title: result.message || '退出失败', icon: 'none', duration: 3000 })
          return
        }
        uni.showToast({ title: '退出成功', icon: 'success' })
        uni.setStorageSync('activity_just_left', true)
        uni.$emit('activity-left', { activityId: activity._id })
        await loadList()
      } catch (err: any) {
        uni.hideLoading()
        uni.showToast({ title: err?.errMsg || err?.message || '退出失败', icon: 'none' })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
@import '../../uni.scss';

.my-activities-page {
  min-height: 100vh;
  background: $ios-bg-secondary;
  padding: $ios-spacing-md;
  padding-bottom: calc(40px + env(safe-area-inset-bottom));
}

.loading-wrap {
  padding: $ios-spacing-xxl;
  text-align: center;
  color: $ios-text-tertiary;
}

.empty {
  padding: $ios-spacing-xxl;
  text-align: center;
  color: $ios-text-tertiary;
}

.activity-list {
  padding-bottom: $ios-spacing-xxl;
}

.activity-card-wrap {
  display: block;

  // NOTE: 已过期活动卡片用极浅灰色背景，直观区分进行中和已结束的活动
  &--ended :deep(.activity-card) {
    background: #eaeaef;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }
}

.card-top-right-placeholder {
  width: 1px;
  height: 1px;
  opacity: 0;
}

/* 我发起的：卡片底部左右并排（编辑左、删除右） */
.footer-actions {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 12px;
}

/* iOS 风格：编辑 / 删除按钮（与广场活动卡视觉统一，精致圆角按钮） */
.edit-btn,
.delete-btn {
  height: 28px;
  min-width: 52px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: $ios-font-weight-medium;
  line-height: 28px;
  border-radius: 14px;
  border: none;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);

  &::after {
    border: none;
  }

  &:active {
    transform: scale(0.96);
  }
}

.edit-btn {
  background: $ios-blue;
  color: #fff;

  &:active {
    background: darken($ios-blue, 6%);
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
  }

  &.edit-btn--disabled {
    background: transparent;
    color: $ios-text-tertiary;
    box-shadow: none;
    border: 1px solid $ios-separator;
    opacity: 0.9;
  }
}

.delete-btn {
  background: $ios-red;
  color: #fff;

  &:active {
    background: darken($ios-red, 6%);
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
  }
}

/* 我参加的：退出按钮（与编辑按钮尺寸、配色统一） */
.leave-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  min-width: 52px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: $ios-font-weight-medium;
  line-height: 28px;
  border-radius: 14px;
  border: none;
  background: $ios-blue;
  color: #fff;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);

  &::after {
    border: none;
  }

  &:active {
    background: darken($ios-blue, 6%);
    transform: scale(0.96);
  }

  &.leave-btn--disabled {
    opacity: 0.5;
    color: $ios-text-tertiary;
    background: transparent;
    border: 1px solid $ios-separator;
    box-shadow: none;
  }
}
</style>
