"""
加载真实的目标域数据
"""
import scipy.io as sio
import numpy as np
import pandas as pd
from collections import Counter
import matplotlib.pyplot as plt


def load_real_target_domain_data(mat_file='task1_target_domain_task1features_py.mat'):
    """
    加载真实的目标域数据

    Args:
        mat_file: 目标域数据文件路径

    Returns:
        X_target: 目标域特征矩阵
        file_indices: 文件索引
        info: 数据信息字典
    """
    print(f"加载目标域数据: {mat_file}")

    try:
        # 读取.mat文件
        mat_data = sio.loadmat(mat_file, squeeze_me=True, struct_as_record=False)

        # 提取数据
        target_data = mat_data['target_data']
        features = target_data.features
        file_indices = target_data.file_indices
        feature_names = target_data.feature_names

        print(f"特征矩阵形状: {features.shape}")
        print(f"文件索引形状: {file_indices.shape}")
        print(f"文件索引范围: {file_indices.min()} - {file_indices.max()}")

        # 分析数据
        unique_files = np.unique(file_indices)
        print(f"文件数量: {len(unique_files)}")
        print(f"文件索引: {sorted(unique_files)}")

        # 统计每个文件的样本数量
        file_counts = Counter(file_indices)
        print(f"\n每个文件的样本数量:")
        for file_idx in sorted(file_counts.keys()):
            print(f"  文件 {file_idx}: {file_counts[file_idx]} 个样本")

        # 数据统计
        print(f"\n特征统计:")
        print(f"  特征维度: {features.shape[1]}")
        print(f"  总样本数: {features.shape[0]}")
        print(f"  特征均值: {features.mean():.6f}")
        print(f"  特征标准差: {features.std():.6f}")
        print(f"  特征最小值: {features.min():.6f}")
        print(f"  特征最大值: {features.max():.6f}")

        # 创建数据信息字典
        info = {
            'n_samples': features.shape[0],
            'n_features': features.shape[1],
            'n_files': len(unique_files),
            'file_indices': sorted(unique_files),
            'file_counts': file_counts,
            'feature_names': feature_names,
            'feature_stats': {
                'mean': features.mean(),
                'std': features.std(),
                'min': features.min(),
                'max': features.max()
            }
        }

        return features, file_indices, info

    except Exception as e:
        print(f"加载数据失败: {e}")
        return None, None, None


def compare_source_target_features():
    """比较源域和目标域的特征"""
    print("\n=== 源域和目标域特征对比 ===")

    # 加载源域数据
    from create_4class_data import load_4class_data
    X_source, y_source = load_4class_data()

    # 加载目标域数据
    X_target, file_indices, target_info = load_real_target_domain_data()

    if X_target is None:
        return

    print(f"\n源域特征: {X_source.shape}")
    print(f"目标域特征: {X_target.shape}")

    # 检查特征维度是否匹配
    if X_source.shape[1] != X_target.shape[1]:
        print(f"警告: 特征维度不匹配!")
        print(f"  源域: {X_source.shape[1]}, 目标域: {X_target.shape[1]}")
        return

    print(f"特征维度匹配: {X_source.shape[1]}")

    # 比较特征分布
    print(f"\n特征分布对比:")
    print(f"源域 - 均值: {X_source.mean():.6f}, 标准差: {X_source.std():.6f}")
    print(f"目标域 - 均值: {X_target.mean():.6f}, 标准差: {X_target.std():.6f}")

    # 计算特征间的差异
    mean_diff = np.abs(X_source.mean(axis=0) - X_target.mean(axis=0))
    std_diff = np.abs(X_source.std(axis=0) - X_target.std(axis=0))

    print(f"\n特征差异:")
    print(f"平均均值差异: {mean_diff.mean():.6f}")
    print(f"平均标准差差异: {std_diff.mean():.6f}")

    # 可视化前几个特征的分布
    plt.figure(figsize=(15, 10))
    n_features_to_plot = min(6, X_source.shape[1])

    for i in range(n_features_to_plot):
        plt.subplot(2, 3, i+1)

        # 绘制源域特征分布
        plt.hist(X_source[:, i], bins=30, alpha=0.7, label='Source', density=True)

        # 绘制目标域特征分布
        plt.hist(X_target[:, i], bins=30, alpha=0.7, label='Target', density=True)

        plt.title(f'Feature {i+1} Distribution')
        plt.xlabel('Feature Value')
        plt.ylabel('Density')
        plt.legend()

    plt.tight_layout()
    plt.savefig('source_target_feature_comparison.png', dpi=300, bbox_inches='tight')
    plt.show()

    return X_source, y_source, X_target, file_indices, target_info


def analyze_file_level_predictions(file_indices, predictions):
    """
    分析文件级别的预测结果

    Args:
        file_indices: 文件索引
        predictions: 预测结果
    """
    print("\n=== 文件级别预测分析 ===")

    unique_files = np.unique(file_indices)

    print("每个文件的预测分布:")
    for file_idx in sorted(unique_files):
        file_mask = file_indices == file_idx
        file_predictions = predictions[file_mask]

        # 统计预测结果
        pred_counts = np.bincount(file_predictions, minlength=4)
        total = len(file_predictions)

        print(f"\n文件 {file_idx} (共 {total} 个样本):")
        for i, count in enumerate(pred_counts):
            percentage = count / total * 100
            print(f"  类别 {i} ({['OR', 'IR', 'B', 'N'][i]}): {count} ({percentage:.1f}%)")

        # 确定主要预测类别
        main_pred = np.argmax(pred_counts)
        confidence = pred_counts[main_pred] / total
        print(f"  主要预测: 类别 {main_pred} ({confidence*100:.1f}%)")


if __name__ == "__main__":
    # 测试加载目标域数据
    X_target, file_indices, target_info = load_real_target_domain_data()

    if X_target is not None:
        print("\n目标域数据加载成功!")

        # 比较源域和目标域特征
        X_source, y_source, X_target_loaded, file_indices_loaded, target_info_loaded = compare_source_target_features()

        if X_target_loaded is not None:
            print("\n特征对比完成!")
        else:
            print("\n特征对比失败!")
    else:
        print("\n目标域数据加载失败!")