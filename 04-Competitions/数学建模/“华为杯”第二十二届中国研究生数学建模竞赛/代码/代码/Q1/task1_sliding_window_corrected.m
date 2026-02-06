%% Task 1: 修正的滑动窗口分割 - 获取更多样本
clc; clear; close all;

fprintf('=== Task 1: 修正的滑动窗口分割 ===\n');

% 1. 加载重采样数据
fprintf('1. 加载重采样数据...\n');
load('task1_resampled_data.mat', 'file_table', 'resampled_signals');

% 2. 修正的参数设置
fprintf('2. 设置修正的参数...\n');
window_size = 2048;      % 减小窗口大小以适应短信号
overlap_ratio = 0.75;    % 增加重叠率以获取更多样本
hop_size = round(window_size * (1 - overlap_ratio));  % 512点

fprintf('窗口参数:\n');
fprintf('- 窗口大小: %d 点 (%.3f秒)\n', window_size, window_size/32000);
fprintf('- 重叠率: %.1f%%\n', overlap_ratio*100);
fprintf('- 步长: %d 点 (%.3f秒)\n', hop_size, hop_size/32000);

% 3. 初始化
all_segments = {};
segment_features = [];
quality_flags = [];
segment_count = 0;

% 4. 质量评估参数
rms_min = 0.001;
rms_max = 10;
peak_factor_max = 15;
kurtosis_max = 50;

% 5. 统计信息
fault_stats = struct();
for ft = {'OR', 'IR', 'B', 'N'}
    fault_stats.(ft{1}).total = 0;
    fault_stats.(ft{1}).good = 0;
end

% 6. 处理所有文件
fprintf('\n3. 处理所有文件...\n');
total_files = height(file_table);
processed_files = 0;

for file_idx = 1:total_files
    if mod(file_idx, 20) == 0
        fprintf('进度: %d/%d\n', file_idx, total_files);
    end

    signal = resampled_signals{file_idx};
    fault_type = file_table.FaultType{file_idx};
    original_fs = file_table.SamplingFreq(file_idx);
    signal_length = length(signal);

    % 跳过过短的信号
    if signal_length < window_size
        fprintf('警告: 文件 %d (%s, %dkHz) 信号长度 %d < 窗口大小 %d，跳过\n', ...
            file_idx, fault_type, original_fs, signal_length, window_size);
        continue;
    end

    processed_files = processed_files + 1;

    % 计算分段数
    num_segments = floor((signal_length - window_size) / hop_size) + 1;
    fault_stats.(fault_type).total = fault_stats.(fault_type).total + num_segments;

    % 提取分段
    for seg_idx = 1:num_segments
        start_idx = (seg_idx - 1) * hop_size + 1;
        end_idx = start_idx + window_size - 1;
        segment = signal(start_idx:end_idx);

        % 质量评估
        rms_val = rms(segment);
        peak_val = max(abs(segment));
        peak_factor = peak_val / rms_val;
        kurtosis_val = kurtosis(segment);

        % 质量检查
        is_good = (rms_val >= rms_min && rms_val <= rms_max) && ...
                  (peak_factor <= peak_factor_max) && ...
                  (kurtosis_val <= kurtosis_max);

        if is_good
            fault_stats.(fault_type).good = fault_stats.(fault_type).good + 1;

            % 保存分段信息
            segment_count = segment_count + 1;
            all_segments{segment_count, 1} = segment;
            all_segments{segment_count, 2} = fault_type;
            all_segments{segment_count, 3} = file_idx;
            all_segments{segment_count, 4} = seg_idx;
            all_segments{segment_count, 5} = start_idx;
            all_segments{segment_count, 6} = end_idx;

            % 提取基本特征
            mean_val = mean(segment);
            std_val = std(segment);
            rms_val = rms(segment);
            peak_val = max(abs(segment));
            peak_factor = peak_val / rms_val;
            kurtosis_val = kurtosis(segment);

            % 频域特征
            fft_segment = fft(segment);
            psd = abs(fft_segment).^2 / (window_size^2);
            psd = psd(1:window_size/2);
            freq = (0:window_size/2-1) * 32000 / window_size;

            % 找到峰值频率
            [~, peak_freq_idx] = max(psd);
            peak_freq = freq(peak_freq_idx);

            % 频谱质心
            spectral_centroid = sum(freq .* psd) / sum(psd);

            % 频谱滚降（95%能量）
            cum_energy = cumsum(psd);
            cum_energy = cum_energy / cum_energy(end);
            rolloff_idx = find(cum_energy >= 0.95, 1);
            if isempty(rolloff_idx)
                rolloff_idx = window_size/2;
            end
            spectral_rolloff = freq(rolloff_idx);

            % 保存特征
            segment_features(segment_count, :) = [mean_val, std_val, rms_val, ...
                                               peak_factor, kurtosis_val, ...
                                               peak_freq, spectral_centroid, ...
                                               spectral_rolloff];
            quality_flags(segment_count) = true;
        end
    end
