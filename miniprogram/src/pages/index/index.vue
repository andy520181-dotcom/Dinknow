<template>
  <view class="index-page">
    <!-- 顶部区域：两段式胶囊（搜索 | 筛选）-->
    <view class="header-area">
      <view class="header-content">
        <view class="search-capsule">
          <!-- 左段：搜索输入 -->
          <view class="capsule-search">
            <image class="capsule-search-icon" src="/static/icons/search.png" mode="aspectFit" />
            <input
              class="capsule-input"
              v-model="searchKeyword"
              placeholder="搜索匹克球活动"
              placeholder-class="capsule-input-placeholder"
              @input="handleSearchInput"
              @confirm="handleSearchConfirm"
              :focus="searchFocused"
            />
          </view>
          <!-- 右段：筛选 -->
          <view
            class="capsule-filter"
            :class="{ 'capsule-filter--active': hasActiveFilter }"
            @tap="toggleFilterPanel"
          >
            <image class="capsule-filter-icon" src="/static/icons/shaixuan.png" mode="aspectFit" />
          </view>
        </view>
        <!-- NOTE: 城市按钮 + 排序标签合并一行：左侧城市可点击切换，右侧排序 -->
        <view class="sort-tabs">
          <!-- 城市入口 -->
          <view class="city-btn" @tap="handleCitySelect">
            <text class="city-btn-name">{{ currentCity || '定位中' }}</text>
            <text class="city-btn-chevron">›</text>
          </view>
          <view class="sort-tab-divider" />
          <view
            class="sort-tab"
            :class="{ 'sort-tab--active': sortOrder === 'latest' }"
            @tap="setSortOrder('latest')"
          >
            <text class="sort-tab-text">最新发布</text>
          </view>
          <view class="sort-tab-divider" />
          <view
            class="sort-tab"
            :class="{ 'sort-tab--active': sortOrder === 'distance' }"
            @tap="setSortOrder('distance')"
          >
            <text class="sort-tab-text">距离最近</text>
          </view>
        </view>
      </view>
    </view>


    <!-- 筛选面板：遮罩包含 bottom-sheet，v-if 控制整体显隐 -->
    <view
      v-if="showFilterPanel"
      class="filter-overlay"
      @tap="closeFilterPanel"
    >
      <!-- NOTE: 阻止冒泡，防止点击面板区域关闭遮罩 -->
      <view class="filter-sheet" @tap.stop>
        <!-- 顶部把手 -->
        <view class="filter-sheet-handle" />


        <!-- 距离范围 -->
        <view class="filter-section">
          <text class="filter-section-title">距离范围</text>
          <view class="filter-chips">
            <view
              v-for="d in distanceOptions"
              :key="d.value"
              class="filter-chip"
              :class="{ 'filter-chip--active': pendingDistance === d.value }"
              @tap="pendingDistance = pendingDistance === d.value ? '' : d.value"
            >
              <text class="filter-chip-text">{{ d.label }}</text>
            </view>
          </view>
        </view>

        <!-- DUPR 水平 -->
        <view class="filter-section">
          <text class="filter-section-title">DUPR 水平</text>
          <view class="filter-chips">
            <view
              v-for="f in filters"
              :key="f.value"
              class="filter-chip"
              :class="{ 'filter-chip--active': pendingDupr === f.value }"
              @tap="pendingDupr = pendingDupr === f.value ? '' : f.value"
            >
              <text class="filter-chip-text">{{ f.label }}</text>
            </view>
          </view>
        </view>

        <!-- 选择时段 -->
        <view class="filter-section">
          <text class="filter-section-title">选择时段</text>
          <view class="filter-chips">
            <view
              v-for="t in timeSlotOptions"
              :key="t.value"
              class="filter-chip"
              :class="{ 'filter-chip--active': pendingTimeSlots.includes(t.value) }"
              @tap="toggleTimeSlot(t.value)"
            >
              <text class="filter-chip-text">{{ t.label }}</text>
            </view>
          </view>
        </view>

        <!-- 底部按钮：重置 + 确定 -->
        <view class="filter-sheet-footer">
          <view class="filter-reset-btn" @tap="resetFilters">
            <text class="filter-reset-text">重置</text>
          </view>
          <view class="filter-confirm-btn" @tap="confirmFilters">
            <text class="filter-confirm-text">确定</text>
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
          :isOwner="activity.hostId != null && activity.hostId === myOpenId"
          :distance-km="
            location?.latitude && location?.longitude &&
            (activity as any).latitude != null && (activity as any).longitude != null
              ? Math.round(calculateDistance(
                  location.latitude, location.longitude,
                  (activity as any).latitude, (activity as any).longitude
                ))
              : null
          "
          @share-click="shareTargetActivity = $event"
          @edit="handleEditActivity"
          @delete="handleDeleteActivity"
        />
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad, onPullDownRefresh, onShow, onHide, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import ActivityCard from '../../components/ActivityCard.vue'
import type { Activity, LocationInfo } from '../../types'
import { getActivities, joinActivity, deleteActivity } from '../../services/activity'
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
const showFilterPanel = ref(false) // 筛选面板显隐
// NOTE: 排序方式：''=默认（服务器顺序/时间降序），'latest'=最新发布，'distance'=距离最近
// 初始两个标签均未选中，点击选中，再次点击取消选中恢复默认
const sortOrder = ref<'latest' | 'distance' | ''>('')
// NOTE: 当前登录用户 openid，用于判断是否为发起人（显示三点菜单）
const myOpenId = ref<string | null>(null)

