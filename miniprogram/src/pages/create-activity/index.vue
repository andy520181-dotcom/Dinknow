<template>
  <view class="create-page">
    <!-- NOTE: scroll-view 包裹全部内容，小屏幕自动滚动，大屏幕不滚动 -->
    <scroll-view class="create-scroll" scroll-y>
      <!-- 表单主体 -->
      <view class="ios-form">
          <!-- 左上角返回按键 -->
          <view class="create-back-row" @tap="handleBack">
            <text class="create-back-icon">‹</text>
          </view>

          <!-- NOTE: 独立模板卡：仅新建模式显示，与表单卡明确分开，代表「复用历史活动」的入口 -->
          <view v-if="!editingActivityId" class="template-card" @tap="openTemplateSheet">
            <text class="template-card__text">使用历史活动快速填写</text>
            <text class="template-card__arrow">›</text>
          </view>

          <!-- 主信息卡片：标题 + 时间 + 地点 + DUPR水平 + 人数 + 费用 + 联系方式 -->
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

            <!-- 费用：点击跳转独立编辑页 -->
            <view class="ios-cell ios-cell--tap" @tap="goToFeeEdit">
              <image class="ios-cell__row-icon" src="/static/icons/feiyongdanju.png" mode="aspectFit" />
              <text class="ios-cell__label">费用</text>
              <view class="ios-cell__value ios-cell__value--right">
                <text v-if="feeType === 'aa'" class="ios-cell__value-text">AA</text>
                <text v-else-if="feeType === 'custom' && fee" class="ios-cell__value-text">{{ fee }}元/人</text>
                <text v-else class="ios-cell__placeholder">请设置</text>
              </view>
              <text class="ios-cell__chevron">›</text>
            </view>

            <!-- 联系方式：点击跳转独立编辑页 -->
            <view class="ios-cell ios-cell--tap" @tap="goToContactEdit">
              <image class="ios-cell__row-icon" src="/static/icons/lianxifangshi.png" mode="aspectFit" />
              <text class="ios-cell__label">联系方式</text>
              <view class="ios-cell__value ios-cell__value--right ios-cell__value--ellipsis">
                <!-- NOTE: 手机直接显示号码，不加「手机」前缀 -->
                <text v-if="contactType === 'phone' && phoneContact" class="ios-cell__value-text">
                  {{ phoneContact }}
                </text>
                <!-- NOTE: 微信模式 wechatContact 存储的是二维码图片路径 -->
                <text v-else-if="contactType === 'wechat' && wechatContact" class="ios-cell__value-text">
                  微信二维码已上传
                </text>
                <text v-else class="ios-cell__placeholder">请设置</text>
              </view>
              <text class="ios-cell__chevron">›</text>
            </view>
          </view>

          <!-- 备注卡片：点击跳转到独立编辑页 -->
          <view class="ios-section">
            <view class="ios-cell ios-cell--tap" @tap="goToRemarkEdit">
              <image class="ios-cell__row-icon" src="/static/icons/beizhu.png" mode="aspectFit" />
              <text class="ios-cell__label">备注</text>
              <view class="ios-cell__value ios-cell__value--right ios-cell__value--ellipsis">
                <text v-if="description">{{ description }}</text>
                <text v-else class="ios-cell__placeholder">选填</text>
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

    <!-- NOTE: 模板历史活动底部半屏抽屉，点击遮罩关闭 -->
    <view v-if="showTemplateSheet" class="template-mask" @tap="closeTemplateSheet">
      <view class="template-sheet" @tap.stop>
        <!-- 把手条 -->
        <view class="template-sheet__handle" />

        <!-- 标题行 -->
        <view class="template-sheet__header">
          <text class="template-sheet__title">历史活动</text>
          <view class="template-sheet__close" @tap="closeTemplateSheet">
            <text class="template-sheet__close-icon">✕</text>
          </view>
        </view>

        <!-- 内容区 -->
        <view class="template-sheet__body">
          <!-- 加载中 -->
          <view v-if="templateLoading" class="template-empty">
            <text class="template-empty__text">加载中...</text>
          </view>

          <!-- 空态 -->
          <view v-else-if="templateActivities.length === 0" class="template-empty">
            <text class="template-empty__icon">📋</text>
            <text class="template-empty__text">暂无历史活动</text>
            <text class="template-empty__sub">发布第一个活动后，可在此快速复用</text>
          </view>

          <!-- 历史活动列表（最近 5 条） -->
          <view v-else>
            <view
              v-for="act in templateActivities"
              :key="act._id"
              class="template-item"
              @tap="selectTemplate(act)"
            >
              <view class="template-item__main">
                <text class="template-item__title">{{ act.title }}</text>
                <text class="template-item__meta">
                  {{ (act as any).duprLevel || '' }}{{ (act as any).duprLevel && (act.address || (act as any).venueName) ? ' · ' : '' }}{{ (act as any).venueName || act.address || '' }}
                </text>
              </view>
              <text class="template-item__arrow">›</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>

