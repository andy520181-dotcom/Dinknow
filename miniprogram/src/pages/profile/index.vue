<template>
  <view class="profile-page">
    <!-- NOTE: 登录状态检查中，显示空白背景，避免已登录用户知觉登录页闪烁 -->
    <view v-if="profileChecking" class="profile-loading" />
    <!-- NOTE: 自定义全屏登录页，内联 style 确保渐变生效（绕过 scoped SCSS 编译问题） -->
    <view
      v-else-if="!isLoggedIn"
      class="login-page"
      style="background: #F5F5F5;"
    >

      <!-- NOTE: 品牌区块：Logo + 标题聚合居中，占据上半屏，视觉聚焦 -->
      <view class="login-brand">
        <view class="login-logo-circle">
          <image class="login-logo-img" src="/static/icons/login-avatar.png" mode="aspectFit" />
        </view>
        <text class="login-brand-title">欢迎使用Dinknow</text>
        <text class="login-brand-subtitle">让我们一起匹克球</text>
      </view>

      <!-- 底部按钮 + 协议区 -->
      <view class="login-bottom">
        <!-- NOTE: 授权登录，微信 getPhoneNumber 触发器，样式完全自定义 -->
        <button
          class="login-primary-btn"
          :class="{ 'login-primary-btn--disabled': !agreedToTerms }"
          :open-type="agreedToTerms ? 'getPhoneNumber' : ''"
          :loading="saving"
          @getphonenumber="onGetPhoneNumber"
          @tap="onLoginBtnTap"
        >
          <text class="login-primary-text">立即登录</text>
        </button>

        <!-- 取消登录：跳转广场页以游客身份浏览 -->
        <view class="login-cancel-btn" @tap="handleLoginCancel">
          <text class="login-cancel-text">取消登录</text>
        </view>

        <!-- 协议勾选行 -->
        <view class="login-terms-row">
          <view class="login-terms-cb-wrap" @tap="agreedToTerms = !agreedToTerms">
            <view
              class="login-terms-checkbox"
              :class="{ 'login-terms-checkbox--checked': agreedToTerms }"
            >
              <text v-if="agreedToTerms" class="login-terms-check-icon">✓</text>
            </view>
          </view>
          <text class="login-terms-desc">我已阅读并同意<text class="login-terms-link" @tap="openAgreement">《用户协议》</text>和<text class="login-terms-link" @tap="openPrivacy">《隐私政策》</text></text>
        </view>
      </view>

    </view>
    <view v-else class="profile-scroll">
      <view class="profile-body">

        <!-- ── 顶部居中头像区 ── -->
        <view class="profile-hero">
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
            <view class="profile-edit-dot">
              <image class="profile-edit-dot-icon" src="/static/icons/edit-avatar.png" mode="aspectFit" />
            </view>
          </view>
          <text class="profile-hero-name">{{ nickName || '匹克球友' }}</text>
          <view class="profile-hero-dupr">
            <text class="profile-hero-dupr-text">{{ duprLevel || '设置 DUPR 水平' }}</text>
          </view>
        </view>

        <!-- ── 场次统计：双列并排卡片 ── -->
        <view class="stat-grid">
          <view class="stat-card" @tap="goToMyActivities('joined')">
            <text class="stat-count">{{ myJoined.length }}</text>
            <text class="stat-label">我参加的</text>
          </view>
          <view class="stat-card" @tap="goToMyActivities('created')">
            <text class="stat-count">{{ myCreated.length }}</text>
            <text class="stat-label">我发起的</text>
          </view>
        </view>

        <!-- ── 基本资料分区（含 DUPR 水平、球风）── -->
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
          <!-- DUPR 水平 -->
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

        <!-- ── 退出登录按钮 ── -->
        <view class="logout-btn" @tap="handleLogout">
          <text class="logout-btn-text">退出登录</text>
        </view>
        <!-- 底部：联系客服 + 版本号 -->
        <view class="app-footer-row">
          <button class="contact-btn" open-type="contact">联系客服</button>
          <text class="app-footer-dot">·</text>
          <text class="app-version">{{ appVersion }}</text>
        </view>

      </view>
    </view>

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
import { login, getProfile, updateProfile, checkLogin, bindPhone } from '../../services/user'
import { getCloudImageUrl } from '../../services/cloud'
import { getUserActivities } from '../../services/activity'
import type { User, Activity } from '../../types'