// ── 筛选选项数据 ────────────────────────────────────────
const distanceOptions = [
  { label: '500m', value: '0.5' },
  { label: '1km',  value: '1'   },
  { label: '2km',  value: '2'   },
  { label: '5km',  value: '5'   },
  { label: '10km', value: '10'  },
  { label: '20km', value: '20'  },
]
const timeSlotOptions = [
  { label: '早上', value: 'morning' },
  { label: '下午', value: 'afternoon' },
  { label: '晚上', value: 'evening' },
]

// ── 已应用的筛选状态（点击确定后生效）──────────────────
const selectedDistance = ref('')        // 距离范围
// selectedFilter 已存在（DUPR）
const selectedTimeSlots = ref<string[]>([])  // 时段（多选）

// ── 面板内临时状态（编辑中，未确定）─────────────────────
const pendingDistance  = ref('')
const pendingDupr      = ref('')
const pendingTimeSlots = ref<string[]>([])

// ── 面板操作 ────────────────────────────────────────────
function toggleFilterPanel() {
  if (!showFilterPanel.value) {
    // 打开面板时，把已生效的状态同步进 pending
    pendingDistance.value  = selectedDistance.value
    pendingDupr.value      = selectedFilter.value
    pendingTimeSlots.value = [...selectedTimeSlots.value]
    showFilterPanel.value  = true
    // NOTE: 隐藏原生 tab bar，使 bottom-sheet 完整覆盖底部
    // #ifdef MP-WEIXIN
    ;(wx as any).hideTabBar()
    // #endif
  } else {
    closeFilterPanel()
  }
}

function closeFilterPanel() {
  showFilterPanel.value = false
  // NOTE: 恢复原生 tab bar
  // #ifdef MP-WEIXIN
  ;(wx as any).showTabBar()
  // #endif
}

/** 时段多选切换 */
function toggleTimeSlot(value: string) {
  const idx = pendingTimeSlots.value.indexOf(value)
  if (idx >= 0) {
    pendingTimeSlots.value.splice(idx, 1)
  } else {
    pendingTimeSlots.value.push(value)
  }
}

/** 重置所有 pending 状态 */
function resetFilters() {
  pendingDistance.value  = ''
  pendingDupr.value      = ''
  pendingTimeSlots.value = []
}

/** 确定：将 pending 状态写入已生效状态，触发过滤 */
function confirmFilters() {
  selectedDistance.value  = pendingDistance.value
  selectedFilter.value    = pendingDupr.value
  selectedTimeSlots.value = [...pendingTimeSlots.value]
  closeFilterPanel()
  applyFiltersAndSearch()
}

// NOTE: 筛选按钮 active 状态：任意维度有选中则高亮
const hasActiveFilter = computed(() =>
  !!(selectedDistance.value || selectedFilter.value || selectedTimeSlots.value.length)
)

const shareTargetActivity = ref<Activity | null>(null) // 点击卡片分享时，要分享的活动

