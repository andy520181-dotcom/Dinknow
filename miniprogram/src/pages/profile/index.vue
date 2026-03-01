<template>
  <view class="profile-page">
    <scroll-view class="profile-scroll" scroll-y>
      <view class="profile-body">

        <!-- 头像卡片：居中头像 + 编辑徽章 + 用户名 -->
        <view class="ios-section profile-avatar-card">
          <!-- NOTE: 直接用微信官方 open-type=chooseAvatar，弹出包含微信头像/相册/拍照/取消的原生选择器 -->
          <button
            class="profile-avatar-circle"
            open-type="chooseAvatar"
            @chooseavatar="onChooseAvatar"
          >
            <image
              v-if="avatarUrl"
              class="profile-avatar"
              :src="avatarUrl"
              mode="aspectFill"
            />
            <view v-else class="profile-avatar profile-avatar--placeholder">
              <text class="profile-avatar-icon">👤</text>
            </view>
            <!-- 半圆编辑徽章 -->
            <view class="profile-edit-badge">
              <text class="profile-edit-badge-text">编辑</text>
            </view>
          </button>
          <text class="profile-username">{{ nickName || '微信用户' }}</text>
        </view>

        <!-- 信息卡片 -->
        <view class="ios-section">
          <view class="ios-cell" @tap="openNicknameEdit">
            <image class="ios-cell__row-icon" src="/static/icons/nicheng.png" mode="aspectFit" />
            <text class="ios-cell__label">昵称</text>
            <text class="ios-cell__value">{{ nickName || '微信用户' }}</text>
            <text class="ios-cell__chevron">›</text>
          </view>
          <view class="ios-cell" @tap="openGenderEdit">
            <image class="ios-cell__row-icon" src="/static/icons/xingbie.png" mode="aspectFit" />
            <text class="ios-cell__label">性别</text>
            <text class="ios-cell__value">{{ genderText }}</text>
            <text class="ios-cell__chevron">›</text>
          </view>
          <view class="ios-cell" @tap="openRegionEdit">
            <image class="ios-cell__row-icon" src="/static/icons/diqu.png" mode="aspectFit" />
            <text class="ios-cell__label">地区</text>
            <text class="ios-cell__value">{{ region || '请选择' }}</text>
            <text class="ios-cell__chevron">›</text>
          </view>
          <!-- DUPR 水平：使用原生 picker，与发起活动页保持一致 -->
          <view class="ios-cell ios-cell--tap">
            <image class="ios-cell__row-icon" src="/static/icons/dupr.png" mode="aspectFit" />
            <text class="ios-cell__label">DUPR 水平</text>
            <view class="ios-cell__value ios-cell__value--right">
              <picker
                mode="selector"
                :range="duprOptions"
                :value="duprIndex"
                @change="onDuprChange"
              >
                <text :class="duprLevel ? 'ios-picker-text' : 'ios-cell__placeholder'">
                  {{ duprLevel || '请选择' }}
                </text>
              </picker>
            </view>
            <text class="ios-cell__chevron">›</text>
          </view>
          <view class="ios-cell" @tap="openSignatureEdit">
            <image class="ios-cell__row-icon" src="/static/icons/qiufeng.png" mode="aspectFit" />
            <text class="ios-cell__label">球风</text>
            <text class="ios-cell__value ios-cell__value--ellipsis">{{ signature || '请填写' }}</text>
            <text class="ios-cell__chevron">›</text>
          </view>
        </view>

        <!-- 场次统计卡片：分行显示 -->
        <view class="ios-section ios-activities-card">
          <view class="ios-activity-tile" @tap="goToMyActivities('joined')">
            <view class="ios-activity-tile-left">
              <image class="ios-cell__row-icon" src="/static/icons/wocanjiade.png" mode="aspectFit" />
              <text class="ios-activity-tile-title">我参加的</text>
            </view>
            <view class="ios-activity-count-row">
              <text class="ios-activity-count">{{ myJoined.length }}</text>
              <text class="ios-activity-unit"> 场</text>
            </view>
          </view>
          <view class="ios-activity-tile" @tap="goToMyActivities('created')">
            <view class="ios-activity-tile-left">
              <image class="ios-cell__row-icon" src="/static/icons/wofaqide.png" mode="aspectFit" />
              <text class="ios-activity-tile-title">我发起的</text>
            </view>
            <view class="ios-activity-count-row">
              <text class="ios-activity-count">{{ myCreated.length }}</text>
              <text class="ios-activity-unit"> 场</text>
            </view>
          </view>
        </view>

      </view>
    </scroll-view>

    <!-- 选项 Action Sheet：单块白色面板从屏幕底部弹出 -->
    <view v-if="showPickerModal" class="action-sheet-mask" @tap="closePickerModal">
      <view class="action-sheet" @tap.stop>
        <template v-for="(item, index) in currentPickerOptions" :key="item">
          <view class="action-sheet-item" @tap="selectPickerOption(item)">
            <text class="action-sheet-item-text">{{ item }}</text>
          </view>
          <!-- NOTE: 最后一个选项后不加 sep，取消按钮用 margin-top 成为独立模块 -->
          <view v-if="index < currentPickerOptions.length - 1" class="action-sheet-sep" />
        </template>
        <view class="action-sheet-item action-sheet-item--cancel" @tap="closePickerModal">
          <text class="action-sheet-item-text action-sheet-item-text--cancel">取消</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { login, getProfile, updateProfile } from '../../services/user'
