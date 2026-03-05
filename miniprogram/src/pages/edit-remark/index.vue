<template>
  <view class="remark-page">
    <!-- 取消/完成按钮行 -->
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

    <view class="remark-body">
      <view class="remark-input-card">

        <!-- ① 图片区（置顶） -->
        <view class="remark-images">
          <!-- 已选图片缩略图 -->
          <view v-for="(img, idx) in images" :key="idx" class="remark-thumb-wrap">
            <image class="remark-thumb" :src="img" mode="aspectFill" />
            <view class="remark-thumb-del" @tap.stop="removeImage(idx)">
              <text class="remark-thumb-del-icon">×</text>
            </view>
          </view>

          <!-- 添加图片按钮（最多6张，参考图：大方块+相机图标+文字） -->
          <view v-if="images.length < MAX_IMAGES" class="remark-add-btn" @tap="pickImage">
            <image class="remark-add-camera-img" src="/static/icons/xiangji.png" mode="aspectFit" />
            <text class="remark-add-label">添加图片</text>
          </view>
        </view>

        <!-- ② 文字输入 -->
        <textarea
          class="remark-textarea"
          placeholder="选填，如注意事项、装备要求等"
          :value="content"
          :maxlength="-1"
          @input="onInput"
        />


      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const MAX_IMAGES = 6

const content = ref('')
const images = ref<string[]>([])

const hasContent = computed(
  () => content.value.trim().length > 0 || images.value.length > 0
)

function onInput(e: any) {
  content.value = e?.detail?.value ?? ''
}

function pickImage() {
  const remaining = MAX_IMAGES - images.value.length
  if (remaining <= 0) return
  // #ifdef MP-WEIXIN
  uni.chooseImage({
    count: remaining,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      images.value = [...images.value, ...res.tempFilePaths].slice(0, MAX_IMAGES)
    }
  })
  // #endif
}

function removeImage(idx: number) {
  images.value = images.value.filter((_, i) => i !== idx)
}

function onDone() {
  uni.setStorageSync('editing_activity_remark', content.value)
  uni.setStorageSync('editing_activity_remark_images', images.value)
  uni.navigateBack()
}

function onCancel() {
  uni.navigateBack()
}

onMounted(() => {
  const cachedText = uni.getStorageSync('editing_activity_remark')
  if (typeof cachedText === 'string') content.value = cachedText

  const cachedImages = uni.getStorageSync('editing_activity_remark_images')
  if (Array.isArray(cachedImages)) images.value = cachedImages
})
</script>

<style lang="scss" scoped>
.remark-page {
  min-height: 100vh;
  background: $ios-bg-secondary;
  display: flex;
  flex-direction: column;
}

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
    &-disabled { background: $ios-text-tertiary; }
  }
}

.remark-action-text {
  font-size: 16px;
  &--cancel { color: $ios-text-primary; }
  &--done { color: #ffffff; font-weight: $ios-font-weight-medium; }
}

.remark-body {
  padding: $ios-spacing-md 0;
}

.remark-input-card {
  background: #ffffff;
  padding: $ios-spacing-md $ios-spacing-lg;
}

// ── 图片区（置顶）────────────────────────────────────────
.remark-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: $ios-spacing-md;
}

.remark-thumb-wrap {
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 10px;
  overflow: visible;
}

.remark-thumb {
  width: 90px;
  height: 90px;
  border-radius: 10px;
  display: block;
}

.remark-thumb-del {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.remark-thumb-del-icon {
  font-size: 16px;
  color: #ffffff;
  line-height: 1;
  margin-top: -1px;
}

// NOTE: 参考图1：大方块+图标+文字
.remark-add-btn {
  width: 90px;
  height: 90px;
  border-radius: 10px;
  background: $ios-bg-secondary;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;

  &:active { opacity: 0.6; }
}

.remark-add-camera-img {
  width: 32px;
  height: 32px;
}

.remark-add-label {
  font-size: 10px;
  color: $ios-text-tertiary;
  text-align: center;
}

// ── 文字输入区 ────────────────────────────────────────────
.remark-textarea {
  width: 100%;
  font-size: 16px;
  color: $ios-text-primary;
  min-height: 120px;
  line-height: 1.6;
}

.remark-count {
  font-size: 12px;
  color: $ios-text-tertiary;
  display: block;
  text-align: right;
  margin-top: $ios-spacing-xs;
}
</style>
