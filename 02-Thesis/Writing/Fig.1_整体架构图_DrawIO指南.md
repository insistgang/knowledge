# Fig.1 整体架构图 - DrawIO绘制指南

> **图名**: 整体系统框架图
> **文件名**: Fig.1_overall_architecture
> **格式**: PNG + PDF
> **日期**: 2026-02-07

---

## 一、DrawIO在线绘制步骤

### 1.1 访问DrawIO

1. 打开浏览器访问：https://app.diagrams.net/
2. 选择 "Create New Diagram"
3. 选择空白模板 "Blank Diagram"

### 1.2 页面设置

1. 菜单栏：Arrange → Page Setup
2. 设置：
   - 单位：pixels (px)
   - 宽度：1800
   - 高度：1200
   - 背景色：#FFFFFF

---

## 二、图层结构（从上到下）

### 2.1 输入层

```
位置：x=600, y=50
尺寸：600×60
样式：
  - 填充：#E5E7EB
  - 边框：#374151, 2px
  - 圆角：10
文字：
  - 中文：输入图像 Input Image
  - 英文：I ∈ ℝ^(H×W×3)
  - 字体：Arial, 14pt
  - 颜色：#1F2937
```

### 2.2 Backbone层

```
位置：x=400, y=150
尺寸：1000×200
样式：
  - 填充：#DBEAFE (浅蓝)
  - 边框：#2563EB, 3px
  - 圆角：8

内部模块（从左到右）：
  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
  │  Stem   │→ │ C2f ×N  │→ │ C2f ×N  │→ │ C2f ×N  │
  └─────────┘  └─────────┘  └─────────┘  └─────────┘
     100×80      120×80      120×80      120×80

下方输出标签：
  F2(1/4)   F3(1/8)   F4(1/16)  F5(1/32)
```

### 2.3 Neck层（AMSFF）

```
位置：x=400, y=400
尺寸：1000×250
样式：
  - 填充：#D1FAE5 (浅绿)
  - 边框：#10B981, 3px
  - 圆角：8

标题：
  - 中文：Neck: 自适应多尺度特征融合 (AMSFF)
  - 英文：Adaptive Multi-Scale Feature Fusion

内部结构：
  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
  │   P2    │◄─►│   P3    │◄─►│   P4    │◄─►│   P5    │
  │  (1/4)  │    │  (1/8)  │    │ (1/16)  │    │ (1/32)  │
  └─────────┘    └─────────┘    └─────────┘    └─────────┘
     150×100       150×100       150×100       150×100

双向连接箭头：◄─► 表示特征融合

底部模块：
  ┌─────────────────────────────────┐
  │  Gate Weights                   │
  │  w_ij = σ(g_ij)                 │
  └─────────────────────────────────┘
  400×60, 填充：#FEF3C7 (浅黄)
```

### 2.4 Attention层（STAA）

```
位置：x=400, y=700
尺寸：1000×120
样式：
  - 填充：#FEF3C7 (浅黄)
  - 边框：#F59E0B, 3px
  - 圆角：8

标题：
  - 中文：时空感知注意力 (STAA)
  - 英文：Spatio-Temporal Aware Attention

内部结构（左右并列）：
  ┌──────────────────┐    ×    ┌──────────────────┐
  │  Spatial Attention│         │ Channel Attention │
  │  SA(F_i)          │         │  TA(F_i)          │
  └──────────────────┘         └──────────────────┘
       400×80                            400×80

中间符号：× (乘法符号), 48pt字体

公式：
  F_i^(att) = SA(F_i) ⊙ TA(F_i)
```

### 2.5 Head层（DCH）

```
位置：x=300, y=850
尺寸：1200×200
样式：
  - 填充：#FCE7F3 (浅粉)
  - 边框：#EC4899, 3px
  - 圆角：8

标题：
  - 中文：Head: 解耦检测头 (DCH)
  - 英文：Decoupled Detection Head

内部结构（左右分支）：

左分支（分类）：
  ┌─────────────────────────┐
  │  Classification Branch   │
  │  (分类分支)               │
  │                          │
  │  ┌───────────────────┐  │
  │  │  3×3 Conv × 2     │  │
  │  └───────────────────┘  │
  │         ↓               │
  │  ┌───────────────────┐  │
  │  │  1×1 Conv → 7 ch  │  │
  │  └───────────────────┘  │
  │         ↓               │
  │  ┌───────────────────┐  │
  │  │  Softmax          │  │
  │  └───────────────────┘  │
  └─────────────────────────┘

右分支（回归）：
  ┌─────────────────────────┐
  │  Regression Branch      │
  │  (回归分支)              │
  │                          │
  │  ┌───────────────────┐  │
  │  │  3×3 Conv × 2     │  │
  │  └───────────────────┘  │
  │         ↓               │
  │  ┌───────────────────┐  │
  │  │  1×1 Conv → 4 ch  │  │
  │  └───────────────────┘  │
  │         ↓               │
  │  ┌───────────────────┐  │
  │  │  Sigmoid          │  │
  │  └───────────────────┘  │
  └─────────────────────────┘
```

