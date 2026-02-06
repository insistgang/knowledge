# 后端核心代码详解

## 1. **主服务器架构 (smart_recommendation_server.js)**

### 初始化和中间件
```javascript
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// 中间件
app.use(cors());                    // 跨域支持
app.use(express.json());            // JSON解析
```

## 2. **核心API端点**

### 健康检查端点
```javascript
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        totalProducts: productDatabase.length,
        sampleCount: customerSamples.size
    });
});
```

### 客户推荐端点（最核心）
```javascript
app.get('/api/customers/:custNo', async (req, res) => {
    const { custNo } = req.params;

    try {
        // 1. 获取客户风险画像
        const riskProfile = await analyzeCustomerRisk(custNo);

        // 2. 构建客户对象
        const customer = {
            cust_no: custNo,
            birth_ym: riskProfile.birth_ym || '194201',
            age: calculateAge(riskProfile.birth_ym),
            gender: inferGender(custNo),
            loc_cd: 'L001',
            edu_bg: '本科',
            marriage_situ_cd: '已婚',
            isHighValue: isHighValueCustomer(custNo),
            riskProfile: riskProfile,
            assets: estimateAssets(custNo, riskProfile),
            annualIncome: estimateIncome(custNo, riskProfile)
        };

        // 3. 生成推荐产品
        const recommendations = await generateSmartRecommendations(customer);

        // 4. 返回结果
        res.json({
            customer: customer,
            customerInsight: generateCustomerInsight(customer, riskProfile),
            recommendations: recommendations,
            samples: getSampleStatistics(custNo),
            nextStep: '第一步：初始推荐',
            productCount: recommendations.length,
            confidence: calculateConfidence(recommendations, customer)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

## 3. **核心算法函数**

### 客户风险画像分析
```javascript
async function analyzeCustomerRisk(custNo) {
    // 实际客户的预设数据
    const customerData = {
        'CDB91DCCE198B10A522FE2AABF6A8D81': {
            age: 82,
            riskScore: 20,        // 0-100，越低越保守
            overallRisk: 'low',
            investmentExperience: 'high',
            preferenceType: 'conservative'
        },
        // ... 其他客户数据
    };

    // 对于未知客户，基于ID模式推断
    if (!customerData[custNo]) {
        // 基于客户号的启发式规则
        const isOlder = custNo.includes('9FA') || custNo.includes('CB0');
        const isHighValue = custNo.includes('CDB') || custNo.includes('797E');

        // 返回默认风险画像
        return {
            overallRisk: isOlder ? 'low' : 'medium',
            riskScore: isOlder ? 40 : 60,
            preferenceType: isOlder ? 'conservative' : 'balanced'
        };
    }

    return customerData[custNo];
}
```

### 产品匹配评分算法（最核心的算法）
```javascript
function calculateMatchScore(customer, product, riskProfile) {
    let score = 50;  // 基础分

    // 1. 风险匹配度 (±20分)
    if (product.riskLevel <= 2 && riskProfile.overallRisk === 'low') {
        score += 20;  // 保守型客户推荐低风险产品
    } else if (product.riskLevel >= 3 && riskProfile.overallRisk === 'high') {
        score += 15;  // 激进型客户推荐高风险产品
    }

    // 2. 年龄适宜度 (±15分)
    if (product.targetProfile.age) {
        const [minAge, maxAge] = product.targetProfile.age;
        if (customer.age >= minAge && customer.age <= maxAge) {
            score += 15;
        } else if (customer.age < minAge && (minAge - customer.age) <= 5) {
            score += 5;  // 年龄接近但略小
        }
    }

    // 3. 投资偏好匹配 (±25分)
    if (product.targetProfile.productPreference === riskProfile.preferenceType) {
        score += 25;
    }

    // 4. 资产匹配 (±10分)
    if (customer.assets >= product.minAmount * 10) {
        score += 10;  // 客户资产远超产品门槛
    } else if (customer.assets >= product.minAmount) {
        score += 5;   // 刚好满足门槛
    }

    // 5. 用户历史反馈 (±25分)
    const userPreference = getUserPreference(customer.cust_no);
    if (userPreference.preferredCategories[product.category]) {
        score += 25 * userPreference.preferredCategories[product.category];
    }
    if (userPreference.avoidedCategories[product.category]) {
        score -= 20 * userPreference.avoidedCategories[product.category];
    }

    // 确保分数在0-100之间
    return Math.max(0, Math.min(100, score));
}
```

### 反馈收集和学习机制
```javascript
app.post('/api/customers/:custNo/feedback', async (req, res) => {
    const { custNo } = req.params;
    const { feedback } = req.body;

    try {
        // 1. 验证反馈格式
        if (!feedback || !Array.isArray(feedback)) {
            return res.status(400).json({ error: '反馈数据格式错误' });
        }

        // 2. 存储反馈样本
        feedback.forEach(item => {
            const sampleKey = `${custNo}_${item.productId}`;
            customerSamples.set(sampleKey, {
                customerId: custNo,
                productId: item.productId,
                productName: item.productName,
                feedback: item.feedback,  // interested/not_interested/already_have
                timestamp: new Date().toISOString()
            });

            // 3. 更新用户偏好模型
            updateUserPreference(custNo, item.productId, item.feedback);
        });

        // 4. 分析样本统计
        const samples = analyzeSamples(custNo);

        // 5. 返回更新后的统计信息
        res.json({
            message: '反馈已记录',
            samples: samples,
            accuracyImprovement: calculateAccuracyImprovement(samples)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### 用户偏好学习算法
```javascript
function updateUserPreference(custNo, productId, feedback) {
    const product = findProduct(productId);

    // 获取或创建用户偏好
    let preference = userPreferences.get(custNo) || {
        preferredCategories: {},
        avoidedCategories: {},
        riskPreference: 'neutral',
        productFeatures: { liked: [], disliked: [] }
    };

    // 更新类别偏好
    if (feedback === 'interested') {
        preference.preferredCategories[product.category] =
            (preference.preferredCategories[product.category] || 0) + 0.3;
    } else if (feedback === 'not_interested') {
        preference.avoidedCategories[product.category] =
            (preference.avoidedCategories[product.category] || 0) + 0.3;
    }

    // 更新特征偏好
    if (product.features) {
        product.features.forEach(feature => {
            if (feedback === 'interested') {
                if (!preference.productFeatures.liked.includes(feature)) {
                    preference.productFeatures.liked.push(feature);
                }
            } else if (feedback === 'not_interested') {
                if (!preference.productFeatures.disliked.includes(feature)) {
                    preference.productFeatures.disliked.push(feature);
                }
            }
        });
    }

    // 保存更新后的偏好
    userPreferences.set(custNo, preference);
}
```

## 4. **两步推荐策略**

### 第二步：优化推荐
```javascript
app.get('/api/customers/:custNo/next-recommendations', async (req, res) => {
    const { custNo } = req.params;

    try {
        // 1. 获取客户信息
        const riskProfile = await analyzeCustomerRisk(custNo);
        const customer = { /* 构建客户对象 */ };

        // 2. 检查是否有样本数据
        const samples = getCustomerSamples(custNo);

        if (samples.length === 0) {
            // 没有样本数据，返回基于特征的推荐
            const recommendations = generateFeatureBasedRecommendations(customer);
            return res.json({
                nextStep: '基于客户特征的初始推荐',
                recommendations: recommendations,
                productCount: recommendations.length,
                confidence: 'medium'
            });
        }

        // 3. 基于样本生成优化推荐
        const optimizedRecommendations = generateOptimizedRecommendations(
            customer,
            samples
        );

        res.json({
            nextStep: '基于反馈的优化推荐',
            recommendations: optimizedRecommendations,
            productCount: optimizedRecommendations.length,
            confidence: 'high',
            samplesAnalyzed: samples.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

## 5. **数据存储结构**

### 内存中的数据存储
```javascript
// 产品数据库（19个产品）
const productDatabase = [
    {
        id: 'SAVE_NEW_001',
        name: '大额存单',
        category: '储蓄类',
        riskLevel: 1,
        minAmount: 200000,
        targetProfile: {
            age: [50, 80],
            riskTolerance: 'low',
            wealthLevel: 'medium'
        },
        features: ['保本', '固定收益', '高利率']
    }
    // ... 其他18个产品
];

// 客户样本存储
const customerSamples = new Map();

// 用户偏好存储
const userPreferences = new Map();
```

## 总结

后端核心代码主要在 `smart_recommendation_server.js` 文件中，包含：

1. **API服务器**: Express.js搭建的RESTful API
2. **推荐算法**: 基于规则的多维度评分系统
3. **学习机制**: 实时收集反馈并更新用户偏好
4. **两步策略**: 初始推荐 + 优化推荐
5. **内存存储**: 使用Map存储样本和偏好数据

所有算法都是基于规则和启发式的，不需要机器学习模型训练，适合快速部署和实时响应。