</template>


<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { createActivity, updateActivity } from '../../services/activity'
import { getUserActivities } from '../../services/activity'
import { getProfile } from '../../services/user'
import { callCloudFunction } from '../../services/cloud'
import { chooseLocation } from '../../utils/location'
import type { LocationInfo, User, Activity } from '../../types'
import { STORAGE_USER_LOCATION } from '../../constants'

// NOTE: wx 为微信小程序全局对象，uni-app 环境下由平台注入
declare const wx: any


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
// NOTE: 费用类型：aa | custom，初始不选中（空字符串），进入独立编辑页选择 
const feeType = ref<'aa' | 'custom' | ''>('')
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
// NOTE: 联系方式类型：phone | wechat，初始不选中（空字符串），进入独立编辑页选择
const contactType = ref<'phone' | 'wechat' | ''>('')
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

// NOTE: 模板底部抽屉相关状态
const showTemplateSheet = ref(false)
const templateActivities = ref<Activity[]>([])
const templateLoading = ref(false)
const submitting = ref(false)
// true  → onShow 读 Storage 同步新数据
// false → onShow 是小程序从后台恢复，新建模式下需清空残留数据
const returningFromSubPage = ref(false)
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

// NOTE: 读取各独立编辑页（备注、费用、联系方式）保存到 Storage 的内容，回填到主表单
function syncRemarkFromStorage() {
  // ── 备注 ──
  const cached = uni.getStorageSync('editing_activity_remark')
  if (typeof cached === 'string') description.value = cached

  const cachedImages = uni.getStorageSync('editing_activity_remark_images')
  if (Array.isArray(cachedImages)) remarkImages.value = cachedImages

  // ── 费用（来自 edit-fee 页）──
  const cachedFeeType = uni.getStorageSync('editing_activity_fee_type')
  if (cachedFeeType === 'aa') {
    feeType.value = 'aa'
    fee.value = ''
  } else if (cachedFeeType === 'custom') {
    feeType.value = 'custom'
    const cachedFeeAmount = uni.getStorageSync('editing_activity_fee_amount')
    if (typeof cachedFeeAmount === 'string') fee.value = cachedFeeAmount
  }

  // ── 联系方式（来自 edit-contact 页）──
  const cachedContactType = uni.getStorageSync('editing_activity_contact_type')
  if (cachedContactType === 'phone' || cachedContactType === 'wechat') {
    contactType.value = cachedContactType
    if (cachedContactType === 'phone') {
      const v = uni.getStorageSync('editing_activity_contact_value')
      if (typeof v === 'string') phoneContact.value = v
    } else {
      // NOTE: 微信二维码模式：从独立 key 取图片路径，wechatContact 存路径用于摘要和提交
      const qr = uni.getStorageSync('editing_activity_contact_wechat_qr')
      if (typeof qr === 'string') wechatContact.value = qr
    }
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

/**
 * 使用上次活动作为模板回填表单（排除日期和时间，这两项需用户重新选）
 * NOTE: 不回填 startDate / startTime / endTime，避免用户误用过期时间
 */
function applyTemplateActivity(act: Activity) {
  const a = act as any

  // 标题（去掉旧格式前缀）
  let tpl = a.title || ''
  for (const p of ['单打-', '双打-', '混双-', '不限-']) {
    if (tpl.startsWith(p)) { tpl = tpl.substring(p.length); break }
  }
  title.value = tpl

  // 地点
  if (!locationManuallySet.value) {
    address.value = a.address || ''
    venueName.value = a.venueName || ''
    latitude.value = a.latitude
    longitude.value = a.longitude
  }

  // 人数
  maxParticipantsInput.value = a.maxParticipants ? String(a.maxParticipants) : '8'

  // 费用
  if (a.fee === -1) {
    feeType.value = 'aa'
    feeTypeTouched.value = true
    fee.value = ''
  } else if (a.fee != null) {
    feeType.value = 'custom'
    feeTypeTouched.value = true
    fee.value = String(a.fee)
  }

  // 联系方式
  const savedContact = a.contactInfo || ''
  if (savedContact) {
    if (/^\d+$/.test(savedContact)) {
      contactType.value = 'phone'
      contactTypeTouched.value = true
      phoneContact.value = savedContact
    } else {
      contactType.value = 'wechat'
      contactTypeTouched.value = true
      wechatContact.value = savedContact
    }
  }

  // DUPR
  const legacyDuprMap: Record<string, string> = {
    '1.0-2.5': '初级 1.0-2.5', '3.0-3.5': '中级 3.0-3.5',
    '4.0-4.5': '高级 4.0-4.5', '5.0+': '专业级 5.0+',
  }
  const raw = a.duprLevel || ''
  selectedDupr.value = legacyDuprMap[raw] ?? (duprLevels.includes(raw) ? raw : '')

  // 备注（文字部分，不回填图片避免旧图占用存储）
  description.value = a.description || ''

  uni.showToast({ title: '已回填上次活动', icon: 'success', duration: 1500 })
}

/** 点击「模板」小标签 → 加载并展开底部抽屉 */
async function openTemplateSheet() {
  // NOTE: 微信小程序原生 tabBar 无法被普通 view 覆盖，必须主动隐藏再恢复
  uni.hideTabBar({ animation: false })
  showTemplateSheet.value = true
  if (templateActivities.value.length > 0) return
  templateLoading.value = true
  try {
    const res = await getUserActivities()
    const created = res?.created
    // NOTE: getUserActivities 已按 createdAt desc 排序，取前 5 条为模板候选
    templateActivities.value = Array.isArray(created) ? created.slice(0, 5) : []
  } catch {
    templateActivities.value = []
  } finally {
    templateLoading.value = false
  }
}

/** 关闭抽屉并恢复 tabBar */
function closeTemplateSheet() {
  showTemplateSheet.value = false
  uni.showTabBar({ animation: false })
}

/** 点击某条历史活动 → 二次确认后回填 */
function selectTemplate(act: Activity) {
  closeTemplateSheet()
  uni.showModal({
    title: '使用此模板',
    content: `将回填「${act.title}」的信息，日期和时间需重新选择`,
    confirmText: '回填',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) applyTemplateActivity(act)
    }
  })
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
  returningFromSubPage.value = true
  uni.navigateTo({ url: '/pages/edit-remark/index' })
}

