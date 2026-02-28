<template>
  <view class="index-page">
    <!-- 顶部区域：Banner 作背景，定位/搜索框/筛选叠在上方（参考图1） -->
    <view class="header-with-banner">
      <view class="banner-ad">
        <image class="banner-ad-img" src="/static/images/banner.png" mode="aspectFill" />
      </view>
      <view class="header-content">
        <!-- 顶部栏：城市选择 + 搜索框 -->
        <view class="top-bar">
          <view class="city-selector" @tap="handleCitySelect">
            <text class="city-name">{{ currentCity || '定位中' }}</text>
            <text class="dropdown-icon">▼</text>
          </view>
          <view class="search-box-wrapper">
            <view class="search-box">
              <image class="search-icon" src="/static/icons/search.png" mode="aspectFit" />
              <input
                class="search-input"
                v-model="searchKeyword"
                placeholder="搜索活动"
                @input="handleSearchInput"
                @confirm="handleSearchConfirm"
                :focus="searchFocused"
              />
            </view>
          </view>
        </view>
        <!-- DUPR筛选标签 -->
        <view class="filter-container">
          <view class="filter-tags">
            <view 
              v-for="(filter, idx) in filters" 
              :key="idx"
              :class="['filter-tag', { 'active': selectedFilter === filter.value }]"
              @tap="handleFilterChange(filter.value)"
            >
              <text>{{ filter.label }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="activity-list">
      <view v-if="loading && activities.length === 0" class="empty">
        <text>加载中...</text>
      </view>
      <view v-else-if="activities.length === 0" class="empty">
        <text>暂无活动</text>
      </view>
      <template v-else>
        <ActivityCard
          v-for="(activity, idx) in activities"
          :key="activity._id || `act-${idx}`"
          :activity="activity"
          @share-click="shareTargetActivity = $event"
        />
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { onLoad, onPullDownRefresh, onShow, onHide, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import ActivityCard from '../../components/ActivityCard.vue'
import type { Activity, LocationInfo } from '../../types'
import { getActivities, joinActivity } from '../../services/activity'
import { checkLogin } from '../../services/user'
import { getUserLocation } from '../../utils/location'
import { getCurrentUserFromCache, mergeCurrentUserAvatar } from '../../utils/avatarSync'

const location = ref<LocationInfo | null>(null)
const activities = ref<Activity[]>([])
const allActivities = ref<Activity[]>([]) // 存储所有活动数据，用于搜索过滤
const loading = ref(false)
const selectedFilter = ref('') // 默认不选择任何筛选
const locationRequested = ref(false) // 防止重复请求位置
const currentCity = ref('定位中') // 当前城市名称
const searchKeyword = ref('') // 搜索关键词
const searchFocused = ref(false) // 搜索框聚焦状态
const shareTargetActivity = ref<Activity | null>(null) // 点击卡片分享时，要分享的活动

// 活动列表自动刷新间隔（毫秒），用于实时显示报名/退出情况
const ACTIVITY_REFRESH_INTERVAL_MS = 1000
let activityRefreshTimer: ReturnType<typeof setInterval> | null = null

// DUPR筛选选项
const filters = [
  { label: '初级 1.0-2.5', value: '1.0-2.5' },
  { label: '中级 3.0-3.5', value: '3.0-3.5' },
  { label: '高级 4.0-4.5', value: '4.0-4.5' },
  { label: '专业级 5.0+', value: '5.0+' },
]

// 页面加载时处理分享链接参数
onLoad((options: any) => {
  if (options?.filter) {
    const filterValue = decodeURIComponent(options.filter)
    // 验证筛选值是否有效
    if (filters.some(f => f.value === filterValue)) {
      selectedFilter.value = filterValue
    }
  }
})

// 加载活动列表（silent 为 true 时不显示 loading，用于定时刷新）
async function loadActivities(silent = false) {
  if (!silent) loading.value = true
  try {
    if (!silent) console.log('[广场页] loadActivities: 开始加载活动列表...')
    const list = await getActivities({
      latitude: location.value?.latitude,
      longitude: location.value?.longitude,
    })
    
    console.log('[广场页] loadActivities: 获取到活动数据，数量:', list?.length || 0)
    if (!silent && list && list.length > 0) {
      list.forEach((activity, index) => {
        console.log(`[广场页] loadActivities: 活动 ${index + 1} 数据:`, {
          _id: activity._id,
          title: activity.title,
          hostId: activity.hostId,
          currentCount: activity.currentCount,
          participantsCount: activity.participants?.length || 0,
          hostAvatar: activity.hostAvatar ? '有' : '无',
          hostName: activity.hostName || '无'
        })
      })
    }

    // 静默刷新时：已有头像 URL 一律保留，不覆盖，避免每秒换链导致闪烁
    const prevList = allActivities.value
    const mergedList = Array.isArray(list) ? list.map((act: Activity) => {
      const old = prevList.find((a: Activity) => a._id === act._id)
      if (!old) return act
      const out = { ...act }
      const keepHost = old.hostAvatar && (String(old.hostAvatar).startsWith('http') || String(old.hostAvatar).startsWith('cloud://'))
      out.hostAvatar = keepHost ? old.hostAvatar : (act.hostAvatar ?? old.hostAvatar)
      if (Array.isArray(act.participants)) {
        const oldParts = Array.isArray(old.participants) ? old.participants : []
        out.participants = act.participants.map((p: { userId?: string; avatarUrl?: string; nickName?: string }) => {
          const op = oldParts.find((x: { userId?: string }) => x.userId === p.userId)
          const keepUrl = op?.avatarUrl && (String(op.avatarUrl).startsWith('http') || String(op.avatarUrl).startsWith('cloud://'))
          return { ...p, avatarUrl: (op && keepUrl) ? op.avatarUrl : (p.avatarUrl ?? op?.avatarUrl) }
        })
      }
      return out
    }) : list

    // 个人页头像有修改时，用当前用户缓存头像覆盖活动中的发起人/报名人头像，与其他页面同步
    const currentUser = getCurrentUserFromCache()
    if (currentUser) {
      for (let i = 0; i < mergedList.length; i++) {
        mergedList[i] = mergeCurrentUserAvatar(mergedList[i], currentUser)
      }
    }

    allActivities.value = mergedList
    
    // 应用搜索和筛选过滤
    applyFiltersAndSearch()
    if (!silent) console.log('[广场页] loadActivities: 列表更新完成')
  } catch (error: any) {
    const msg = error?.message || error?.errMsg || ''
    if (!silent) {
      console.error('[广场页] 加载活动失败:', error)
      if (msg.includes('fetch') || msg.includes('network') || error?.errCode === -1) {
        uni.showToast({ title: '网络异常，请检查云开发是否已开通并部署', icon: 'none', duration: 2800 })
      } else {
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    }
    activities.value = []
    allActivities.value = []
  } finally {
    loading.value = false
  }
}

function clearActivityRefreshTimer() {
  if (activityRefreshTimer != null) {
    clearInterval(activityRefreshTimer)
    activityRefreshTimer = null
  }
}

function startActivityRefreshTimer() {
  clearActivityRefreshTimer()
  activityRefreshTimer = setInterval(() => {
    loadActivities(true)
  }, ACTIVITY_REFRESH_INTERVAL_MS)
}

// 应用搜索关键词和DUPR筛选，并按距离排序
function applyFiltersAndSearch() {
  let filteredList = [...allActivities.value]
  
  // 1. 应用搜索关键词过滤
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase()
    filteredList = filteredList.filter(activity => {
      const title = (activity.title || '').toLowerCase()
      const description = (activity.description || '').toLowerCase()
      const address = (activity.address || '').toLowerCase()
      const duprLevel = (activity.duprLevel || '').toLowerCase()
      
      // 在标题、描述、地址、DUPR水平中搜索关键词
      return title.includes(keyword) ||
             description.includes(keyword) ||
             address.includes(keyword) ||
             duprLevel.includes(keyword)
    })
  }
  
  // 2. 应用DUPR筛选过滤
  if (selectedFilter.value) {
    filteredList = filteredList.filter(activity => {
      const duprLevel = activity.duprLevel || ''
      const description = activity.description || ''
      const title = activity.title || ''
      
      // 组合所有文本内容进行匹配
      const searchText = `${duprLevel} ${description} ${title}`.toLowerCase()
      const filterValue = selectedFilter.value.toLowerCase()
      
      // 优先匹配 duprLevel 字段
      if (duprLevel) {
        if (filterValue === '1.0-2.5') {
          const levelNum = parseFloat(duprLevel)
          if (!isNaN(levelNum) && levelNum >= 1.0 && levelNum <= 2.5) {
            return true
          }
        } else if (filterValue === '3.0-3.5') {
          const levelNum = parseFloat(duprLevel)
          if (!isNaN(levelNum) && levelNum >= 3.0 && levelNum <= 3.5) {
            return true
          }
        } else if (filterValue === '4.0-4.5') {
          const levelNum = parseFloat(duprLevel)
          if (!isNaN(levelNum) && levelNum >= 4.0 && levelNum <= 4.5) {
            return true
          }
        } else if (filterValue === '5.0+') {
          const levelNum = parseFloat(duprLevel)
          if (!isNaN(levelNum) && levelNum >= 5.0) {
            return true
          }
        }
      }
      
      // 如果 duprLevel 字段不匹配，则通过文本内容匹配
      if (filterValue === '1.0-2.5') {
        return searchText.includes('1.0') || searchText.includes('1.5') || 
               searchText.includes('2.0') || searchText.includes('2.1') || 
               searchText.includes('2.2') || searchText.includes('2.3') || 
               searchText.includes('2.4') || searchText.includes('2.5') ||
               searchText.includes('初级') || searchText.includes('beginner')
      } else if (filterValue === '3.0-3.5') {
        return searchText.includes('3.0') || searchText.includes('3.1') || 
               searchText.includes('3.2') || searchText.includes('3.3') || 
               searchText.includes('3.4') || searchText.includes('3.5') ||
               searchText.includes('中级') || searchText.includes('intermediate')
      } else if (filterValue === '4.0-4.5') {
        return searchText.includes('4.0') || searchText.includes('4.1') || 
               searchText.includes('4.2') || searchText.includes('4.3') || 
               searchText.includes('4.4') || searchText.includes('4.5') ||
               searchText.includes('高级') || searchText.includes('advanced')
      } else if (filterValue === '5.0+') {
        return searchText.includes('5.0') || searchText.includes('专业级') || 
               searchText.includes('专业') || searchText.includes('pro')
      }
      
      return false
    })
  }
  
  // 3. 按发布时间排序（最新发布的在前，精确到秒）
  filteredList.sort((a, b) => {
    const timeA = (a as any).createdAt ?? 0
    const timeB = (b as any).createdAt ?? 0
    return timeB - timeA
  })
  
  activities.value = filteredList
}

// 搜索输入处理
function handleSearchInput() {
  // 实时搜索，输入时立即过滤
  applyFiltersAndSearch()
}

// 搜索确认处理
function handleSearchConfirm() {
  // 搜索确认时，确保应用过滤
  applyFiltersAndSearch()
  // 取消聚焦，收起键盘
  searchFocused.value = false
}

// 计算两点之间的距离（公里）
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// 从地址字符串中提取城市名称
function extractCityFromAddress(address: string): string | null {
  if (!address) return null
  
  // 尝试匹配城市名称（如"萍乡市"、"北京市"等）
  const cityPattern = /([^省自治区]+?[市县区])/
  const match = address.match(cityPattern)
  if (match && match[1]) {
    return match[1]
  }
  
  return null
}

// 请求位置并加载活动
async function requestLocationAndLoad() {
  // 防止重复调用
  if (locationRequested.value) {
    return
  }
  locationRequested.value = true
  
  try {
    // 先检查缓存中是否有城市信息
    const cachedLocation = uni.getStorageSync('userLocation')
    if (cachedLocation && cachedLocation.city) {
      currentCity.value = cachedLocation.city
      location.value = cachedLocation
      await loadActivities()
      return
    }
    
    // 检查是否有手动选择的城市
    const selectedCity = uni.getStorageSync('selected_city')
    if (selectedCity) {
      currentCity.value = selectedCity
    }
    
    // 自动获取位置（仅 getLocation + 云函数逆地理编码，不弹出选择位置界面）
    const loc = await getUserLocation()
    if (loc) {
      location.value = loc
      // 同步显示在广场左上角：优先城市，其次详细地址，最后为坐标或「已定位」
      if (loc.city) {
        currentCity.value = loc.city
      } else if (loc.address && (loc.address.includes('市') || loc.address.includes('县') || loc.address.includes('区'))) {
        const cityName = extractCityFromAddress(loc.address)
        if (cityName) currentCity.value = cityName
        else currentCity.value = loc.address.length > 10 ? loc.address.slice(0, 10) + '…' : loc.address
      } else if (loc.address && loc.address.trim()) {
        // 逆地理未配置 Key 时 address 为坐标串，仍显示坐标作为实时位置
        currentCity.value = loc.address.length > 12 ? loc.address.slice(0, 12) + '…' : loc.address
      } else {
        currentCity.value = '已定位'
      }
      uni.setStorageSync('userLocation', { ...loc, city: currentCity.value })
      await loadActivities()
      return
    }
    await loadActivities()
  } catch (error) {
    // 用户拒绝授权或获取失败，静默处理
    await loadActivities()
  }
}

// 城市选择
function handleCitySelect() {
  uni.navigateTo({
    url: `/pages/city-select/index?currentCity=${encodeURIComponent(currentCity.value)}`
  })
}

// 搜索框点击（已移除，改为直接输入）

// 位置标签点击
function handleLocationTagTap() {
  // 如果已经请求过位置，不再重复请求
  if (locationRequested.value && location.value) {
    return
  }
  requestLocationAndLoad()
}

// 筛选切换
function handleFilterChange(value: string) {
  selectedFilter.value = value
  loadActivities()
}

// 加入活动（需先登录）
async function handleJoin(activity: Activity) {
  if (!activity._id) return
  const { ok } = await checkLogin()
  if (!ok) {
    uni.showToast({ title: '请先登录后再报名参加活动', icon: 'none', duration: 2500 })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/profile/index' })
    }, 500)
    return
  }
  try {
    const result = await joinActivity(activity._id)
    if (result?.success === false) {
      uni.showToast({ title: result.message || '加入失败', icon: 'none' })
      return
    }
    uni.showToast({ title: '加入成功', icon: 'success' })
    loadActivities()
  } catch (error: any) {
    uni.showToast({ title: error.errMsg || error.message || '加入失败', icon: 'none' })
  }
}

