<template>
  <view class="profile-page">
    <!-- NOTE: 登录状态检查中，显示空白背景，避免已登录用户知觉登录页闪烁 -->
    <view v-if="profileChecking" class="profile-loading" />
    <!-- NOTE: 未登录时显示登录界面 -->
    <view v-else-if="!isLoggedIn" class="login-page">
      <!-- 页面标题 -->
      <text class="login-page-title">欢迎使用Dinknow</text>
      <text class="login-page-subtitle">让我们一起匹克球</text>

      <!-- NOTE: iOS cell 式登录表单，与主界面信息卡片风格一致 -->
      <view class="ios-section login-form-section">
        <!-- 头像行 -->
        <view class="ios-cell login-cell--avatar">
          <text class="ios-cell__label">头像</text>
          <!-- NOTE: 用 view 包裹并设 margin-left:auto，绕过微信 button 默认 width:100% 导致靠右失效 -->
          <view class="login-avatar-right">
            <button
              class="login-row-avatar-btn"
              open-type="chooseAvatar"
              @chooseavatar="onLoginChooseAvatar"
            >
              <image v-if="loginAvatarUrl" class="login-row-avatar" :src="loginAvatarUrl" mode="aspectFill" />
              <view v-else class="login-row-avatar login-row-avatar--placeholder">
                <image class="login-row-avatar-default" src="/static/icons/avatar-default.png" mode="aspectFill" />
              </view>
              <view class="login-row-avatar-badge">
                <text class="login-row-avatar-badge-text">编辑</text>
              </view>
            </button>
          </view>
          <text class="ios-cell__chevron">›</text>
        </view>

        <!-- 分隔线 -->
        <view class="ios-cell-separator" />

        <!-- 昵称行 -->
        <view class="ios-cell">
          <text class="ios-cell__label">昵称</text>
          <!-- NOTE: type=nickname 触发微信昵称授权，自动填入微信昵称建议 -->
          <input
            class="login-nickname-right"
            type="nickname"
            placeholder="请输入昵称"
            placeholder-class="ios-input-placeholder"
            :value="loginNickName"
            @input="onLoginNicknameInput"
          />
        </view>
      </view>

      <!-- 完成登录按钮 -->
      <view class="login-submit-btn" @tap="handleLoginSubmit">
        <text class="login-submit-text">登录</text>
      </view>
    </view>
    <scroll-view v-else class="profile-scroll" scroll-y>
      <view class="profile-body">

        <!-- NOTE: 头像卡片横排：左侧头像，右侧昵称 + DUPR 水平 -->
        <view class="ios-section profile-avatar-card">
          <!-- NOTE: wrapper 相对定位，让编辑小圆点脱离 button overflow:hidden 范围，直接叠加在头像右下角 -->
          <view class="profile-avatar-wrap">
            <button
              class="profile-avatar-circle"
              open-type="chooseAvatar"
              @chooseavatar="onChooseAvatar"
            >
              <image
                v-if="avatarUrl"
                class="profile-avatar"
                :src="getCloudImageUrl(avatarUrl)"
                mode="aspectFill"
              />
              <view v-else class="profile-avatar profile-avatar--placeholder">
                <text class="profile-avatar-icon">👤</text>
              </view>
            </button>
            <!-- NOTE: 编辑头像按鈕，使用 edit-avatar.png -->
            <view class="profile-edit-dot">
              <image class="profile-edit-dot-icon" src="/static/icons/edit-avatar.png" mode="aspectFit" />
            </view>
          </view>
          <!-- 右侧信息区：昵称 + DUPR 水平 -->
          <view class="profile-info-right">
            <text class="profile-username">{{ nickName || '微信用户' }}</text>
            <!-- NOTE: 头部 DUPR 图标使用 pikeqiu.png -->
            <view class="profile-dupr-row">
              <image class="profile-dupr-icon" src="/static/icons/pikeqiu.png" mode="aspectFit" />
              <text class="profile-dupr-label">{{ duprLevel || '暂未设置 DUPR 水平' }}</text>
            </view>
          </view>
        </view>

        <!-- 信息卡片 -->
        <view class="ios-section">
          <view class="ios-cell" @tap="openNicknameEdit">
            <image class="ios-cell__row-icon" src="/static/icons/nicheng.png" mode="aspectFit" />
            <text class="ios-cell__label">昵称</text>
            <text :class="nickName ? 'ios-cell__value' : 'ios-cell__value ios-cell__placeholder'">{{ nickName || '请输入' }}</text>
            <text class="ios-cell__chevron">›</text>
          </view>
          <view class="ios-cell" @tap="openGenderEdit">
            <image class="ios-cell__row-icon" src="/static/icons/xingbie.png" mode="aspectFit" />
            <text class="ios-cell__label">性别</text>
            <text :class="genderSet ? 'ios-cell__value' : 'ios-cell__value ios-cell__placeholder'">{{ genderText }}</text>
            <text class="ios-cell__chevron">›</text>
          </view>
          <view class="ios-cell" @tap="openRegionEdit">
            <image class="ios-cell__row-icon" src="/static/icons/diqu.png" mode="aspectFit" />
            <text class="ios-cell__label">地区</text>
            <text :class="region ? 'ios-cell__value' : 'ios-cell__value ios-cell__placeholder'">{{ region || '请选择' }}</text>
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
            <text :class="signature ? 'ios-cell__value ios-cell__value--ellipsis' : 'ios-cell__value ios-cell__value--ellipsis ios-cell__placeholder'">{{ signature || '请填写' }}</text>
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
import { login, getProfile, updateProfile, checkLogin } from '../../services/user'
import { getCloudImageUrl } from '../../services/cloud'
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
// NOTE: genderSet 为 true 表示用户已主动设置过性别，未设置时占位文案显示「请选择」
const genderSet = ref(false)
const duprLevel = ref('')
const region = ref('')
const signature = ref('')

