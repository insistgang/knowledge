%% 任务1 - 步骤2：重采样到32kHz（简化版）
% 将源域数据从48kHz和12kHz重采样到32kHz

clc; clear; close all;

fprintf('=== 任务1 - 步骤2：重采样到32kHz ===\n');

% 1. 加载预处理后的源域数据
fprintf('1. 加载预处理后的源域数据...\n');
if exist('task1_complete_preprocessing.mat', 'file')
    load('task1_complete_preprocessing.mat', 'file_table', 'signal_samples');
    fprintf('成功加载预处理数据，共 %d 个文件\n', height(file_table));
else
    error('请先运行 task1_complete_preprocessing.m 生成预处理数据！');
end

% 2. 设置参数
target_freq = 32000;  % 目标采样频率：32kHz
resampled_signals = cell(height(file_table), 1);
resampling_info = [];

% 3. 重采样处理
fprintf('\n2. 开始重采样处理...\n');
for i = 1:height(file_table)
    % 获取原始信号
    original_signal = signal_samples{i};
    original_freq = file_table.SamplingFreq(i);

    % 计算重采样比例
    if original_freq == target_freq
        resampled_signal = original_signal;
    else
        % 计算上下采样因子
        g = gcd(target_freq, original_freq);
        p = target_freq / g;
        q = original_freq / g;
        resampled_signal = resample(original_signal, p, q);
    end

    % 存储结果
    resampled_signals{i} = resampled_signal;

    % 记录信息
    resampling_info = [resampling_info; ...
        original_freq, target_freq, length(original_signal), length(resampled_signal)];

    % 显示进度
    if mod(i, 20) == 0
        fprintf('处理进度: %d/%d\n', i, height(file_table));
    end
end

% 4. 统计结果
fprintf('\n3. 重采样统计:\n');
fprintf('- 12kHz -> 32kHz: %d 个文件\n', sum(file_table.SamplingFreq == 12000));
fprintf('- 48kHz -> 32kHz: %d 个文件\n', sum(file_table.SamplingFreq == 48000));

% 5. 绘制示例对比图
fprintf('\n4. 绘制重采样对比图...\n');
figure('Position', [100, 100, 1400, 800]);

% 选择示例文件
examples = {};
for ft = {'OR', 'IR', 'B'}
    for freq = [12000, 48000]
        idx = find(strcmp(file_table.FaultType, ft{1}) & file_table.SamplingFreq == freq, 1);
        if ~isempty(idx)
            examples{end+1} = idx;
        end
    end
end

% 绘制前6个示例
for i = 1:min(6, length(examples))
    idx = examples{i};
    orig_sig = signal_samples{idx};
    resamp_sig = resampled_signals{idx};
    orig_freq = file_table.SamplingFreq(idx);

    % 时域对比
    subplot(2, 6, i);
    t_orig = (0:length(orig_sig)-1) / orig_freq;
    plot(t_orig, orig_sig);
    title(sprintf('%s\n%.0fkHz原始', file_table.FaultType{idx}, orig_freq/1000));
    xlabel('时间 (s)');
    ylabel('幅值');
    grid on;
    xlim([0, 0.005]);

    % 频域对比
    subplot(2, 6, i+6);
    % 计算原始频谱
    n = min(2048, length(orig_sig));
    fft_orig = fft(orig_sig(1:n));
    f = orig_freq * (0:n/2) / n;
    p = abs(fft_orig(1:n/2+1)/n);
    semilogy(f, p);
    title(sprintf('%s\n32kHz重采样', file_table.FaultType{idx}));
    xlabel('频率 (Hz)');
    ylabel('幅值');
    grid on;
    xlim([0, 5000]);
end

sgtitle('重采样前后对比', 'FontSize', 14);
saveas(gcf, 'task1_resampling_comparison.png');
fprintf('对比图已保存\n');

% 6. 保存结果
fprintf('\n5. 保存重采样结果...\n');
save('task1_resampled_data.mat', 'file_table', 'resampled_signals', 'resampling_info');
% 创建表格并保存
resamp_table = array2table(resampling_info, 'VariableNames', ...
    {'OriginalFreq', 'TargetFreq', 'OriginalLength', 'ResampledLength'});
writetable(resamp_table, 'task1_resampling_info.csv');

% 生成报告
fid = fopen('task1_resampling_report.txt', 'w');
fprintf(fid, '重采样到32kHz报告\n');
fprintf(fid, '================\n\n');
fprintf(fid, '源域文件数: %d\n', height(file_table));
fprintf(fid, '12kHz -> 32kHz: %d 个文件\n', sum(file_table.SamplingFreq == 12000));
fprintf(fid, '48kHz -> 32kHz: %d 个文件\n', sum(file_table.SamplingFreq == 48000));
fprintf(fid, '\n重采样方法: MATLAB resample函数\n');
fprintf(fid, '技术说明:\n');
fprintf(fid, '- 12kHz -> 32kHz: 上采样 8:3，使用抗镜像滤波器\n');
fprintf(fid, '- 48kHz -> 32kHz: 下采样 2:3，使用抗混叠滤波器\n');
fclose(fid);

fprintf('\n重采样完成！\n');