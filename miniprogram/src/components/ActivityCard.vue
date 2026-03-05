<template>
  <view class="activity-card" :class="{ 'activity-card--ended': isEnded }">

    <!-- ── 上段：头像（左）+ 活动信息（右） ── -->
    <view class="card-header">
      <!-- 上段：头像 60px -->
      <view class="host-avatar-wrap">
        <image
          v-if="hostAvatarUrl"
          :src="hostAvatarUrl"
          class="host-avatar-img"
          mode="aspectFill"
        />
        <view v-else class="host-avatar-placeholder">
          <text class="host-avatar-icon">👤</text>
        </view>
      </view>

      <!-- 活动信息块（右）：标题 / 时间地点 / 标签 -->
      <view class="card-info-block">
        <!-- 标题行：标题（左）+ 费用（右） -->
        <view class="card-title-row">
          <text class="card-title">{{ activity.title }}</text>
          <text class="card-fee-highlight">{{ feeText }}</text>
        </view>

        <!-- 时间 + 地点：纯文字，无图标，强制单行省略 -->
        <view class="info-row info-row--nowrap">
          <text class="info-text info-text--ellipsis">{{ dateTimeFull }}</text>
          <text class="info-sep-dot">·</text>
          <text class="info-text info-text--ellipsis">{{ activity.venueName || activity.address || '—' }}</text>
        </view>

        <!-- 矩形圆角标签行：DUPR / 人数 -->
        <view class="card-tags-row">
          <text v-if="duprLevel" class="card-tag">{{ duprLevel }}</text>
          <text class="card-tag">{{ activity.maxParticipants }}人</text>
        </view>
      </view>
    </view>

    <!-- NOTE: 下段：昵称（左）+ 发布时间（中）+ 距离（右，无背景框） -->
    <view class="card-header-footer">
      <view class="host-avatar-label">
        <text class="host-nickname">{{ activity.hostName || '匹克球友' }}</text>
      </view>
      <text
        v-if="publishedAgo"
        class="host-published-ago"
        :class="{ 'host-published-ago--recent': isRecentPublish }"
      >{{ publishedAgo }}</text>
      <text v-if="props.distanceKm != null" class="footer-distance">距离{{ props.distanceKm }}km</text>
    </view>

    <!-- 分割线 -->
    <view class="card-divider" />

    <!-- ── 报名人员头像网格 + 报名按钮 ── -->
    <view class="card-footer">
      <!-- 报名人员头像网格：5列，最多3行（15个），超出+N -->
      <view class="participants-grid">
        <view
          v-for="(p, idx) in displayedParticipants"
          :key="p.userId || idx"
          class="participant-item"
        >
          <view class="participant-avatar-wrap">
            <image
              v-if="p.avatarUrl && String(p.avatarUrl).trim()"
              :src="String(p.avatarUrl)"
              class="participant-avatar-img"
              mode="aspectFill"
            />
            <view v-else class="participant-avatar-placeholder">
              <text class="participant-avatar-icon">👤</text>
            </view>
          </view>
          <text class="participant-nickname">{{ p.nickName || '匹克球友' }}</text>
        </view>

        <!-- "+" 占位圆：Dinknow 品牌文字叠底，+ 号叠加前景 -->
        <view v-if="showAddSlot && !overflowCount" class="participant-item">
          <view class="participant-add-slot">
            <text class="participant-add-text">+</text>
          </view>
          <text class="participant-nickname"></text>
        </view>

        <!-- 超出15个时显示 +N -->
        <view v-if="overflowCount > 0" class="participant-item">
          <view class="participant-overflow-slot">
            <text class="participant-overflow-text">+{{ overflowCount }}</text>
          </view>
          <text class="participant-nickname"></text>
        </view>
      </view>

      <!-- 报名按钮 + 三点菜单（右侧） -->
      <view class="footer-actions">
        <slot name="footer">
          <button
            v-if="!props.isOwner && !props.showLeave"
            class="join-btn"
            :class="{ 'join-btn--disabled': isEnded || isFull }"
            :disabled="isEnded || isFull"
            @tap="handleJoinClick"
          >
            <text class="join-text-in-btn">{{ joinButtonText }}</text>
          </button>
        </slot>
        <!-- NOTE: 三点菜单：仅发起人（编辑/删除）和参与者（退出）显示，路人不显示 -->
        <slot name="topRight">
          <view v-if="props.isOwner" class="share-btn" @tap.stop="showOwnerMenu">
            <text class="share-btn-dots">⋯</text>
          </view>
          <view v-else-if="props.showLeave" class="share-btn" @tap.stop="showJoinedMenu">
            <text class="share-btn-dots">⋯</text>
          </view>
        </slot>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import type { Activity } from '../types'
