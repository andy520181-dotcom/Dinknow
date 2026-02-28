# 隐私协议弹窗配置说明

## ✅ 已完成功能

### 1. 自定义隐私协议弹窗
- ✅ 参考图2设计，创建了自定义隐私协议弹窗
- ✅ 包含勾选框，必须勾选才能点击"允许"
- ✅ 勾选框文本中包含"用户协议"和"隐私保护"两个可点击链接
- ✅ 用户勾选并同意后，才会调用位置API

### 2. 弹窗功能
- ✅ 显示位置授权说明
- ✅ 勾选框（必须勾选才能继续）
- ✅ "用户协议"链接（可点击跳转）
- ✅ "隐私保护指引"链接（可点击跳转）
- ✅ "拒绝"和"允许"按钮
- ✅ "允许"按钮在未勾选时禁用

### 3. 链接跳转
- ✅ 创建了webview页面用于显示协议链接
- ✅ 如果webview不可用，会复制链接到剪贴板
- ✅ 链接配置在 `src/constants.ts` 中，方便后续更新

---

## 🔧 如何更新协议链接

### 方法1：直接修改常量文件（推荐）

编辑 `src/constants.ts` 文件：

```typescript
/** 用户协议链接（占位，之后可替换） */
export const USER_AGREEMENT_URL = 'https://your-domain.com/user-agreement'

/** 隐私保护指引链接（占位，之后可替换） */
export const PRIVACY_POLICY_URL = 'https://your-domain.com/privacy-policy'
```

**将占位链接替换为实际的链接地址**，例如：

```typescript
export const USER_AGREEMENT_URL = 'https://www.dinknow.com/user-agreement'
export const PRIVACY_POLICY_URL = 'https://www.dinknow.com/privacy-policy'
```

### 方法2：使用小程序内页面

如果协议内容在小程序内，可以创建协议页面：

1. 创建 `src/pages/user-agreement/index.vue`
2. 创建 `src/pages/privacy-policy/index.vue`
3. 修改 `src/constants.ts`：

```typescript
export const USER_AGREEMENT_URL = '/pages/user-agreement/index'
export const PRIVACY_POLICY_URL = '/pages/privacy-policy/index'
```

---

## 📋 工作流程

### 用户首次打开小程序

1. **页面加载** → 检查是否已同意协议
2. **未同意** → 显示自定义隐私协议弹窗
3. **用户操作**：
   - 点击"用户协议"或"隐私保护指引"查看详情
   - 勾选"已阅读并接受《用户协议》和《隐私保护指引》"
   - 点击"允许"
4. **同意后** → 保存同意状态，调用位置API
5. **微信系统弹窗** → 弹出位置授权弹窗（用户授权位置）

### 用户再次打开小程序

- **已同意协议** → 直接调用位置API
- **不再显示自定义弹窗**

---

## 🎨 弹窗设计特点

### iOS风格设计
- ✅ 圆角设计（24px顶部圆角）
- ✅ 从底部滑入动画
- ✅ 半透明遮罩层
- ✅ iOS标准按钮样式
- ✅ 清晰的视觉层次

### 交互体验
- ✅ 必须勾选才能点击"允许"
- ✅ 链接可点击跳转
- ✅ 按钮禁用状态清晰
- ✅ 点击遮罩层不关闭（必须做出选择）

---

## 📁 相关文件

### 组件文件
- `src/components/PrivacyAgreementModal.vue` - 隐私协议弹窗组件

### 页面文件
- `src/pages/webview/index.vue` - WebView页面（用于显示协议链接）

### 配置文件
- `src/constants.ts` - 协议链接配置
- `src/utils/storage.ts` - 协议同意状态存储

### 使用位置
- `src/pages/index/index.vue` - 活动广场页面（使用弹窗组件）

---

## 🔍 代码说明

### 弹窗显示逻辑

在 `src/pages/index/index.vue` 中：

```typescript
// 初始化时检查是否已同意协议
onMounted(async () => {
  if (hasAgreedToTerms()) {
    // 已同意，直接请求位置
    requestLocationAndLoad()
  } else {
    // 未同意，显示隐私协议弹窗
    showPrivacyModal.value = true
  }
})
```

### 协议同意处理

```typescript
function handlePrivacyAgree() {
  setAgreedToTerms(true)  // 保存同意状态
  showPrivacyModal.value = false  // 关闭弹窗
  requestLocationAndLoad()  // 请求位置并加载活动
}
```

---

## ⚙️ 配置说明

### 协议链接配置位置

**文件**: `src/constants.ts`

```typescript
/** 用户协议链接（占位，之后可替换） */
export const USER_AGREEMENT_URL = 'https://your-domain.com/user-agreement'

/** 隐私保护指引链接（占位，之后可替换） */
export const PRIVACY_POLICY_URL = 'https://your-domain.com/privacy-policy'
```

### 更新链接步骤

1. **打开** `src/constants.ts`
2. **替换** `USER_AGREEMENT_URL` 和 `PRIVACY_POLICY_URL` 的值
3. **保存** 文件
4. **重新构建**：`npm run build:mp-weixin`
5. **测试** 链接跳转功能

---

## 🚀 测试步骤

### 1. 清除缓存测试

```bash
1. 在微信开发者工具中
2. 项目 → 清除缓存 → 清除全部缓存
3. 重新编译
4. 应该会显示隐私协议弹窗
```

### 2. 测试勾选功能

```bash
1. 打开小程序
2. 看到隐私协议弹窗
3. 尝试点击"允许"（应该被禁用）
4. 勾选协议复选框
5. "允许"按钮应该变为可用
```

### 3. 测试链接跳转

```bash
1. 点击"用户协议"链接
   - 如果配置了webview页面，应该跳转到webview
   - 如果没有，应该复制链接到剪贴板
2. 点击"隐私保护指引"链接
   - 同样应该跳转或复制链接
```

### 4. 真机测试

```bash
1. 删除小程序（清除缓存）
2. 重新扫码打开
3. 应该看到隐私协议弹窗
4. 勾选并同意后，应该弹出位置授权弹窗
```

---

## ⚠️ 注意事项

### 1. 链接格式

- **外部链接**：必须以 `https://` 开头
- **小程序内页面**：使用 `/pages/xxx/index` 格式
- **域名白名单**：外部链接需要在微信公众平台配置域名白名单

### 2. WebView限制

- 微信小程序中，webview只能打开已配置的业务域名
- 需要在微信公众平台后台配置业务域名
- 如果未配置，链接会复制到剪贴板

### 3. 协议状态存储

- 协议同意状态存储在本地（`uni.getStorageSync`）
- 用户删除小程序后，需要重新同意
- 如果需要服务端同步，需要额外实现

---

## 📝 后续更新

### 更新协议链接

1. 编辑 `src/constants.ts`
2. 替换链接地址
3. 重新构建项目
4. 测试链接跳转

### 修改弹窗样式

编辑 `src/components/PrivacyAgreementModal.vue` 中的样式部分。

### 修改弹窗文案

编辑 `src/components/PrivacyAgreementModal.vue` 中的模板部分。

---

## 🎉 完成！

**隐私协议弹窗已成功配置！**

✅ 自定义弹窗已创建
✅ 勾选框功能已实现
✅ 链接跳转功能已实现
✅ 协议链接配置已设置（占位链接）

**下一步**：
1. 提供实际的协议链接
2. 更新 `src/constants.ts` 中的链接地址
3. 重新构建并测试

---

## 📞 需要帮助？

如果遇到问题：
1. 检查链接格式是否正确
2. 确认域名是否在白名单中
3. 查看控制台错误信息
4. 参考微信小程序官方文档
