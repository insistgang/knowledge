#day11 Focal Loss for Dense Object Detection

今天读Focal Loss《Focal Loss for Dense Object Detection》（ICCV 2017，FAIR，Tsung-Yi Lin等）。

Day07 FPN的作者们回来了。FPN解决了多尺度问题，今天Focal Loss解决单阶段检测器的核心痛点：class imbalance。

核心痛点：单阶段检测器为何总是输给两阶段检测器？

2017年之前，RetinaNet、SSD、YOLO等单阶段检测器精度一直落后于Faster R-CNN等两阶段检测器。作者发现根本原因是class imbalance：一张图像有约10万个候选框，但只有几个是真实目标（正负比1:10000）。大量easy negatives主导了梯度，让模型学不到东西。

两阶段检测器有RPN来过滤负样本，单阶段没有这个"筛选器"。

作者的解法：Focal Loss —— 让模型忽略easy examples，聚焦hard examples。

标准交叉熵CE = -log(p_t)，Focal Loss在它前面乘以(1-p_t)^gamma：

FL(p_t) = -(1-p_t)^gamma * log(p_t)

当样本分类正确（p_t趋近1）时，(1-p_t)^gamma趋近0，loss权重趋近0；当样本分类困难（p_t趋近0）时，(1-p_t)^gamma趋近1，loss权重保持。

核心思想：easy examples即使数量再多，loss也接近0；hard examples无论多寡，都保持高权重。模型被迫"盯着难学的样本看"。

关键发现：改一个loss函数，单阶段干翻两阶段。

Table 1显示，gamma=2时效果最好：
RetinaNet-101（gamma=2）：39.1 AP，超过同期所有两阶段检测器
训练速度：单阶段比两阶段快2-4倍（不需要RPN）

Table 3的ablation study证明：仅仅把CE换成Focal Loss，AP就从31.1提升到35.6（+4.5）——这是论文的核心贡献。

小目标APs从21.0提升到22.1，提升虽不如整体明显，但说明Focal Loss对多尺度都有帮助。

读后感：
Day07 FPN的作者们解决了"特征金字塔"，今天又解决了"正负样本不平衡"。两篇论文都是FAIR同期工作，后来被合并到Mask R-CNN架构里。Focal Loss的思想影响深远：它证明了有时候不需要改架构，只需要改loss function就能突破瓶颈。后来class-balanced loss、GHM loss等工作都是它的延伸。