import { isActivityEnded, isActivityInProgress, parseActivityDate } from '../utils/activity'
import { computed, ref, watch, onMounted } from 'vue'
import { checkLogin } from '../services/user'
import { getCloudImageUrl, getTempFileURLs } from '../services/cloud'

const props = withDefaults(
  defineProps<{
    activity: Activity
    variant?: 'square' | 'my-joined' | 'my-created'
    distanceKm?: number | null
    /** 是否为当前用户发起的活动 */
    isOwner?: boolean
    /** 是否为当前用户参加的活动（显示退出菜单） */
    showLeave?: boolean
  }>(),
  { variant: 'square', distanceKm: null, isOwner: false, showLeave: false }
)

const emit = defineEmits<{
  join: []
  detail: []
  shareClick: [activity: Activity]
  edit: [activity: Activity]
  delete: [activity: Activity]
  leave: [activity: Activity]
}>()

/** 参加者三点菜单 */
function showJoinedMenu() {
  // NOTE: 进行中：活动正在发生，参与记录对发起人可见，不允许任何操作
  if (isActivityInProgress(props.activity)) {
    uni.showToast({ title: '活动正在进行中，无法操作', icon: 'none' })
    return
  }
  // NOTE: 已结束：不能撤回报名，但允许用户删除该历史记录
  if (isEnded.value) {
    uni.showActionSheet({
      itemList: ['删除活动'],
      success: (res) => {
        if (res.tapIndex === 0) emit('leave', props.activity)
      }
    })
    return
  }
  // NOTE: 未开始：正常退出报名流程
  uni.showActionSheet({
    itemList: ['退出活动'],
    success: (res) => {
      if (res.tapIndex === 0) emit('leave', props.activity)
    }
  })
}

/** 发起人三点菜单：编辑 / 删除 / 分享 */
function showOwnerMenu() {
  const ended = isEnded.value
  const items = ended
    ? ['删除活动']
    : ['编辑活动', '删除活动']

  uni.showActionSheet({
    itemList: items,
    success: (res) => {
      if (ended) {
        if (res.tapIndex === 0) emit('delete', props.activity)
      } else {
        if (res.tapIndex === 0) emit('edit', props.activity)
        else if (res.tapIndex === 1) emit('delete', props.activity)
      }
    }
  })
}

// ── 调试日志 ──────────────────────────────────────────
onMounted(() => {
  if (props.activity?._id) {
    try {
      console.log(`[ActivityCard] 组件挂载，活动 ${props.activity._id}:`, {
        hostId: props.activity.hostId,
        hostAvatar: props.activity.hostAvatar ? '有' : '无',
        participantsCount: props.activity.participants?.length || 0,
        currentCount: props.activity.currentCount
      })
    } catch (e) {
      console.error('[ActivityCard] 调试日志错误:', e)
    }
  }
})