// NOTE: 自动读取微信后台版本号，正式版返回真实版本，开发/体验版返回空字符串
const appVersion = (() => {
  try {
    // #ifdef MP-WEIXIN
    const info = (wx as any).getAccountInfoSync()
    const v = info?.miniProgram?.version
    return v ? `Dinknow v${v}` : 'Dinknow'
    // #endif
  } catch {
    return 'Dinknow'
  }
  return 'Dinknow'
})()

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



// NOTE: 在 ref 初始化阶段同步读缓存，预判登录状态，避免已登录用户切换到个人页时闪一下登录页
const _cachedProfile = uni.getStorageSync('cached_profile')
const _explicitlyLoggedOut = uni.getStorageSync('explicitly_logged_out')
const _hasCache = !_explicitlyLoggedOut && _cachedProfile &&
  ((typeof _cachedProfile.phone === 'string' && _cachedProfile.phone.length > 0) ||
   (typeof _cachedProfile.nickName === 'string' && _cachedProfile.nickName.trim().length > 0))

// NOTE: 有缓存 → 初始就是已登录 + 检查完成；无缓存 → 未登录 + 检查完成（不再白屏等网络）
const isLoggedIn = ref(!!_hasCache)
const profileChecking = ref(false)
// NOTE: 用户是否已勾选同意协议，未勾选时按钮不触发授权
const agreedToTerms = ref(false)

/** 点击登录按钮时若未勾选协议，给出提示 */
function onLoginBtnTap() {
  if (!agreedToTerms.value) {
    uni.showToast({ title: '请先阅读并同意用户协议和隐私政策', icon: 'none' })
  }
}

function openAgreement() {
  uni.navigateTo({ url: '/pages/user-agreement/index' })
}

function openPrivacy() {
  uni.navigateTo({ url: '/pages/privacy-policy/index' })
}

/** 取消登录：切换到广场页，以游客身份浏览 */
function handleLoginCancel() {
  uni.switchTab({ url: '/pages/index/index' })
}

// NOTE: 检查登录状态，优先从本地缓存判断，避免云函数网络请求导致的白屏
// NOTE: 兼容新版（phone）和旧版（nickName）两种登录态
async function checkLoginStatus() {
  // NOTE: setNavigationBarTitle 只在当前页是 profile 时才调用，避免影响其他 tabbar 页
  function setProfileTitle(t: string) {
    const pages = getCurrentPages()
    const cur = pages[pages.length - 1]
    if (cur && (cur as any).route?.includes('profile')) {
      uni.setNavigationBarTitle({ title: t })
    }
  }

  // NOTE: 用户主动退出后，写入此标记；读到标记说明用户不希望自动重登录
  const explicitlyLoggedOut = uni.getStorageSync('explicitly_logged_out')
  if (explicitlyLoggedOut) {
    isLoggedIn.value = false
    profileChecking.value = false
    setProfileTitle('登录')
    return
  }

  const cachedProfile = uni.getStorageSync('cached_profile')
  const hasPhone = cachedProfile && typeof cachedProfile.phone === 'string' && cachedProfile.phone.length > 0
  const hasNickName = cachedProfile && typeof cachedProfile.nickName === 'string' && cachedProfile.nickName.trim().length > 0

  if (hasPhone || hasNickName) {
    // NOTE: 有本地缓存 → 立即显示个人页，不走网络
    isLoggedIn.value = true
    setProfileTitle('个人中心')
    profileChecking.value = false
    user.value = cachedProfile
    nickName.value = cachedProfile.nickName || ''
    avatarUrl.value = cachedProfile.avatarUrl || ''
    if (typeof cachedProfile.gender === 'number' && cachedProfile.gender > 0) {
      gender.value = cachedProfile.gender as 0 | 1 | 2
      genderSet.value = true
    }
    duprLevel.value = cachedProfile.duprLevel || ''
    region.value = cachedProfile.region || ''
    signature.value = cachedProfile.signature || ''
    loadProfileAndActivities()
    return
  }

  // NOTE: 无缓存（首次进入 / 清除数据后）→ 先立即显示登录页，不等网络
  isLoggedIn.value = false
  profileChecking.value = false
  setProfileTitle('登录')

  // NOTE: 后台静默检查云函数，如果发现已登录（旧用户清了缓存的情况）再自动切换
  try {
    const { ok } = await checkLogin()
    if (ok) {
      isLoggedIn.value = true
      setProfileTitle('个人中心')
      await loadProfileAndActivities()
    }
  } catch {
    // 网络失败不影响登录页显示
  }
}

