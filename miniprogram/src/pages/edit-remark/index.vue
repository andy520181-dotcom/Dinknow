<template>
  <view class="remark-page">
    <!-- 输入区域 -->
    <view class="remark-body">
      <textarea
        class="remark-textarea"
        placeholder="选填，如注意事项、装备要求等"
        placeholder-class="remark-placeholder"
        :value="content"
        @input="onInput"
        :maxlength="1000"
        auto-focus
        auto-height
      />
    </view>

    <!-- 字数提示 -->
    <view class="remark-count">
      <text class="remark-count-text">{{ content.length }}/1000</text>
    </view>

    <!-- 完成按钮 -->
    <view class="remark-footer">
      <button class="done-btn" @tap="handleDone">完成</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const content = ref('')

function onInput(e: any) {
  content.value = e?.detail?.value ?? ''
}

function handleDone() {
  // NOTE: 将备注保存到 storage，返回后由发起活动页 onShow 读取同步
  uni.setStorageSync('editing_activity_remark', content.value)
  uni.navigateBack()
}

onMounted(() => {
  // 读取发起活动页传入的当前备注内容，回填到输入框
  const cached = uni.getStorageSync('editing_activity_remark')
  if (typeof cached === 'string') {
    content.value = cached
  }
})
</script>

<style lang="scss" scoped>
.remark-page {
  min-height: 100vh;
  background: #f2f2f7;
  display: flex;
  flex-direction: column;
}

.remark-body {
  margin: 16px;
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  flex: 1;
}

.remark-textarea {
  width: 100%;
  min-height: 200px;
  font-size: 16px;
  color: #1c1c1e;
  line-height: 1.6;
}

.remark-placeholder {
  color: #c7c7cc;
  font-size: 16px;
}

.remark-count {
  text-align: right;
  padding: 0 20px 8px;
}

.remark-count-text {
  font-size: 13px;
  color: #8e8e93;
}

.remark-footer {
  padding: 12px 16px calc(16px + env(safe-area-inset-bottom));
}

.done-btn {
  width: 100%;
  height: 44px;
  border-radius: 999px;
  background: #007aff;
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
