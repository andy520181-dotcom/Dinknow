# 云函数部署指南

## 📦 云函数列表

项目包含 **8 个**云函数，涵盖用户管理、活动管理、定位逆地理等核心功能：

| 云函数名 | 功能说明 | 调用频率 | 优先级 |
|----------|----------|----------|--------|
| login | 用户登录，获取openid | 高 | ⭐⭐⭐ |
| getProfile | 获取用户信息 | 中 | ⭐⭐⭐ |
| updateProfile | 更新用户信息 | 中 | ⭐⭐⭐ |
| getActivities | 获取活动列表 | 高 | ⭐⭐⭐ |
| createActivity | 创建活动 | 中 | ⭐⭐⭐ |
| joinActivity | 加入活动 | 中 | ⭐⭐⭐ |
| getUserActivities | 获取用户活动 | 中 | ⭐⭐ |
| **reverseGeocode** | **根据经纬度逆地理编码（广场页显示城市/地址）** | **高** | **⭐⭐⭐** |

---

## 🚀 快速部署

### 方法1：通过微信开发者工具部署（推荐）

#### 步骤1：打开项目
```bash
微信开发者工具 → 打开项目根目录
（不是 dist/build/mp-weixin 目录）
```

#### 步骤2：找到云函数目录
```bash
项目目录 → cloudfunctions 文件夹
应该看到 8 个子文件夹：
- createActivity/
- getActivities/
- getProfile/
- getUserActivities/
- joinActivity/
- login/
- reverseGeocode/   ← 广场页定位显示地址必须部署
- updateProfile/
```

#### 步骤3：逐个上传云函数
```bash
右键云函数文件夹 → 上传并部署：云端安装依赖

⚠️ 注意：必须选择"云端安装依赖"！
这样会自动安装 wx-server-sdk 等依赖包

建议按以下顺序部署：
1. ✅ login（用户登录，最高优先级）
2. ✅ getProfile（获取用户信息）
3. ✅ updateProfile（更新用户信息）
4. ✅ getActivities（获取活动列表）
5. ✅ **reverseGeocode**（逆地理编码，广场页显示城市/地址，未部署会报 -501000）
6. ✅ createActivity（创建活动）
7. ✅ joinActivity（加入活动）
8. ✅ getUserActivities（获取用户活动）
```

#### 步骤4：验证部署状态
```bash
云开发 → 云函数 → 函数列表

检查每个云函数：
- ✅ 状态：已部署
- ✅ 运行环境：Node.js 16
- ✅ 内存：256MB
- ✅ 超时时间：20秒
```

---

### 方法2：通过云控制台部署

#### 步骤1：登录云控制台
```bash
https://console.cloud.tencent.com/tcb
选择环境：cloudbase-0ga8ufoqa6c40d9d
```

#### 步骤2：创建云函数
```bash
云函数 → 新建云函数

配置：
- 函数名称：login（依次创建7个）
- 运行环境：Node.js 16
- 内存：256MB
- 超时时间：20秒
```

#### 步骤3：上传代码
```bash
函数代码 → 上传代码包

将对应的云函数文件夹打包为 zip：
1. 进入 cloudfunctions/login 目录
2. 选中 index.js 和 package.json
3. 压缩为 login.zip
4. 上传到云控制台

⚠️ 注意：
- 不要包含文件夹本身，只包含文件
- 确保 package.json 在 zip 根目录
```

---

## 📝 云函数详细说明

### 1. login - 用户登录

**功能**：获取用户 openid、appid、unionid

**输入参数**：无

**返回数据**：
```json
{
  "success": true,
  "openid": "oABC123456789",
  "appid": "wx89847d0b2ac95357",
  "unionid": "unionid_xxx",
  "envVersion": "develop"
}
```

**调用示例**：
```typescript
const res = await wx.cloud.callFunction({ name: 'login' })
console.log('openid:', res.result.openid)
```

**依赖**：
```json
{
  "wx-server-sdk": "~3.0.0"
}
```

---

### 2. getProfile - 获取用户信息

**功能**：根据 openid 获取用户完整信息

