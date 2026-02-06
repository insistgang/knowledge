# 智能金融推荐系统 - 核心组件说明

## 一、核心服务器文件

### 1. **smart_recommendation_server.js** (主服务器)
- **作用**: 系统的核心服务器，处理所有API请求
- **端口**: 3001
- **核心功能**:
  - 客户风险画像分析 (`analyzeCustomerRisk`)
  - 智能产品推荐算法 (`generateRecommendations`)
  - 反馈收集和样本管理
  - 两步推荐策略（初始推荐 + 优化推荐）

### 2. **关键API端点**
- `GET /api/health` - 系统健康检查
- `GET /api/customers/:custNo` - 获取客户信息和推荐
- `GET /api/customers/:custNo/next-recommendations` - 获取优化推荐
- `POST /api/customers/:custNo/feedback` - 提交用户反馈

## 二、核心数据集

### 1. **客户数据 (cust_dataset.csv)**
```csv
cust_no,birth_ym,loc_cd,gender,init_dt,edu_bg,marriage_situ_cd
CDB91DCCE198B10A522FE2AABF6A8D81,1942-03,L001,M,2011-03-01,,
9307AC85C179D8E388DC776DB6283534,1986-08,L001,F,2010-12-14,,
```
- **关键字段**: 客户ID、出生年月、地区、性别、入行时间

### 2. **事件数据 (event_dataset.csv)**
```csv
cust_no,prod_id,event_id,event_type,event_level,event_date,event_term,event_rate,event_amt
```
- **作用**: 记录客户与产品的交互历史
- **事件类型**: A(购买)/B(浏览)/D(删除)

### 3. **产品数据 (内嵌在服务器中)**
```javascript
const productDatabase = [
    {
        id: 'SAVE_NEW_001',
        name: '大额存单',
        category: '储蓄类',
        riskLevel: 1,
        minAmount: 200000,
        targetProfile: { ... }
    }
]
```

## 三、核心算法模块

### 1. **客户风险画像算法**
```javascript
async function analyzeCustomerRisk(custNo) {
    // 基于年龄、性别、地区等因素分析客户风险偏好
    // 返回: { age, overallRisk, investmentExperience, preferenceType, riskScore }
}
```

### 2. **智能推荐算法**
```javascript
async function generateRecommendations(customer, userPreference = null) {
    // 两阶段推荐:
    // 1. 基于客户特征的初始推荐
    // 2. 基于反馈的优化推荐
}
```

### 3. **产品匹配评分**
```javascript
function calculateProductScore(customer, product, userPreference) {
    // 综合考虑:
    // - 风险匹配度
    // - 年龄适宜度
    // - 地区偏好
    // - 用户历史反馈
    // - 产品特征匹配
}
```

## 四、前端界面文件

### 1. **smart_recommendation_frontend_clean.html** (精简版)
- 功能: 简洁的客户搜索和产品推荐界面
- 特点: 无历史事件模块，专注于核心功能

### 2. **smart_recommendation_frontend_fixed.html** (完整版)
- 功能: 包含完整的数据分析、样本统计、报告生成
- 特点: 两步推荐流程、详细的用户反馈收集

## 五、核心工作流程

```
1. 用户输入客户ID
   ↓
2. 分析客户风险画像
   ↓
3. 生成初始推荐 (Step 1)
   ↓
4. 收集用户反馈
   ↓
5. 优化推荐算法
   ↓
6. 生成优化推荐 (Step 2)
   ↓
7. 更新用户偏好模型
```

## 六、关键特性

1. **实时风险画像**: 基于客户 demographics 动态生成
2. **两步推荐策略**: 初始推荐 + 反馈优化
3. **产品冲突检测**: 避免推荐互斥产品
4. **样本自动收集**: 收集正负样本用于模型优化
5. **动态权重调整**: 根据用户反馈调整推荐权重