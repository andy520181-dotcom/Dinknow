<template>
  <view class="profile-page">
    <scroll-view class="profile-scroll" scroll-y>
      <view class="profile-body">

        <!-- 头像卡片：居中头像 + 编辑徽章 + 用户名 -->
        <view class="ios-section profile-avatar-card">
          <!-- NOTE: 直接用微信官方 open-type=chooseAvatar，弹出唹含微信头像/相册/拍照/取消的原生选择器 -->
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
            <text class="ios-cell__label">昵称</text>
            <text class="ios-cell__value">{{ nickName || '微信用户' }}</text>
            <text class="ios-cell__chevron">›</text>
          </view>
          <view class="ios-cell" @tap="openGenderEdit">
            <text class="ios-cell__label">性别</text>
            <text class="ios-cell__value">{{ genderText }}</text>
            <text class="ios-cell__chevron">›</text>
          </view>
          <view class="ios-cell" @tap="openRegionEdit">
            <text class="ios-cell__label">地区</text>
            <text class="ios-cell__value">{{ region || '请选择' }}</text>
            <text class="ios-cell__chevron">›</text>
          </view>
          <view class="ios-cell" @tap="openDuprEdit">
            <text class="ios-cell__label">DUPR 水平</text>
            <text class="ios-cell__value">{{ duprLevel || '请选择' }}</text>
            <text class="ios-cell__chevron">›</text>
          </view>
          <view class="ios-cell" @tap="openSignatureEdit">
            <text class="ios-cell__label">球风</text>
            <text class="ios-cell__value ios-cell__value--ellipsis">{{ signature || '请填写' }}</text>
            <text class="ios-cell__chevron">›</text>
          </view>
        </view>

        <!-- 场次统计卡片：分行显示 -->
        <view class="ios-section ios-activities-card">
          <view class="ios-activity-tile" @tap="goToMyActivities('joined')">
            <text class="ios-activity-tile-title">我参加的</text>
            <view class="ios-activity-count-row">
              <text class="ios-activity-count">{{ myJoined.length }}</text>
              <text class="ios-activity-unit"> 场</text>
            </view>
          </view>
          <view class="ios-activity-tile" @tap="goToMyActivities('created')">
            <text class="ios-activity-tile-title">我发起的</text>
            <view class="ios-activity-count-row">
              <text class="ios-activity-count">{{ myCreated.length }}</text>
              <text class="ios-activity-unit"> 场</text>
            </view>
          </view>
        </view>

      </view>
    </scroll-view>

    <!-- 选项 Action Sheet（性别 / 地区 / DUPR） -->
    <view v-if="showPickerModal" class="action-sheet-mask" @tap="closePickerModal">
      <view class="action-sheet" @tap.stop>
        <!-- 选项组 -->
        <view class="action-sheet-group">
          <template v-for="(item, index) in currentPickerOptions" :key="item">
            <view class="action-sheet-item" @tap="selectPickerOption(item)">
              <text class="action-sheet-item-text">{{ item }}</text>
            </view>
            <view v-if="index < currentPickerOptions.length - 1" class="action-sheet-sep" />
          </template>
        </view>
        <!-- 取消 -->
        <view class="action-sheet-group" @tap="closePickerModal">
          <view class="action-sheet-item">
            <text class="action-sheet-item-text action-sheet-item-text--cancel">取消</text>
          </view>
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
const duprOptions = ['1.0-2.5', '3.0-3.5', '4.0-4.5', '5.0+']

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
    sizeType: ['compressed'],
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
}

function openRegionEdit() {
  // NOTE: 复用广场页城市选择器，fromProfile=true 时选结果写入 profile_region storage
  uni.navigateTo({
    url: `/pages/city-select/index?from=profile¤tCity=${encodeURIComponent(region.value || '')}`
  })
}

function openDuprEdit() {
  pickerModalTitle.value = '选择 DUPR 水平'
  pickerType.value = 'dupr'
  currentPickerOptions.value = duprOptions
  showPickerModal.value = true
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
  await saveProfile()
  showPickerModal.value = false
}

function closePickerModal() {
  showPickerModal.value = false
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
  width: 110px;
  height: 110px;
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
  width: 110px;
  height: 110px;
}

.profile-avatar--placeholder {
  width: 110px;
  height: 110px;
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
  border-bottom: 1px solid $ios-separator;
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
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

.ios-activity-tile:last-child {
  border-bottom-width: 0;
}

.ios-activity-tile-title {
  font-size: 16px;
  color: $ios-text-primary;
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
  border-bottom: 1px solid $ios-separator;
  font-size: 15px;
  color: $ios-text-primary;
}

.edit-picker-item:last-child {
  border-bottom-width: 0;
}


// ---- Action Sheet（iOS 原生风格） ----
.action-sheet-mask {
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  z-index: 1000;
}

.action-sheet {
  padding: 0 8px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
}

// NOTE: 每一组选项独立圆角白卡，组间 8px 间距
.action-sheet-group {
  background: #ffffff;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 8px;
}

.action-sheet-item {
  height: 57px;
  display: flex;
  align-items: center;
  justify-content: center;
}

// NOTE: 重置微信 button 内置样式，使「用微信头像」视觉与普通选项一致
.action-sheet-btn {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  margin: 0;
  width: 100%;
  line-height: 1;
  font-size: 17px;
  color: $ios-text-primary;
}

.action-sheet-btn::after {
  border: none;
}

.action-sheet-item-text {
  font-size: 17px;
  color: $ios-text-primary;
}

.action-sheet-item-text--cancel {
  color: $ios-blue;
  font-weight: $ios-font-weight-medium;
}

// 选项之间的分隔线（两侧内缩 16px）
.action-sheet-sep {
  height: 0.5px;
  background: rgba(0, 0, 0, 0.12);
  margin: 0 16px;
}
</style>
