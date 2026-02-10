"""
ABMSF模块：自适应双分支多尺度特征融合模块
Adaptive Dual-Branch Multi-Scale Feature Fusion Module

针对井盖小目标检测难点设计，融合CNN局部特征与Transformer全局特征
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class SpatialAttention(nn.Module):
    """空间注意力模块 (CBAM-SA)"""

    def __init__(self, kernel_size=7):
        super().__init__()
        padding = (kernel_size - 1) // 2
        self.conv = nn.Conv2d(2, 1, kernel_size, padding=padding, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        # 通道维度上的max和avg
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        avg_out = torch.mean(x, dim=1, keepdim=True)
        cat = torch.cat([max_out, avg_out], dim=1)
        out = self.conv(cat)
        return x * self.sigmoid(out)


class CBAM(nn.Module):
    """CBAM注意力模块"""

    def __init__(self, channels, reduction=16):
        super().__init__()
        # 通道注意力
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        self.fc = nn.Sequential(
            nn.Conv2d(channels, channels // reduction, 1, bias=False),
            nn.ReLU(inplace=True),
            nn.Conv2d(channels // reduction, channels, 1, bias=False)
        )
        self.sigmoid = nn.Sigmoid()

        # 空间注意力
        self.spatial_attn = SpatialAttention()

    def forward(self, x):
        # 通道注意力
        avg_out = self.fc(self.avg_pool(x))
        max_out = self.fc(self.max_pool(x))
        sa = self.sigmoid(avg_out + max_out)
        x = x * sa

        # 空间注意力
        x = self.spatial_attn(x)
        return x


class DepthwiseSeparableConv(nn.Module):
    """深度可分离卷积"""

    def __init__(self, in_channels, out_channels, kernel_size=3):
        super().__init__()
        padding = (kernel_size - 1) // 2
        self.depthwise = nn.Conv2d(in_channels, in_channels, kernel_size,
                                    padding=padding, groups=in_channels, bias=False)
        self.pointwise = nn.Conv2d(in_channels, out_channels, 1, bias=False)
        self.bn = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        x = self.depthwise(x)
        x = self.pointwise(x)
        x = self.bn(x)
        return self.relu(x)


class BottleneckTransformer(nn.Module):
    """瓶颈Transformer模块 (用于全局上下文建模)"""

    def __init__(self, channels, num_heads=4, mlp_ratio=4):
        super().__init__()
        self.norm1 = nn.LayerNorm(channels)
        self.attn = nn.MultiheadAttention(channels, num_heads, batch_first=True)
        self.norm2 = nn.LayerNorm(channels)
        mlp_hidden = int(channels * mlp_ratio)
        self.mlp = nn.Sequential(
            nn.Linear(channels, mlp_hidden),
            nn.GELU(),
            nn.Linear(mlp_hidden, channels)
        )

    def forward(self, x):
        # x: (B, C, H, W) -> (B, H*W, C)
        B, C, H, W = x.shape
        x_flat = x.flatten(2).permute(0, 2, 1)

        # 自注意力
        x_norm = self.norm1(x_flat)
        attn_out, _ = self.attn(x_norm, x_norm, x_norm)
        x_flat = x_flat + attn_out

        # MLP
        x_norm = self.norm2(x_flat)
        x_flat = x_flat + self.mlp(x_norm)

        # 恢复形状
        return x_flat.permute(0, 2, 1).reshape(B, C, H, W)


class ABMSF(nn.Module):
    """
    自适应双分支多尺度特征融合模块
    Adaptive Dual-Branch Multi-Scale Feature Fusion Module

    结构：
    ├── 分支A: 局部特征提取 (深度可分离卷积 + 空间注意力)
    ├── 分支B: 全局上下文建模 (瓶颈Transformer)
    └── 自适应融合 (通道注意力加权 + 残差连接)
    """

    def __init__(self, channels, num_heads=4):
        super().__init__()

        # 分支A: 局部特征
        self.local_branch = nn.Sequential(
            DepthwiseSeparableConv(channels, channels, kernel_size=3),
            DepthwiseSeparableConv(channels, channels, kernel_size=5),
            SpatialAttention(kernel_size=7)
        )

        # 分支B: 全局上下文
        self.global_branch = BottleneckTransformer(channels, num_heads)

        # 自适应融合
        self.channel_attn = CBAM(channels, reduction=16)

        # 残差权重
        self.alpha = nn.Parameter(torch.ones(1))
        self.beta = nn.Parameter(torch.ones(1))
        self.gamma = nn.Parameter(torch.ones(1))

    def forward(self, x):
        """
        Args:
            x: 输入特征图 (B, C, H, W)
        Returns:
            融合后的特征图 (B, C, H, W)
        """
        identity = x

        # 分支A: 局部特征
        local_feat = self.local_branch(x)

        # 分支B: 全局特征
        global_feat = self.global_branch(x)

        # 自适应融合
        fused = self.alpha * local_feat + self.beta * global_feat

        # 通道注意力加权
        fused = self.channel_attn(fused)

        # 残差连接
        out = identity + self.gamma * fused

        return out


class UpsampleAdd(nn.Module):
    """上采样并相加 (用于多尺度融合)"""

    def __init__(self):
        super().__init__()

    def forward(self, x, skip):
        """
        Args:
            x: 低层特征 (B, C, H, W)
            skip: 高层特征 (B, C, 2H, 2W)
        Returns:
            融合特征 (B, C, 2H, 2W)
        """
        return F.interpolate(x, scale_factor=2, mode='nearest') + skip


class ABMSF_FPN(nn.Module):
    """
    基于ABMSF的多尺度特征金字塔
    针对井盖小目标检测，引入P2层增强小目标感知能力
    """

    def __init__(self, channels_list=[64, 128, 256, 512], num_heads=4):
        super().__init__()

        self.channels_list = channels_list
        self.num_levels = len(channels_list)

        # 每一层应用ABMSF
        self.abmsf_modules = nn.ModuleList([
            ABMSF(c, num_heads) for c in channels_list
        ])

        # 跨层融合 (自顶向下)
        self.upsample_adds = nn.ModuleList([
            UpsampleAdd() for _ in range(self.num_levels - 1)
        ])

        # 横向融合 (同层连接)
        self.lateral_convs = nn.ModuleList([
            nn.Conv2d(c, c, 1) for c in channels_list
        ])

        # 输出投影
        self.fpn_convs = nn.ModuleList([
            nn.Conv2d(c, c, 3, padding=1) for c in channels_list
        ])

    def forward(self, features):
        """
        Args:
            features: 多尺度特征列表 [(B, C1, H1, W1), (B, C2, H2, W2), ...]
                      从高分辨率到低分辨率
        Returns:
            fused_features: 融合后的多尺度特征
        """
        # 应用ABMSF增强每一层
        enhanced = []
        for i, feat in enumerate(features):
            enhanced.append(self.abmsf_modules[i](feat))

        # 自顶向下路径
        fpn_features = [enhanced[-1]]  # 从最顶层开始

        for i in range(self.num_levels - 2, -1, -1):
            # 上采样并相加
            upsampled = self.upsample_adds[i + 1](fpn_features[0], enhanced[i])
            # 横向连接
            lateral = self.lateral_convs[i](enhanced[i])
            # 融合
            fused = upsampled + lateral
            # 输出投影
            out = self.fpn_convs[i](fused)
            fpn_features.insert(0, out)

        return fpn_features


# 数学定义（用于论文）
"""
符号定义：
- 输入图像: $I \in \mathbb{R}^{H \times W \times 3}$
- 多尺度特征集合: $\mathcal{F} = \{F_2, F_3, F_4, F_5\}$
- 局部特征分支: $F_i^{local} = \text{DSConv}(SA(F_i))$
- 全局特征分支: $F_i^{global} = \text{Transformer}(F_i)$
- 融合公式: $\tilde{F}_i = \alpha F_i^{local} \oplus \beta F_i^{global} + \gamma F_i$
- 注意力加权: $\hat{F}_i = \text{CBAM}(\tilde{F}_i) \odot \tilde{F}_i$
"""


if __name__ == "__main__":
    # 测试代码
    batch_size = 2
    # 模拟YOLOv11的多尺度特征 (P3, P4, P5)
    features = [
        torch.randn(batch_size, 128, 80, 80),   # P3
        torch.randn(batch_size, 256, 40, 40),   # P4
        torch.randn(batch_size, 512, 20, 20),   # P5
    ]

    # 创建模型
    model = ABMSF_FPN(channels_list=[128, 256, 512])

    # 前向传播
    output = model(features)

    # 打印输出形状
    print("ABMSF-FPN输出形状:")
    for i, feat in enumerate(output):
        print(f"  Level P{i+3}: {feat.shape}")

    # 统计参数量
    total_params = sum(p.numel() for p in model.parameters())
    print(f"\n总参数量: {total_params:,}")

    # 计算FLOPs (近似)
    from thop import profile
    dummy_input = [torch.randn(1, c, 80//(2**i), 80//(2**i))
                   for i, c in enumerate([128, 256, 512])]
    flops, params = profile(model, dummy_input, verbose=False)
    print(f"FLOPs: {flops/1e9:.2f} G")
