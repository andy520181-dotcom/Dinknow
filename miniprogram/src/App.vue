<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { initCloud } from './services/cloud'

onLaunch(() => {
  // 使用 setTimeout 延迟初始化云开发，避免真机栈溢出
  // 注意：微信小程序编译不支持动态 import()，必须使用同步 import
  setTimeout(() => {
    initCloud().catch((err: unknown) => {
      console.error('云开发初始化失败:', err)
    })
  }, 300)
})
</script>

<style lang="scss">
@import './uni.scss';

page {
  height: 100%;
  background-color: $ios-bg-secondary;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', 
    'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  font-size: $ios-font-size-md;
  color: $ios-text-primary;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* iOS风格通用按钮样式 */
button {
  font-family: inherit;
  font-size: $ios-font-size-md;
  border-radius: $ios-radius-sm;
  border: none;
  
  &::after {
    border: none;
  }
  
  &[disabled] {
    opacity: 0.5;
  }
}

/* iOS风格输入框 */
input, textarea {
  font-family: inherit;
  font-size: $ios-font-size-md;
  color: $ios-text-primary;
  
  &::placeholder {
    color: $ios-text-tertiary;
  }
}
</style>
