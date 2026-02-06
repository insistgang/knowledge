"""
模式映射法 - 特征匹配引擎
将用户特征与产品特性进行精准映射，通过建立匹配规则引擎实现最佳匹配
"""

import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity, euclidean_distances
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')

class UserProductMatcher:
    """用户-产品特征匹配器"""

    def __init__(self):
        self.user_profiles = None
        self.product_features = None
        self.user_vectors = None
        self.product_vectors = None
        self.matching_rules = {}
        self.scaler = StandardScaler()

    def load_features(self, user_profiles, product_features, user_vectors, product_vectors):
        """加载用户和产品特征"""
        print("正在加载用户和产品特征...")

        self.user_profiles = user_profiles
        self.product_features = product_features
        self.user_vectors = user_vectors
        self.product_vectors = product_vectors

        print(f"加载完成: {len(user_profiles)} 用户, {len(product_features)} 产品")

    def calculate_similarity_matrix(self):
        """计算用户-产品相似度矩阵"""
        print("正在计算用户-产品相似度矩阵...")

        user_ids = list(self.user_vectors.keys())
        product_ids = list(self.product_vectors.keys())

        # 转换为矩阵形式
        user_matrix = np.array([self.user_vectors[uid] for uid in user_ids])
        product_matrix = np.array([self.product_vectors[pid] for pid in product_ids])

        # 计算余弦相似度
        similarity_matrix = cosine_similarity(user_matrix, product_matrix)

        return similarity_matrix, user_ids, product_ids

    def build_lifecycle_matching_rules(self):
        """构建基于生命周期的匹配规则"""
        print("正在构建生命周期匹配规则...")

        rules = {
            'student_young_adult': {
                'preferred_products': ['储蓄入门', '数字支付', '小额信贷'],
                'avoid_products': ['高风险投资', '大额贷款'],
                'weight_factors': {
                    'low_risk': 2.0,
                    'digital_first': 1.8,
                    'flexible_terms': 1.5
                }
            },
            'early_career': {
                'preferred_products': ['信用卡', '消费贷款', '理财产品', '手机银行'],
                'avoid_products': ['养老金', '保守型储蓄'],
                'weight_factors': {
                    'credit_building': 1.8,
                    'investment_growth': 1.5,
                    'digital_convenience': 1.6
                }
            },
            'family_formation': {
                'preferred_products': ['房贷', '保险', '教育储蓄', '家庭理财'],
                'avoid_products': ['高风险投机'],
                'weight_factors': {
                    'family_benefits': 2.0,
                    'long_term_stability': 1.8,
                    'comprehensive_coverage': 1.5
                }
            },
            'peak_earning': {
                'preferred_products': ['财富管理', '投资组合', '高端信用卡', '信托服务'],
                'avoid_products': ['基础储蓄'],
                'weight_factors': {
                    'high_returns': 2.0,
                    'premium_service': 1.8,
                    'tax_optimization': 1.5
                }
            },
            'pre_retirement': {
                'preferred_products': ['养老金', '保守投资', '医疗保险', '遗产规划'],
                'avoid_products': ['高风险投资', '长期贷款'],
                'weight_factors': {
                    'capital_preservation': 2.5,
                    'retirement_income': 2.2,
                    'health_coverage': 1.8
                }
            },
            'retirement': {
                'preferred_products': ['养老储蓄', '定期存款', '医疗保险', '遗产管理'],
                'avoid_products': ['长期贷款', '高风险投资'],
                'weight_factors': {
                    'safety_first': 3.0,
                    'regular_income': 2.5,
                    'health_protection': 2.0
                }
            }
        }

        return rules

    def build_risk_profile_matching_rules(self):
        """构建基于风险偏好的匹配规则"""
        print("正在构建风险偏好匹配规则...")

        rules = {
            'conservative': {
                'product_characteristics': {
                    'risk_level': [1, 2],  # 低风险
                    'return_rate': [0.01, 0.08],  # 稳定回报
                    'volatility': [0, 0.1]  # 低波动性
                },
                'preferred_categories': ['D', 'N'],  # 储蓄类、渠道类
                'weight_adjustments': {
                    'safety_score': 2.0,
                    'guaranteed_returns': 1.8
                }
            },
            'moderate': {
                'product_characteristics': {
                    'risk_level': [2, 3],  # 中等风险
                    'return_rate': [0.05, 0.15],  # 中等回报
                    'volatility': [0.05, 0.2]  # 中等波动性
                },
                'preferred_categories': ['D', 'C', 'N'],  # 储蓄、信贷、渠道
                'weight_adjustments': {
                    'balanced_portfolio': 1.8,
                    'moderate_growth': 1.5
                }
            },
            'aggressive': {
                'product_characteristics': {
                    'risk_level': [3, 4],  # 高风险
                    'return_rate': [0.1, 0.3],  # 高回报
                    'volatility': [0.15, 0.4]  # 高波动性
                },
                'preferred_categories': ['A', 'C'],  # 财富类、信贷类
                'weight_adjustments': {
                    'high_growth_potential': 2.5,
                    'market_participation': 2.0
                }
            }
        }

        return rules

    def build_behavioral_matching_rules(self):
        """构建基于行为模式的匹配规则"""
        print("正在构建行为模式匹配规则...")

        rules = {
            'digital_native': {
                'characteristics': {
                    'high_channel_usage': True,
                    'low_branch_visits': True,
                    'mobile_first': True
                },
                'preferred_products': ['手机银行', '数字钱包', '在线理财', '智能投顾'],
                'recommendation_boost': 1.5
            },
            'traditional_banker': {
                'characteristics': {
                    'high_branch_visits': True,
                    'prefers_human_advice': True,
                    'low_digital_adoption': True
                },
                'preferred_products': ['网点服务', '人工顾问', '传统储蓄', '柜台业务'],
                'recommendation_boost': 1.3
            },
            'hybrid_user': {
                'characteristics': {
                    'balanced_channel_usage': True,
                    'adaptable_to_new_tech': True,
                    'values_human_touch': True
                },
                'preferred_products': ['全渠道服务', '数字+人工组合', '线上线下融合'],
                'recommendation_boost': 1.4
            },
            'value_seeker': {
                'characteristics': {
                    'price_sensitive': True,
                    'comparison_shopper': True,
                    'promotion_responsive': True
                },
                'preferred_products': ['优惠活动', '低费率产品', '促销产品'],
                'recommendation_boost': 1.6
            },
            'convenience_seeker': {
                'characteristics': {
                    'time_sensitive': True,
                    'simplicity_focused': True,
                    'automation_favoring': True
                },
                'preferred_products': ['自动服务', '一键操作', '集成解决方案'],
                'recommendation_boost': 1.7
            }
        }

        return rules

    def apply_lifecycle_rules(self, user_id, product_scores):
        """应用生命周期匹配规则"""
        if user_id not in self.user_profiles.index:
            return product_scores

        user_profile = self.user_profiles.loc[user_id]
        lifecycle_rules = self.build_lifecycle_matching_rules()

        # 获取用户生命周期阶段
        life_stage_score = user_profile.get('life_stage_encoded_lifestage', 0)
        life_stages = ['student_young_adult', 'early_career', 'family_formation',
                      'peak_earning', 'pre_retirement', 'retirement']
        user_life_stage = life_stages[min(int(life_stage_score * len(life_stages)), len(life_stages)-1)]

        if user_life_stage in lifecycle_rules:
            rules = lifecycle_rules[user_life_stage]
            # 应用权重调整
            adjusted_scores = product_scores.copy()
            for i, product_id in enumerate(product_scores.index):
                # 这里可以根据实际产品ID映射来判断是否属于偏好类别
                adjusted_scores.iloc[i] *= 1.2  # 简化的权重调整

            return adjusted_scores

        return product_scores

    def apply_risk_rules(self, user_id, product_scores):
        """应用风险偏好匹配规则"""
        if user_id not in self.user_profiles.index:
            return product_scores

        user_profile = self.user_profiles.loc[user_id]
        risk_score = user_profile.get('risk_score', 0.5)

        # 根据风险得分调整产品推荐
        risk_rules = self.build_risk_profile_matching_rules()

        if risk_score < 0.3:  # 保守型
            risk_profile = 'conservative'
        elif risk_score < 0.7:  # 稳健型
            risk_profile = 'moderate'
        else:  # 激进型
            risk_profile = 'aggressive'

        adjusted_scores = product_scores.copy()
        if risk_profile in risk_rules:
            # 根据风险偏好调整分数
            for i, product_id in enumerate(product_scores.index):
                if risk_profile == 'conservative':
                    # 保守型用户更偏好储蓄类产品
                    adjusted_scores.iloc[i] *= 1.1 if '储蓄' in str(product_id) else 0.9
                elif risk_profile == 'aggressive':
                    # 激进型用户更偏好投资类产品
                    adjusted_scores.iloc[i] *= 1.2 if '投资' in str(product_id) or '财富' in str(product_id) else 0.95

        return adjusted_scores

    def calculate_match_score(self, user_id, product_id, base_similarity):
        """计算综合匹配得分"""
        match_score = base_similarity

        # 应用生命周期规则
        lifecycle_adjustment = 1.0
        risk_adjustment = 1.0
        behavior_adjustment = 1.0

        # 这里可以加入更复杂的规则逻辑
        if user_id in self.user_profiles.index:
            user_profile = self.user_profiles.loc[user_id]

            # 年龄调整
            age = user_profile.get('age', 30)
            if age < 25 and '基础' in str(product_id):
                lifecycle_adjustment *= 1.2
            elif age > 50 and '养老' in str(product_id):
                lifecycle_adjustment *= 1.3

            # 风险调整
            risk_score = user_profile.get('risk_score', 0.5)
            if risk_score < 0.3 and '储蓄' in str(product_id):
                risk_adjustment *= 1.2
            elif risk_score > 0.7 and '投资' in str(product_id):
                risk_adjustment *= 1.2

        final_score = base_similarity * lifecycle_adjustment * risk_adjustment * behavior_adjustment
        return final_score

    def generate_recommendations(self, user_id, top_k=5):
        """为特定用户生成产品推荐"""
        if user_id not in self.user_vectors:
            print(f"用户 {user_id} 不在特征向量中")
            return []

        # 获取用户向量
        user_vector = self.user_vectors[user_id].reshape(1, -1)

        # 计算与所有产品的相似度
        product_ids = list(self.product_vectors.keys())
        product_matrix = np.array([self.product_vectors[pid] for pid in product_ids])
        similarities = cosine_similarity(user_vector, product_matrix)[0]

        # 应用规则调整
        base_scores = pd.Series(similarities, index=product_ids)
        adjusted_scores = self.apply_lifecycle_rules(user_id, base_scores)
        adjusted_scores = self.apply_risk_rules(user_id, adjusted_scores)

        # 排序并返回top-k推荐
        top_recommendations = adjusted_scores.sort_values(ascending=False).head(top_k)

        recommendations = []
        for product_id, score in top_recommendations.items():
            match_score = self.calculate_match_score(user_id, product_id, score)
            recommendations.append({
                'product_id': product_id,
                'base_similarity': score,
                'match_score': match_score,
                'recommendation_reason': self._generate_recommendation_reason(user_id, product_id, match_score)
            })

        return recommendations

    def _generate_recommendation_reason(self, user_id, product_id, score):
        """生成推荐理由"""
        reasons = []

        if user_id in self.user_profiles.index:
            user_profile = self.user_profiles.loc[user_id]
            age = user_profile.get('age', 30)
            risk_score = user_profile.get('risk_score', 0.5)

            if score > 0.8:
                reasons.append("高度匹配您的需求")
            if age < 25 and '基础' in str(product_id):
                reasons.append("适合年轻人的入门产品")
            if age > 50 and '储蓄' in str(product_id):
                reasons.append("安全稳健，适合您的年龄阶段")
            if risk_score > 0.7 and '投资' in str(product_id):
                reasons.append("符合您的风险偏好")
            if risk_score < 0.3 and '储蓄' in str(product_id):
                reasons.append("低风险，安全可靠")

        if not reasons:
            reasons.append("基于您的使用习惯推荐")

        return "; ".join(reasons)

    def batch_recommend(self, user_ids, top_k=5):
        """批量生成推荐"""
        print(f"正在为 {len(user_ids)} 个用户批量生成推荐...")

        all_recommendations = {}
        for i, user_id in enumerate(user_ids):
            if i % 1000 == 0:
                print(f"已处理 {i}/{len(user_ids)} 用户")

            recommendations = self.generate_recommendations(user_id, top_k)
            all_recommendations[user_id] = recommendations

        return all_recommendations

