"""
50个特征重要性简化可视化分析
使用真实的特征名称
"""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os
from load_target_domain_data import load_real_target_domain_data

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei']
plt.rcParams['axes.unicode_minus'] = False

def create_feature_importance_visualization():
    """创建特征重要性可视化"""
    print("创建50个特征重要性可视化...")

    # 加载真实特征名称
    _, _, target_info = load_real_target_domain_data()
    feature_names = target_info.get('feature_names', None)
    if feature_names is not None:
        print(f"使用真实特征名称: {len(feature_names)} 个特征")
        print(f"前5个特征名称: {feature_names[:5]}")
    else:
        feature_names = [f'Feature_{i}' for i in range(50)]
        print("使用默认特征名称")

    # 加载特征重要性文件
    methods_data = {}
    files = [
        ('Unsupervised', '无监督域适应_feature_importance.csv'),
        ('Pseudo-Label', '伪标签方法_feature_importance.csv'),
        ('Adversarial', '对抗域适应_feature_importance.csv')
    ]

    for method_name, filename in files:
        if os.path.exists(filename):
            df = pd.read_csv(filename)
            methods_data[method_name] = df
            print(f"加载: {method_name}")

    if not methods_data:
        print("未找到特征重要性文件")
        return

    # 创建可视化
    plt.figure(figsize=(16, 12))

    # 1. Top 20特征重要性对比
    plt.subplot(2, 2, 1)
    for method, df in methods_data.items():
        top_features = df.nlargest(20, 'importance')
        plt.bar(range(20), top_features['importance'], alpha=0.7, label=method)

    plt.xlabel('Top 20 特征')
    plt.ylabel('重要性分数')
    plt.title('Top 20 特征重要性对比')
    plt.legend()
    plt.grid(True, alpha=0.3)

    # 2. 特征重要性分布
    plt.subplot(2, 2, 2)
    for method, df in methods_data.items():
        plt.hist(df['importance'], bins=20, alpha=0.6, label=method)

    plt.xlabel('重要性分数')
    plt.ylabel('特征数量')
    plt.title('特征重要性分布')
    plt.legend()
    plt.grid(True, alpha=0.3)

    # 3. 所有50个特征的重要性热力图
    plt.subplot(2, 2, 3)
    heatmap_data = np.zeros((len(methods_data), 50))

    for i, (method, df) in enumerate(methods_data.items()):
        for _, row in df.iterrows():
            if row['feature_index'] < 50:
                heatmap_data[i, row['feature_index']] = row['importance']

    sns.heatmap(heatmap_data,
                xticklabels=False,
                yticklabels=list(methods_data.keys()),
                cmap='YlOrRd',
                cbar_kws={'label': '重要性分数'})
    plt.title('所有50个特征重要性热力图')
    plt.xlabel('特征 (1-50)')
    plt.ylabel('方法')

    # 4. 平均重要性排名
    plt.subplot(2, 2, 4)
    avg_importance = np.zeros(50)
    for method, df in methods_data.items():
        for _, row in df.iterrows():
            if row['feature_index'] < 50:
                avg_importance[row['feature_index']] += row['importance']

    avg_importance /= len(methods_data)
    top_15_indices = np.argsort(avg_importance)[-15:][::-1]

    plt.barh(range(15), avg_importance[top_15_indices], color='skyblue')
    # 使用真实特征名称
    ytick_labels = []
    for i in top_15_indices:
        if feature_names is not None and len(feature_names) > i:
            ytick_labels.append(feature_names[i])
        else:
            ytick_labels.append(f'F{i+1}')
    plt.yticks(range(15), ytick_labels)
    plt.xlabel('平均重要性分数')
    plt.title('Top 15 最重要特征 (平均排名)')
    plt.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig('feature_importance_comprehensive.png', dpi=300, bbox_inches='tight')
    plt.show()

    # 生成详细统计
    generate_feature_statistics(methods_data, avg_importance, feature_names)

def generate_feature_statistics(methods_data, avg_importance, feature_names):
    """生成特征重要性统计信息"""
    print("\n" + "="*60)
    print("50个特征重要性统计分析")
    print("="*60)

    # 总体统计
    print(f"\n总体统计:")
    print(f"特征总数: 50")
    print(f"平均重要性: {avg_importance.mean():.4f}")
    print(f"最大重要性: {avg_importance.max():.4f}")
    print(f"最小重要性: {avg_importance.min():.4f}")
    print(f"标准差: {avg_importance.std():.4f}")

    # 各方法统计
    print(f"\n各方法统计:")
    for method, df in methods_data.items():
        importance = df['importance']
        print(f"\n{method}:")
        print(f"  平均重要性: {importance.mean():.4f}")
        print(f"  最大重要性: {importance.max():.4f}")
        print(f"  重要特征数量(>0.01): {(importance > 0.01).sum()}")
        print(f"  高重要特征数量(>0.05): {(importance > 0.05).sum()}")

    # Top 10 特征详情
    print(f"\nTop 10 最重要特征:")
    top_10_indices = np.argsort(avg_importance)[-10:][::-1]
    for i, idx in enumerate(top_10_indices):
        if feature_names is not None and len(feature_names) > idx:
            name = feature_names[idx]
        else:
            name = f'Feature_{idx+1}'
        print(f"{i+1:2d}. {name} - 平均重要性: {avg_importance[idx]:.4f}")

    # 保存详细数据
    feature_data = []
    for i in range(50):
        if feature_names is not None and len(feature_names) > i:
            name = feature_names[i]
        else:
            name = f'Feature_{i+1}'
        row = {
            'Feature_Index': i,
            'Feature_Name': name,
            'Average_Importance': avg_importance[i],
            'Rank': np.argsort(avg_importance)[::-1].tolist().index(i) + 1
        }

        for method, df in methods_data.items():
            method_importance = df[df['feature_index'] == i]['importance'].values
            row[f'{method}_Importance'] = method_importance[0] if len(method_importance) > 0 else 0.0

        feature_data.append(row)

    df_all = pd.DataFrame(feature_data)
    df_all = df_all.sort_values('Average_Importance', ascending=False)
    df_all.to_csv('all_50_features_ranking.csv', index=False, encoding='utf-8-sig')

    print(f"\n详细排名已保存: all_50_features_ranking.csv")

def main():
    """主函数"""
    create_feature_importance_visualization()
    print("\n特征重要性可视化完成!")

if __name__ == "__main__":
    main()