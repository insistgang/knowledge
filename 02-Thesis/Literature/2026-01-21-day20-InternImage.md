#day20 InternImage: Exploring Large-Scale Vision Foundation Models

今天读InternImage《INTERNIMAGE: EXPLORING LARGE-SCALE VISION FOUNDATION MODELS FOR RECOGNITION AND LOCALIZATION》（CVPR 2023，上海AI Lab&华中科大&商汤，Chenhan Wu等）。

Day09 Swin用windowed attention让Transformer更高效，Day10 PVT用SRA降低复杂度。今天InternImage说：用动态卷积，CNN也能像Transformer一样自适应。

核心痛点：CNN和Transformer的"鱼与熊掌"。

CNN有归纳偏隘（局部性、平移等变性）但全局建模弱；Transformer全局建模强但计算复杂度高（O(n²)）。有没有办法让两者合二为一？

作者的解法：Dynamic Convolution = 动态卷积。

核心机制：卷积核权重根据输入动态生成。

传统CNN的卷积核是固定的（学完就不再变），InternImage的动态卷积核根据输入特征实时生成——这让它有了Transformer的"自适应性"。同时保持CNN的O(n)复杂度。

InternImage还受LLM启发做了架构优化：
深层窄宽度的结构
类Transformer的残差连接
更大depth-to-width ratio

关键发现：动态卷积CNN超越Swin Transformer。

ImageNet-1K top-1（Table 1）：
InternImage-B：85.3%
InternImage-L：87.1%
InternImage-H：87.9%
InternImage-XL：88.4%

对比Swin Transformer（Table 1）：
Swin-B：83.5%，InternImage-B：85.3%（+1.8）
Swin-L：86.4%，InternImage-L：87.1%（+0.7）

COCO检测（Mask R-CNN，Table 3）：
InternImage-L：56.2 box AP，48.7 mask AP
超越Swin-L的55.3 box AP

ADE20K分割（Table 4）：
InternImage-L：53.6 mIoU
超越Swin-L的51.9

Table 5显示：动态卷积是核心，相比标准卷积带来+2.1 AP提升；LLM激励的设计（depth-wise）带来+0.5 AP。

读后感：
Day09 Swin让Transformer学CNN的局部性，今天InternImage让CNN学Transformer的自适应性。两条路线最终殊途同归：都在寻找"全局建模 + 高效计算"的最优解。动态卷积后来被ConvNeXt v2、DINOV2等工作继承。CV架构的演进不是"谁取代谁"，而是"互相学习、取长补短"。
