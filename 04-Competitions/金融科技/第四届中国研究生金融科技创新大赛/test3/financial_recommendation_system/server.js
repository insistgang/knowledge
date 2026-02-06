const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 数据存储
let customers = [];
let events = [];
let productFeatures = {};

// 加载数据
async function loadData() {
    console.log('开始加载数据...');

    try {
        // 加载客户数据
        await loadCustomerData();

        // 加载事件数据
        await loadEventData();

        // 初始化产品特征
        initializeProductFeatures();

        console.log('数据加载完成');
        console.log(`客户数据: ${customers.length}条`);
        console.log(`事件数据: ${events.length}条`);

    } catch (error) {
        console.error('数据加载失败:', error);
    }
}

// 加载客户数据
function loadCustomerData() {
    return new Promise((resolve, reject) => {
        const customers = [];

        fs.createReadStream('data/cust_dataset.csv')
            .pipe(csv())
            .on('data', (row) => {
                customers.push({
                    cust_no: row.cust_no,
                    birth_ym: row.birth_ym,
                    loc_cd: row.loc_cd,
                    gender: row.gender,
                    init_dt: row.init_dt,
                    edu_bg: row.edu_bg || '',
                    marriage_situ_cd: row.marriage_situ_cd || ''
                });
            })
            .on('end', () => {
                global.customers = customers;
                console.log(`客户数据加载成功: ${customers.length}条记录`);
                resolve();
            })
            .on('error', reject);
    });
}

// 加载事件数据
function loadEventData() {
    return new Promise((resolve, reject) => {
        const events = [];

        fs.createReadStream('data/event_dataset.csv')
            .pipe(csv())
            .on('data', (row) => {
                events.push({
                    cust_no: row.cust_no,
                    prod_id: row.prod_id,
                    event_id: row.event_id,
                    event_type: row.event_type,
                    event_level: row.event_level,
                    event_date: row.event_date,
                    event_term: row.event_term || '',
                    event_rate: row.event_rate || '',
                    event_amt: row.event_amt || ''
                });
            })
            .on('end', () => {
                global.events = events;
                console.log(`事件数据加载成功: ${events.length}条记录`);
                resolve();
            })
            .on('error', reject);
    });
}

// 初始化产品特征
function initializeProductFeatures() {
    // 基于事件数据生成产品特征
    const productStats = {};

    events.forEach(event => {
        if (!productStats[event.prod_id]) {
            productStats[event.prod_id] = {
                product_id: event.prod_id,
                customer_count: 0,
                success_events: 0,
                total_events: 0,
                total_amount: 0,
                avg_term: 0,
                avg_rate: 0,
                event_types: new Set(),
                success_rate: 0
            };
        }

        const stat = productStats[event.prod_id];
        stat.customer_count = Math.max(stat.customer_count,
            events.filter(e => e.prod_id === event.prod_id).length);
        stat.total_events++;

        if (['A', 'B'].includes(event.event_type)) {
            stat.success_events++;
        }

        if (event.event_amt) {
            stat.total_amount += parseFloat(event.event_amt || 0);
        }

        stat.event_types.add(event.event_type);
    });

    // 计算统计指标
    Object.values(productStats).forEach(stat => {
        stat.success_rate = stat.total_events > 0 ?
            stat.success_events / stat.total_events : 0;
        stat.avg_amount = stat.total_amount / stat.total_events;

        // 确定产品类别
        if (stat.product_id.startsWith('C')) {
            stat.category = 'credit';
            stat.risk_level = 2;
        } else if (stat.product_id.startsWith('D')) {
            stat.category = 'deposit';
            stat.risk_level = 1;
        } else if (stat.product_id.startsWith('A')) {
            stat.category = 'wealth';
            stat.risk_level = 3;
        } else {
            stat.category = 'other';
            stat.risk_level = 2;
        }

        stat.name = `${stat.category.toUpperCase()}_${stat.product_id}`;
        stat.description = `${stat.category}产品 - 风险等级: ${stat.risk_level}`;
    });

    global.productFeatures = productStats;
    console.log(`产品特征初始化完成: ${Object.keys(productStats).length}个产品`);
}

// API 路由

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: '服务器运行正常',
        data_loaded: customers.length > 0 && events.length > 0,
        customers_count: customers.length,
        events_count: events.length,
        products_count: Object.keys(productFeatures).length,
        timestamp: new Date().toISOString()
    });
});