import { getUserActivities } from '../../services/activity'
import type { User, Activity } from '../../types'

const genderOptions = ['保密', '男', '女']
const duprOptions = ['初级 1.0-2.5', '中级 3.0-3.5', '高级 4.0-4.5', '专业级 5.0+']

// NOTE: duprIndex 计算当前选中项索引，与发起活动页保持一致
const duprIndex = computed(() => {
  if (!duprLevel.value) return 0
  const idx = duprOptions.indexOf(duprLevel.value)
  return idx >= 0 ? idx : 0
})

const user = ref<User | null>(null)
const nickName = ref('')
const avatarUrl = ref('')
const gender = ref<0 | 1 | 2>(0)
const duprLevel = ref('')
const region = ref('')
const signature = ref('')

const myCreated = ref<Activity[]>([])
const myJoined = ref<Activity[]>([])

const saving = ref(false)

// NOTE: 微信官方 open-type=chooseAvatar 回调
async function onChooseAvatar(e: any) {
  const tempPath = e?.detail?.avatarUrl
  if (!tempPath) return
  try {
    // #ifdef MP-WEIXIN
    const cloudPath = `avatars/${Date.now()}-wechat.jpg`
    const uploadRes = await (wx as any).cloud.uploadFile({ cloudPath, filePath: tempPath })
    avatarUrl.value = uploadRes.fileID
    await saveProfile()
    // #endif
  } catch (err) {
    console.error('头像上传失败:', err)
    uni.showToast({ title: '上传失败', icon: 'none' })
  }
}

// 文本编辑弹窗（昵称 / 球风）
const showTextModal = ref(false)
const textModalTitle = ref('')
const textModalType = ref<'nickname' | 'signature'>('nickname')
const textModalValue = ref('')

// 选项弹窗（性别 / 地区 / DUPR）
const showPickerModal = ref(false)
const pickerModalTitle = ref('')
const pickerType = ref<'gender' | 'region' | 'dupr'>('gender')
const currentPickerOptions = ref<string[]>([])

const genderText = computed(() => genderOptions[gender.value] || '保密')

