# Dinknow 小程序 — 匹克球活动预约平台

## 项目概述
基于微信小程序的匹克球活动预约平台，支持用户快速查找附近活动、发起新活动并查看个人参与记录。采用微信云开发（CloudBase/微信云开发）实现后端能力（云数据库、云存储、云函数），便于快速部署与迭代。

## 主要特性
- **活动广场**：DUPR水平筛选、下拉刷新、距离显示。iOS风格卡片设计，DUPR水平徽章。
- **发起活动**：表单支持活动主题、日期/时间、球场地址、DUPR要求、人数与费用设置。  
- **个人中心**：蓝色渐变头像区、标签页切换、编辑昵称/DUPR。查看我发起的 / 我参与的活动。  
- **iOS设计风格**：完整的iOS设计系统，包括配色、圆角、阴影、按钮样式、底部导航图标。
- **微信云开发**：云数据库、云函数、云存储，支持快速部署与迭代。

## 技术栈
- **框架**：uni-app 3.0 + Vue 3 + TypeScript
- **构建工具**：Vite 5.4
- **小程序**：微信小程序
- **后端**：微信云开发（云数据库、云存储、云函数）
- **UI风格**：iOS原生设计语言
- **未来扩展**：支持编译到 iOS App、Android App、H5

## 架构设计

### 多端架构支持
本项目采用 **uni-app 跨平台架构**，支持：
- ✅ 微信小程序（已实现）
- ✅ iOS App（未来，通过 uni-app 编译）
- ✅ Android App（未来，通过 uni-app 编译）
- ✅ H5网页（未来，通过 uni-app 编译）

### 核心架构特点
1. **API 抽象层**：统一 API 调用接口，小程序使用云函数，App 使用 HTTP API
2. **平台适配层**：统一存储、定位、图片等平台特定 API
3. **服务层分离**：业务逻辑与 UI 分离，便于复用和维护
4. **类型安全**：完整的 TypeScript 类型定义

详细架构说明请参考：[ARCHITECTURE_RECOMMENDATION.md](./ARCHITECTURE_RECOMMENDATION.md)

## 目录结构
```
src/
├── app.ts                    # App 入口
├── app.config.ts             # 小程序配置
├── types.ts                  # TypeScript 类型定义
├── constants.ts              # 常量定义
│
├── services/                 # 业务服务层（核心，100%复用）
│   ├── api/                  # API 抽象层
│   │   ├── index.ts          # 统一 API 入口
│   │   ├── weapp.ts          # 小程序实现（云函数）
│   │   └── http.ts           # App 实现（HTTP API）
│   ├── activity.ts           # 活动服务
│   ├── user.ts               # 用户服务
│   └── cloud.ts              # 云开发服务（小程序专用）
│
├── utils/                    # 工具函数层（90%复用）
│   ├── platform/             # 平台适配层
│   │   ├── storage.ts        # 存储适配
│   │   ├── location.ts       # 定位适配
│   │   └── image.ts          # 图片适配
│   ├── location.ts           # 位置工具
│   └── storage.ts            # 存储工具
│
├── components/               # UI 组件层（80%复用）
│   └── ActivityCard/         # 活动卡片组件
│
├── pages/                    # 页面层（70%复用）
│   ├── index/                # 活动广场
│   ├── create-activity/      # 发起活动
│   └── profile/              # 个人中心
│
└── config/                   # 配置文件
    └── api.config.ts         # API 配置

cloudfunctions/               # 云函数目录
├── createActivity/          # 创建活动
├── joinActivity/            # 加入活动
├── getActivities/           # 获取活动列表
└── getUserActivities/       # 获取用户活动

dist/                        # 构建产物（忽略在版本控制中）
```  

## 快速开始

> **⚡ 新手推荐**：查看 [QUICK_START.md](./QUICK_START.md) 快速入门指南（30分钟完成部署）

### 1. 环境准备
- Node.js >= 16
- 微信开发者工具（最新版）
- 已注册微信小程序（需要 AppID）
- Python 3（用于生成图标，可选）

### 2. 安装依赖
```bash
git clone <repo>
cd miniprogram
npm install
```

