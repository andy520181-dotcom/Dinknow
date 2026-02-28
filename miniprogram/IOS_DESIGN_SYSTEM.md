# iOS风格设计系统

## 🎨 设计理念

采用**iOS原生设计语言**，打造简洁、现代、高级感的用户界面。

---

## 📐 核心设计元素

### 1. 颜色系统

#### 主色调
- **iOS蓝** (`#007AFF`) - 主要按钮、链接、强调元素
- **iOS蓝深色** (`#0051D5`) - 按钮按下状态

#### 功能色
- **成功绿** (`#34C759`) - 成功状态、确认操作
- **警告红** (`#FF3B30`) - 警告、删除操作
- **强调橙** (`#FF9500`) - 费用、重要信息

#### 背景色
- **主背景** (`#FFFFFF`) - 卡片、主要内容区域
- **次背景** (`#F2F2F7`) - 页面背景
- **三级背景** (`#E5E5EA`) - 输入框、次要元素

#### 文字颜色
- **主文字** (`#000000`) - 标题、重要内容
- **次要文字** (`#3C3C43`) - 正文、描述
- **三级文字** (`#8E8E93`) - 占位符、辅助信息
- **禁用文字** (`#C7C7CC`) - 禁用状态

---

### 2. 字体系统

#### 字体族
```
-apple-system, BlinkMacSystemFont, 'PingFang SC', 
'Helvetica Neue', 'Hiragino Sans GB', 'Microsoft YaHei', 
'微软雅黑', Arial, sans-serif
```

#### 字体大小（iOS标准）
- **超大标题**: 28px (`$ios-font-size-xxl`)
- **大标题**: 20px (`$ios-font-size-xl`)
- **标题**: 17px (`$ios-font-size-lg`)
- **正文**: 15px (`$ios-font-size-md`)
- **小字**: 13px (`$ios-font-size-sm`)
- **极小字**: 11px (`$ios-font-size-xs`)

#### 字重
- **Regular**: 400 - 正文
- **Medium**: 500 - 次要标题
- **Semibold**: 600 - 主要标题
- **Bold**: 700 - 强调文字

---

### 3. 圆角系统

- **小圆角**: 8px (`$ios-radius-sm`) - 按钮、标签
- **中圆角**: 12px (`$ios-radius-md`) - 输入框、选择器
- **大圆角**: 16px (`$ios-radius-lg`) - 卡片、主要容器
- **圆形**: 50% - 头像、图标

---

### 4. 阴影系统

- **小阴影**: `0 1px 3px rgba(0, 0, 0, 0.06)` - 轻微提升
- **中阴影**: `0 2px 8px rgba(0, 0, 0, 0.08)` - 卡片、按钮
- **大阴影**: `0 4px 16px rgba(0, 0, 0, 0.12)` - 模态框、重要元素

---

### 5. 间距系统

- **极小**: 4px (`$ios-spacing-xs`)
- **小**: 8px (`$ios-spacing-sm`)
- **中**: 12px (`$ios-spacing-md`)
- **大**: 16px (`$ios-spacing-lg`)
- **超大**: 20px (`$ios-spacing-xl`)
- **特大**: 24px (`$ios-spacing-xxl`)

---

## 🎯 组件设计规范

### 按钮

#### 主按钮（Primary Button）
- **高度**: 44-50px（iOS标准触摸目标）
- **背景**: iOS蓝 (`$ios-blue`)
- **圆角**: 10px (`$ios-radius-sm`)
- **阴影**: `0 4px 12px rgba($ios-blue, 0.4)`
- **按下效果**: 背景变深 + 轻微缩放 (`scale(0.98)`)

#### 次要按钮（Secondary Button）
- **背景**: 浅灰 (`$ios-bg-tertiary`)
- **文字**: 次要文字色
- **按下效果**: 背景变深

---

### 输入框

