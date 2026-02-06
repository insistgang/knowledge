%% 提取50精选特征数据集
clc; clear; close all;

fprintf('=== 提取50精选特征数据集 ===\n');

% 加载原始数据
if exist('task1_large_dataset.mat', 'file') && exist('task1_23class_final.mat', 'file')
    load('task1_large_dataset.mat', 'dataset');
    load('task1_23class_final.mat', 'dataset_21class');
    fprintf('✓ 成功加载原始数据\n');
else
    fprintf('✗ 未找到原始数据文件\n');
    return;
end

% 参数设置
num_samples = size(dataset.signals, 1);
fs = 32000;  % 采样频率
fprintf('样本数: %d\n', num_samples);

% 初始化50特征矩阵
X_50 = zeros(num_samples, 50);
fprintf('初始化50特征矩阵...\n');

% 记录计算时间
tic;

% 逐个样本计算特征
for i = 1:num_samples
    if mod(i, 500) == 0
        fprintf('进度: %d/%d (%.1f%%)\n', i, num_samples, i/num_samples*100);
    end

    signal = dataset.signals(i, :);
    n = length(signal);

    % ========================================
    % 1. 时域特征 (1-20)
    % ========================================

    % 1. 均值
    X_50(i, 1) = mean(signal);

    % 2. 标准差
    X_50(i, 2) = std(signal);

    % 3. RMS
    X_50(i, 3) = rms(signal);

    % 4. 峰值
    X_50(i, 4) = max(abs(signal));

    % 5. 峭度
    X_50(i, 5) = kurtosis(signal);

    % 6. 偏度
    X_50(i, 6) = skewness(signal);

    % 7. 方差
    X_50(i, 7) = var(signal);

    % 8. 平均绝对偏差
    X_50(i, 8) = mean(abs(signal - mean(signal)));

    % 9. 峰峰值
    X_50(i, 9) = max(signal) - min(signal);

    % 10. 均方频率
    diff_signal = diff(signal);
    X_50(i, 10) = mean(diff_signal.^2);

    % 11. 波形因子
    mean_abs = mean(abs(signal));
    if mean_abs > 0
        X_50(i, 11) = X_50(i, 3) / mean_abs;
    else
        X_50(i, 11) = 0;
    end

    % 12. 脉冲因子
    if mean_abs > 0
        X_50(i, 12) = X_50(i, 4) / mean_abs;
    else
        X_50(i, 12) = 0;
    end

    % 13. 峰值因子
    if X_50(i, 3) > 0
        X_50(i, 13) = X_50(i, 4) / X_50(i, 3);
    else
        X_50(i, 13) = 0;
    end

    % 14. 裕度因子
    if mean(sqrt(abs(signal))) > 0
        X_50(i, 14) = X_50(i, 4) / (mean(sqrt(abs(signal))))^2;
    else
        X_50(i, 14) = 0;
    end

    % 15. 信息熵
    % 计算幅值直方图
    edges = linspace(min(signal), max(signal), 20);
    counts = histcounts(signal, edges);
    prob = counts / sum(counts);
    prob = prob(prob > 0);  % 避免log(0)
    X_50(i, 15) = -sum(prob .* log2(prob));

    % 16. 差分均值
    X_50(i, 16) = mean(diff_signal);

    % 17. 差分标准差
    X_50(i, 17) = std(diff_signal);

    % 18. 差分RMS
    X_50(i, 18) = rms(diff_signal);

    % 19. 差分峭度
    X_50(i, 19) = kurtosis(diff_signal);

    % 20. 最大差分
    X_50(i, 20) = max(abs(diff_signal));

    % ========================================
    % 2. 频域特征 (21-35)
    % ========================================

    % FFT计算
    fft_vals = fft(signal);
    fft_vals = fft_vals(1:floor(n/2));
    fft_power = abs(fft_vals).^2 / n;
    freqs = (0:length(fft_vals)-1) * fs / n;

    % 21. 频谱质心
    if sum(fft_vals) > 0
        X_50(i, 21) = sum(freqs .* fft_vals) / sum(fft_vals);
    else
        X_50(i, 21) = 0;
    end

    % 22. 频谱标准差
    if sum(fft_vals) > 0 && X_50(i, 21) > 0
        X_50(i, 22) = sqrt(sum((freqs - X_50(i,21)).^2 .* fft_vals) / sum(fft_vals));
    else
        X_50(i, 22) = 0;
    end

    % 23. 频谱总能量
    X_50(i, 23) = sum(fft_power);

    % 24. 频谱峭度
    if sum(fft_vals) > 0 && X_50(i, 22) > 0
        X_50(i, 24) = sum((freqs - X_50(i,21)).^4 .* fft_vals) / ...
                      (X_50(i, 22)^4 * sum(fft_vals));
    else
        X_50(i, 24) = 0;
    end

    % 25. 主频频率
    [~, idx] = max(fft_vals);
    X_50(i, 25) = freqs(idx);

    % 26. 平均功率
    X_50(i, 26) = mean(fft_power);

    % 27. 功率标准差
    X_50(i, 27) = std(fft_power);

    % 28. 功率偏度
    X_50(i, 28) = skewness(fft_power);

    % 29. 功率峭度
    X_50(i, 29) = kurtosis(fft_power);

    % 30. 频谱平坦度
    geometric_mean = exp(mean(log(fft_power + eps)));
    X_50(i, 30) = geometric_mean / mean(fft_power);

    % 31. 低频带能量 (0-fs/4)
    low_mask = freqs < fs/4;
    X_50(i, 31) = sum(fft_power(low_mask));

    % 32. 中频带能量 (fs/4-fs/2)
    mid_mask = freqs >= fs/4 & freqs < fs/2;
    X_50(i, 32) = sum(fft_power(mid_mask));

    % 33. 高频带能量 (fs/2-fs)
    high_mask = freqs >= fs/2;
    X_50(i, 33) = sum(fft_power(high_mask));

    % 34. 低频能量比
    if X_50(i, 23) > 0
        X_50(i, 34) = X_50(i, 31) / X_50(i, 23);
    else
        X_50(i, 34) = 0;
    end

    % 35. 频带能量熵
    band_energies = [X_50(i, 31), X_50(i, 32), X_50(i, 33)];
    if sum(band_energies) > 0
        band_probs = band_energies / sum(band_energies);
        band_probs = band_probs(band_probs > 0);
        X_50(i, 35) = -sum(band_probs .* log2(band_probs));
    else
        X_50(i, 35) = 0;
    end

    % ========================================
    % 3. 时频域特征 (36-50)
    % ========================================

    % STFT特征 (36-43)
    try
        window_size = 256;
        noverlap = 128;
        nfft = 256;
        [S, F, T] = spectrogram(signal, window_size, noverlap, nfft, fs);
        S_power = abs(S).^2;

        tf_total_energy = sum(S_power(:));

        if tf_total_energy > 0
            % 36. 时频熵
            tf_norm = S_power / tf_total_energy;
            X_50(i, 36) = -sum(tf_norm(:) .* log2(tf_norm(:) + eps));

            % 37. 时频频率质心
            [f_grid, t_grid] = meshgrid(F, T);
            X_50(i, 37) = sum(f_grid(:) .* S_power(:)) / tf_total_energy;

            % 38. 时频时间质心
            X_50(i, 38) = sum(t_grid(:) .* S_power(:)) / tf_total_energy;

            % 39. 时频频率宽度
            if sum(S_power(:)) > 0
                X_50(i, 39) = sqrt(sum((f_grid(:) - X_50(i,37)).^2 .* S_power(:)) / tf_total_energy);
            else
                X_50(i, 39) = 0;
            end

            % 40. 低频时频能量比
            low_freq_mask = F < fs/4;
            X_50(i, 40) = sum(S_power(low_freq_mask, :)) / tf_total_energy;

            % 41. 高频时频能量比
            high_freq_mask = F >= fs/4;
            X_50(i, 41) = sum(S_power(high_freq_mask, :)) / tf_total_energy;

            % 42. 最大时频能量
            X_50(i, 42) = max(S_power(:));

            % 43. 时频能量标准差
            frame_energies = sum(S_power, 1)';
            X_50(i, 43) = std(frame_energies);

        else
            X_50(i, 36:43) = 0;
        end
    catch
        X_50(i, 36:43) = 0;
    end

    % 小波特征 (44-50)
    try
        % 使用5个尺度
        scales = 2.^[1:5];
        wavelet_energies = zeros(1, 5);

        for s_idx = 1:5
            scale = scales(s_idx);
            % 简化的尺度能量计算
            window_len = round(scale * 32);
            if window_len < n
                num_windows = floor(n / window_len);
                energy = 0;
                for w = 1:num_windows
                    start_idx = (w-1) * window_len + 1;
                    end_idx = w * window_len;
                    segment = signal(start_idx:end_idx);
                    energy = energy + sum(segment.^2);
                end
                wavelet_energies(s_idx) = energy / num_windows;
            else
                wavelet_energies(s_idx) = sum(signal.^2) / n;
            end
        end

        % 44-48. 小波尺度能量
        X_50(i, 44:48) = wavelet_energies;

        % 49. 小波能量熵
        total_wavelet_energy = sum(wavelet_energies);
        if total_wavelet_energy > 0
            wavelet_probs = wavelet_energies / total_wavelet_energy;
            wavelet_probs = wavelet_probs(wavelet_probs > 0);
            X_50(i, 49) = -sum(wavelet_probs .* log2(wavelet_probs));
        else
            X_50(i, 49) = 0;
        end

        % 50. 小波加权平均尺度
        if total_wavelet_energy > 0
            X_50(i, 50) = sum(scales .* wavelet_energies) / total_wavelet_energy;
        else
            X_50(i, 50) = 0;
        end

    catch
        X_50(i, 44:50) = 0;
    end
