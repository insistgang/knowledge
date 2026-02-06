%% 使用与task1相同的50个特征预处理目标域数据
clear; clc; close all;

fprintf('=== 使用task1相同的50个特征预处理目标域数据 ===\n');

% 1. 设置参数
data_dir = 'dataset/target_region_dataset/';
fs = 32000;  % 采样频率
window_size = 1024;  % 窗口长度
hop_size = 512;  % 滑动步长（50%重叠）

% 2. 获取文件列表
file_names = cell(16, 1);
for i = 1:16
    file_names{i} = [char('A' + i - 1) '.mat'];
end

fprintf('找到 %d 个目标域文件\n', length(file_names));

% 3. 处理每个文件
all_features = [];
file_indices = [];
sample_count = 0;

for file_idx = 1:16
    file_name = file_names{file_idx};
    file_path = fullfile(data_dir, file_name);

    fprintf('\n处理文件 %d/16: %s\n', file_idx, file_name);

    try
        % 加载数据
        data = load(file_path);
        signal_key = file_name(1:end-4);  % 去掉.mat后缀
        signal = data.(signal_key);
        signal = signal(:)';  % 确保是行向量

        fprintf('  信号长度: %d\n', length(signal));

        % 滑动窗口处理
        n_windows = floor((length(signal) - window_size) / hop_size) + 1;
        fprintf('  窗口数量: %d\n', n_windows);

        file_features = zeros(n_windows, 50);

        for window_idx = 1:n_windows
            % 提取窗口
            start_idx = (window_idx - 1) * hop_size + 1;
            end_idx = start_idx + window_size - 1;
            window = signal(start_idx:end_idx);

            % 使用与task1相同的特征提取方法
            features = extract_task1_features(window, fs);
            file_features(window_idx, :) = features;
            sample_count = sample_count + 1;
            file_indices = [file_indices; file_idx];
        end

        % 合并特征
        all_features = [all_features; file_features];

        fprintf('  提取了 %d 个样本\n', n_windows);

    catch ME
        fprintf('  处理文件 %s 时出错: %s\n', file_name, ME.message);
    end
end

% 4. 显示统计信息
fprintf('\n总共提取了 %d 个样本\n', size(all_features, 1));
fprintf('每个样本有 %d 个特征\n', size(all_features, 2));

% 5. 显示每个文件的样本统计
fprintf('\n=== 每个文件的样本统计 ===\n');
for i = 1:16
    count = sum(file_indices == i);
    fprintf('文件 %c.mat: %d 个样本\n', 'A' + i - 1, count);
end

% 6. 特征名称（与task1保持一致）
feature_names = {
    '均值'; '标准差'; 'RMS'; '峰值'; '峭度'; '偏度'; '方差'; '平均绝对偏差'; ...
    '峰峰值'; '均方频率'; '波形因子'; '脉冲因子'; '峰值因子'; '裕度因子'; ...
    '信息熵'; '差分均值'; '差分标准差'; '差分RMS'; '差分峭度'; '最大差分'; ...
    '频谱质心'; '频谱标准差'; '频谱总能量'; '频谱峭度'; '主频频率'; ...
    '平均功率'; '功率标准差'; '功率偏度'; '功率峭度'; '频谱平坦度'; ...
    '低频带能量'; '中频带能量'; '高频带能量'; '低频能量比'; '频带能量熵'; ...
    '时频熵'; '时频频率质心'; '时频时间质心'; '时频频率宽度'; ...
    '低频时频能量比'; '高频时频能量比'; '最大时频能量'; '时频能量标准差'; ...
    '小波尺度1能量'; '小波尺度2能量'; '小波尺度3能量'; '小波尺度4能量'; '小波尺度5能量'; ...
    '小波能量熵'; '小波加权平均尺度'
};

% 7. 保存数据
target_data = struct();
target_data.features = all_features;
target_data.file_indices = file_indices;
target_data.n_samples = size(all_features, 1);
target_data.n_features = size(all_features, 2);
target_data.feature_names = feature_names;
target_data.preprocessing_info = struct();
target_data.preprocessing_info.fs = fs;
target_data.preprocessing_info.window_size = window_size;
target_data.preprocessing_info.hop_size = hop_size;
target_data.preprocessing_info.overlap_rate = 0.5;
target_data.preprocessing_info.n_files = 16;
target_data.preprocessing_info.feature_method = 'task1_50selected_features';

save('task1_target_domain_task1features.mat', 'target_data', '-v7.3');

fprintf('\n目标域数据预处理完成！\n');
fprintf('输出文件：task1_target_domain_task1features.mat\n');
fprintf('特征提取方法与task1完全一致\n');

