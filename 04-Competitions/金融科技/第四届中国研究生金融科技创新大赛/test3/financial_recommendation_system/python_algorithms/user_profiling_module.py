"""
用户特性模块
构建客户全生命周期特征，结合社会属性、金融行为、发展阶段进行用户画像
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestClassifier
import warnings
warnings.filterwarnings('ignore')

class UserProfileBuilder:
    """用户画像构建器"""

    def __init__(self):
        self.user_features = {}
        self.encoders = {}
        self.scaler = StandardScaler()

    def extract_demographic_features(self, cust_df):
        """提取用户人口统计特征"""
        print("正在提取用户人口统计特征...")

        # 处理出生年月 - 计算年龄
        current_year = 2024
        cust_df['age'] = current_year - pd.to_datetime(cust_df['birth_ym'], format='%Y-%m', errors='coerce').dt.year

        # 年龄分段
        cust_df['age_group'] = pd.cut(cust_df['age'],
                                    bins=[0, 25, 35, 45, 55, 65, 100],
                                    labels=['18-25', '26-35', '36-45', '46-55', '56-65', '65+'],
                                    right=False)

        # 处理开户日期 - 计算客户龄期
        cust_df['init_date'] = pd.to_datetime(cust_df['init_dt'], errors='coerce')
        cust_df['customer_tenure_days'] = (pd.Timestamp('2024-12-31') - cust_df['init_date']).dt.days

        # 客户龄期分段
        cust_df['tenure_group'] = pd.cut(cust_df['customer_tenure_days'],
                                       bins=[0, 365, 1095, 1825, 3650, float('inf')],
                                       labels=['新客户', '1-3年', '3-5年', '5-10年', '10年+'])

        # 编码分类特征
        for col in ['loc_cd', 'gender']:
            if col in cust_df.columns:
                le = LabelEncoder()
                # 先处理缺失值，避免类别冲突
                temp_col = cust_df[col].astype(str).fillna('unknown')
                cust_df[f'{col}_encoded'] = le.fit_transform(temp_col)
                self.encoders[col] = le

        # 对于分箱变量，直接使用数值编码
        for col in ['age_group', 'tenure_group']:
            if col in cust_df.columns:
                cust_df[col] = cust_df[col].cat.add_categories(['unknown']).fillna('unknown')
                le = LabelEncoder()
                cust_df[f'{col}_encoded'] = le.fit_transform(cust_df[col])
                self.encoders[col] = le

        demographic_features = cust_df[['cust_no', 'age', 'customer_tenure_days',
                                      'loc_cd_encoded', 'gender_encoded',
                                      'age_group_encoded', 'tenure_group_encoded']].copy()

        return demographic_features

    def extract_financial_behavior_features(self, event_df):
        """提取用户金融行为特征"""
        print("正在提取用户金融行为特征...")

        # 按客户聚合行为特征
        user_behavior = event_df.groupby('cust_no').agg({
            'prod_id': 'nunique',  # 持有产品种类数
            'event_type': ['count', lambda x: (x == 'A').sum()],  # 总事件数和开立事件数
            'event_level': 'nunique',  # 涉及事件级别数
            'event_term': ['mean', 'std'],  # 平均期限
            'event_rate': ['mean', 'std'],  # 平均利率
            'event_amt': ['mean', 'std', 'sum']  # 金额统计
        }).fillna(0)

        # 重命名列
        user_behavior.columns = [
            'product_variety', 'total_events', 'opening_events',
            'event_level_variety', 'avg_term', 'std_term',
            'avg_rate', 'std_rate', 'avg_amount', 'std_amount', 'total_amount'
        ]

        # 计算活跃度指标
        user_behavior['events_per_product'] = user_behavior['total_events'] / user_behavior['product_variety']
        user_behavior['opening_rate'] = user_behavior['opening_events'] / user_behavior['total_events']

        return user_behavior

    def analyze_product_portfolio(self, event_df):
        """分析用户产品组合特征"""
        print("正在分析用户产品组合...")

        # 创建客户-产品矩阵
        user_product_matrix = event_df.groupby(['cust_no', 'prod_id']).size().unstack(fill_value=0)
        user_product_matrix = (user_product_matrix > 0).astype(int)

        # 计算产品多样性
        user_portfolio_features = pd.DataFrame({
            'product_count': user_product_matrix.sum(axis=1),
            'product_diversity': user_product_matrix.apply(
                lambda row: len([x for x in row if x > 0]), axis=1
            )
        })

        # 分析产品类别分布
        # 假设产品ID第一位代表类别：D-储蓄，C-信贷，A-财富，N-渠道，P-支付
        product_categories = {}
        for prod_id in user_product_matrix.columns:
            if isinstance(prod_id, str) and prod_id.startswith('PROD_'):
                # 简化分类逻辑，实际应该基于productLabels文件
                product_categories[prod_id] = 'D'  # 默认为储蓄类
            elif isinstance(prod_id, str) and prod_id.startswith('C'):
                product_categories[prod_id] = 'C'  # 信贷类
            else:
                product_categories[prod_id] = 'D'  # 默认储蓄类

        # 统计各类产品持有情况
        for category in ['D', 'C', 'A', 'N', 'P']:
            category_products = [prod for prod, cat in product_categories.items() if cat == category]
            if category_products:
                user_portfolio_features[f'{category}_products'] = user_product_matrix[category_products].sum(axis=1)
            else:
                user_portfolio_features[f'{category}_products'] = 0

        return user_portfolio_features

    def analyze_temporal_patterns(self, event_df):
        """分析用户时间行为模式"""
        print("正在分析用户时间行为模式...")

        event_df['event_date'] = pd.to_datetime(event_df['event_date'])
        event_df['month'] = event_df['event_date'].dt.month
        event_df['quarter'] = event_df['event_date'].dt.quarter
        event_df['weekday'] = event_df['event_date'].dt.dayofweek

        # 按客户统计时间模式特征
        temporal_features = event_df.groupby('cust_no').agg({
            'month': lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 6,  # 最活跃月份
            'quarter': lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 2,  # 最活跃季度
            'weekday': lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 1,  # 最活跃星期几
            'event_date': ['min', 'max']  # 首次和最后活动时间
        }).fillna(0)

        # 重命名列
        temporal_features.columns = ['most_active_month', 'most_active_quarter',
                                   'most_active_weekday', 'first_activity', 'last_activity']

        # 计算活动天数跨度
        temporal_features['activity_span_days'] = (
            pd.to_datetime(temporal_features['last_activity']) - pd.to_datetime(temporal_features['first_activity'])
        ).dt.days.fillna(0)

        # 计算活动频率
        user_event_counts = event_df.groupby('cust_no').size()
        temporal_features['activity_frequency'] = user_event_counts / (temporal_features['activity_span_days'] + 1)

        # 移除时间戳列，只保留计算出的数值特征
        temporal_features = temporal_features.drop(['first_activity', 'last_activity'], axis=1)

        return temporal_features

    def calculate_life_stage_features(self, cust_df):
        """计算生命周期阶段特征"""
        print("正在计算生命周期特征...")

        current_year = 2024
        cust_df['age'] = current_year - pd.to_datetime(cust_df['birth_ym'], format='%Y-%m', errors='coerce').dt.year

        # 定义生命周期阶段
        def get_life_stage(age):
            if pd.isna(age):
                return 'unknown'
            elif age < 25:
                return 'student_young_adult'
            elif age < 35:
                return 'early_career'
            elif age < 45:
                return 'family_formation'
            elif age < 55:
                return 'peak_earning'
            elif age < 65:
                return 'pre_retirement'
            else:
                return 'retirement'

        cust_df['life_stage'] = cust_df['age'].apply(get_life_stage)

        # 生命周期阶段编码
        le = LabelEncoder()
        cust_df['life_stage_encoded'] = le.fit_transform(cust_df['life_stage'])
        self.encoders['life_stage'] = le

        life_stage_features = cust_df[['cust_no', 'age', 'life_stage_encoded']].copy()

        return life_stage_features

    def extract_risk_profile_features(self, event_df):
        """提取用户风险偏好特征"""
        print("正在分析用户风险偏好...")

        # 基于产品持有和交易行为推断风险偏好
        user_risk_features = pd.DataFrame()

        # 假设不同产品对应不同风险等级
        risk_levels = {
            'D': 1,  # 储蓄类 - 低风险
            'C': 3,  # 信贷类 - 中风险
            'A': 4,  # 财富类 - 中高风险
            'N': 2,  # 渠道类 - 低风险
            'P': 3   # 支付类 - 中风险
        }

        # 统计各类产品的使用情况来评估风险偏好
        product_usage = event_df.groupby('cust_no')['prod_id'].apply(list)

        risk_scores = []
        diversification_scores = []

        for cust_id, products in product_usage.items():
            if not products:
                risk_scores.append(1)
                diversification_scores.append(0)
                continue

            # 计算加权平均风险得分
            product_risks = []
            for prod in products:
                # 简化的产品分类逻辑
                if isinstance(prod, str) and prod.startswith('C'):
                    product_risks.append(risk_levels['C'])
                elif isinstance(prod, str) and prod.startswith('A'):
                    product_risks.append(risk_levels['A'])
                else:
                    product_risks.append(risk_levels['D'])

            avg_risk = np.mean(product_risks) if product_risks else 1
            risk_scores.append(avg_risk)

            # 计算产品多样化程度
            unique_products = len(set(products))
            diversification_scores.append(unique_products / len(products) if products else 0)

        user_risk_features['cust_no'] = product_usage.index
        user_risk_features['risk_score'] = risk_scores
        user_risk_features['product_diversification'] = diversification_scores

        return user_risk_features.set_index('cust_no')

    def build_comprehensive_profile(self, cust_df, event_df):
        """构建综合用户画像"""
        print("开始构建综合用户画像...")

        # 提取各类特征
        demographic_features = self.extract_demographic_features(cust_df)
        behavior_features = self.extract_financial_behavior_features(event_df)
        portfolio_features = self.analyze_product_portfolio(event_df)
        temporal_features = self.analyze_temporal_patterns(event_df)
        life_stage_features = self.calculate_life_stage_features(cust_df)
        risk_features = self.extract_risk_profile_features(event_df)

        # 合并所有特征，避免重复列名
        user_profiles = demographic_features.set_index('cust_no').join([
            behavior_features,
            portfolio_features,
            temporal_features,
            life_stage_features.set_index('cust_no').add_suffix('_lifestage'),
            risk_features
        ], how='left').fillna(0)

        # 移除时间戳列，然后标准化数值特征
        non_timestamp_cols = [col for col in user_profiles.columns
                             if not any(x in str(user_profiles[col].dtype) for x in ['datetime', 'timestamp'])]
        user_profiles_clean = user_profiles[non_timestamp_cols]

        numeric_columns = user_profiles_clean.select_dtypes(include=[np.number]).columns
        user_profiles_clean[numeric_columns] = self.scaler.fit_transform(user_profiles_clean[numeric_columns])

        print(f"成功构建 {len(user_profiles_clean)} 个用户的综合画像")
        print(f"用户画像特征维度: {user_profiles_clean.shape[1]}")

        return user_profiles_clean

    def generate_profile_vectors(self, user_profiles):
        """生成用户画像向量"""
        print("正在生成用户画像向量...")

        # 使用PCA降维
        pca = PCA(n_components=min(50, len(user_profiles.columns)))
        profile_vectors = pca.fit_transform(user_profiles)

        # 创建向量字典
        user_vectors = {}
        for i, cust_id in enumerate(user_profiles.index):
            user_vectors[cust_id] = profile_vectors[i]

        explained_variance = sum(pca.explained_variance_ratio_[:20])  # 前20个成分解释的方差
        print(f"用户画像向量维度: {profile_vectors.shape[1]}")
        print(f"前20维成分解释方差比: {explained_variance:.3f}")

        return user_vectors, pca

class UserProfileSegmentation:
    """用户画像分割器"""

    def __init__(self):
        self.kmeans = None
        self.segment_labels = {}

    def segment_users(self, user_profiles, n_segments=8):
        """对用户进行分割"""
        print(f"正在对用户进行 {n_segments} 类分割...")

        # 使用K-means进行用户分割
        self.kmeans = KMeans(n_clusters=n_segments, random_state=42, n_init=10)
        segment_labels = self.kmeans.fit_predict(user_profiles)

        # 创建分割标签字典
        user_segments = {}
        for i, (user_id, label) in enumerate(zip(user_profiles.index, segment_labels)):
            user_segments[user_id] = label

        # 分析每个分割的特征
        user_profiles_with_segments = user_profiles.copy()
        user_profiles_with_segments['segment'] = segment_labels

        segment_profiles = user_profiles_with_segments.groupby('segment').mean()

        print(f"用户分割完成，共 {n_segments} 个用户群体")
        print("\n各用户群体规模:")
        segment_counts = pd.Series(segment_labels).value_counts().sort_index()
        for segment_id, count in segment_counts.items():
            print(f"  群体 {segment_id}: {count} 用户 ({count/len(user_profiles)*100:.1f}%)")

        return user_segments, segment_profiles

    def analyze_segment_characteristics(self, segment_profiles, feature_names):
        """分析用户群体特征"""
        print("\n=== 用户群体特征分析 ===")

        # 为每个群体生成描述性标签
        segment_descriptions = {}

        for segment_id, profile in segment_profiles.iterrows():
            description_parts = []

            # 基于主要特征生成描述
            top_features = profile.abs().sort_values(ascending=False).head(5)

            for feature, value in top_features.items():
                if value > 0.5:  # 正向特征
                    description_parts.append(f"高{feature}")
                elif value < -0.5:  # 负向特征
                    description_parts.append(f"低{feature}")

            if description_parts:
                segment_descriptions[segment_id] = f"群体{segment_id}: " + ", ".join(description_parts[:3])
            else:
                segment_descriptions[segment_id] = f"群体{segment_id}: 综合型用户"

        for segment_id, description in segment_descriptions.items():
            print(f"  {description}")

        return segment_descriptions

def main():
    """主函数 - 构建用户画像"""

    print("开始构建用户画像模块...")

    # 读取数据 (先用测试数据)
    try:
        cust_df = pd.read_csv("E:/project finance/data/cust_dataset.csv", nrows=10000)  # 读取前1万行测试
        event_df = pd.read_csv("E:/project finance/data/event_dataset.csv", nrows=50000)  # 读取前5万行测试
        print(f"成功读取真实数据: {len(cust_df)} 客户, {len(event_df)} 事件")
    except:
        print("使用模拟数据进行演示...")
        # 创建模拟客户数据
        np.random.seed(42)
        n_customers = 5000

        cust_data = {
            'cust_no': [f"CUST_{i:06d}" for i in range(n_customers)],
            'birth_ym': pd.date_range('1950-01-01', '2005-12-31', periods=n_customers).strftime('%Y-%m'),
            'loc_cd': np.random.choice(['L001', 'L002', 'L003', 'L004'], n_customers),
            'gender': np.random.choice(['M', 'F'], n_customers),
            'init_dt': pd.date_range('2000-01-01', '2024-12-31', periods=n_customers).strftime('%Y-%m-%d'),
            'edu_bg': np.random.choice(['', '本科', '专科', '高中', '硕士'], n_customers, p=[0.3, 0.3, 0.2, 0.15, 0.05]),
            'marriage_situ_cd': np.random.choice(['', '已婚', '未婚', '离异'], n_customers, p=[0.2, 0.5, 0.25, 0.05])
        }
        cust_df = pd.DataFrame(cust_data)

        # 创建模拟事件数据
        n_events = 20000
        event_data = {
            'cust_no': np.random.choice(cust_df['cust_no'], n_events),
            'prod_id': [f"PROD_{np.random.randint(1, 10):04d}" for _ in range(n_events)],
            'event_type': np.random.choice(['A', 'B', 'D'], n_events, p=[0.4, 0.4, 0.2]),
            'event_level': np.random.choice(['A', 'B', 'C'], n_events),
            'event_date': pd.date_range('2024-01-01', '2024-12-31', periods=n_events),
            'event_term': np.random.randint(1, 60, n_events),
            'event_rate': np.random.uniform(0.01, 0.15, n_events),
            'event_amt': np.random.uniform(1000, 100000, n_events)
        }
        event_df = pd.DataFrame(event_data)

    # 构建用户画像
    print("\n=== 构建用户画像 ===")
    profile_builder = UserProfileBuilder()
    user_profiles = profile_builder.build_comprehensive_profile(cust_df, event_df)

    # 生成用户画像向量
    user_vectors, pca = profile_builder.generate_profile_vectors(user_profiles)

    # 用户分割
    print("\n=== 用户分割分析 ===")
    segmenter = UserProfileSegmentation()
    user_segments, segment_profiles = segmenter.segment_users(user_profiles, n_segments=6)

    # 分析用户群体特征
    segment_descriptions = segmenter.analyze_segment_characteristics(
        segment_profiles, user_profiles.columns
    )

    # 保存结果
    results = {
        'user_profiles': user_profiles,
        'user_vectors': user_vectors,
        'user_segments': user_segments,
        'segment_profiles': segment_profiles,
        'segment_descriptions': segment_descriptions,
        'pca_model': pca,
        'profile_builder': profile_builder,
        'segmenter': segmenter
    }

    print("\n用户画像模块构建完成!")
    return results

if __name__ == "__main__":
    results = main()