// 下拉刷新
async function handleRefresh() {
  await loadActivities()
  uni.stopPullDownRefresh()
}

// 页面下拉刷新
onPullDownRefresh(async () => {
  await loadActivities()
  uni.stopPullDownRefresh()
})

// 监听活动相关事件，实时刷新列表
function handleActivityJoined(eventData?: { activityId?: string }) {
  console.log('[广场页] 收到活动报名/退出事件，刷新活动列表...', eventData)
  // 延迟一小段时间确保数据库已更新，然后刷新列表（确保头像信息同步）
  setTimeout(() => {
    console.log('[广场页] 开始刷新活动列表以更新头像...')
    loadActivities()
  }, 500) // 增加延迟时间，确保数据库完全更新
}

function handleActivityCreated(eventData?: { activityId?: string }) {
  console.log('[广场页] 收到活动创建事件，刷新活动列表...', eventData)
  loadActivities()
}

function handleActivityUpdated(eventData?: { activityId?: string }) {
  console.log('[广场页] 收到活动更新事件，刷新活动列表...', eventData)
  loadActivities()
}

function handleActivityDeleted(eventData?: { activityId?: string }) {
  console.log('[广场页] 收到活动删除事件，刷新活动列表...', eventData)
  loadActivities()
}

// 页面显示时：从城市选择返回则刷新列表；从发布活动返回则刷新列表；从详情页报名成功返回则刷新列表以同步已报名人数
onShow(() => {
  const selectedCity = uni.getStorageSync('selected_city')
  if (selectedCity) {
    currentCity.value = selectedCity
    uni.removeStorageSync('selected_city')
    loadActivities()
    return
  }
  if (uni.getStorageSync('activity_just_published')) {
    uni.removeStorageSync('activity_just_published')
    loadActivities()
    return
  }
  if (uni.getStorageSync('activity_just_joined')) {
    uni.removeStorageSync('activity_just_joined')
    loadActivities()
    return
  }
  if (uni.getStorageSync('activity_just_left')) {
    uni.removeStorageSync('activity_just_left')
    loadActivities()
    return
  }
  if (uni.getStorageSync('activity_just_updated')) {
    uni.removeStorageSync('activity_just_updated')
    loadActivities()
    return
  }
  if (uni.getStorageSync('activity_just_deleted')) {
    uni.removeStorageSync('activity_just_deleted')
    loadActivities()
  }
  startActivityRefreshTimer()
})