### 3. 配置微信云开发
1. 打开微信开发者工具，点击「云开发」
2. 创建云开发环境（记下环境 ID）
3. 更新 `src/constants.ts` 中的 `CLOUD_ENV` 为你的云环境 ID

### 4. 配置隐私保护指引（✅ 已完成）
1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 设置 → 服务内容声明 → 用户隐私保护指引
3. 勾选：`getLocation`、`chooseLocation`
4. 提交审核（通常几分钟内通过）

**状态：✅ 已配置并审核通过（2026-02-11）**

### 5. 本地开发
```bash
# 开发模式（微信小程序）
npm run dev:mp-weixin

# 生产构建
npm run build:mp-weixin
```

### 6. 在微信开发者工具中打开项目
1. 打开 `dist/build/mp-weixin` 目录
2. 点击「编译」运行项目
3. 首次运行会弹出位置授权弹窗（附带隐私协议勾选）

### 7. 生成底部导航图标（可选）
```bash
# 基于用户提供的SVG设计生成图标
python3 scripts/generate-tabbar-icons-from-svg.py
```

## 云端（数据库 / 云函数）示例
- 数据集合（collections）  
  - users: { _id, openid, nickName, avatarUrl, gender, duprLevel, createdAt }  
  - activities: { _id, title, startDate, startTime, address, latitude, longitude, maxParticipants, fee, hostId, createdAt, status }  
  - registrations: { _id, activityId, userId, joinedAt, status }

- 建议的云函数  
  - createActivity(data) — 表单验证并写入 activities 表  
  - joinActivity(activityId, userId) — 事务/并发检查并写入 registrations，更新参与人数  
  - getActivities(query) — 支持按地理位置、关键词与时间过滤  
  - getUserActivities(userId) — 获取我发起 / 我参与的活动

## 隐私保护与授权流程（✅ 已配置）

### 配置说明
项目已完整配置微信小程序隐私保护框架：
- ✅ `__usePrivacyCheck__: true` 已启用
- ✅ `requiredPrivateInfos: ["getLocation", "chooseLocation"]` 已声明
- ✅ 隐私保护指引已在公众平台后台审核通过

### 用户授权流程
**首次打开小程序**：
1. 页面加载后自动调用 `uni.getLocation()`
2. 微信弹出**位置授权弹窗**（附带隐私协议勾选框）
3. 用户勾选"已阅读并同意隐私保护指引"
4. 点击"允许"完成授权
5. **一个弹窗完成所有授权**（隐私协议 + 位置权限）

**再次打开小程序**：
- 不再弹窗，静默获取位置
- 自动加载附近活动

详细配置说明请参考：[PRIVACY_CONFIG_COMPLETED.md](./PRIVACY_CONFIG_COMPLETED.md)

## 📚 完整文档索引

> **📖 查看完整导航**：[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) - 15份文档详细说明与使用建议

### 🚀 部署与配置
- [快速入门指南](./QUICK_START.md) - ⚡ 30分钟完成部署（新手必读）
- [配置状态总览](./CONFIGURATION_STATUS.md) - 📊 当前配置进度与快速操作指南
- [配置完成总结](./CONFIGURATION_SUMMARY.md) - 📝 本次配置成果与下一步操作
- [完整部署指南](./DEPLOYMENT_GUIDE.md) - 🚀 从零到上线的完整步骤
- [数据库配置指南](./DATABASE_SETUP.md) - 📊 数据库集合创建与权限设置
- [云函数部署指南](./CLOUD_FUNCTIONS_GUIDE.md) - ☁️ 7个云函数详细说明与部署步骤

### 🔒 隐私保护
- [隐私配置完成确认](./PRIVACY_CONFIG_COMPLETED.md) - ✅ 隐私保护配置状态与测试指南
- [隐私配置变更日志](./PRIVACY_UPDATE_CHANGELOG.md) - 📝 代码变更记录
- [隐私配置指南](./PRIVACY_CONFIG_GUIDE.md) - 📖 微信公众平台后台配置步骤

### 🎨 UI/UX 设计
- [iOS设计系统](./IOS_DESIGN_SYSTEM.md) - 🎨 完整的iOS风格设计规范
- [底部导航图标](./TABBAR_ICONS.md) - 🖼️ 图标设计与生成说明
- [UI优化总结](./UI_OPTIMIZATION_SUMMARY.md) - ✨ UI优化详细记录