/**
 * 微信手机号一键登录回调
 * NOTE: getPhoneNumber 返回 code，由云函数 bindPhone 调用微信 API 解密获取手机号明文
 */
async function onGetPhoneNumber(e: any) {
  if (e?.detail?.errMsg !== 'getPhoneNumber:ok') {
    uni.showToast({ title: '需要手机号才能登录', icon: 'none' })
    return
  }
  const code = e?.detail?.code
  if (!code) {
    uni.showToast({ title: '获取失败，请重试', icon: 'none' })
    return
  }
  saving.value = true
  try {
    uni.showLoading({ title: '登录中...' })
    const res = await bindPhone(code)
    uni.hideLoading()
    if (res?.success) {
      // NOTE: 主动登录成功，清除退出标记，后续 onShow 可正常自动检查登录态
      uni.removeStorageSync('explicitly_logged_out')
      // NOTE: 写入最小 cached_profile，确保下次 onShow 直接走缓存判断
      const minProfile = { phone: res.phone || 'bound', openid: res.openid || '', nickName: '', avatarUrl: '' }
      try { uni.setStorageSync('cached_profile', minProfile) } catch {}
      // NOTE: 先加载完整 profile 数据并填充字段，再切换到个人页
      // 这样用户看到个人页时已经是完整的已保存数据，不会闪烁初始态
      await loadProfileAndActivities()
      // NOTE: 数据准备好后再切换视图，避免先显示空白再跳变
      isLoggedIn.value = true
      uni.setNavigationBarTitle({ title: '个人中心' })
      uni.showToast({ title: '登录成功', icon: 'success' })
    } else {
      uni.showToast({ title: res?.message || '登录失败，请重试', icon: 'none' })
    }
  } catch (err) {
    uni.hideLoading()
    console.error('手机号登录失败:', err)
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
      nickName: nickName.value.trim() || '匹克球友',
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

// NOTE: 退出登录：清除本地缓存，小程序回到登录状态
function handleLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确认退出登录？',
    confirmText: '退出',
    confirmColor: '#FF3B30',
    success: (res) => {
      if (res.confirm) {
        uni.clearStorageSync()
        // NOTE: clearStorage 之后再写标记，防止被清掉；onShow 检查此标记跳过自动重登录
        uni.setStorageSync('explicitly_logged_out', true)
        isLoggedIn.value = false
        nickName.value = ''
        avatarUrl.value = ''
        // NOTE: 必须同步重置 gender 和 genderSet，否则退出后再登录会显示上一次选择的性别
        gender.value = 0
        genderSet.value = false
        duprLevel.value = ''
        region.value = ''
        signature.value = ''
        myJoined.value = []
        myCreated.value = []
        // NOTE: 重置登录页协议勾选状态，恢复为初始未选中
        agreedToTerms.value = false
        uni.setNavigationBarTitle({ title: '登录' })
      }
    }
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
  // NOTE: 与全局页面统一使用暖中性灰
  background: #F5F5F5;
  display: flex;
  flex-direction: column;
  // NOTE: 为 login-page 的定位提供包含块
  position: relative;
}

// ---- 自定义登录页 ----
.login-page {
  // NOTE: 不用 position:absolute，WeChat 小程序中父无 position:relative 时绝对定位失效
  // 改为 flex 子元素，自动撑满 profile-page，背景色可正常渲染
  flex: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  // NOTE: 与全局统一
  background: #F5F5F5;
  // NOTE: 水平边距不在这里设，而是各子区域自己设，避免微信 button 忽略父 padding
  padding: 60px 0 52px;
  box-sizing: border-box;
}

// NOTE: 品牌区块：Logo + 标题聚合居中，flex:1 占满上半屏，视觉聚焦
.login-brand {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  // NOTE: center 让品牌整体居于上半屏偏中位置
  justify-content: center;
  gap: 0;
}

.login-brand-title {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin-top: 20px;
  text-align: center;
}

.login-brand-subtitle {
  display: block;
  font-size: 12px;
  color: #8888aa;
  margin-top: 6px;
  text-align: center;
}

// NOTE: 图片自带蓝色圆形背景，overflow:hidden 裁切成圆形展示
.login-logo-circle {
  width: 88px;
  height: 88px;
  border-radius: 44px;
  background: transparent;
  overflow: hidden;
  // 精致阴影
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.login-logo-img {
  width: 100%;
  height: 100%;
}

// 底部按钮区 - 固定在底部
.login-bottom {
  display: flex;
  flex-direction: column;
  gap: 12px;
  // NOTE: 水平 padding 在此处设，button width:100% 则基于此内容宽度计算，解决微信 button 宽度问题
  padding: 0 24px;
  box-sizing: border-box;
}

// NOTE: 微信 getPhoneNumber 触发按钒，外观完全自定义
// 选中后与发新活动「点击发布」按钒相同蓝色（$ios-blue）
.login-primary-btn {
  width: 100%;
  height: 52px;
  background: $ios-blue;
  // NOTE: 与活动卡片 ios-section 圆角参数一致（$ios-radius-lg = 16px）
  border-radius: $ios-radius-lg;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  box-shadow: 0 4px 20px rgba(10, 132, 255, 0.30);
  &::after { border: none; }

  &--disabled {
    background: #8e8e93;
    box-shadow: none;
    opacity: 0.8;
  }
}

.login-primary-text {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 1px;
}

// 取消按钮：半透明白底，轻边框
.login-cancel-btn {
  width: 100%;
  height: 52px;
  background: rgba(255, 255, 255, 0.55);
  // NOTE: 与活动卡片圆角一致
  border-radius: $ios-radius-lg;
  border: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-cancel-text {
  font-size: 16px;
  color: #5a5a7a;
}

// 协议勾选行：两层 flex 确保垂直居中
.login-terms-row {
  display: flex;
  flex-direction: row;
  // NOTE: center 让勾选框+协议文字整体居中（不靠左）
  justify-content: center;
  align-items: stretch;
  gap: 8px;
  margin-top: 4px;
  min-height: 22px;
}

// checkbox 的外层 view：height 继承 stretch，内部 flex center
.login-terms-cb-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 18px;
}

.login-terms-checkbox {
  width: 18px;
  height: 18px;
  min-width: 18px;
  border-radius: 50%;
  border: 1.5px solid #a0a0c0;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;

  &--checked {
    background: $ios-blue;
    border-color: $ios-blue;
  }
}

.login-terms-check-icon {
  font-size: 10px;
  color: #ffffff;
  font-weight: 700;
  line-height: 1;
}

// NOTE: 单根 text 嵌套链接，WeChat 小程序中最稳定的垂直居中写法
.login-terms-desc {
  font-size: 12px;
  color: #8888aa;
  line-height: 18px;
  align-self: center;
}

.login-terms-link {
  font-size: 12px;
  color: $ios-blue;
  line-height: 1.5;
}

.profile-scroll {
  flex: 1;
}

.profile-body {
  padding: 0 0 $ios-spacing-lg;
}

// ---- 卡片基础（参考图：圆角白色卡片，左右带间距）----
.ios-section {
  background: #ffffff;
  border-radius: 14px;
  margin: 0 16px $ios-spacing-md;
  overflow: hidden;
}

// ---- 头像区：居中垂直排列，整页使用标准灰背景 ----
.profile-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px 24px;
  background: transparent;
  margin-bottom: $ios-spacing-md;
}

.profile-hero-name {
  font-size: 16px;
  font-weight: $ios-font-weight-semibold;
  color: #111;
  margin-top: 12px;
}

.profile-hero-dupr {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.profile-hero-dupr-icon {
  width: 14px;
  height: 14px;
}

.profile-hero-dupr-text {
  font-size: 12px;
  color: $ios-text-tertiary;
  font-weight: $ios-font-weight-regular;
}

// NOTE: wrapper 相对定位，承载编辑圆点
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
  font-size: 16px;
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
  font-size: 12px;
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
  font-size: 16px;
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
  font-size: 16px;
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
  font-size: 16px;
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
  font-size: 16px;
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
// ── 双列统计卡 ──────────────────────────────────────────
.stat-grid {
  display: flex;
  gap: 12px;
  padding: 0 16px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  background: #ffffff;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0 16px;

  &:active { opacity: 0.75; }
}

.stat-count {
  font-size: 32px;
  font-weight: $ios-font-weight-semibold;
  color: $ios-blue;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: $ios-text-secondary;
  margin-top: 6px;
  font-weight: $ios-font-weight-regular;
}

// ── 分区标题（基本资料 / 运动档案）────────────────────────
.profile-section-title {
  font-size: 12px;
  color: $ios-text-tertiary;
  font-weight: $ios-font-weight-regular;
  padding: 0 16px 8px;
}

// ── 退出登录按钮 ──────────────────────────────────────────
.logout-btn {
  margin: 20px 16px 0;
  background: #ffffff;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;

  &:active { opacity: 0.7; }
}

.logout-btn-text {
  font-size: 16px;
  color: #333333;
  font-weight: $ios-font-weight-medium;
}

// ── 底部：联系客服 + 版本号 ────────────────────────────────
.app-footer-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding-bottom: 32px;
  margin-top: 8px;
}

.contact-btn {
  background: transparent !important;
  display: inline;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 0;
  overflow: visible;
  line-height: 1;
  min-height: 0;
  height: auto;
  font-size: 10px;
  color: rgba(0, 0, 0, 0.2);

  &::after { display: none; }
  &:active { opacity: 0.5; }
}

.app-footer-dot {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.2);
}

