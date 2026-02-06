# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

**English version**: [CLAUDE.md](CLAUDE.md)

## 系统概述

这是一个综合性的**智能金融产品推荐系统**，实现了先进的产品推荐机器学习算法，采用两阶段优化策略。系统结合了 Node.js 后端服务、现代化 Web 前端和复杂的基于 Python 的推荐引擎。

## 开发命令

### Node.js 后端
```bash
# 安装依赖
npm install

# 启动主推荐服务器（端口 3001）
node smart_recommendation_server.js

# 启动演示服务器（端口 3000）
node demo_server.js

# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

### Python 机器学习组件
```bash
# 运行增强推荐系统
python python_algorithms/enhanced_recommendation_system.py

# 运行完整的多步推荐流程
python python_algorithms/multi_step_recommendation_system.py

# 快速演示
python python_algorithms/quick_demo.py

# 产品分析测试
python python_algorithms/test_product_analysis.py
```

### 前端访问
```bash
# 在浏览器中打开（无需构建过程）
open smart_recommendation_frontend.html
open new_product_analysis.html
```

## 架构概述

### 后端服务器
- **smart_recommendation_server.js**: 主服务器，具备增强推荐引擎（端口 3001）
- **demo_server.js**: 基础演示服务器（端口 3000）
- **server.js**: 入口点服务器
- **enhanced_recommendation_server*.js**: 高级机器学习驱动服务器
- **real_data_server*.js**: 真实数据处理服务器

### 前端界面
- **smart_recommendation_frontend.html**: 主客户推荐界面
- **new_product_analysis.html**: 产品分析和冲突检测界面

### Python 算法模块
- **enhanced_recommendation_system.py**: 核心两步推荐算法，实现 50%+ 准确率提升
- **user_profiling_module.py**: 客户行为分析和细分
- **product_association_analysis.py**: 产品关系映射和冲突检测
- **pattern_matching_engine.py**: 用户-产品匹配算法
- **strategy_selection_matrix.py**: 战略决策框架
- **ab_testing_framework.py**: A/B 测试和验证

## 核心技术概念

### 两步推荐算法
1. **第一步**: 基于客户人口统计、历史行为和产品特征的初始推荐
2. **第二步**: 基于反馈的优化，动态调整权重
3. **目标**: 相比第一步实现 50%+ 的准确率提升

### 数据模型
- **客户**: cust_no, birth_ym, loc_cd, gender, init_dt, edu_bg, marriage_situ_cd
- **事件**: cust_no, prod_id, event_id, event_type (A/B/D), event_level, event_date, event_term, event_rate, event_amt
- **产品**: product_id, category (信贷/储蓄/财富/保险), risk_level (1-4), success_rate, avg_amount

### API 端点
- `GET /api/health` - 系统健康检查
- `GET /api/customers/:custNo` - 客户档案和推荐
- `POST /api/customers/:custNo/feedback` - 提交反馈（interested/not_interested/already_have）
- `POST /api/products/new-product-analysis` - 新产品分析
- `GET /api/products` - 列出所有产品

## 测试

### 预配置测试客户
- `CDB91DCCE198B10A522FE2AABF6A8D81`: 82岁男性，高价值，保守型
- `9307AC85C179D8E388DC776DB6283534`: 38岁女性，年轻专业人士
- `9FA3282573CEB37A5E9BC1C38088087F`: 74岁男性，退休导向型
- `CB0D6827A924C7FFDD9DD57BF5CE9358`: 73岁女性，老年，稳定收入
- `797E3448CF516A52ADBE6DB33626B50E`: 67岁男性，退休前，平衡型

### 健康检查
```bash
curl http://localhost:3001/api/health
```

## 重要实现说明

- 系统使用基于 CSV 的数据存储，位于 `/data/` 目录
- 前端为纯 HTML/CSS/JavaScript，无需构建过程
- Python 模块需要 pandas、numpy、scikit-learn、imbalanced-learn 依赖
- 服务器支持 CORS 跨域请求
- 推荐算法包含产品冲突检测（15+ 种冲突类型）
- 营销模型使用 SMOTE/ADASYN 技术处理不平衡数据

## 端口配置
- 主服务器: 3001
- 演示服务器: 3000
- 前端: 任何静态文件服务器或直接文件访问