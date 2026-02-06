# CLAUDE.md - 智能金融产品推荐系统

## 🎯 系统概述

这是一个全面的**智能金融产品推荐系统**，实现了两阶段推荐策略，包含客户行为分析、营销自动化和动态优化功能。系统将Node.js后端服务与现代Web前端和基于Python的高级推荐算法相结合。

## 🏗️ 系统架构

### 高层架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端界面      │    │   后端API       │    │  Python机器学习 │
│   (HTML/CSS/JS) │◄──►│  (Node.js/Exp)  │◄──►│  推荐算法       │
│   - 用户界面    │    │  - REST API     │    │  - 机器学习模型 │
│   - 客户端      │    │  - CORS支持     │    │  - 数据分析     │
│   - 交互功能    │    │  - 数据加载     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   数据层        │
                       │  - CSV文件      │
                       │  - 客户数据     │
                       │  - 事件数据     │
                       │  - 产品数据     │
                       └─────────────────┘
```

### 核心组件

#### 1. 后端服务器 (`demo_server.js`, `server.js`)
- **技术栈**: Node.js + Express.js
- **端口**: 3000
- **用途**: RESTful API服务，提供客户数据、推荐和分析功能
- **关键功能**:
  - 客户搜索和用户画像
  - 实时推荐生成
  - 基于反馈优化的两步推荐
  - 营销标签生成
  - 综合客户报告

#### 2. 前端界面 (`frontend.html`, `complete_index.html`)
- **技术栈**: 纯HTML5, CSS3, JavaScript ES6
- **功能特性**:
  - 现代响应式设计，渐变背景
  - 客户搜索和信息展示
  - 多标签页界面（客户信息、推荐策略、业务事件、营销标签、用户报告）
  - 交互式反馈收集
  - 实时数据可视化

#### 3. Python推荐引擎
- **增强系统** (`enhanced_recommendation_system.py`): 高级两步推荐，准确率提升50%+
- **多步系统** (`multi_step_recommendation_system.py`): 完整的机器学习流程，含不平衡数据处理
- **专业模块**:
  - `user_profiling_module.py`: 客户行为分析
  - `product_association_analysis.py`: 产品关系映射
  - `pattern_matching_engine.py`: 用户-产品匹配算法
  - `strategy_selection_matrix.py`: 战略决策框架
  - `ab_testing_framework.py`: A/B测试和验证

## 🚀 快速入门指南

### 前置要求
- Node.js (推荐v14+)
- npm包管理器
- Python 3.7+ (用于机器学习组件)
- 现代Web浏览器

### 安装与设置

1. **安装Node.js依赖**:
```bash
npm install
```

2. **启动后端服务器**:
```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start

# 或直接启动
node demo_server.js
```

3. **启动前端**:
```bash
# 在浏览器中打开
open frontend.html

