#day09 Swin Transformer

今天读Swin Transformer《Swin Transformer: Hierarchical Vision Transformer using Shifted Windows》（ICCV 2021，微软亚研，Ze Liu等）。

Day06 ViT把Transformer带进CV，但有个致命伤：全局self-attention复杂度是O(n²)，分辨率一高就爆炸。所以ViT只能做分类，做检测/分割太吃力。今天Swin Transformer说：把局部性找回来。

核心痛点：ViT的O(n²)复杂度限制了它处理高分辨率图像的能力。

图像分类用224×224还行，但目标检测和语义分割需要高分辨率特征图。ViT非分层结构也难以像FPN那样构建多尺度特征。

作者的解法：Shifted Window Attention。

Swin的核心思想很巧妙：
把图像切分成不重叠的window（如7×7），每个window内做self-attention，复杂度从O(n²)降到O(n)
下一层shift window（移动半个window），让跨window信息能流动
用masked attention处理边界问题

再加上层级下采样（像CNN一样），Swin Transformer产生了类似ResNet的特征金字塔：4个stage，分辨率逐层减半，通道数逐层翻倍。

关键发现：Transformer的"CNN化"大获成功。

ImageNet-1K：Swin-L达到87.3% top-1，超越ViT和ResNeSt。
COCO检测（Mask R-CNN）：Swin-L达到58.7 box AP，51.1 mask AP，干翻之前所有backbone。
ADE20K分割：Swin-L达到53.5 mIoU，SOTA。

默认window size为7×7，在效率和性能间取得平衡。

读后感：
Day06 ViT说"CNN的归纳偏置是枷锁"，今天Swin Transformer说"局部性其实是个好东西"。Swin把Transformer的attention限制在window内，再通过shift实现全局连接——这本质上是把CNN的局部性和Transformer的全局建模能力融合在一起。后来Swin成了CV backbone的新标准，连分割和检测都在用。Transformer不是要完全取代CNN，而是要学习CNN的优点。
