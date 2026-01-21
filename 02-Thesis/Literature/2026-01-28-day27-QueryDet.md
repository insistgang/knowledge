#day27 QueryDet: Cascaded Sparse Query for Accelerating Small Object Detection

今天读QueryDet《QUERYDET: CASCADED SPARSE QUERY FOR ACCELERATING SMALL OBJECT DETECTION》（CVPR 2022，南京大学&商汤，Yiqi Zhong等）。

Day26 TPH-YOLOv5用Transformer head解决小目标问题，今天QueryDet说：换个思路——用"稀疏查询"来加速小目标检测。

核心痛点：小目标检测的"分辨率悖论"。

小目标检测需要高分辨率特征图，但高分辨率意味着计算量爆炸。传统检测器在所有位置都做预测，但大部分位置没有目标——这是在浪费计算。

作者的解法：QueryDet = Coarse-to-Fine的稀疏查询机制。

核心思想：不用在全图高分辨率上检测，而是先用低分辨率粗略定位，再在高分辨率上"精确打击"。

两阶段流程：
1. Coarse stage：在低分辨率特征图上预测"可能有目标"的区域
2. Fine stage：只在这些候选区域的高分辨率特征上做精细预测

还有级联设计：多次迭代coarse-fine，逐步提高定位精度。

关键发现：稀疏查询加速2倍，精度还提升了。

COCO test-dev 2017（Table 1）：
QueryDet（ResNet-50）：38.3% AP
Baseline（RetinaNet R-50）：36.3% AP（+2.0%）

小目标APs：
QueryDet：22.6%
Baseline：20.4%（+2.2%）

Table 1显示：计算量减少50%的同时，AP提升了2.0%。小目标提升尤其明显，说明coarse-to-fine策略对小目标特别有效。

Table 2的消融实验显示：级联3次coarse-fine比1次提升+1.8 AP，说明迭代式精修很关键。

读后感：
Day26 TPH-YOLOv5用Transformer扩大感受野来"看见"小目标，今天QueryDet用coarse-to-fine策略来"聚焦"小目标。两者思路不同但殊途同归：TPH-YOLOv5说"需要全局上下文"，QueryDet说"不需要到处看，先粗定位再细看"。QueryDet的稀疏查询思想后来被广泛应用于高分辨率图像检测——既然大部分区域是空的，何必浪费计算？这种"稀疏采样"的思路是检测算法加速的重要方向。