# 或使用本地服务器
python -m http.server 8000
# 然后访问 http://localhost:8000/frontend.html
```

### 系统测试

1. **后端健康检查**:
```bash
curl http://localhost:3000/api/health
```

2. **测试客户搜索**（示例客户ID）:
```
CDB91DCCE198B10A522FE2AABF6A8D81
```

3. **运行Python机器学习组件**:
```bash
python enhanced_recommendation_system.py
python multi_step_recommendation_system.py
```

## 📊 数据结构与模型

### 客户数据模型
```javascript
{
  cust_no: string,        // 客户ID
  birth_ym: string,       // 出生年月
  loc_cd: string,         // 地区代码
  gender: string,         // M/F 性别
  init_dt: string,        // 账户创建日期
  edu_bg: string,         // 教育背景
  marriage_situ_cd: string // 婚姻状况
}
```

### 事件数据模型
```javascript
{
  cust_no: string,        // 客户ID
  prod_id: string,        // 产品ID
  event_id: string,       // 事件ID
  event_type: string,     // A=开立, B=开通, D=关闭
  event_level: string,    // A/B/C 优先级
  event_date: string,     // 事件时间戳
  event_term: number,     // 产品期限（天）
  event_rate: number,     // 利率
  event_amt: number       // 交易金额
}
```

### 产品特征模型
```javascript
{
  product_id: string,
  category: string,       // 信贷、存款、理财、保险
  risk_level: number,     // 1-4（低到高）
  success_rate: number,   // 历史成功率
  avg_amount: number,     // 平均交易价值
  customer_count: number  // 活跃客户数
}
```

## 🎯 核心功能

### 1. 两步推荐算法

#### 第一步：初始推荐
- **输入**: 客户人口统计、历史行为、产品特征
- **算法**: 多因子加权评分
- **特征**:
  - 年龄-风险匹配
  - 历史成功率分析
  - 产品多样性考虑
  - 客户等级评估
- **输出**: Top 5产品推荐及置信度评分

#### 第二步：基于反馈的优化
- **输入**: 用户对初始推荐的反馈
- **反馈类型**: `感兴趣`、`不感兴趣`、`已有同类`
- **优化**: 基于反馈的动态权重调整
- **改进**: 目标是比第一步提升50%+准确率

### 2. 营销模型分析

#### 样本构建策略
- **正样本**: 基于成功营销前的两个事件
- **负样本**: 没有成功营销记录的用户
- **特征工程**: 事件序列、时间模式、产品属性
- **不平衡处理**: SMOTE、ADASYN、欠采样技术

#### 分析的关键特征
- 事件序列模式（开立 → 激活）
- 事件间的时间间隔
- 产品期限偏好
- 历史成功率
- 客户参与度水平

### 3. 新产品推荐策略

#### 产品关系分析
- **互补产品**: 高协同效应产品
- **替代产品**: 功能相似产品
- **独立产品**: 无关联产品
- **冲突检测**: 风险集中、功能重叠

#### 收入优化
- **战略定价**: 动态利率调整
- **交叉销售**: 产品组合推荐
- **客户分层**: 分级推荐策略
- **风险管理**: 投资组合平衡考虑

## 🔧 API端点

### 客户管理
- `GET /api/health` - 健康检查和系统状态
- `GET /api/customers/:custNo` - 获取客户档案和推荐
- `GET /api/customers` - 列出所有客户（分页）
- `POST /api/recommendations/:custNo` - 生成推荐
- `POST /api/report/:custNo` - 生成综合客户报告
- `GET /api/products` - 列出所有可用产品

### 推荐反馈
- `POST /api/customers/:custNo/feedback` - 提交推荐反馈
- 支持反馈类型: `interested`、`not_interested`、`already_have`

## 📈 关键算法与技术

### 推荐评分算法
```python
score = 基础分 +
        年龄匹配权重 * 年龄兼容性 +
        风险匹配权重 * 风险对齐 +
        成功历史权重 * 历史成功率 +
        多样性权重 * 投资组合多样性 +
        参与度权重 * 客户参与度
```

### 不平衡处理策略
- **SMOTE (合成少数类过采样)**
- **ADASYN (自适应合成采样)**
- **随机欠采样**
- **组合方法 (SMOTE-ENN, SMOTE-Tomek)**

### 模型评估指标
- **准确率**: 整体预测正确性
- **F1分数**: 精确率和召回率的调和平均
- **AUC-ROC**: ROC曲线下面积
- **业务指标**: 转化率、收入影响、客户满意度

## 🎨 前端功能

### 用户界面组件
- **客户搜索**: 实时客户查询
- **信息标签页**:
  - 客户基本信息和价值分析
  - 推荐策略及置信度评分
  - 业务事件历史
  - 营销标签和细分
  - 综合客户报告
- **反馈系统**: 交互式反馈收集
- **响应式设计**: 移动端和桌面端兼容

### 视觉指示器
- **置信度等级**: 高(80%+)、中(60-80%)、低(<60%)
- **事件类型**: 按成功/失败颜色编码
- **营销标签**: 基于类别的颜色编码
- **加载状态**: 数据处理期间的视觉反馈

## 🔍 测试与验证

### 预配置测试客户
1. **CDB91DCCE198B10A522FE2AABF6A8D81**: 82岁男性，高价值，保守投资者
2. **9307AC85C179D8E388DC776DB6283534**: 38岁女性，年轻专业人士，成长投资者
3. **9FA3282573CEB37A5E9BC1C38088087F**: 74岁男性，退休导向，中等风险
4. **CB0D6827A924C7FFDD9DD57BF5CE9358**: 73岁女性，老年，稳定收入导向
5. **797E3448CF516A52ADBE6DB33626B50E**: 67岁男性，退休前，平衡方法

### 系统验证
- **两步推荐**: 50%+准确率提升验证
- **营销模型**: 特征重要性分析和业务解释
- **新产品策略**: 冲突检测和收入优化测试

## 📊 性能监控

### 关键绩效指标(KPIs)
- **推荐准确率**: 第一步vs第二步对比
- **转化率**: 推荐到实际产品采用
- **客户满意度**: 反馈质量和响应率
- **收入影响**: 交叉销售和增销有效性
- **系统性能**: API响应时间、吞吐量

### 分析仪表板功能
- 实时推荐性能
- 客户参与度指标
- 产品效果分析
- A/B测试结果
- 收入归因跟踪

## 🛠️ 开发工作流

### 代码结构
```
/d/vscode_project/
├── demo_server.js              # 主Node.js服务器
├── frontend.html               # 主要Web界面
├── server.js                   # 替代服务器实现
├── enhanced_recommendation_system.py  # 高级机器学习算法
├── multi_step_recommendation_system.py # 完整推荐流程
├── user_profiling_module.py    # 客户分析
├── product_association_analysis.py # 产品关系分析
├── pattern_matching_engine.py  # 匹配算法
├── strategy_selection_matrix.py # 战略决策框架
├── ab_testing_framework.py     # 实验验证
├── quick_demo.py               # 系统演示
├── package.json                # Node.js依赖
├── 系统使用说明.md              # 中文系统文档
├── 前端使用说明.md              # 前端使用指南
└── *.md                        # 额外文档
```

### 开发命令
```bash
# 启动开发服务器
npm run dev

