# 灵犀引擎 - 智能金融产品推荐系统

<div align="center">
  <h2>灵犀引擎 (Lingxi Engine)</h2>
  <p>AI驱动的精准金融产品推荐系统</p>
</div>

## 📋 目录

- [系统概述](#系统概述)
- [核心特性](#核心特性)
- [系统架构](#系统架构)
- [快速开始](#快速开始)
- [系统组件](#系统组件)
- [API文档](#api文档)
- [数据集](#数据集)
- [算法说明](#算法说明)
- [使用指南](#使用指南)
- [常见问题](#常见问题)

## 🎯 系统概述

灵犀引擎是一个基于规则和实时反馈的智能金融产品推荐系统，能够根据客户特征精准推荐合适的金融产品。系统采用两步推荐策略，通过持续学习用户反馈，不断优化推荐准确率。

### 核心文件
- **后端服务器**: `smart_recommendation_server.js`
- **主界面**: `smart_recommendation_frontend_fixed.html`
- **产品分析**: `new_product_analysis_fixed.html`

## ✨ 核心特性

- 🔍 **智能客户画像**: 基于年龄、性别、地区等特征分析客户风险偏好
- 📊 **两步推荐策略**: 初始推荐 → 用户反馈 → 优化推荐
- 🎯 **精准匹配**: 100分制综合评分系统，多维度产品匹配
- 📈 **实时学习**: 每次反馈立即更新推荐权重
- 💾 **零数据库**: 内存存储，无需额外配置
- 🚀 **冷启动支持**: 基于客户ID模式快速推断特征

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端界面       │    │   API服务器      │    │   推荐引擎       │
│                 │    │                 │    │                 │
│ • 客户搜索       │◄──►│ • RESTful API   │◄──►│ • 风险画像分析   │
│ • 产品展示       │    │ • 反馈收集       │    │ • 产品匹配评分   │
│ • 数据可视化     │    │ • 样本管理       │    │ • 用户偏好学习   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │                ┌─────────────┐              │
         │                │   内存存储   │◄─────────────┘
         │                │             │
         └────────────────►│ • 产品数据   │
                          │ • 用户样本   │
                          │ • 偏好模型   │
                          └─────────────┘
```

## 🚀 快速开始

### 环境要求
- Node.js 14.0 或更高版本
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 安装步骤

1. **克隆或下载项目**
   ```bash
   # 如果使用git
   git clone <repository-url>
   cd financial_recommendation_system
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动服务器**
   ```bash
   node smart_recommendation_server.js
   ```
   服务器将在 http://localhost:3001 启动

4. **打开前端界面**
   - 主界面：`smart_recommendation_frontend_fixed.html`
   - 精简版：`smart_recommendation_frontend_clean.html`
   - 产品分析：`new_product_analysis_fixed.html`

### 快速测试

1. 打开 `smart_recommendation_frontend_fixed.html`
2. 点击示例客户ID（如 `CDB91DCCE198B10A522FE2AABF6A8D81`）
3. 点击搜索按钮
4. 查看推荐结果并提交反馈
5. 体验两步推荐流程

## 📦 系统组件

### 1. 后端服务器 (smart_recommendation_server.js)

**主要功能：**
- RESTful API服务
- 客户风险画像分析
- 智能推荐算法
- 反馈收集和学习
- 样本数据管理

**核心API：**
```javascript
GET  /api/health                         // 系统健康检查
GET  /api/customers/:custNo             // 获取客户和推荐
POST /api/customers/:custNo/feedback    // 提交用户反馈
```

### 2. 前端界面 (smart_recommendation_frontend_fixed.html)

**功能模块：**
- 🏠 控制面板：系统概览和统计
- 🔍 客户搜索：支持10+示例客户ID
- ⭐ 推荐结果：产品展示和反馈收集
- 👤 客户画像：详细客户信息分析
- 📊 数据分析：样本统计和效果分析
- ⚙️ 系统设置：算法参数配置

### 3. 产品分析界面 (new_product_analysis_fixed.html)

**专业功能：**
- 新产品市场分析
- 目标客户群体识别
- 产品冲突检测
- 营销策略建议

## 📡 API文档

### 获取客户推荐

**请求：**
```http
GET /api/customers/CDB91DCCE198B10A522FE2AABF6A8D81
```

**响应：**
```json
{
  "customer": {
    "cust_no": "CDB91DCCE198B10A522FE2AABF6A8D81",
    "age": 82,
    "gender": "M",
    "isHighValue": true,
    "assets": 5000000,
    "riskProfile": {
      "overallRisk": "low",
      "riskScore": 20
    }
  },
  "recommendations": [
    {
      "id": "SAVE_NEW_001",
      "name": "大额存单",
      "category": "储蓄类",
      "riskLevel": 1,
      "matchScore": 95,
      "matchReason": "低风险偏好，适合保守型投资"
    }
  ],
  "nextStep": "第一步：初始推荐",
  "confidence": "high"
}
```

### 提交用户反馈

**请求：**
```http
POST /api/customers/CDB91DCCE198B10A522FE2AABF6A8D81/feedback
Content-Type: application/json

{
  "feedback": [
    {
      "productId": "SAVE_NEW_001",
      "productName": "大额存单",
      "feedback": "interested"
    }
  ]
}
```

**响应：**
```json
{
  "message": "反馈已记录",
  "samples": {
    "totalSamples": 50,
    "positiveSamples": 30,
    "negativeSamples": 20,
    "positiveRatio": "60%"
  },
  "accuracyImprovement": "15%"
}
```

## 📊 数据集

### 客户数据 (data/cust_dataset.csv)
- 客户数量：1,108,828
- 字段：客户ID、出生年月、地区、性别、入行时间、教育背景、婚姻状况

### 事件数据 (data/event_dataset.csv)
- 交互记录：客户产品浏览、购买、删除行为
- 字段：客户ID、产品ID、事件类型、事件级别、日期、金额

### 产品数据库（内置）
```javascript
const productDatabase = [
  // 储蓄类（风险等级 1-2）
  { id: 'SAVE_NEW_001', name: '大额存单', category: '储蓄类', riskLevel: 1 },

  // 信贷类（风险等级 2-3）
  { id: 'CREDIT_001', name: '个人消费贷', category: '信贷类', riskLevel: 2 },

  // 财富类（风险等级 2-4）
  { id: 'WEALTH_001', name: '稳健理财', category: '财富类', riskLevel: 2 },

  // 保障类（风险等级 1-3）
  { id: 'INSURE_001', name: '人寿保险', category: '保障类', riskLevel: 1 }
]
```

## 🧮 算法说明

### 产品匹配评分算法

总分100分，由以下因素组成：

```javascript
总分 = 基础分(50)
      + 风险匹配(±20)
      + 年龄匹配(±15)
      + 地区偏好(±10)
      + 资产匹配(±10)
      + 用户偏好(±25)
```

**评分细则：**
- **基础分**：50分
- **风险匹配**：保守型客户推荐低风险产品 +20分
- **年龄匹配**：年龄在目标范围内 +15分
- **用户偏好**：基于历史反馈，喜欢类别 +25分
- **避免减分**：不喜欢的类别 -20分

### 用户偏好学习

```javascript
// 正反馈（感兴趣）
if (feedback === 'interested') {
  // 增加该类别的推荐权重
  // 记录喜欢的产品特征
  // 优先推荐相似产品
}

// 负反馈（不感兴趣）
if (feedback === 'not_interested') {
  // 降低该类别的推荐权重
  // 避免推荐相似产品
  // 调整风险偏好判断
}
```

## 📖 使用指南

### 示例客户ID

| 客户ID | 年龄 | 性别 | 特征 | 风险偏好 |
|--------|------|------|------|----------|
| CDB91DCCE198B10A522FE2AABF6A8D81 | 82 | 男 | 高净值 | 保守型 |
| 9307AC85C179D8E388DC776DB6283534 | 38 | 女 | 年轻高收入 | 激进型 |
| 9FA3282573CEB37A5E9BC1C38088087F | 74 | 男 | 退休导向 | 平衡型 |
| CB0D6827A924C7FFDD9DD57BF5CE9358 | 73 | 女 | 稳定型 | 保守型 |
| 797E3448CF516A52ADBE6DB33626B50E | 67 | 男 | 高净值 | 平衡型 |

### 两步推荐流程

1. **第一步：初始推荐**
   - 基于客户基本特征
   - 生成5个初始推荐产品
   - 展示匹配分数和原因

2. **收集用户反馈**
   - 对每个产品选择：感兴趣/不感兴趣/已拥有
   - 系统记录并学习偏好

3. **第二步：优化推荐**
   - 基于反馈调整推荐策略
   - 生成更精准的推荐
   - 更新用户偏好模型

### 产品类别说明

| 类别 | 风险等级 | 典型产品 | 目标客户 |
|------|----------|----------|----------|
| 储蓄类 | 1-2 | 大额存单、定期存款 | 保守型、老年人 |
| 信贷类 | 2-3 | 个人消费贷、信用卡 | 年轻人、消费需求 |
| 财富类 | 2-4 | 股票基金、黄金投资 | 高净值、激进型 |
| 保障类 | 1-3 | 人寿保险、重疾险 | 家庭责任重、中年人 |

## ❓ 常见问题

### Q1: 系统支持多少客户？
**A**: 系统设计支持百万级客户，当前数据集包含110万+客户。

### Q2: 如何添加新产品？
**A**: 修改 `smart_recommendation_server.js` 中的 `productDatabase` 数组。

### Q3: 推荐准确率如何？
**A**: 通过两步推荐策略，准确率可提升50%+。具体准确率依赖于反馈数据量。

### Q4: 需要数据库吗？
**A**: 不需要。所有数据存储在内存中，支持快速启动和部署。

### Q5: 如何导出推荐结果？
**A**: 使用界面的"导出报告"功能，或直接调用API获取JSON数据。

### Q6: 系统可以定制吗？
**A**: 可以。所有算法和参数都可以调整，支持定制化开发。

## 🔧 技术栈

- **后端**: Node.js + Express.js
- **前端**: HTML5 + CSS3 + JavaScript (ES6+)
- **样式**: Bootstrap 5 + Font Awesome 6
- **算法**: 基于规则的推荐系统 + 实时学习
- **存储**: 内存存储 (Map数据结构)

---

<div align="center">
  <p>© 2025 灵犀引擎 - 智能金融推荐系统</p>
  <p>Made with ❤️ for Financial Innovation</p>
</div>