onHide(() => {
  clearActivityRefreshTimer()
})

function handleAvatarUpdated() {
  loadActivities()
}

// 初始化：直接请求位置
// 微信系统会自动弹出位置授权弹窗（基础库 >= 3.4.2 会自动附带隐私协议勾选）
// 隐私保护指引已在公众平台后台配置完成
onMounted(async () => {
  // 监听全局事件
  uni.$on('activity-joined', handleActivityJoined)
  uni.$on('activity-left', handleActivityJoined) // 退出活动也刷新列表
  uni.$on('activity-created', handleActivityCreated) // 创建活动也刷新列表
  uni.$on('activity-updated', handleActivityUpdated) // 编辑活动也刷新列表
  uni.$on('activity-deleted', handleActivityDeleted) // 删除活动也刷新列表
  uni.$on('avatar-updated', handleAvatarUpdated) // 个人页更新头像后刷新列表以同步发起人头像
  
  // 检查是否有选中的城市
  const selectedCity = uni.getStorageSync('selected_city')
  if (selectedCity) {
    currentCity.value = selectedCity
  }
  
  // 延迟执行，确保页面完全加载后再请求位置
  setTimeout(() => {
    requestLocationAndLoad()
  }, 500)
})

// 页面卸载时移除事件监听并停止定时刷新
onUnmounted(() => {
  clearActivityRefreshTimer()
  uni.$off('activity-joined', handleActivityJoined)
  uni.$off('activity-left', handleActivityJoined)
  uni.$off('activity-created', handleActivityCreated)
  uni.$off('activity-updated', handleActivityUpdated)
  uni.$off('activity-deleted', handleActivityDeleted)
  uni.$off('avatar-updated', handleAvatarUpdated)
})

