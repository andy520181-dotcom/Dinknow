<template>
  <view class="activity-card" :class="{ 'activity-card--has-actions': variant === 'my-created' }">
    <view class="card-top-right">
      <slot name="topRight">
        <button
          class="share-btn"
          :class="{ 'share-btn--disabled': isEnded || isFull }"
          :disabled="isEnded || isFull"
          open-type="share"
          @tap="onShareTap"
        >
          <text class="share-btn-dots">⋯</text>
        </button>
      </slot>
    </view>

    <!-- 上半部分：发起人头像 + 报名人员头像，最多 15 个（5列×3行），超出用 +N 省略 -->
    <view v-if="displayedParticipants.length > 0 || overflowCount > 0" class="card-avatars-section">
      <view
        v-for="(participant, idx) in displayedParticipants"
        :key="participant.userId || idx"
        class="card-avatar-item"
        :class="{ 'card-avatar-item--host': participant.isHost }"
      >
        <view class="card-avatar-wrap">
          <image
            v-if="participant.avatarUrl && String(participant.avatarUrl).trim()"
            :src="String(participant.avatarUrl)"
            class="card-avatar-img"
            mode="aspectFill"
          />
          <view v-else class="card-avatar-placeholder">
            <text class="card-avatar-icon">👤</text>
          </view>
        </view>
        <text class="card-avatar-name">{{ participant.nickName || '微信用户' }}</text>
      </view>
      <view v-if="overflowCount > 0" class="card-avatar-item card-avatar-item--overflow">
        <view class="card-avatar-wrap card-avatar-wrap--overflow">
          <text class="card-avatar-overflow-text">+{{ overflowCount }}</text>
        </view>
        <text class="card-avatar-name card-avatar-name--overflow">更多</text>
      </view>
    </view>

    <!-- 头像与文案之间的分割线 -->
    <view v-if="displayedParticipants.length > 0 || overflowCount > 0" class="card-divider" />

    <!-- 下半部分：活动信息内容 -->
    <ActivityCardContent :activity="activity" ref="cardContentRef">
      <template #footerRight>
        <slot name="footer">
          <!-- 默认：立即报名按钮（广场页） -->
          <button
            class="join-btn"
            :class="{ 'join-btn--disabled': isEnded || isFull }"
            :disabled="isEnded || isFull"
            @tap="handleJoinClick"
          >
            <text class="join-text-in-btn">{{ getButtonText }}</text>
          </button>
        </slot>
      </template>
    </ActivityCardContent>
  </view>
</template>

<script setup lang="ts">
import type { Activity } from '../types'
import { isActivityEnded } from '../utils/activity'
import { computed, ref, watch, onMounted } from 'vue'
import { checkLogin } from '../services/user'
import { getCloudImageUrl, getTempFileURLs } from '../services/cloud'
import ActivityCardContent from './ActivityCardContent.vue'

const props = withDefaults(
  defineProps<{
    activity: Activity
    /** 卡片变体：广场 | 我参加的 | 我发起的（影响标题右侧留白等） */
    variant?: 'square' | 'my-joined' | 'my-created'
  }>(),
  { variant: 'square' }
)

// 组件挂载时输出调试信息
onMounted(() => {
  if (props.activity?._id) {
    try {
      console.log(`[ActivityCard] 组件挂载，活动 ${props.activity._id}:`, {
        hostId: props.activity.hostId,
        hostAvatar: props.activity.hostAvatar ? '有' : '无',
        participantsCount: props.activity.participants?.length || 0,
        participants: props.activity.participants || [],
        currentCount: props.activity.currentCount,
        computedParticipantsCount: participants.value?.length || 0
      })
    } catch (e) {
      console.error('[ActivityCard] 调试日志错误:', e)
    }
  }
})

// 监听活动数据变化，用于调试
watch(() => props.activity, (newActivity) => {
  if (newActivity?._id) {
    try {
      console.log(`[ActivityCard] 活动 ${newActivity._id} 数据更新:`, {
        hostId: newActivity.hostId,
        hostAvatar: newActivity.hostAvatar ? '有' : '无',
        participantsCount: newActivity.participants?.length || 0,
        participants: newActivity.participants || [],
        currentCount: newActivity.currentCount,
        computedParticipantsCount: participants.value?.length || 0
      })
    } catch (e) {
      console.error('[ActivityCard] 调试日志错误:', e)
    }
  }
}, { immediate: false, deep: true })

