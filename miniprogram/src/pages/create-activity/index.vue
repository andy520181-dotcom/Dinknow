<template>
  <view class="create-page">
    <!-- NOTE: scroll-view 包裹全部内容，小屏幕自动滚动，大屏幕不滚动 -->
    <scroll-view class="create-scroll" scroll-y>
      <!-- 表单主体 -->
      <view class="ios-form">
          <!-- 左上角返回按键（独立于卡片之外） -->
          <view class="create-back-row" @tap="handleBack">
            <text class="create-back-icon">‹</text>
          </view>

          <!-- 主信息卡片：发起人 + 标题 + 时间 + 地点 + DUPR水平 + 人数 + 费用 + 联系方式 -->
          <view class="ios-section">

            <!-- 标题 -->
            <view class="ios-cell ios-cell--input">
              <image class="ios-cell__row-icon" src="/static/icons/biaotitubiao.png" mode="aspectFit" />
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
              <image class="ios-cell__row-icon" src="/static/icons/shijian-2.png" mode="aspectFit" />
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
              <image class="ios-cell__row-icon" src="/static/icons/zhiyuandidian4.png" mode="aspectFit" />
              <text class="ios-cell__label">地点</text>
              <view class="ios-cell__value ios-cell__value--right ios-cell__value--ellipsis">
                <text v-if="venueName || address">{{ venueName || address }}</text>
                <text v-else class="ios-cell__placeholder">请选择</text>
              </view>
              <text class="ios-cell__chevron">›</text>
            </view>

            <!-- DUPR 水平 -->
            <view class="ios-cell ios-cell--tap">
              <image class="ios-cell__row-icon" src="/static/icons/pikeqiu-2.png" mode="aspectFit" />
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

            <!-- 人数：步进器 -->
            <view class="ios-cell">
              <image class="ios-cell__row-icon" src="/static/icons/renshu-2.png" mode="aspectFit" />
              <text class="ios-cell__label">人数</text>
              <view class="stepper">
                <view class="stepper-btn" @tap="stepDown">
                  <text class="stepper-btn-text">−</text>
                </view>
                <text class="stepper-value">{{ maxParticipantsInput || '8' }}</text>
                <view class="stepper-btn" @tap="stepUp">
                  <text class="stepper-btn-text">+</text>
                </view>
              </view>
            </view>

            <!-- 费用：均摊 / 金额 标签切换，结构与联系方式栏完全对称 -->
            <view class="ios-cell ios-cell--fee">
              <image class="ios-cell__row-icon" src="/static/icons/feiyongdanju.png" mode="aspectFit" />
              <text class="ios-cell__label ios-cell__label--inline">费用</text>
              <!-- NOTE: 标签文字与胶囊切换之间的浅灰色竖线分隔 -->
              <view class="cell-divider" />
              <!-- 类型切换胶囊 -->
              <view class="contact-type-tabs">
                <view
                  class="contact-type-tab"
                  :class="{ 'contact-type-tab--active': feeTypeTouched && feeType === 'aa' }"
                  @tap="selectFeeType('aa')"
                >
                  <text class="contact-type-tab-text">均摊</text>
                </view>
                <view
                  class="contact-type-tab"
                  :class="{ 'contact-type-tab--active': feeTypeTouched && feeType === 'custom' }"
                  @tap="selectFeeType('custom')"
                >
                  <text class="contact-type-tab-text">金额</text>
                </view>
              </view>
              <!-- NOTE: 均摊时显示只读"AA"，flex:1 确保与金额行占同一右侧区域 -->
              <text
                v-if="feeTypeTouched && feeType === 'aa'"
                class="ios-fee-aa"
              >AA</text>
              <!-- NOTE: 金额时显示数字输入框 + 元/人后缀 -->
              <view v-if="feeTypeTouched && feeType === 'custom'" class="ios-fee-row">
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


            <!-- 联系方式：类型切换 + 输入框 -->
            <view class="ios-cell ios-cell--contact">
              <image class="ios-cell__row-icon" src="/static/icons/lianxifangshi.png" mode="aspectFit" />
              <text class="ios-cell__label ios-cell__label--inline">联系方式</text>
              <!-- NOTE: 标签文字与胶囊切换之间的浅灰色竖线分隔 -->
              <view class="cell-divider" />
              <!-- 类型切换胶囊 -->
              <view class="contact-type-tabs">
                <view
                  class="contact-type-tab"
                  :class="{ 'contact-type-tab--active': contactTypeTouched && contactType === 'phone' }"
                  @tap="selectContactType('phone')"
                >
                  <text class="contact-type-tab-text">手机</text>
                </view>
                <view
                  class="contact-type-tab"
                  :class="{ 'contact-type-tab--active': contactTypeTouched && contactType === 'wechat' }"
                  @tap="selectContactType('wechat')"
                >
                  <text class="contact-type-tab-text">微信</text>
                </view>
              </view>
              <!-- NOTE: 手机和微信各一个 input，用 v-show 切换，避免切换类型时 placeholder 闪现 -->
              <input
                v-show="contactTypeTouched && contactType === 'phone'"
                class="ios-contact-input"
                type="number"
                placeholder="请输入手机号"
                placeholder-class="ios-input-placeholder"
                :value="phoneContact"
                @input="(e: any) => { phoneContact = e.detail.value }"
              />
              <input
                v-show="contactTypeTouched && contactType === 'wechat'"
                class="ios-contact-input"
                type="text"
                placeholder="请输入微信号"
                placeholder-class="ios-input-placeholder"
                :value="wechatContact"
                @input="(e: any) => { wechatContact = e.detail.value }"
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
        <text class="disclaimer-label">我已阅读并同意</text>
        <text class="disclaimer-link" @tap.stop="goToDisclaimer">《免责声明》</text>
      </view>

      <!-- 底部发布按钮 -->
      <view class="create-footer">
        <view
          class="primary-btn"
          :class="{ 'primary-btn--disabled': submitting }"
          @tap="handleSubmitClick"
        >
          {{ submitting ? (editingActivityId ? '保存中...' : '发布中...') : (editingActivityId ? '保存修改' : '立即发布') }}
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
const maxParticipantsInput = ref('8')
const fee = ref('')
// NOTE: 费用类型：aa | custom。初始不高亮，首次点击后激活，与联系方式逻辑一致
const feeType = ref<'aa' | 'custom'>('custom')
const feeTypeTouched = ref(false)