end

fprintf('\n处理完成:\n');
fprintf('- 成功处理的文件数: %d/%d\n', processed_files, total_files);
fprintf('- 总分段数: %d\n', segment_count);
fprintf('- 合格分段数: %d (%.1f%%)\n', sum(quality_flags), ...
        sum(quality_flags)/segment_count*100);

% 7. 统计各故障类型
fprintf('\n4. 各故障类型统计:\n');
for ft = fieldnames(fault_stats)'
    ft_name = ft{1};
    total_segs = fault_stats.(ft_name).total;
    good_segs = fault_stats.(ft_name).good;
    if total_segs > 0
        fprintf('%s: 总分段 %d, 合格 %d (%.1f%%)\n', ft_name, ...
                total_segs, good_segs, good_segs/total_segs*100);
    else
        fprintf('%s: 总分段 %d, 合格 %d\n', ft_name, ...
                total_segs, good_segs);
    end
end

% 8. 转换为结构数组
fprintf('\n5. 转换数据结构...\n');
if segment_count > 0
    segments_struct = struct();
    for i = 1:segment_count
        segments_struct(i).signal = all_segments{i, 1};
        segments_struct(i).fault_type = all_segments{i, 2};
        segments_struct(i).file_index = all_segments{i, 3};
        segments_struct(i).segment_index = all_segments{i, 4};
        segments_struct(i).start_index = all_segments{i, 5};
        segments_struct(i).end_index = all_segments{i, 6};
        segments_struct(i).quality = quality_flags(i);
        segments_struct(i).features = segment_features(i, :);
    end

    % 提取各故障类型的合格分段
    fprintf('\n6. 提取各故障类型合格分段...\n');
    fault_segments = struct();
    for ft = {'OR', 'IR', 'B', 'N'}
        ft_name = ft{1};
        indices = find(strcmp({segments_struct.fault_type}, ft_name));
        fault_segments.(ft_name) = segments_struct(indices);
        fprintf('%s: %d 个合格分段\n', ft_name, length(indices));
    end

    % 9. 保存数据
    fprintf('\n7. 保存数据...\n');
    dataset.segments = segments_struct;
    dataset.fault_segments = fault_segments;
    dataset.parameters = struct();
    dataset.parameters.window_size = window_size;
    dataset.parameters.overlap_ratio = overlap_ratio;
    dataset.parameters.hop_size = hop_size;
    dataset.parameters.quality_thresholds = struct();
    dataset.parameters.quality_thresholds.rms_min = rms_min;
    dataset.parameters.quality_thresholds.rms_max = rms_max;
    dataset.parameters.quality_thresholds.peak_factor_max = peak_factor_max;
    dataset.parameters.quality_thresholds.kurtosis_max = kurtosis_max;
    dataset.processing_info = struct();
    dataset.processing_info.total_files = total_files;
    dataset.processing_info.processed_files = processed_files;
    dataset.processing_info.total_segments = segment_count;
    dataset.processing_info.good_segments = sum(quality_flags);

    save('task1_segmented_dataset_corrected_v2.mat', 'dataset', '-v7.3');
    fprintf('数据已保存到 task1_segmented_dataset_corrected_v2.mat\n');

    % 10. 生成统计报告
    fprintf('\n8. 生成统计报告...\n');
    fid = fopen('task1_sliding_window_corrected_report.txt', 'w');

    fprintf(fid, 'Task 1: 修正的滑动窗口分割报告\n');
    fprintf(fid, '================================\n\n');

    fprintf(fid, '参数设置:\n');
    fprintf(fid, '- 窗口大小: %d 点\n', window_size);
    fprintf(fid, '- 重叠率: %.1f%%\n', overlap_ratio*100);
    fprintf(fid, '- 步长: %d 点\n\n', hop_size);

    fprintf(fid, '处理结果:\n');
    fprintf(fid, '- 原始文件数: %d\n', total_files);
    fprintf(fid, '- 成功处理文件数: %d\n', processed_files);
    fprintf(fid, '- 总分段数: %d\n', segment_count);
    fprintf(fid, '- 合格分段数: %d (%.1f%%)\n\n', sum(quality_flags), ...
            sum(quality_flags)/segment_count*100);

    fprintf(fid, '各故障类型统计:\n');
    for ft = fieldnames(fault_stats)'
        ft_name = ft{1};
        total_segs = fault_stats.(ft_name).total;
        good_segs = fault_stats.(ft_name).good;
        if total_segs > 0
        fprintf(fid, '%s: 总分段 %d, 合格 %d (%.1f%%)\n', ft_name, ...
                total_segs, good_segs, good_segs/total_segs*100);
    else
        fprintf(fid, '%s: 总分段 %d, 合格 %d\n', ft_name, ...
                total_segs, good_segs);
    end