// ── 时间/日期计算 ─────────────────────────────────────
const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function addOneHour(timeStr: string): string {
  const part = (timeStr || '00:00').trim().slice(0, 5)
  const [h, m] = part.split(':').map(Number)
  const mins = (h * 60 + (m || 0) + 60) % (24 * 60)
  const nh = Math.floor(mins / 60)
  const nm = mins % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

const dateTimeFull = computed(() => {
  const parsed = parseActivityDate(props.activity)
  const startTime = props.activity.startTime || '00:00'
  const endTime = props.activity.endTime
  const startPart = startTime.length <= 5 ? startTime : startTime.slice(0, 5)
  const endPart =
    endTime && String(endTime).trim() && String(endTime).trim() !== startPart
      ? String(endTime).trim().length <= 5
        ? String(endTime).trim()
        : String(endTime).trim().slice(0, 5)
      : addOneHour(startPart)
  const timeRange = `${startPart}-${endPart}`
  if (!parsed) return timeRange
  const actDate = new Date(parsed.y, parsed.m - 1, parsed.day)
  const weekday = weekdays[actDate.getDay()] ?? ''
  return `${parsed.m}月${parsed.day}日 ${weekday} ${timeRange}`
})

// ── 费用文字 ─────────────────────────────────────────
const feeText = computed(() => {
  const fee = props.activity.fee
  if (fee === undefined || fee === null) return '—'
  // NOTE: -1 是 AA 模式约定值
  if (fee === -1) return 'AA'
  return fee === 0 ? '免费' : `${fee}元/人`
})

// ── DUPR 等级 ────────────────────────────────────────
const duprLevel = computed(() => {
  const level = (props.activity as any).duprLevel
  return level || null
})

// ── 活动状态 ─────────────────────────────────────────
const isEnded = computed(() => isActivityEnded(props.activity))

// NOTE: 将 createdAt 时间戳转为相对时间描述，如"3小时前发布"/"昨天发布"
const publishedAgo = computed(() => {
  const ts = (props.activity as any).createdAt
  if (!ts) return ''
  // NOTE: 精确到秒级计算，使用毫秒差值
  const diffMs = Date.now() - Number(ts)
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60)  return '刚刚发布'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前发布`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)   return `${hours}小时前发布`
  const days = Math.floor(hours / 24)
  if (days === 1)   return '昨天发布'
  if (days < 30)    return `${days}天前发布`
  const months = Math.floor(days / 30)
  if (months < 12)  return `${months}个月前发布`
  return `${Math.floor(months / 12)}年前发布`
})

// NOTE: 12小时（含）以内发布 → 绿色高亮，超过12小时 → 默认灰色
const RECENT_THRESHOLD_MS = 12 * 60 * 60 * 1000
const isRecentPublish = computed(() => {
  const ts = (props.activity as any).createdAt
  if (!ts) return false
  return (Date.now() - Number(ts)) <= RECENT_THRESHOLD_MS
})

// NOTE: 根据活动类型计算可报名名额（不含发起人）
const availableSlots = computed(() => {
  const actType = props.activity.activityType || '不限'
  if (actType === '单打') return 1
  if (actType === '双打' || actType === '混双') return 3
  return props.activity.maxParticipants - 1
})

const registeredCount = computed(() => props.activity.currentCount ?? 0)

const isFull = computed(() => registeredCount.value >= availableSlots.value)

const joinButtonText = computed(() => {
  if (isEnded.value) return '已结束'
  if (isFull.value) return '报名已满'
  return '立即报名'
})

// ── 头像 URL 管理 ─────────────────────────────────────
/** cloud:// → 临时 URL 缓存映射，避免刷新时闪烁 */
const avatarUrlMap = ref<Record<string, string>>({})

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

function getDisplayAvatarUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return avatarUrlMap.value[url] || getCloudImageUrl(url) || url
}

watch(
  () => props.activity,
  async (newActivity) => {
    if (newActivity?._id) await loadAvatarUrls()
  },
  { immediate: true }
)

// ── 发起人头像 URL ────────────────────────────────────
const hostAvatarUrl = computed(() => getDisplayAvatarUrl(props.activity?.hostAvatar))

// ── 报名用户头像列表（不含发起人） ───────────────────────
// NOTE: 5列×3行最多展示15个，超出显示+N占位
const MAX_PARTICIPANT_DISPLAY = 15

const participantList = computed(() => {
  const list = (props.activity?.participants || []).map((p: { userId?: string; avatarUrl?: string; nickName?: string }) => ({
    userId: p?.userId || '',
    avatarUrl: p?.avatarUrl ? getDisplayAvatarUrl(p.avatarUrl) : '',
    nickName: p?.nickName || ''
  }))
  return list
})

const displayedParticipants = computed(() => participantList.value.slice(0, MAX_PARTICIPANT_DISPLAY))

/** 超出最大显示数量的剩余数，展示 +N */
const overflowCount = computed(() => {
  const total = participantList.value.length
  return total > MAX_PARTICIPANT_DISPLAY ? total - MAX_PARTICIPANT_DISPLAY : 0
})

// NOTE: 未满额且未超出15个时显示"+"占位
// NOTE: 只要名额未满就显示 "+" 占位圆，包括已结束的活动（让用户看到还有空位）
const showAddSlot = computed(() => !isFull.value)

// ── 操作 ──────────────────────────────────────────────
function onShareTap() {
  emit('shareClick', props.activity)
}

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
// ── 卡片容器 ──────────────────────────────────────────
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

  // NOTE: 已结束活动背景保持白色，不做特殊处理
  &--ended {}
}

// ── 上段：头像 + 信息块横排 ──────────────────────────
.card-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

// NOTE: 下段：昵称和发布时间在同一 flex 行，与上段相同的 gap 和左边距
// 保证昵称在头像正下方、发布时间在信息块正下方，像素级对齐
.card-header-footer {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

// NOTE: 宽度与 head-avatar-wrap 的 60px 精确相同，昵称居中居于头像正下方
.host-avatar-label {
  width: 60px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

// NOTE: 距离，无背景框，灰色小字，margin-left:auto 推到最右侧
.footer-distance {
  margin-left: auto;
  font-size: 10px;
  color: $ios-text-tertiary;
  white-space: nowrap;
  flex-shrink: 0;
}

// 发起人头像
.host-avatar-wrap {
  position: relative;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 50%;
  // NOTE: hidden 使底部「发起人」条随头像圆形裁切，与详情页保持一致
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

// NOTE: 昵称 + 发布时间强制同行，小程序不支持 inline-flex 故用 flex-direction:row
.host-name-row {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 3px;
}

// 发起人昵称，完整显示
.host-nickname {
  font-size: 10px;
  color: $ios-text-secondary;
  white-space: nowrap;
  line-height: 1.2;
}

// NOTE: 发布时间，昵称下方，极小灰字，低视觉权重
.host-published-at {
  font-size: 10px;
  color: $ios-text-tertiary;
  text-align: center;
  max-width: 56px;
  line-height: 1.2;
  white-space: nowrap;
}

// NOTE: 发布时间显示在 host-avatar-col 底部，与右侧 DUPR 标签行水平对齐
.host-published-ago {
  font-size: 10px;
  color: $ios-text-tertiary;
  text-align: center;
  max-width: 60px;
  line-height: 1.2;
  white-space: nowrap;

  // NOTE: 12小时内发布 → 绿色高亮
  &--recent {
    color: #34C759;
  }
}

.host-avatar-img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: block;
}

.host-avatar-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: $ios-bg-tertiary;
  display: flex;
  align-items: center;
  justify-content: center;
}

.host-avatar-icon {
  font-size: 24px;
}

// Host 徽标 — 低调展示，不突出
.host-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 16px;
  background: rgba(0, 0, 0, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
}

.host-badge-text {
  font-size: 10px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1;
  white-space: nowrap;
}

// 活动信息块（标题 + 两行信息）
.card-info-block {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

// 标题行：标题（左）+ 费用（右）
.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  overflow: hidden;
  gap: 8px;
}

// NOTE: 发布时间，紧跟昵称同行显示
.host-published-time {
  font-size: 10px;
  color: $ios-text-tertiary;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1.2;

  // NOTE: 12小时内发布 → 绿色高亮
  &--recent {
    color: #34C759;
  }
}

// NOTE: 圆角标签行，小间距横排
.card-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

// NOTE: 浅灰背景矩形圆角标签，费用/人数/DUPR 共用
.card-tag {
  display: inline-block;
  background: #F2F2F7;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
  color: $ios-text-secondary;
  white-space: nowrap;
  line-height: 1.6;

  &--distance {
    color: $ios-text-tertiary;
  }
}

// 标题样式
.card-title {
  font-size: 16px;
  font-weight: $ios-font-weight-semibold;
  color: #1a1a1a;
  line-height: 1.4;
  letter-spacing: -0.2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

// NOTE: 费用突出显示：品牌蓝色、加粗，右对齐
.card-fee-highlight {
  font-size: 16px;
  font-weight: 600;
  color: $ios-blue;
  white-space: nowrap;
  flex-shrink: 0;
}

// NOTE: 标题行中的发布时间，紧跟标题右侧
.card-published-ago {
  font-size: 10px;
  color: $ios-text-tertiary;
  white-space: nowrap;
  flex-shrink: 0;

  &--recent {
    color: #34C759;
  }
}

.info-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0 4px;

  // NOTE: 时间+地址行强制单行，超长省略
  &--nowrap {
    flex-wrap: nowrap;
    overflow: hidden;
  }
}

.info-chunk {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  flex-shrink: 0;

  // NOTE: 地址 chunk 允许收缩，占满剩余空间
  &--venue {
    flex: 1;
    min-width: 0;
    flex-shrink: 1;
    overflow: hidden;
  }
}

// .info-icon-img 已删除：新布局不使用小图标

// NOTE: 时间地点行的中点分隔符
.info-sep-dot {
  font-size: 12px;
  color: $ios-text-tertiary;
  flex-shrink: 0;
  margin: 0 2px;
}

.info-sep {
  font-size: 12px;
  color: $ios-text-tertiary;
  flex-shrink: 0;
  margin: 0 1px;
}

.info-text {
  font-size: 12px;
  color: $ios-text-secondary;
  line-height: 1.4;
  min-width: 0;

  &--ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// NOTE: 三点按钮已移到底部 footer-actions，不再绝对定位右上角
.card-top-right {
  display: none;
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

// ── 分割线 ────────────────────────────────────────────
.card-divider {
  height: 0.5px;
  margin: 10px 0 8px;
  background: rgba(0, 0, 0, 0.06);
}

// ── 报名区域：头像网格(左) + 报名按钮区域(右) ──────────────────────────
// NOTE: 横向布局，头像网格 flex:1 不遇挡头像，按钮固定右侧不增加卡片高度
.card-footer {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 8px;
  // NOTE: 防止无参与者且无按钮时底部塌缩
  min-height: 60px;
}


// NOTE: 底部右侧：报名按钮 + 三点菜单纵排
.footer-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

// NOTE: footer 右侧容器：距离标签 + 报名按钮纵向排列，中间间距
.footer-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

// 报名人员头像网格：5列自动换行，最多3行（15个）
.participants-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
  // NOTE: flex:1 占满左侧剩余空间，按钮在右侧不遮挡头像
  flex: 1;
  min-width: 0;
}

// +N 溢出占位圆
.participant-overflow-slot {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  flex-shrink: 0;
  background: $ios-bg-tertiary;
  display: flex;
  align-items: center;
  justify-content: center;
}

.participant-overflow-text {
  font-size: 12px;
  font-weight: 600;
  color: $ios-text-secondary;
  line-height: 1;
}

// 单个报名用户：头像 + 昵称纵向容器
.participant-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

// 报名用户昵称
.participant-nickname {
  font-size: 10px;
  color: $ios-text-secondary;
  text-align: center;
  max-width: 56px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

// 单个报名用户头像
// NOTE: 与发起人头像保持一致：56px / overflow:hidden / 纯 box-shadow 无 border
.participant-avatar-wrap {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.participant-avatar-img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: block;
}

.participant-avatar-placeholder {
  width: 100%;
  height: 100%;
  background: $ios-bg-tertiary;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.participant-avatar-icon {
  font-size: 16px;
}

// NOTE: 浅色虚线空心圆，语义清晰的「空位可加入」占位符
.participant-add-slot {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1.5px dashed rgba(0, 0, 0, 0.22);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

// + 号居中
.participant-add-text {
  position: relative;
  z-index: 1;
  font-size: 24px;
  font-weight: 300;
  color: rgba(0, 0, 0, 0.35);
  line-height: 1;
}

// ── 立即报名按钮 ──────────────────────────────────────
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
  font-size: 12px;
  font-weight: 400;
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
  font-size: 12px;
  font-weight: 400;
  color: #fff;
}
</style>