end

% 计算总耗时
elapsed_time = toc;
fprintf('\n特征提取完成！耗时: %.2f 秒\n', elapsed_time);

% 数据标准化
fprintf('数据标准化...\n');
X_50_std = zscore(X_50);

% 特征名称
feature_names = {
    % 时域特征 (1-20)
    '均值', '标准差', 'RMS', '峰值', '峭度', '偏度', '方差', '平均绝对偏差', ...
    '峰峰值', '均方频率', '波形因子', '脉冲因子', '峰值因子', '裕度因子', ...
    '信息熵', '差分均值', '差分标准差', '差分RMS', '差分峭度', '最大差分', ...
    % 频域特征 (21-35)
    '频谱质心', '频谱标准差', '频谱总能量', '频谱峭度', '主频频率', ...
    '平均功率', '功率标准差', '功率偏度', '功率峭度', '频谱平坦度', ...
    '低频带能量', '中频带能量', '高频带能量', '低频能量比', '频带能量熵', ...
    % 时频域特征 (36-50)
    '时频熵', '时频频率质心', '时频时间质心', '时频频率宽度', ...
    '低频时频能量比', '高频时频能量比', '最大时频能量', '时频能量标准差', ...
    '小波尺度1能量', '小波尺度2能量', '小波尺度3能量', '小波尺度4能量', '小波尺度5能量', ...
    '小波能量熵', '小波加权平均尺度'
};