const myCreated = ref<Activity[]>([])
const myJoined = ref<Activity[]>([])

const saving = ref(false)



// NOTE: 登录状态，false 时展示登录界面
const isLoggedIn = ref(false)
// NOTE: 登录状态检查中（初始为 true），检查期间页面显示空白，避免已登录用户看到登录页闪烁
const profileChecking = ref(true)
// NOTE: 登录界面临时头像/昵称（submit 前暂存）
const loginAvatarUrl = ref('')
const loginNickName = ref('')

// NOTE: 检查登录状态，优先从本地缓存判断，避免云函数网络请求导致的白屏
async function checkLoginStatus() {
  profileChecking.value = true
  try {
    // 第一步：同步读取本地缓存，若有有效 profile 则立即跳过白屏
    const cachedProfile = uni.getStorageSync('cached_profile')
    if (cachedProfile && typeof cachedProfile.nickName === 'string' && cachedProfile.nickName.trim().length > 0) {
      isLoggedIn.value = true
      profileChecking.value = false
      // 用缓存数据先填充页面，避免闪烁
      user.value = cachedProfile
      nickName.value = cachedProfile.nickName || ''
      // NOTE: 直接使用原始 URL，模板层 getCloudImageUrl() 同步处理 cloud://，与活动详情页一致
      avatarUrl.value = cachedProfile.avatarUrl || ''
      if (typeof cachedProfile.gender === 'number' && cachedProfile.gender > 0) {
        gender.value = cachedProfile.gender as 0 | 1 | 2
        genderSet.value = true
      }
      duprLevel.value = cachedProfile.duprLevel || ''
      region.value = cachedProfile.region || ''
      signature.value = cachedProfile.signature || ''
      // 后台静默验证 + 刷新最新数据
      loadProfileAndActivities()
      return
    }
    // 第二步：无缓存，走云函数检查
    const { ok } = await checkLogin()
    isLoggedIn.value = ok
    if (ok) {
      await loadProfileAndActivities()
    }
  } catch {
    isLoggedIn.value = false
  } finally {
    profileChecking.value = false
  }
}

// NOTE: 登录界面，选择头像回调（暂存到 loginAvatarUrl，提交时再上传）
function onLoginChooseAvatar(e: any) {
  const tempPath = e?.detail?.avatarUrl
  if (tempPath) loginAvatarUrl.value = tempPath
}

// NOTE: 登录界面，昵称输入
function onLoginNicknameInput(e: any) {
  loginNickName.value = e?.detail?.value || ''
}