// NOTE: 新建模式不写 Storage（防止旧缓存污染编辑页）；编辑模式才写入当前已选值以回显
// NOTE: 已有值时写入 Storage（编辑页回显）；首次进入（无值）时清除防止旧 Session 污染
function goToFeeEdit() {
  if (feeType.value) {
    // NOTE: 已设置过费用，写入让编辑页回显已选值，方便用户修改
    uni.setStorageSync('editing_activity_fee_type', feeType.value)
    uni.setStorageSync('editing_activity_fee_amount', fee.value || '')
  } else {
    // NOTE: 首次进入（未设置），清除防止上次会话残留预选
    uni.removeStorageSync('editing_activity_fee_type')
    uni.removeStorageSync('editing_activity_fee_amount')
  }
  returningFromSubPage.value = true
  uni.navigateTo({ url: '/pages/edit-fee/index' })
}

// NOTE: 已有值时写入 Storage（编辑页回显）；首次进入（无值）时清除防止旧 Session 污染
function goToContactEdit() {
  if (contactType.value) {
    uni.setStorageSync('editing_activity_contact_type', contactType.value)
    if (contactType.value === 'phone') {
      uni.setStorageSync('editing_activity_contact_value', phoneContact.value || '')
      uni.removeStorageSync('editing_activity_contact_wechat_qr')
    } else {
      uni.setStorageSync('editing_activity_contact_value', '')
      uni.setStorageSync('editing_activity_contact_wechat_qr', wechatContact.value || '')
    }
  } else {
    // NOTE: 首次进入（未设置），清除防止上次会话残留预选
    uni.removeStorageSync('editing_activity_contact_type')
    uni.removeStorageSync('editing_activity_contact_value')
    uni.removeStorageSync('editing_activity_contact_wechat_qr')
  }
  returningFromSubPage.value = true
  uni.navigateTo({ url: '/pages/edit-contact/index' })
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
  // NOTE: 新建模式：有内容时提示保存草稿
  if (isFormDirty.value) {
    uni.showActionSheet({
      itemList: ['保存草稿', '不保存'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 保存草稿
          saveDraft()
          uni.showToast({ title: '草稿已保存', icon: 'success', duration: 1500 })
          setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 800)
        } else {
          // 不保存，清空并返回
          resetForm()
          uni.switchTab({ url: '/pages/index/index' })
        }
      },
      fail: () => {
        // NOTE: 用户点击取消 = 继续编辑，不做任何操作
      }
    })
    return
  }
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
  // NOTE: feeType 有值即视为已设置（通过独立编辑页设置）
  if (!feeType.value) {
    uni.showToast({ title: '请设置费用', icon: 'none' }); return
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

  // NOTE: 备注图片：优先走 COS 预签名直传（永久 HTTPS URL），降级到云开发存储（cloud://）
  let uploadedImages: string[] = []
  // #ifdef MP-WEIXIN
  if (remarkImages.value.length > 0) {
    uni.showLoading({ title: '处理图片...' })
    try {
      const tasks = remarkImages.value.map(async (path, i) => {
        // NOTE: 已是 https:// 或 cloud:// 说明已上传过，直接复用，不重传
        if (path.startsWith('https://') || path.startsWith('cloud://')) return path

        const cosKey = `activity-remarks/${Date.now()}-${i}.jpg`

        try {
          // NOTE: 调用云函数获取 COS 预签名 PUT URL 及对应 CDN 永久访问 URL
          const cosRes: any = await callCloudFunction('uploadToCOS', { fileName: cosKey, fileType: 'image/jpeg' })

          if (cosRes?.success && cosRes.uploadUrl) {
            await new Promise<void>((resolve, reject) => {
              uni.request({
                url: cosRes.uploadUrl,
                method: 'PUT',
                data: uni.getFileSystemManager().readFileSync(path),
                header: { 'Content-Type': 'image/jpeg' },
                success: (res) => {
                  if (res.statusCode >= 200 && res.statusCode < 300) resolve()
                  else reject(new Error(`COS 上传失败: ${res.statusCode}`))
                },
                fail: reject
              })
            })
            return cosRes.cdnUrl as string
          }
        } catch (cosErr) {
          console.warn('[备注图片] COS 上传失败，降级到云存储:', cosErr)
        }

        // HACK: COS 不可用时降级到微信云开发存储
        const cloudPath = `activity-remarks/${Date.now()}-${i}.jpg`
        const r: any = await (wx as any).cloud.uploadFile({ cloudPath, filePath: path })
        return r.fileID as string
      })
      uploadedImages = await Promise.all(tasks)
    } catch (e) {
      console.error('图片上传失败:', e)
    } finally {
      uni.hideLoading()
    }
  }
  // #endif

  // NOTE: 微信二维码模式：wechatContact 在 edit-contact 选图时已上传并存为永久 cloud:// URL，直接使用
  // 已是 cloud:// 或 https:// 格式，无需在提交时重新上传
  const finalContactInfo = contactType.value === 'wechat'
    ? wechatContact.value  // 永久 URL（cloud:// 或 CDN https://）
    : phoneContact.value.trim()

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
    contactInfo: finalContactInfo || undefined,
    contactType: contactType.value,
    duprLevel: selectedDupr.value || undefined,
    description: description.value.trim() || undefined,
    images: uploadedImages.length > 0 ? uploadedImages : undefined
  }

  // NOTE: 发布活动时申请「报名成功通知」订阅权限，以便后续有人报名时能收到通知
  // 仅新建时申请，编辑时发起人已订阅过
  if (!editingActivityId.value) {
    await new Promise<void>(resolve => {
      uni.requestSubscribeMessage({
        tmplIds: ['53-eN2jMxIxsMvxl7FOspewFtigQ6MKb0tedLxY6g18'], // 报名成功通知
        complete: () => resolve()
      })
    })
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
  // NOTE: 重置为空字符串，不预选任何费用类型；旧值 'custom' 会导致编辑页预选
  feeType.value = ''
  feeTypeTouched.value = false
  phoneContact.value = ''
  wechatContact.value = ''
  contactType.value = ''
  contactTypeTouched.value = false
  description.value = ''
  selectedDupr.value = ''
  editingActivityId.value = null
  // NOTE: 清空备注 + 费用 + 联系方式编辑页缓存，防止下次进入时读到旧选中值
  uni.removeStorageSync('editing_activity_remark')
  uni.removeStorageSync('editing_activity_remark_images')
  uni.removeStorageSync('editing_activity_fee_type')
  uni.removeStorageSync('editing_activity_fee_amount')
  uni.removeStorageSync('editing_activity_contact_type')
  uni.removeStorageSync('editing_activity_contact_value')
  uni.removeStorageSync('editing_activity_contact_wechat_qr')
  uni.removeStorageSync('editing_activity_id')
  // NOTE: 发布或明确不保存时，同步清除草稿
  uni.removeStorageSync(DRAFT_KEY)
  remarkImages.value = []
  locationManuallySet.value = false
  disclaimerAccepted.value = false
}

