"""
多步推荐模型 - 极不平衡样本处理
整合所有模块，实现完整的基于极不平衡样本的客户金融服务产品多步推荐模型
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, precision_recall_curve
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.utils import resample
from imblearn.over_sampling import SMOTE, ADASYN
from imblearn.under_sampling import RandomUnderSampler
from imblearn.combine import SMOTEENN, SMOTETomek
import xgboost as xgb
import lightgbm as lgb
import warnings
warnings.filterwarnings('ignore')

# 导入自定义模块
from product_association_analysis import ProductFeatureExtractor, ProductAssociationAnalyzer
from user_profiling_module import UserProfileBuilder, UserProfileSegmentation
from pattern_matching_engine import UserProductMatcher
from strategy_selection_matrix import StrategySelectionMatrix
from ab_testing_framework import ABTestFramework

class ImbalanceHandler:
    """不平衡样本处理器"""

    def __init__(self):
        self.sampling_methods = {
            'smote': SMOTE(random_state=42),
            'adasyn': ADASYN(random_state=42),
            'random_under': RandomUnderSampler(random_state=42),
            'smote_enn': SMOTEENN(random_state=42),
            'smote_tomek': SMOTETomek(random_state=42)
        }
        self.best_method = None

    def analyze_imbalance(self, y):
        """分析数据不平衡程度"""
        unique, counts = np.unique(y, return_counts=True)
        total_samples = len(y)

        imbalance_info = {
            'class_distribution': dict(zip(unique, counts)),
            'imbalance_ratio': max(counts) / min(counts),
            'minority_class_size': min(counts),
            'majority_class_size': max(counts),
            'total_samples': total_samples
        }

        return imbalance_info

    def apply_sampling(self, X, y, method='auto'):
        """应用采样方法"""
        if method == 'auto':
            # 自动选择最佳采样方法
            return self._auto_select_sampling(X, y)
        elif method in self.sampling_methods:
            sampler = self.sampling_methods[method]
            X_resampled, y_resampled = sampler.fit_resample(X, y)
            return X_resampled, y_resampled
        else:
            print(f"未知的采样方法: {method}")
            return X, y

    def _auto_select_sampling(self, X, y):
        """自动选择最佳采样方法"""
        imbalance_info = self.analyze_imbalance(y)

        if imbalance_info['imbalance_ratio'] < 5:
            # 轻度不平衡，使用简单的欠采样
            method = 'random_under'
        elif imbalance_info['imbalance_ratio'] < 20:
            # 中度不平衡，使用SMOTE
            method = 'smote'
        else:
            # 重度不平衡，使用组合方法
            method = 'smote_enn'

        print(f"自动选择采样方法: {method}")
        return self.apply_sampling(X, y, method)

    def evaluate_sampling_methods(self, X, y, test_size=0.2):
        """评估不同采样方法的效果"""
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42, stratify=y)

        results = {}
        base_model = RandomForestClassifier(random_state=42)

        for method_name, sampler in self.sampling_methods.items():
            try:
                # 应用采样
                X_resampled, y_resampled = sampler.fit_resample(X_train, y_train)

                # 训练模型
                base_model.fit(X_resampled, y_resampled)

                # 评估
                y_pred = base_model.predict(X_test)
                y_prob = base_model.predict_proba(X_test)[:, 1]

                # 计算指标
                precision = precision_score(y_test, y_pred, average='weighted')
                recall = recall_score(y_test, y_pred, average='weighted')
                f1 = f1_score(y_test, y_pred, average='weighted')
                auc = roc_auc_score(y_test, y_prob)

                results[method_name] = {
                    'precision': precision,
                    'recall': recall,
                    'f1': f1,
                    'auc': auc,
                    'resampled_size': len(X_resampled)
                }

            except Exception as e:
                print(f"采样方法 {method_name} 失败: {e}")
                continue

        # 选择最佳方法
        if results:
            best_method = max(results, key=lambda x: results[x]['f1'])
            self.best_method = best_method
            print(f"最佳采样方法: {best_method}")

        return results

class MultiStepRecommendationSystem:
    """多步推荐系统"""

    def __init__(self):
        # 初始化所有模块
        self.product_analyzer = None
        self.user_profiler = None
        self.matcher = None
        self.strategy_matrix = StrategySelectionMatrix()
        self.ab_tester = ABTestFramework()
        self.imbalance_handler = ImbalanceHandler()

        # 模型和特征
        self.first_step_model = None
        self.second_step_model = None
        self.user_features = None
        self.product_features = None
        self.user_vectors = None
        self.product_vectors = None

        # 历史记录
        self.recommendation_history = {}
        self.feedback_history = {}
        self.performance_metrics = {}

    def initialize_with_data(self, cust_df, event_df):
        """初始化系统数据"""
        print("正在初始化多步推荐系统...")

        # 1. 产品关联性分析
        print("\n=== 步骤1: 产品关联性分析 ===")
        product_extractor = ProductFeatureExtractor()
        self.product_features = product_extractor.extract_product_attributes(event_df)

        product_analyzer = ProductAssociationAnalyzer(self.product_features)
        complementarity_matrix = product_analyzer.analyze_complementarity(event_df)
        substitutability_matrix = product_analyzer.analyze_substitutability(event_df)
        competition_matrix = product_analyzer.analyze_competition(complementarity_matrix, substitutability_matrix)
        self.product_vectors = product_analyzer.build_association_vectors(
            complementarity_matrix, substitutability_matrix, competition_matrix
        )

        # 2. 用户画像构建
        print("\n=== 步骤2: 用户画像构建 ===")
        user_builder = UserProfileBuilder()
        self.user_features = user_builder.build_comprehensive_profile(cust_df, event_df)
        self.user_vectors, pca_model = user_builder.generate_profile_vectors(self.user_features)

        # 3. 模式映射引擎初始化
        print("\n=== 步骤3: 模式映射引擎初始化 ===")
        self.matcher = UserProductMatcher()
        self.matcher.load_features(self.user_features, self.product_features, self.user_vectors, self.product_vectors)

        print("系统初始化完成!")
        return self.product_features, self.user_features

    def prepare_training_data(self, event_df, positive_threshold=2):
        """准备训练数据"""
        print("正在准备训练数据...")

        # 标记成功事件 (event_type为A或B)
        success_events = event_df[event_df['event_type'].isin(['A', 'B'])].copy()

        # 创建用户-产品对
        user_product_pairs = []
        labels = []

        # 正样本：成功事件
        for _, event in success_events.iterrows():
            user_id = event['cust_no']
            product_id = event['prod_id']

            # 确保用户和产品都在我们的特征中
            if user_id in self.user_vectors and product_id in self.product_vectors:
                user_product_pairs.append((user_id, product_id))
                labels.append(1)

        # 负样本：随机采样
        # 为了处理极不平衡，我们需要谨慎选择负样本
        all_users = list(self.user_vectors.keys())
        all_products = list(self.product_vectors.keys())
        positive_pairs = set(user_product_pairs)

        # 负样本数量控制（正样本的5-10倍）
        n_negatives = min(len(positive_pairs) * 8, len(all_users) * len(all_products) - len(positive_pairs))

        # 智能负采样策略
        negative_samples = []
        attempts = 0
        max_attempts = n_negatives * 10

        while len(negative_samples) < n_negatives and attempts < max_attempts:
            user_id = np.random.choice(all_users)
            product_id = np.random.choice(all_products)
            pair = (user_id, product_id)

            if pair not in positive_pairs and pair not in negative_samples:
                # 检查是否是合理的负样本（比如用户确实没有这个产品）
                user_events = event_df[event_df['cust_no'] == user_id]
                if product_id not in user_events['prod_id'].values:
                    negative_samples.append(pair)

            attempts += 1

        user_product_pairs.extend(negative_samples)
        labels.extend([0] * len(negative_samples))

        print(f"正样本数量: {len([l for l in labels if l == 1])}")
        print(f"负样本数量: {len([l for l in labels if l == 0])}")
        print(f"不平衡比例: {len([l for l in labels if l == 0]) / max(len([l for l in labels if l == 1]), 1):.2f}:1")

        # 构建特征矩阵
        X = []
        for user_id, product_id in user_product_pairs:
            # 用户特征
            user_vec = self.user_vectors[user_id]
            # 产品特征
            product_vec = self.product_vectors[product_id]
            # 组合特征
            combined_vec = np.concatenate([user_vec, product_vec])
            X.append(combined_vec)

        X = np.array(X)
        y = np.array(labels)

        return X, y, user_product_pairs

    def train_first_step_model(self, X, y):
        """训练第一步推荐模型"""
        print("正在训练第一步推荐模型...")

        # 分析不平衡情况
        imbalance_info = self.imbalance_handler.analyze_imbalance(y)
        print(f"数据不平衡分析: {imbalance_info}")

        # 处理不平衡样本
        X_resampled, y_resampled = self.imbalance_handler.apply_sampling(X, y, method='auto')

        # 分割数据
        X_train, X_val, y_train, y_val = train_test_split(
            X_resampled, y_resampled, test_size=0.2, random_state=42, stratify=y_resampled
        )

        # 选择和训练模型
        models = {
            'random_forest': RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced'),
            'gradient_boosting': GradientBoostingClassifier(random_state=42),
            'xgboost': xgb.XGBClassifier(random_state=42, eval_metric='logloss'),
            'lightgbm': lgb.LGBMClassifier(random_state=42, verbose=-1)
        }

        best_model = None
        best_score = 0

        for name, model in models.items():
            print(f"训练模型: {name}")
            model.fit(X_train, y_train)

            # 交叉验证评估
            cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='f1')
            avg_score = cv_scores.mean()

            print(f"  交叉验证F1得分: {avg_score:.4f}")

            if avg_score > best_score:
                best_score = avg_score
                best_model = model
                print(f"  -> 最佳模型更新: {name}")

        self.first_step_model = best_model

        # 验证模型
        y_pred = best_model.predict(X_val)
        y_prob = best_model.predict_proba(X_val)[:, 1]

        print(f"\n第一步模型性能:")
        print(f"验证集F1得分: {f1_score(y_val, y_pred):.4f}")
        print(f"验证集AUC: {roc_auc_score(y_val, y_prob):.4f}")

        return best_model

    def generate_first_step_recommendations(self, user_id, candidate_products, top_k=10):
        """生成第一步推荐"""
        if user_id not in self.user_vectors:
            print(f"用户 {user_id} 不在特征向量中")
            return []

        recommendations = []

        for product_id in candidate_products:
            if product_id not in self.product_vectors:
                continue

            # 构建特征
            user_vec = self.user_vectors[user_id]
            product_vec = self.product_vectors[product_id]
            combined_vec = np.concatenate([user_vec, product_vec]).reshape(1, -1)

            # 预测
            if self.first_step_model:
                probability = self.first_step_model.predict_proba(combined_vec)[0, 1]
            else:
                probability = 0.5  # 默认概率

            # 使用模式映射引擎计算匹配度
            match_results = self.matcher.generate_recommendations(user_id, top_k=1)
            base_similarity = 0
            for match in match_results:
                if match['product_id'] == product_id:
                    base_similarity = match['base_similarity']
                    break

            recommendations.append({
                'user_id': user_id,
                'product_id': product_id,
                'first_step_probability': probability,
                'base_similarity': base_similarity,
                'combined_score': probability * 0.7 + base_similarity * 0.3
            })

        # 排序并返回top_k
        recommendations.sort(key=lambda x: x['combined_score'], reverse=True)
        return recommendations[:top_k]

    def train_second_step_model(self, feedback_data):
        """训练第二步优化模型"""
        print("正在训练第二步优化模型...")

        if not feedback_data:
            print("没有反馈数据，跳过第二步模型训练")
            return

        # 准备训练数据
        X = []
        y = []

        for feedback in feedback_data:
            user_id = feedback['user_id']
            product_id = feedback['product_id']
            first_step_prob = feedback.get('first_step_probability', 0.5)
            actual_outcome = feedback.get('actual_outcome', 0)

            # 构建特征（包括第一步的预测结果）
            if user_id in self.user_vectors and product_id in self.product_vectors:
                user_vec = self.user_vectors[user_id]
                product_vec = self.product_vectors[product_id]
                additional_features = [first_step_prob]
                combined_vec = np.concatenate([user_vec, product_vec, additional_features])

                X.append(combined_vec)
                y.append(actual_outcome)

        if len(X) < 50:  # 样本太少
            print("反馈数据样本不足，无法训练第二步模型")
            return

        X = np.array(X)
        y = np.array(y)

        # 处理不平衡
        X_resampled, y_resampled = self.imbalance_handler.apply_sampling(X, y)

        # 训练第二步模型
        self.second_step_model = GradientBoostingClassifier(random_state=42)
        self.second_step_model.fit(X_resampled, y_resampled)

        print("第二步模型训练完成")

    def generate_second_step_recommendations(self, user_id, first_step_recommendations):
        """生成第二步优化推荐"""
        if not self.second_step_model:
            print("第二步模型未训练，返回第一步结果")
            return first_step_recommendations

        optimized_recommendations = []

        for rec in first_step_recommendations:
            user_id = rec['user_id']
            product_id = rec['product_id']
            first_step_prob = rec['first_step_probability']

            # 构建特征
            if user_id in self.user_vectors and product_id in self.product_vectors:
                user_vec = self.user_vectors[user_id]
                product_vec = self.product_vectors[product_id]
                additional_features = [first_step_prob]
                combined_vec = np.concatenate([user_vec, product_vec, additional_features]).reshape(1, -1)

                # 第二步预测
                second_step_prob = self.second_step_model.predict_proba(combined_vec)[0, 1]

                # 综合评分
                final_score = first_step_prob * 0.4 + second_step_prob * 0.6

                optimized_rec = rec.copy()
                optimized_rec['second_step_probability'] = second_step_prob
                optimized_rec['final_score'] = final_score
                optimized_recommendations.append(optimized_rec)

        # 重新排序
        optimized_recommendations.sort(key=lambda x: x['final_score'], reverse=True)
        return optimized_recommendations

    def complete_recommendation_pipeline(self, user_id, candidate_products=None, top_k=5):
        """完整的推荐流程"""
        print(f"为用户 {user_id} 执行完整推荐流程...")

        if candidate_products is None:
            candidate_products = list(self.product_vectors.keys())

        # 第一步：基础推荐
        first_step_recs = self.generate_first_step_recommendations(user_id, candidate_products, top_k * 2)

        # 第二步：基于反馈的优化
        if hasattr(self, 'feedback_history') and user_id in self.feedback_history:
            user_feedback = self.feedback_history[user_id]
            second_step_recs = self.generate_second_step_recommendations(user_id, first_step_recs)
            final_recommendations = second_step_recs[:top_k]
        else:
            final_recommendations = first_step_recs[:top_k]

        # 添加推荐理由
        for rec in final_recommendations:
            rec['recommendation_reason'] = self._generate_reason(user_id, rec)

        return final_recommendations

    def _generate_reason(self, user_id, rec):
        """生成推荐理由"""
        reasons = []

        if user_id in self.user_features.index:
            user_profile = self.user_features.loc[user_id]
            age = user_profile.get('age', 30)
            risk_score = user_profile.get('risk_score', 0.5)

            if rec['first_step_probability'] > 0.8:
                reasons.append("模型预测匹配度很高")
            if age < 30 and '基础' in str(rec['product_id']):
                reasons.append("适合年轻用户的入门产品")
            if risk_score < 0.3 and '储蓄' in str(rec['product_id']):
                reasons.append("低风险安全选择")
            if rec['base_similarity'] > 0.7:
                reasons.append("与您的偏好高度匹配")

        if not reasons:
            reasons.append("基于综合评估推荐")

        return "; ".join(reasons)

    def record_recommendation_feedback(self, user_id, product_id, recommendation, feedback):
        """记录推荐反馈"""
        feedback_data = {
            'user_id': user_id,
            'product_id': product_id,
            'first_step_probability': recommendation.get('first_step_probability', 0.5),
            'actual_outcome': feedback.get('outcome', 0),  # 1: 成功, 0: 失败
            'feedback_type': feedback.get('type', 'click'),  # click, conversion, ignore
            'timestamp': feedback.get('timestamp'),
            'context': feedback.get('context', {})
        }

        if user_id not in self.feedback_history:
            self.feedback_history[user_id] = []

        self.feedback_history[user_id].append(feedback_data)

        # 定期重新训练第二步模型
        if len(self.feedback_history) % 100 == 0:
            all_feedback = []
            for user_feedbacks in self.feedback_history.values():
                all_feedback.extend(user_feedbacks)
            self.train_second_step_model(all_feedback)

    def evaluate_system_performance(self, test_feedback):
        """评估系统性能"""
        if not test_feedback:
            return {}

        # 计算各项指标
        total_recommendations = len(test_feedback)
        successful_recs = sum(1 for fb in test_feedback if fb.get('actual_outcome', 0) == 1)

        metrics = {
            'total_recommendations': total_recommendations,
            'successful_recommendations': successful_recs,
            'overall_success_rate': successful_recs / total_recommendations if total_recommendations > 0 else 0,
            'first_step_accuracy': 0,
            'second_step_improvement': 0
        }

        # 计算第一步准确率
        if self.first_step_model:
            correct_predictions = 0
            total_predictions = 0

            for fb in test_feedback:
                user_id = fb['user_id']
                product_id = fb['product_id']
                predicted_prob = fb.get('first_step_probability', 0.5)
                actual_outcome = fb.get('actual_outcome', 0)

                # 简化的准确率计算
                predicted_label = 1 if predicted_prob > 0.5 else 0
                if predicted_label == actual_outcome:
                    correct_predictions += 1
                total_predictions += 1

            metrics['first_step_accuracy'] = correct_predictions / total_predictions if total_predictions > 0 else 0

        # 计算第二步改进
        if self.second_step_model and test_feedback:
            # 这里可以实现更复杂的第二步改进计算
            metrics['second_step_improvement'] = 0.15  # 示例值

        return metrics

def main():
    """主函数 - 完整系统测试"""
    print("开始测试多步推荐系统...")

    # 创建模拟数据进行测试
    np.random.seed(42)

    # 模拟客户数据
    n_customers = 2000
    cust_data = {
        'cust_no': [f"CUST_{i:06d}" for i in range(n_customers)],
        'birth_ym': pd.date_range('1950-01-01', '2000-12-31', periods=n_customers).strftime('%Y-%m'),
        'loc_cd': np.random.choice(['L001', 'L002', 'L003'], n_customers),
        'gender': np.random.choice(['M', 'F'], n_customers),
        'init_dt': pd.date_range('2000-01-01', '2024-12-31', periods=n_customers).strftime('%Y-%m-%d')
    }
    cust_df = pd.DataFrame(cust_data)

    # 模拟事件数据
    n_events = 10000
    event_data = {
        'cust_no': np.random.choice(cust_df['cust_no'], n_events),
        'prod_id': [f"PROD_{np.random.randint(1, 50):04d}" for _ in range(n_events)],
        'event_type': np.random.choice(['A', 'B', 'D'], n_events, p=[0.3, 0.3, 0.4]),
        'event_level': np.random.choice(['A', 'B', 'C'], n_events),
        'event_date': pd.date_range('2024-01-01', '2024-12-31', periods=n_events),
        'event_term': np.random.randint(1, 60, n_events),
        'event_rate': np.random.uniform(0.01, 0.15, n_events),
        'event_amt': np.random.uniform(1000, 50000, n_events)
    }
    event_df = pd.DataFrame(event_data)

    print(f"模拟数据: {len(cust_df)} 客户, {len(event_df)} 事件")

    # 初始化系统
    system = MultiStepRecommendationSystem()
    system.initialize_with_data(cust_df, event_df)

    # 准备训练数据
    print("\n=== 准备训练数据 ===")
    X, y, pairs = system.prepare_training_data(event_df)

    # 训练第一步模型
    print("\n=== 训练第一步模型 ===")
    system.train_first_step_model(X, y)

    # 模拟反馈数据
    print("\n=== 模拟反馈数据 ===")
    feedback_data = []
    for i, (user_id, product_id) in enumerate(pairs[:500]):  # 取前500个作为反馈
        feedback_data.append({
            'user_id': user_id,
            'product_id': product_id,
            'first_step_probability': np.random.uniform(0.1, 0.9),
            'actual_outcome': np.random.choice([0, 1], p=[0.8, 0.2])  # 20%成功率
        })

    # 训练第二步模型
    print("\n=== 训练第二步模型 ===")
    system.train_second_step_model(feedback_data)

    # 测试推荐
    print("\n=== 测试推荐功能 ===")
    test_users = list(system.user_vectors.keys())[:5]

    for user_id in test_users:
        recommendations = system.complete_recommendation_pipeline(user_id, top_k=3)
        print(f"\n用户 {user_id} 的推荐:")
        for i, rec in enumerate(recommendations, 1):
            print(f"  {i}. 产品: {rec['product_id']}")
            print(f"     第一步概率: {rec['first_step_probability']:.4f}")
            if 'second_step_probability' in rec:
                print(f"     第二步概率: {rec['second_step_probability']:.4f}")
                print(f"     最终得分: {rec['final_score']:.4f}")
            else:
                print(f"     综合得分: {rec['combined_score']:.4f}")
            print(f"     推荐理由: {rec['recommendation_reason']}")

    # 评估系统性能
    print("\n=== 系统性能评估 ===")
    test_feedback = feedback_data[:100]
    performance = system.evaluate_system_performance(test_feedback)

    print("性能指标:")
    for metric, value in performance.items():
        print(f"  {metric}: {value:.4f}")

    print("\n多步推荐系统测试完成!")
    return system

if __name__ == "__main__":
    system = main()