// NOTE: 不使用定时轮询，改为依靠 onShow 切回时静默刷新一次 + 用户主动下拉刷新
// 原因：1s 轮询会导致卡片列表频繁变化，用户体验差，且浪费云函数调用次数

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


onShow(() => {
  // NOTE: 同步当前用户 openid，用于广场页判断是否为发起人
  const u = getCurrentUserFromCache()
  myOpenId.value = u?.openid ?? null
  loadActivities(true)
})

/** 广场页中发起人点三点 → 编辑 */
function handleEditActivity(activity: Activity) {
  if (!activity._id) return
  if ((activity as any).isEnded) {
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
  // NOTE: 同步备注文字和图片到 storage，让发起活动页 syncRemarkFromStorage 回填
  uni.setStorageSync('editing_activity_remark', (activity as any).description || '')
  uni.setStorageSync('editing_activity_remark_images', (activity as any).images || [])
  uni.switchTab({ url: '/pages/create-activity/index' })
}

/** 广场页中发起人点三点 → 删除 */
function handleDeleteActivity(activity: Activity) {
  if (!activity._id) return
  uni.showModal({
    title: '确认删除',
    content: `确定要删除活动「${activity.title}」吗？删除后无法恢复。`,
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
        uni.$emit('activity-deleted', { activityId: activity._id })
        await loadActivities()
      } catch (err: any) {
        uni.hideLoading()
        uni.showToast({ title: err?.errMsg || err?.message || '删除失败', icon: 'none' })
      }
    }
  })
}

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
      // NOTE: 新头像有效（API 返回了最新值）时用新的，允许头像变更生效；
      // 新头像无效时保留旧的，防止空值闪烁
      const isValidUrl = (v: any) => v && (String(v).startsWith('http') || String(v).startsWith('cloud://'))
      out.hostAvatar = isValidUrl(act.hostAvatar) ? act.hostAvatar : (old.hostAvatar || act.hostAvatar)
      if (Array.isArray(act.participants)) {
        const oldParts = Array.isArray(old.participants) ? old.participants : []
        out.participants = act.participants.map((p: { userId?: string; avatarUrl?: string; nickName?: string }) => {
          const op = oldParts.find((x: { userId?: string }) => x.userId === p.userId)
          return { ...p, avatarUrl: isValidUrl(p.avatarUrl) ? p.avatarUrl : (op?.avatarUrl || p.avatarUrl) }
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

// NOTE: clearActivityRefreshTimer / startActivityRefreshTimer 已废弃，保留空函数避免破坏调用点
function clearActivityRefreshTimer() {}
function startActivityRefreshTimer() {}

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

  // 3. 距离范围过滤（需要用户位置 + 活动坐标）
  if (selectedDistance.value && location.value?.latitude && location.value?.longitude) {
    // NOTE: 用 parseFloat 支持 0.5km（500m）这样的小数距离
    const maxKm = parseFloat(selectedDistance.value)
    const { latitude: userLat, longitude: userLon } = location.value
    filteredList = filteredList.filter(a => {
      if (a.latitude == null || a.longitude == null) return true // 无坐标不过滤
      return calculateDistance(userLat, userLon, a.latitude, a.longitude) <= maxKm
    })
  }

  // 4. 时段过滤（按活动 startTime 的 HH:mm 小时匹配）
  if (selectedTimeSlots.value.length > 0) {
    filteredList = filteredList.filter(activity => {
      // NOTE: startTime 存储格式为 "HH:mm"（如 "09:00"、"19:30"）
      // 不能用 new Date() 解析，直接取冒号前的小时数
      const startTime = (activity as any).startTime as string | undefined
      if (!startTime) return true // 无时间信息不参与过滤
      const hour = parseInt(String(startTime).split(':')[0], 10)
      if (isNaN(hour)) return true // 格式异常也不过滤
      return selectedTimeSlots.value.some(slot => {
        if (slot === 'morning')   return hour >= 6  && hour < 12
        if (slot === 'afternoon') return hour >= 12 && hour < 18
        if (slot === 'evening')   return hour >= 18 && hour < 24
        return false
      })
    })
  }

  // 5. 排序
  if (sortOrder.value === 'distance' && location.value?.latitude && location.value?.longitude) {
    // NOTE: 距离最近：按与用户位置的距离升序；无坐标的活动排在最后
    const { latitude: uLat, longitude: uLon } = location.value
    filteredList.sort((a, b) => {
      const dA = (a.latitude != null && a.longitude != null)
        ? calculateDistance(uLat, uLon, a.latitude, a.longitude)
        : Infinity
      const dB = (b.latitude != null && b.longitude != null)
        ? calculateDistance(uLat, uLon, b.latitude, b.longitude)
        : Infinity
      return dA - dB
    })
  } else {
    // NOTE: 最新发布：按 createdAt 降序
    filteredList.sort((a, b) => {
      const timeA = (a as any).createdAt ?? 0
      const timeB = (b as any).createdAt ?? 0
      return timeB - timeA
    })
  }

  activities.value = filteredList
}

/** 切换排序方式：再次点击同一标签则取消选中，恢复默认顺序 */
function setSortOrder(order: 'latest' | 'distance') {
  // NOTE: 再次点击已选中的标签 → 取消选中，恢复默认
  if (sortOrder.value === order) {
    sortOrder.value = ''
    applyFiltersAndSearch()
    return
  }
  // NOTE: 距离排序需要用户位置，若无定位给出友好提示
  if (order === 'distance' && !location.value?.latitude) {
    uni.showToast({ title: '获取位置中，请稍候', icon: 'none' })
    return
  }
  sortOrder.value = order
  applyFiltersAndSearch()
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

// NOTE: 筛选切换：点击选中，再次点击同一标签取消选中，显示全部活动
function handleFilterChange(value: string) {
  selectedFilter.value = selectedFilter.value === value ? '' : value
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
  // NOTE: 报名前科请订阅消息权限，用户同意后才能收到报名确认和活动变更通知
  // 可直接点拒绝，不影响报名流程
  await new Promise<void>(resolve => {
    uni.requestSubscribeMessage({
      tmplIds: [
        '53-eN2jMxIxsMvxl7FOspewFtigQ6MKb0tedLxY6g18', // 报名成功通知
        'b8AL_GV0DSTErOB8Nf9gEIkToN74gNAo_TYH56y9pEE', // 报名截止通知
      ],
      complete: () => resolve()
    })
  })
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

// NOTE: 转发到微信好友（分享特定活动时用动态标题，否则用品牌标题）
onShareAppMessage(() => {
  const target = shareTargetActivity.value
  if (target?._id) {
    const title = target.title ? `${target.title} - 找匹克球搭子，上Dinknow` : '找匹克球搭子，上Dinknow'
    const path = `/pages/activity-detail/index?id=${encodeURIComponent(target._id)}`
    shareTargetActivity.value = null // 用后清空
    return {
      title,
      path,
      imageUrl: '/images/share-image.png'
    }
  }
  // NOTE: 默认品牌转发标题
  return {
    title: '找匹克球搭子，上Dinknow',
    path: '/pages/index/index',
    imageUrl: '/images/share-image.png'
  }
})

// NOTE: 分享到朋友圌（需在小程序后台开通「分享朋友圌」权限）
onShareTimeline(() => {
  return {
    title: '找匹克球搭子，上Dinknow',
    query: '',
    imageUrl: '/images/share-image.png'
  }
})
</script>

<style lang="scss" scoped>


.index-page {
  min-height: 100vh;
  padding-bottom: 0;
  // NOTE: 顶部30%保留品牌浅蓝渐变，30%后平滑衔接 iOS 标准灰
  // 导航栏 #EDF3FF 与渐变顶部一致，分隔线不可见
  background: #F5F5F5;
  overflow-x: hidden;
  overflow-y: auto;
}

/* 顶部区域：透明背景，与页面底色融合 */
.header-area {
  background: transparent;
  flex-shrink: 0;
}

.header-content {
  padding: $ios-spacing-md $ios-spacing-lg;
  padding-top: calc(#{$ios-spacing-md} + env(safe-area-inset-top));
}

// NOTE: 排序切换标签行：搜索栏下方，左对齐两个 tab；align-items:center 保证三者水平中心线对齐
.sort-tabs {
  display: flex;
  align-items: center;
  margin-top: 10px;
  gap: 0;
}

.sort-tab {
  padding: 4px 0;
  position: relative;
  cursor: pointer;
  // NOTE: flex 对齐保证内部文字与 city-btn 文字基线一致
  display: flex;
  align-items: center;

  &--active .sort-tab-text {
    color: $ios-blue;
    font-weight: $ios-font-weight-semibold;
  }

  // NOTE: 选中态下划线
  &--active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: $ios-blue;
    border-radius: 1px;
  }
}

.sort-tab-text {
  font-size: 12px;
  color: $ios-text-secondary;
  line-height: 1.4;
}

// 两个 tab 中间竖线分隔
.sort-tab-divider {
  width: 1px;
  height: 12px;
  background: $ios-separator;
  margin: 0 12px;
  flex-shrink: 0;
}

// NOTE: 城市按钮：城市名 + 细箭头，无图标，与右侧排序标签视觉完全统一
.city-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  cursor: pointer;
  padding: 4px 0;
  &:active { opacity: 0.6; }
}

.city-btn-name {
  font-size: 12px;
  color: $ios-text-secondary;
  line-height: 1.4;
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// NOTE: 细箭头 › 与城市名同字号，避免撑高容器影响整行垂直对齐
.city-btn-chevron {
  font-size: 12px;
  color: $ios-text-tertiary;
  line-height: 1.4;
  flex-shrink: 0;
}

// 三段式一体胶囊（全宽）
.search-capsule {
  display: flex;
  align-items: center;
  height: 40px;
  background: #ffffff;
  border-radius: $ios-radius-lg;
  // NOTE: 轻阴影增加浮起感和内容层次
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.10), 0 0 0 0.5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

// 左段：城市选择
.capsule-city {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 0 12px 0 14px;
  flex-shrink: 0;
  height: 100%;

  &:active { opacity: 0.6; }
}

.capsule-location-emoji {
  font-size: 12px;
  line-height: 1;
}

.capsule-city-name {
  font-size: 12px;
  font-weight: $ios-font-weight-medium;
  color: $ios-text-primary;
  white-space: nowrap;
}

.capsule-dropdown {
  font-size: 10px;
  color: $ios-text-secondary;
  margin-top: 1px;
}

// 竖分隔线
.capsule-divider {
  width: 0.5px;
  height: 16px;
  background: rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

// 中段：搜索
.capsule-search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  height: 100%;
  min-width: 0;
}

.capsule-search-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  opacity: 0.4;
}

.capsule-input {
  flex: 1;
  font-size: 16px;
  color: $ios-text-primary;
  background: transparent;
  border: none;
  min-width: 0;
}

.capsule-input-placeholder {
  color: $ios-text-tertiary;
  font-size: 16px;
}

// 右段：筛选（嵌入胶囊内）
// NOTE: 固定宽度方形区域，点击响应好且不拉伸胶囊
.capsule-filter {
  width: 44px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.15s ease;

  &:active { opacity: 0.6; }

  // NOTE: 有筛选时图标变蓝色
  &--active {
    .capsule-filter-icon { filter: none; opacity: 1; }
  }
}

.capsule-filter-icon {
  width: 18px;
  height: 18px;
  opacity: 0.45;

  // NOTE: 有筛选时染蓝
  .capsule-filter--active & {
    filter: hue-rotate(0deg) saturate(10) brightness(0.6);
    opacity: 1;
  }
}

// NOTE: 筛选文字，默认次级色，有筛选激活时变蓝
.capsule-filter-text {
  font-size: 15px;
  font-weight: $ios-font-weight-medium;
  color: $ios-text-secondary;
  line-height: 1;

  .capsule-filter--active & {
    color: $ios-blue;
  }
}

// ── 筛选面板遮罩（全屏，覆盖 tab bar）──────────────────────
.filter-overlay {
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  // NOTE: 高于 tab bar 层级，使 bottom-sheet 完整遮住底部导航
  z-index: 9999;
  animation: filterMaskFadeIn 0.25s ease-out;
}
@keyframes filterMaskFadeIn {
  from { background: transparent; }
  to   { background: rgba(0, 0, 0, 0.45); }
}

// NOTE: bottom-sheet 本体，v-if 控制显隐，动画从底部滑入
.filter-sheet {
  background: #ffffff;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
  animation: filterSheetSlideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
@keyframes filterSheetSlideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

// 顶部把手条
.filter-sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.18);
  // NOTE: 把手与第一个分区之间预留足够空间
  margin: 14px auto 4px;
}

// 每个筛选分区
// NOTE: 上下边距较大，分区之间有明显呼吸感
.filter-section {
  padding: 16px 16px 8px;
}

.filter-section-title {
  font-size: $ios-font-size-md;
  font-weight: $ios-font-weight-semibold;
  color: $ios-text-primary;
  display: block;
  margin-bottom: 10px;
}

// NOTE: 城市切换行：无背景框，城市名左对齐，右箭头靠右
.filter-city-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;

  &:active { opacity: 0.7; }
}

.filter-city-name {
  font-size: 16px;
  font-weight: $ios-font-weight-medium;
  color: $ios-text-primary;
}

.filter-city-arrow {
  font-size: 12px;
  color: $ios-text-tertiary;
}

// ── iOS 垂直列表选项（替代胶囊） ────────────────────────
// 胶囊选项容器：横排，等宽平均分布
.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

// 单个胶囊：矩形圆角，等宽
.filter-chip {
  flex: 1;
  padding: 8px 4px;
  background: $ios-bg-secondary;
  border-radius: $ios-radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:active { opacity: 0.7; }

  // NOTE: 选中时蓝色实心
  &--active {
    background: $ios-blue;

    .filter-chip-text { color: #fff; }
  }
}

.filter-chip-text {
  font-size: 12px;
  color: $ios-text-primary;
  font-weight: $ios-font-weight-regular;
}

// 底部重置/确定按钮行
.filter-sheet-footer {
  display: flex;
  gap: 12px;
  padding: 16px 16px 8px;
  border-top: 0.5px solid $ios-separator;
  margin-top: 8px;
}

.filter-reset-btn {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $ios-bg-secondary;
  border-radius: $ios-radius-md;

  &:active { opacity: 0.7; }
}

.filter-reset-text {
  font-size: 16px;
  color: $ios-text-primary;
  font-weight: $ios-font-weight-medium;
}

.filter-confirm-btn {
  flex: 2;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $ios-blue;
  border-radius: $ios-radius-md;

  &:active { opacity: 0.85; }
}

.filter-confirm-text {
  font-size: 16px;
  color: #fff;
  font-weight: $ios-font-weight-semibold;
}

.activity-list {
  // NOTE: flex column + gap 统一控制卡片间距，不依赖卡片自身 margin
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px $ios-spacing-lg;
}

.empty {
  padding: $ios-spacing-xxl * 2;
  text-align: center;
  color: $ios-text-tertiary;
  font-size: $ios-font-size-md;
}

// ── 骨架屏样式 ─────────────────────────────────────────
// NOTE: shimmer 是从左到右扫过的光泽效果，比纯灰色 pulse 更有质感
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

// NOTE: 骨架元素共用这个 mixin：渐变扫光覆盖在灰色底上
%skeleton-base {
  background: linear-gradient(
    90deg,
    #E5E5EA 25%,
    #F0F0F5 50%,
    #E5E5EA 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite linear;
  border-radius: 6px;
}

.skeleton-card {
  background: #ffffff;
  border-radius: $ios-radius-lg;
  padding: $ios-spacing-lg;
  box-shadow: $ios-shadow-md;
}

// 上段：头像圆 + 文字列横排
.skeleton-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

// NOTE: 尺寸与 .host-avatar-wrap（60px）一致
.skeleton-avatar {
  @extend %skeleton-base;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.skeleton-line {
  @extend %skeleton-base;
  height: 14px;

  // NOTE: 各行宽度模拟真实内容宽度分布
  &--title { width: 70%; height: 16px; }
  &--sub   { width: 55%; height: 12px; }
  &--tag   { width: 40%; height: 12px; }
  &--nick  { width: 30%; height: 10px; margin-top: 6px; }
}

.skeleton-divider {
  height: 0.5px;
  background: rgba(0, 0, 0, 0.06);
  margin: 10px 0 8px;
}

// 底部参与者头像行
.skeleton-footer {
  display: flex;
  flex-direction: row;
  gap: 6px;
}

// NOTE: 尺寸与 .participant-avatar-wrap（56px）一致
.skeleton-participant {
  @extend %skeleton-base;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