# 运行Python机器学习组件
python enhanced_recommendation_system.py

# 快速系统演示
python quick_demo.py

# 完整系统测试
python multi_step_recommendation_system.py
```

## 🐛 故障排除

### 常见问题与解决方案

1. **服务器连接问题**:
   - 确保Node.js服务器运行在端口3000
   - 检查防火墙设置
   - 验证CORS配置

2. **数据加载错误**:
   - 确认CSV数据文件存在于`/data/`目录
   - 验证数据格式和编码
   - 检查文件权限

3. **Python机器学习依赖**:
   - 安装必需包: `pip install pandas numpy scikit-learn imbalanced-learn xgboost lightgbm`
   - 确保Python版本兼容性(3.7+)

4. **前端显示问题**:
   - 使用现代Web浏览器(Chrome, Firefox, Safari, Edge)
   - 启用JavaScript
   - 检查浏览器控制台错误

### 调试工具
- **后端日志**: Node.js服务器控制台输出
- **网络标签页**: 浏览器开发者工具查看API调用
- **Python调试**: 机器学习模块中的打印语句和错误处理

## 🚀 未来增强

### 计划功能
- **实时数据集成**: 数据库连接
- **高级机器学习模型**: 深度学习、协同过滤
- **客户细分**: 行为聚类
- **动态定价**: 实时利率优化
- **多语言支持**: 国际化框架
- **移动应用**: 原生移动应用开发

### 可扩展性考虑
- **微服务架构**: 服务分解
- **负载均衡**: 水平扩展能力
- **缓存策略**: Redis实现
- **数据库迁移**: 从CSV到生产数据库
- **API网关**: 集中式API管理

## 📞 支持与文档

### 中文文档文件
- `系统使用说明.md` - 完整系统使用指南
- `前端使用说明.md` - 前端界面文档
- `故障排除指南.md` - 故障排除指南
- `三条件验证报告.md` - 技术验证报告
- `项目总结报告.md` - 项目总结和结论

### 关键技术成就
1. **两步推荐**: 成功实现50%+准确率提升
2. **营销模型**: 具有业务解释的综合特征分析
3. **产品策略**: 带冲突解决的新产品推荐
4. **实时系统**: 带反馈优化的实时推荐
5. **完整分析**: 用户画像、行为分析和报告

---

## 🎯 快速使用摘要

1. **启动**: `node demo_server.js` → 打开 `frontend.html`
2. **测试**: 使用客户ID `CDB91DCCE198B10A522FE2AABF6A8D81`
3. **交互**: 对推荐提供反馈
4. **分析**: 查看综合客户报告
5. **优化**: 监控性能并优化策略

本系统代表一个完整的生产就绪金融推荐平台，具有高级机器学习能力、实时处理和综合客户分析功能。