.app-version {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.2);
  line-height: 1;
}

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
  // NOTE: 左右 padding 设为 0，由 ios-section 的 margin: 0 16px 统一控制左右边距
  padding: 0 0 $ios-spacing-xl;
  box-sizing: border-box;
  padding-top: calc(#{$ios-spacing-xl} + 30px + env(safe-area-inset-top));
}

.login-page-title {
  font-size: 24px;
  color: $ios-text-primary;
  margin-bottom: 6px;
  // NOTE: 标题缩进与卡片左右边距对齐
  padding: 0 16px;
}

.login-page-subtitle {
  font-size: 12px;
  color: $ios-text-secondary;
  margin-bottom: 100px;
  padding: 0 16px;
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

// NOTE: 圆形占位：浅灰圆形背景 + 球拍图标居中
.login-row-avatar--placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

// NOTE: 默认头像使用球拍水印图，灰色透明状态提示「待选择」
.login-row-avatar-default {
  width: 36px;
  height: 36px;
  opacity: 0.35;
}

.login-row-avatar-icon {
  font-size: 24px;
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
  // NOTE: 左右 margin 16px，与卡片边距保持一致
  margin: $ios-spacing-xs 16px 0;
  height: 54px;
  background: $ios-blue;
  border-radius: $ios-radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  &:active { opacity: 0.85; }
}

.login-submit-text {
  font-size: 16px;
  font-weight: $ios-font-weight-semibold;
  color: #ffffff;
}
</style>