## 部署与发布
1. 在微信开发者工具中将云函数部署到云端（部署云函数与数据库规则）。  
2. 在「项目设置」中填写小程序相关信息（AppID、版本号等）。  
3. 提交代码审核并发布小程序。

## 常见问题与排查

### 1. 基础库下载失败
**错误**：`下载基础库版本 X.X.X 失败: aborted`

**解决方案**：
1. **临时方案**：使用已下载的任意基础库版本
   - 点击"详情" → "本地设置" → "调试基础库"
   - 选择任意已下载的版本（如 2.33.0）
2. **推荐方案**：使用真机预览
   - 点击工具栏的"预览"按钮
   - 使用微信扫码
   - 真机使用真实基础库，体验完整功能
3. **根本解决**：
   - 检查网络连接，确保能访问 `https://res.servicewechat.com/`
   - 微信开发者工具 → 设置 → 代理设置 → 不使用代理
   - 清理缓存：`~/Library/Application Support/微信开发者工具/WeappVendor/`
   - 重启开发者工具

### 2. UI 未更新（修改没生效）
**问题**：改了 `src/` 里的代码，但模拟器/真机仍显示旧界面。

**原因**：小程序运行的是**编译产物** `dist/build/mp-weixin/`，不是直接运行 `src/`。必须先生成新产物，再在开发者工具里重新编译。

**按顺序执行**：
1. **在项目根目录执行**：`npm run build:mp-weixin`（生成最新 `dist/build/mp-weixin`）
2. **微信开发者工具**：菜单 **工具 → 清除缓存 → 清除全部缓存**
3. **微信开发者工具**：点击 **「编译」** 重新编译并预览

**注意**：请用微信开发者工具打开**项目根目录**（包含 `project.config.json` 和 `src/` 的 `miniprogram` 目录），不要只打开 `dist/build/mp-weixin`。根目录下的 `project.config.json` 中 `miniprogramRoot` 指向 `dist/build/mp-weixin`，工具会自动使用该目录作为小程序代码。

### 3. 构建错误
**问题**：`npm run build:mp-weixin` 报错

**解决方案**：
```bash
# 删除依赖并重新安装
rm -rf node_modules package-lock.json
npm install

# 重新构建
npm run build:mp-weixin
```

### 4. 真机报错：云函数 reverseGeocode 调用失败 -501000（FUNCTION_NOT_FOUND）
**错误**：`errCode: -501000 | errMsg: FunctionName parameter could not be found`

**原因**：`reverseGeocode` 云函数未部署到当前云环境，真机/体验版调用时云端找不到该函数。

**解决方案**：
1. 在微信开发者工具中打开**项目根目录**（含 `project.config.json` 和 `cloudfunctions` 的目录）。
2. 在左侧文件树找到 **cloudfunctions → reverseGeocode**。
3. **右键 reverseGeocode** → 选择 **「上传并部署：云端安装依赖」**。
4. 等待部署完成（云开发 → 云函数 中可看到 reverseGeocode 已部署）。
5. 真机或体验版再次打开小程序，广场页即可正常显示定位城市/地址。