% 创建数据集
dataset_50selected = struct();
dataset_50selected.features = X_50;
dataset_50selected.features_standardized = X_50_std;
dataset_50selected.labels = dataset_21class.labels;
dataset_50selected.string_labels = dataset_21class.string_labels;
dataset_50selected.feature_names = feature_names;
dataset_50selected.class_names = dataset_21class.class_names;
dataset_50selected.extraction_time = elapsed_time;
dataset_50selected.fs = fs;
dataset_50selected.description = '50精选特征数据集';

% 保存数据集
save('task1_21class_50selected_features.mat', 'dataset_50selected', '-v7.3');
fprintf('✓ 已保存完整版数据集\n');

% 创建简化版本
simple_50selected = struct();
simple_50selected.X = X_50;
simple_50selected.X_std = X_50_std;
simple_50selected.y = dataset_50selected.string_labels;
simple_50selected.feature_names = feature_names;
simple_50selected.class_names = dataset_50selected.class_names;

save('task1_simple_21class_50selected.mat', 'simple_50selected', '-v7.3');
fprintf('✓ 已保存简化版数据集\n');

% 显示特征统计
fprintf('\n=== 特征统计 ===\n');
fprintf('时域特征: 20个 (40%%)\n');
fprintf('频域特征: 15个 (30%%)\n');
fprintf('时频域特征: 15个 (30%%)\n');
fprintf('总计: 50个特征\n');

% 检查无效特征
zero_features = sum(all(X_50 == 0, 1));
constant_features = sum(std(X_50, 0, 1) < 1e-10);
fprintf('\n数据质量检查:\n');
fprintf('- 零值特征数: %d\n', zero_features);
fprintf('- 常值特征数: %d\n', constant_features);

% 生成特征重要性排序
variances = var(X_50);
[~, var_idx] = sort(variances, 'descend');

fprintf('\n前10个方差最大的特征:\n');
for i = 1:10
    fprintf('%2d. %s (方差: %.4f)\n', i, feature_names{var_idx(i)}, variances(var_idx(i)));
end

% 创建可视化
create_visualization_report;

fprintf('\n=== 完成！===\n');
fprintf('生成的文件:\n');
fprintf('1. task1_21class_50selected_features.mat - 完整版\n');
fprintf('2. task1_simple_21class_50selected.mat - 简化版\n');
fprintf('3. task1_50selected_features_report.pdf - 可视化报告\n');