// 搜索客户
app.get('/api/customers/:custNo', (req, res) => {
    try {
        const { custNo } = req.params;

        console.log('搜索客户:', custNo);

        const customer = customers.find(c => c.cust_no === custNo);

        if (!customer) {
            return res.status(404).json({
                error: '客户不存在',
                message: `客户号 ${custNo} 未找到`
            });
        }

        // 获取客户事件
        const customerEvents = events.filter(e => e.cust_no === custNo);

        // 计算客户特征
        const customerFeatures = calculateCustomerFeatures(customer, customerEvents);

        // 生成营销标签
        const marketingTags = generateMarketingTags(customerFeatures, customerEvents);

        res.json({
            success: true,
            customer: {
                ...customer,
                ...customerFeatures,
                marketing_tags: marketingTags
            },
            events: customerEvents,
            event_count: customerEvents.length,
            success_rate: customerEvents.length > 0 ?
                customerEvents.filter(e => ['A', 'B'].includes(e.event_type)).length / customerEvents.length : 0
        });

    } catch (error) {
        console.error('搜索客户失败:', error);
        res.status(500).json({
            error: '搜索失败',
            message: error.message
        });
    }
});

// 生成推荐
app.post('/api/recommendations/:custNo', (req, res) => {
    try {
        const { custNo } = req.params;
        const { step = 1, feedback = {} } = req.body;

        console.log(`生成${step === 1 ? '第一次' : '第二次'}推荐:`, custNo, feedback);

        const customer = customers.find(c => c.cust_no === custNo);
        if (!customer) {
            return res.status(404).json({
                error: '客户不存在',
                message: `客户号 ${custNo} 未找到`
            });
        }

        let recommendations;

        if (step === 1) {
            // 第一次推荐
            recommendations = generateRecommendations(customer);
        } else {
            // 第二次推荐（基于反馈）
            recommendations = generateSecondStepRecommendations(customer, feedback);
        }

        res.json({
            success: true,
            step: step,
            recommendations: recommendations,
            customer: {
                name: customer.cust_no,
                age: calculateAge(customer.birth_ym),
                customer_level: getCustomerLevel(customer)
            }
        });

    } catch (error) {
        console.error('生成推荐失败:', error);
        res.status(500).json({
            error: '推荐失败',
            message: error.message
        });
    }
});

// 获取所有客户列表
app.get('/api/customers', (req, res) => {
    try {
        const customerList = customers.map(customer => {
            const customerEvents = events.filter(e => e.cust_no === customer.cust_no);
            return {
                cust_no: customer.cust_no,
                age: calculateAge(customer.birth_ym),
                gender: customer.gender,
                location: customer.loc_cd,
                product_count: [...new Set(customerEvents.map(e => e.prod_id))].length,
                success_rate: customerEvents.length > 0 ?
                    customerEvents.filter(e => ['A', 'B'].includes(e.event_type)).length / customerEvents.length : 0,
                last_activity: customerEvents.length > 0 ?
                    Math.max(...customerEvents.map(e => new Date(e.event_date))) : null
            };
        }).sort((a, b) => b.success_rate - a.success_rate).slice(0, 20);

        res.json({
            success: true,
            customers: customerList,
            total_count: customers.length
        });

    } catch (error) {
        console.error('获取客户列表失败:', error);
        res.status(500).json({
            error: '获取失败',
            message: error.message
        });
    }
});

