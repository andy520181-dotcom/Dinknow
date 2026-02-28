# 数据库配置指南

## 📊 数据库集合结构

### 集合 1：`users` - 用户信息

#### 字段说明
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _id | String | 自动 | 用户ID（自动生成） |
| openid | String | ✅ | 微信openid（唯一标识） |
| nickName | String | ✅ | 用户昵称 |
| avatarUrl | String | ❌ | 头像URL |
| gender | Number | ❌ | 性别（0未知/1男/2女） |
| duprLevel | String | ❌ | DUPR水平（2.0-5.5） |
| createdAt | Number | ✅ | 创建时间（时间戳） |
| updatedAt | Number | ✅ | 更新时间（时间戳） |

#### 示例数据
```json
{
  "_id": "user123456",
  "openid": "oABC123456789",
  "nickName": "张三",
  "avatarUrl": "cloud://xxx.png",
  "gender": 1,
  "duprLevel": "3.5",
  "createdAt": 1707609600000,
  "updatedAt": 1707609600000
}
```

#### 权限设置
```javascript
{
  "read": "doc._openid == auth.openid",  // 仅创建者可读
  "write": "doc._openid == auth.openid"  // 仅创建者可写
}
```

#### 索引
```javascript
[
  {
    "keys": [{ "openid": 1 }],
    "unique": true
  }
]
```

---

### 集合 2：`activities` - 活动信息

#### 字段说明
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _id | String | 自动 | 活动ID（自动生成） |
| title | String | ✅ | 活动主题 |
| startDate | String | ✅ | 开始日期（YYYY-MM-DD） |
| startTime | String | ✅ | 开始时间（HH:mm） |
| address | String | ✅ | 球场地址 |
| latitude | Number | ❌ | 纬度（用于距离计算） |
| longitude | Number | ❌ | 经度（用于距离计算） |
| maxParticipants | Number | ✅ | 最大参与人数（默认8） |
| fee | Number | ✅ | 活动费用（默认0） |
| description | String | ❌ | 活动描述 |
| duprLevel | String | ❌ | DUPR要求（如"3.0-4.0"） |
| hostId | String | ✅ | 发起人openid |
| hostName | String | ✅ | 发起人昵称 |
| hostAvatar | String | ❌ | 发起人头像 |
| status | String | ✅ | 状态（pending/ongoing/completed/cancelled） |
| createdAt | Number | ✅ | 创建时间（时间戳） |

#### 示例数据
```json
{
  "_id": "activity123456",
  "title": "周末匹克球友谊赛",
  "startDate": "2026-02-15",
  "startTime": "14:00",
  "address": "北京市朝阳区某某体育馆",
  "latitude": 39.9042,
  "longitude": 116.4074,
  "maxParticipants": 8,
  "fee": 50,
  "description": "欢迎新手加入",
  "duprLevel": "3.0-4.0",
  "hostId": "oABC123456789",
  "hostName": "张三",
  "hostAvatar": "cloud://xxx.png",
  "status": "pending",
  "createdAt": 1707609600000
}
```

#### 权限设置
```javascript
{
  "read": true,  // 所有用户可读
  "write": "doc.hostId == auth.openid"  // 仅发起人可写
}
```

#### 索引
```javascript
[
  {
    "keys": [{ "createdAt": -1 }]  // 按创建时间降序
  },
  {
    "keys": [{ "status": 1, "createdAt": -1 }]  // 按状态和时间
  },
  {
    "keys": [{ "hostId": 1, "createdAt": -1 }]  // 按发起人和时间
  }
]
```

---

### 集合 3：`registrations` - 活动报名记录

#### 字段说明
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _id | String | 自动 | 报名ID（自动生成） |
| activityId | String | ✅ | 活动ID |
| userId | String | ✅ | 用户openid |
| userName | String | ✅ | 用户昵称 |
| userAvatar | String | ❌ | 用户头像 |
| status | String | ✅ | 状态（joined/cancelled） |
| joinedAt | Number | ✅ | 报名时间（时间戳） |

#### 示例数据
```json
{
  "_id": "registration123456",
  "activityId": "activity123456",
  "userId": "oXYZ987654321",
  "userName": "李四",
  "userAvatar": "cloud://yyy.png",
  "status": "joined",
  "joinedAt": 1707609600000
}
```

#### 权限设置
```javascript
{
  "read": true,  // 所有用户可读
  "write": "doc.userId == auth.openid"  // 仅报名者可写
}
```

#### 索引
```javascript
[
  {
    "keys": [{ "activityId": 1, "status": 1 }]  // 按活动ID和状态
  },
  {
    "keys": [{ "userId": 1, "joinedAt": -1 }]  // 按用户ID和报名时间
  },
  {
    "keys": [{ "activityId": 1, "userId": 1 }],  // 防重复报名
    "unique": true
  }
]
```

