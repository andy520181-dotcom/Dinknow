# 顶部栏功能实现说明

> 更新时间：2026-02-11

---

## ✅ 已完成功能

### 1. 顶部栏设计（参考图1）

**布局**：
- ✅ 浅蓝色渐变背景（#4A90E2 → #5BA3F5）
- ✅ 左侧：城市选择器（显示当前城市 + 下拉箭头）
- ✅ 右侧：搜索框（搜索图标 + 占位文本 + 分隔线 + 扫描图标）

**样式特点**：
- ✅ iOS风格设计
- ✅ 白色搜索框，圆角设计
- ✅ 清晰的视觉层次

### 2. 实时定位显示

**功能**：
- ✅ 显示当前城市名称（如"萍乡"）
- ✅ 如果未获取到位置，显示"定位中"
- ✅ 点击城市选择器可切换城市

**数据来源**：
- 优先使用用户选择的城市
- 其次使用位置API获取的城市
- 最后使用默认值"定位中"

### 3. 城市选择功能（参考图2）

**页面功能**：
- ✅ 返回按钮（左上角）
- ✅ 搜索框（搜索城市/地区）
- ✅ 当前城市标签（蓝色标签，可点击）
- ✅ 城市列表（按字母分组）
- ✅ 字母索引（右侧快速导航）

**交互功能**：
- ✅ 点击城市 → 返回首页并更新城市显示
- ✅ 搜索城市 → 实时过滤城市列表
- ✅ 点击字母索引 → 快速跳转到对应字母

---

## 📁 创建的文件

### 1. 城市选择页面
**文件**: `src/pages/city-select/index.vue`

**功能**：
- 显示城市列表（按字母分组）
- 支持搜索城市
- 支持选择城市并返回

### 2. 更新的文件

**`src/pages/index/index.vue`**：
- 添加顶部栏（城市选择器 + 搜索框）
- 添加城市选择逻辑
- 添加搜索框点击处理

**`src/pages.json`**：
- 添加城市选择页面配置

**`src/types.ts`**：
- 更新 `LocationInfo` 接口，添加 `city` 字段

**`src/utils/location.ts`**：
- 更新位置获取函数，支持获取城市名称

---

## 🎨 设计细节

### 顶部栏样式

```scss
.header {
  background: linear-gradient(135deg, #4A90E2 0%, #5BA3F5 100%);
  padding: 12px 16px;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}
```

### 城市选择器

```scss
.city-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #fff;
}

.city-name {
  font-size: 16px;
  font-weight: medium;
  color: #fff;
}

.dropdown-icon {
  font-size: 10px;
  color: #fff;
  opacity: 0.8;
}
```

### 搜索框

```scss
.search-box {
  flex: 1;
  background: #fff;
  border-radius: 20px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
```

---

## 🔧 功能实现

### 1. 城市选择流程

```typescript
// 点击城市选择器
function handleCitySelect() {
  uni.navigateTo({
    url: `/pages/city-select/index?currentCity=${encodeURIComponent(currentCity.value)}`
  })
}

// 在城市选择页面选择城市
function handleSelectCity(city: string) {
  uni.setStorageSync('selected_city', city)
  uni.navigateBack()
}

// 首页监听城市选择
onShow(() => {
  const selectedCity = uni.getStorageSync('selected_city')
  if (selectedCity) {
    currentCity.value = selectedCity
    uni.removeStorageSync('selected_city')
    loadActivities() // 重新加载活动
  }
})
```

### 2. 搜索功能

**当前实现**：
- 搜索框显示占位文本
- 点击搜索框显示提示（功能开发中）

**后续扩展**：
- 可以实现搜索页面
- 支持搜索活动、场地等

---

## 📋 城市列表

### 包含的城市

已包含中国主要城市（300+个），按拼音首字母分组：
- A-Z 26个字母组
- 每个字母组包含多个城市
- 支持搜索功能

### 城市数据来源

当前使用硬编码的城市列表，后续可以：
- 从服务器获取城市列表
- 支持更多城市
- 支持热门城市推荐

---

## 🚀 使用流程

### 用户操作流程

1. **查看当前城市**
   - 顶部栏左侧显示当前城市（如"萍乡"）
   - 如果未定位，显示"定位中"

2. **切换城市**
   - 点击城市选择器
   - 弹出城市选择页面
   - 搜索或浏览选择城市
   - 点击城市返回首页
   - 首页更新城市显示

3. **搜索功能**
   - 点击搜索框（当前显示提示）
   - 后续可以实现搜索页面

---

## 🔄 数据流

### 城市数据流

```
用户选择城市
  ↓
保存到 uni.setStorageSync('selected_city', city)
  ↓
返回首页
  ↓
onShow 监听 → 读取 selected_city
  ↓
更新 currentCity.value
  ↓
重新加载活动列表（根据新城市）
```

---

## 📝 后续优化

### 1. 获取真实城市名称

当前城市名称获取：
- ✅ 支持从位置API获取（需要逆地理编码）
- ✅ 支持用户手动选择
- ⏭️ 可以集成腾讯地图API获取城市名称

### 2. 搜索功能

当前搜索框：
- ✅ UI已完成
- ⏭️ 搜索功能待实现
- ⏭️ 可以搜索活动、场地等

### 3. 城市数据

当前城市列表：
- ✅ 硬编码300+城市
- ⏭️ 可以从服务器获取
- ⏭️ 支持热门城市推荐
- ⏭️ 支持定位城市自动置顶

---

## 🎯 测试步骤

### 1. 测试城市选择

```bash
1. 打开小程序
2. 点击顶部栏左侧的城市名称
3. 应该弹出城市选择页面
4. 搜索或浏览选择城市
5. 点击城市返回首页
6. 首页应该更新城市显示
```

### 2. 测试搜索框

```bash
1. 点击顶部栏右侧的搜索框
2. 应该显示提示（功能开发中）
```

### 3. 测试样式

```bash
1. 查看顶部栏样式
2. 应该看到浅蓝色渐变背景
3. 城市选择器在左侧（白色文字）
4. 搜索框在右侧（白色背景）
```

---

## 📊 文件结构

```
src/
├── pages/
│   ├── index/
│   │   └── index.vue          # 活动广场（已更新顶部栏）
│   └── city-select/
│       └── index.vue          # 城市选择页面（新建）
├── types.ts                   # 类型定义（已更新）
└── utils/
    └── location.ts            # 位置工具（已更新）
```

---

## 🎉 完成！

**顶部栏功能已成功实现！**

✅ 实时定位显示（城市名称）
✅ 城市选择功能（点击切换城市）
✅ 搜索框UI（待实现搜索功能）
✅ 城市选择页面（搜索、浏览、选择）

**请测试一下效果，应该可以看到新的顶部栏设计！**