**输入参数**：无（自动从上下文获取 openid）

**返回数据**：
```json
{
  "success": true,
  "data": {
    "_id": "user123",
    "openid": "oABC123456789",
    "nickName": "张三",
    "avatarUrl": "cloud://xxx.png",
    "gender": 1,
    "duprLevel": "3.5",
    "createdAt": 1707609600000,
    "updatedAt": 1707609600000
  }
}
```

**调用示例**：
```typescript
const res = await wx.cloud.callFunction({ name: 'getProfile' })
console.log('用户信息:', res.result.data)
```

**数据库操作**：
```javascript
db.collection('users').where({ openid }).get()
```

---

### 3. updateProfile - 更新用户信息

**功能**：更新用户昵称、头像、性别、DUPR等信息

**输入参数**：
```json
{
  "nickName": "新昵称",
  "avatarUrl": "cloud://new-avatar.png",
  "gender": 1,
  "duprLevel": "4.0"
}
```

**返回数据**：
```json
{
  "success": true,
  "message": "更新成功"
}
```

**调用示例**：
```typescript
const res = await wx.cloud.callFunction({
  name: 'updateProfile',
  data: {
    nickName: '新昵称',
    duprLevel: '4.0'
  }
})
```

**数据库操作**：
```javascript
db.collection('users').where({ openid }).update({
  data: {
    nickName,
    avatarUrl,
    gender,
    duprLevel,
    updatedAt: Date.now()
  }
})
```

---

### 4. getActivities - 获取活动列表

**功能**：获取活动列表，支持关键词搜索、按距离排序

**输入参数**：
```json
{
  "keyword": "友谊赛",
  "latitude": 39.9042,
  "longitude": 116.4074
}
```

**返回数据**：
```json
{
  "list": [
    {
      "_id": "activity123",
      "title": "周末友谊赛",
      "startDate": "2026-02-15",
      "startTime": "14:00",
      "address": "朝阳体育馆",
      "maxParticipants": 8,
      "fee": 50,
      "duprLevel": "3.0-4.0",
      "hostName": "张三",
      "currentCount": 3,
      "createdAt": 1707609600000
    }
  ]
}
```

**调用示例**：
```typescript
const res = await wx.cloud.callFunction({
  name: 'getActivities',
  data: {
    keyword: '友谊赛',
    latitude: 39.9042,
    longitude: 116.4074
  }
})
```

**数据库操作**：
```javascript
// 1. 查询活动列表
db.collection('activities').where({ 
  title: db.RegExp({ regexp: keyword, options: 'i' }) 
}).orderBy('createdAt', 'desc').limit(100).get()

// 2. 统计每个活动的报名人数
db.collection('registrations').where({ 
  activityId: a._id, 
  status: 'joined' 
}).count()
```

---

### 5. createActivity - 创建活动

**功能**：创建新的活动

**输入参数**：
```json
{
  "title": "周末友谊赛",
  "startDate": "2026-02-15",
  "startTime": "14:00",
  "address": "朝阳体育馆",
  "latitude": 39.9042,
  "longitude": 116.4074,
  "maxParticipants": 8,
  "fee": 50,
  "description": "欢迎新手",
  "duprLevel": "3.0-4.0"
}
```

**返回数据**：
```json
{
  "success": true,
  "_id": "activity123456"
}
```

**调用示例**：
```typescript
const res = await wx.cloud.callFunction({
  name: 'createActivity',
  data: {
    title: '周末友谊赛',
    startDate: '2026-02-15',
    startTime: '14:00',
    address: '朝阳体育馆',
    maxParticipants: 8,
    fee: 50
  }
})
```

**数据库操作**：
```javascript
// 1. 查询用户信息
db.collection('users').where({ openid }).get()

// 2. 创建活动
db.collection('activities').add({
  data: {
    title,
    startDate,
    startTime,
    address,
    latitude,
    longitude,
    maxParticipants,
    fee,
    hostId: openid,
    hostName,
    hostAvatar,
    status: 'pending',
    createdAt: Date.now()
  }
})
```

---

### 6. joinActivity - 加入活动