### 2.6 输出层

```
位置：x=600, y=1100
尺寸：600×60
样式：
  - 填充：#E5E7EB
  - 边框：#374151, 2px
  - 圆角：10
文字：
  - 中文：检测结果 (Class, Conf, Box)
  - 英文：Detection Results
```

---

## 三、连接箭头

### 3.1 主数据流

```
从上到下的垂直箭头：
- 输入 → Backbone
- Backbone → Neck
- Neck → Attention
- Attention → Head
- Head → 输出

箭头样式：
  - 颜色：#6B7280
  - 粗细：3px
  - 样式：实线，带箭头
```

### 3.2 模块间连接

```
Backbone → Neck:
  从F2,F3,F4,F5各引一条箭头到P2,P3,P4,P5

Neck内部:
  P2◄─►P3◄─►P4◄─►P5 (双向箭头)

Attention → Head:
  一条箭头分叉为两条（分类/回归分支）
```

---

## 四、配色方案

### 4.1 主色调

| 组件 | 颜色 | RGB | Hex |
|------|------|-----|-----|
| 输入/输出 | 浅灰 | (229, 231, 235) | #E5E7EB |
| Backbone | 蓝色 | (219, 234, 254) | #DBEAFE |
| Neck | 绿色 | (209, 250, 229) | #D1FAE5 |
| Attention | 黄色 | (254, 243, 199) | #FEF3C7 |
| Head (分类) | 粉紫 | (252, 231, 243) | #FCE7F3 |
| Head (回归) | 粉紫 | (252, 231, 243) | #FCE7F3 |

### 4.2 边框色

| 组件 | 颜色 | RGB | Hex |
|------|------|-----|-----|
| 主边框 | 深蓝 | (37, 99, 235) | #2563EB |
| 强调边框 | 绿色 | (16, 185, 129) | #10B981 |
| 警告边框 | 橙色 | (245, 158, 11) | #F59E0B |
| 次要边框 | 粉红 | (236, 72, 153) | #EC4899 |

---

## 五、文字规范

### 5.1 字体设置

```
中文字体：Microsoft YaHei (微软雅黑)
英文字体：Arial
数字字体：Arial
公式字体：Times New Roman
```

### 5.2 字号设置

```
模块标题：16pt (Bold)
模块内文：12pt (Regular)
标注文字：10pt (Regular)
公式文字：11pt (Italic)
```

### 5.3 文字颜色

```
主要文字：#1F2937 (深灰)
次要文字：#6B7280 (中灰)
强调文字：#DC2626 (红色)
公式文字：#374151 (深灰)
```

---

## 六、导出设置

### 6.1 PNG导出

1. File → Export as → PNG
2. 设置：
   - 分辨率：300 dpi
   - 透明背景：否
   - 边距：10px
3. 文件名：Fig.1_overall_architecture.png

### 6.2 PDF导出

1. File → Export as → PDF
2. 设置：
   - 页面大小：自动
   - 边距：10px
3. 文件名：Fig.1_overall_architecture.pdf

---

## 七、图注（中英双语）

### 7.1 中文图注

```
图1 本文提出的井盖状态检测系统整体框架。该系统包含四个主要组件：
(a) CSPDarknet主干网络，提取多尺度特征{F2, F3, F4, F5}；
(b) 自适应多尺度特征融合模块(AMSFF)，通过门控权重实现跨层级信息聚合；
(c) 时空感知注意力机制(STAA)，结合空间注意力和通道注意力增强特征表达；
(d) 解耦检测头(DCH)，分类分支预测7类状态，回归分支预测边界框坐标。
```

### 7.2 英文图注

```
Fig. 1 Overall architecture of the proposed manhole cover status detection system.
The system consists of four main components: (a) CSPDarknet backbone for multi-scale
feature extraction; (b) Adaptive Multi-Scale Feature Fusion (AMSFF) module for
cross-level information aggregation via gate weights; (c) Spatio-Temporal Aware
Attention (STAA) combining spatial and channel attention; (d) Decoupled Detection
Head (DCH) with classification branch for 7-class status and regression branch
for bounding box prediction.
```

---

## 八、检查清单

绘制完成后检查：

- [ ] 所有模块都有中英文标注
- [ ] 数据流向箭头清晰、方向正确
- [ ] 颜色符合配色方案
- [ ] 字体大小适中、统一
- [ ] 公式格式正确
- [ ] PNG和PDF都已导出
- [ ] 文件命名正确
- [ ] 图注文档已准备

---

**绘制人**: Academic Writer
**预计完成时间**: 30分钟
**最后更新**: 2026-02-07