const emit = defineEmits<{
  join: []
  detail: []
  shareClick: [activity: Activity]
}>()

const cardContentRef = ref<InstanceType<typeof ActivityCardContent> | null>(null)

function onShareTap() {
  emit('shareClick', props.activity)
}

// 与 ActivityCardContent 一致：使用共享 isActivityEnded（支持 ISO 日期、1 分钟缓冲）
const isEnded = computed(() => isActivityEnded(props.activity))

const isFull = computed(() => {
  return cardContentRef.value?.isFull ?? false
})

const getButtonText = computed(() => {
  if (isEnded.value) return '已结束'
  if (isFull.value) return '报名已满'
  return '立即报名'
})

// 头像 URL 映射（用于存储临时 URL）
const avatarUrlMap = ref<Record<string, string>>({})

// 获取并缓存头像的临时 URL；已有缓存或已是 https 的不再覆盖，避免刷新时换链导致闪烁
async function loadAvatarUrls() {
  const isCloudId = (id: string) => typeof id === 'string' && id.startsWith('cloud://')
  const fileIDs: string[] = []
  const map = avatarUrlMap.value

  if (props.activity?.hostAvatar && isCloudId(props.activity.hostAvatar) && !map[props.activity.hostAvatar]) {
    fileIDs.push(props.activity.hostAvatar)
  }
  if (props.activity?.participants) {
    props.activity.participants.forEach((p: { avatarUrl?: string }) => {
      if (p?.avatarUrl && isCloudId(p.avatarUrl) && !map[p.avatarUrl]) {
        fileIDs.push(p.avatarUrl)
      }
    })
  }

  if (fileIDs.length === 0) return
  try {
    const urlMap = await getTempFileURLs(fileIDs)
    const next = { ...avatarUrlMap.value }
    Object.entries(urlMap).forEach(([fid, url]) => {
      if (!next[fid] || !String(next[fid]).startsWith('http')) next[fid] = url
    })
    avatarUrlMap.value = next
  } catch (e) {
    console.error('[ActivityCard] 加载头像临时 URL 失败:', e)
  }
}

// 解析展示用头像 URL：已是 http(s) 直接返回，cloud:// 用 map 或 getCloudImageUrl，保证我参加的/我发起的等页能显示
function getDisplayAvatarUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return avatarUrlMap.value[url] || getCloudImageUrl(url) || url
}

// 已报名用户列表（包括创建者）
const participants = computed(() => {
  const list: Array<{ userId: string; avatarUrl?: string; nickName?: string; isHost?: boolean }> = []

  try {
    if (props.activity?.hostId) {
      const rawHost = props.activity?.hostAvatar
      const avatarUrl = rawHost ? getDisplayAvatarUrl(rawHost) : ''
      list.push({
        userId: props.activity.hostId,
        avatarUrl: avatarUrl || undefined,
        nickName: props.activity.hostName || '微信用户',
        isHost: true
      })
    }

    const joined = (props.activity?.participants || []).map((p: { userId?: string; avatarUrl?: string; nickName?: string }) => {
      const raw = p?.avatarUrl
      const avatarUrl = raw ? getDisplayAvatarUrl(raw) : ''
      return {
        ...p,
        avatarUrl: avatarUrl || undefined
      }
    })
    list.push(...joined)
  } catch (e) {
    console.error('[ActivityCard] participants computed 错误:', e)
  }

  return list
})

/** 活动卡最多展示的头像数量，超出用 +N 省略 */
const MAX_AVATAR_DISPLAY = 15

/** 用于展示的头像列表（最多 15 个，5列×3行） */
const displayedParticipants = computed(() => {
  const list = participants.value
  return list.slice(0, MAX_AVATAR_DISPLAY)
})

/** 超出 15 个后的多出人数（发起人 + 已报名总数 - 15） */
const overflowCount = computed(() => {
  const total = props.activity
    ? 1 + (props.activity.currentCount ?? 0)
    : 0
  return Math.max(0, total - MAX_AVATAR_DISPLAY)
})