// NOTE: 草稿 Storage key
const DRAFT_KEY = 'editing_activity_draft'

/** 判断表单是否有内容（新建模式下） */
const isFormDirty = computed(() =>
  !editingActivityId.value && (
    title.value.trim().length > 0 ||
    startDate.value.length > 0 ||
    address.value.trim().length > 0 ||
    // NOTE: 使用 Touched 标记而非 value !== ''，避免 Storage 自动回读导致误判（空表单也触发保存提示）
    feeTypeTouched.value ||
    fee.value.trim().length > 0 ||
    contactTypeTouched.value ||
    phoneContact.value.trim().length > 0 ||
    wechatContact.value.length > 0 ||
    description.value.trim().length > 0 ||
    remarkImages.value.length > 0
  )
)

/** 将所有表单字段序列化到 Storage */
function saveDraft() {
  const draft = {
    title: title.value,
    startDate: startDate.value,
    startTime: startTime.value,
    endTime: endTime.value,
    address: address.value,
    venueName: venueName.value,
    latitude: latitude.value,
    longitude: longitude.value,
    maxParticipantsInput: maxParticipantsInput.value,
    feeType: feeType.value,
    fee: fee.value,
    contactType: contactType.value,
    phoneContact: phoneContact.value,
    wechatContact: wechatContact.value,
    description: description.value,
    remarkImages: remarkImages.value,
    selectedDupr: selectedDupr.value,
    // 联系方式子页缓存（确保下次点进编辑页时回显）
    contactWechatQr: uni.getStorageSync('editing_activity_contact_wechat_qr') || ''
  }
  uni.setStorageSync(DRAFT_KEY, JSON.stringify(draft))
}