function selectFeeType(type: 'aa' | 'custom') {
  // NOTE: 再次点击已选中的标签 → 取消选中
  if (feeTypeTouched.value && feeType.value === type) {
    feeTypeTouched.value = false
    return
  }
  feeType.value = type
  feeTypeTouched.value = true
  // NOTE: 切换为 AA 时清空自定义金额，避免残留旧值
  if (type === 'aa') fee.value = ''
}

// NOTE: 手机和微信号独立存储，切换类型时各自空白，不互相污染
const phoneContact = ref('')
const wechatContact = ref('')
// NOTE: 联系方式类型：phone | wechat，默认手机
const contactType = ref<'phone' | 'wechat'>('phone')
// NOTE: 初始不高亮任何胶囊，与其他字段初始空白状态保持视觉一致；用户首次点击后才激活蓝色选中态
const contactTypeTouched = ref(false)

function selectContactType(type: 'phone' | 'wechat') {
  // NOTE: 再次点击已选中的标签 → 取消选中
  if (contactTypeTouched.value && contactType.value === type) {
    contactTypeTouched.value = false
    return
  }
  contactType.value = type
  contactTypeTouched.value = true
}
// NOTE: 当前激活输入框绑定的字段
const activeContactInfo = computed(() =>
  contactType.value === 'phone' ? phoneContact.value : wechatContact.value
)
const description = ref('')
// NOTE: 备注页选择的图片临时路径/cloud URL列表
const remarkImages = ref<string[]>([])
// NOTE: 标记用户是否手动选择了地点，防止 onShow 重新加载时被旧地址覆盖
const locationManuallySet = ref(false)
// NOTE: 头像加载完成标记，用于触发淡入动画
const avatarLoaded = ref(false)

const submitting = ref(false)
const editingActivityId = ref<string | null>(null)
const currentUser = ref<User | null>(null)

// NOTE: 7个必填字段全部填写后，发布按钮才可用（备注为选填，不影响）
// 费用：选了 AA 则直接满足；选了自定义则需要有金额输入
const feeValid = computed(() =>
  feeTypeTouched.value && (feeType.value === 'aa' || fee.value.trim().length > 0)
)

