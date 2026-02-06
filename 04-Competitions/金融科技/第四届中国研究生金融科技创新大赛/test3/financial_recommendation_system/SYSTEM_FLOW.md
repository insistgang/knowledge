# 系统核心流程和数据流

## 核心数据流

```
CSV数据文件
    ↓
客户画像分析 → 客户风险评分
    ↓
产品匹配算法 → 初始推荐列表
    ↓
用户反馈收集 → 样本数据库
    ↓
算法优化 → 优化推荐列表
```

## 关键算法逻辑

### 1. 客户分群逻辑
```javascript
// 服务器中的客户数据映射
const customerData = {
    'CDB91DCCE198B10A522FE2AABF6A8D81': {
        age: 82,
        riskScore: 20,        // 低风险
        overallRisk: 'low',   // 保守型
        investmentExperience: 'high',
        preferenceType: 'conservative'
    },
    '9307AC85C179D8E388DC776DB6283534': {
        age: 38,
        riskScore: 85,        // 高风险
        overallRisk: 'high',  // 激进型
        investmentExperience: 'medium',
        preferenceType: 'aggressive'
    }
}
```

### 2. 产品匹配评分系统
```javascript
// 评分组成（总分100）
- 基础分: 50分
- 风险匹配: ±20分 (保守型推荐低风险产品加分)
- 年龄匹配: ±15分 (年龄适宜产品加分)
- 地区匹配: ±10分 (同地区产品偏好)
- 用户偏好: ±25分 (基于历史反馈)
- 类别偏好: ±25分 (喜欢的类别加分)
```

### 3. 反馈学习机制
```javascript
// 用户反馈影响后续推荐
if (feedback === 'interested') {
    // 正样本
    - 增加同类别的推荐权重
    - 记录喜欢的产品特征
    - 优先推荐相似产品
} else if (feedback === 'not_interested') {
    // 负样本
    - 降低同类别的推荐权重
    - 避免推荐相似产品
    - 调整风险偏好判断
}
```

## 核心产品类别

1. **储蓄类产品** (风险等级: 1-2)
   - 大额存单、定期存款
   - 教育储蓄、养老储蓄

2. **信贷类产品** (风险等级: 2-3)
   - 个人消费贷、房屋抵押贷
   - 信用卡、汽车贷款

3. **财富类产品** (风险等级: 2-4)
   - 稳健理财、股票基金
   - 黄金投资、混合基金

4. **保障类产品** (风险等级: 1-3)
   - 人寿保险、重疾险
   - 医疗保险、年金保险

## 关键创新点

1. **无需预训练**: 基于规则和实时反馈，无需离线模型训练
2. **冷启动解决**: 通过客户demographics快速生成初始推荐
3. **实时适应**: 每次反馈都立即影响下一次推荐
4. **产品冲突处理**: 自动避免推荐互斥产品（如竞争性产品）

## 核心代码位置

1. **客户画像函数**: smart_recommendation_server.js:443-523
2. **推荐生成函数**: smart_recommendation_server.js:935-1100
3. **反馈处理函数**: smart_recommendation_server.js:627-700
4. **评分算法**: smart_recommendation_server.js:700-930