/** 从 Storage 恢复草稿到表单 */
function restoreDraft(draft: Record<string, any>) {
  title.value = draft.title || ''
  startDate.value = draft.startDate || ''
  startTime.value = draft.startTime || ''
  endTime.value = draft.endTime || ''
  address.value = draft.address || ''
  venueName.value = draft.venueName || ''
  latitude.value = draft.latitude
  longitude.value = draft.longitude
  maxParticipantsInput.value = draft.maxParticipantsInput || '8'
  feeType.value = draft.feeType || ''
  feeTypeTouched.value = feeType.value !== ''
  fee.value = draft.fee || ''
  contactType.value = draft.contactType || ''
  contactTypeTouched.value = contactType.value !== ''
  phoneContact.value = draft.phoneContact || ''
  wechatContact.value = draft.wechatContact || ''
  description.value = draft.description || ''
  remarkImages.value = Array.isArray(draft.remarkImages) ? draft.remarkImages : []
  selectedDupr.value = draft.selectedDupr || ''
  // 恢复联系方式子页缓存
  if (draft.contactWechatQr) {
    uni.setStorageSync('editing_activity_contact_wechat_qr', draft.contactWechatQr)
  }
  if (draft.contactType) {
    uni.setStorageSync('editing_activity_contact_type', draft.contactType)
    if (draft.contactType === 'phone') {
      uni.setStorageSync('editing_activity_contact_value', draft.phoneContact || '')
    }
  }
  if (draft.feeType) {
    uni.setStorageSync('editing_activity_fee_type', draft.feeType)
    if (draft.feeType === 'custom') {
      uni.setStorageSync('editing_activity_fee_amount', draft.fee || '')
    }
  }
}