const canSubmit = computed(() =>
  title.value.trim().length > 0 &&
  startDate.value.length > 0 &&
  startTime.value.length > 0 &&
  (venueName.value.trim().length > 0 || address.value.trim().length > 0) &&
  selectedDupr.value.length > 0 &&
  maxParticipantsInput.value.trim().length > 0 &&
  Number(maxParticipantsInput.value) > 0 &&
  feeValid.value &&
  activeContactInfo.value.trim().length > 0 &&
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

// 读取 remark 编辑页保存的内容（文字 + 图片）
function syncRemarkFromStorage() {
  const cached = uni.getStorageSync('editing_activity_remark')
  if (typeof cached === 'string') description.value = cached

  const cachedImages = uni.getStorageSync('editing_activity_remark_images')
  if (Array.isArray(cachedImages)) remarkImages.value = cachedImages
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
    // NOTE: 只有用户未手动选地点时才回填旧地址，避免视图层覆盖用户刚选的新地址
    if (!locationManuallySet.value) {
      address.value = editingActivity.address || ''
      venueName.value = editingActivity.venueName || ''
      latitude.value = editingActivity.latitude
      longitude.value = editingActivity.longitude
    }
    maxParticipantsInput.value = editingActivity.maxParticipants ? String(editingActivity.maxParticipants) : '8'
    // NOTE: -1 代表 AA 模式，否则为自定义金额
    if (editingActivity.fee === -1) {
      feeType.value = 'aa'
      feeTypeTouched.value = true
      fee.value = ''
    } else {
      feeType.value = 'custom'
      feeTypeTouched.value = true
      fee.value = editingActivity.fee != null ? String(editingActivity.fee) : ''
    }
    // NOTE: 判断联系方式类型：全数字 → 手机，否则 → 微信
    const savedContact = editingActivity.contactInfo || ''
    if (/^\d+$/.test(savedContact)) {
      contactType.value = 'phone'
      contactTypeTouched.value = true
      phoneContact.value = savedContact
    } else {
      contactType.value = 'wechat'
      contactTypeTouched.value = true
      wechatContact.value = savedContact
    }
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
    // NOTE: 标记已手动选地，防止小程序地图选点关闭后 onShow 重新加载时覆盖地址
    locationManuallySet.value = true
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

// NOTE: 步进器减少（最小 2）
function stepDown() {
  const cur = parseInt(maxParticipantsInput.value) || 8
  if (cur > 2) maxParticipantsInput.value = String(cur - 1)
}

// NOTE: 步进器增加（最大 50）
function stepUp() {
  const cur = parseInt(maxParticipantsInput.value) || 8
  if (cur < 50) maxParticipantsInput.value = String(cur + 1)
}
function onFeeInput(e: any) {
  fee.value = e?.detail?.value ?? ''
}
function onContactInput(e: any) {
  const val = e?.detail?.value ?? ''
  // NOTE: 各类型独立写入，切换类型后另一个字段保持原值
  if (contactType.value === 'phone') phoneContact.value = val
  else wechatContact.value = val
}

function onDescriptionInput(e: any) {
  description.value = e?.detail?.value ?? ''
}

function goToRemarkEdit() {
  uni.setStorageSync('editing_activity_remark', description.value || '')
  uni.setStorageSync('editing_activity_remark_images', remarkImages.value)
  uni.navigateTo({ url: '/pages/edit-remark/index' })
}

function handleBack() {
  // NOTE: 编辑模式下未保存退出，弹确认框防止误操作丢失编辑内容
  if (editingActivityId.value) {
    uni.showModal({
      title: '提示',
      content: '当前修改尚未保存，确定要放弃吗？',
      confirmText: '放弃',
      confirmColor: '#FF3B30',
      cancelText: '继续编辑',
      success: (res) => {
        if (res.confirm) {
          // 清除编辑缓存，恢复初始状态
          uni.removeStorageSync('editing_activity')
          uni.removeStorageSync('editing_activity_remark')
          uni.removeStorageSync('editing_activity_remark_images')
          resetForm()
          uni.switchTab({ url: '/pages/index/index' })
        }
        // 取消则留在当前页面继续编辑
      }
    })
    return
  }
  // 非编辑模式（新建），直接返回
  uni.switchTab({ url: '/pages/index/index' })
}

// NOTE: 按鈕点击入口：始终响应。若有未填字段，弹窗列出所有缺漏项；全部填写后执行真正的 submit
function handleSubmitClick() {
  if (submitting.value) return

  // NOTE: 只提示第一个未填项，用 toast 轻提示，不打断用户操作
  if (!title.value.trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' }); return
  }
  if (!startDate.value || !startTime.value) {
    uni.showToast({ title: '请选择时间', icon: 'none' }); return
  }
  if (!venueName.value.trim() && !address.value.trim()) {
    uni.showToast({ title: '请选择地点', icon: 'none' }); return
  }
  if (!selectedDupr.value) {
    uni.showToast({ title: '请选择DUPR水平', icon: 'none' }); return
  }
  if (!maxParticipantsInput.value.trim() || Number(maxParticipantsInput.value) <= 0) {
    uni.showToast({ title: '请输入人数', icon: 'none' }); return
  }
  if (!feeTypeTouched.value) {
    uni.showToast({ title: '请选择费用类型', icon: 'none' }); return
  }
  if (feeType.value === 'custom' && !fee.value.trim()) {
    uni.showToast({ title: '请输入费用', icon: 'none' }); return
  }
  if (!activeContactInfo.value.trim()) {
    uni.showToast({ title: '请输入联系方式', icon: 'none' }); return
  }
  if (!disclaimerAccepted.value) {
    uni.showToast({ title: '请先阅读并同意免责声明', icon: 'none' }); return
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

  // NOTE: AA 模式 fee 存 -1 作为标识，区别于免费（0）和自定义金额
  let feeNum = 0
  if (feeType.value === 'aa') {
    feeNum = -1
  } else {
    feeNum = fee.value.trim() ? parseFloat(fee.value.trim()) : 0
    if (fee.value.trim() && (isNaN(feeNum) || feeNum < 0)) {
      uni.showToast({ title: '请输入正确金额', icon: 'none' })
      return
    }
  }

  // NOTE: 备注图片：临时路径上传到云存储，获取 fileID
  let uploadedImages: string[] = []
  // #ifdef MP-WEIXIN
  if (remarkImages.value.length > 0) {
    uni.showLoading({ title: '处理图片...' })
    try {
      const tasks = remarkImages.value.map((path, i) => {
        // 已是 cloud:// 的跳过重传
        if (path.startsWith('cloud://')) return Promise.resolve(path)
        const cloudPath = `activity-remarks/${Date.now()}-${i}.jpg`
        return (wx as any).cloud.uploadFile({ cloudPath, filePath: path })
          .then((r: any) => r.fileID as string)
      })
      uploadedImages = await Promise.all(tasks)
    } catch (e) {
      console.error('图片上传失败:', e)
    } finally {
      uni.hideLoading()
    }
  }
  // #endif

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
    contactInfo: activeContactInfo.value.trim() || undefined,
    contactType: contactType.value,
    duprLevel: selectedDupr.value || undefined,
    description: description.value.trim() || undefined,
    images: uploadedImages.length > 0 ? uploadedImages : undefined
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
  maxParticipantsInput.value = '8'
  fee.value = ''
  feeType.value = 'custom'
  feeTypeTouched.value = false
  phoneContact.value = ''
  wechatContact.value = ''
  description.value = ''
  selectedDupr.value = ''
  editingActivityId.value = null
  // 清空备注缓存
  uni.removeStorageSync('editing_activity_remark')
  uni.removeStorageSync('editing_activity_remark_images')
  uni.removeStorageSync('editing_activity_id')
  remarkImages.value = []
  locationManuallySet.value = false
  contactTypeTouched.value = false
  disclaimerAccepted.value = false
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
    if (profile) {
      currentUser.value = profile
    } else {
      // NOTE: 未登录时清空表单，避免退出登录后仍显示上次填写的内容
      resetForm()
    }
  }).catch(() => {})
})
</script>