可选：若需显示详细地址（而不仅是“已定位”），请在云开发控制台为云函数配置环境变量 `TENCENT_MAP_KEY`（腾讯地图 Key，[申请地址](https://lbs.qq.com/console/mykey.html)）。详见 [云函数部署指南](./CLOUD_FUNCTIONS_GUIDE.md)。

### 5. 广场左上角只显示「已定位」不显示城市/详细地址
**原因**：云函数 `reverseGeocode` 需要腾讯地图 Web 服务 Key 才能把经纬度转成地址。未配置时云函数返回空，前端只能显示「已定位」或坐标。

**解决（显示用户实时位置名称）**：
1. 打开 [腾讯位置服务](https://lbs.qq.com/console/mykey.html) 申请 **WebService** 类型 Key。
2. 微信开发者工具 → **云开发** → 进入当前环境 → **云函数** → 找到 **reverseGeocode** → **配置** → **环境变量**。
3. 新增环境变量：键 `TENCENT_MAP_KEY`，值填上述 Key → 保存。
4. 再次 **右键 reverseGeocode** → **上传并部署：云端安装依赖**（使环境变量生效）。
5. 清除小程序缓存或重新进入广场页，左上角会显示城市或详细地址。

未配置 Key 时，左上角会显示坐标（如 `22.28, 114.15`）作为备用，配置后即显示城市名/地址。

### 6. 活动发布失败
**现象**：点击「发布活动」后提示「发布失败」或其它错误文案。

**排查步骤（按顺序检查）**：

1. **查看控制台日志**：
   - 微信开发者工具 → **调试器** → **Console** 标签
   - 重新点击「发布活动」，查看是否有 `[发布活动]` 或 `[createActivity]` 开头的日志
   - 记录日志中的错误码（如 `-502001`、`-504011`）和错误信息

2. **检查云函数部署**：
   - 微信开发者工具 → 左侧文件树 → `cloudfunctions` → `createActivity`
   - **右键 createActivity** → 选择「上传并部署：云端安装依赖」
   - 等待部署完成（状态显示「部署成功」）

3. **检查数据库集合**：
   - 云开发控制台 → **数据库** → 查看是否有 **activities** 集合
   - 如果没有，点击「新建集合」→ 输入 `activities` → 创建

4. **检查数据库权限**（重要）：
   - 云开发控制台 → **数据库** → **activities** → **权限设置**
   - 推荐设置：
     - **读取权限**：`所有用户可读`
     - **写入权限**：`所有用户可写`（创建时）或 `仅创建者可写`（需确保权限表达式正确）
   - 如果使用「仅创建者可写」，权限表达式应为：
     ```javascript
     {
       "read": true,
       "write": "auth != null"  // 允许所有登录用户创建
     }
     ```
   - 如果权限过严（如 `doc.hostId == auth.openid`），创建新文档时会失败（因为创建时 doc 还没有 hostId）

5. **检查登录状态**：
   - 云函数依赖 `openid`，确保小程序已调用登录接口
   - 检查是否有登录相关的云函数（如 `login`）已部署并调用

6. **查看云函数日志**：
   - 云开发控制台 → **云函数** → **createActivity** → **日志**
   - 查看最近一次调用的日志，查看是否有错误信息

**常见错误码**：
- `-502001`：数据库请求失败（集合不存在或权限不足）
- `-502005`：数据库集合不存在（环境配置错误或集合未创建）
- `-504011`：云函数执行错误（函数未部署或代码错误）
- `未登录`：openid 为空（需要先登录）

**特别注意**：
- 错误码 `-502005` 通常表示 `activities` 集合不存在，或云函数环境配置错误
- 发起活动页会在进入时和提交前自动调用登录，确保 openid 可用
- 如果仍出现 `-502005`，请检查：
  1. 云开发控制台 → 数据库 → 确认 `activities` 集合已创建
  2. 云开发控制台 → 设置 → 确认环境 ID 与代码中 `CLOUD_ENV` 一致
  3. 云函数 `createActivity` 是否已部署到正确的环境

发布失败时，当前版本会在 Toast 中显示具体错误信息（含错误码），并在控制台输出详细日志，便于对照上述项排查。

## 后续扩展建议

### 功能扩展
- 活动地图视图：基于坐标显示附近活动热力/聚集分布。  
- 支付与订单：支持活动付费、退款与发票。  
- 社交与评论：活动评论、用户私信与活动评价。  
- 通知与推送：活动开始提醒、报名成功/失败通知（可使用订阅消息）。

### 多端扩展
- **iOS App**：使用 `npm run build:rn` 编译到 React Native，复用 90%+ 代码
- **Android App**：同样使用 React Native，一套代码双端运行
- **后端迁移**：将云函数逻辑迁移到独立后端，提供 RESTful API

详细的多端架构方案请参考：[ARCHITECTURE_RECOMMENDATION.md](./ARCHITECTURE_RECOMMENDATION.md)

## 联系方式
如需我继续帮你：我可以协助清理无用文件、检查构建问题、或帮你部署云函数。请告诉我你要我做的下一步。