// 生成用户报告
app.post('/api/report/:custNo', (req, res) => {
    try {
        const { custNo } = req.params;

        const customer = customers.find(c => c.cust_no === custNo);
        if (!customer) {
            return res.status(404).json({
                error: '客户不存在',
                message: `客户号 ${custNo} 未找到`
            });
        }

        const customerEvents = events.filter(e => e.cust_no === custNo);
        const customerFeatures = calculateCustomerFeatures(customer, customerEvents);
        const recommendations = generateRecommendations(customer);
        const marketingTags = generateMarketingTags(customerFeatures, customerEvents);

        const report = generateDetailedReport(customer, customerEvents, customerFeatures, recommendations, marketingTags);

        res.json({
            success: true,
            report: report,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('生成报告失败:', error);
        res.status(500).json({
            error: '报告生成失败',
            message: error.message
        });
    }
});

// 产品信息API
app.get('/api/products', (req, res) => {
    try {
        const products = Object.values(productFeatures).map(product => ({
            product_id: product.product_id,
            name: product.name,
            category: product.category,
            risk_level: product.risk_level,
            description: product.description,
            customer_count: product.customer_count,
            success_rate: product.success_rate,
            avg_amount: product.avg_amount,
            confidence: product.success_rate > 0.3 ? 'high' : product.success_rate > 0.15 ? 'medium' : 'low'
        }));

        res.json({
            success: true,
            products: products,
            total_count: products.length
        });

    } catch (error) {
        console.error('获取产品信息失败:', error);
        res.status(500).json({
            error: '获取失败',
            message: error.message
        });
    }
});

// 业务逻辑函数

// 计算客户年龄
function calculateAge(birth_ym) {
    try {
        const birthYear = parseInt(birth_ym.split('-')[0]);
        return new Date().getFullYear() - birthYear;
    } catch {
        return 0;
    }
}

// 计算客户特征
function calculateCustomerFeatures(customer, customerEvents) {
    const currentYear = new Date().getFullYear();
    const birthYear = parseInt(customer.birth_ym.split('-')[0]);
    const age = currentYear - birthYear;

    const initDate = new Date(customer.init_dt);
    const tenureDays = Math.floor((new Date() - initDate) / (1000 * 60 * 60 * 24));

    const productCount = [...new Set(customerEvents.map(e => e.prod_id))].length;
    const successEvents = customerEvents.filter(e => ['A', 'B'].includes(e.event_type)).length;
    const successRate = customerEvents.length > 0 ? successEvents / customerEvents.length : 0;

    // 计算平均风险偏好
    const productRisks = customerEvents.map(e => {
        const product = productFeatures[e.prod_id];
        return product ? product.risk_level : 2;
    });
    const avgRiskPreference = productRisks.length > 0 ?
        productRisks.reduce((sum, risk) => sum + risk, 0) / productRisks.length : 2;

    // 计算活跃度
    const recentEvents = customerEvents.filter(e => {
        const eventDate = new Date(e.event_date);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return eventDate > threeMonthsAgo;
    });

    return {
        age,
        tenureDays,
        productCount,
        successEvents,
        success_rate: successRate,
        avg_risk_preference: avgRiskPreference,
        recent_activity_count: recentEvents.length,
        total_events: customerEvents.length,
        customer_level: getCustomerLevel(customer),
        engagement_level: getEngagementLevel(customerEvents)
    };
}

// 生成推荐算法
function generateRecommendations(customer) {
    const recommendations = [];
    const availableProducts = Object.values(productFeatures);

    availableProducts.forEach(product => {
        let score = 0.4; // 基础分数

        // 年龄匹配
        if (customer.age < 30 && product.category === 'credit') score += 0.2;
        if (customer.age > 50 && product.category === 'insurance') score += 0.2;
        if (customer.age > 60 && product.category === 'deposit') score += 0.15;

        // 风险偏好匹配
        const riskDiff = Math.abs(customer.avg_risk_preference - product.risk_level);
        if (riskDiff <= 1) score += 0.2;
        else if (riskDiff <= 2) score += 0.1;

        // 成功率影响
        if (customer.success_rate > 0.6 && product.success_rate > 0.3) score += 0.1;

        // 客户等级影响
        if (customer.customer_level === 'high_value' && product.risk_level >= 3) score += 0.1;
        if (customer.customer_level === 'new' && product.risk_level <= 2) score += 0.1;

        // 产品多样性考虑
        const hasSimilarProduct = customerEvents.some(e => {
            const eventProduct = productFeatures[e.prod_id];
            return eventProduct && eventProduct.category === product.category;
        });

        if (!hasSimilarProduct) score += 0.15;

        recommendations.push({
            product_id: product.product_id,
            product_name: product.name,
            category: product.category,
            risk_level: product.risk_level,
            confidence: Math.min(score, 0.95),
            reason: generateRecommendationReason(customer, product, score),
            expected_benefit: getExpectedBenefit(product),
            recommendation_type: getRecommendationType(customer, product),
            match_score: Math.round(score * 100)
        });
    });

    // 按置信度排序，返回前5个推荐
    return recommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);
}

// 生成第二步推荐（基于反馈）
function generateSecondStepRecommendations(customer, feedback) {
    // 这里应该基于用户的反馈调整推荐算法
    // 简化版本：如果用户对某个产品感兴趣，提高同类产品权重
    // 如果用户不感兴趣，降低该类产品权重

    const originalRecommendations = generateRecommendations(customer);

    return originalRecommendations.map(rec => {
        let adjustedConfidence = rec.confidence;

        // 基于反馈调整
        Object.entries(feedback).forEach(([productId, feedbackType]) => {
            if (productId === rec.product_id) {
                switch (feedbackType) {
                    case 'interested':
                        adjustedConfidence += 0.1;
                        break;
                    case 'not_interested':
                        adjustedConfidence -= 0.2;
                        break;
                    case 'already_have':
                        adjustedConfidence -= 0.3;
                        break;
                }
            }
        });

        return {
            ...rec,
            original_confidence: rec.confidence,
            adjusted_confidence: Math.max(0.1, Math.min(0.95, adjustedConfidence)),
            adjustment_reason: getAdjustmentReason(feedback, rec.product_id),
            feedback_applied: true
        };
    }).sort((a, b) => b.adjusted_confidence - a.adjusted_confidence);
}

// 生成营销标签
function generateMarketingTags(customerFeatures, customerEvents) {
    const tags = [];

    // 价值标签
    if (customerFeatures.customer_level === 'high_value') {
        tags.push({ name: '高价值客户', type: 'value', priority: 1 });
    }

    // 风险标签
    if (customerFeatures.avg_risk_preference > 3) {
        tags.push({ name: '高风险偏好', type: 'risk', priority: 1 });
    }

    // 潜力标签
    if (customerFeatures.customer_level === 'new' || customerFeatures.product_count < 3) {
        tags.push({ name: '成长潜力', type: 'potential', priority: 1 });
    }

    // 活跃度标签
    if (customerFeatures.engagement_level === 'high') {
        tags.push({ name: '高活跃客户', type: 'engagement', priority: 2 });
    } else if (customerFeatures.engagement_level === 'low') {
        tags.push({ name: '低活跃度', type: 'engagement', priority: 2 });
    }

    // 产品偏好标签
    const productTypes = [...new Set(customerEvents.map(e => {
        const product = productFeatures[e.prod_id];
        return product ? product.category : 'other';
    }))];

    if (productTypes.length > 3) {
        tags.push({ name: '产品多样化', type: 'preference', priority: 2 });
    }

    if (productTypes.includes('investment')) {
        tags.push({ name: '投资偏好', type: 'preference', priority: 2 });
    }

    return tags;
}

// 生成详细报告
function generateDetailedReport(customer, events, customerFeatures, recommendations, tags) {
    const report = {
        customer_overview: {
            basic_info: {
                customer_id: customer.cust_no,
                age: customerFeatures.age,
                gender: customer.gender,
                location: customer.loc_cd,
                education: customer.edu_bg || '未知',
                marital_status: customer.marriage_situ_cd || '未知'
            },
            account_info: {
                open_date: customer.init_dt,
                tenure_days: customerFeatures.tenure_days,
                customer_level: customerFeatures.customer_level,
                engagement_level: customerFeatures.engagement_level
            },
            business_summary: {
                total_products: customerFeatures.product_count,
                success_events: customerFeatures.success_events,
                success_rate: `${(customerFeatures.success_rate * 100).toFixed(2)}%`,
                risk_preference: customerFeatures.avg_risk_preference > 2 ? '高风险' : '稳健型'
            }
        },

        product_analysis: {
            current_portfolio: {
                product_types: [...new Set(events.map(e => {
                    const product = productFeatures[e.prod_id];
                    return product ? product.category : 'other';
                }))],
                total_transactions: events.length,
                total_value: events.reduce((sum, e) => sum + parseFloat(e.event_amt || 0), 0),
                avg_transaction_value: events.length > 0 ?
                    events.reduce((sum, e) => sum + parseFloat(e.event_amt || 0), 0) / events.length : 0
            },
            product_diversity: {
                variety_score: customerFeatures.product_count,
                risk_distribution: analyzeRiskDistribution(events, productFeatures)
            },
            behavior_patterns: {
                recent_activity: customerFeatures.recent_activity_count,
                peak_season: analyzePeakSeason(events),
                product_lifecycle: analyzeProductLifecycle(events)
            }
        },

        recommendation_analysis: {
            top_recommendations: recommendations.slice(0, 3).map(rec => ({
                product_name: rec.product_name,
                confidence: `${(rec.confidence * 100).toFixed(1)}%`,
                match_score: rec.match_score,
                reason: rec.reason,
                expected_benefit: rec.expected_benefit,
                recommendation_type: rec.recommendation_type
            })),
            strategy_rationale: '基于客户特征、行为模式和产品匹配度的综合分析',
            confidence_factors: [
                '客户年龄匹配',
                '风险偏好匹配',
                '历史成功率',
                '产品多样性考虑'
            ]
        },

        marketing_tags: tags,

        future_expectations: {
            short_term: {
                timeframe: '3-6个月',
                likely_products: recommendations.slice(0, 2).map(r => r.product_name),
                expected_response: '中等到高响应率'
            },
            medium_term: {
                timeframe: '6-12个月',
                financial_goals: '基于客户年龄和风险偏好的财富增值',
                product_evolution: '产品组合优化和深度化'
            },
            long_term: {
                timeframe: '1-3年',
                loyalty_prediction: customerFeatures.engagement_level === 'high' ? '高忠诚度' : '需要重点维护',
                lifetime_value: calculateLifetimeValue(customerFeatures)
            }
        },

        action_plan: {
            immediate_actions: [
                '个性化推荐沟通',
                '产品介绍和优势说明',
                '风险评估和合适度匹配'
            ],
            medium_term_actions: [
                '定期回访和满意度调查',
                '产品使用指导和支持',
                '交叉销售机会识别'
            ],
            long_term_actions: [
                '客户关系维护',
                '产品组合优化建议',
                '定期财务规划更新'
            ]
        },

        expected_outcomes: {
            conversion_rate: predictConversionRate(customerFeatures),
            revenue_potential: predictRevenuePotential(recommendations, customerFeatures),
            customer_satisfaction: predictSatisfaction(customerFeatures),
            cross_sell_opportunity: calculateCrossSellOpportunity(customerFeatures, recommendations)
        }
    };

    return report;
}

// 辅助函数

// 获取客户等级
function getCustomerLevel(customer) {
    const events = events.filter(e => e.cust_no === customer.cust_no);
    const successEvents = events.filter(e => ['A', 'B'].includes(e.event_type));

    if (successEvents > 10) return 'high_value';
    if (successEvents > 5) return 'medium_value';
    if (events.length > 3) return 'regular';
    return 'new';
}

// 获取参与度级别
function getEngagementLevel(events) {
    const recentEvents = events.filter(e => {
        const eventDate = new Date(e.event_date);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return eventDate > threeMonthsAgo;
    });

    if (recentEvents.length > 5) return 'high';
    if (recentEvents.length > 2) return 'medium';
    return 'low';
}

// 生成推荐理由
function generateRecommendationReason(customerFeatures, product, score) {
    const reasons = [];

    if (score > 0.8) reasons.push('高度匹配您的需求和风险偏好');

    if (customerFeatures.age < 35 && product.category === 'credit') {
        reasons.push('适合年轻人的消费便利需求');
    }

    if (customerFeatures.age > 50 && product.category === 'insurance') {
        reasons.push('为您的退休生活提供保障');
    }

    if (customerFeatures.customer_level === 'high_value' && product.risk_level >= 3) {
        reasons.push('适合您的高风险承受能力');
    }

    if (customerFeatures.success_rate > 0.6) {
        reasons.push('基于您的成功业务记录推荐');
    }

    if (customerFeatures.product_count < 2) {
        reasons.push('扩展您的产品组合');
    }

    return reasons.join('；') || '基于综合评估推荐';
}

// 获取预期收益
function getExpectedBenefit(product) {
    switch (product.category) {
        case 'investment':
            return `预期年化收益 ${(product.success_rate * 100).toFixed(2)}%`;
        case 'credit':
            return '消费便利 + 积分返现';
        case 'deposit':
            return '本金安全 + 稳定收益';
        case 'insurance':
            return '风险保障 + 安心保障';
        default:
            return '综合金融服务';
    }
}

// 获取推荐类型
function getRecommendationType(customerFeatures, product) {
    const hasSimilarProduct = false; // 简化版本，需要检查实际产品

    if (!hasSimilarProduct && customerFeatures.product_count === 0) {
        return '首次推荐';
    } else if (hasSimilarProduct) {
        return '产品升级';
    } else {
        return '交叉销售';
    }
}

// 获取调整原因
function getAdjustmentReason(feedback, productId) {
    const feedbackType = feedback[productId];

    switch (feedbackType) {
        case 'interested':
            return '用户表现出兴趣，提升推荐优先级';
        case 'not_interested':
            return '用户不感兴趣，降低推荐优先级';
        case 'already_have':
            return '用户已有同类产品，调整推荐策略';
        default:
            return '无调整';
    }
}

// 预测转化率
function predictConversionRate(customerFeatures) {
    let baseRate = 0.15; // 基础转化率

    if (customerFeatures.customer_level === 'high_value') baseRate += 0.1;
    if (customerFeatures.engagement_level === 'high') baseRate += 0.05;
    if (customerFeatures.success_rate > 0.6) baseRate += 0.08;

    return Math.min(baseRate, 0.8);
}

// 预测收入潜力
function predictRevenuePotential(recommendations, customerFeatures) {
    const avgProductValue = 50000; // 简化的平均产品价值
    const expectedConversion = predictConversionRate(customerFeatures);

    return recommendations.slice(0, 3).length * avgProductValue * expectedConversion;
}

// 预测满意度
function predictSatisfaction(customerFeatures) {
    let satisfaction = 0.7; // 基础满意度

    if (customerFeatures.engagement_level === 'high') satisfaction += 0.1;
    if (customerFeatures.customer_level === 'high_value') satisfaction += 0.15;
    if (customerFeatures.avg_risk_preference <= 2) satisfaction += 0.05;

    return Math.min(satisfaction, 0.95);
}

// 计算交叉销售机会
function calculateCrossSellOpportunity(customerFeatures, recommendations) {
    const currentProductTypes = new Set();
    events.forEach(e => {
        const product = productFeatures[e.prod_id];
        if (product) {
            currentProductTypes.add(product.category);
        }
    });

    const recommendedTypes = new Set(recommendations.map(r => r.category));

    return recommendedTypes.size - currentProductTypes.size;
}

// 计算终身价值
function calculateLifetimeValue(customerFeatures) {
    const annualValue = 12000; // 简化的年价值
    const years = Math.min(20, customerFeatures.tenure_days / 365);

    return annualValue * years;
}

// 其他辅助函数
function analyzeRiskDistribution(events, productFeatures) {
    const risks = events.map(e => {
        const product = productFeatures[e.prod_id];
        return product ? product.risk_level : 2;
    });

    const avgRisk = risks.length > 0 ?
        risks.reduce((sum, risk) => sum + risk, 0) / risks.length : 2;

    return `平均风险等级: ${avgRisk.toFixed(1)}（1=低风险, 4=高风险）`;
}

function analyzePeakSeason(events) {
    const monthCounts = {};

    events.forEach(event => {
        const month = new Date(event.event_date).getMonth() + 1;
        monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    const maxMonth = Object.entries(monthCounts)
        .sort((a, b) => b[1] - a[1])[0][0];

    return `第${maxMonth}月最活跃`;
}

function analyzeProductLifecycle(events) {
    const eventTypes = ['A', 'B', 'D'];
    const typeCounts = {};

    eventTypes.forEach(type => {
        typeCounts[type] = events.filter(e => e.event_type === type).length;
    });

    return {
        new_products: typeCounts['A'] || 0,
        active_products: typeCounts['B'] || 0,
        closed_products: typeCounts['D'] || 0
    };
}

// 启动服务器
async function startServer() {
    try {
        await loadData();

        app.listen(PORT, () => {
            console.log(`服务器运行在 http://localhost:${PORT}`);
            console.log('API端点已准备就绪');
            console.log('POST /api/recommendations/:custNo - 生成推荐');
            console.log('GET /api/customers/:custNo - 搜索客户');
            console.log('POST /api/report/:custNo - 生成报告');
        });

    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
}

// 启动服务器
startServer();