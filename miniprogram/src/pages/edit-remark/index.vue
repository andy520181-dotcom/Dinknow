<template>
  <view class="remark-page">
    <!-- NOTE: 原生导航栏显示"备注"标题，取消/完成按钮在下方独立一行，不会被微信胶囊遮挡 -->
    <view class="remark-actions">
      <view class="remark-action-btn" @tap="onCancel">
        <text class="remark-action-text remark-action-text--cancel">取消</text>
      </view>
      <view
        class="remark-action-btn remark-action-btn--done"
        :class="{ 'remark-action-btn--done-disabled': !hasContent }"
        @tap="hasContent ? onDone() : undefined"
      >
        <text class="remark-action-text remark-action-text--done">完成</text>
      </view>
    </view>

    <!-- 输入区域 -->
    <view class="remark-body">
      <view class="remark-input-card">
        <textarea
          class="remark-textarea"
          placeholder="选填，如注意事项、装备要求等"
          :value="content"
          :maxlength="1000"
          focus
          @input="onInput"
        />
        <text class="remark-count">{{ content.length }}/1000</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const content = ref('')

// NOTE: 有内容时完成按钮才可用（与昵称/球风编辑页一致）
const hasContent = computed(() => content.value.trim().length > 0)

function onInput(e: any) {
  content.value = e?.detail?.value ?? ''
}

function onDone() {
  // NOTE: 将备注保存到 storage，返回后由发起活动页 onShow 读取同步
  uni.setStorageSync('editing_activity_remark', content.value)
  uni.navigateBack()
}

function onCancel() {
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
  background: $ios-bg-secondary;
  display: flex;
  flex-direction: column;
}

// NOTE: 取消/完成按钮行，紧贴原生导航栏下方，两端对齐
.remark-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $ios-spacing-sm $ios-spacing-lg;
  background: #ffffff;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
}

.remark-action-btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 4px;

  &--done {
    background: $ios-blue;
    border-radius: 8px;
    padding: 6px 16px;
    // NOTE: 无内容时按钮变灰，与昵称/球风编辑页一致
    &-disabled {
      background: $ios-text-tertiary;
    }
  }
}

.remark-action-text {
  font-size: 16px;

  &--cancel {
    color: $ios-text-primary;
  }

  &--done {
    color: #ffffff;
    font-weight: $ios-font-weight-medium;
  }
}

.remark-body {
  padding: $ios-spacing-md 0;
}

.remark-input-card {
  background: #ffffff;
  padding: $ios-spacing-md $ios-spacing-lg;
}

.remark-textarea {
  width: 100%;
  font-size: 16px;
  color: $ios-text-primary;
  min-height: 160px;
  line-height: 1.6;
}

.remark-count {
  font-size: 13px;
  color: $ios-text-tertiary;
  display: block;
  text-align: right;
  margin-top: $ios-spacing-xs;
}
</style>
