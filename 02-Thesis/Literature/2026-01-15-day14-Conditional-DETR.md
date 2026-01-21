**#day14**

今天读 Conditional DETR《Conditional DETR for Fast Training Convergence》（**ICCV 2021**，中科大 & 北大 & MSRA，**Depu Meng** 等）。

Day08 DETR 用 learnable query 做检测，但收敛需要 500 epochs。今天 Conditional DETR 揭示了根本原因：**DETR 的 spatial query 是 image-agnostic 的**，没有利用当前 decoder embedding 包含的位置信息。

**核心痛点：DETR 的 spatial attention 无法精确定位 extremities**

Figure 1 显示，DETR 训练 50 epochs 时，spatial attention 无法准确高亮 box 的四个边界区域。

**作者的解法：Conditional Spatial Query**

核心公式：pq=λq⊙psp_q = \lambda_q \odot p_s pq​=λq​⊙ps​

- psp_s ps​：reference point 的 sinusoidal positional embedding
- λq=FFN(f)\lambda_q = \text{FFN}(f) λq​=FFN(f)：从 decoder embedding ff f 学习的 transformation
- 通过 element-wise 乘法，让 spatial query **同时编码位置和位移信息**

**关键洞察**（Figure 4）：每个 attention head 自然地学会关注不同区域——四个边界 + box 内部，无需人工设计 attention mask。

**关键结果**（Table 1）：

- Conditional DETR-R50（50 epochs）：40.9 AP
- DETR-R50（500 epochs）：42.0 AP
- 收敛加速：R50/R101 **6.7×**，DC5-R50/DC5-R101 **10×**

**读后感**：

Conditional DETR 的核心贡献是**把 decoder embedding 的信息注入到 spatial query 中**。原始 DETR 的 object query 是固定的，每层都一样；Conditional DETR 让每层的 spatial query 都携带当前层的位置估计信息。这个思想启发了后续的 DAB-DETR（用 4D anchor 作为 query）和 DN-DETR（用 denoising 加速训练）。