end

    fclose(fid);
    fprintf('报告已保存到 task1_sliding_window_corrected_report.txt\n');

    % 11. 可视化
    fprintf('\n9. 生成可视化...\n');
    figure('Position', [100, 100, 1200, 600]);

    % 子图1: 各故障类型分段数量
    subplot(1, 2, 1);
    fault_types = {'OR', 'IR', 'B', 'N'};
    counts = zeros(4, 1);
    for i = 1:4
        counts(i) = fault_stats.(fault_types{i}).good;
    end
    bar(counts);
    set(gca, 'XTickLabel', fault_types);
    xlabel('故障类型');
    ylabel('合格分段数');
    title('各故障类型合格分段数量');
    grid on;

    % 添加数值标签
    for i = 1:4
        text(i, counts(i)+10, num2str(counts(i)), ...
             'HorizontalAlignment', 'center', 'VerticalAlignment', 'bottom');
    end

    % 子图2: 分段长度分布
    subplot(1, 2, 2);
    seg_lengths = [];
    for i = 1:segment_count
        seg_lengths = [seg_lengths; length(all_segments{i, 1})];
    end
    histogram(seg_lengths, 20);
    xlabel('分段长度（采样点）');
    ylabel('频数');
    title('分段长度分布');
    grid on;

    sgtitle('修正的滑动窗口分割结果', 'FontSize', 14, 'FontWeight', 'bold');
    saveas(gcf, 'task1_sliding_window_corrected_results.png');

    fprintf('可视化已保存到 task1_sliding_window_corrected_results.png\n');

else
    fprintf('错误: 没有生成任何分段！\n');
end

fprintf('\n=== 修正的滑动窗口分割完成！===\n');
fprintf('\n总结:\n');
fprintf('================================\n');
fprintf('使用修正的参数:\n');
fprintf('- 窗口大小: %d (原:4096)\n', window_size);
fprintf('- 重叠率: %.1f%% (原:50%%)\n', overlap_ratio*100);
fprintf('- 步长: %d (原:2048)\n', hop_size);
fprintf('\n这样可以包含所有文件的分段，特别是4个正常文件。\n');