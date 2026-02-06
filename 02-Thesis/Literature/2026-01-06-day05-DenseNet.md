#day05 Densely Connected Convolutional Networks (DenseNet)

昨天读ResNet的"+x"，今天读它的"进化版"——DenseNet《Densely Connected Convolutional Networks》（CVPR 2017，黄高等）。
ResNet说：每层看上一层就够了，加个shortcut让梯度直通。
DenseNet说：不够，每层要看所有之前的层，而且不是加，是拼。
核心区别：
ResNet: x_l = H(x_{l-1}) + x_{l-1}（加法）
DenseNet: x_l = H([x0, x1, …, x_{l-1}])（拼接）
一个符号的差异，带来本质不同：L层网络从L个连接变成L(L+1)/2个连接。
反直觉的发现： 连接多了，参数反而少了。
因为每层只需要学k个新特征（growth rate，如k=12），不用重复学已有的特征——所有历史特征都能直接拿来用。250层DenseNet-BC只有15.3M参数，却吊打30M+参数的Wide ResNet。Figure 5的热力图显示，深层确实在大量复用浅层特征。
结果： CIFAR-10 error 3.46%，用1/3的参数达到ResNet同等精度。
读后感：
Day02读的MUDDFormer在Transformer里搞"密集连接"，原来思想来源就是DenseNet。Day04的ResNet修了一条shortcut，Day05的DenseNet把它变成了高速公路网。从"+x"到"[x0,x1,…,x]"，深度学习的进化史就藏在这些连接方式里。