<style lang="scss" scoped>
.create-page {
  // NOTE: 固定为一屏高度，scroll-view 内部处理滚动
  height: 100%;
  // NOTE: 与全局页面统一使用暖中性灰
  background: #F5F5F5;
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
  border-radius: 14px;
  // NOTE: margin-bottom 与左右边距统一为 16px，卡片间距与边距一致，整体更规整
  margin: 0 16px $ios-spacing-lg;
  overflow: hidden;
}

// NOTE: 返回按钮独立于信息卡片之外，在页面顶部单独显示
.create-back-row {
  display: inline-flex;
  align-items: center;
  // NOTE: 底部增大到 lg，与信息卡片拉开呼吸间距
  padding: $ios-spacing-sm $ios-spacing-lg $ios-spacing-lg;
}

.create-back-icon {
  font-size: 24px;
  color: #333333;
  margin-right: 2px;
}

.create-back-text {
  font-size: 16px;
  color: #333333;
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

// NOTE: 头像内容容器：始终显示占位灰圆，相对定位容纳出现的头像
.ios-initiator__avatar-wrap {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-right: $ios-spacing-xs;
  background: $ios-bg-tertiary;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.ios-initiator__avatar {
  // NOTE: 默认不可见，加载完成后通过 --loaded 类淡入
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.2s ease;

  &--loaded {
    opacity: 1;
  }
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

// NOTE: 费用/联系方式栏专用：取消固定宽度，胶囊紧跟标签文字
.ios-cell__label--inline {
  width: auto;
  margin-right: 0;
}

// NOTE: 标签文字与切换胶囊之间的浅灰竖线分隔符，与 iOS 表单分隔风格一致
.cell-divider {
  width: 0.5px;
  height: 16px;
  background: rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  margin-right: 8px;
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
  font-size: 12px;
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
  font-size: 16px;
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
// ── 步进器（人数栏）────────────────────────────────────────
.stepper {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0;
}

.stepper-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: $ios-bg-secondary;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:active { opacity: 0.6; }
}

.stepper-btn-text {
  font-size: 16px;
  font-weight: $ios-font-weight-medium;
  color: #333333;
  line-height: 1;
}

.stepper-value {
  min-width: 44px;
  text-align: center;
  font-size: 16px;
  font-weight: $ios-font-weight-regular;
  color: $ios-text-primary;
}

// ── 联系方式：类型切换胶囊 ──────────────────────────────────
.ios-cell--contact {
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 10px;
  padding-bottom: 10px;
  min-height: 60px;
  align-items: center;
}

.contact-type-tabs {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.contact-type-tab {
  padding: 4px 10px;
  border-radius: 20px;
  background: $ios-bg-secondary;
  transition: all 0.15s ease;

  &--active {
    background: $ios-blue;
    .contact-type-tab-text { color: #fff; }
  }

  &:active { opacity: 0.7; }
}

.contact-type-tab-text {
  font-size: 12px;
  color: $ios-text-secondary;
  white-space: nowrap;
}

.ios-contact-input {
  flex: 1;
  min-width: 80px;
  font-size: 16px;
  color: $ios-text-primary;
  text-align: right;
}

// NOTE: 费用栏与联系方式栏对齐，支持标签+输入框换行排列
.ios-cell--fee {
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 10px;
  padding-bottom: 10px;
  min-height: 60px;
  align-items: center;
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

// NOTE: 均摊时 AA 文字：flex:1 撑满剩余空间，与金额行 ios-fee-row(flex:1) 对齐同一右侧位置
.ios-fee-aa {
  flex: 1;
  font-size: 16px;
  color: $ios-text-primary;
  text-align: right;
}

.ios-fee-unit {
  font-size: 16px;
  color: $ios-text-secondary;
  flex-shrink: 0;
}

// NOTE: AA 模式只读展示文字，与 ios-contact-input 右对齐风格一致
.ios-fee-aa-text {
  flex: 1;
  font-size: 16px;
  color: $ios-text-primary;
  text-align: right;
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
  // NOTE: 上下留白增大，与免责声明区保持舒适间距
  padding: $ios-spacing-md $ios-spacing-lg calc($ios-spacing-lg + env(safe-area-inset-bottom));
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
  // NOTE: 与信息卡片拉开距离，给表单底部留出舒适的呼吸空间
  margin-top: 24px;
  padding: $ios-spacing-sm $ios-spacing-lg;
  flex-shrink: 0;
}

.disclaimer-checkbox {
  // NOTE: 与登录页 login-terms-checkbox 样式完全一致
  width: 18px;
  height: 18px;
  margin-right: 8px;
  flex-shrink: 0;
}

.disclaimer-checkbox-inner {
  width: 18px;
  height: 18px;
  min-width: 18px;
  border-radius: 50%;
  border: 1.5px solid #a0a0c0;
  background: transparent;
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
  font-size: 10px;
  color: #ffffff;
  font-weight: 700;
  line-height: 1;
}

.disclaimer-label {
  font-size: 12px;
  color: $ios-text-secondary;
}

.disclaimer-link {
  font-size: 12px;
  color: $ios-blue;
  font-weight: $ios-font-weight-medium;
}

// NOTE: 弹层已改为独立页面（pages/disclaimer/index）
// 以下弹层相关样式已全部移除
</style>