class MatchingRuleEngine:
    """匹配规则引擎"""

    def __init__(self):
        self.rules = {}
        self.rule_weights = {}

    def add_rule(self, rule_name, rule_function, weight=1.0):
        """添加匹配规则"""
        self.rules[rule_name] = rule_function
        self.rule_weights[rule_name] = weight

    def apply_rules(self, user_id, product_id, base_score):
        """应用所有匹配规则"""
        adjusted_score = base_score

        for rule_name, rule_function in self.rules.items():
            weight = self.rule_weights[rule_name]
            rule_adjustment = rule_function(user_id, product_id)
            adjusted_score *= (1 + (rule_adjustment - 1) * weight)

        return adjusted_score

    def evaluate_rule_performance(self, recommendations, actual_outcomes):
        """评估规则性能"""
        # 这里可以实现规则效果的评估逻辑
        performance_metrics = {}
        return performance_metrics

def main():
    """主函数 - 测试模式映射引擎"""
    print("开始测试模式映射引擎...")

    # 创建模拟数据
    np.random.seed(42)
    n_users = 1000
    n_products = 20

    # 模拟用户画像数据
    user_profiles = pd.DataFrame({
        'age': np.random.normal(40, 15, n_users),
        'risk_score': np.random.beta(2, 2, n_users),
        'life_stage_encoded_lifestage': np.random.randint(0, 6, n_users),
        'product_variety': np.random.poisson(2, n_users),
        'total_events': np.random.poisson(10, n_users),
    })
    user_profiles.index = [f"USER_{i:06d}" for i in range(n_users)]

    # 模拟产品特征数据
    product_features = pd.DataFrame({
        'risk_level': np.random.randint(1, 5, n_products),
        'return_rate': np.random.uniform(0.01, 0.2, n_products),
        'penetration_rate': np.random.uniform(0.01, 0.5, n_products),
        'avg_amount': np.random.uniform(1000, 100000, n_products),
    })
    product_features.index = [f"PROD_{i:04d}" for i in range(n_products)]

    # 创建模拟向量
    user_vectors = {uid: np.random.randn(50) for uid in user_profiles.index}
    product_vectors = {pid: np.random.randn(50) for pid in product_features.index}

    # 初始化匹配器
    matcher = UserProductMatcher()
    matcher.load_features(user_profiles, product_features, user_vectors, product_vectors)

    # 测试单个用户推荐
    test_user_id = list(user_vectors.keys())[0]
    recommendations = matcher.generate_recommendations(test_user_id, top_k=5)

    print(f"\n=== 用户 {test_user_id} 的推荐结果 ===")
    for i, rec in enumerate(recommendations, 1):
        print(f"{i}. 产品: {rec['product_id']}")
        print(f"   基础相似度: {rec['base_similarity']:.4f}")
        print(f"   匹配得分: {rec['match_score']:.4f}")
        print(f"   推荐理由: {rec['recommendation_reason']}")
        print()

    # 批量推荐测试
    test_users = list(user_vectors.keys())[:10]
    batch_recs = matcher.batch_recommend(test_users, top_k=3)

    print(f"\n=== 批量推荐结果 (前3个用户) ===")
    for user_id, recs in batch_recs.items():
        print(f"用户 {user_id}:")
        for i, rec in enumerate(recs, 1):
            print(f"  {i}. {rec['product_id']} (得分: {rec['match_score']:.4f})")
        print()

    print("模式映射引擎测试完成!")
    return matcher, batch_recs

if __name__ == "__main__":
    matcher, recommendations = main()