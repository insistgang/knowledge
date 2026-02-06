"""
AB测试框架 - 策略迭代优化
实现AB测试框架，持续迭代优化推荐策略
"""

import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from scipy import stats
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class ABTestFramework:
    """AB测试框架"""

    def __init__(self):
        self.experiments = {}
        self.user_assignments = {}
        self.experiment_results = {}
        self.significance_level = 0.05
        self.min_sample_size = 1000

    def create_experiment(self, experiment_id, experiment_config):
        """创建AB测试实验"""
        print(f"正在创建实验: {experiment_id}")

        experiment = {
            'id': experiment_id,
            'name': experiment_config.get('name', experiment_id),
            'description': experiment_config.get('description', ''),
            'start_date': experiment_config.get('start_date', datetime.now()),
            'end_date': experiment_config.get('end_date', datetime.now() + timedelta(days=30)),
            'variants': experiment_config.get('variants', ['control', 'treatment']),
            'traffic_split': experiment_config.get('traffic_split', [0.5, 0.5]),
            'target_metrics': experiment_config.get('target_metrics', ['ctr', 'conversion']),
            'primary_metric': experiment_config.get('primary_metric', 'ctr'),
            'status': 'created',
            'sample_size': 0,
            'statistical_power': 0.8
        }

        # 验证流量分配
        if len(experiment['traffic_split']) != len(experiment['variants']):
            raise ValueError("流量分配数量必须与变体数量一致")

        if abs(sum(experiment['traffic_split']) - 1.0) > 0.001:
            experiment['traffic_split'] = np.array(experiment['traffic_split']) / sum(experiment['traffic_split'])

        self.experiments[experiment_id] = experiment
        self.experiment_results[experiment_id] = {variant: [] for variant in experiment['variants']}

        print(f"实验 {experiment_id} 创建成功")
        return experiment

    def assign_user_to_variant(self, user_id, experiment_id, force_variant=None):
        """将用户分配到实验变体"""
        if experiment_id not in self.experiments:
            raise ValueError(f"实验 {experiment_id} 不存在")

        experiment = self.experiments[experiment_id]

        # 检查用户是否已经分配过
        assignment_key = f"{user_id}_{experiment_id}"
        if assignment_key in self.user_assignments:
            return self.user_assignments[assignment_key]

        # 强制指定变体（用于测试）
        if force_variant:
            variant = force_variant
        else:
            # 基于用户ID的哈希值进行随机分配
            import hashlib
            hash_value = int(hashlib.md5(f"{user_id}_{experiment_id}".encode()).hexdigest(), 16)
            random_value = (hash_value % 10000) / 10000.0

            # 根据流量分配确定变体
            cumulative_split = np.cumsum(experiment['traffic_split'])
            variant_idx = np.searchsorted(cumulative_split, random_value)
            variant = experiment['variants'][min(variant_idx, len(experiment['variants'])-1)]

        self.user_assignments[assignment_key] = variant
        return variant

    def record_impression(self, user_id, experiment_id, variant, timestamp=None, context=None):
        """记录展示"""
        if experiment_id not in self.experiments:
            return

        if timestamp is None:
            timestamp = datetime.now()

        impression_data = {
            'user_id': user_id,
            'timestamp': timestamp,
            'event_type': 'impression',
            'context': context or {}
        }

        self.experiment_results[experiment_id][variant].append(impression_data)
        self.experiments[experiment_id]['sample_size'] += 1

    def record_conversion(self, user_id, experiment_id, variant, conversion_type='primary',
                         value=1.0, timestamp=None, context=None):
        """记录转化"""
        if experiment_id not in self.experiments:
            return

        if timestamp is None:
            timestamp = datetime.now()

        conversion_data = {
            'user_id': user_id,
            'timestamp': timestamp,
            'event_type': 'conversion',
            'conversion_type': conversion_type,
            'value': value,
            'context': context or {}
        }

        self.experiment_results[experiment_id][variant].append(conversion_data)

    def calculate_variant_metrics(self, experiment_id, variant):
        """计算变体指标"""
        if experiment_id not in self.experiment_results:
            return {}

        events = self.experiment_results[experiment_id][variant]
        if not events:
            return {}

        # 分类事件
        impressions = [e for e in events if e['event_type'] == 'impression']
        conversions = [e for e in events if e['event_type'] == 'conversion']

        if not impressions:
            return {}

        # 基础指标
        metrics = {
            'impressions': len(impressions),
            'conversions': len(conversions),
            'conversion_rate': len(conversions) / len(impressions) if impressions else 0,
            'total_value': sum(c['value'] for c in conversions),
            'avg_value_per_conversion': np.mean([c['value'] for c in conversions]) if conversions else 0,
            'avg_value_per_impression': sum(c['value'] for c in conversions) / len(impressions) if impressions else 0
        }

        # 按转化类型分类
        conversion_types = list(set(c['conversion_type'] for c in conversions))
        for conv_type in conversion_types:
            type_conversions = [c for c in conversions if c['conversion_type'] == conv_type]
            metrics[f'{conv_type}_conversions'] = len(type_conversions)
            metrics[f'{conv_type}_rate'] = len(type_conversions) / len(impressions) if impressions else 0
            metrics[f'{conv_type}_value'] = sum(c['value'] for c in type_conversions)

        return metrics

    def calculate_statistical_significance(self, experiment_id, metric='conversion_rate'):
        """计算统计显著性"""
        if experiment_id not in self.experiments:
            return {}

        experiment = self.experiments[experiment_id]
        variants = experiment['variants']

        if len(variants) != 2:
            print("统计显著性测试目前只支持双变体实验")
            return {}

        # 获取两个变体的数据
        control_variant = variants[0]
        treatment_variant = variants[1]

        control_metrics = self.calculate_variant_metrics(experiment_id, control_variant)
        treatment_metrics = self.calculate_variant_metrics(experiment_id, treatment_variant)

        if not control_metrics or not treatment_metrics:
            return {}

        # 提取指标
        control_impressions = control_metrics.get('impressions', 0)
        treatment_impressions = treatment_metrics.get('impressions', 0)
        control_conversions = control_metrics.get('conversions', 0)
        treatment_conversions = treatment_metrics.get('conversions', 0)

        if control_impressions < self.min_sample_size or treatment_impressions < self.min_sample_size:
            return {
                'status': 'insufficient_sample_size',
                'sample_size_required': self.min_sample_size,
                'control_size': control_impressions,
                'treatment_size': treatment_impressions
            }

        # 执行Z检验
        try:
            control_rate = control_conversions / control_impressions
            treatment_rate = treatment_conversions / treatment_impressions

            pooled_rate = (control_conversions + treatment_conversions) / (control_impressions + treatment_impressions)
            standard_error = np.sqrt(pooled_rate * (1 - pooled_rate) * (1/control_impressions + 1/treatment_impressions))

            if standard_error == 0:
                return {'status': 'no_variation_in_data'}

            z_score = (treatment_rate - control_rate) / standard_error
            p_value = 2 * (1 - stats.norm.cdf(abs(z_score)))

            # 计算置信区间
            margin_of_error = stats.norm.ppf(0.975) * standard_error
            ci_lower = (treatment_rate - control_rate) - margin_of_error
            ci_upper = (treatment_rate - control_rate) + margin_of_error

            # 计算相对提升
            relative_improvement = ((treatment_rate - control_rate) / control_rate) * 100 if control_rate > 0 else 0

            # 计算统计功效
            effect_size = abs(treatment_rate - control_rate)
            alpha = self.significance_level

            # 简化的功效计算
            if effect_size > 0:
                z_beta = (effect_size / standard_error) - stats.norm.ppf(1 - alpha/2)
                power = stats.norm.cdf(z_beta)
            else:
                power = 0.5

            significance_result = {
                'status': 'completed',
                'control_rate': control_rate,
                'treatment_rate': treatment_rate,
                'absolute_difference': treatment_rate - control_rate,
                'relative_improvement': relative_improvement,
                'z_score': z_score,
                'p_value': p_value,
                'confidence_interval': (ci_lower, ci_upper),
                'statistical_power': power,
                'is_significant': p_value < self.significance_level,
                'confidence_level': 1 - self.significance_level
            }

            return significance_result

        except Exception as e:
            return {'status': 'calculation_error', 'error': str(e)}

    def generate_experiment_report(self, experiment_id):
        """生成实验报告"""
        if experiment_id not in self.experiments:
            return {}

        experiment = self.experiments[experiment_id]
        report = {
            'experiment_id': experiment_id,
            'experiment_name': experiment['name'],
            'status': experiment['status'],
            'start_date': experiment['start_date'],
            'end_date': experiment['end_date'],
            'total_sample_size': experiment['sample_size'],
            'variants': {},
            'statistical_analysis': {},
            'recommendations': []
        }

        # 各变体指标
        for variant in experiment['variants']:
            metrics = self.calculate_variant_metrics(experiment_id, variant)
            report['variants'][variant] = metrics

        # 统计显著性分析
        if experiment['primary_metric']:
            sig_result = self.calculate_statistical_significance(experiment_id, experiment['primary_metric'])
            report['statistical_analysis'] = sig_result

        # 生成建议
        if sig_result.get('status') == 'completed':
            if sig_result['is_significant']:
                if sig_result['relative_improvement'] > 0:
                    winning_variant = experiment['variants'][1]  # treatment
                    report['recommendations'].append({
                        'type': 'winner_found',
                        'variant': winning_variant,
                        'improvement': sig_result['relative_improvement'],
                        'confidence': 1 - sig_result['p_value']
                    })
                else:
                    winning_variant = experiment['variants'][0]  # control
                    report['recommendations'].append({
                        'type': 'control_wins',
                        'variant': winning_variant,
                        'reason': 'Treatment variant performed significantly worse'
                    })
            else:
                report['recommendations'].append({
                    'type': 'no_significant_difference',
                    'reason': 'Insufficient statistical evidence to declare a winner',
                    'suggestion': 'Continue running or consider external factors'
                })
        elif sig_result.get('status') == 'insufficient_sample_size':
            required_size = sig_result['sample_size_required']
            report['recommendations'].append({
                'type': 'insufficient_sample_size',
                'required_size': required_size,
                'current_size': experiment['sample_size'],
                'suggestion': f'Continue experiment until reaching {required_size} samples per variant'
            })

        return report

    def visualize_experiment_results(self, experiment_id, save_path=None):
        """可视化实验结果"""
        if experiment_id not in self.experiments:
            print(f"实验 {experiment_id} 不存在")
            return

        experiment = self.experiments[experiment_id]
        variants = experiment['variants']

        # 创建图表
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle(f'实验结果: {experiment["name"]}', fontsize=16)

        # 1. 转化率对比
        conversion_rates = []
        variant_names = []
        for variant in variants:
            metrics = self.calculate_variant_metrics(experiment_id, variant)
            conversion_rates.append(metrics.get('conversion_rate', 0))
            variant_names.append(f'{variant}\n(n={metrics.get("impressions", 0)})')

        axes[0, 0].bar(variant_names, conversion_rates, color=['#1f77b4', '#ff7f0e'])
        axes[0, 0].set_title('转化率对比')
        axes[0, 0].set_ylabel('转化率')
        axes[0, 0].tick_params(axis='x', rotation=45)

        # 2. 样本量对比
        sample_sizes = []
        for variant in variants:
            metrics = self.calculate_variant_metrics(experiment_id, variant)
            sample_sizes.append(metrics.get('impressions', 0))

        axes[0, 1].bar(variant_names, sample_sizes, color=['#2ca02c', '#d62728'])
        axes[0, 1].set_title('样本量对比')
        axes[0, 1].set_ylabel('展示次数')
        axes[0, 1].tick_params(axis='x', rotation=45)

        # 3. 转化数量对比
        conversion_counts = []
        for variant in variants:
            metrics = self.calculate_variant_metrics(experiment_id, variant)
            conversion_counts.append(metrics.get('conversions', 0))

        axes[1, 0].bar(variant_names, conversion_counts, color=['#9467bd', '#8c564b'])
        axes[1, 0].set_title('转化数量对比')
        axes[1, 0].set_ylabel('转化次数')
        axes[1, 0].tick_params(axis='x', rotation=45)

        # 4. 时间趋势（如果有时间数据）
        # 这里简化处理，实际应该按时间聚合数据
        axes[1, 1].text(0.5, 0.5, '时间趋势分析\n需要更多时间序列数据',
                       ha='center', va='center', transform=axes[1, 1].transAxes)
        axes[1, 1].set_title('时间趋势')
        axes[1, 1].axis('off')

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
        else:
            plt.show()

    def conclude_experiment(self, experiment_id, winning_variant=None, reason=None):
        """结束实验"""
        if experiment_id not in self.experiments:
            raise ValueError(f"实验 {experiment_id} 不存在")

        experiment = self.experiments[experiment_id]
        experiment['status'] = 'concluded'
        experiment['end_date'] = datetime.now()

        if winning_variant:
            experiment['winning_variant'] = winning_variant
        if reason:
            experiment['conclusion_reason'] = reason

        print(f"实验 {experiment_id} 已结束")
        return experiment

