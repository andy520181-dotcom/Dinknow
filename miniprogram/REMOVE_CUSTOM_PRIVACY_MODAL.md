# 移除自定义隐私协议弹窗

> 更新时间：2026-02-11

---

## ✅ 已完成的变更

### 移除自定义弹窗，使用微信系统弹窗

根据用户需求，已移除自定义隐私协议弹窗，现在只使用微信系统的位置授权弹窗（自动附带隐私协议勾选）。

---

## 🔧 代码变更

### 1. 移除组件引用

**文件**: `src/pages/index/index.vue`

**变更前**:
```vue
<template>
  <PrivacyAgreementModal
    :show="showPrivacyModal"
    @agree="handlePrivacyAgree"
    @reject="handlePrivacyReject"
  />
  <!-- ... -->
</template>

<script setup lang="ts">
import PrivacyAgreementModal from '../../components/PrivacyAgreementModal.vue'
import { hasAgreedToTerms, setAgreedToTerms } from '../../utils/storage'

const showPrivacyModal = ref(false)
// ...
</script>
```

**变更后**:
```vue
<template>
  <!-- 直接显示页面内容，不再有自定义弹窗 -->
  <!-- ... -->
</template>

<script setup lang="ts">
// 移除了 PrivacyAgreementModal 的导入
// 移除了隐私协议相关的状态和函数
// ...
</script>
```

### 2. 简化初始化逻辑

**变更前**:
```typescript
onMounted(async () => {
  if (hasAgreedToTerms()) {
    setTimeout(() => {
      requestLocationAndLoad()
    }, 800)
  } else {
    setTimeout(() => {
      showPrivacyModal.value = true
    }, 500)
  }
})
```

**变更后**:
```typescript
onMounted(async () => {
  // 直接请求位置，微信系统会自动弹出位置授权弹窗
  // 基础库 >= 3.4.2 会自动附带隐私协议勾选
  setTimeout(() => {
    requestLocationAndLoad()
  }, 500)
})
```

### 3. 移除相关函数

已移除以下函数：
- `handlePrivacyAgree()` - 处理隐私协议同意
- `handlePrivacyReject()` - 处理隐私协议拒绝

### 4. 移除相关状态

已移除以下状态：
- `showPrivacyModal` - 控制弹窗显示

### 5. 移除相关导入

已移除以下导入：
- `PrivacyAgreementModal` 组件
- `hasAgreedToTerms` 函数
- `setAgreedToTerms` 函数

---

## 📋 当前授权流程

### 用户首次打开小程序

1. **页面加载** → 自动调用 `uni.getLocation()`
2. **微信系统弹出位置授权弹窗**
   - 弹窗上**自动附带隐私协议勾选框**（基础库 >= 3.4.2）
   - 用户可以点击查看完整隐私保护指引
3. **用户操作**：
   - 勾选"已阅读并同意隐私保护指引"
   - 点击"允许"授权位置
4. **完成**：一个弹窗完成所有授权

### 用户再次打开小程序

- **已授权位置**：不再弹窗，静默获取位置
- **未授权位置**：再次弹出位置授权弹窗

---

## ⚙️ 配置要求

### 必须满足的条件

1. **基础库版本 >= 3.4.2**
   - 在微信开发者工具中：详情 → 本地设置 → 调试基础库 → 选择 3.4.2 或更高版本

2. **微信公众平台后台配置**
   - ✅ 隐私保护指引已配置并审核通过
   - ✅ `__usePrivacyCheck__: true` 已配置
   - ✅ `requiredPrivateInfos: ["getLocation", "chooseLocation"]` 已声明

3. **代码配置**
   - ✅ `pages.json`: `__usePrivacyCheck__: true`
   - ✅ `manifest.json`: `__usePrivacyCheck__: true` 和 `requiredPrivateInfos`

---

## 🎯 优势

### 使用微信系统弹窗的优势

1. ✅ **一个弹窗完成所有授权**
   - 隐私协议勾选 + 位置授权
   - 用户体验更流畅

2. ✅ **符合微信规范**
   - 使用微信官方提供的隐私保护框架
   - 自动适配不同基础库版本

3. ✅ **代码更简洁**
   - 不需要维护自定义弹窗组件
   - 减少代码复杂度

4. ✅ **自动更新**
   - 微信系统会自动处理隐私协议更新
   - 无需手动维护

---

## 📝 保留的文件

以下文件已保留，但不再使用：

- `src/components/PrivacyAgreementModal.vue` - 自定义隐私协议弹窗组件（保留，以备将来需要）
- `src/pages/webview/index.vue` - WebView页面（保留，可能用于其他用途）
- `src/utils/storage.ts` - 存储工具（保留，可能用于其他用途）
- `src/constants.ts` - 常量配置（保留协议链接配置，以备将来需要）

---

## 🚀 测试步骤

### 1. 清除缓存

```bash
项目 → 清除缓存 → 清除全部缓存
```

### 2. 检查基础库版本

```bash
详情 → 本地设置 → 调试基础库 → 选择 3.4.2 或更高版本
```

### 3. 重新编译

```bash
点击"编译"按钮
```

### 4. 测试授权流程

```bash
1. 打开小程序
2. 应该只看到一个位置授权弹窗
3. 弹窗上应该有"已阅读并同意隐私保护指引"勾选框
4. 勾选并点击"允许"完成授权
```

### 5. 真机测试

```bash
1. 删除小程序（清除缓存）
2. 重新扫码打开
3. 应该只看到一个位置授权弹窗
4. 弹窗附带隐私协议勾选
```

---

## ⚠️ 注意事项

### 基础库版本要求

- **必须 >= 3.4.2** 才能自动附带隐私协议勾选
- 如果基础库版本过低，可能不会显示隐私协议勾选框
- 建议使用最新版本的基础库

### 隐私保护指引配置

- 必须在微信公众平台后台配置隐私保护指引
- 必须审核通过才能生效
- 配置后立即生效，无需重新发布小程序

### 弹窗内容

- 弹窗标题和内容由微信系统控制
- 隐私保护指引内容来自后台配置
- 无法自定义弹窗样式和文案

---

## 📊 对比

### 变更前（自定义弹窗）

- ❌ 两个弹窗：自定义弹窗 + 系统弹窗
- ❌ 需要维护自定义组件
- ❌ 代码复杂度较高
- ✅ 可以自定义弹窗内容和样式

### 变更后（系统弹窗）

- ✅ 一个弹窗：系统位置授权弹窗（附带隐私协议勾选）
- ✅ 代码更简洁
- ✅ 符合微信规范
- ✅ 自动适配不同版本
- ⚠️ 无法自定义弹窗样式

---

## 🎉 完成！

**自定义隐私协议弹窗已移除，现在只使用微信系统的位置授权弹窗！**

✅ 代码已简化
✅ 项目已重新构建
✅ 授权流程更流畅

**请测试一下效果，应该只看到一个位置授权弹窗（附带隐私协议勾选）！**
