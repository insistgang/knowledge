"""
ABMSF模块使用训练指南

基于YOLOv11的井盖状态检测系统 - 自适应双分支多尺度特征融合模块
"""

import torch
import torch.nn as nn
from ultralytics import YOLO
from ABMSF_module import ABMSF, ABMSF_FPN

# ============================================================
# 第一部分：环境搭建
# ============================================================

"""
# 1. 创建conda环境
conda create -n manhole python=3.10 -y
conda activate manhole

# 2. 安装PyTorch (根据你的CUDA版本选择)
# CUDA 11.8
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# CUDA 12.1
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121

# 3. 安装YOLOv11
pip install ultralytics

# 4. 安装其他依赖
pip install opencv-python numpy Pillow matplotlib thop
"""

# ============================================================
# 第二部分：将ABMSF集成到YOLOv11
# ============================================================

class YOLOv11_ABMSF(nn.Module):
    """
    集成ABMSF的YOLOv11模型
    针对井盖小目标检测优化
    """

    def __init__(self, model_path='yolo11n.pt', num_classes=3):
        super().__init__()
        # 加载预训练的YOLOv11
        self.base = YOLO(model_path)
        self.model = self.base.model

        # 获取颈部网络参数
        neck_channels = self._get_neck_channels()

        # 替换颈部为ABMSF-FPN
        self.abmsf_fpn = ABMSF_FPN(
            channels_list=neck_channels,
            num_heads=4
        )

    def _get_neck_channels(self):
        """获取颈部各层通道数"""
        # YOLOv11默认通道配置
        return [64, 128, 256, 512]  # 根据实际模型调整

    def forward(self, x):
        # 主干网络
        backbone_features = self.model.model[:10](x)  # 根据实际结构调整

        # ABMSF颈部
        neck_features = self.abmsf_fpn(backbone_features)

        # 检测头
        detections = self.model.model[10:](neck_features)

        return detections


# ============================================================
# 第三部分：数据集准备
# ============================================================

def prepare_dataset_config():
    """
    井盖数据集配置

    数据集结构：
    dataset/
    ├── images/
    │   ├── train/
    │   └── val/
    ├── labels/
    │   ├── train/
    │   └── val/
    └── data.yaml

    类别：
    0: 完好 (intact)
    1: 破损 (damaged)
    2: 缺失 (missing)
    """

    data_yaml = """
    # 井盖检测数据集配置
    path: ../dataset  # 数据集根目录
    train: images/train  # 训练集图片
    val: images/val      # 验证集图片

    # 类别
    names:
      0: intact     # 完好
      1: damaged    # 破损
      2: missing    # 缺失

    # 类别数量
    nc: 3
    """

    print(data_yaml)
    return data_yaml


# ============================================================
# 第四部分：训练配置
# ============================================================

def train_abmsf_model():
    """
    训练集成ABMSF的YOLOv11模型
    """

    # 加载基础模型
    model = YOLO('yolo11n.pt')  # 使用nano版本，适合小目标检测

    # 训练参数配置
    training_config = {
        'data': 'dataset/data.yaml',
        'epochs': 100,
        'batch': 16,
        'imgsz': 640,
        'device': 0,  # GPU ID
        'workers': 8,
        'name': 'yolo11n-abmsf-manhole',
        'project': 'runs/detect',
        'exist_ok': True,
        'pretrained': True,
        'optimizer': 'AdamW',
        'lr0': 0.001,
        'lrf': 0.01,
        'momentum': 0.937,
        'weight_decay': 0.0005,
        'warmup_epochs': 3,
        'warmup_momentum': 0.8,
        'warmup_bias_lr': 0.1,
        'box': 7.5,      # box loss gain
        'cls': 0.5,      # cls loss gain
        'dfl': 1.5,      # dfl loss gain
        'pose': 12.0,    # pose loss gain
        'kobj': 1.0,     # keypoint obj loss gain
        'label_smoothing': 0.0,
        'nbs': 64,
        'hsv_h': 0.015,
        'hsv_s': 0.7,
        'hsv_v': 0.4,
        'degrees': 0.0,
        'translate': 0.1,
        'scale': 0.5,
        'shear': 0.0,
        'perspective': 0.0,
        'flipud': 0.0,
        'fliplr': 0.5,
        'mosaic': 1.0,
        'mixup': 0.0,
        'copy_paste': 0.0,
    }

    # 开始训练
    results = model.train(**training_config)

    return results


