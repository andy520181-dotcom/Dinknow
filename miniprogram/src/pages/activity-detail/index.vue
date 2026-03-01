<template>
  <view class="detail-page">
    <view v-if="loading" class="loading-container">
      <text>加载中...</text>
    </view>
    <view v-else-if="activity" class="activity-detail">
      <!-- 第一部分：按发起页顺序展示（发起人、标题、时间、地点、DUPR、人数、费用、联系方式、备注） -->
      <view class="detail-info-section">
        <view class="detail-info-card">
          <view class="detail-row detail-row--initiator" @tap="handleViewProfile(activity.hostId)">
            <text class="detail-label">发起人</text>
            <view class="detail-value detail-value--initiator">
              <image
                v-if="activity.hostAvatar"
                :src="getCloudImageUrl(activity.hostAvatar)"
                class="detail-initiator-avatar"
                mode="aspectFill"
              />
              <view v-else class="detail-initiator-avatar detail-initiator-avatar--placeholder">👤</view>
              <text class="detail-initiator-name">{{ activity.hostName || '微信用户' }}</text>
            </view>
          </view>
          <view class="detail-row">
            <text class="detail-label">标题</text>
            <text class="detail-value">{{ activity.title }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">时间</text>
            <text class="detail-value">{{ dateTimeFullDisplay }}</text>
          </view>
          <!-- NOTE: 地点行：文字左对齐，右侧导航按钮调起系统地图 -->
          <view class="detail-row detail-row--location">
            <text class="detail-label">地点</text>
            <text class="detail-value detail-value--location">{{ activity.venueName || activity.address || '—' }}</text>
            <view
              v-if="activity.latitude && activity.longitude"
              class="navigate-btn"
              @tap="handleNavigate"
            >
              <text class="navigate-icon">📍</text>
              <text class="navigate-text">导航</text>
            </view>
          </view>
          <view class="detail-row">
            <text class="detail-label">DUPR 水平</text>
            <text class="detail-value">{{ duprDisplayText }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">人数</text>
            <text class="detail-value">{{ activity.maxParticipants }}人</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">费用</text>
            <text class="detail-value">{{ feeTextDisplay }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">联系方式</text>
            <text v-if="hasJoined && activity.contactInfo" class="detail-value">{{ activity.contactInfo }}</text>
            <text v-else class="detail-value detail-value--muted">报名成功后可见</text>
          </view>
          <view v-if="activity.description" class="detail-row">
            <text class="detail-label">备注</text>
            <text class="detail-value detail-value--desc">{{ activity.description }}</text>
          </view>
        </view>
      </view>

      <!-- 第二部分：发起人 + 报名用户头像（详情页不限制数量，有多少显示多少） -->
      <view class="participants-section">
        <text class="section-title">匹克球搭子</text>
        <view class="participants-list">
          <view
            v-for="(item, idx) in displayedParticipants"
            :key="item.userId || idx"
            class="participant-item"
            :class="{ 'participant-item--leaving': item.leaving }"
            @tap="handleViewProfile(item.userId)"
          >
            <view class="participant-avatar-container">
              <image
                v-if="item.avatarUrl"
                :src="getCloudImageUrl(item.avatarUrl)"
                class="participant-avatar-large"
                mode="aspectFill"
              />
              <view v-else class="participant-avatar-placeholder-large">
                <text class="avatar-placeholder-icon">👤</text>
              </view>
              <view v-if="item.isHost" class="host-badge">发起人</view>
            </view>
            <text class="participant-name-large">{{ item.nickName || '微信用户' }}</text>
          </view>

        </view>
      </view>

      <!-- 第三部分：底部固定报名区（免责声明 + 立即报名按钮） -->
      <view v-if="!isEnded && canJoin" class="join-section">
        <!-- NOTE: 免责声明勾选行，与发起活动页样式完全一致 -->
        <view class="join-disclaimer-row">
          <view class="join-disclaimer-checkbox" @tap="disclaimerAccepted = !disclaimerAccepted">
            <view class="join-disclaimer-inner" :class="{ 'join-disclaimer-inner--checked': disclaimerAccepted }">
              <text v-if="disclaimerAccepted" class="join-disclaimer-check-icon">✓</text>
            </view>
          </view>
          <text class="join-disclaimer-label">我已仔细阅读并同意</text>
          <text class="join-disclaimer-link" @tap.stop="goToDisclaimer">《免责声明》</text>
        </view>
        <button 
          class="join-btn" 
          :disabled="joining || isFull || !disclaimerAccepted"
          @tap="handleJoinTap"
        >
          <text v-if="joining">报名中...</text>
          <text v-else-if="isFull">报名已满</text>
          <text v-else>立即报名</text>
        </button>
      </view>

    </view>
    <view v-else class="error-container">
      <text>活动不存在</text>
    </view>

    <!-- 点击头像：查看个人资料弹层（头像、昵称、性别、地区、DUPR、球风），不再跳转个人页 -->
    <view v-if="showProfileModal" class="profile-modal-overlay" @tap="closeProfileModal">
      <view class="profile-modal" @tap.stop>
        <view class="profile-modal-header">
          <text class="profile-modal-title">个人资料</text>
          <view class="profile-modal-close" @tap="closeProfileModal">
            <text class="close-icon">×</text>
          </view>
        </view>
        <view class="profile-modal-content" :key="'profile-' + (profileUser?.openid || '') + '-' + (profileUser?.region ?? '') + '-' + (profileUser?.signature ?? '')">
          <template v-if="profileUser">
            <view class="profile-avatar-section">
              <!-- NOTE: 点击头像调起微信内置大图预览 -->
              <image
                v-if="profileUser.avatarUrl"
                :src="getCloudImageUrl(profileUser.avatarUrl)"
                class="profile-modal-avatar"
                mode="aspectFill"
                @tap="previewProfileAvatar"
              />
              <view v-else class="profile-modal-avatar-placeholder">
                <text class="avatar-placeholder-icon-large">👤</text>
              </view>
            </view>
            <view class="profile-info-section">
              <view class="profile-info-item">
                <text class="profile-info-label">昵称</text>
                <text class="profile-info-value">{{ profileUser.nickName || '微信用户' }}</text>
              </view>
              <view class="profile-info-item">
                <text class="profile-info-label">性别</text>
                <text class="profile-info-value">{{ profileGenderText }}</text>
              </view>
              <view class="profile-info-item">
                <text class="profile-info-label">地区</text>
                <text class="profile-info-value">{{ (profileUser as any)?.region && String((profileUser as any).region).trim() ? String((profileUser as any).region).trim() : '—' }}</text>
              </view>
              <view class="profile-info-item">
                <text class="profile-info-label">DUPR 水平</text>
                <text class="profile-info-value">{{ profileDuprText }}</text>
              </view>
              <view class="profile-info-item">
                <text class="profile-info-label">球风</text>
                <text class="profile-info-value">{{ (profileUser as any)?.signature && String((profileUser as any).signature).trim() ? String((profileUser as any).signature).trim() : '—' }}</text>
              </view>
            </view>
          </template>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad, onShow, onHide, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import type { Activity, User } from '../../types'
import { getActivityDetail, joinActivity } from '../../services/activity'
import { getProfile, checkLogin } from '../../services/user'
import { getCloudImageUrl } from '../../services/cloud'
import { isActivityEnded, parseActivityDate } from '../../utils/activity'
import { getCurrentUserFromCache, mergeCurrentUserAvatar } from '../../utils/avatarSync'

const activityId = ref<string>('')
const activity = ref<Activity | null>(null)
const loading = ref(true)
const joining = ref(false)
// NOTE: 报名前必须勾选免责声明，与发起活动页逻辑一致
const disclaimerAccepted = ref(false)

// NOTE: 跳转到独立免责声明页面
function goToDisclaimer() {
  uni.navigateTo({ url: '/pages/disclaimer/index' })
}
const currentUser = ref<User | null>(null)
const currentUserLoading = ref(false) // 当前用户信息加载状态
const showProfileModal = ref(false)
const profileUser = ref<User | null>(null)

const current = computed(() => activity.value?.currentCount ?? 0)
const max = computed(() => activity.value?.maxParticipants ?? 0)
const remaining = computed(() => Math.max(0, max.value - current.value))
const participants = computed(() => activity.value?.participants || [])

/** 详情页显示全部参与人员，不做数量限制 */
const displayedParticipants = computed(() => {
  const act = activity.value
  if (!act) return []
  const list: Array<{ userId: string; avatarUrl?: string; nickName?: string; isHost?: boolean; leaving?: boolean }> = []
  if (act.hostId) {
    list.push({
      userId: act.hostId,
      avatarUrl: act.hostAvatar,
      nickName: act.hostName || '微信用户',
      isHost: true
    })
  }
  const joined = act.participants || []
  list.push(...joined.map((p: { userId?: string; avatarUrl?: string; nickName?: string }) => ({
    userId: p.userId || '',
    avatarUrl: p.avatarUrl,
    nickName: p.nickName,
    isHost: false
  })))
  return list
})

const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
// 与广场活动卡一致：无 endTime 或 endTime 与 startTime 相同时，截止时间显示为开始时间+1小时
function addOneHour(timeStr: string): string {
  const part = (timeStr || '00:00').trim().slice(0, 5)
  const [h, m] = part.split(':').map(Number)
  const mins = (h * 60 + (m || 0) + 60) % (24 * 60)
  const nh = Math.floor(mins / 60)
  const nm = mins % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}
// 时间栏：选择器第二列=开始时间、第三列=截止时间（与 ActivityCardContent 展示逻辑一致）
const dateTimeFullDisplay = computed(() => {
  if (!activity.value) return ''
  const parsed = parseActivityDate(activity.value)
  const startTime = activity.value.startTime || '00:00'
  const endTime = activity.value.endTime
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
const feeTextDisplay = computed(() => {
  const fee = activity.value?.fee
  if (fee === undefined || fee === null) return '—'
  return fee === 0 ? '免费' : `${fee}元/人`
})
const duprDisplayText = computed(() => getDuprDisplayText(activity.value?.duprLevel))
// 当前用户是否已报名（发起人或在参与者列表中）
const hasJoined = computed(() => {
  const openid = getCurrentOpenid()
  if (!openid || !activity.value) return false
  if (activity.value.hostId === openid) return true
  return (activity.value.participants || []).some((p: { userId?: string }) => p.userId === openid)
})

// 活动是否已结束（与广场页一致：使用共享 isActivityEnded）
const isEnded = computed(() => (activity.value ? isActivityEnded(activity.value) : false))

// 根据活动形式计算可报名人数（不包括创建者）
const availableSlots = computed(() => {
  if (!activity.value) return 0
  const activityType = activity.value.activityType || '不限'
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
  return current.value
})

// 是否已满
const isFull = computed(() => registeredCount.value >= availableSlots.value)

// 获取当前用户的 openid（同步方式，用于立即判断）
function getCurrentOpenid(): string | null {
  // 优先使用 currentUser
  if (currentUser.value?.openid) {
    return currentUser.value.openid
  }
  // 备用方案：从登录缓存获取
  try {
    const loginRes = uni.getStorageSync('login_res')
    return loginRes?.openid || null
  } catch (e) {
    return null
  }
}

// 是否是当前用户创建的活动
const isHost = computed(() => {
  if (!activity.value) return false
  const currentOpenid = getCurrentOpenid()
  if (!currentOpenid) return false
  return currentOpenid === activity.value.hostId
})

// 是否显示「立即报名」按钮：活动存在、未结束、非发起人、未报名过（依赖 currentUser / 缓存判断发起人）
const canJoin = computed(() => {
  if (!activity.value) return false
  if (isHost.value) return false // 发起人不显示报名按钮
  if (hasJoined.value) return false // 已报名过不显示
  return true
})


onLoad(async (options: any) => {
  if (options.id) {
    activityId.value = options.id
    // loadActivityDetail 内部会先调用 loadCurrentUser，确保数据顺序正确，避免头像闪现
    await loadActivityDetail()
  } else {
    loading.value = false
    uni.showToast({ title: '活动ID缺失', icon: 'none' })
  }
})

// 监听活动相关事件，实时刷新活动详情
function handleActivityJoined(eventData?: { activityId?: string }) {
  // 如果事件中包含活动ID，只刷新匹配的活动；否则刷新当前活动
  if (eventData?.activityId && eventData.activityId !== activityId.value) {
    return // 不是当前活动，不刷新
  }
  if (activityId.value) {
    console.log('[活动详情页] 收到活动报名/退出事件，刷新活动详情...')
    loadActivityDetail()
  }
}

function handleActivityUpdated(eventData?: { activityId?: string }) {
  // 如果事件中包含活动ID，只刷新匹配的活动；否则刷新当前活动
  if (eventData?.activityId && eventData.activityId !== activityId.value) {
    return // 不是当前活动，不刷新
  }
  if (activityId.value) {
    console.log('[活动详情页] 收到活动更新事件，刷新活动详情...')
    loadActivityDetail()
  }
}

function handleActivityDeleted(eventData?: { activityId?: string }) {
  // 如果删除的是当前查看的活动，返回上一页
  if (eventData?.activityId === activityId.value) {
    console.log('[活动详情页] 当前活动已被删除，返回上一页...')
    uni.showToast({ title: '活动已删除', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
}

function handleAvatarUpdated(fileID?: string) {
  const openid = getCurrentOpenid()
  if (!openid || !activity.value) return
  const avatarUrl = typeof fileID === 'string' ? fileID : getCurrentUserFromCache()?.avatarUrl
  if (!avatarUrl) return
  activity.value = mergeCurrentUserAvatar(activity.value, { openid, avatarUrl })
}

onMounted(() => {
  // 监听全局事件，当其他用户报名时也能实时更新
  uni.$on('activity-joined', handleActivityJoined)
  uni.$on('activity-left', handleActivityJoined)
  uni.$on('activity-updated', handleActivityUpdated) // 编辑活动也刷新详情
  uni.$on('activity-deleted', handleActivityDeleted) // 删除活动时返回上一页
  uni.$on('avatar-updated', handleAvatarUpdated) // 个人页更新头像后同步发起人头像
})

onUnmounted(() => {
  // 移除事件监听
  uni.$off('activity-joined', handleActivityJoined)
  uni.$off('activity-left', handleActivityJoined)
  uni.$off('activity-updated', handleActivityUpdated)
  uni.$off('activity-deleted', handleActivityDeleted)
  uni.$off('avatar-updated', handleAvatarUpdated)
  // 停止定时轮询
  stopPolling()
})

// NOTE: 定时轮询，每 1 秒静默检查参与者变化，仅在有新报名/退出时才更新 UI
let pollingTimer: ReturnType<typeof setInterval> | null = null
const POLLING_INTERVAL = 1000 // 1 秒

/** 静默同步参与者列表：只比较人数和 userId，有变化才更新，避免整页闪烁 */
let isSyncing = false
async function silentSyncParticipants() {
  if (!activityId.value || !activity.value || isSyncing) return
  isSyncing = true
  try {
    const detail = await getActivityDetail(activityId.value)
    if (!detail) return
    const oldIds = (activity.value.participants || []).map((p: { userId?: string }) => p.userId).sort().join(',')
    const newIds = (detail.participants || []).map((p: { userId?: string }) => p.userId).sort().join(',')
    // 参与者列表无变化，不触发 UI 更新
    if (oldIds === newIds && (activity.value.currentCount ?? 0) === (detail.currentCount ?? 0)) return

    const oldParticipants = activity.value.participants || []
    const newParticipantIds = new Set((detail.participants || []).map((p: { userId?: string }) => p.userId))

    // 找出退出的用户（在旧列表中但不在新列表中）
    const leavingIds = oldParticipants
      .filter((p: { userId?: string }) => !newParticipantIds.has(p.userId))
      .map((p: { userId?: string }) => p.userId)

    if (leavingIds.length > 0) {
      // 先标记退出用户触发淡出动画
      activity.value = {
        ...activity.value,
        participants: oldParticipants.map((p: { userId?: string }) => (
          leavingIds.includes(p.userId) ? { ...p, leaving: true } : p
        )) as typeof activity.value.participants
      }
      // 等待淡出动画完成后再更新为新列表
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    // 更新为最新参与者列表
    const mergedParticipants = (detail.participants || []).map((p: Record<string, unknown>) => {
      const op = oldParticipants.find((x: { userId?: string }) => x.userId === p.userId)
      const oldUrl = op?.avatarUrl
      const newUrl = p.avatarUrl as string
      const keepOld = oldUrl && String(oldUrl).startsWith('http')
      return { ...p, avatarUrl: keepOld ? oldUrl : (newUrl || oldUrl || '') }
    })
    activity.value = {
      ...activity.value,
      participants: mergedParticipants as typeof activity.value.participants,
      currentCount: detail.currentCount
    }
  } catch {
    // 静默失败，不打断用户
  } finally {
    isSyncing = false
  }
}

function startPolling() {
  stopPolling()
  if (!activityId.value) return
  pollingTimer = setInterval(() => {
    silentSyncParticipants()
  }, POLLING_INTERVAL)
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

onShow(async () => {
  // 页面显示时刷新活动详情（可能用户从其他页面返回，需要更新报名状态）
  if (activityId.value) {
    // loadActivityDetail 内部会先调用 loadCurrentUser，确保数据顺序正确
    await loadActivityDetail()
  }
  
  // 检查存储标记，确保从其他页面返回时也能刷新
  if (uni.getStorageSync('activity_just_joined') || uni.getStorageSync('activity_just_left') || uni.getStorageSync('activity_just_updated')) {
    if (activityId.value) {
      await loadActivityDetail()
    }
  }

  // 启动定时轮询，每 10 秒自动刷新参与者列表
  startPolling()
})

onHide(() => {
  // 页面隐藏时停止轮询，避免后台无效请求
  stopPolling()
})

// 加载当前用户信息
async function loadCurrentUser() {
  currentUserLoading.value = true
  try {
    const { ok, openid } = await checkLogin()
    if (ok && openid) {
      const profile = await getProfile(openid)
      if (profile) {
        currentUser.value = { ...profile, openid } as User
      }
    }
  } catch (error) {
    console.error('加载当前用户信息失败:', error)
  } finally {
    currentUserLoading.value = false
  }
}

async function loadActivityDetail(forceRefresh = false) {
  loading.value = true

  // 先加载当前用户信息，确保能正确判断是否已报名
  await loadCurrentUser()

  // 1. 非强制刷新时优先用缓存；有缓存且含头像时才先展示（避免先占位再被云数据替换导致头像闪烁）
  if (!forceRefresh) {
    const activities = uni.getStorageSync('activity_detail_cache')
    if (activities && Array.isArray(activities)) {
      const found = activities.find((a: Activity) => a._id === activityId.value)
      if (found && found.hostAvatar) {
        const currentUserCache = getCurrentUserFromCache()
        activity.value = currentUserCache ? mergeCurrentUserAvatar(found, currentUserCache) : found
        loading.value = false
      }
    }
  }

  // 2. 从云函数获取最新数据（含已报名列表、发起人联系方式）
  try {
    const detail = await getActivityDetail(activityId.value)
    if (detail) {
      const prev = activity.value
      const detailAny = detail as Record<string, unknown>
      // NOTE: 始终使用云函数返回的最新 URL。
      // 旧逻辑 keepHostAvatar 会保留旧 temp URL（可能已过期），导致头像失效。
      const merged = {
        ...detail,
        // NOTE: 优先保留缓存的 hostAvatar URL，避免 URL 字符串变化触发图片重载闪烁
        // 仅当缓存无值时才采用云函数返回的新 URL
        hostAvatar: prev?.hostAvatar || detail.hostAvatar || ''
      } as Record<string, unknown>
      merged.hostRegion = detailAny.hostRegion
      merged.hostSignature = detailAny.hostSignature
      const oldParticipants = prev?.participants || []
      merged.participants = (detail.participants || []).map((p: Record<string, unknown>) => {
        const op = oldParticipants.find((x: { userId?: string }) => x.userId === p.userId)
        // NOTE: 与 hostAvatar 同理，优先保留缓存中已有的 http(s) URL，
        // 避免 URL 字符串变化（如 cloud:// → https://）触发图片重载闪烁
        const oldUrl = op?.avatarUrl
        const newUrl = p.avatarUrl as string
        const keepOld = oldUrl && String(oldUrl).startsWith('http')
        return {
          ...p,
          avatarUrl: keepOld ? oldUrl : (newUrl || oldUrl || ''),
          region: p.region,
          signature: p.signature
        }
      })
      // 报名后立即刷新时，云端可能尚未写入新报名记录，导致 detail.participants 不含当前用户；保留乐观更新中的当前用户，避免 hasJoined 变 false 从而看不到联系方式
      const currentOpenid = getCurrentOpenid()
      if (currentOpenid) {
        const inMerged = merged.participants.some((p: { userId?: string }) => p.userId === currentOpenid)
        const inPrev = oldParticipants.some((p: { userId?: string }) => p.userId === currentOpenid)
        if (!inMerged && inPrev) {
          const prevMe = oldParticipants.find((p: { userId?: string }) => p.userId === currentOpenid)
          if (prevMe) merged.participants = [...merged.participants, prevMe]
        }
      }
      // 个人页头像有修改时，用当前用户缓存头像覆盖发起人/报名人头像，与个人页/广场页同步
      const currentUserCache = getCurrentUserFromCache()
      const finalMerged = currentUserCache ? mergeCurrentUserAvatar(merged as Activity, currentUserCache) : merged
      ;(finalMerged as Record<string, unknown>).hostRegion = merged.hostRegion
      ;(finalMerged as Record<string, unknown>).hostSignature = merged.hostSignature
      activity.value = finalMerged as Activity
      // 更新缓存，便于从其他页返回时一致（缓存用合并后的数据，避免下次进入仍用旧 URL）
      const activities = uni.getStorageSync('activity_detail_cache') || []
      const idx = activities.findIndex((a: Activity) => a._id === activityId.value)
      const next = Array.isArray(activities) ? [...activities] : []
      if (idx >= 0) next[idx] = finalMerged
      else next.push(finalMerged)
      uni.setStorageSync('activity_detail_cache', next)
    }
  } catch (error) {
    console.warn('getActivityDetail 未部署或调用失败，使用缓存数据:', error)
    if (!activity.value) {
      uni.showToast({ title: '加载失败，请从广场进入活动', icon: 'none' })
    }
  }

  loading.value = false
  if (!activity.value) {
    uni.showToast({ title: '活动不存在', icon: 'none' })
  }
}

// DUPR水平选项（用于显示）
const duprLevels = [
  { label: '初级', value: '1.0-2.5', display: '初级 1.0-2.5' },
  { label: '中级', value: '3.0-3.5', display: '中级 3.0-3.5' },
  { label: '高级', value: '4.0-4.5', display: '高级 4.0-4.5' },
  { label: '专业级', value: '5.0+', display: '专业级 5.0+' },
]

// 获取DUPR显示文本
function getDuprDisplayText(duprValue?: string): string {
  if (!duprValue) return '未设置'
  const matchedLevel = duprLevels.find(level => level.value === duprValue)
  if (matchedLevel) {
    return matchedLevel.display
  }
  return duprValue
}

// 资料弹层：性别、DUPR 展示文案
const profileGenderText = computed(() => {
  const g = profileUser.value?.gender ?? 0
  if (g === 1) return '男'
  if (g === 2) return '女'
  return '未知'
})
const profileDuprText = computed(() => getDuprDisplayText(profileUser.value?.duprLevel))
const profileRegionText = computed(() => {
  const v = (profileUser.value as any)?.region
  return v != null && String(v).trim() !== '' ? String(v).trim() : '—'
})
const profileSignatureText = computed(() => {
  const v = (profileUser.value as any)?.signature
  return v != null && String(v).trim() !== '' ? String(v).trim() : '—'
})

const PROFILE_USER_CACHE = 'profile_user_cache'

// 点击头像：先用活动页已有数据立即展示资料卡，再后台拉取完整资料静默更新；当前用户优先用本地缓存补全地区/球风
function handleViewProfile(userId: string) {
  if (!userId || !activity.value) return
  const act = activity.value
  const actAny = act as Record<string, unknown>
  let initial: User
  let regionStr = ''
  let signatureStr = ''
  if (act.hostId === userId) {
    const r = actAny.hostRegion ?? (actAny as any).host_region
    const s = actAny.hostSignature ?? (actAny as any).host_signature
    regionStr = (r != null && String(r).trim() !== '') ? String(r).trim() : ''
    signatureStr = (s != null && String(s).trim() !== '') ? String(s).trim() : ''
    initial = {
      openid: userId,
      nickName: act.hostName || '微信用户',
      avatarUrl: act.hostAvatar || '',
      gender: (actAny.hostGender != null ? Number(actAny.hostGender) : 0) as 0 | 1 | 2,
      duprLevel: (actAny.hostDuprLevel != null && actAny.hostDuprLevel !== '') ? String(actAny.hostDuprLevel) : '',
      region: regionStr,
      signature: signatureStr
    } as User
  } else {
    const p = (act.participants || []).find((x: { userId?: string }) => x.userId === userId) as Record<string, unknown> | undefined
    const pr = p && (p.region ?? (p as any).region)
    const ps = p && (p.signature ?? (p as any).signature)
    regionStr = (pr != null && String(pr).trim() !== '') ? String(pr).trim() : ''
    signatureStr = (ps != null && String(ps).trim() !== '') ? String(ps).trim() : ''
    initial = {
      openid: userId,
      nickName: (p?.nickName as string) || '微信用户',
      avatarUrl: (p?.avatarUrl as string) || '',
      gender: (p && p.gender != null ? Number(p.gender) : 0) as 0 | 1 | 2,
      duprLevel: (p && p.duprLevel != null && p.duprLevel !== '') ? String(p.duprLevel) : '',
      region: regionStr,
      signature: signatureStr
    } as User
  }
  // 若点击的是当前用户，先用本地 profile 缓存补全地区、球风、性别、DUPR，避免云接口未返回时显示不全
  const currentOpenid = getCurrentOpenid()
  if (currentOpenid && currentOpenid === userId) {
    try {
      const cached = uni.getStorageSync(PROFILE_USER_CACHE) as Record<string, unknown> | null
      if (cached && typeof cached === 'object') {
        const r = (cached.region != null && cached.region !== '') ? String(cached.region) : ''
        const s = (cached.signature != null && cached.signature !== '') ? String(cached.signature) : ''
        const g = cached.gender != null ? Number(cached.gender) : initial.gender
        const d = (cached.duprLevel != null && cached.duprLevel !== '') ? String(cached.duprLevel) : (initial.duprLevel || '')
        if (r || s || g !== undefined || d) {
          initial = { ...initial, gender: g as 0 | 1 | 2, duprLevel: d, region: r, signature: s } as User
          regionStr = r
          signatureStr = s
        }
      }
    } catch (_) {}
  }
  const toShow = { ...initial } as Record<string, unknown>
  toShow.region = regionStr
  toShow.signature = signatureStr
  profileUser.value = toShow as User
  showProfileModal.value = true
  getProfile(userId).then((profile) => {
    if (!profile || profileUser.value?.openid !== userId) return
    const prev = profileUser.value
    const p = profile as Record<string, unknown>
    const region = (p.region != null && p.region !== '') ? String(p.region) : (prev && (prev as any).region ? String((prev as any).region) : '')
    const signature = (p.signature != null && p.signature !== '') ? String(p.signature) : (prev && (prev as any).signature ? String((prev as any).signature) : '')
    const merged = {
      ...profile,
      openid: userId,
      nickName: (profile.nickName ?? initial.nickName) || '微信用户',
      avatarUrl: initial.avatarUrl && String(initial.avatarUrl).startsWith('http') ? initial.avatarUrl : (profile.avatarUrl ?? initial.avatarUrl),
      gender: profile.gender ?? initial.gender,
      duprLevel: profile.duprLevel ?? initial.duprLevel ?? '',
      region,
      signature
    } as User
    const mergedAny = merged as Record<string, unknown>
    mergedAny.region = region
    mergedAny.signature = signature
    profileUser.value = merged as User
  }).catch((e) => {
    console.warn('获取用户资料失败', e)
  })
}

function closeProfileModal() {
  showProfileModal.value = false
  profileUser.value = null
}

/**
 * 点击弹层头像、调起微信内置大图预览
 */
function previewProfileAvatar() {
  const url = profileUser.value?.avatarUrl
  if (!url) return
  const src = getCloudImageUrl(url)
  // #ifdef MP-WEIXIN
  ;(wx as any).previewImage({ current: src, urls: [src] })
  // #endif
}

/**
 * 调起系统地图导航
 * 优先使用活动坐标，若无坐标则提示用户
 */
function handleNavigate() {
  const act = activity.value
  if (!act) return
  const lat = Number(act.latitude)
  const lng = Number(act.longitude)
  if (!lat || !lng) {
    uni.showToast({ title: '暂无坐标信息', icon: 'none' })
    return
  }
  const name = act.venueName || act.address || '活动地点'
  // #ifdef MP-WEIXIN
  ;(wx as any).openLocation({
    latitude: lat,
    longitude: lng,
    name,
    address: act.address || name,
    scale: 16
  })
  // #endif
  // #ifndef MP-WEIXIN
  // NOTE: 非微信小程序环境（H5 等）使用腾讯地图 URL 降级
  const url = `https://apis.map.qq.com/uri/v1/routeplan?type=drive&to=${encodeURIComponent(name)}&tocoord=${lat},${lng}&policy=1`
  uni.navigateTo({ url: `/pages/webview/index?url=${encodeURIComponent(url)}` })
  // #endif
}

// 点击立即报名：先弹出确认，确认后报名；报名成功后刷新详情即可看到发起人联系方式
function handleJoinTap() {
  if (joining.value || isFull.value || !activity.value) return
  uni.showModal({
    title: '确认报名',
    content: '确认报名参加该活动？报名成功后可见发起人联系方式。',
    success: (res) => {
      if (res.confirm) handleJoin()
    },
  })
}

// 立即报名（实际请求）
async function handleJoin() {
  if (!activity.value || !activityId.value) return
  
  // 检查登录状态
  const { ok } = await checkLogin()
  if (!ok) {
    uni.showToast({ title: '请先登录后再报名', icon: 'none', duration: 2500 })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/profile/index' })
    }, 500)
    return
  }

  // 检查是否已满
  if (isFull.value) {
    uni.showToast({ title: '报名已满', icon: 'none' })
    return
  }

  // 检查是否是创建者本人
  if (isHost.value) {
    uni.showToast({ title: '创建者无需报名', icon: 'none' })
    return
  }

  // 检查是否已报名（通过检查参与者列表中是否包含当前用户，且 status 为 'joined'）
  const currentOpenid = getCurrentOpenid()
  if (currentOpenid) {
    const isRegistered = participants.value.some(p => p.userId === currentOpenid)
    if (isRegistered) {
      uni.showToast({ title: '已报名过该活动', icon: 'none' })
      // 刷新活动详情以更新状态
      await loadActivityDetail()
      return
    }
  }

  joining.value = true

  try {
    const result = await joinActivity(activityId.value)
    if (result?.success === false) {
      uni.showToast({ title: result.message || '报名失败', icon: 'none' })
      return
    }

    uni.showToast({ title: '报名成功', icon: 'success' })
    uni.setStorageSync('activity_just_joined', true)
    uni.$emit('activity-joined', { activityId: activityId.value })

    const openid = getCurrentOpenid()
    // 乐观更新：立即把当前用户加入参与列表并保留 contactInfo，这样联系方式马上显示
    if (openid && activity.value) {
      const existing = activity.value.participants || []
      const alreadyIn = existing.some((p: { userId?: string }) => p.userId === openid)
      if (!alreadyIn) {
        const currentProfile = currentUser.value
        activity.value = {
          ...activity.value,
          participants: [...existing, { userId: openid, nickName: currentProfile?.nickName, avatarUrl: currentProfile?.avatarUrl }],
          currentCount: (activity.value.currentCount ?? 0) + 1
        }
      }
    }
    // 延迟后再从云拉取最新详情，避免数据库未同步导致 participants 不含当前用户
    await new Promise(r => setTimeout(r, 400))
    await loadActivityDetail(true)
    await loadCurrentUser()
  } catch (error: any) {
    console.error('报名失败:', error)
    uni.showToast({ title: error.errMsg || error.message || '报名失败', icon: 'none' })
  } finally {
    joining.value = false
  }
}


// 分享功能：转发到微信
onShareAppMessage(() => {
  if (!activity.value || !activityId.value) {
    return {
      title: '找匹克球搭子，上Dinknow',
      path: '/pages/index/index'
    }
  }

  const shareTitle = `${activity.value.title} | ${activity.value.venueName || activity.value.address} | ${dateTimeFullDisplay.value}`
  const shareDesc = activity.value.fee === 0 ? '免费活动，快来参加！' : `活动费用：${activity.value.fee}元/人，快来报名！`
  
  return {
    title: shareTitle,
    path: `/pages/activity-detail/index?id=${activityId.value}`,
    imageUrl: '/images/share-image.png' // 自定义分享图片的路径
  }
})

// 分享到朋友圈（可选）
onShareTimeline(() => {
  if (!activity.value || !activityId.value) {
    return {
      title: '找匹克球搭子，上Dinknow',
      query: ''
    }
  }

  const shareTitle = `${activity.value.title} | ${activity.value.venueName || activity.value.address} | ${dateTimeFullDisplay.value}`
  
  return {
    title: shareTitle,
    query: `id=${activityId.value}`,
    imageUrl: '/images/share-image.png'
  }
})
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: $ios-bg-secondary;
  // NOTE: 底部留白加高，为免责声明行 + 报名按钮的固定浮层留出足够空间
  padding-bottom: calc(120px + env(safe-area-inset-bottom));
}

.loading-container,
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  color: $ios-text-tertiary;
}

.activity-detail {
  padding: $ios-spacing-lg;
}

/* 第一部分：按发起页顺序的信息区 */
.detail-info-section {
  margin-bottom: $ios-spacing-md;
}

.detail-info-card {
  background: $ios-bg-primary;
  border-radius: $ios-radius-lg;
  padding: 0 $ios-spacing-lg;
  box-shadow: $ios-shadow-md;
  overflow: hidden;
}

.detail-row {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 6px 0;
  border-bottom: 0.5px solid $ios-separator;

  &:last-child {
    border-bottom: none;
  }

  &--initiator {
    align-items: center;
  }
}

.detail-label {
  width: 84px;
  flex-shrink: 0;
  font-size: 15px;
  color: $ios-text-secondary;
}

.detail-value {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  color: $ios-text-primary;

  &--muted {
    color: $ios-text-tertiary;
  }

  &--desc {
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-all;
  }

  // NOTE: 地点文字有导航按钮时缩短，防止溢出
  &--location {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &--initiator {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

// NOTE: 地点导航按钮：绿色胶囊形，包含导航图标和文字
.navigate-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 3px;
  background: #34c759;
  border-radius: 12px;
  padding: 3px 10px;
  margin-left: 8px;

  &:active {
    opacity: 0.75;
  }
}

.navigate-icon {
  font-size: 13px;
  line-height: 1;
}

.navigate-text {
  font-size: 13px;
  color: #ffffff;
  font-weight: 500;
}

.detail-initiator-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  background: $ios-bg-tertiary;
  // NOTE: 轻阴影区分白色头像，与广场页保持一致
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  // NOTE: 平滑过渡，用户切换 URL 时不闪烁
  transition: opacity 0.2s ease;

  &--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }
}

.detail-initiator-name {
  font-size: 15px;
  color: $ios-text-primary;
}

.participants-section {
  background: $ios-bg-primary;
  border-radius: $ios-radius-lg;
  padding: $ios-spacing-lg;
  margin-bottom: $ios-spacing-md;
  // NOTE: 防止头像超出卡片边界，隐藏滚动条
  overflow: hidden;
}

.section-title {
  font-size: 16px;
  color: $ios-text-primary;
  margin-bottom: 16px;
  display: block;
}

// NOTE: 固定 5 列网格，与广场页一致，用 rpx 保证不同屏幕等比缩放
.participants-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  justify-items: center;
  gap: 24rpx;
}

.participant-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  // NOTE: 宽度自适应 grid 列宽，不再固定 80px，防止超出卡片
  width: 100%;
  max-width: 80px;
  cursor: pointer;
  // NOTE: 新报名时头像平滑淡入
  animation: avatarFadeIn 0.8s ease;

  &:active {
    opacity: 0.7;
  }

  // NOTE: 退出时头像平滑淡出
  &--leaving {
    animation: avatarFadeOut 0.8s ease forwards;
    pointer-events: none;
  }
}

@keyframes avatarFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes avatarFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

.participant-avatar-container {
  position: relative;
  margin-bottom: 8px;
  // NOTE: 圆形裁切，使发起人半圆徽章不超出头像范围
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
}

.participant-avatar-large {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: $ios-bg-tertiary;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  // NOTE: 平滑过渡，与发起人头像一致，避免 URL 变化时闪烁
  transition: opacity 0.2s ease;
}

.participant-avatar-placeholder-large {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: $ios-bg-tertiary;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-placeholder-icon {
  font-size: 28px;
  opacity: 0.4;
}

// NOTE: 发起人半圆徽章，与个人页 profile-edit-badge 完全一致
.host-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 22px;
  background: rgba(100, 100, 108, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #ffffff;
  white-space: nowrap;
}

.participant-name-large {
  font-size: 13px;
  color: $ios-text-primary;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 参与人员超出 16 个时的省略展示（+N），与广场页活动卡一致 */
.participant-item--overflow {
  cursor: default;
  pointer-events: none;
}
.participant-avatar-container--overflow {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid $ios-separator;
  background: $ios-bg-tertiary;
  display: flex;
  align-items: center;
  justify-content: center;
}
.participant-overflow-text {
  font-size: 14px;
  font-weight: 600;
  color: $ios-text-secondary;
}
.participant-name-large--overflow {
  color: $ios-text-tertiary;
}

// 用户资料弹窗
.profile-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $ios-spacing-lg;
}

.profile-modal {
  width: 100%;
  max-width: 400px;
  background: $ios-bg-primary;
  border-radius: $ios-radius-lg;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.profile-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $ios-spacing-lg;
  border-bottom: 1px solid $ios-separator;
}

.profile-modal-title {
  font-size: 18px;
  font-weight: $ios-font-weight-semibold;
  color: $ios-text-primary;
}

.profile-modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:active {
    opacity: 0.7;
  }
}

.close-icon {
  font-size: 28px;
  color: $ios-text-tertiary;
  line-height: 1;
}

.profile-modal-content {
  padding: $ios-spacing-lg;
}

.profile-avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: $ios-spacing-lg;
}

.profile-modal-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 3px solid $ios-separator;
  background: $ios-bg-tertiary;
}

.profile-modal-avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: $ios-bg-tertiary;
  border: 3px solid $ios-separator;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-placeholder-icon-large {
  font-size: 40px;
  opacity: 0.4;
}

.profile-info-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile-info-label {
  font-size: 13px;
  color: $ios-text-tertiary;
  font-weight: $ios-font-weight-medium;
}

.profile-info-value {
  font-size: 16px;
  color: $ios-text-primary;
  font-weight: $ios-font-weight-regular;
}

.profile-loading {
  text-align: center;
  padding: $ios-spacing-xl;
  color: $ios-text-tertiary;
  font-size: 15px;
}

// 立即报名按钮
.join-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $ios-bg-primary;
  padding: $ios-spacing-md $ios-spacing-lg;
  padding-bottom: calc($ios-spacing-md + env(safe-area-inset-bottom));
  border-top: 1px solid $ios-separator;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.join-btn {
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%);
  color: #fff;
  font-size: 17px;
  font-weight: $ios-font-weight-semibold;
  border-radius: 25px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  transition: all 0.2s ease;

  &::after {
    border: none;
  }

  &:active:not([disabled]) {
    opacity: 0.85;
    transform: scale(0.98);
  }

  &[disabled] {
    background: $ios-bg-tertiary;
    color: $ios-text-tertiary;
    box-shadow: none;
    opacity: 0.6;
  }
}

// NOTE: 免责声明行样式，与 create-activity 页完全一致
.join-disclaimer-row {
  display: flex;
  align-items: center;
  padding: $ios-spacing-xs $ios-spacing-lg;
  margin-bottom: $ios-spacing-xs;
}

.join-disclaimer-checkbox {
  width: 22px;
  height: 22px;
  margin-right: 8px;
  flex-shrink: 0;
}

.join-disclaimer-inner {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid $ios-separator;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &--checked {
    background: $ios-blue;
    border-color: $ios-blue;
  }
}

.join-disclaimer-check-icon {
  font-size: 13px;
  color: #ffffff;
  line-height: 1;
}

.join-disclaimer-label {
  font-size: 13px;
  color: $ios-text-secondary;
}

.join-disclaimer-link {
  font-size: 13px;
  color: $ios-blue;
  font-weight: $ios-font-weight-medium;
}

</style>