// 分享功能：转发到微信（从卡片点击分享时分享该活动，否则分享广场页）
onShareAppMessage(() => {
  const target = shareTargetActivity.value
  if (target?._id) {
    const title = target.title ? `${target.title} - 匹克球活动` : '匹克球活动邀你参加'
    const path = `/pages/activity-detail/index?id=${encodeURIComponent(target._id)}`
    shareTargetActivity.value = null // 用后清空
    return {
      title,
      path,
      imageUrl: '/images/share-image.png'
    }
  }
  // 默认：分享广场页
  let shareTitle = '发现附近的匹克球活动'
  if (currentCity.value && currentCity.value !== '定位中') {
    shareTitle = `${currentCity.value}的匹克球活动`
  }
  if (selectedFilter.value) {
    const filterLabel = filters.find(f => f.value === selectedFilter.value)?.label || selectedFilter.value
    shareTitle = `${shareTitle} - ${filterLabel}`
  }
  if (activities.value.length > 0) {
    shareTitle = `${shareTitle}（${activities.value.length}个活动）`
  }
  let sharePath = '/pages/index/index'
  if (selectedFilter.value) {
    sharePath += `?filter=${encodeURIComponent(selectedFilter.value)}`
  }
  return {
    title: shareTitle,
    path: sharePath,
    imageUrl: '/images/share-image.png'
  }
})

