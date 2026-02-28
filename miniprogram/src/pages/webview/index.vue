<template>
  <view class="webview-page">
    <web-view :src="url"></web-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const url = ref('')

onLoad((options: any) => {
  if (options.url) {
    url.value = decodeURIComponent(options.url)
    // 设置页面标题
    if (options.title) {
      uni.setNavigationBarTitle({
        title: decodeURIComponent(options.title)
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.webview-page {
  width: 100%;
  height: 100vh;
}
</style>