class MultiVariateTesting(ABTestFramework):
    """多变体测试扩展"""

    def __init__(self):
        super().__init__()
        self.factorial_designs = {}

    def create_factorial_experiment(self, experiment_id, factors, levels):
        """创建因子实验"""
        print(f"正在创建因子实验: {experiment_id}")

        # 生成所有可能的组合
        import itertools
        factor_names = list(factors.keys())
        factor_levels = list(levels.values())

        # 生成所有组合
        combinations = list(itertools.product(*factor_levels))

        # 创建变体名称
        variants = []
        for combo in combinations:
            variant_name = "_".join([f"{factor}_{value}" for factor, value in zip(factor_names, combo)])
            variants.append(variant_name)

        # 创建实验配置
        experiment_config = {
            'name': f"Factorial Experiment: {experiment_id}",
            'description': f"Testing factors: {list(factors.keys())}",
            'variants': variants,
            'traffic_split': [1/len(variants)] * len(variants),
            'factors': factors,
            'levels': levels
        }

        experiment = self.create_experiment(experiment_id, experiment_config)
        self.factorial_designs[experiment_id] = {
            'factors': factors,
            'levels': levels,
            'combinations': combinations
        }

        return experiment

    def analyze_factorial_effects(self, experiment_id):
        """分析因子效应"""
        if experiment_id not in self.factorial_designs:
            print("不是因子实验")
            return {}

        design = self.factorial_designs[experiment_id]
        factors = design['factors']
        combinations = design['combinations']

        # 收集各组合的结果
        combination_results = {}
        for i, combo in enumerate(combinations):
            variant_name = "_".join([f"{factor}_{value}" for factor, value in zip(factors.keys(), combo)])
            metrics = self.calculate_variant_metrics(experiment_id, variant_name)
            combination_results[combo] = metrics.get('conversion_rate', 0)

        # 计算主效应
        main_effects = {}
        for factor in factors.keys():
            factor_levels = design['levels'][factor]
            effect_values = []

            for level in factor_levels:
                # 计算该因子水平下的平均转化率
                level_combinations = [combo for combo in combinations if combo[factors.keys().index(factor)] == level]
                level_rates = [combination_results[combo] for combo in level_combinations if combo in combination_results]
                avg_rate = np.mean(level_rates) if level_rates else 0
                effect_values.append(avg_rate)

            main_effects[factor] = {
                'levels': factor_levels,
                'effects': effect_values,
                'range': max(effect_values) - min(effect_values)
            }

        # 计算交互效应（简化版）
        interaction_effects = {}
        factor_names = list(factors.keys())
        if len(factor_names) >= 2:
            for i, factor1 in enumerate(factor_names):
                for j, factor2 in enumerate(factor_names[i+1:], i+1):
                    interaction_key = f"{factor1}_x_{factor2}"
                    # 这里可以实现更复杂的交互效应计算
                    interaction_effects[interaction_key] = {
                        'status': 'calculated',
                        'description': f'Interaction between {factor1} and {factor2}'
                    }

        return {
            'main_effects': main_effects,
            'interaction_effects': interaction_effects,
            'best_combination': max(combination_results, key=combination_results.get) if combination_results else None
        }