**功能**：用户加入活动，创建报名记录

**输入参数**：
```json
{
  "activityId": "activity123456"
}
```

**返回数据**：
```json
{
  "success": true,
  "message": "加入成功"
}
```

**调用示例**：
```typescript
const res = await wx.cloud.callFunction({
  name: 'joinActivity',
  data: {
    activityId: 'activity123456'
  }
})
```

**数据库操作**：
```javascript
// 1. 检查是否已报名
db.collection('registrations').where({
  activityId,
  userId: openid
}).get()

// 2. 检查活动是否已满
db.collection('registrations').where({
  activityId,
  status: 'joined'
}).count()

// 3. 创建报名记录
db.collection('registrations').add({
  data: {
    activityId,
    userId: openid,
    userName,
    userAvatar,
    status: 'joined',
    joinedAt: Date.now()
  }
})
```

---

### 7. getUserActivities - 获取用户活动

**功能**：获取用户参加的和发起的活动列表

**输入参数**：
```json
{
  "type": "joined"  // 或 "hosted"
}
```

**返回数据**：
```json
{
  "list": [
    {
      "_id": "activity123",
      "title": "周末友谊赛",
      "startDate": "2026-02-15",
      "startTime": "14:00",
      "address": "朝阳体育馆",
      "currentCount": 3,
      "maxParticipants": 8
    }
  ]
}
```

**调用示例**：
```typescript
// 获取我参加的活动
const res1 = await wx.cloud.callFunction({
  name: 'getUserActivities',
  data: { type: 'joined' }
})

// 获取我发起的活动
const res2 = await wx.cloud.callFunction({
  name: 'getUserActivities',
  data: { type: 'hosted' }
})
```

**数据库操作**：
```javascript
// 如果 type === 'joined'
// 1. 查询报名记录
db.collection('registrations').where({
  userId: openid,
  status: 'joined'
}).get()

// 2. 查询活动详情
db.collection('activities').where({
  _id: db.command.in(activityIds)
}).get()

// 如果 type === 'hosted'
// 直接查询发起的活动
db.collection('activities').where({
  hostId: openid
}).orderBy('createdAt', 'desc').get()
```

---

## ⚙️ 云函数配置

### package.json 配置
每个云函数目录下都有 `package.json`：

```json
{
  "name": "login",
  "version": "1.0.0",
  "description": "用户登录云函数",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~3.0.0"
  }
}
```

### 环境变量配置（可选）
```bash
云开发 → 云函数 → 选择函数 → 配置 → 环境变量

可添加：
- ENV: production
- LOG_LEVEL: info
```

### 超时时间配置
```bash
云开发 → 云函数 → 选择函数 → 配置 → 超时时间

推荐设置：
- login: 5秒
- getProfile: 5秒
- updateProfile: 10秒
- getActivities: 20秒
- createActivity: 10秒
- joinActivity: 10秒
- getUserActivities: 20秒
```

---

## 🧪 测试云函数

### 方法1：在开发者工具中测试

#### 步骤1：打开云函数测试界面
```bash
云开发 → 云函数 → 选择函数 → 测试
```

#### 步骤2：输入测试参数
**测试 login**：
```json
{}
```

**测试 getActivities**：
```json
{
  "keyword": "",
  "latitude": 39.9042,
  "longitude": 116.4074
}
```

**测试 createActivity**：
```json
{
  "title": "测试活动",
  "startDate": "2026-02-15",
  "startTime": "14:00",
  "address": "测试地址",
  "maxParticipants": 8,
  "fee": 0
}
```

#### 步骤3：查看返回结果
```bash
检查：
- ✅ 返回数据格式正确
- ✅ 没有错误信息
- ✅ 数据库记录已创建
```

---

### 方法2：在小程序中测试

#### 在页面中调用云函数
```typescript
// src/pages/index/index.vue
import { onMounted } from 'vue'

onMounted(async () => {
  // 测试 login
  const loginRes = await wx.cloud.callFunction({ name: 'login' })
  console.log('登录结果:', loginRes)
  
  // 测试 getActivities
  const activitiesRes = await wx.cloud.callFunction({
    name: 'getActivities',
    data: {}
  })
  console.log('活动列表:', activitiesRes)
})
```