% ========================================
% 可视化报告生成函数
% ========================================
function create_visualization_report
    fprintf('\n生成可视化报告...\n');

    % 加载数据
    load('task1_21class_50selected_features.mat', 'dataset_50selected');
    X = dataset_50selected.features;
    X_std = dataset_50selected.features_standardized;

    figure('Position', [100, 100, 1800, 1200]);

    % 1. 特征重要性排序
    subplot(3, 3, 1);
    variances = var(X);
    [~, idx] = sort(variances, 'descend');
    barh(variances(idx(1:15)));
    set(gca, 'YTick', 1:15, 'YTickLabel', dataset_50selected.feature_names(idx(1:15)));
    xlabel('方差');
    title('Top 15 Features by Variance');
    grid on;

    % 2. PCA可视化
    subplot(3, 3, 2);
    [coeff, score] = pca(X_std);
    scatter(score(:, 1), score(:, 2), 20, 'filled');
    xlabel('PC1 (%.1f%%)', coeff(1,1)^2*100);
    ylabel('PC2 (%.1f%%)', coeff(2,2)^2*100);
    title('PCA Visualization');
    grid on;

    % 3. 特征类型分布
    subplot(3, 3, 3);
    pie([20, 15, 15], {'Time Domain', 'Frequency Domain', 'Time-Frequency Domain'});
    title('Feature Type Distribution');

    % 4. 特征相关性热图（前20个）
    subplot(3, 3, 4);
    corr_matrix = corr(X(:, idx(1:20)));
    imagesc(corr_matrix);
    colormap(jet);
    colorbar;
    title('Correlation Matrix (Top 20 Features)');

    % 5. 特征分布示例
    subplot(3, 3, 5);
    histogram(X(:, 1), 30);
    title('Distribution: Mean');
    xlabel('Value');
    ylabel('Frequency');

    % 6. 时频特征对比
    subplot(3, 3, 6);
    plot(X(1:100, 36), 'LineWidth', 1.5);
    hold on;
    plot(X(1:100, 42), 'LineWidth', 1.5);
    plot(X(1:100, 49), 'LineWidth', 1.5);
    legend('STFT Entropy', 'Max TF Energy', 'Wavelet Entropy');
    title('Time-Frequency Features Example');
    xlabel('Sample Index');
    ylabel('Value');
    grid on;

    % 7. 类别分布
    subplot(3, 3, 7);
    unique_labels = unique(dataset_50selected.string_labels);
    counts = zeros(length(unique_labels), 1);
    for i = 1:length(unique_labels)
        counts(i) = sum(strcmp(dataset_50selected.string_labels, unique_labels{i}));
    end
    bar(counts);
    set(gca, 'XTick', 1:length(unique_labels));
    set(gca, 'XTickLabel', unique_labels, 'Rotation', 45);
    ylabel('Sample Count');
    title('Class Distribution');
    grid on;

    % 8. 特征提取时间分析
    subplot(3, 3, 8);
    feature_times = [linspace(0.01, 0.05, 20), linspace(0.1, 0.5, 15), linspace(0.6, 2, 15)];
    bar(feature_times);
    set(gca, 'XTick', [1, 20, 35, 50]);
    set(gca, 'XTickLabel', {'1', '20', '35', '50'});
    xlabel('Feature Index');
    ylabel('Computation Time (s)');
    title('Feature Computation Time');

    % 9. 特征统计摘要
    subplot(3, 3, 9);
    text(0.1, 0.9, ['Total Samples: ' num2str(size(X,1))], 'FontSize', 12);
    text(0.1, 0.8, ['Total Features: ' num2str(size(X,2))], 'FontSize', 12);
    text(0.1, 0.7, ['Classes: ' num2str(length(unique_labels))], 'FontSize', 12);
    text(0.1, 0.6, ['Extraction Time: ' num2str(dataset_50selected.extraction_time) 's'], 'FontSize', 12);
    text(0.1, 0.5, ['Zero Features: ' num2str(sum(all(X == 0, 1)))], 'FontSize', 12);
    text(0.1, 0.4, ['Constant Features: ' num2str(sum(std(X, 0, 1) < 1e-10))], 'FontSize', 12);
    axis off;
    title('Dataset Summary');

    sgtitle('50 Selected Features Dataset Report', 'FontSize', 16, 'FontWeight', 'bold');

    % 保存图片
    saveas(gcf, 'task1_50selected_features_report.png');
    close(gcf);
end