// NOTE: 点击「完成登录」：上传头像（若有）→ 保存昵称 → 刷新登录状态进入主界面
async function handleLoginSubmit() {
  if (!loginNickName.value.trim()) {
    uni.showToast({ title: '请填写昵称', icon: 'none' })
    return
  }
  saving.value = true
  try {
    let finalAvatarUrl = ''
    if (loginAvatarUrl.value) {
      // #ifdef MP-WEIXIN
      const cloudPath = `avatars/${Date.now()}-wechat.jpg`
      const uploadRes = await (wx as any).cloud.uploadFile({ cloudPath, filePath: loginAvatarUrl.value })
      finalAvatarUrl = uploadRes.fileID
      // #endif
    }
    await updateProfile({
      nickName: loginNickName.value.trim(),
      avatarUrl: finalAvatarUrl || undefined,
      gender: 0,
      duprLevel: '',
      region: '',
      signature: ''
    } as any)
    uni.showToast({ title: '登录成功', icon: 'success' })
    await checkLoginStatus()
  } catch (err) {
    console.error('登录失败:', err)
    uni.showToast({ title: '登录失败，请重试', icon: 'none' })
  } finally {
    saving.value = false
  }
}

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

// NOTE: 性别展示文字：未设置时显示「请选择」占位，已设置显示实际选项
const genderText = computed(() => genderSet.value ? (genderOptions[gender.value] || '保密') : '请选择')