---

## 🚀 快速创建步骤

### 方法1：通过微信开发者工具创建

#### 步骤1：打开云开发控制台
```bash
微信开发者工具 → 云开发 → 数据库
```

#### 步骤2：创建集合
```bash
点击"添加集合" → 输入集合名称 → 点击"确定"

依次创建：
1. users
2. activities
3. registrations
```

#### 步骤3：设置权限
```bash
点击集合名称 → 权限设置 → 切换到"自定义安全规则"

users 集合权限：
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}

activities 集合权限：
{
  "read": true,
  "write": "doc.hostId == auth.openid"
}

registrations 集合权限：
{
  "read": true,
  "write": "doc.userId == auth.openid"
}
```

#### 步骤4：添加索引
```bash
点击集合名称 → 索引管理 → 添加索引

users 集合索引：
- 字段：openid, 类型：升序, 唯一索引：是

activities 集合索引：
- 字段：createdAt, 类型：降序
- 字段：status, 类型：升序
- 字段：hostId, 类型：升序

registrations 集合索引：
- 字段：activityId, 类型：升序
- 字段：userId, 类型：升序
- 复合索引：activityId + userId（唯一）
```

---

### 方法2：通过云控制台创建（推荐）

#### 步骤1：登录云控制台
```bash
https://console.cloud.tencent.com/tcb
选择环境：cloudbase-0ga8ufoqa6c40d9d
```

#### 步骤2：创建集合
```bash
数据库 → 集合 → 添加集合

依次创建：
1. users
2. activities
3. registrations
```

#### 步骤3：导入示例数据（可选）
```bash
集合 → 导入 → 选择JSON文件
```

**users 示例数据**（users_sample.json）：
```json
[
  {
    "openid": "sample_user_001",
    "nickName": "测试用户1",
    "avatarUrl": "",
    "gender": 1,
    "duprLevel": "3.5",
    "createdAt": 1707609600000,
    "updatedAt": 1707609600000
  }
]
```

**activities 示例数据**（activities_sample.json）：
```json
[
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
    "duprLevel": "3.0-4.0",
    "hostId": "sample_user_001",
    "hostName": "测试用户1",
    "hostAvatar": "",
    "status": "pending",
    "createdAt": 1707609600000
  }
]
```

---

## 🔍 验证数据库配置

### 检查清单
```bash
✅ users 集合已创建
✅ activities 集合已创建
✅ registrations 集合已创建
✅ 权限规则已设置
✅ 索引已添加
✅ 示例数据已导入（可选）
```

### 测试数据库操作
```bash
1. 打开云开发控制台
2. 选择 activities 集合
3. 点击"添加记录"
4. 手动添加一条测试活动
5. 在小程序中查看是否显示
```

---

## ⚠️ 注意事项

### 1. 权限设置
- ❌ **不要**设置为"所有用户可读写"（不安全）
- ✅ **推荐**使用自定义安全规则
- ✅ **确保**只有创建者可以修改自己的数据

### 2. 索引优化
- 索引可以提升查询性能
- 常用查询字段应添加索引
- 不要过度添加索引（影响写入性能）

### 3. 数据备份
```bash
定期备份数据库：
云开发 → 数据库 → 备份/恢复 → 创建备份
```

### 4. 数据导入
- 导入数据前先备份
- 确认数据格式正确（JSON）
- 大批量导入建议分批进行

---

## 📊 数据库容量规划

### 免费版额度
- 存储容量：2GB
- 读操作：50,000次/天
- 写操作：30,000次/天
- 集合数量：最多50个

### 容量估算
假设1000个活跃用户：
- users: 1000条 × 1KB = 1MB
- activities: 5000条 × 2KB = 10MB
- registrations: 20000条 × 0.5KB = 10MB
- **总计**：约21MB（远低于2GB限制）

### 升级建议
当满足以下条件时考虑升级：
- 用户数 > 10,000
- 日活跃用户 > 1,000
- 存储空间 > 1.5GB
- 日读写操作接近限额

---

## 🎯 完成检查

### 数据库配置完成清单
- [ ] users 集合已创建
- [ ] activities 集合已创建
- [ ] registrations 集合已创建
- [ ] users 集合权限已设置
- [ ] activities 集合权限已设置
- [ ] registrations 集合权限已设置
- [ ] users 集合索引已添加
- [ ] activities 集合索引已添加
- [ ] registrations 集合索引已添加
- [ ] 测试数据已导入（可选）
- [ ] 数据库操作已测试

---

## 📝 相关文档
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 完整部署指南
- [README.md](./README.md) - 项目说明

---

## 🎉 数据库配置准备就绪！

**按照上述步骤创建数据库集合，即可开始部署云函数和测试小程序功能！**