// 分享到朋友圈
onShareTimeline(() => {
  let shareTitle = '发现附近的匹克球活动'
  
  if (currentCity.value && currentCity.value !== '定位中') {
    shareTitle = `${currentCity.value}的匹克球活动`
  }
  
  if (selectedFilter.value) {
    const filterLabel = filters.find(f => f.value === selectedFilter.value)?.label || selectedFilter.value
    shareTitle = `${shareTitle} - ${filterLabel}`
  }
  
  if (activities.value.length > 0) {
    shareTitle = `${shareTitle}（${activities.value.length}个活动）`
  }
  
  let query = ''
  if (selectedFilter.value) {
    query = `filter=${encodeURIComponent(selectedFilter.value)}`
  }
  
  return {
    title: shareTitle,
    query: query,
    imageUrl: '/images/share-image.png'
  }
})
</script>

<style lang="scss" scoped>


.index-page {
  min-height: 100vh;
  padding-bottom: 0;
  background: $ios-bg-secondary;
  overflow-x: hidden;
  overflow-y: auto;
}

/* 顶部区域：Banner 在底层，定位/搜索/筛选叠在上方（参考图1） */
.header-with-banner {
  position: relative;
  min-height: 160px;
  flex-shrink: 0;
}

.banner-ad {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 160px;
  overflow: hidden;
}

