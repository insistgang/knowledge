
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.stats import ks_2samp
import pandas as pd

from create_4class_data import load_4class_data
from load_target_domain_data import load_real_target_domain_data
import warnings
warnings.filterwarnings("ignore", category=UserWarning)

class ReverseTransferLearning:
    """反向迁移学习类"""

    def __init__(self):
        self.class_names = ['OR', 'IR', 'B', 'N']
        self.feature_weights = None
        self.domain_adapter = None

    def compute_target_domain_statistics(self, X_target):
        """计算目标域的统计特征"""
        stats = {
            'mean': X_target.mean(axis=0),
            'std': X_target.std(axis=0),
            'median': np.median(X_target, axis=0),
            'q25': np.percentile(X_target, 25, axis=0),
            'q75': np.percentile(X_target, 75, axis=0),
            'skewness': self._compute_skewness(X_target),
            'kurtosis': self._compute_kurtosis(X_target)
        }
        return stats

    def _compute_skewness(self, X):
        """计算偏度"""
        mean = np.mean(X, axis=0)
        std = np.std(X, axis=0)
        # 避免除零错误
        std_safe = np.where(std == 0, 1e-8, std)
        skew = np.mean(((X - mean) / std_safe) ** 3, axis=0)
        # 对于标准差为0的特征，偏度设为0
        skew = np.where(std == 0, 0, skew)
        return skew

    def _compute_kurtosis(self, X):
        """计算峰度"""
        mean = np.mean(X, axis=0)
        std = np.std(X, axis=0)
        # 避免除零错误
        std_safe = np.where(std == 0, 1e-8, std)
        kurt = np.mean(((X - mean) / std_safe) ** 4, axis=0) - 3
        # 对于标准差为0的特征，峰度设为0
        kurt = np.where(std == 0, 0, kurt)
        return kurt

    def target_domain_feature_selection(self, X_source, X_target, n_features=40):
        """基于目标域特征进行特征选择"""
        print("=== 基于目标域的特征选择 ===")

        # 1. 计算目标域统计特征
        target_stats = self.compute_target_domain_statistics(X_target)

        # 2. 特征重要性评分 - 基于目标域的特征变异性
        variability_scores = target_stats['std'] / (np.abs(target_stats['mean']) + 1e-8)

        # 3. 域差异评分 - 选择与目标域分布最相似的源域特征
        domain_similarity_scores = []
        for i in range(X_source.shape[1]):
            _, p_value = ks_2samp(X_source[:, i], X_target[:, i])
            domain_similarity_scores.append(p_value)

        domain_similarity_scores = np.array(domain_similarity_scores)

        # 4. 综合评分
        combined_scores = 0.5 * variability_scores + 0.5 * domain_similarity_scores

        # 5. 选择特征
        selected_indices = np.argsort(combined_scores)[-n_features:]

        print(f"特征选择: {X_source.shape[1]} -> {len(selected_indices)}")
        print(f"平均变异性得分: {variability_scores[selected_indices].mean():.4f}")
        print(f"平均域相似性得分: {domain_similarity_scores[selected_indices].mean():.4f}")

        return selected_indices, combined_scores

    def source_domain_adaptation(self, X_source, X_target, target_stats):
        """源域数据适应 - 使源域分布更接近目标域"""
        print("=== 源域数据适应 ===")

        # 1. 基于目标域统计特征调整源域数据
        X_adapted = X_source.copy()

        # 方法1: 统计特征匹配
        for i in range(X_source.shape[1]):
            source_mean = X_source[:, i].mean()
            source_std = X_source[:, i].std()
            target_mean = target_stats['mean'][i]
            target_std = target_stats['std'][i]

            if source_std > 0 and target_std > 0:
                # 标准化到目标域分布
                X_adapted[:, i] = (X_source[:, i] - source_mean) / source_std * target_std + target_mean

        print(f"源域适应完成")
        print(f"适应前源域均值: {X_source.mean():.6f}, 标准差: {X_source.std():.6f}")
        print(f"适应后源域均值: {X_adapted.mean():.6f}, 标准差: {X_adapted.std():.6f}")
        print(f"目标域均值: {X_target.mean():.6f}, 标准差: {X_target.std():.6f}")

        return X_adapted

    def unsupervised_domain_adaptation(self, X_source, y_source, X_target):
        """无监督域适应"""
        print("=== 无监督域适应 ===")

        # 1. 计算目标域统计特征
        target_stats = self.compute_target_domain_statistics(X_target)

        # 2. 源域数据适应
        X_source_adapted = self.source_domain_adaptation(X_source, X_target, target_stats)

        # 3. 标准化
        scaler = StandardScaler()
        X_combined = np.vstack([X_source_adapted, X_target])
        scaler.fit(X_combined)

        X_source_scaled = scaler.transform(X_source_adapted)
        X_target_scaled = scaler.transform(X_target)

        print(f"使用所有原始特征: {X_source_scaled.shape[1]}")

        # 4. 训练模型
        model = xgb.XGBClassifier(tree_method="hist", num_class=4,
                                  eval_metric="mlogloss",
                                  objective="multi:softprob",  # 输出(n_samples, K)
                                  early_stopping_rounds=None, random_state=42, scale_pos_weight=1)
        # 交叉验证的定义
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        # 交叉验证
        for train, test in cv.split(X_source_scaled, y_source):
            X_train0 = X_source_scaled[train]
            X_test0 = X_source_scaled[test]
            y_train0 = y_source[train]
            y_test0 = y_source[test]
            model.fit(X_train0, y_train0, eval_set=[(X_train0, y_train0), (X_test0, y_test0)],
                      verbose=False)
        model.fit(X_source_scaled, y_source)

        return model, X_source_scaled, X_target_scaled, list(range(X_source.shape[1]))

    def pseudo_labeling_approach(self, X_source, y_source, X_target, confidence_threshold=0.8):
        """伪标签方法"""
        print("=== 伪标签方法 ===")

        # 1. 初始模型训练 - 使用所有特征
        target_stats = self.compute_target_domain_statistics(X_target)
        X_source_adapted = self.source_domain_adaptation(X_source, X_target, target_stats)

        # 标准化
        scaler = StandardScaler()
        X_combined = np.vstack([X_source_adapted, X_target])
        scaler.fit(X_combined)

        X_source_scaled = scaler.transform(X_source_adapted)
        X_target_scaled = scaler.transform(X_target)

        print(f"使用所有原始特征: {X_source_scaled.shape[1]}")

        # 2. 初始模型
        initial_model = xgb.XGBClassifier(tree_method="hist", num_class=4,
                                          eval_metric="mlogloss",
                                          objective="multi:softprob",  # 输出(n_samples, K)
                                          early_stopping_rounds=None, random_state=42, scale_pos_weight=1)
        # 交叉验证的定义
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        # 交叉验证
        for train, test in cv.split(X_source_scaled, y_source):
            X_train0 = X_source_scaled[train]
            X_test0 = X_source_scaled[test]
            y_train0 = y_source[train]
            y_test0 = y_source[test]
            initial_model.fit(X_train0, y_train0, eval_set=[(X_train0, y_train0), (X_test0, y_test0)],
                              verbose=False)
        initial_model.fit(X_source_scaled, y_source)

        # 3. 生成伪标签
        target_probabilities = initial_model.predict_proba(X_target_scaled)
        target_confidences = np.max(target_probabilities, axis=1)

        # 4. 选择高置信度样本
        high_confidence_mask = target_confidences > confidence_threshold
        pseudo_labels = np.argmax(target_probabilities[high_confidence_mask], axis=1)

        print(f"高置信度样本: {high_confidence_mask.sum()} ({high_confidence_mask.mean() * 100:.1f}%)")

        if high_confidence_mask.sum() > 0:
            # 5. 重新训练模型
            X_pseudo = X_target_scaled[high_confidence_mask]
            y_pseudo = pseudo_labels

            # 结合源域和伪标签数据
            X_combined = np.vstack([X_source_scaled, X_pseudo])
            y_combined = np.hstack([y_source, y_pseudo])
            print(len(X_combined))
            print(len(y_combined))

            # 重新训练
            final_model = xgb.XGBClassifier(tree_method="hist", num_class=4,
                                            eval_metric="mlogloss",
                                            objective="multi:softprob",  # 输出(n_samples, K)
                                            early_stopping_rounds=None, random_state=42, scale_pos_weight=1)
            # 交叉验证的定义
            cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
            # 交叉验证
            for train, test in cv.split(X_combined, y_combined):
                X_train0 = X_combined[train]
                X_test0 = X_combined[test]
                y_train0 = y_combined[train]
                y_test0 = y_combined[test]
                final_model.fit(X_train0, y_train0, eval_set=[(X_train0, y_train0), (X_test0, y_test0)],
                                verbose=False)
            final_model.fit(X_combined, y_combined)

            return final_model, X_source_scaled, X_target_scaled, list(range(X_source.shape[1]))
        else:
            return initial_model, X_source_scaled, X_target_scaled, list(range(X_source.shape[1]))

    def adversarial_domain_adaptation(self, X_source, y_source, X_target):
        """对抗域适应（简化版）"""
        print("=== 对抗域适应 ===")

        # 1. 源域适应 - 使用所有特征
        target_stats = self.compute_target_domain_statistics(X_target)
        X_source_adapted = self.source_domain_adaptation(X_source, X_target, target_stats)

        # 2. 标准化
        scaler = StandardScaler()
        X_combined = np.vstack([X_source_adapted, X_target])
        scaler.fit(X_combined)

        X_source_scaled = scaler.transform(X_source_adapted)
        X_target_scaled = scaler.transform(X_target)

        print(f"使用所有原始特征: {X_source_scaled.shape[1]}")

        # 3. 域特征对齐
        # 使用MMD最小化
        def mmd_loss(X_s, X_t, gamma=1.0):
            """计算MMD损失"""

            def kernel(x, y):
                return np.exp(-gamma * np.linalg.norm(x - y) ** 2)

            mmd = 0.0
            n_s = X_s.shape[0]
            n_t = X_t.shape[0]

            # 样本内核
            for i in range(n_s):
                for j in range(n_s):
                    mmd += kernel(X_s[i], X_s[j]) / (n_s * n_s)

            for i in range(n_t):
                for j in range(n_t):
                    mmd += kernel(X_t[i], X_t[j]) / (n_t * n_t)

            # 跨域内核
            for i in range(n_s):
                for j in range(n_t):
                    mmd -= 2 * kernel(X_s[i], X_t[j]) / (n_s * n_t)

            return mmd

        # 4. 简化的域对齐：调整源域特征使其更接近目标域
        alignment_factor = 0.3  # 对齐强度
        source_mean = X_source_scaled.mean(axis=0)
        target_mean = X_target_scaled.mean(axis=0)

        X_source_aligned = X_source_scaled + alignment_factor * (target_mean - source_mean)

        # 5. 训练模型 - 直接使用对齐后的特征
        model = xgb.XGBClassifier(tree_method="hist", num_class=4,
                                  eval_metric="mlogloss",
                                  objective="multi:softprob",  # 输出(n_samples, K)
                                  early_stopping_rounds=None, random_state=42, scale_pos_weight=1)
        # 交叉验证的定义
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        # 交叉验证
        for train, test in cv.split(X_source_aligned, y_source):
            X_train0 = X_source_aligned[train]
            X_test0 = X_source_aligned[test]
            y_train0 = y_source[train]
            y_test0 = y_source[test]
            model.fit(X_train0, y_train0, eval_set=[(X_train0, y_train0), (X_test0, y_test0)],
                      verbose=False)
        model.fit(X_source_aligned, y_source)

        return model, X_source_aligned, X_target_scaled, list(range(X_source.shape[1]))

    def evaluate_predictions(self, predictions, probabilities, file_indices, method_name, model=None,
                             feature_names=None):
        """评估预测结果"""
        print(f"\n=== {method_name} 预测评估 ===")

        # 1. 整体预测分布
        pred_counts = np.bincount(predictions, minlength=4)
        total = len(predictions)

        print("预测分布:")
        for i, count in enumerate(pred_counts):
            print(f"  {self.class_names[i]}: {count} ({count / total * 100:.1f}%)")

        # 1.5 特征重要性分析（如果提供了模型）
        if model is not None and hasattr(model, 'feature_importances_'):
            print(f"\n特征重要性分析 (Top 10):")
            feature_importance = model.feature_importances_
            importance_indices = np.argsort(feature_importance)[::-1][:10]

            for i, idx in enumerate(importance_indices):
                if feature_names is not None and len(feature_names) > idx:
                    name = feature_names[idx]
                else:
                    name = f"Feature_{idx + 1}"
                print(f"  {i + 1}. {name}: {feature_importance[idx]:.4f}")

            # 保存特征重要性
            try:
                # 安全地创建特征名称列表
                if feature_names is not None and len(feature_names) > 0:
                    names = [feature_names[i] if i < len(feature_names) else f"Feature_{i + 1}"
                             for i in range(len(feature_importance))]
                else:
                    names = [f"Feature_{i + 1}" for i in range(len(feature_importance))]

                importance_data = {
                    'feature_index': range(len(feature_importance)),
                    'feature_name': names,
                    'importance': feature_importance
                }
                importance_df = pd.DataFrame(importance_data)
                importance_df = importance_df.sort_values('importance', ascending=False)

                # 使用中文文件名
                if method_name == "无监督域适应":
                    filename = '无监督域适应_feature_importance.csv'
                elif method_name == "伪标签方法":
                    filename = '伪标签方法_feature_importance.csv'
                elif method_name == "对抗域适应":
                    filename = '对抗域适应_feature_importance.csv'
                else:
                    filename = f'{method_name}_feature_importance.csv'

                importance_df.to_csv(filename, index=False, encoding='utf-8-sig')
                print(f"  特征重要性已保存: {filename}")
            except Exception as e:
                print(f"  保存特征重要性失败: {e}")

        # 特征统计
        if model is not None and hasattr(model, 'feature_importances_'):
            importance = model.feature_importances_
            print(f"\n特征重要性统计:")
            print(f"  平均重要性: {importance.mean():.4f}")
            print(f"  最大重要性: {importance.max():.4f}")
            print(f"  最小重要性: {importance.min():.4f}")
            print(f"  标准差: {importance.std():.4f}")
            print(f"  重要特征数量(>0.01): {(importance > 0.01).sum()}")
            print(f"  高重要性特征数量(>0.05): {(importance > 0.05).sum()}")

        # 2. 置信度分析
        max_probs = np.max(probabilities, axis=1)
        print(f"\n置信度分析:")
        print(f"  平均置信度: {max_probs.mean():.3f}")
        print(f"  高置信度样本(>0.8): {(max_probs > 0.8).sum()} ({(max_probs > 0.8).mean() * 100:.1f}%)")
        print(
            f"  中等置信度样本(0.5-0.8): {((max_probs >= 0.5) & (max_probs <= 0.8)).sum()} ({((max_probs >= 0.5) & (max_probs <= 0.8)).mean() * 100:.1f}%)")
        print(f"  低置信度样本(<0.5): {(max_probs < 0.5).sum()} ({(max_probs < 0.5).mean() * 100:.1f}%)")

        # 3. 文件级别分析
        unique_files = np.unique(file_indices)
        file_results = []

        print(f"\n文件级别分析:")
        for file_idx in sorted(unique_files):
            file_mask = file_indices == file_idx
            file_pred = predictions[file_mask]
            file_prob = probabilities[file_mask]

            pred_counts_file = np.bincount(file_pred, minlength=4)
            main_pred = np.argmax(pred_counts_file)
            confidence = pred_counts_file[main_pred] / len(file_pred)
            avg_confidence = np.max(file_prob, axis=1).mean()

            file_results.append({
                'file': file_idx,
                'main_pred': main_pred,
                'confidence': confidence,
                'avg_confidence': avg_confidence
            })

            print(f"  文件 {file_idx:2d}: {self.class_names[main_pred]} ({confidence * 100:5.1f}%) "
                  f"平均置信度: {avg_confidence:.3f}")

        return pred_counts, file_results

    def run_reverse_transfer_test(self):
        """运行反向迁移学习测试"""
        print("开始反向迁移学习测试...")
        print("=" * 60)

        # 1. 加载数据
        X_source, y_source = load_4class_data()
        X_target, file_indices, target_info = load_real_target_domain_data()

        print(f"源域数据: {X_source.shape}")
        print(f"目标域数据: {X_target.shape}")

        # 获取特征名称
        feature_names = target_info.get('feature_names', None)
        if feature_names is not None:
            print(f"使用真实特征名称: {len(feature_names)} 个特征")
            print(f"前5个特征名称: {feature_names[:5]}")
        else:
            feature_names = [f"Feature_{i + 1}" for i in range(X_target.shape[1])]
            print("使用默认特征名称")

        # 2. 分割源域数据
        X_train, X_val, y_train, y_val = train_test_split(
            X_source, y_source, test_size=0.2, random_state=42, stratify=y_source
        )

        print(f"训练集: {X_train.shape}, 验证集: {X_val.shape}")

        # 3. 验证集测试
        val_model = xgb.XGBClassifier(tree_method="hist", num_class=4,
                                      eval_metric="mlogloss",
                                      objective="multi:softprob",  # 输出(n_samples, K)
                                      early_stopping_rounds=None, random_state=42, scale_pos_weight=1)
        # 交叉验证的定义
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        # 交叉验证
        for train, test in cv.split(X_source, y_source):
            X_train0 = X_source[train]
            X_test0 = X_source[test]
            y_train0 = y_source[train]
            y_test0 = y_source[test]
            val_model.fit(X_train0, y_train0, eval_set=[(X_train0, y_train0), (X_test0, y_test0)],
                          verbose=False)
        # 最终模型
        val_model.fit(X_train, y_train)
        val_pred = val_model.predict(X_val)
        val_acc = accuracy_score(y_val, val_pred)
        print(f"源域验证集准确率: {val_acc:.4f}")

        # 4. 测试各种反向迁移学习方法
        all_results = {}

        # 方法1: 无监督域适应
        print("\n" + "=" * 50)
        print("方法1: 无监督域适应")
        model1, X_train_pca1, X_target_pca1, features1 = self.unsupervised_domain_adaptation(
            X_train, y_train, X_target
        )
        pred1 = model1.predict(X_target_pca1)
        prob1 = model1.predict_proba(X_target_pca1)
        pred_counts1, file_results1 = self.evaluate_predictions(pred1, prob1, file_indices, "无监督域适应", model1,
                                                                feature_names)
        all_results['Unsupervised'] = {
            'predictions': pred1,
            'probabilities': prob1,
            'pred_counts': pred_counts1,
            'file_results': file_results1,
            'model': model1
        }

        # 方法2: 伪标签方法
        print("\n" + "=" * 50)
        print("方法2: 伪标签方法")
        model2, X_train_pca2, X_target_pca2, features2 = self.pseudo_labeling_approach(
            X_train, y_train, X_target, confidence_threshold=0.7
        )
        pred2 = model2.predict(X_target_pca2)
        prob2 = model2.predict_proba(X_target_pca2)
        pred_counts2, file_results2 = self.evaluate_predictions(pred2, prob2, file_indices, "伪标签方法", model2,
                                                                feature_names)
        all_results['Pseudo-Labeling'] = {
            'predictions': pred2,
            'probabilities': prob2,
            'pred_counts': pred_counts2,
            'file_results': file_results2,
            'model': model2
        }

        # 方法3: 对抗域适应
        print("\n" + "=" * 50)
        print("方法3: 对抗域适应")
        model3, X_train_pca3, X_target_pca3, features3 = self.adversarial_domain_adaptation(
            X_train, y_train, X_target
        )
        pred3 = model3.predict(X_target_pca3)
        prob3 = model3.predict_proba(X_target_pca3)
        pred_counts3, file_results3 = self.evaluate_predictions(pred3, prob3, file_indices, "对抗域适应", model3,
                                                                feature_names)
        all_results['Adversarial'] = {
            'predictions': pred3,
            'probabilities': prob3,
            'pred_counts': pred_counts3,
            'file_results': file_results3,
            'model': model3
        }

        # 5. 方法对比
        print("\n" + "=" * 50)
        print("方法对比总结")
        print("-" * 30)

        methods = list(all_results.keys())
        plt.figure(figsize=(15, 10))

        # 预测分布对比
        plt.subplot(2, 2, 1)
        x = np.arange(4)
        width = 0.25

        for i, method in enumerate(methods):
            pred_counts = all_results[method]['pred_counts']
            plt.bar(x + i * width, pred_counts, width, label=method, alpha=0.8)

        plt.xlabel('Fault Type')
        plt.ylabel('Count')
        plt.title('Prediction Distribution Comparison')
        plt.xticks(x + width, self.class_names)
        plt.legend()

        # 置信度分布对比
        plt.subplot(2, 2, 2)
        for method in methods:
            max_probs = np.max(all_results[method]['probabilities'], axis=1)
            plt.hist(max_probs, bins=30, alpha=0.6, label=method, density=True)

        plt.xlabel('Confidence')
        plt.ylabel('Density')
        plt.title('Confidence Distribution')
        plt.legend()

        # 文件级别预测对比
        plt.subplot(2, 2, 3)
        file_consistency = np.zeros((len(methods), 16))  # 16 files

        for i, method in enumerate(methods):
            file_results = all_results[method]['file_results']
            for result in file_results:
                file_idx = result['file'] - 1  # 0-based indexing
                file_consistency[i, file_idx] = int(result['main_pred'])

        sns.heatmap(file_consistency.astype(int), annot=True, fmt='d', cmap='Set3',
                    xticklabels=[f'File {i + 1}' for i in range(16)],
                    yticklabels=methods)
        plt.title('File Predictions Comparison')
        plt.xlabel('File')
        plt.ylabel('Method')

        # 多样性评分
        plt.subplot(2, 2, 4)
        diversity_scores = []
        for method in methods:
            pred_counts = all_results[method]['pred_counts']
            # 计算香农熵
            probabilities = pred_counts / pred_counts.sum()
            entropy = -np.sum(probabilities * np.log(probabilities + 1e-10))
            diversity_scores.append(entropy)

        plt.bar(methods, diversity_scores, color=['skyblue', 'lightcoral', 'lightgreen'])
        plt.ylabel('Shannon Entropy')
        plt.title('Prediction Diversity')
        plt.xticks(rotation=45)

        plt.tight_layout()
        plt.savefig('reverse_transfer_learning_comparison.png', dpi=300, bbox_inches='tight')
        plt.show()

        # 6. 选择最佳方法
        best_method = methods[np.argmax(diversity_scores)]
        print(f"\n最佳方法: {best_method} (多样性评分: {max(diversity_scores):.3f})")

        # 7. 保存最佳结果
        best_results = all_results[best_method]
        results_df = pd.DataFrame({
            'File_Index': file_indices,
            'Predicted_Class': [self.class_names[p] for p in best_results['predictions']],
            'Confidence': np.max(best_results['probabilities'], axis=1),
            'OR_Prob': best_results['probabilities'][:, 0],
            'IR_Prob': best_results['probabilities'][:, 1],
            'B_Prob': best_results['probabilities'][:, 2],
            'N_Prob': best_results['probabilities'][:, 3]
        })

        results_df.to_csv('reverse_transfer_predictions.csv', index=False)
        print(f"最佳结果已保存到 reverse_transfer_predictions.csv")

        return all_results, best_method


def main():
    """主函数"""
    reverse_transfer = ReverseTransferLearning()
    results, best_method = reverse_transfer.run_reverse_transfer_test()
    return results, best_method


if __name__ == "__main__":
    results, best_method = main()