- **高度**: 44px（iOS标准）
- **背景**: 三级背景 (`$ios-bg-tertiary`)
- **圆角**: 12px (`$ios-radius-md`)
- **内边距**: 12px 16px
- **聚焦效果**: 背景变白 + 蓝色边框 (`box-shadow: 0 0 0 2px rgba($ios-blue, 0.2)`)

---

### 卡片

- **背景**: 白色 (`$ios-bg-primary`)
- **圆角**: 16px (`$ios-radius-lg`)
- **内边距**: 16-20px
- **阴影**: 中阴影 (`$ios-shadow-md`)
- **按下效果**: 轻微缩放 (`scale(0.99)`)

---

### 标签页（Tabs）

- **背景**: 三级背景 (`$ios-bg-tertiary`)
- **圆角**: 12px (`$ios-radius-md`)
- **内边距**: 4px
- **激活状态**: 白色背景 + 蓝色文字 + 阴影

---

## ✨ 交互细节

### 1. 触摸反馈

所有可交互元素都有**按下状态**：
- **按钮**: 背景变深 + 缩放 (`scale(0.98)`)
- **卡片**: 轻微缩放 (`scale(0.99)`)
- **输入框**: 背景变亮
- **标签**: 缩放 (`scale(0.96)`)

### 2. 过渡动画

所有状态变化使用 `transition: all 0.2s ease`，确保流畅自然的交互体验。

### 3. 视觉层次

- **主要操作**: iOS蓝 + 阴影
- **次要操作**: 浅灰背景
- **信息展示**: 白色卡片 + 阴影
- **禁用状态**: 降低透明度 (`opacity: 0.6`)

---

## 📱 页面设计

### 首页（活动广场）

- **顶部搜索栏**: 白色背景 + 阴影
- **位置标签**: iOS蓝半透明背景 + 蓝色文字
- **活动卡片**: 白色卡片 + 中阴影，间距16px
- **空状态**: 居中显示，三级文字色

### 创建活动页

- **表单卡片**: 白色背景 + 大圆角 + 阴影
- **输入框**: 统一高度44px，聚焦有蓝色边框
- **费用选择**: 标签式切换，激活状态为iOS蓝
- **提交按钮**: 固定在底部，iOS蓝 + 大阴影

### 个人中心页

- **头像**: 88px圆形，带阴影和边框
- **表单**: 与创建页一致
- **标签页**: iOS风格标签切换
- **活动列表**: 列表项有按下反馈

---

## 🎨 设计原则

1. **简洁至上** - 去除不必要的装饰，专注于内容
2. **一致性** - 所有页面使用统一的设计语言
3. **可访问性** - 44px最小触摸目标，清晰的对比度
4. **流畅性** - 所有交互都有平滑的过渡动画
5. **层次感** - 通过阴影、颜色、间距建立清晰的视觉层次

---

## 📝 使用指南

### 在组件中使用

```scss
<style lang="scss" scoped>
@import '../../uni.scss';

.my-component {
  background: $ios-bg-primary;
  border-radius: $ios-radius-lg;
  padding: $ios-spacing-lg;
  box-shadow: $ios-shadow-md;
  
  .title {
    font-size: $ios-font-size-lg;
    font-weight: $ios-font-weight-semibold;
    color: $ios-text-primary;
  }
  
  .button {
    background: $ios-blue;
    color: #fff;
    border-radius: $ios-radius-sm;
    height: 44px;
    box-shadow: 0 4px 12px rgba($ios-blue, 0.4);
    
    &:active {
      background: $ios-blue-dark;
      transform: scale(0.98);
    }
  }
}
</style>
```

---

## 🔄 更新日志

### v1.0.0 (2026-02-10)
- ✅ 建立iOS风格设计系统
- ✅ 优化所有页面UI
- ✅ 统一颜色、字体、间距、圆角系统
- ✅ 添加触摸反馈和过渡动画

---

**设计系统已全面应用到所有页面，请刷新查看效果！** 🎉