def main():
    """主函数 - 测试AB测试框架"""
    print("开始测试AB测试框架...")

    # 创建AB测试框架
    ab_framework = ABTestFramework()

    # 创建一个简单的AB测试实验
    experiment_config = {
        'name': '推荐算法对比测试',
        'description': '对比新算法与现有算法的效果',
        'variants': ['current_algorithm', 'new_algorithm'],
        'traffic_split': [0.5, 0.5],
        'target_metrics': ['ctr', 'conversion'],
        'primary_metric': 'conversion_rate'
    }

    experiment_id = 'rec_algo_comparison'
    ab_framework.create_experiment(experiment_id, experiment_config)

    # 模拟用户分配和数据收集
    np.random.seed(42)
    n_users = 5000

    print("正在模拟用户数据...")
    for i in range(n_users):
        user_id = f"USER_{i:06d}"

        # 分配用户到变体
        variant = ab_framework.assign_user_to_variant(user_id, experiment_id)

        # 记录展示
        ab_framework.record_impression(user_id, experiment_id, variant)

        # 模拟转化（新算法有轻微优势）
        if variant == 'current_algorithm':
            conversion_prob = 0.05  # 5%转化率
        else:
            conversion_prob = 0.07  # 7%转化率

        if np.random.random() < conversion_prob:
            ab_framework.record_conversion(user_id, experiment_id, variant, value=100.0)

    # 生成实验报告
    print("\n=== 实验报告 ===")
    report = ab_framework.generate_experiment_report(experiment_id)

    print(f"实验名称: {report['experiment_name']}")
    print(f"总样本量: {report['total_sample_size']}")
    print("\n各变体表现:")
    for variant, metrics in report['variants'].items():
        print(f"  {variant}:")
        print(f"    展示次数: {metrics['impressions']}")
        print(f"    转化次数: {metrics['conversions']}")
        print(f"    转化率: {metrics['conversion_rate']:.4f}")

    print(f"\n统计显著性分析:")
    sig_analysis = report['statistical_analysis']
    if sig_analysis.get('status') == 'completed':
        print(f"  控制组转化率: {sig_analysis['control_rate']:.4f}")
        print(f"  实验组转化率: {sig_analysis['treatment_rate']:.4f}")
        print(f"  相对提升: {sig_analysis['relative_improvement']:.2f}%")
        print(f"  P值: {sig_analysis['p_value']:.6f}")
        print(f"  是否显著: {sig_analysis['is_significant']}")
        print(f"  置信区间: {sig_analysis['confidence_interval']}")

    print(f"\n建议:")
    for rec in report['recommendations']:
        print(f"  - {rec['type']}: {rec.get('reason', rec.get('suggestion', ''))}")

    # 测试多变体实验
    print("\n=== 多变体测试 ===")
    mv_framework = MultiVariateTesting()

    factorial_config = {
        'name': '推荐策略因子实验',
        'factors': {
            'algorithm': ['collaborative', 'content_based'],
            'diversification': ['low', 'high'],
            'personalization': ['weak', 'strong']
        }
    }

    mv_framework.create_factorial_experiment(
        'factorial_rec_test',
        {'algorithm': ['collaborative', 'content_based'], 'diversification': ['low', 'high']},
        {'algorithm': ['collaborative', 'content_based'], 'diversification': ['low', 'high']}
    )

    print("多变体测试实验创建完成!")

    print("\nAB测试框架测试完成!")
    return ab_framework, mv_framework, report

if __name__ == "__main__":
    ab_framework, mv_framework, report = main()