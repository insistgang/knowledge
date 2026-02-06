"""
产品关联性分析模块
基于提供的数据集分析产品间的替代性、互补性、竞争性关系
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import PCA
from scipy.stats import pearsonr
import seaborn as sns
import matplotlib.pyplot as plt
import warnings
warnings.filterwarnings('ignore')

class ProductFeatureExtractor:
    """产品特性提取器"""

    def __init__(self):
        self.product_features = {}
        self.product_categories = {'D': '储蓄类', 'C': '信贷类', 'A': '财富类', 'N': '渠道类', 'P': '委托支付类'}
        self.encoder = LabelEncoder()
        self.scaler = StandardScaler()

    def extract_from_event_data(self, event_df):
        """从事件数据中提取产品行为特征"""
        print("正在从事件数据提取产品特征...")

        # 按产品聚合统计特征
        product_stats = event_df.groupby('prod_id').agg({
            'cust_no': 'count',  # 持有客户数
            'event_type': lambda x: (x == 'A').sum(),  # 开立事件数
            'event_level': 'nunique',  # 涉及的事件级别数
            'event_term': ['mean', 'std'],  # 平均期限和标准差
            'event_rate': ['mean', 'std'],  # 平均利率和标准差
            'event_amt': ['mean', 'std']    # 平均金额和标准差
        }).fillna(0)

        # 重命名列
        product_stats.columns = [
            'total_customers', 'open_events', 'unique_event_levels',
            'avg_term', 'std_term', 'avg_rate', 'std_rate', 'avg_amount', 'std_amount'
        ]

        # 计算产品渗透率 (总客户数基于cust_dataset)
        total_customers = 1108827  # 从数据集描述获得
        product_stats['penetration_rate'] = product_stats['total_customers'] / total_customers

        # 计算产品活跃度指标
        monthly_activity = event_df.groupby(['prod_id', pd.to_datetime(event_df['event_date']).dt.month])['cust_no'].count().groupby('prod_id').mean()
        product_stats['monthly_activity'] = monthly_activity

        # 计算产品粘性指标 (平均每客户事件数)
        product_events = event_df.groupby('prod_id')['cust_no'].count()
        product_customers = event_df.groupby('prod_id')['cust_no'].nunique()
        product_stats['events_per_customer'] = product_events / product_customers

        return product_stats

    def calculate_temporal_patterns(self, event_df):
        """计算产品的时间模式特征"""
        print("正在分析产品时间模式...")

        event_df['event_date'] = pd.to_datetime(event_df['event_date'])
        event_df['month'] = event_df['event_date'].dt.month
        event_df['quarter'] = event_df['event_date'].dt.quarter

        # 季节性模式
        seasonal_patterns = event_df.groupby(['prod_id', 'quarter'])['cust_no'].count().unstack(fill_value=0)
        seasonal_patterns = seasonal_patterns.div(seasonal_patterns.sum(axis=1), axis=0)  # 归一化

        # 增长趋势
        monthly_counts = event_df.groupby(['prod_id', 'month'])['cust_no'].count().unstack(fill_value=0)
        growth_trends = {}
        for prod_id in monthly_counts.index:
            if len(monthly_counts.loc[prod_id]) > 1:
                trend = np.polyfit(range(len(monthly_counts.loc[prod_id])), monthly_counts.loc[prod_id], 1)[0]
                growth_trends[prod_id] = trend
            else:
                growth_trends[prod_id] = 0

        return seasonal_patterns, growth_trends

    def analyze_customer_overlap(self, event_df):
        """分析客户在产品间的重叠情况"""
        print("正在分析客户产品重叠...")

        # 创建产品-客户矩阵
        product_customer_matrix = event_df.groupby(['prod_id', 'cust_no']).size().unstack(fill_value=0)
        product_customer_matrix = (product_customer_matrix > 0).astype(int)

        # 计算产品间的Jaccard相似度
        products = product_customer_matrix.index.tolist()
        jaccard_similarities = {}

        for i, prod1 in enumerate(products):
            for j, prod2 in enumerate(products[i+1:], i+1):
                intersection = np.sum((product_customer_matrix.loc[prod1] > 0) & (product_customer_matrix.loc[prod2] > 0))
                union = np.sum((product_customer_matrix.loc[prod1] > 0) | (product_customer_matrix.loc[prod2] > 0))
                jaccard_sim = intersection / union if union > 0 else 0
                jaccard_similarities[(str(prod1), str(prod2))] = jaccard_sim

        return product_customer_matrix, jaccard_similarities

    def extract_product_attributes(self, event_df, cust_df=None):
        """综合提取产品属性特征"""
        print("开始提取产品综合属性...")

        # 基础统计特征
        product_stats = self.extract_from_event_data(event_df)

        # 时间模式特征
        seasonal_patterns, growth_trends = self.calculate_temporal_patterns(event_df)

        # 客户重叠分析
        product_customer_matrix, jaccard_similarities = self.analyze_customer_overlap(event_df)

        # 构建产品特征向量
        product_features = {}

        for prod_id in event_df['prod_id'].unique():
            features = {}

            # 基础特征
            if prod_id in product_stats.index:
                features.update(product_stats.loc[prod_id].to_dict())

            # 时间特征
            features['growth_trend'] = growth_trends.get(prod_id, 0)
            if prod_id in seasonal_patterns.index:
                for q in range(1, 5):
                    features[f'seasonal_q{q}'] = seasonal_patterns.loc[prod_id, q] if q in seasonal_patterns.columns else 0

            # 客户重叠特征 (计算与其他产品的平均重叠度)
            overlap_scores = [jaccard_similarities.get(tuple(sorted((str(prod_id), str(other)))), 0)
                             for other in event_df['prod_id'].unique() if other != prod_id]
            features['avg_customer_overlap'] = np.mean(overlap_scores) if overlap_scores else 0
            features['max_customer_overlap'] = np.max(overlap_scores) if overlap_scores else 0

            product_features[prod_id] = features

        return pd.DataFrame(product_features).T

class ProductAssociationAnalyzer:
    """产品关联性分析器"""

    def __init__(self, product_features_df):
        self.product_features = product_features_df
        self.associations = {}

    def analyze_complementarity(self, event_df):
        """分析产品互补性"""
        print("正在分析产品互补性...")

        # 创建客户-产品持有矩阵
        customer_products = event_df.groupby('cust_no')['prod_id'].apply(set).to_dict()

        # 计算产品间的共现频率和条件概率
        products = event_df['prod_id'].unique()
        complementarity_matrix = pd.DataFrame(index=products, columns=products, dtype=float)

        for prod1 in products:
            for prod2 in products:
                if prod1 == prod2:
                    complementarity_matrix.loc[prod1, prod2] = 1.0
                else:
                    # 计算P(prod2|prod1) - 在持有prod1的客户中持有prod2的比例
                    prod1_customers = {cust for cust, prods in customer_products.items() if prod1 in prods}
                    if prod1_customers:
                        prod2_in_prod1 = len([cust for cust in prod1_customers if prod2 in customer_products[cust]])
                        complementarity_matrix.loc[prod1, prod2] = prod2_in_prod1 / len(prod1_customers)
                    else:
                        complementarity_matrix.loc[prod1, prod2] = 0

        return complementarity_matrix

    def analyze_substitutability(self, event_df):
        """分析产品替代性"""
        print("正在分析产品替代性...")

        # 分析客户在同一时间窗口内持有但随后关闭的产品
        event_df_sorted = event_df.sort_values(['cust_no', 'event_date'])

        # 找出被关闭的产品对 (在较短时间内持有多个相似产品)
        substitution_candidates = {}

        for cust_id, cust_events in event_df_sorted.groupby('cust_no'):
            prod_timeline = {}

            for _, event in cust_events.iterrows():
                prod_id = event['prod_id']
                event_type = event['event_type']
                event_date = pd.to_datetime(event['event_date'])

                if prod_id not in prod_timeline:
                    prod_timeline[prod_id] = []

                prod_timeline[prod_id].append((event_type, event_date))

            # 分析产品持有时间重叠情况
            prod_list = list(prod_timeline.keys())
            for i, prod1 in enumerate(prod_list):
                for prod2 in prod_list[i+1:]:
                    if self.has_overlapping_timeline(prod_timeline[prod1], prod_timeline[prod2]):
                        if (prod1, prod2) not in substitution_candidates:
                            substitution_candidates[(prod1, prod2)] = 0
                        substitution_candidates[(prod1, prod2)] += 1

        # 计算替代性得分
        substitutability_matrix = pd.DataFrame(
            index=event_df['prod_id'].unique(),
            columns=event_df['prod_id'].unique(),
            dtype=float
        )

        for prod1 in substitutability_matrix.index:
            for prod2 in substitutability_matrix.columns:
                if prod1 == prod2:
                    substitutability_matrix.loc[prod1, prod2] = 0.0
                else:
                    score = substitution_candidates.get((prod1, prod2), 0) + substitution_candidates.get((prod2, prod1), 0)
                    total_co_occurrences = self.count_co_occurrences(event_df, prod1, prod2)
                    substitutability_matrix.loc[prod1, prod2] = score / max(total_co_occurrences, 1)

        return substitutability_matrix

    def has_overlapping_timeline(self, timeline1, timeline2):
        """检查两个产品的时间线是否有重叠"""
        # 简化版本：检查是否有开立事件而没有对应的关闭事件
        prod1_open = any(t[0] in ['A', 'B'] for t in timeline1)
        prod2_open = any(t[0] in ['A', 'B'] for t in timeline2)

        # 如果两个产品都有开立事件，认为是潜在的替代关系
        return prod1_open and prod2_open

    def count_co_occurrences(self, event_df, prod1, prod2):
        """计算两个产品共同出现在同一客户身上的次数"""
        prod1_customers = set(event_df[event_df['prod_id'] == prod1]['cust_no'])
        prod2_customers = set(event_df[event_df['prod_id'] == prod2]['cust_no'])
        return len(prod1_customers & prod2_customers)

    def analyze_competition(self, complementarity_matrix, substitutability_matrix):
        """分析产品竞争性"""
        print("正在分析产品竞争性...")

        # 竞争性 = 替代性 - 互补性
        competition_matrix = substitutability_matrix - complementarity_matrix
        competition_matrix = competition_matrix.clip(lower=0)  # 只保留正值

        return competition_matrix

    def build_association_vectors(self, complementarity_matrix, substitutability_matrix, competition_matrix):
        """构建产品关联性向量"""
        print("正在构建产品关联性向量...")

        products = self.product_features.index.tolist()
        association_vectors = {}

        for prod in products:
            vector = []
            # 互补性向量 (对其他产品的互补性)
            vector.extend(complementarity_matrix.loc[prod].values)
            # 替代性向量 (对其他产品的替代性)
            vector.extend(substitutability_matrix.loc[prod].values)
            # 竞争性向量 (对其他产品的竞争性)
            vector.extend(competition_matrix.loc[prod].values)

            association_vectors[prod] = np.array(vector)

        return association_vectors

def main():
    """主函数 - 执行产品关联性分析"""

    print("开始产品关联性分析...")

    # 读取数据 (这里先用示例数据，实际使用时读取真实数据)
    print("正在读取数据...")

    # 由于文件很大，这里先用模拟数据演示
    # 实际使用时替换为真实数据路径
    try:
        event_df = pd.read_csv("E:/project finance/data/event_dataset.csv")
        print(f"成功读取事件数据: {len(event_df)}行")
    except:
        print("使用模拟数据进行演示...")
        # 创建模拟数据
        np.random.seed(42)
        n_customers = 10000
        n_products = 20

        event_data = {
            'cust_no': [f"CUST_{i%1000:04d}" for i in range(50000)],
            'prod_id': [f"PROD_{np.random.randint(1, n_products+1):04d}" for _ in range(50000)],
            'event_type': np.random.choice(['A', 'B', 'D'], 50000, p=[0.3, 0.3, 0.1]),
            'event_level': np.random.choice(['B', 'A', 'C'], 50000),
            'event_date': pd.date_range('2024-01-01', '2024-12-31', periods=50000),
            'event_term': np.random.randint(1, 60, 50000),
            'event_rate': np.random.uniform(0.01, 0.15, 50000),
            'event_amt': np.random.uniform(1000, 100000, 50000)
        }
        event_df = pd.DataFrame(event_data)

    # 1. 产品特性提取
    print("\n=== 第一步：产品特性提取 ===")
    extractor = ProductFeatureExtractor()
    product_features = extractor.extract_product_attributes(event_df)

    print(f"提取了 {len(product_features)} 个产品的特征")
    print("产品特征维度:")
    for col in product_features.columns:
        print(f"  - {col}")

    # 2. 产品关联性分析
    print("\n=== 第二步：产品关联性分析 ===")
    analyzer = ProductAssociationAnalyzer(product_features)

    # 互补性分析
    complementarity_matrix = analyzer.analyze_complementarity(event_df)

    # 替代性分析
    substitutability_matrix = analyzer.analyze_substitutability(event_df)

    # 竞争性分析
    competition_matrix = analyzer.analyze_competition(complementarity_matrix, substitutability_matrix)

    # 构建关联性向量
    association_vectors = analyzer.build_association_vectors(
        complementarity_matrix, substitutability_matrix, competition_matrix
    )

    print(f"构建了 {len(association_vectors)} 个产品的关联性向量")

    # 3. 结果输出
    print("\n=== 分析结果摘要 ===")

    # 找出最具互补性的产品对
    complementarity_no_diag = complementarity_matrix.where(~np.eye(complementarity_matrix.shape[0], dtype=bool))
    max_comp_pair = complementarity_no_diag.stack().idxmax()
    print(f"最具互补性产品对: {max_comp_pair}, 互补性得分: {complementarity_no_diag.stack().max():.4f}")

    # 找出最具替代性的产品对
    substitutability_no_diag = substitutability_matrix.where(~np.eye(substitutability_matrix.shape[0], dtype=bool))
    max_sub_pair = substitutability_no_diag.stack().idxmax()
    print(f"最具替代性产品对: {max_sub_pair}, 替代性得分: {substitutability_no_diag.stack().max():.4f}")

    # 找出最具竞争性的产品对
    competition_no_diag = competition_matrix.where(~np.eye(competition_matrix.shape[0], dtype=bool))
    max_comp_pair = competition_no_diag.stack().idxmax()
    print(f"最具竞争性产品对: {max_comp_pair}, 竞争性得分: {competition_no_diag.stack().max():.4f}")

    # 保存结果
    results = {
        'product_features': product_features,
        'complementarity_matrix': complementarity_matrix,
        'substitutability_matrix': substitutability_matrix,
        'competition_matrix': competition_matrix,
        'association_vectors': association_vectors
    }

    # 这里可以保存到文件供后续模块使用
    print("\n产品关联性分析模块完成!")
    return results

if __name__ == "__main__":
    results = main()