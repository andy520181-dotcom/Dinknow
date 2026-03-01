<template>
  <view class="create-page">
    <!-- NOTE: scroll-view 包裹全部内容，小屏幕自动滚动，大屏幕不滚动 -->
    <scroll-view class="create-scroll" scroll-y>
      <!-- 表单主体 -->
      <view class="ios-form">
          <!-- 左上角返回按键（独立于卡片之外） -->
          <view class="create-back-row" @tap="handleBack">
            <text class="create-back-icon">‹</text>
            <text class="create-back-text">返回</text>
          </view>

          <!-- 主信息卡片：发起人 + 标题 + 时间 + 地点 + DUPR水平 + 人数 + 费用 + 联系方式 -->
          <view class="ios-section">
            <!-- 发起人：头像紧贴标签右侧（靠左），昵称占满剩余宽度右对齐 -->
            <view class="ios-cell ios-cell--initiator">
            <image class="ios-cell__row-icon" src="/static/icons/faqiren.png" mode="aspectFit" />
              <text class="ios-cell__label">发起人</text>
              <image
                v-if="currentUser?.avatarUrl"
                class="ios-initiator__avatar"
                :src="currentUser.avatarUrl"
                mode="aspectFill"
              />
              <view v-else class="ios-initiator__avatar ios-initiator__avatar--placeholder" />
              <text class="ios-initiator__name">{{ currentUser?.nickName || '...' }}</text>
            </view>

            <!-- 标题 -->
            <view class="ios-cell ios-cell--input">
              <image class="ios-cell__row-icon" src="/static/icons/icon_title.png" mode="aspectFit" />
              <text class="ios-cell__label">标题</text>
              <input
                class="ios-cell__input ios-cell__input--right"
                placeholder="请输入"
                placeholder-class="ios-input-placeholder"
                :value="title"
                @input="onTitleInput"
              />
            </view>

            <!-- 时间：三列选择器（日期+星期 | 开始时间 | 结束时间） -->
            <view class="ios-cell ios-cell--tap">
              <image class="ios-cell__row-icon" src="/static/icons/shijian.png" mode="aspectFit" />
              <text class="ios-cell__label">时间</text>
              <picker
                mode="multiSelector"
                :range="timePickerRange"
                :value="timePickerValue"
                @change="onTimePickerChange"
                style="flex:1"
              >
                <view class="ios-cell__value ios-cell__value--right">
                  <text v-if="startDate" class="ios-time-val">{{ timeDisplayText }}</text>
                  <text v-else class="ios-cell__placeholder">请选择</text>
                </view>
              </picker>
              <text class="ios-cell__chevron">›</text>
            </view>

            <!-- 地点 -->
            <view class="ios-cell ios-cell--tap" @tap="handleChooseLocation">
              <image class="ios-cell__row-icon" src="/static/icons/dingwei.png" mode="aspectFit" />
              <text class="ios-cell__label">地点</text>
              <view class="ios-cell__value ios-cell__value--right ios-cell__value--ellipsis">
                <text v-if="venueName || address">{{ venueName || address }}</text>
                <text v-else class="ios-cell__placeholder">请选择</text>
              </view>
              <text class="ios-cell__chevron">›</text>
            </view>

            <!-- DUPR 水平 -->
            <view class="ios-cell ios-cell--tap">
              <image class="ios-cell__row-icon" src="/static/icons/dupr.png" mode="aspectFit" />
              <text class="ios-cell__label">DUPR 水平</text>
              <view class="ios-cell__value ios-cell__value--right">
                <picker
                  mode="selector"
                  :range="duprLevels"
                  :value="duprIndex"
                  @change="onDuprChange"
                >
                  <text :class="selectedDupr ? 'ios-picker-text' : 'ios-cell__placeholder'">
                    {{ selectedDupr || '请选择' }}
                  </text>
                </picker>
              </view>
              <text class="ios-cell__chevron">›</text>
            </view>

            <!-- 人数 -->
            <view class="ios-cell ios-cell--input">
              <image class="ios-cell__row-icon" src="/static/icons/renshu.png" mode="aspectFit" />
              <text class="ios-cell__label">人数</text>
              <input
                class="ios-cell__input ios-cell__input--right"
                type="number"
                placeholder="输入人数"
                placeholder-class="ios-input-placeholder"
                :value="maxParticipantsInput"
                @input="onMaxParticipantsInput"
              />
            </view>

            <!-- 费用：数字输入 + 固定「元/人」后缀 -->
            <view class="ios-cell ios-cell--fee">
              <image class="ios-cell__row-icon" src="/static/icons/feiyong.png" mode="aspectFit" />
              <text class="ios-cell__label">费用</text>
              <view class="ios-fee-row">
                <input
                  class="ios-fee-input"
                  type="digit"
                  placeholder="0"
                  placeholder-class="ios-input-placeholder"
                  :value="fee"
                  @input="onFeeInput"
                />
                <text class="ios-fee-unit">元/人</text>
              </view>
            </view>

            <!-- 联系方式 -->
            <view class="ios-cell ios-cell--input">
              <image class="ios-cell__row-icon" src="/static/icons/lianxi.png" mode="aspectFit" />
              <text class="ios-cell__label">联系方式</text>
              <input
                class="ios-cell__input ios-cell__input--right"
                placeholder="手机号或微信号"
                placeholder-class="ios-input-placeholder"
                :value="contactInfo"
                @input="onContactInput"
              />
            </view>
          </view>

          <!-- 备注卡片：点击跳转到独立编辑页 -->
          <view class="ios-section">
            <view class="ios-cell ios-cell--tap" @tap="goToRemarkEdit">
              <image class="ios-cell__row-icon" src="/static/icons/beizhu.png" mode="aspectFit" />
              <text class="ios-cell__label">备注</text>
              <view class="ios-cell__value ios-cell__value--right ios-cell__value--ellipsis">
                <text v-if="description">{{ description }}</text>
                <text v-else class="ios-cell__placeholder">选填，如注意事项、装备要求等</text>
              </view>
              <text class="ios-cell__chevron">›</text>
            </view>
          </view>
      </view>

      <!-- NOTE: 免责声明勾选行 -->
      <view class="disclaimer-row">
        <view class="disclaimer-checkbox" @tap="disclaimerAccepted = !disclaimerAccepted">
          <view class="disclaimer-checkbox-inner" :class="{ 'disclaimer-checkbox-inner--checked': disclaimerAccepted }">
            <text v-if="disclaimerAccepted" class="disclaimer-check-icon">✓</text>
          </view>
        </view>
        <text class="disclaimer-label">我已仔细阅读并同意</text>
        <text class="disclaimer-link" @tap.stop="goToDisclaimer">《免责声明》</text>
      </view>

      <!-- 底部发布按钮 -->
      <view class="create-footer">
        <view
          class="primary-btn"
          :class="{ 'primary-btn--disabled': submitting }"
          @tap="handleSubmitClick"
        >
          {{ submitting ? (editingActivityId ? '保存中...' : '发布中...') : (editingActivityId ? '保存修改' : '点击发布') }}
        </view>
      </view>
    </scroll-view>
  </view>

