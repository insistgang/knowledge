%% 源域和目标域数据对齐与归一化
clear; clc; close all;

fprintf('=== 源域和目标域数据对齐与归一化 ===\n');

% 1. 加载数据
fprintf('1. 加载数据...\n');
try
    % 加载源域数据
    source_data = load('task1_source_domain_4class_corrected.mat');
    source_features = source_data.source_data_4class.features;
    source_labels = source_data.source_data_4class.labels;
    fprintf('  源域数据: %d 个样本, %d 个特征\n', size(source_features, 1), size(source_features, 2));

    % 加载目标域数据
    target_data = load('task1_target_domain_task1features.mat');
    target_features = target_data.target_data.features;
    target_file_indices = target_data.target_data.file_indices;
    fprintf('  目标域数据: %d 个样本, %d 个特征\n', size(target_features, 1), size(target_features, 2));

    % 检查特征数量是否一致
    if size(source_features, 2) ~= size(target_features, 2)
        fprintf('错误：源域和目标域的特征数量不一致！\n');
        fprintf('源域特征数：%d，目标域特征数：%d\n', size(source_features, 2), size(target_features, 2));
        return;
    end

    fprintf('特征数量一致：%d\n', size(source_features, 2));

catch ME
    fprintf('加载数据失败：%s\n', ME.message);
    return;
end

% 2. 数据对齐
fprintf('\n2. 数据对齐处理...\n');

% 使用源域的特征统计信息来对齐目标域
source_mean = mean(source_features, 1);
source_std = std(source_features, 1);

% 避免除以零
source_std(source_std == 0) = 1;

% 对目标域进行相同的变换（对齐到源域的分布）
target_features_aligned = (target_features - source_mean) ./ source_std;

fprintf('数据对齐完成\n');

% 3. 数据归一化
fprintf('\n3. 数据归一化处理...\n');

% 计算所有数据（源域+对齐后的目标域）的全局最大最小值
all_features = [source_features; target_features_aligned];
global_min = min(all_features, [], 1);
global_max = max(all_features, [], 1);

% 避免除以零
range = global_max - global_min;
range(range == 0) = 1;

% 归一化到 [0, 1] 区间
source_normalized = (source_features - global_min) ./ range;
target_normalized = (target_features_aligned - global_min) ./ range;

fprintf('数据归一化完成\n');

% 4. 验证归一化结果
fprintf('\n4. 验证归一化结果...\n');
fprintf('源域数据范围：[%.4f, %.4f]\n', min(source_normalized(:)), max(source_normalized(:)));
fprintf('目标域数据范围：[%.4f, %.4f]\n', min(target_normalized(:)), max(target_normalized(:)));

% 5. 保存对齐和归一化后的数据
fprintf('\n5. 保存处理后的数据...\n');

% 保存源域数据
aligned_data.source = struct();
aligned_data.source.features = source_normalized;
aligned_data.source.labels = source_labels;
aligned_data.source.original_features = source_features;
aligned_data.source.n_samples = size(source_features, 1);
aligned_data.source.n_features = size(source_features, 2);

% 保存目标域数据
aligned_data.target = struct();
aligned_data.target.features = target_normalized;
aligned_data.target.original_features = target_features;
aligned_data.target.file_indices = target_file_indices;
aligned_data.target.n_samples = size(target_features, 1);
aligned_data.target.n_features = size(target_features, 2);

% 保存对齐信息
aligned_data.alignment_info = struct();
aligned_data.alignment_info.source_mean = source_mean;
aligned_data.alignment_info.source_std = source_std;
aligned_data.alignment_info.global_min = global_min;
aligned_data.alignment_info.global_max = global_max;
aligned_data.alignment_info.alignment_method = 'Z-score alignment followed by Min-Max normalization';
aligned_data.alignment_info.date = datestr(now);

% 保存数据
save('task1_aligned_normalized_data.mat', 'aligned_data', '-v7.3');
fprintf('数据已保存为：task1_aligned_normalized_data.mat\n');

% 6. 显示统计信息
fprintf('\n=== 数据处理统计 ===\n');
fprintf('源域数据：\n');
fprintf('  - 样本数量：%d\n', aligned_data.source.n_samples);
fprintf('  - 特征维度：%d\n', aligned_data.source.n_features);
fprintf('  - 类别分布：\n');
for i = 0:3
    count = sum(source_labels == i);
    if i == 0
        fprintf('    IR (内圈故障)：%d 个样本\n', count);
    elseif i == 1
        fprintf('    OR (外圈故障)：%d 个样本\n', count);
    elseif i == 2
        fprintf('    B (滚动体故障)：%d 个样本\n', count);
    else
        fprintf('    N (正常状态)：%d 个样本\n', count);
    end
end

fprintf('\n目标域数据：\n');
fprintf('  - 样本数量：%d\n', aligned_data.target.n_samples);
fprintf('  - 特征维度：%d\n', aligned_data.target.n_features);
fprintf('  - 文件分布：\n');
for i = 1:16
    count = sum(target_file_indices == i);
    fprintf('    文件 %c.mat：%d 个样本\n', 'A' + i - 1, count);
end

% 7. 可视化对齐效果（示例）
fprintf('\n7. 生成可视化示例...\n');
figure('Position', [100, 100, 1200, 800]);

% 选择前两个特征进行可视化
feat_idx1 = 1;
feat_idx2 = 2;

% 原始数据分布
subplot(2, 2, 1);
scatter(source_features(:, feat_idx1), source_features(:, feat_idx2), 50, source_labels, 'filled');
title('源域原始数据分布');
xlabel(['特征 ', num2str(feat_idx1)]);
ylabel(['特征 ', num2str(feat_idx2)]);
colorbar;
grid on;

subplot(2, 2, 2);
scatter(target_features(:, feat_idx1), target_features(:, feat_idx2), 30, 'b', 'filled');
title('目标域原始数据分布');
xlabel(['特征 ', num2str(feat_idx1)]);
ylabel(['特征 ', num2str(feat_idx2)]);
grid on;

% 对齐归一化后的数据分布
subplot(2, 2, 3);
scatter(source_normalized(:, feat_idx1), source_normalized(:, feat_idx2), 50, source_labels, 'filled');
title('源域对齐归一化后');
xlabel(['特征 ', num2str(feat_idx1)]);
ylabel(['特征 ', num2str(feat_idx2)]);
colorbar;
grid on;

subplot(2, 2, 4);
scatter(target_normalized(:, feat_idx1), target_normalized(:, feat_idx2), 30, 'b', 'filled');
title('目标域对齐归一化后');
xlabel(['特征 ', num2str(feat_idx1)]);
ylabel(['特征 ', num2str(feat_idx2)]);
grid on;

sgtitle('数据对齐与归一化效果（前两个特征）');
saveas(gcf, 'data_alignment_visualization.png');
fprintf('可视化结果已保存为：data_alignment_visualization.png\n');

% 8. 显示特征统计对比
fprintf('\n8. 特征统计对比（前10个特征）:\n');
fprintf('%-15s %-15s %-15s %-15s\n', '特征索引', '源域均值', '目标域均值(原始)', '目标域均值(对齐)');
for i = 1:min(10, size(source_features, 2))
    fprintf('%-15d %-15.4f %-15.4f %-15.4f\n', ...
            i, mean(source_features(:, i)), ...
            mean(target_features(:, i)), ...
            mean(target_features_aligned(:, i)));
end

fprintf('\n=== 数据对齐与归一化完成！ ===\n');
fprintf('下一步可以开始进行迁移学习算法的实现。\n');