/**
 * NOTE: 同步检查登录态（读本地缓存标记，无需网络），未登录立即跳转个人页（登录页）。
 * 方案 A：进入发起活动页前先拦截，不让未登录用户填写表单后被静默清空。
 */
function checkLoginOrRedirect(): boolean {
  const logged = uni.getStorageSync('is_logged_in') === true
  if (!logged) {
    uni.showToast({ title: '请先登录后再发起活动', icon: 'none', duration: 2000 })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/profile/index' })
    }, 1200)
    return false
  }
  return true
}

// 初始：加载当前用户信息 + 编辑数据 + 备注
// NOTE: 不再自动填充当前位置到地点栏，避免用户误以为已选好球馆地址；地点栏初始显示「请选择」占位，点击后才跳转地图
onMounted(async () => {
  // NOTE: 首次挂载即拦截，未登录跳转登录页，不渲染表单
  if (!checkLoginOrRedirect()) return

  const profile = await getProfile().catch(() => null)
  if (profile) {
    currentUser.value = profile
  }

  applyEditingActivityFromStorage()


  // NOTE: 非编辑模式（新建活动）时，检测是否有保存的草稿
  if (!editingActivityId.value) {
    const draftStr = uni.getStorageSync(DRAFT_KEY)
    if (draftStr) {
      // 有草稿，弹询问弹窗
      uni.showModal({
        title: '发现未完成草稿',
        content: '上次有未发布的活动草稿，是否继续编辑？',
        confirmText: '继续编辑',
        cancelText: '丢弃草稿',
        success: (res) => {
          if (res.confirm) {
            try {
              restoreDraft(JSON.parse(draftStr))
            } catch (e) {
              uni.removeStorageSync(DRAFT_KEY)
            }
          } else {
            // 丢弃草稿 → 清除并进入空白表单
            uni.removeStorageSync(DRAFT_KEY)
            // 同时清 fee/contact 子页 Storage 避免残留
            uni.removeStorageSync('editing_activity_fee_type')
            uni.removeStorageSync('editing_activity_fee_amount')
            uni.removeStorageSync('editing_activity_contact_type')
            uni.removeStorageSync('editing_activity_contact_value')
            uni.removeStorageSync('editing_activity_contact_wechat_qr')
          }
        }
      })
    } else {
      // 无草稿，清 fee/contact Storage 防止历史残留
      uni.removeStorageSync('editing_activity_fee_type')
      uni.removeStorageSync('editing_activity_fee_amount')
      uni.removeStorageSync('editing_activity_contact_type')
      uni.removeStorageSync('editing_activity_contact_value')
      uni.removeStorageSync('editing_activity_contact_wechat_qr')
      syncRemarkFromStorage()
    }
  } else {
    syncRemarkFromStorage()
  }
})