</template>


<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { createActivity, updateActivity } from '../../services/activity'
import { getProfile } from '../../services/user'
import { chooseLocation, getUserLocation } from '../../utils/location'
import type { LocationInfo, User } from '../../types'
import { STORAGE_USER_LOCATION } from '../../constants'


const disclaimerAccepted = ref(false)

// NOTE: 点击蓝色《免责声明》文字跳转到独立的免责声明页面
function goToDisclaimer() {
  uni.navigateTo({ url: '/pages/disclaimer/index' })
}

const title = ref('')
const startDate = ref('')
const startTime = ref('')
const endTime = ref('')
const address = ref('')
const venueName = ref('')
const latitude = ref<number | undefined>()
const longitude = ref<number | undefined>()
const maxParticipantsInput = ref('')
const fee = ref('')
const contactInfo = ref('')
const description = ref('')

const submitting = ref(false)
const editingActivityId = ref<string | null>(null)
const currentUser = ref<User | null>(null)

// NOTE: 7个必填字段全部填写后，发布按钮才可用（备注为选填，不影响）
const canSubmit = computed(() =>
  title.value.trim().length > 0 &&
  startDate.value.length > 0 &&
  startTime.value.length > 0 &&
  (venueName.value.trim().length > 0 || address.value.trim().length > 0) &&
  selectedDupr.value.length > 0 &&
  maxParticipantsInput.value.trim().length > 0 &&
  Number(maxParticipantsInput.value) > 0 &&
  fee.value.trim().length > 0 &&
  contactInfo.value.trim().length > 0 &&
  // NOTE: 必须勾选免责声明才能发布
  disclaimerAccepted.value
)

