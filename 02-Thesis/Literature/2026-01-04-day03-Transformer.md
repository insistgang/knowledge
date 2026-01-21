#day03 Attention Is All You Need (Transformer)

今天听罗胖讲：读书先要读开山之作。论文也是一样的。
前两天读的mHC和MUDDFormer都在"改残差连接"——要么约束防翻车，要么修立交桥破瓶颈。今天回到源头，读Transformer原论文《Attention Is All You Need》，看看这条路最初怎么修的。
核心创新：把RNN全扔了，只用Attention。
2017年之前，序列建模靠RNN/LSTM，但必须串行计算，t时刻等t-1算完，序列越长越慢。即翻译我爱中国，串行翻译 我 爱 中 国，一个个的排队，不能插队。
Transformer的解法：Self-Attention让序列中任意两个位置一步直达（路径长度O(1)），不用像RNN那样一步步传（O(n)）。这就是它能捕捉长程依赖的根本原因。
三个关键设计：

Scaled Dot-Product Attention：除以√d_k防止梯度消失
Multi-Head Attention：8个头并行，关注不同语义子空间
Positional Encoding：sin/cos编码位置信息

结果：8块P100训练3.5天，BLEU直接刷榜，干翻所有ensemble。
读后感：
一篇论文，革了RNN的命。8年后GPT、BERT、LLaMA全是它的后代。读开山之作，才知道后来者在改什么、为什么改。