// 监听活动数据变化，加载头像临时 URL
watch(() => props.activity, async (newActivity) => {
  if (newActivity?._id) {
    await loadAvatarUrls()
  }
}, { immediate: true })

async function handleJoinClick() {
  if (!props.activity._id || isEnded.value) return
  const { ok } = await checkLogin()
  if (!ok) {
    uni.showToast({ title: '请先登录后再报名参加活动', icon: 'none', duration: 2500 })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/profile/index' })
    }, 500)
    return
  }
  const activities = uni.getStorageSync('activity_detail_cache') || []
  const existingIndex = activities.findIndex((a: any) => a._id === props.activity._id)
  if (existingIndex >= 0) {
    activities[existingIndex] = props.activity
  } else {
    activities.push(props.activity)
  }
  uni.setStorageSync('activity_detail_cache', activities)
  uni.navigateTo({
    url: `/pages/activity-detail/index?id=${props.activity._id}`
  })
}
</script>

<style lang="scss" scoped>
.activity-card {
  position: relative;
  display: block;
  background: $ios-bg-primary;
  border-radius: $ios-radius-lg;
  padding: $ios-spacing-lg;
  margin-bottom: $ios-spacing-md;
  box-shadow: $ios-shadow-md;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.99);
    box-shadow: $ios-shadow-sm;
  }
}

.card-top-right {
  position: absolute;
  top: $ios-spacing-md;
  right: $ios-spacing-md;
  z-index: 1;
}

.share-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: 24px;
  height: 24px;
  min-height: 24px;
  background: transparent;
  border-radius: 50%;
  border: none;
  &::after { border: none; }
  &:active { opacity: 0.6; }

  // NOTE: 已结束活动的分享按钮置灰不可用
  &--disabled {
    opacity: 0.35;
    pointer-events: none;
  }
}

.share-btn-dots {
  font-size: 24px;
  color: #333333;
  line-height: 1;
}

:deep(.activity-title) {
  padding-right: 32px;
}

.activity-card--has-actions :deep(.activity-title) {
  padding-right: 100px;
}

/* 上半部分：发起人 + 报名人员头像 */
// NOTE: 固定 5 列网格，用 rpx 保证不同屏幕等比缩放
.card-avatars-section {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  justify-items: center;
  gap: 24rpx;
}

/* 头像与文案之间的分割线 */
.card-divider {
  height: 0.5px;
  margin: $ios-spacing-md 0;
  background: rgba(0, 0, 0, 0.04);
}

.card-avatar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.card-avatar-wrap {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: visible;
  flex-shrink: 0;
  /* 避免白色头像与白底融合：轻阴影保证圆形轮廓清晰 */
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.card-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: block;
}

.card-avatar-placeholder {
  width: 100%;
  height: 100%;
  background: $ios-bg-tertiary;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-avatar-icon {
  font-size: 24px;
  color: $ios-text-tertiary;
}

.card-avatar-name {
  margin-top: 4px;
  font-size: 12px;
  color: $ios-text-secondary;
  text-align: center;
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 超出 15 个头像时的省略展示（+N） */
.card-avatar-item--overflow {
  cursor: default;
}
.card-avatar-wrap--overflow {
  background: $ios-bg-tertiary;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-avatar-overflow-text {
  font-size: 13px;
  font-weight: 600;
  color: $ios-text-secondary;
}
.card-avatar-name--overflow {
  color: $ios-text-tertiary;
}

// NOTE: 报名按钮内联在第二行右侧，改为紧凑小胶囊形式
.join-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: auto;
  padding: 0 14px;
  height: 30px;
  min-height: 30px;
  background: linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%);
  color: #fff;
  font-size: 13px;
  font-weight: $ios-font-weight-semibold;
  border-radius: 15px;
  border: none;
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.28);
  line-height: 1;

  &::after {
    border: none;
  }

  &:active {
    opacity: 0.85;
    transform: scale(0.97);
  }

  &.join-btn--disabled {
    background: $ios-bg-tertiary;
    color: $ios-text-tertiary;
    box-shadow: none;
    opacity: 1;

    .join-text-in-btn {
      color: $ios-text-tertiary;
    }
  }
}

.join-text-in-btn {
  font-size: 13px;
  font-weight: $ios-font-weight-semibold;
  color: #fff;
}
</style>