---

## 📊 监控与日志

### 查看云函数日志
```bash
云开发 → 云函数 → 选择函数 → 日志

可以看到：
- 调用次数
- 成功/失败次数
- 平均耗时
- 错误信息
```

### 监控指标
```bash
云开发 → 监控 → 云函数监控

关注指标：
- 调用次数：是否正常增长
- 错误率：应保持在 < 1%
- 平均耗时：应 < 1000ms
- 并发量：高峰期是否正常
```

---

## ⚠️ 常见问题

### 问题0：上传云函数失败 - 请选择云环境（必读）
**错误**：`上传云函数 getProfile 失败`，详情中显示  
`Error: 请在编辑器云函数根目录 (cloudfunctionRoot) 选择一个云环境`

**原因**：微信开发者工具在上传云函数前，必须为项目指定当前使用的云环境。

**解决步骤**：
1. 在微信开发者工具中，确保打开的是**项目根目录**（包含 `project.config.json` 和 `cloudfunctions` 文件夹的目录），不要只打开 `dist/build/mp-weixin`。
2. 在左侧**文件树**中，找到并**左键点击** `cloudfunctions` 文件夹（选中该目录）。
3. 在顶部菜单栏或工具栏找到 **「当前环境」** 或 **「云开发」** 旁的环境下拉框。
4. 点击下拉框，**选择你的云环境**（例如 `cloudbase-0ga8ufoqa6c40d9d`）。若列表为空，请先点击「云开发」进入控制台并创建/绑定环境。
5. 选择完成后，再对 `cloudfunctions/getProfile` 等云函数目录**右键 → 上传并部署：云端安装依赖**。

若仍报错，可尝试：关闭项目后重新用**项目根目录**打开；或检查 `project.config.json` 中是否包含 `"cloudfunctionRoot": "cloudfunctions/"` 和 `"cloudenv": { "envId": "你的环境ID" }`。

### 问题1：上传失败
**错误**：`上传云函数失败`（无“请选择云环境”提示时）

**解决方案**：
1. 检查网络连接
2. 确认云开发环境已开通
3. 确认环境ID正确
4. 按「问题0」先选择云环境后再上传
5. 重启微信开发者工具

### 问题2：调用失败
**错误**：`cloud.callFunction:fail`

**解决方案**：
1. 确认云函数已部署
2. 检查函数名称是否正确
3. 查看云函数日志排查错误
4. 确认云开发环境ID配置正确

### 问题3：依赖安装失败
**错误**：`Cannot find module 'wx-server-sdk'`

**解决方案**：
1. 重新上传并部署：选择"云端安装依赖"
2. 确认 package.json 中有 wx-server-sdk
3. 在云控制台手动安装依赖

### 问题4：数据库权限错误
**错误**：`database permission denied`

**解决方案**：
1. 检查数据库权限设置
2. 确认云函数有数据库读写权限
3. 查看数据库安全规则是否正确

---

## 🎯 部署检查清单

### 云函数部署状态
- [ ] login 已部署并测试通过
- [ ] getProfile 已部署并测试通过
- [ ] updateProfile 已部署并测试通过
- [ ] getActivities 已部署并测试通过
- [ ] createActivity 已部署并测试通过
- [ ] joinActivity 已部署并测试通过
- [ ] getUserActivities 已部署并测试通过

### 功能测试
- [ ] 用户登录功能正常
- [ ] 获取用户信息正常
- [ ] 更新用户信息正常
- [ ] 活动列表加载正常
- [ ] 创建活动功能正常
- [ ] 加入活动功能正常
- [ ] 用户活动列表正常

### 性能检查
- [ ] 云函数调用耗时 < 1秒
- [ ] 云函数错误率 < 1%
- [ ] 数据库查询正常
- [ ] 日志记录正常

---

## 📝 相关文档
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 完整部署指南
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - 数据库配置指南

---

## 🎉 云函数部署完成！

**7个云函数全部部署完成后，即可开始真机测试小程序所有功能！**
