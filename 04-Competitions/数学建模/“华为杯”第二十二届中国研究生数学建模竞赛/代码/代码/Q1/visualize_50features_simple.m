%% 第一问50个特征对比可视化（简化版）
clear; clc; close all;

fprintf('=== 第一问50个特征对比可视化（简化版） ===\n');

% 1. 加载数据
fprintf('1. 加载数据...\n');
try
    % 加载原始50特征数据
    data_50 = load('task1_simple_21class_50selected.mat');
    X_original = data_50.simple_50selected.X;
    X_std = data_50.simple_50selected.X_std;
    y_cell = data_50.simple_50selected.y;

    % 将字符串标签转换为四分类数值
    y = zeros(length(y_cell), 1);
    for i = 1:length(y_cell)
        label = y_cell{i};
        if contains(label, 'IR')
            y(i) = 0;  % 内圈故障
        elseif contains(label, 'OR')
            y(i) = 1;  % 外圈故障
        elseif contains(label, 'B')
            y(i) = 2;  % 滚动体故障
        elseif contains(label, 'N')
            y(i) = 3;  % 正常状态
        else
            y(i) = -1; % 未知
        end
    end

    % 特征名称
    feature_names = data_50.simple_50selected.feature_names;

    fprintf('✓ 成功加载50特征数据集\n');
    fprintf('  样本数: %d\n', size(X_original, 1));
    fprintf('  特征数: %d\n', size(X_original, 2));

catch ME
    fprintf('✗ 加载数据失败: %s\n', ME.message);
    return;
end

% 2. 数据统计
fprintf('\n2. 数据统计分析...\n');

% 按故障类型分组
type_names = {'内圈故障', '外圈故障', '滚动体故障', '正常状态'};
type_colors = [1 0 0; 0 0 1; 0 0.8 0; 1 1 0];

% 创建分组索引
groups = cell(4, 1);
for i = 1:4
    groups{i} = find(y == i-1);  % 0:IR, 1:OR, 2:B, 3:N
    fprintf('%s: %d 个样本\n', type_names{i}, length(groups{i}));
end

% 3. 创建可视化
fprintf('\n3. 生成可视化图表...\n');

figure('Position', [50, 50, 1600, 900], 'Color', 'white');

% 3.1 前10个特征的均值对比
subplot(2, 2, 1);
n_features = min(10, size(X_std, 2));
feature_means = zeros(4, n_features);

for i = 1:4
    if ~isempty(groups{i})
        feature_means(i, :) = mean(X_std(groups{i}, 1:n_features), 1);
    end
end

bar(feature_means');
set(gca, 'XTick', 1:n_features);
set(gca, 'XTickLabel', feature_names(1:n_features), 'XTickLabelRotation', 45);
xlabel('特征');
ylabel('标准化均值');
title('前10个特征在不同故障类型下的均值对比');
legend(type_names, 'Location', 'bestoutside');
grid on;

% 3.2 特征重要性排序（基于标准差）
subplot(2, 2, 2);
feature_std = std(X_std);
[std_sorted, std_idx] = sort(feature_std, 'descend');

bar(std_sorted(1:20));
title('前20个特征的重要性（基于标准差）');
xlabel('特征排序');
ylabel('标准差');
grid on;

% 设置x轴标签
xticks(1:20);
xticklabels(feature_names(std_idx(1:20)));
xtickangle(45);

% 3.3 前6个特征的分布直方图
subplot(2, 2, 3);
n_hist_features = min(6, size(X_std, 2));
for i = 1:n_hist_features
    subplot(2, 3, i);
    % 绘制四种故障类型的分布
    for j = 1:4
        if ~isempty(groups{j})
            histogram(X_std(groups{j}, i), 15, 'Normalization', 'pdf', ...
                     'FaceColor', type_colors(j,:), 'FaceAlpha', 0.6, 'EdgeColor', 'none');
            hold on;
        end
    end
    title(sprintf('%s', feature_names{i}), 'FontSize', 9);
    if i == 1
        legend(type_names, 'Location', 'best', 'FontSize', 7);
    end
    grid on;
    xlim([min(X_std(:, i))-0.5, max(X_std(:, i))+0.5]);
end

% 3.4 特征相关性热图（前15个特征）
subplot(2, 2, 4);
n_corr_features = min(15, size(X_std, 2));
corr_matrix = corr(X_std(:, 1:n_corr_features));
imagesc(corr_matrix);
colormap(jet);
colorbar;
title('前15个特征的相关性热图');
axis square;

% 添加特征标签
set(gca, 'XTick', 1:n_corr_features);
set(gca, 'YTick', 1:n_corr_features);
set(gca, 'XTickLabel', feature_names(1:n_corr_features), 'XTickLabelRotation', 45);
set(gca, 'YTickLabel', feature_names(1:n_corr_features));

% 4. 保存图像
fprintf('\n4. 保存可视化结果...\n');
saveas(gcf, 'task1_50features_comparison.png');
fprintf('✓ 图像已保存为: task1_50features_comparison.png\n');

% 5. 输出特征统计信息
fprintf('\n5. 特征统计信息（前15个特征）\n');
fprintf('========================================================================================================\n');
fprintf('%-25s %-15s %-15s %-15s %-15s %-15s %-15s %-15s\n', '特征名称', '最大值', '最小值', '标准差', 'IR均值', 'OR均值', 'B均值', 'N均值');
fprintf('========================================================================================================\n');

% 显示前15个特征的统计信息
for i = 1:min(15, size(X_std, 2))
    ir_mean = mean(X_std(groups{1}, i));
    or_mean = mean(X_std(groups{2}, i));
    b_mean = mean(X_std(groups{3}, i));
    n_mean = mean(X_std(groups{4}, i));

    fprintf('%-25s %-15.4f %-15.4f %-15.4f %-15.4f %-15.4f %-15.4f %-15.4f\n', ...
            feature_names{i}, max(X_std(:, i)), min(X_std(:, i)), std(X_std(:, i)), ...
            ir_mean, or_mean, b_mean, n_mean);
end

% 6. 显示最重要的10个特征
fprintf('\n6. 最重要的10个特征（基于标准差）:\n');
fprintf('========================================\n');
for i = 1:10
    fprintf('%d. %-25s (标准差: %.4f)\n', i, ...
            feature_names{std_idx(i)}, std_sorted(i));
end

fprintf('\n=== 可视化完成！ ===\n');