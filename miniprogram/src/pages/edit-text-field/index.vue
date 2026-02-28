<template>
  <view class="edit-field-page">
    <!-- 顶部导航 -->
    <view class="edit-field-nav">
      <view class="edit-field-nav-cancel" @tap="onCancel">
        <text class="edit-field-nav-cancel-text">取消</text>
      </view>
      <text class="edit-field-nav-title">{{ pageTitle }}</text>
      <view
        class="edit-field-nav-done"
        :class="{ 'edit-field-nav-done--disabled': !inputValue.trim() }"
        @tap="onDone"
      >
        <text class="edit-field-nav-done-text">完成</text>
      </view>
    </view>

    <!-- 输入区域 -->
    <view class="edit-field-body">
      <view class="edit-field-input-card">
        <input
          v-if="fieldType === 'nickname'"
          class="edit-field-input"
          :value="inputValue"
          type="text"
          :placeholder="placeholder"
          :maxlength="maxLen"
          focus
          @input="onInput"
        />
        <textarea
          v-else
          class="edit-field-textarea"
          :value="inputValue"
          :placeholder="placeholder"
          :maxlength="maxLen"
          focus
          @input="onInput"
        />
        <!-- 字数提示 -->
        <text class="edit-field-count">{{ inputValue.length }}/{{ maxLen }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// NOTE: 通过页面参数决定编辑的字段类型（nickname / signature）
const fieldType = ref<'nickname' | 'signature'>('nickname')
const inputValue = ref('')

const pageTitle = computed(() => {
  return fieldType.value === 'nickname' ? '设置昵称' : '设置个性签名'
})

const placeholder = computed(() => {
  return fieldType.value === 'nickname' ? '请输入昵称' : '请填写球风，如进攻型、防守型等'
})

const maxLen = computed(() => {
  return fieldType.value === 'nickname' ? 20 : 80
})

onMounted(() => {
  // NOTE: 接收上一页传来的参数：type（字段类型）和 value（当前值）
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage?.options ?? {}
  fieldType.value = (options.type === 'signature' ? 'signature' : 'nickname')
  inputValue.value = decodeURIComponent(options.value ?? '')
})

function onInput(e: any) {
  inputValue.value = e?.detail?.value ?? ''
}

function onCancel() {
  uni.navigateBack()
}

function onDone() {
  if (!inputValue.value.trim()) return
  // NOTE: 通过 eventBus 通知上一页保存结果，key 与字段类型对应
  uni.$emit('profileFieldSaved', {
    type: fieldType.value,
    value: inputValue.value.trim()
  })
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.edit-field-page {
  min-height: 100vh;
  background: $ios-bg-secondary;
  display: flex;
  flex-direction: column;
}

// NOTE: 自定义导航栏，与微信原生导航栏高度对齐
.edit-field-nav {
  height: 44px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $ios-spacing-md;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
}

.edit-field-nav-cancel {
  min-width: 60px;
}

.edit-field-nav-cancel-text {
  font-size: 16px;
  color: $ios-text-primary;
}

.edit-field-nav-title {
  font-size: 16px;
  font-weight: $ios-font-weight-medium;
  color: $ios-text-primary;
}

.edit-field-nav-done {
  min-width: 60px;
  height: 30px;
  background: $ios-blue;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
}

.edit-field-nav-done--disabled {
  background: $ios-text-tertiary;
}

.edit-field-nav-done-text {
  font-size: 15px;
  color: #ffffff;
  font-weight: $ios-font-weight-medium;
}

.edit-field-body {
  padding: $ios-spacing-md 0;
}

.edit-field-input-card {
  background: #ffffff;
  padding: $ios-spacing-md $ios-spacing-lg;
  position: relative;
}

.edit-field-input {
  width: 100%;
  font-size: 16px;
  color: $ios-text-primary;
  min-height: 44px;
}

.edit-field-textarea {
  width: 100%;
  font-size: 16px;
  color: $ios-text-primary;
  min-height: 120px;
}

.edit-field-count {
  font-size: 13px;
  color: $ios-text-tertiary;
  display: block;
  text-align: right;
  margin-top: $ios-spacing-xs;
}
</style>