# ============================================================
# 第五部分：评估与可视化
# ============================================================

def evaluate_model(model_path='runs/detect/yolo11n-abmsf-manhole/weights/best.pt'):
    """
    评估训练好的模型
    """
    model = YOLO(model_path)

    # 验证集评估
    metrics = model.val(
        data='dataset/data.yaml',
        batch=16,
        imgsz=640,
        device=0,
        plots=True,
        save_json=True,
    )

    print("\n===== 评估结果 =====")
    print(f"mAP50: {metrics.box.map50:.4f}")
    print(f"mAP50-95: {metrics.box.map:.4f}")
    print(f"Precision: {metrics.box.mp:.4f}")
    print(f"Recall: {metrics.box.mr:.4f}")

    return metrics


def visualize_predictions(model_path, image_dir, conf_threshold=0.5):
    """
    可视化预测结果
    """
    model = YOLO(model_path)

    results = model.predict(
        source=image_dir,
        conf=conf_threshold,
        save=True,
        save_txt=True,
        save_conf=True,
        show=True,
    )

    return results


# ============================================================
# 第六部分：消融实验
# ============================================================

def ablation_study():
    """
    消融实验设计

    G1: YOLOv11 baseline
    G2: YOLOv11 + ABMSF
    G3: YOLOv11 + ABMSF + STAA (时空注意力)
    G4: YOLOv11 + ABMSF + DCH (解耦头)
    G5: YOLOv11 + ABMSF + STAA + DCH
    G6: YOLOv11 + 完整方法
    """

    configs = {
        'G1_baseline': {
            'model': 'yolo11n.pt',
            'description': 'YOLOv11 baseline'
        },
        'G2_abmsf': {
            'model': 'yolo11n.pt',
            'abmsf': True,
            'description': '+ ABMSF模块'
        },
        'G3_abmsf_staa': {
            'model': 'yolo11n.pt',
            'abmsf': True,
            'staa': True,
            'description': '+ ABMSF + STAA'
        },
        'G4_abmsf_dch': {
            'model': 'yolo11n.pt',
            'abmsf': True,
            'dch': True,
            'description': '+ ABMSF + DCH'
        },
        'G5_abmsf_staa_dch': {
            'model': 'yolo11n.pt',
            'abmsf': True,
            'staa': True,
            'dch': True,
            'description': '+ ABMSF + STAA + DCH'
        },
    }

    print("===== 消融实验配置 =====")
    for name, config in configs.items():
        print(f"{name}: {config['description']}")

    return configs


# ============================================================
# 主函数
# ============================================================

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "train":
            print("开始训练...")
            train_abmsf_model()

        elif command == "eval":
            print("开始评估...")
            evaluate_model()

        elif command == "predict":
            print("开始预测...")
            visualize_predictions(
                model_path="runs/detect/yolo11n-abmsf-manhole/weights/best.pt",
                image_dir="dataset/images/val"
            )

        elif command == "ablation":
            print("消融实验配置...")
            ablation_study()

        else:
            print(f"未知命令: {command}")
            print("可用命令: train, eval, predict, ablation")
    else:
        print("===== ABMSF模块训练指南 =====")
        print("\n使用方法:")
        print("  python train.py train    - 训练模型")
        print("  python train.py eval     - 评估模型")
        print("  python train.py predict  - 预测可视化")
        print("  python train.py ablation - 消融实验配置")
        print("\n示例:")
        print("  python train.py train")
