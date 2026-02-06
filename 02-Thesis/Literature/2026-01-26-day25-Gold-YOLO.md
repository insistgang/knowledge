#day25 Gold-YOLO: Efficient Object Detector via Gather-and-Distribute

今天读Gold-YOLO《GOLD-YOLO: EFFICIENT OBJECT DETECTOR VIA GATHER-AND-DISTRIBUTE MECHANISM》（NeurIPS 2023，华为诺亚方舟实验室，Chengcheng Wang等）。

Day17 YOLOv9用PGI解决梯度瓶颈，Day18 YOLOv10去掉NMS实现端到端。今天Gold-YOLO说：YOLO的neck有问题——FPN的跨层信息融合有损失，我来重新设计。

核心痛点：传统FPN的"信息递归损失"问题。

YOLO系列的neck通常用FPN或PANet做多尺度特征融合。但作者发现：当需要跨层融合时（比如level-1和level-3），传统FPN只能"递归"地间接获取信息——level-2和level-3先融合，然后level-1才能间接得到level-3的信息。这种传递方式导致信息在传输过程中损失，没被中间层选中的信息就被丢弃了。

作者的解法：GD机制 = Gather-and-Distribute。

核心思想：不用递归，直接用一个模块统一收集所有层信息，融合后再分发到各个层级。

GD包含两个分支：
1. Low-stage GD：用卷积处理低层特征，针对小目标
2. High-stage GD：用Transformer处理高层特征，针对大目标

三个核心模块：
FAM（Feature Alignment Module）：把不同尺度特征对齐到统一尺寸
IFM（Information Fusion Module）：融合对齐后的特征
Inject Module：将全局信息注入到各个层级

还有LAF（Lightweight Adjacent-layer Fusion）轻量级邻层融合模块。

关键发现：重新设计neck，Gold-YOLO全面超越YOLOv6/v8。

COCO val2017（Table 1）：
Gold-YOLO-N：39.9% AP，1030 FPS（T4 GPU）
对比YOLOv6-3.0-N：37.5% AP（+2.4%）

Gold-YOLO-S：46.1% AP
对比YOLOv6-3.0-S：45.0% AP（+1.1%）
对比YOLOX-S：40.5% AP（+5.6%）
对比PPYOLOE-S：43.1% AP（+3.0%）

Gold-YOLO-L：53.3% AP
对比YOLOv6-3.0-L：52.8% AP（+0.5%）
对比YOLOv8-L：52.9% AP（+0.4%）

Table 2的消融实验显示：Low-GD带来+1.0 AP，High-GD带来+0.5 AP，LAF带来+0.6 AP。

另一大创新：首次在YOLO系列中使用MAE-style预训练（MIM）。

Table 1显示Gold-YOLO-S用MIM预训练后达到46.4% AP，比无预训练的45.4%提升+1.0%。

读后感：
Day07 FPN开创了特征金字塔，今天Gold-YOLO说FPN的跨层信息传递有问题。Gold-YOLO的GD机制本质上是把"递归传递"改成了"全局广播"——所有层的信息先统一收集，再统一分发。这种思想类似Transformer的全局attention，但通过卷积和轻量级attention实现，保持了YOLO的速度优势。GD机制后来被推广到Mask R-CNN、PointRend等其他模型，说明这是一个通用的特征融合范式。
