"""
创建4分类数据集用于迁移学习测试
将21分类数据转换为4分类（OR/IR/B/N）
"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from my_general import load_train_err_data
import scipy.io as sio


def create_4class_dataset():
    """创建4分类数据集"""
    print("创建4分类数据集...")

    # 加载原始21分类数据
    X, y = load_train_err_data(return_X_y=True)
    print(f"原始数据: X shape={X.shape}, y unique={np.unique(y)}")

    # 创建标签映射
    state_mapping = {}
    for idx, label in enumerate(y):
        if 'OR' in str(label):
            state_mapping[idx] = 0  # 外圈故障
        elif 'IR' in str(label):
            state_mapping[idx] = 1  # 内圈故障
        elif 'B' in str(label) and 'N' not in str(label):
            state_mapping[idx] = 2  # 滚动体故障
        elif 'N' in str(label):
            state_mapping[idx] = 3  # 正常状态

    # 转换标签
    y_4class = np.array([state_mapping[i] for i in range(len(y))])

    # 统计各类别样本数量
    unique_classes, counts = np.unique(y_4class, return_counts=True)
    class_names = ['OR', 'IR', 'B', 'N']

    print("\n4分类数据统计:")
    for cls, count in zip(unique_classes, counts):
        print(f"  {class_names[cls]}: {count} 样本")

    # 创建新的数据集结构
    dataset_4class = {
        'X': X,
        'y': y_4class,
        'class_names': class_names,
        'original_labels': y
    }

    # 保存为.mat文件
    sio.savemat('task1_4class_py.mat', {
        'X': X,
        'y': y_4class,
        'class_names': class_names,
        'original_labels': y
    })

    print(f"\n4分类数据已保存到 task1_4class_py.mat")
    print(f"特征维度: {X.shape[1]}")
    print(f"样本总数: {X.shape[0]}")

    return X, y_4class, class_names


def simulate_target_domain_data(source_ratio=0.3, noise_level=0.1):
    """
    模拟目标域数据
    从源域数据中选择部分样本并添加噪声

    Args:
        source_ratio: 从源域中选择样本的比例
        noise_level: 噪声水平
    """
    print("\n模拟目标域数据...")

    # 加载4分类源域数据
    X, y_4class, class_names = create_4class_dataset()

    # 为每个类别选择样本
    np.random.seed(42)
    target_X = []
    target_y = []

    unique_classes = np.unique(y_4class)
    samples_per_class = int(len(X) * source_ratio / len(unique_classes))

    for cls in unique_classes:
        cls_indices = np.where(y_4class == cls)[0]

        # 随机选择样本
        selected_indices = np.random.choice(cls_indices,
                                          min(samples_per_class, len(cls_indices)),
                                          replace=False)

        # 添加噪声模拟域差异
        cls_X = X[selected_indices]
        noise = np.random.normal(0, noise_level, cls_X.shape)

        target_X.append(cls_X + noise)
        target_y.extend([cls] * len(selected_indices))

    target_X = np.vstack(target_X)
    target_y = np.array(target_y)

    # 统计目标域数据
    print("\n目标域数据统计:")
    for cls in unique_classes:
        count = np.sum(target_y == cls)
        print(f"  {class_names[cls]}: {count} 样本")

    # 保存目标域数据
    sio.savemat('target_domain_4class_py.mat', {
        'X': target_X,
        'y': target_y,
        'class_names': class_names
    })

    print(f"\n目标域数据已保存到 target_domain_4class_py.mat")
    print(f"目标域特征维度: {target_X.shape[1]}")
    print(f"目标域样本总数: {target_X.shape[0]}")

    return X, y_4class, target_X, target_y, class_names


def load_4class_data(return_X_y=True):
    """加载4分类数据"""
    try:
        mat_data = sio.loadmat("task1_4class_py.mat", squeeze_me=True, struct_as_record=False)
        dataset = mat_data

        X = np.real(np.array(dataset['X'])).astype(np.float32)
        y = dataset['y']
        class_names = list(dataset['class_names'])

        if return_X_y:
            return X, y
        else:
            return X, y, class_names
    except FileNotFoundError:
        print("4分类数据文件不存在，正在创建...")
        return create_4class_dataset()[:2]


def load_target_domain_data(return_X_y=True):
    """加载目标域数据"""
    try:
        mat_data = sio.loadmat("target_domain_4class_py.mat", squeeze_me=True, struct_as_record=False)
        dataset = mat_data

        X = np.real(np.array(dataset['X'])).astype(np.float32)
        y = dataset['y']
        class_names = list(dataset['class_names'])

        if return_X_y:
            return X, y
        else:
            return X, y, class_names
    except FileNotFoundError:
        print("目标域数据文件不存在，正在创建...")
        return simulate_target_domain_data()[2:4]


def test_data_loading():
    """测试数据加载"""
    print("测试4分类数据加载...")

    # 测试源域数据
    X_source, y_source = load_4class_data()
    print(f"源域: X shape={X_source.shape}, y unique={np.unique(y_source)}")

    # 测试目标域数据
    X_target, y_target = load_target_domain_data()
    print(f"目标域: X shape={X_target.shape}, y unique={np.unique(y_target)}")

    return X_source, y_source, X_target, y_target


if __name__ == "__main__":
    # 创建4分类数据
    create_4class_dataset()

    # 模拟目标域数据
    simulate_target_domain_data()

    # 测试数据加载
    test_data_loading()