% 特征提取函数（与task1完全相同）
function features = extract_task1_features(signal, fs)
    features = zeros(1, 50);
    n = length(signal);

    % ========================================
    % 1. 时域特征 (1-20)
    % ========================================

    % 1. 均值
    features(1) = mean(signal);

    % 2. 标准差
    features(2) = std(signal);

    % 3. RMS
    features(3) = rms(signal);

    % 4. 峰值
    features(4) = max(abs(signal));

    % 5. 峭度
    features(5) = kurtosis(signal);

    % 6. 偏度
    features(6) = skewness(signal);

    % 7. 方差
    features(7) = var(signal);

    % 8. 平均绝对偏差
    features(8) = mean(abs(signal - mean(signal)));

    % 9. 峰峰值
    features(9) = max(signal) - min(signal);

    % 10. 均方频率
    diff_signal = diff(signal);
    features(10) = mean(diff_signal.^2);

    % 11. 波形因子
    mean_abs = mean(abs(signal));
    if mean_abs > 0
        features(11) = features(3) / mean_abs;
    else
        features(11) = 0;
    end

    % 12. 脉冲因子
    if mean_abs > 0
        features(12) = features(4) / mean_abs;
    else
        features(12) = 0;
    end

    % 13. 峰值因子
    if features(3) > 0
        features(13) = features(4) / features(3);
    else
        features(13) = 0;
    end

    % 14. 裕度因子
    if mean(sqrt(abs(signal))) > 0
        features(14) = features(4) / (mean(sqrt(abs(signal))))^2;
    else
        features(14) = 0;
    end

    % 15. 信息熵
    % 计算幅值直方图
    edges = linspace(min(signal), max(signal), 20);
    counts = histcounts(signal, edges);
    prob = counts / sum(counts);
    prob = prob(prob > 0);  % 避免log(0)
    features(15) = -sum(prob .* log2(prob));

    % 16. 差分均值
    features(16) = mean(diff_signal);

    % 17. 差分标准差
    features(17) = std(diff_signal);

    % 18. 差分RMS
    features(18) = rms(diff_signal);

    % 19. 差分峭度
    features(19) = kurtosis(diff_signal);

    % 20. 最大差分
    features(20) = max(abs(diff_signal));

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
        features(21) = sum(freqs .* fft_vals) / sum(fft_vals);
    else
        features(21) = 0;
    end

    % 22. 频谱标准差
    if sum(fft_vals) > 0 && features(21) > 0
        features(22) = sqrt(sum((freqs - features(21)).^2 .* fft_vals) / sum(fft_vals));
    else
        features(22) = 0;
    end

    % 23. 频谱总能量
    features(23) = sum(fft_power);

    % 24. 频谱峭度
    if sum(fft_vals) > 0 && features(22) > 0
        features(24) = sum((freqs - features(21)).^4 .* fft_vals) / ...
                      (features(22)^4 * sum(fft_vals));
    else
        features(24) = 0;
    end

    % 25. 主频频率
    [~, idx] = max(fft_vals);
    features(25) = freqs(idx);

    % 26. 平均功率
    features(26) = mean(fft_power);

    % 27. 功率标准差
    features(27) = std(fft_power);

    % 28. 功率偏度
    features(28) = skewness(fft_power);

    % 29. 功率峭度
    features(29) = kurtosis(fft_power);

    % 30. 频谱平坦度
    geometric_mean = exp(mean(log(fft_power + eps)));
    features(30) = geometric_mean / mean(fft_power);

    % 31. 低频带能量 (0-fs/4)
    low_mask = freqs < fs/4;
    features(31) = sum(fft_power(low_mask));

    % 32. 中频带能量 (fs/4-fs/2)
    mid_mask = freqs >= fs/4 & freqs < fs/2;
    features(32) = sum(fft_power(mid_mask));

    % 33. 高频带能量 (fs/2-fs)
    high_mask = freqs >= fs/2;
    features(33) = sum(fft_power(high_mask));

    % 34. 低频能量比
    if features(23) > 0
        features(34) = features(31) / features(23);
    else
        features(34) = 0;
    end

    % 35. 频带能量熵
    band_energies = [features(31), features(32), features(33)];
    if sum(band_energies) > 0
        band_probs = band_energies / sum(band_energies);
        band_probs = band_probs(band_probs > 0);
        features(35) = -sum(band_probs .* log2(band_probs));
    else
        features(35) = 0;
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
            features(36) = -sum(tf_norm(:) .* log2(tf_norm(:) + eps));

            % 37. 时频频率质心
            [f_grid, t_grid] = meshgrid(F, T);
            features(37) = sum(f_grid(:) .* S_power(:)) / tf_total_energy;

            % 38. 时频时间质心
            features(38) = sum(t_grid(:) .* S_power(:)) / tf_total_energy;

            % 39. 时频频率宽度
            if sum(S_power(:)) > 0
                features(39) = sqrt(sum((f_grid(:) - features(37)).^2 .* S_power(:)) / tf_total_energy);
            else
                features(39) = 0;
            end

            % 40. 低频时频能量比
            low_freq_mask = F < fs/4;
            features(40) = sum(S_power(low_freq_mask, :)) / tf_total_energy;

            % 41. 高频时频能量比
            high_freq_mask = F >= fs/4;
            features(41) = sum(S_power(high_freq_mask, :)) / tf_total_energy;

            % 42. 最大时频能量
            features(42) = max(S_power(:));

            % 43. 时频能量标准差
            frame_energies = sum(S_power, 1)';
            features(43) = std(frame_energies);

        else
            features(36:43) = 0;
        end
    catch
        features(36:43) = 0;
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
        features(44:48) = wavelet_energies;

        % 49. 小波能量熵
        total_wavelet_energy = sum(wavelet_energies);
        if total_wavelet_energy > 0
            wavelet_probs = wavelet_energies / total_wavelet_energy;
            wavelet_probs = wavelet_probs(wavelet_probs > 0);
            features(49) = -sum(wavelet_probs .* log2(wavelet_probs));
        else
            features(49) = 0;
        end

        % 50. 小波加权平均尺度
        if total_wavelet_energy > 0
            features(50) = sum(scales .* wavelet_energies) / total_wavelet_energy;
        else
            features(50) = 0;
        end

    catch
        features(44:50) = 0;
    end
end