.banner-ad-img {
  width: 100%;
  height: 100%;
  display: block;
}

.header-content {
  position: relative;
  z-index: 1;
  padding: $ios-spacing-md $ios-spacing-lg $ios-spacing-md $ios-spacing-lg;
  padding-top: calc(#{$ios-spacing-md} + env(safe-area-inset-top));
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  background: transparent !important;
}

.city-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 0;
  min-width: 60px;
}

.city-name {
  font-size: 16px;
  font-weight: $ios-font-weight-medium;
  color: #fff;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.dropdown-icon {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 2px;
}

.search-box-wrapper {
  flex: 1;
}

.search-box {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 4px 12px;
  min-height: 28px;
  gap: 8px;
}

.search-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  font-size: 14px;
  color: $ios-text-primary;
  background: transparent;
  border: none;
  
  &::placeholder {
    color: $ios-text-tertiary;
  }
}

.filter-container {
  width: 100%;
  padding-top: 0;
  padding-bottom: 8px;
}

.filter-tags {
  display: flex;
  justify-content: space-between; /* 左右对齐分布 */
  align-items: center;
  gap: 8px; /* 标签之间的间距 */
  padding: 0; /* 移除内边距，让标签直接对齐容器边缘 */
  flex-wrap: nowrap;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center; /* 文字居中 */
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  font-size: 12px;
  color: #333;
  font-weight: $ios-font-weight-medium;
  white-space: nowrap;
  transition: all 0.2s ease;
  flex: 1; /* 每个标签平均分配空间，实现左右对齐分布 */
  min-width: 0; /* 允许flex收缩 */
  
  &:active {
    transform: scale(0.95);
  }
  
  &.active {
    background: rgba(255, 255, 255, 1);
    color: $ios-blue;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.activity-list {
  padding: $ios-spacing-lg;
}

.empty {
  padding: $ios-spacing-xxl * 2;
  text-align: center;
  color: $ios-text-tertiary;
  font-size: $ios-font-size-md;
}
</style>
