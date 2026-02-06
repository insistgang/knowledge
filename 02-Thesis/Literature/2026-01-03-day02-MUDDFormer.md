#day02 MUDDFormer: Breaking Residual Bottlenecks in Transformers

今天阅读的是《MUDDFormer: Breaking Residual Bottlenecks in Transformers via Multiway Dynamic Dense Connections》

紧接着昨天的 DeepSeek mHC，今天读的是它强有力的"竞争对手"——MUDDFormer（来自彩云科技 & 北邮）。

如果说昨天的 mHC 是担心"路太宽会翻车"（为了稳定性约束残差流），今天的 MUDDFormer 则是在抱怨"路太堵了，得修立交桥"（为了解决残差瓶颈）。

核心痛点： 随着 Transformer 变深，残差流（Residual Stream）作为唯一的通信通道被"过载"了，限制了跨层信息的流动 。

作者的解法（MUDD）： 既然单车道不够用，那就搞多路动态密集连接（Multiway Dynamic Dense Connections）：

Dense（密集）： 每一层不仅看上一层，而是直接"看到"之前所有层的输出 。

Dynamic（动态）： 连接的权重不是死的（Static），而是根据当前 hidden state 动态生成的。这本质上就像是在深度方向上做了一次 Attention 。

Multiway（多路·核心大招）： 把输入解耦成 Query、Key、Value 和 Residual 四条流，每条流单独修一条"密集连接"的路 。

以小博大： MUDDPythia-2.8B 的效果匹配了 Pythia-6.9B（2.4倍算力），在 5-shot 任务上甚至匹敌 12B 模型 。

极低代价： 仅增加了 0.23% 的参数量和 0.4% 的计算量 。

吊打同行： 在 Scaling curve 上明显优于昨天的"前身" Hyper-Connections (HC) 和 DenseFormer 。

洞察： 论文分析发现，Value (V) 流从这种密集连接中获益最大 。这意味着，让每一层直接获取到底层原始的 Value 信息，能极大缓解"表征坍塌"问题。

读后感：  昨天的 mHC 说："你们这些乱改残差连接的（HC/MUDD 类），破坏了恒等映射，训练不稳定！" 今天的 MUDD 说："即使破坏一点恒等映射，但我把瓶颈打通了，效果提升了2倍算力当量！"