const duprLevels = ['初级 1.0-2.5', '中级 3.0-3.5', '高级 4.0-4.5', '专业级 5.0+']
const selectedDupr = ref<string>('')
const duprIndex = computed(() => {
  if (!selectedDupr.value) return 0
  const idx = duprLevels.indexOf(selectedDupr.value)
  return idx >= 0 ? idx : 0
})

// NOTE: 三列时间选择器数据生成
// 第一列：未来30天的日期+星期；第二、三列：以30分钟为单位的时间段
const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const dateRange = computed(() => {
  const dates: Array<{ label: string; value: string }> = []
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const month = d.getMonth() + 1
    const day = d.getDate()
    const weekday = WEEKDAY_NAMES[d.getDay()]
    const value = `${d.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    dates.push({ label: `${month}月${day}日 ${weekday}`, value })
  }
  return dates
})

// 半小时间隔时间列表，00:00 ~ 23:30（共48项）
const timeSlots: string[] = []
for (let h = 0; h < 24; h++) {
  timeSlots.push(`${String(h).padStart(2, '0')}:00`)
  timeSlots.push(`${String(h).padStart(2, '0')}:30`)
}

// 三列选择器 range
const timePickerRange = computed(() => [
  dateRange.value.map(d => d.label),
  timeSlots,
  timeSlots,
])

// 三列选择器当前选中索引
const timePickerValue = computed(() => {
  const dIdx = startDate.value
    ? dateRange.value.findIndex(d => d.value === startDate.value)
    : 0
  const sIdx = startTime.value ? timeSlots.indexOf(startTime.value) : 0
  const eIdx = endTime.value ? timeSlots.indexOf(endTime.value) : 0
  return [dIdx >= 0 ? dIdx : 0, sIdx >= 0 ? sIdx : 0, eIdx >= 0 ? eIdx : 0]
})

// 时间栏展示文案（日期+时间段）
const timeDisplayText = computed(() => {
  if (!startDate.value) return ''
  const dateLabel = dateRange.value.find(d => d.value === startDate.value)?.label || startDate.value
  const timePart = endTime.value ? `${startTime.value}-${endTime.value}` : startTime.value
  return `${dateLabel} ${timePart}`
})

// 读取 remark 编辑页保存的内容
function syncRemarkFromStorage() {
  const cached = uni.getStorageSync('editing_activity_remark')
  if (typeof cached === 'string') {
    description.value = cached
  }
}

// 从本地缓存读取正在编辑的活动，并预填充到表单中
function applyEditingActivityFromStorage() {
  const editingActivity = uni.getStorageSync('editing_activity')
  if (editingActivity && editingActivity._id) {
    editingActivityId.value = editingActivity._id

    let editingTitle = editingActivity.title || ''
    const oldPrefixes = ['单打-', '双打-', '混双-', '不限-']
    for (const p of oldPrefixes) {
      if (editingTitle.startsWith(p)) {
        editingTitle = editingTitle.substring(p.length)
        break
      }
    }

    title.value = editingTitle
    startDate.value = editingActivity.startDate || ''
    startTime.value = editingActivity.startTime || ''
    endTime.value = editingActivity.endTime || ''
    address.value = editingActivity.address || ''
    venueName.value = editingActivity.venueName || ''
    latitude.value = editingActivity.latitude
    longitude.value = editingActivity.longitude
    maxParticipantsInput.value = editingActivity.maxParticipants ? String(editingActivity.maxParticipants) : '8'
    fee.value = editingActivity.fee != null ? String(editingActivity.fee) : ''
    contactInfo.value = editingActivity.contactInfo || ''
    // NOTE: 将旧格式（纯数字区间）映射到新带前缀格式，兼容历史数据
    const legacyDuprMap: Record<string, string> = {
      '1.0-2.5': '初级 1.0-2.5',
      '3.0-3.5': '中级 3.0-3.5',
      '4.0-4.5': '高级 4.0-4.5',
      '5.0+': '专业级 5.0+',
    }
    const raw = editingActivity.duprLevel || ''
    selectedDupr.value = legacyDuprMap[raw] ?? (duprLevels.includes(raw) ? raw : '')
    description.value = editingActivity.description || ''
  }
}

// 选择位置
async function handleChooseLocation() {
  const loc = await chooseLocation()
  if (loc) {
    address.value = loc.address || loc.name || ''
    venueName.value = loc.name || ''
    latitude.value = loc.latitude
    longitude.value = loc.longitude
    try {
      const cache: LocationInfo = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        address: loc.address || loc.name || ''
      }
      uni.setStorageSync(STORAGE_USER_LOCATION, cache)
    } catch (e) {
      console.error('缓存位置失败:', e)
    }
  }
}

// 输入/选择处理
function onTitleInput(e: any) {
  title.value = e?.detail?.value ?? ''
}
// 三列时间选择器确定后同步三个值
function onTimePickerChange(e: any) {
  const [dIdx, sIdx, eIdx] = (e?.detail?.value as number[]) ?? [0, 0, 0]
  const selectedDate = dateRange.value[dIdx]
  if (selectedDate) startDate.value = selectedDate.value
  startTime.value = timeSlots[sIdx] ?? ''
  endTime.value = timeSlots[eIdx] ?? ''
}
function onDuprChange(e: any) {
  const idx = Number(e?.detail?.value ?? 0)
  // NOTE: 新格式直接存完整标签（如「初级 1.0-2.5」）
  selectedDupr.value = duprLevels[idx] ?? ''
}
function onMaxParticipantsInput(e: any) {
  maxParticipantsInput.value = e?.detail?.value ?? ''
}
function onFeeInput(e: any) {
  fee.value = e?.detail?.value ?? ''
}
function onContactInput(e: any) {
  contactInfo.value = e?.detail?.value ?? ''
}

function onDescriptionInput(e: any) {
  description.value = e?.detail?.value ?? ''
}

function goToRemarkEdit() {
  uni.setStorageSync('editing_activity_remark', description.value || '')
  uni.navigateTo({ url: '/pages/edit-remark/index' })
}

function handleBack() {
  // 统一回到广场页，避免复杂返回栈问题
  uni.switchTab({ url: '/pages/index/index' })
}

// NOTE: 按鈕点击入口：始终响应。若有未填字段，弹窗列出所有缺漏项；全部填写后执行真正的 submit
function handleSubmitClick() {
  if (submitting.value) return

  // 收集所有未填字段
  const missing: string[] = []
  if (!title.value.trim()) missing.push('标题')
  if (!startDate.value || !startTime.value) missing.push('时间')
  if (!venueName.value.trim() && !address.value.trim()) missing.push('地点')
  if (!selectedDupr.value) missing.push('DUPR 水平')
  if (!maxParticipantsInput.value.trim() || Number(maxParticipantsInput.value) <= 0) missing.push('人数')
  if (!fee.value.trim()) missing.push('费用')
  if (!contactInfo.value.trim()) missing.push('联系方式')
  if (!disclaimerAccepted.value) missing.push('免责声明未勾选')

  if (missing.length > 0) {
    uni.showModal({
      title: '请完善以下信息',
      content: missing.join('、'),
      showCancel: false,
      confirmText: '知道了'
    })
    return
  }

  handleSubmit()
}

// 提交（创建或更新活动）
async function handleSubmit() {
  if (!title.value.trim()) {
    uni.showToast({ title: '请输入活动标题', icon: 'none' })
    return
  }
  if (!startDate.value || !startTime.value) {
    uni.showToast({ title: '请选择日期和时间', icon: 'none' })
    return
  }
  if (!(venueName.value || address.value)) {
    uni.showToast({ title: '请选择地点', icon: 'none' })
    return
  }

  const maxNum = Number(maxParticipantsInput.value || '8')
  if (!maxNum || maxNum <= 0) {
    uni.showToast({ title: '请输入正确人数', icon: 'none' })
    return
  }

  const feeNum = fee.value.trim()
    ? parseFloat(fee.value.trim())
    : 0
  if (fee.value.trim() && (isNaN(feeNum) || feeNum < 0)) {
    uni.showToast({ title: '请输入正确金额', icon: 'none' })
    return
  }

  const payload = {
    title: title.value.trim(),
    startDate: startDate.value,
    startTime: startTime.value,
    endTime: endTime.value || undefined,
    address: address.value.trim() || venueName.value.trim(),
    venueName: venueName.value.trim() || undefined,
    latitude: latitude.value,
    longitude: longitude.value,
    maxParticipants: maxNum,
    fee: feeNum,
    contactInfo: contactInfo.value.trim() || undefined,
    duprLevel: selectedDupr.value || undefined,
    description: description.value.trim() || undefined
  }

  submitting.value = true
  try {
    if (editingActivityId.value) {
      const result = await updateActivity(editingActivityId.value, payload)
      if (result?.success === false) {
        uni.showToast({ title: result.message || '保存失败', icon: 'none' })
        return
      }
      uni.setStorageSync('activity_just_updated', true)
      uni.$emit('activity-updated', { activityId: editingActivityId.value })
      uni.showToast({ title: '已保存', icon: 'success' })
    } else {
      const result = await createActivity(payload)
      if (result?.success === false) {
        uni.showToast({ title: result.message || '发布失败', icon: 'none' })
        return
      }
      uni.setStorageSync('activity_just_published', true)
      uni.$emit('activity-created', { activityId: (result as any)?.activityId || (result as any)?._id })
      uni.showToast({ title: '发布成功', icon: 'success' })
      // NOTE: 发布成功后重置表单内容，不包括编辑模式
      resetForm()
    }

    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 600)
  } catch (error: any) {
    uni.showToast({ title: error?.errMsg || error?.message || '操作失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

// NOTE: 发布成功后重置所有必填字段和选填内容
function resetForm() {
  title.value = ''
  startDate.value = ''
  startTime.value = ''
  endTime.value = ''
  address.value = ''
  venueName.value = ''
  latitude.value = undefined
  longitude.value = undefined
  maxParticipantsInput.value = ''
  fee.value = ''
  contactInfo.value = ''
  description.value = ''
  selectedDupr.value = ''
  editingActivityId.value = null
  // 清空备注缓存
  uni.removeStorageSync('editing_activity_remark')
  uni.removeStorageSync('editing_activity_id')
}

// 初始：加载当前用户信息 + 缓存位置 + 编辑数据 + 备注
onMounted(async () => {
  // 并行加载用户信息和位置，提高加载速度
  const [profile] = await Promise.allSettled([
    getProfile(),
    (async () => {
      try {
        const cached = uni.getStorageSync(STORAGE_USER_LOCATION) as LocationInfo | undefined
        if (cached?.address) {
          address.value = cached.address
          latitude.value = cached.latitude
          longitude.value = cached.longitude
        } else {
          const loc = await getUserLocation()
          if (loc) {
            address.value = loc.address || ''
            latitude.value = loc.latitude
            longitude.value = loc.longitude
          }
        }
      } catch (error) {
        console.error('加载位置失败:', error)
      }
    })()
  ])
  if (profile.status === 'fulfilled') {
    currentUser.value = profile.value
  }

  applyEditingActivityFromStorage()
  syncRemarkFromStorage()
})

// NOTE: 每次切回页面：同步活动备注，并刷新用户头像/昵称（兼容个人页修改后返回）
onShow(() => {
  applyEditingActivityFromStorage()
  syncRemarkFromStorage()
  getProfile().then(profile => {
    if (profile) currentUser.value = profile
  }).catch(() => {})
})
</script>

<style lang="scss" scoped>
.create-page {
  // NOTE: 固定为一屏高度，scroll-view 内部处理滚动
  height: 100%;
  background: $ios-bg-secondary;
  display: flex;
  flex-direction: column;
}

// NOTE: scroll-view 擔满全局，内容超出时自动滚动
.create-scroll {
  flex: 1;
  height: 100%;
}

// NOTE: 表单区普通块布局，高度由内容决定
.ios-form {
  width: 100%;
}

.ios-section {
  background: $ios-bg-primary;
  border-radius: 0;
  // NOTE: 缩小 section 间距，适配一屏显示
  margin-bottom: $ios-spacing-sm;
  overflow: hidden;
}

// NOTE: 返回按钮独立于信息卡片之外，在页面顶部单独显示
.create-back-row {
  display: inline-flex;
  align-items: center;
  padding: $ios-spacing-sm $ios-spacing-lg $ios-spacing-xs;
}

.create-back-icon {
  font-size: 22px;
  color: $ios-blue;
  margin-right: 2px;
}

.create-back-text {
  font-size: 16px;
  color: $ios-blue;
}

// NOTE: 发起人行：头像紧贴标签右侧、昵称占剩余布局并靠右
.ios-cell--initiator {
  // 本行无需额外样式，继承 ios-cell 的 flex 布局就可以
}

// NOTE: 行左侧小图标，与标签文字垂直居中对齐
.ios-cell__row-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-right: 6px;
}

.ios-initiator__avatar {
  // NOTE: 缩小头像尺寸以节省垂直空间
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-right: $ios-spacing-xs;
  // NOTE: 与广场页 card-avatar-wrap 一致，避免白色头像与白底融合
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.ios-initiator__avatar--placeholder {
  background: $ios-bg-tertiary;
}

.ios-initiator__name {
  flex: 1;
  font-size: 16px;
  color: $ios-text-primary;
  text-align: right;
}

.ios-cell {
  // NOTE: 每个标题栏保持 60px 高度，保证各行间距一致
  min-height: 60px;
  padding: 0 $ios-spacing-lg;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  box-sizing: border-box;
}


.ios-cell:last-child {
  border-bottom-width: 0;
}

.ios-cell__label {
  font-size: 16px;
  color: $ios-text-secondary;
  flex-shrink: 0;
  // NOTE: 加宽以适配「联系方式」「DUPR 水平」等较长标签
  width: 88px;
}

.ios-cell__value {
  flex: 1;
  font-size: 16px;
  color: $ios-text-primary;
  min-width: 0;
}

// NOTE: 右对齐的值区域（选择器、地点等）
.ios-cell__value--right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  text-align: right;
}

.ios-cell__value--ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
}

// NOTE: 时间值区域横排显示（日期 · 时间）
.ios-cell__value--time {
  gap: 4px;
}

.ios-time-val {
  font-size: 16px;
  color: $ios-text-primary;
}

.ios-time-sep {
  color: $ios-text-tertiary;
  font-size: 14px;
  margin: 0 2px;
}

.ios-picker-text {
  font-size: 16px;
  color: $ios-text-primary;
}

.ios-cell__placeholder {
  color: $ios-text-tertiary;
}

.ios-cell__chevron {
  font-size: 18px;
  color: $ios-text-tertiary;
  margin-left: $ios-spacing-xs;
}

.ios-cell--tap {
  padding-right: $ios-spacing-md;
}

// NOTE: 输入框右对齐，与选择器值视觉统一
.ios-cell__input {
  flex: 1;
  font-size: 16px;
  color: $ios-text-primary;
  text-align: right;
}

.ios-cell__input--right {
  text-align: right;
}

.ios-input-placeholder {
  color: $ios-text-tertiary;
  text-align: right;
}

// NOTE: 备注卡片使用两段式布局（标签行 + 内容体）
.ios-section--remark {
  overflow: hidden;
}

// NOTE: 费用栏：数字输入居右，「元/人」固定后缀
.ios-cell--fee {
  // 继承 ios-cell flex 布局
}

.ios-fee-row {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.ios-fee-input {
  font-size: 16px;
  color: $ios-text-primary;
  text-align: right;
  min-width: 40px;
  max-width: 100px;
}

.ios-fee-unit {
  font-size: 16px;
  color: $ios-text-secondary;
  flex-shrink: 0;
}

.ios-cell--remark-top {
  border-bottom-width: 0;
  padding-bottom: $ios-spacing-xs;
}

.ios-remark-body {
  padding: 0 $ios-spacing-lg $ios-spacing-md;
  min-height: 60px;
}

.ios-remark-content {
  font-size: 16px;
  color: $ios-text-primary;
  line-height: 1.5;
}

// NOTE: 备注内联 textarea，自动撑高，不跳转
.ios-remark-textarea {
  width: 100%;
  min-height: 60px;
  font-size: 16px;
  color: $ios-text-primary;
  line-height: 1.5;
}

.create-footer {
  // NOTE: 缩减底部按钮区域上下间距，紧贴表单，适配不同屏幕高度
  padding: $ios-spacing-sm $ios-spacing-lg calc($ios-spacing-md + env(safe-area-inset-bottom));
  background: $ios-bg-secondary;
  flex-shrink: 0;
}

.primary-btn {
  width: 100%;
  height: 60px;
  border-radius: $ios-radius-lg;
  background: $ios-blue;
  color: #ffffff;
  font-size: 16px;
  font-weight: $ios-font-weight-medium;
  display: flex;
  align-items: center;
  justify-content: center;
}

// NOTE: 用 class 控制禁用外观，绕开微信 button 内置 disabled 浅灰样式
.primary-btn--disabled {
  background: #8e8e93;
}
// NOTE: 免责声明勾选行已移入 scroll-view 内容区底部，融入表单流；
// 去掉独立背景，使用与表单一致的左右边距
.disclaimer-row {
  display: flex;
  align-items: center;
  // NOTE: 免责声明行收紧 padding，减少垂直占用
  padding: $ios-spacing-xs $ios-spacing-lg;
  flex-shrink: 0;
}

.disclaimer-checkbox {
  width: 22px;
  height: 22px;
  margin-right: 8px;
  flex-shrink: 0;
}

.disclaimer-checkbox-inner {
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

.disclaimer-check-icon {
  font-size: 13px;
  color: #ffffff;
  line-height: 1;
}

.disclaimer-label {
  font-size: 13px;
  color: $ios-text-secondary;
}

.disclaimer-link {
  font-size: 13px;
  color: $ios-blue;
  font-weight: $ios-font-weight-medium;
}

// NOTE: 弹层已改为独立页面（pages/disclaimer/index）
// 以下弹层相关样式已全部移除
</style>