async function loadProfileAndActivities() {
  try {
    const loginRes = await login()
    const openid = loginRes?.openid
    if (openid) {
      const profile = await getProfile(openid)
      if (profile) {
        user.value = profile
        nickName.value = profile.nickName || ''
        // NOTE: cloud:// fileID 转换为可访问的 HTTP 临时 URL，避免渲染层网络错误
        avatarUrl.value = profile.avatarUrl || ''
        // NOTE: gender > 0（男/女）才算用户主动设置过；gender === 0 是默认值，仍显示「请选择」
        if (typeof profile.gender === 'number' && profile.gender > 0) {
          gender.value = profile.gender as 0 | 1 | 2
          genderSet.value = true
        }
        duprLevel.value = profile.duprLevel || ''
        region.value = (profile as any).region || ''
        signature.value = (profile as any).signature || ''
        // NOTE: 缓存 profile 到本地，下次进入时可立即跳过白屏
        try { uni.setStorageSync('cached_profile', profile) } catch {}
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

// NOTE: 轻量刷新活动场次（onShow 专用，只更新计数，不重新拉取 profile）
async function refreshActivities() {
  try {
    const activities = await getUserActivities()
    myCreated.value = Array.isArray(activities.created) ? activities.created : []
    myJoined.value = Array.isArray(activities.joined) ? activities.joined : []
  } catch (e) {
    console.error('刷新活动场次失败', e)
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
    genderSet.value = true // NOTE: 用户主动选择后标记为已设置
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
  // NOTE: 先检查登录状态，已登录则自动加载资料
  checkLoginStatus()
  uni.$on('profileFieldSaved', async (data: { type: string; value: string }) => {
    if (data.type === 'nickname') {
      nickName.value = data.value
    } else if (data.type === 'signature') {
      signature.value = data.value
    }
    await saveProfile()
  })
})

// NOTE: onShow 返回个人页时：未登录则重新检查（可能已在其他流程完成登录）；已登录则同步城市并刷新活动场次
onShow(() => {
  if (!isLoggedIn.value) {
    checkLoginStatus()
    return
  }
  const saved = uni.getStorageSync('profile_region')
  if (saved) {
    region.value = saved
    uni.removeStorageSync('profile_region')
    saveProfile()
  }
  // NOTE: 每次切回个人页都刷新场次，确保报名/退出/创建/删除后数计实时同步
  refreshActivities()
})
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  // NOTE: 顶部使用广场页蓝色 $ios-blue (#007AFF) 渐变到底部白色
  background: linear-gradient(180deg, #007AFF 0%, #4DA6FF 20%, #C2E0FF 45%, #EBF5FF 65%, #FFFFFF 100%);
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
  background: #ffffff;
  // NOTE: 卡片全宽贴边，无左右边距和阴影
  border-radius: 0;
  margin: 0 0 $ios-spacing-lg;
  overflow: hidden;
}

// ---- 头像卡片 ----
// NOTE: 头像区域透明，露出蓝色渐变背景；横排布局：左头像 + 右侧信息
.profile-avatar-card {
  background: transparent !important;
  box-shadow: none !important;
  margin: 0 0 $ios-spacing-sm;
  border-radius: 0 !important;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: $ios-spacing-lg $ios-spacing-lg;
  gap: $ios-spacing-md;
}

// NOTE: 右侧信息竖排：昵称 + DUPR 水平
.profile-info-right {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

// NOTE: 头像 wrapper，relative 定位用于承载右下角绝对定位的编辑圆点
.profile-avatar-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}

// NOTE: 圆圈容器，overflow:hidden 裁切头像为圆形
.profile-avatar-circle {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  // NOTE: 重置微信 button 默认样式，防止 padding/margin 破坏圆形裁切
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  box-sizing: border-box;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  display: block;
}

// 去掉微信 button 点击态的边框
.profile-avatar-circle::after {
  border: none;
}

.profile-avatar {
  width: 80px;
  height: 80px;
}

.profile-avatar--placeholder {
  width: 80px;
  height: 80px;
  background: $ios-bg-tertiary;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-avatar-icon {
  font-size: 40px;
}

// NOTE: 编辑图标容器，浅蓝色圆形背景与页面蓝色渐变协调
.profile-edit-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 26px;
  height: 26px;
  background: #5AABF5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-edit-dot-icon {
  width: 16px;
  height: 16px;
}

.profile-username {
  font-size: 18px;
  font-weight: $ios-font-weight-medium;
  // NOTE: 白色文字，在蓝色渐变背景上清晰可读
  color: #ffffff;
}

// NOTE: DUPR 行横排容器：图标 + 文字对齐
.profile-dupr-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

// NOTE: 头像卡片中 DUPR 图标，按原始颜色显示
.profile-dupr-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

// NOTE: DUPR 水平副标题，半透明白色，视觉层级低于昵称
.profile-dupr-label {
  font-size: 13px;
  color: #ffffff;
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

// NOTE: 登录状态检查中的空白遮罩，背景色与页面一致，用户无感知
.profile-loading {
  min-height: 100vh;
  background: $ios-bg-secondary;
}

// ---- 登录界面 ----
.login-page {
  min-height: 100vh;
  background: $ios-bg-secondary;
  display: flex;
  flex-direction: column;
  padding: calc(#{$ios-spacing-xl} + 30px) $ios-spacing-lg $ios-spacing-xl;
  box-sizing: border-box;
  padding-top: calc(#{$ios-spacing-xl} + 30px + env(safe-area-inset-top));
}

.login-page-title {
  font-size: 22px;
  color: $ios-text-primary;
  margin-bottom: 6px;
}

.login-page-subtitle {
  font-size: 14px;
  color: $ios-text-secondary;
  margin-bottom: 100px;
}

// NOTE: 登录表单使用与主界面信息卡片相同的 ios-section，CSS 复用已定义的类名
.login-form-section {
  margin-bottom: $ios-spacing-lg;
}

// NOTE: 头像行 - 与其他 ios-cell 一致，右侧额外留出圆形头像空间
.login-cell--avatar {
  align-items: center;
}

// NOTE: 头像右对齐包裹，与主界面 ios-cell__value 布局完全一致
.login-avatar-value {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

// NOTE: 圆形头像选择按钮，必须参考 profile-avatar-circle、但尺寸芥小以适配单行別
.login-row-avatar-btn {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  padding: 0;
  background: transparent;
  border: none;
  box-sizing: border-box;
  display: block;
  flex-shrink: 0;
  &::after { border: none; }
}

// NOTE: view 包裹头像按钮并设 margin-left:auto，view 不受微信 button 默认样式影响
.login-avatar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.login-row-avatar {
  width: 48px;
  height: 48px;
  display: block;
}

.login-row-avatar--placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

// NOTE: 默认头像图标撑满整个 48px 圆形区域，灰色状态
.login-row-avatar-default {
  width: 48px;
  height: 48px;
  opacity: 0.4;
  filter: grayscale(100%);
}

.login-row-avatar-icon {
  font-size: 22px;
}

// NOTE: 与主界面 profile-edit-badge 完全一致 - 下半圆白色半透明覆盖
.login-row-avatar-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 18px;
  background: rgba(100, 100, 108, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-row-avatar-badge-text {
  font-size: 10px;
  color: #ffffff;
}

// ios-cell-separator 在登录表单的分隔线
.ios-cell-separator {
  height: 0.5px;
  background: rgba(0, 0, 0, 0.08);
  margin-left: $ios-spacing-lg;
}

// NOTE: 昵称输入框靠右显示，与 ios-cell__input--right 效果一致但不依赖跨页 scoped CSS
.login-nickname-right {
  flex: 1;
  text-align: right;
  font-size: 16px;
  color: $ios-text-primary;
  background: transparent;
  border: none;
}

.login-submit-btn {
  width: 100%;
  height: 54px;
  background: $ios-blue;
  border-radius: $ios-radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: $ios-spacing-xs;
  &:active { opacity: 0.85; }
}

.login-submit-text {
  font-size: 16px;
  font-weight: $ios-font-weight-semibold;
  color: #ffffff;
}
</style>