async function loadProfileAndActivities() {
  try {
    const loginRes = await login()
    const openid = loginRes?.openid
    if (openid) {
      const profile = await getProfile(openid)
      if (profile) {
        user.value = profile
        nickName.value = profile.nickName || ''
        avatarUrl.value = profile.avatarUrl || ''
        gender.value = profile.gender ?? 0
        duprLevel.value = profile.duprLevel || ''
        region.value = (profile as any).region || ''
        signature.value = (profile as any).signature || ''
      }
    }
    const activities = await getUserActivities()
    myCreated.value = Array.isArray(activities.created) ? activities.created : []
    myJoined.value = Array.isArray(activities.joined) ? activities.joined : []
  } catch (e) {
    console.error('加载个人信息失败', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

function handleChooseAvatar() {
  uni.chooseImage({
    count: 1,
    // NOTE: 必须用 original 原图，compressed 会导致头像模糊（原图可达 1000px+，compressed 仅 132px）
    sizeType: ['original'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const path = res.tempFilePaths?.[0]
      if (!path) return
      try {
        // #ifdef MP-WEIXIN
        const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
        const uploadRes = await wx.cloud.uploadFile({
          cloudPath,
          filePath: path
        })
        avatarUrl.value = uploadRes.fileID
        await saveProfile()
        // #endif
      } catch (error) {
        console.error('上传头像失败:', error)
        uni.showToast({ title: '上传失败', icon: 'none' })
      }
    }
  })
}

// NOTE: 头像选择通过 button open-type=chooseAvatar 直接处理，此函数保留但不再使用
function openEditPanel() {}

function openNicknameEdit() {
  // NOTE: 跳转到独立编辑页，传递当前昵称作为预充内容
  uni.navigateTo({
    url: `/pages/edit-text-field/index?type=nickname&value=${encodeURIComponent(nickName.value)}`
  })
}

function openSignatureEdit() {
  // NOTE: 跳转到独立编辑页，传递当前球风作为预充内容
  uni.navigateTo({
    url: `/pages/edit-text-field/index?type=signature&value=${encodeURIComponent(signature.value)}`
  })
}

function openGenderEdit() {
  pickerModalTitle.value = '选择性别'
  pickerType.value = 'gender'
  currentPickerOptions.value = genderOptions
  showPickerModal.value = true
  // NOTE: 隐藏原生 tab bar，使 action sheet 能完整覆盖底部
  // #ifdef MP-WEIXIN
  ;(wx as any).hideTabBar()
  // #endif
}

function openRegionEdit() {
  // NOTE: 复用广场页城市选择器，fromProfile=true 时选结果写入 profile_region storage
  uni.navigateTo({
    url: `/pages/city-select/index?from=profile&currentCity=${encodeURIComponent(region.value || '')}`
  })
}

function openDuprEdit() {
  // NOTE: DUPR 已改为内嵌 picker，此函数保留备用
}

function onDuprChange(e: any) {
  // NOTE: 接收内嵌 picker 的选择结果，直接保存
  const idx = Number(e?.detail?.value ?? 0)
  duprLevel.value = duprOptions[idx] ?? ''
  saveProfile()
}

async function selectPickerOption(value: string) {
  if (pickerType.value === 'gender') {
    const idx = genderOptions.indexOf(value)
    gender.value = (idx >= 0 ? idx : 0) as 0 | 1 | 2
  } else if (pickerType.value === 'region') {
    region.value = value
  } else if (pickerType.value === 'dupr') {
    duprLevel.value = value
  }
  showPickerModal.value = false
  // #ifdef MP-WEIXIN
  ;(wx as any).showTabBar()
  // #endif
  await saveProfile()
}

function closePickerModal() {
  showPickerModal.value = false
  // NOTE: 恢复原生 tab bar 显示
  // #ifdef MP-WEIXIN
  ;(wx as any).showTabBar()
  // #endif
}

async function saveProfile() {
  saving.value = true
  try {
    const result = await updateProfile({
      nickName: nickName.value.trim() || '微信用户',
      avatarUrl: avatarUrl.value || user.value?.avatarUrl,
      gender: gender.value,
      duprLevel: duprLevel.value || '',
      region: region.value || '',
      signature: signature.value || ''
    } as any)

    if (result?.success === false) {
      uni.showToast({ title: result.message || '保存失败', icon: 'none' })
      return
    }

    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (error: any) {
    uni.showToast({ title: error?.errMsg || error?.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

function goToMyActivities(type: 'joined' | 'created') {
  uni.navigateTo({
    url: `/pages/my-activities/index?type=${type}`
  })
}

onMounted(() => {
  loadProfileAndActivities()
  uni.$on('profileFieldSaved', async (data: { type: string; value: string }) => {
    if (data.type === 'nickname') {
      nickName.value = data.value
    } else if (data.type === 'signature') {
      signature.value = data.value
    }
    await saveProfile()
  })
})

// NOTE: onShow 返回个人页时，检查 profile_region storage 是否有新选择的城市
onShow(() => {
  const saved = uni.getStorageSync('profile_region')
  if (saved) {
    region.value = saved
    uni.removeStorageSync('profile_region')
    saveProfile()
  }
})
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background: $ios-bg-secondary;
  display: flex;
  flex-direction: column;
}

.profile-scroll {
  flex: 1;
}

.profile-body {
  padding: 0 0 $ios-spacing-lg;
}

// ---- 卡片基础 ----
.ios-section {
  background: $ios-bg-primary;
  border-radius: 0;
  margin-bottom: $ios-spacing-lg;
  overflow: hidden;
}

// ---- 头像卡片 ----
.profile-avatar-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $ios-spacing-xl 0 $ios-spacing-lg;
}

.profile-avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: $ios-spacing-sm;
  // NOTE: tap 区域包含圈外和昵称，实际点击选头像由内层 profile-avatar-circle 处理
}

// NOTE: 圆圈容器，overflow:hidden 将底部半圆编辑遞罩裁切出圆彧
.profile-avatar-circle {
  position: relative;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  // NOTE: 重置微信 button 默认样式，防止 padding/margin 破坏圆形裁切
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  box-sizing: border-box;
  display: block;
}

// 去掉微信 button 点击态的边框
.profile-avatar-circle::after {
  border: none;
}

.profile-avatar {
  width: 130px;
  height: 130px;
}

.profile-avatar--placeholder {
  width: 130px;
  height: 130px;
  background: $ios-bg-tertiary;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-avatar-icon {
  font-size: 40px;
}

// NOTE: 绝对定位在圆圈底部，父元素 overflow:hidden 自动裁切为半圆
.profile-edit-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 28px;
  background: rgba(100, 100, 108, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-edit-badge-text {
  font-size: 13px;
  color: #ffffff;
}

.profile-username {
  font-size: 17px;
  color: $ios-text-primary;
  margin-top: $ios-spacing-sm;
}

// ---- 信息列表 ----
.ios-cell {
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
  color: $ios-text-primary;
  flex-shrink: 0;
  width: 88px;
}

.ios-cell__value {
  flex: 1;
  font-size: 16px;
  color: $ios-text-secondary;
  text-align: right;
  min-width: 0;
}

.ios-cell__value--ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ios-cell__chevron {
  font-size: 18px;
  color: $ios-text-tertiary;
  margin-left: $ios-spacing-xs;
}

// NOTE: DUPR 内嵌 picker 文字样式，与发起活动页保持一致
.ios-picker-text {
  font-size: 16px;
  color: $ios-text-primary;
}

.ios-cell__placeholder {
  font-size: 16px;
  color: $ios-text-tertiary;
}

.ios-cell__value--right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

// ---- 场次统计卡片 ----
.ios-activities-card {
  display: flex;
  flex-direction: column;
}

.ios-activity-tile {
  min-height: 60px;
  padding: 0 $ios-spacing-lg;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
  box-sizing: border-box;
}

.ios-activity-tile:last-child {
  border-bottom-width: 0;
}

.ios-activity-tile-title {
  font-size: 16px;
  color: $ios-text-primary;
}

// NOTE: 图标 + 标题横排容器（我参加的 / 我发起的行）
.ios-activity-tile-left {
  display: flex;
  align-items: center;
}

// NOTE: 与发起活动页图标完全一致（20x20，右边距6px）
.ios-cell__row-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-right: 6px;
}

.ios-activity-count-row {
  display: flex;
  align-items: baseline;
}

.ios-activity-count {
  font-size: 16px;
  font-weight: $ios-font-weight-medium;
  color: $ios-text-secondary;
}

.ios-activity-unit {
  font-size: 16px;
  color: $ios-text-secondary;
}

// ---- 编辑弹窗 ----
.edit-modal-mask {
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 999;
}

.edit-modal,
.edit-picker-modal {
  width: 100%;
  background: #ffffff;
  border-top-left-radius: $ios-radius-lg;
  border-top-right-radius: $ios-radius-lg;
  padding-bottom: env(safe-area-inset-bottom);
}

.edit-modal-header {
  padding: $ios-spacing-md $ios-spacing-lg;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.edit-modal-title {
  font-size: 16px;
  font-weight: $ios-font-weight-medium;
}

.edit-modal-close {
  padding: 4px 8px;
}

.edit-modal-body {
  padding: 0 $ios-spacing-lg $ios-spacing-md;
}

.edit-modal-input,
.edit-modal-textarea {
  width: 100%;
  font-size: 15px;
  color: $ios-text-primary;
  padding: $ios-spacing-sm;
  border-radius: $ios-radius-md;
  background: $ios-bg-tertiary;
  box-sizing: border-box;
}

.edit-modal-textarea {
  min-height: 80px;
}

.edit-modal-btn {
  margin: 0 $ios-spacing-lg $ios-spacing-md;
  height: 44px;
  border-radius: 999px;
  background: $ios-blue;
  color: #ffffff;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-picker-list {
  max-height: 260px;
  padding: 0 $ios-spacing-lg $ios-spacing-md;
  overflow-y: scroll;
}

.edit-picker-item {
  padding: $ios-spacing-md 0;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
  font-size: 15px;
  color: $ios-text-primary;
}

.edit-picker-item:last-child {
  border-bottom-width: 0;
}


// ---- Action Sheet: 单块白色面板展示 ----------
.action-sheet-mask {
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

// NOTE: 白色单块面板，顶部圆角，底部贴边（遮住 tab bar）
.action-sheet {
  background: #ffffff;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
  animation: sheetSlideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
@keyframes sheetSlideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

.action-sheet-item {
  height: 57px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:active { background: rgba(0, 0, 0, 0.04); }
}

// NOTE: 取消按钮独立模块，上方用 8px 间距与选项区隔开
.action-sheet-item--cancel {
  margin-top: 8px;
  background: #f2f2f7;
  border-top: none;
}

.action-sheet-item-text {
  font-size: 17px;
  color: $ios-text-primary;
}

// NOTE: 取消选项上方加精细分隔线与普通选项区分
.action-sheet-item-text--cancel {
  color: $ios-text-secondary;
}

.action-sheet-sep {
  height: 0.5px;
  background: rgba(0, 0, 0, 0.04);
}
</style>