// NOTE: 每次切回页面：先检测登录，未登录立即跳转
onShow(() => {
  if (!checkLoginOrRedirect()) return

  if (returningFromSubPage.value) {
    // NOTE: 从子页（edit-fee/contact/remark）返回，读 Storage 更新表单状态
    returningFromSubPage.value = false
    applyEditingActivityFromStorage()
    syncRemarkFromStorage()
  } else if (editingActivityId.value) {
    // NOTE: 编辑现有活动从后台恢复，同步数据
    applyEditingActivityFromStorage()
    syncRemarkFromStorage()
  } else {
    // NOTE: 新建模式从后台恢复（非子页返回）——
    // onMounted 已清 Storage，这里同步重置内存中的 fee/contact ref，防止展示上次测试的残留数据
    feeType.value = ''
    fee.value = ''
    contactType.value = ''
    phoneContact.value = ''
    wechatContact.value = ''
    applyEditingActivityFromStorage()
  }

  getProfile().then(profile => {
    if (profile) {
      currentUser.value = profile
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

// NOTE: 弱化模板入口：无卡片背景，浅灰文字，视觉让位给表单主体
.template-card {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0 16px 8px;
  padding: 6px 4px;
  transition: opacity 0.15s ease;

  &:active { opacity: 0.5; }

  &__text {
    font-size: 12px;
    color: $ios-text-tertiary;
    font-weight: $ios-font-weight-regular;
  }

  &__arrow {
    font-size: 12px;
    color: $ios-text-tertiary;
  }
}

// NOTE: 底部半屏抽屉遗罩层，对齐 profile 页 action-sheet-mask 实现
.template-mask {
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  z-index: 9999;
  animation: maskFadeIn 0.25s ease-out;
}
@keyframes maskFadeIn {
  from { background: transparent; }
  to   { background: rgba(0, 0, 0, 0.45); }
}

// NOTE: 抽屉本体
.template-sheet {
  background: $ios-bg-primary;
  border-radius: 20px 20px 0 0;
  padding-bottom: env(safe-area-inset-bottom);
  animation: sheetSlideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1);

  &__handle {
    width: 36px; height: 4px;
    border-radius: 2px;
    background: rgba(0, 0, 0, 0.15);
    margin: 12px auto 4px;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 20px 12px;
    border-bottom: 0.5px solid $ios-separator;
  }

  &__title {
    font-size: 16px;
    font-weight: $ios-font-weight-semibold;
    color: $ios-text-primary;
  }

  &__close {
    width: 28px; height: 28px;
    border-radius: 14px;
    background: $ios-bg-secondary;
    display: flex; align-items: center; justify-content: center;
    &:active { opacity: 0.6; }
  }

  &__close-icon {
    font-size: 12px;
    color: $ios-text-secondary;
    line-height: 1;
  }

  &__body {
    padding: 8px 0 12px;
    max-height: 50vh;
    overflow-y: auto;
  }
}
@keyframes sheetSlideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

// NOTE: 空态提示
.template-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 32px 20px;

  &__icon { font-size: 32px; line-height: 1; }
  &__text { font-size: 16px; color: $ios-text-secondary; font-weight: $ios-font-weight-medium; }
  &__sub  { font-size: 12px; color: $ios-text-tertiary; text-align: center; }
}

// NOTE: 历史活动列表条目
.template-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
  transition: background 0.12s ease;

  &:last-child { border-bottom: none; }
  &:active { background: $ios-bg-secondary; }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  &__title {
    font-size: 16px;
    font-weight: $ios-font-weight-semibold;
    color: $ios-text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    font-size: 12px;
    color: $ios-text-secondary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__arrow {
    font-size: 20px;
    color: $ios-text-tertiary;
    margin-left: 10px;
    flex-shrink: 0;
  }
}

.ios-section {
  background: $ios-bg-primary;
  border-radius: 14px;
  // NOTE: margin-bottom 统一为 12px，与全局卡片间距规范一致
  margin: 0 16px $ios-spacing-md;
  overflow: hidden;
}

// NOTE: 顶部行：返回按钮（左）和模板标签（右）水平对齐
.create-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $ios-spacing-lg 0 0;
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

// ── 两段式 cell：费用/联系方式 ──────────────────────────────
// NOTE: 两段式布局 —— flex 纵向排列，第一行展示图标+标签+胶囊，第二行展示内容
.ios-cell--two-row {
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  padding-top: 12px;
  padding-bottom: 12px;
  min-height: auto;
}

.ios-cell--fee,
.ios-cell--contact {
  // 通过 two-row 控制，此处不再额外设置
}

// 第一行：图标 + 标签 + 切换胶囊，横向排列
.ios-cell-row1 {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  width: 100%;
}

// 第二行：内容区（输入框 / 金额）
.ios-cell-row2 {
  margin-top: 10px;
  padding-left: 26px;
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  box-sizing: border-box;

  // NOTE: 靠右对齐修饰类——内容区 justify-content:flex-end，输入框文字 text-align:right
  &--right {
    justify-content: flex-end;

    .ios-contact-input,
    .ios-fee-input {
      text-align: right;
    }

    .ios-input-placeholder {
      text-align: right;
    }
  }
}

.ios-cell-row2__value {
  font-size: 16px;
  color: $ios-text-primary;
}

// NOTE: 纯文字切换标签（无背景胶囊）—— 靠右排列，用颜色区分选中态
.plain-type-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  flex-shrink: 0;
}

.plain-type-tab {
  font-size: 16px;
  color: $ios-text-tertiary;
  white-space: nowrap;

  &--active {
    color: $ios-blue;
    font-weight: $ios-font-weight-medium;
  }

  &:active { opacity: 0.5; }
}

.plain-type-sep {
  font-size: 10px;
  color: $ios-text-tertiary;
}

// 联系方式/费用输入框
.ios-contact-input {
  flex: 1;
  font-size: 16px;
  color: $ios-text-primary;
  text-align: right;
  min-width: 0;
}

.ios-fee-row {
  display: flex;
  align-items: center;
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
  font-size: 12px;
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

// NOTE: 方案 A 模板入口：发布按钮上方居中文字链接，低调不抢眼
.template-link-row {
  display: flex;
  justify-content: center;
  padding: 0 $ios-spacing-lg $ios-spacing-sm;
}

.template-link {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  transition: opacity 0.15s ease;

  &:active { opacity: 0.5; }

  &__text {
    font-size: 12px;
    color: $ios-text-tertiary;
  }

  &__arrow {
    font-size: 12px;
    color: $ios-text-tertiary;
  }
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
