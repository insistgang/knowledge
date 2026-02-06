"""
策略选择矩阵 - 多场景推荐策略
针对不同场景和用户群体，定义策略选择矩阵，将推荐问题特征与最佳算法模式系统关联
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.model_selection import cross_val_score
import warnings
warnings.filterwarnings('ignore')

class StrategySelectionMatrix:
    """策略选择矩阵"""

    def __init__(self):
        self.strategy_matrix = {}
        self.scenario_detectors = {}
        self.algorithms = {}
        self.performance_history = {}
        self.initialize_strategies()
        self.initialize_algorithms()

    def initialize_strategies(self):
        """初始化推荐策略"""
        self.strategy_matrix = {
            # 新用户策略
            'new_user_low_risk': {
                'algorithms': ['collaborative_filtering', 'content_based', 'popularity_based'],
                'weights': [0.3, 0.5, 0.2],
                'features': ['demographics', 'similar_users', 'popular_products'],
                'expected_ctr': 0.05,
                'business_priority': 'customer_acquisition'
            },
            'new_user_high_risk': {
                'algorithms': ['rule_based', 'content_based', 'conservative_portfolio'],
                'weights': [0.5, 0.3, 0.2],
                'features': ['risk_profile', 'basic_products', 'regulatory_compliance'],
                'expected_ctr': 0.03,
                'business_priority': 'risk_management'
            },

            # 活跃用户策略
            'active_user_cross_sell': {
                'algorithms': ['collaborative_filtering', 'association_rules', 'sequence_prediction'],
                'weights': [0.4, 0.4, 0.2],
                'features': ['behavior_history', 'product_associations', 'life_stage_changes'],
                'expected_ctr': 0.12,
                'business_priority': 'revenue_growth'
            },
            'active_user_up_sell': {
                'algorithms': ['gradient_boosting', 'deep_learning', 'behavioral_clustering'],
                'weights': [0.5, 0.3, 0.2],
                'features': ['engagement_metrics', 'premium_indicators', 'affinity_scoring'],
                'expected_ctr': 0.08,
                'business_priority': 'profitability'
            },

            # 沉睡用户策略
            'dormant_user_reactivation': {
                'algorithms': ['survival_analysis', 'lstm_prediction', 'incentive_optimization'],
                'weights': [0.4, 0.3, 0.3],
                'features': ['dormancy_reasons', 'reactivation_triggers', 'optimal_timing'],
                'expected_ctr': 0.04,
                'business_priority': 'retention'
            },
            'churn_risk_user': {
                'algorithms': ['churn_prediction', 'intervention_optimization', 'loyalty_programs'],
                'weights': [0.6, 0.3, 0.1],
                'features': ['churn_indicators', 'intervention_effectiveness', 'customer_value'],
                'expected_ctr': 0.15,
                'business_priority': 'retention'
            },

            # 高价值用户策略
            'vip_user_personalized': {
                'algorithms': ['reinforcement_learning', 'multi_arm_bandit', 'human_curator'],
                'weights': [0.4, 0.3, 0.3],
                'features': ['personal_preferences', 'relationship_history', 'exclusive_offers'],
                'expected_ctr': 0.25,
                'business_priority': 'relationship_management'
            },
            'mass_market_user': {
                'algorithms': ['collaborative_filtering', 'market_basket_analysis', 'segment_based'],
                'weights': [0.5, 0.3, 0.2],
                'features': ['segment_preferences', 'popular_combinations', 'seasonal_trends'],
                'expected_ctr': 0.08,
                'business_priority': 'scale_efficiency'
            },

            # 新产品策略
            'new_product_launch': {
                'algorithms': ['cold_start_embedding', 'similar_product_mapping', 'early_adopter_targeting'],
                'weights': [0.4, 0.4, 0.2],
                'features': ['product_similarity', 'innovation_adoption', 'market_positioning'],
                'expected_ctr': 0.06,
                'business_priority': 'product_adoption'
            },
            'mature_product_optimization': {
                'algorithms': ['portfolio_optimization', 'lifecycle_management', 'competitive_positioning'],
                'weights': [0.5, 0.3, 0.2],
                'features': ['maturity_indicators', 'cross_sell_opportunities', 'market_saturation'],
                'expected_ctr': 0.10,
                'business_priority': 'market_share'
            }
        }

    def initialize_algorithms(self):
        """初始化推荐算法"""
        self.algorithms = {
            'collaborative_filtering': {
                'model': None,  # 可以替换为具体的CF模型
                'type': 'memory_based',
                'complexity': 'medium',
                'data_requirements': ['user_item_interactions'],
                'strengths': ['personalization', 'serendipity'],
                'weaknesses': ['cold_start', 'data_sparsity']
            },
            'content_based': {
                'model': None,  # 可以替换为具体的CB模型
                'type': 'feature_based',
                'complexity': 'low',
                'data_requirements': ['item_features', 'user_preferences'],
                'strengths': ['transparency', 'cold_start_resistant'],
                'weaknesses': ['limited_serendipity', 'feature_quality_dependency']
            },
            'rule_based': {
                'model': None,  # 可以替换为具体的规则引擎
                'type': 'knowledge_based',
                'complexity': 'low',
                'data_requirements': ['business_rules', 'expert_knowledge'],
                'strengths': ['explainability', 'control'],
                'weaknesses': ['rigidity', 'maintenance_overhead']
            },
            'gradient_boosting': {
                'model': GradientBoostingClassifier(),
                'type': 'ensemble_learning',
                'complexity': 'high',
                'data_requirements': ['labeled_data', 'features'],
                'strengths': ['accuracy', 'feature_importance'],
                'weaknesses': ['training_time', 'overfitting_risk']
            },
            'association_rules': {
                'model': None,  # 可以替换为Apriori或FP-Growth
                'type': 'pattern_mining',
                'complexity': 'medium',
                'data_requirements': ['transaction_data'],
                'strengths': ['interpretability', 'cross_sell_insights'],
                'weaknesses': ['computation_cost', 'sparsity_sensitivity']
            },
            'churn_prediction': {
                'model': RandomForestClassifier(),
                'type': 'classification',
                'complexity': 'medium',
                'data_requirements': ['behavior_history', 'churn_labels'],
                'strengths': ['proactive_retention', 'early_warning'],
                'weaknesses': ['label_quality_dependency', 'temporal_complexity']
            }
        }

    def detect_user_scenario(self, user_profile, user_history, current_context):
        """检测用户当前场景"""
        scenario_scores = {}

        # 新用户检测
        if len(user_history) < 3:
            risk_score = user_profile.get('risk_score', 0.5)
            if risk_score < 0.3:
                scenario_scores['new_user_low_risk'] = 0.8
            else:
                scenario_scores['new_user_high_risk'] = 0.8

        # 活跃度检测
        recent_activity = user_history.get('recent_events_count', 0)
        total_events = user_history.get('total_events', 0)
        activity_ratio = recent_activity / max(total_events, 1)

        if activity_ratio > 0.3 and total_events > 10:
            # 高活跃度用户
            product_variety = user_profile.get('product_variety', 1)
            if product_variety > 3:
                scenario_scores['active_user_cross_sell'] = 0.7
            else:
                scenario_scores['active_user_up_sell'] = 0.7

        # 沉睡用户检测
        last_activity_days = user_history.get('days_since_last_activity', 0)
        if last_activity_days > 90:
            churn_risk = user_profile.get('churn_probability', 0.1)
            if churn_risk > 0.5:
                scenario_scores['churn_risk_user'] = 0.8
            else:
                scenario_scores['dormant_user_reactivation'] = 0.8

        # VIP用户检测
        customer_value = user_profile.get('total_amount', 0)
        if customer_value > 100000:  # 高价值阈值
            scenario_scores['vip_user_personalized'] = 0.8
        else:
            scenario_scores['mass_market_user'] = 0.6

        # 新产品场景检测
        if current_context.get('new_product_launch', False):
            scenario_scores['new_product_launch'] = 0.9

        # 选择得分最高的场景
        if scenario_scores:
            return max(scenario_scores, key=scenario_scores.get), scenario_scores
        else:
            return 'mass_market_user', {'mass_market_user': 0.5}

    def select_strategy(self, user_id, user_profile, user_history, current_context):
        """选择推荐策略"""
        # 检测用户场景
        scenario, scores = self.detect_user_scenario(user_profile, user_history, current_context)

        # 获取对应策略
        if scenario in self.strategy_matrix:
            strategy = self.strategy_matrix[scenario].copy()
            strategy['scenario'] = scenario
            strategy['scenario_confidence'] = scores.get(scenario, 0.5)
            return strategy
        else:
            # 默认策略
            return {
                'scenario': 'mass_market_user',
                'algorithms': ['collaborative_filtering', 'content_based'],
                'weights': [0.6, 0.4],
                'features': ['basic_preferences', 'popular_items'],
                'expected_ctr': 0.08,
                'business_priority': 'customer_satisfaction',
                'scenario_confidence': 0.3
            }

    def adapt_strategy_for_feedback(self, strategy, feedback_history):
        """根据反馈历史调整策略"""
        adapted_strategy = strategy.copy()

        if feedback_history:
            # 计算反馈指标
            positive_rate = feedback_history.get('positive_rate', 0.1)
            response_rate = feedback_history.get('response_rate', 0.05)

            # 如果响应率低于预期，调整算法权重
            expected_ctr = strategy.get('expected_ctr', 0.1)
            if response_rate < expected_ctr * 0.5:
                # 响应率低，增加保守策略权重
                weights = adapted_strategy['weights']
                algorithms = adapted_strategy['algorithms']

                # 增加基于内容的推荐权重
                if 'content_based' in algorithms:
                    idx = algorithms.index('content_based')
                    weights[idx] *= 1.2

                # 减少复杂算法权重
                if 'gradient_boosting' in algorithms:
                    idx = algorithms.index('gradient_boosting')
                    weights[idx] *= 0.8

                # 归一化权重
                total_weight = sum(weights)
                adapted_strategy['weights'] = [w / total_weight for w in weights]

        return adapted_strategy

    def get_strategy_for_new_product(self, new_product_features, existing_products, user_segments):
        """为新产品获取推荐策略"""
        # 分析新产品特性
        product_risk_level = new_product_features.get('risk_level', 2)
        product_category = new_product_features.get('category', 'D')
        is_innovative = new_product_features.get('is_innovative', False)

        # 基于产品特性选择策略
        if is_innovative:
            return 'new_product_launch'
        elif product_risk_level > 3:
            return 'new_user_low_risk'  # 高风险产品需要保守策略
        elif product_category in ['A', 'C']:  # 财富类或信贷类
            return 'active_user_cross_sell'
        else:
            return 'mass_market_user'

    def evaluate_strategy_performance(self, strategy_id, recommendations, outcomes, metrics=['ctr', 'conversion', 'revenue']):
        """评估策略性能"""
        if not outcomes:
            return {}

        performance = {}
        total_recs = len(recommendations)
        positive_outcomes = sum(1 for outcome in outcomes if outcome.get('positive', False))

        # CTR (Click Through Rate)
        if 'ctr' in metrics:
            clicks = sum(1 for outcome in outcomes if outcome.get('clicked', False))
            performance['ctr'] = clicks / total_recs

        # Conversion Rate
        if 'conversion' in metrics:
            conversions = sum(1 for outcome in outcomes if outcome.get('converted', False))
            performance['conversion'] = conversions / total_recs

        # Revenue Performance
        if 'revenue' in metrics:
            total_revenue = sum(outcome.get('revenue', 0) for outcome in outcomes)
            performance['revenue'] = total_revenue / total_recs

        # 保存性能历史
        if strategy_id not in self.performance_history:
            self.performance_history[strategy_id] = []

        self.performance_history[strategy_id].append({
            'timestamp': pd.Timestamp.now(),
            'performance': performance,
            'sample_size': total_recs
        })

        return performance

    def get_best_strategy_for_context(self, context_features):
        """基于上下文特征获取最佳策略"""
        strategy_scores = {}

        for strategy_name, strategy_config in self.strategy_matrix.items():
            score = 0

            # 基于业务优先级评分
            business_priority = strategy_config.get('business_priority', '')
            if 'customer_acquisition' in context_features.get('goals', []) and business_priority == 'customer_acquisition':
                score += 2
            if 'risk_management' in context_features.get('constraints', []) and business_priority == 'risk_management':
                score += 2

            # 基于数据可用性评分
            required_features = strategy_config.get('features', [])
            available_features = context_features.get('available_features', [])
            feature_match = len(set(required_features) & set(available_features)) / len(required_features)
            score += feature_match * 2

            # 基于历史性能评分
            if strategy_name in self.performance_history:
                recent_performance = self.performance_history[strategy_name][-5:]  # 最近5次
                avg_ctr = np.mean([p['performance'].get('ctr', 0) for p in recent_performance])
                score += avg_ctr * 10

            strategy_scores[strategy_name] = score

        # 返回得分最高的策略
        if strategy_scores:
            best_strategy = max(strategy_scores, key=strategy_scores.get)
            return best_strategy, strategy_scores
        else:
            return 'mass_market_user', strategy_scores

    def generate_strategy_report(self):
        """生成策略性能报告"""
        report = {
            'total_strategies': len(self.strategy_matrix),
            'strategy_performance': {},
            'recommendations': []
        }

        for strategy_id, history in self.performance_history.items():
            if history:
                recent_performance = history[-10:]  # 最近10次
                avg_ctr = np.mean([p['performance'].get('ctr', 0) for p in recent_performance])
                avg_conversion = np.mean([p['performance'].get('conversion', 0) for p in recent_performance])

                report['strategy_performance'][strategy_id] = {
                    'avg_ctr': avg_ctr,
                    'avg_conversion': avg_conversion,
                    'total_executions': len(history),
                    'latest_performance': history[-1]['performance'] if history else {}
                }

        # 生成优化建议
        for strategy_id, performance in report['strategy_performance'].items():
            if performance['avg_ctr'] < 0.05:  # CTR低于5%
                report['recommendations'].append({
                    'strategy': strategy_id,
                    'issue': 'Low CTR performance',
                    'suggestion': 'Consider algorithm retuning or feature engineering',
                    'priority': 'high'
                })

        return report

def main():
    """主函数 - 测试策略选择矩阵"""
    print("开始测试策略选择矩阵...")

    # 初始化策略矩阵
    strategy_matrix = StrategySelectionMatrix()

    # 创建测试用户数据
    test_users = [
        {
            'user_id': 'USER_001',
            'profile': {
                'age': 25,
                'risk_score': 0.8,
                'product_variety': 1,
                'total_amount': 5000,
                'churn_probability': 0.1
            },
            'history': {
                'recent_events_count': 1,
                'total_events': 2,
                'days_since_last_activity': 5
            },
            'context': {
                'new_product_launch': True
            }
        },
        {
            'user_id': 'USER_002',
            'profile': {
                'age': 45,
                'risk_score': 0.3,
                'product_variety': 5,
                'total_amount': 150000,
                'churn_probability': 0.2
            },
            'history': {
                'recent_events_count': 20,
                'total_events': 100,
                'days_since_last_activity': 2
            },
            'context': {}
        },
        {
            'user_id': 'USER_003',
            'profile': {
                'age': 35,
                'risk_score': 0.5,
                'product_variety': 2,
                'total_amount': 20000,
                'churn_probability': 0.7
            },
            'history': {
                'recent_events_count': 0,
                'total_events': 15,
                'days_since_last_activity': 120
            },
            'context': {}
        }
    ]

    # 为每个用户选择策略
    print("\n=== 用户策略选择结果 ===")
    for user_data in test_users:
        strategy = strategy_matrix.select_strategy(
            user_data['user_id'],
            user_data['profile'],
            user_data['history'],
            user_data['context']
        )

        print(f"\n用户: {user_data['user_id']}")
        print(f"推荐场景: {strategy['scenario']}")
        print(f"置信度: {strategy['scenario_confidence']:.2f}")
        print(f"使用算法: {', '.join(strategy['algorithms'])}")
        print(f"算法权重: {strategy['weights']}")
        print(f"业务优先级: {strategy['business_priority']}")
        print(f"预期CTR: {strategy['expected_ctr']:.3f}")

    # 测试新产品策略选择
    new_product_features = {
        'risk_level': 3,
        'category': 'A',
        'is_innovative': True,
        'target_coverage': 0.3
    }

    new_product_strategy = strategy_matrix.get_strategy_for_new_product(
        new_product_features, [], []
    )

    print(f"\n=== 新产品策略选择 ===")
    print(f"推荐策略: {new_product_strategy}")

    # 生成策略报告
    report = strategy_matrix.generate_strategy_report()
    print(f"\n=== 策略性能报告 ===")
    print(f"总策略数: {report['total_strategies']}")
    print(f"优化建议数: {len(report['recommendations'])}")

    print("\n策略选择矩阵测试完成!")
    return strategy_matrix, report

if __name__ == "__main__":
    matrix, report = main()