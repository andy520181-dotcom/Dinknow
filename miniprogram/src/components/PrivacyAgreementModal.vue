<template>
  <view v-if="show" class="privacy-modal-overlay" @tap="handleOverlayTap">
    <view class="privacy-modal" @tap.stop>
      <view class="modal-header">
        <view class="app-info">
          <view class="app-icon">
            <text class="app-icon-text">D</text>
          </view>
          <text class="app-name">Dinknow 丁刻 申请</text>
        </view>
        <view class="info-icon">ℹ️</view>
      </view>
      
      <view class="modal-content">
        <text class="modal-title">获取你的位置信息</text>
        <text class="modal-desc">将获取你的具体位置信息，用于显示附近的匹克球活动与计算距离</text>
      </view>
      
      <view class="modal-actions">
        <button class="btn-reject" @tap="handleReject">拒绝</button>
        <button 
          class="btn-allow" 
          :class="{ 'disabled': !agreed }"
          :disabled="!agreed"
          @tap="handleAllow"
        >
          允许
        </button>
      </view>
      
      <view class="modal-agreement">
        <view class="checkbox-wrapper" @tap="toggleAgreement">
          <view :class="['checkbox', { 'checked': agreed }]">
            <text v-if="agreed" class="checkmark">✓</text>
          </view>
          <view class="agreement-text">
            <text>已阅读并接受</text>
            <text class="link" @tap.stop="openUserAgreement">《用户协议》</text>
            <text>和</text>
            <text class="link" @tap.stop="openPrivacyPolicy">《隐私保护指引》</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { USER_AGREEMENT_URL, PRIVACY_POLICY_URL } from '../constants'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'agree'): void
  (e: 'reject'): void
}>()

const agreed = ref(false)

function toggleAgreement() {
  agreed.value = !agreed.value
}

function handleOverlayTap() {
  // 点击遮罩层不关闭弹窗，必须做出选择
}

function handleReject() {
  emit('reject')
}

function handleAllow() {
  if (!agreed.value) {
    uni.showToast({ title: '请先阅读并同意协议', icon: 'none' })
    return
  }
  emit('agree')
}

function openUserAgreement() {
  // 打开用户协议页面
  // #ifdef MP-WEIXIN
  // 尝试使用webview页面打开
  uni.navigateTo({
    url: `/pages/webview/index?url=${encodeURIComponent(USER_AGREEMENT_URL)}&title=用户协议`
  }).catch(() => {
    // 如果webview页面不存在，复制链接到剪贴板
    uni.setClipboardData({
      data: USER_AGREEMENT_URL,
      success: () => {
        uni.showToast({ title: '链接已复制，请在浏览器中打开', icon: 'none', duration: 2000 })
      }
    })
  })
  // #endif
  
  // #ifndef MP-WEIXIN
  // 其他平台：复制链接
  uni.setClipboardData({
    data: USER_AGREEMENT_URL,
    success: () => {
      uni.showToast({ title: '链接已复制', icon: 'none' })
    }
  })
  // #endif
}

function openPrivacyPolicy() {
  // 打开隐私保护指引页面
  // #ifdef MP-WEIXIN
  uni.navigateTo({
    url: `/pages/webview/index?url=${encodeURIComponent(PRIVACY_POLICY_URL)}&title=隐私保护指引`
  }).catch(() => {
    uni.setClipboardData({
      data: PRIVACY_POLICY_URL,
      success: () => {
        uni.showToast({ title: '链接已复制，请在浏览器中打开', icon: 'none', duration: 2000 })
      }
    })
  })
  // #endif
  
  // #ifndef MP-WEIXIN
  uni.setClipboardData({
    data: PRIVACY_POLICY_URL,
    success: () => {
      uni.showToast({ title: '链接已复制', icon: 'none' })
    }
  })
  // #endif
}

// 监听show变化，重置勾选状态
watch(() => props.show, (newVal) => {
  if (newVal) {
    agreed.value = false
  }
})
</script>

<style lang="scss" scoped>


.privacy-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.privacy-modal {
  width: 100%;
  background: #fff;
  border-radius: 24px 24px 0 0;
  padding: 24px 20px 32px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: $ios-blue;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-icon-text {
  color: #fff;
  font-size: 14px;
  font-weight: $ios-font-weight-bold;
  line-height: 1;
}

.app-name {
  font-size: 15px;
  font-weight: $ios-font-weight-medium;
  color: $ios-text-primary;
}

.info-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: $ios-text-secondary;
}

.modal-content {
  margin-bottom: 24px;
}

.modal-title {
  display: block;
  font-size: 20px;
  font-weight: $ios-font-weight-bold;
  color: $ios-text-primary;
  margin-bottom: 12px;
  line-height: 1.4;
}

.modal-desc {
  display: block;
  font-size: 15px;
  color: $ios-text-secondary;
  line-height: 1.5;
}

.modal-actions {
  margin-bottom: 16px;
}

.modal-agreement {
  margin-bottom: 0;
  padding: 16px;
  background: rgba($ios-blue, 0.05);
  border-radius: 12px;
}

.checkbox-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid $ios-separator;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.2s ease;
  
  &.checked {
    background: $ios-blue;
    border-color: $ios-blue;
  }
}

.checkmark {
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  line-height: 1;
}

.agreement-text {
  flex: 1;
  font-size: 14px;
  color: $ios-text-primary;
  line-height: 1.6;
  
  .link {
    color: $ios-blue;
    text-decoration: underline;
  }
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.btn-reject,
.btn-allow {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: $ios-font-weight-medium;
  border: none;
  
  &::after {
    border: none;
  }
}

.btn-reject {
  background: rgba($ios-text-secondary, 0.1);
  color: $ios-text-secondary;
}

.btn-allow {
  background: $ios-green;
  color: #fff;
  
  &.disabled {
    background: rgba($ios-text-tertiary, 0.3);
    color: rgba($ios-text-primary, 0.3);
  }
  
  &:not(.disabled):active {
    background: rgba($ios-green, 0.9);
  }
}
</style>
