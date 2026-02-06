%% 任务1 - 完整数据预处理与可视化
% 读取所有.mat文件，分析信号特征，绘制频率分布图

clc; clear; close all;

fprintf('=== 任务1 - 完整数据预处理与可视化 ===\n');

% 1. 加载文件路径
fprintf('1. 加载文件路径...\n');
if exist('file_path.txt', 'file')
    file_list = fileread('file_path.txt');
    file_paths = strsplit(file_list, '\n');

    % 过滤有效路径
    valid_paths = {};
    for i = 1:length(file_paths)
        path = strtrim(file_paths{i});
        if ~isempty(path) && contains(path, 'source_region_dataset')
            valid_paths{end+1} = path;
        end
    end

    fprintf('找到 %d 个有效文件路径\n', length(valid_paths));
else
    error('file_path.txt 不存在！');
end

% 2. 初始化数据结构
fprintf('\n2. 初始化数据结构...\n');
all_data = struct();  % 存储所有数据
file_info = cell(length(valid_paths), 12);  % 使用cell数组
error_files = {};
processed_count = 0;

% 定义表头
headers = {'FilePath', 'FileName', 'FaultType', 'FaultSize', 'Load', ...
           'SamplingFreq', 'SignalLength', 'DataType', 'Mean', 'Std', 'RMS', 'PeakFreq'};

% 3. 遍历所有文件
fprintf('\n3. 加载和解析数据文件...\n');
total_files = length(valid_paths);

% 预分配信号数据存储
signal_samples = cell(total_files, 1);  % 存储每个文件的信号样本（用于频谱分析）

for i = 1:total_files
    % 显示进度
    if mod(i, 20) == 0
        fprintf('处理进度: %d/%d\n', i, total_files);
    end

    full_path = fullfile(pwd, valid_paths{i});

    % 检查文件是否存在
    if exist(full_path, 'file') ~= 2
        error_files{end+1} = sprintf('%s: 文件不存在', valid_paths{i});
        continue;
    end

    try
        % 加载数据
        data = load(full_path);

        % 获取变量名
        vars = fieldnames(data);
        if isempty(vars)
            error_files{end+1} = sprintf('%s: 文件为空', valid_paths{i});
            continue;
        end

        % 获取信号数据
        signal_data = [];
        var_used = '';
        for j = 1:length(vars)
            if isnumeric(data.(vars{j}))
                signal_data = data.(vars{j});
                var_used = vars{j};
                break;
            end
        end

        if isempty(signal_data)
            error_files{end+1} = sprintf('%s: 无有效数据', valid_paths{i});
            continue;
        end

        % 确保是列向量
        if size(signal_data, 2) > size(signal_data, 1)
            signal_data = signal_data';
        end

        % 存储信号样本（取前4096个点用于频谱分析）
        if length(signal_data) >= 4096
            signal_samples{i} = signal_data(1:4096);
        else
            signal_samples{i} = signal_data;
        end

        % 解析文件路径信息
        path_parts = strsplit(valid_paths{i}, filesep);
        filename = path_parts{end};

        % 填充文件信息
        file_info{i, 1} = valid_paths{i};  % FilePath
        file_info{i, 2} = filename;         % FileName

        % 解析文件名获取故障信息
        filename_lower = lower(filename);

        % 故障类型
        if contains(filename_lower, 'or')
            file_info{i, 3} = 'OR';  % 外圈故障
        elseif contains(filename_lower, 'ir')
            file_info{i, 3} = 'IR';  % 内圈故障
        elseif contains(filename_lower, 'b') && ~contains(filename_lower, 'normal')
            file_info{i, 3} = 'B';   % 滚珠故障
        elseif contains(filename_lower, 'normal') || contains(filename_lower, 'n_')
            file_info{i, 3} = 'N';   % 正常
        else
            file_info{i, 3} = 'Unknown';
        end

        % 故障尺寸
        if contains(filename_lower, '007')
            file_info{i, 4} = '0.007';
        elseif contains(filename_lower, '014')
            file_info{i, 4} = '0.014';
        elseif contains(filename_lower, '021')
            file_info{i, 4} = '0.021';
        elseif contains(filename_lower, '028')
            file_info{i, 4} = '0.028';
        else
            file_info{i, 4} = 'Unknown';
        end

        % 载荷和采样频率
        if contains(valid_paths{i}, '12kHz')
            file_info{i, 5} = '12kHz';
            file_info{i, 6} = 12000;
        else
            file_info{i, 5} = '48kHz';
            file_info{i, 6} = 48000;  % 默认值
        end

        % 信号信息
        signal_double = double(signal_data(:));
        file_info{i, 7} = length(signal_double);  % SignalLength
        file_info{i, 8} = class(signal_data);    % DataType

        % 统计特征
        file_info{i, 9} = mean(signal_double);    % Mean
        file_info{i, 10} = std(signal_double);    % Std
        file_info{i, 11} = rms(signal_double);    % RMS

        % 计算峰值频率
        fs = file_info{i, 6};
        if fs > 0 && length(signal_double) > 100
            % 计算FFT
            n = min(2^nextpow2(length(signal_double)), 4096);
            fft_data = fft(signal_double(1:n));
            p2 = abs(fft_data/n);
            p1 = p2(1:n/2+1);
            p1(2:end-1) = 2*p1(2:end-1);
            f = fs*(0:(n/2))/n;

            % 找到峰值频率
            [max_p, max_idx] = max(p1);
            file_info{i, 12} = f(max_idx);  % PeakFreq
        else
            file_info{i, 12} = 0;
        end

        processed_count = processed_count + 1;

        % 调试信息（仅显示前3个文件）
        if i <= 3
            fprintf('\n文件 %d 示例:\n', i);
            fprintf('  文件名: %s\n', filename);
            fprintf('  故障类型: %s\n', file_info{i, 3});
            fprintf('  采样频率: %d Hz\n', file_info{i, 6});
            fprintf('  信号长度: %d\n', file_info{i, 7});
            fprintf('  RMS值: %.4f\n', file_info{i, 11});
            fprintf('  峰值频率: %.1f Hz\n', file_info{i, 12});
        end

    catch ME
        error_files{end+1} = sprintf('%s: %s', valid_paths{i}, ME.message);
        continue;
    end
end

fprintf('\n数据加载完成!\n');
fprintf('成功处理文件: %d/%d\n', processed_count, total_files);
fprintf('错误文件数: %d\n', length(error_files));

% 4. 创建表格
fprintf('\n4. 创建数据表格...\n');
% 移除空行
valid_rows = ~cellfun('isempty', file_info(:,1));
file_info = file_info(valid_rows, :);

% 创建table
file_table = array2table(file_info, 'VariableNames', headers);

% 确保数值列是数值类型
file_table.SamplingFreq = cell2mat(file_table.SamplingFreq);
file_table.SignalLength = cell2mat(file_table.SignalLength);
file_table.Mean = cell2mat(file_table.Mean);
file_table.Std = cell2mat(file_table.Std);
file_table.RMS = cell2mat(file_table.RMS);
file_table.PeakFreq = cell2mat(file_table.PeakFreq);

% 5. 数据统计分析
fprintf('\n5. 数据统计分析...\n');

% 按故障类型分类
fault_types = unique(file_table.FaultType);
fprintf('\n故障类型分布:\n');
for i = 1:length(fault_types)
    ft = fault_types{i};
    count = sum(strcmp(file_table.FaultType, ft));
    fprintf('  %s: %d (%.1f%%)\n', ft, count, count/height(file_table)*100);
end

% 按采样频率分类
freqs = unique(file_table.SamplingFreq);
fprintf('\n采样频率分布:\n');
for i = 1:length(freqs)
    f = freqs(i);
    count = sum(file_table.SamplingFreq == f);
    fprintf('  %d Hz: %d (%.1f%%)\n', f, count, count/height(file_table)*100);
end

% 6. 绘制频率分布图
fprintf('\n6. 绘制频率分布图...\n');

% 创建大图窗
figure('Position', [50, 50, 1400, 900]);

% 子图1：故障类型分布饼图
subplot(2, 3, 1);
fault_counts = zeros(length(fault_types), 1);
for i = 1:length(fault_types)
    fault_counts(i) = sum(strcmp(file_table.FaultType, fault_types{i}));
end
pie(fault_counts, fault_types);
title('故障类型分布', 'FontSize', 12);
legend('Location', 'best');

% 子图2：采样频率分布
subplot(2, 3, 2);
freq_counts = zeros(length(freqs), 1);
for i = 1:length(freqs)
    freq_counts(i) = sum(file_table.SamplingFreq == freqs(i));
end
bar(freqs, freq_counts);
title('采样频率分布', 'FontSize', 12);
xlabel('采样频率 (Hz)', 'FontSize', 10);
ylabel('文件数', 'FontSize', 10);
grid on;

% 子图3：信号长度分布直方图
subplot(2, 3, 3);
signal_lengths = file_table.SignalLength;
histogram(signal_lengths, 20);
title('信号长度分布', 'FontSize', 12);
xlabel('信号长度（点数）', 'FontSize', 10);
ylabel('文件数', 'FontSize', 10);
grid on;

% 子图4：RMS值分布（对数）
subplot(2, 3, 4);
rms_values = file_table.RMS;
histogram(log10(rms_values), 20);
title('RMS值分布（对数刻度）', 'FontSize', 12);
xlabel('log10(RMS)', 'FontSize', 10);
ylabel('文件数', 'FontSize', 10);
grid on;

% 子图5：峰值频率分布
subplot(2, 3, 5);
peak_freqs = file_table.PeakFreq;
% 过滤掉无效的频率值
valid_freqs = peak_freqs(peak_freqs > 0 & peak_freqs < 6000);
histogram(valid_freqs, 30);
title('峰值频率分布', 'FontSize', 12);
xlabel('频率 (Hz)', 'FontSize', 10);
ylabel('文件数', 'FontSize', 10);
grid on;

% 子图6：故障类型vs采样频率
subplot(2, 3, 6);
hold on;
colors = lines(length(fault_types));
for i = 1:length(fault_types)
    ft = fault_types{i};
    ft_data = file_table(strcmp(file_table.FaultType, ft), :);
    scatter(ft_data.SamplingFreq, ones(height(ft_data), 1)*i, 50, colors(i,:), 'filled');
end
set(gca, 'YTick', 1:length(fault_types), 'YTickLabel', fault_types);
title('故障类型与采样频率关系', 'FontSize', 12);
xlabel('采样频率 (Hz)', 'FontSize', 10);
ylabel('故障类型', 'FontSize', 10);
grid on;

% 调整子图间距
sgtitle('高速列车轴承故障数据预处理结果', 'FontSize', 16, 'FontWeight', 'bold');
set(gcf, 'Color', 'white');

% 保存图像
saveas(gcf, 'task1_preprocessing_visualization.png');
saveas(gcf, 'task1_preprocessing_visualization.fig');
fprintf('可视化图表已保存\n');

% 7. 绘制信号示例和频谱图
fprintf('\n7. 绘制信号示例和频谱图...\n');

% 为每种故障类型选择一个示例文件
figure('Position', [50, 50, 1200, 800]);
plot_count = 1;

% 获取源域故障类型（排除Unknown）
source_fault_types = fault_types(~ismember(fault_types, {'Unknown'}));

for i = 1:length(source_fault_types)
    ft = source_fault_types{i};

    % 找到该类型的第一个文件
    ft_indices = find(strcmp(file_table.FaultType, ft));
    if ~isempty(ft_indices)
        example_idx = ft_indices(1);
        example_signal = signal_samples{example_idx};
        fs = file_table{example_idx, 'SamplingFreq'};

        % 时域信号
        subplot(length(source_fault_types), 2, plot_count);
        t = (0:length(example_signal)-1)/fs;
        plot(t, example_signal);
        title(sprintf('%s - 时域信号', ft), 'FontSize', 11);
        xlabel('时间 (s)', 'FontSize', 9);
        ylabel('幅值', 'FontSize', 9);
        grid on;

        % 频谱
        subplot(length(source_fault_types), 2, plot_count+1);
        n = length(example_signal);
        fft_data = fft(example_signal);
        p2 = abs(fft_data/n);
        p1 = p2(1:n/2+1);
        p1(2:end-1) = 2*p1(2:end-1);
        f = fs*(0:(n/2))/n;

        semilogy(f, p1);
        title(sprintf('%s - 频谱', ft), 'FontSize', 11);
        xlabel('频率 (Hz)', 'FontSize', 9);
        ylabel('幅值', 'FontSize', 9);
        grid on;
        xlim([0, min(5000, fs/2)]);

        plot_count = plot_count + 2;
    end
end

sgtitle('各故障类型信号示例及其频谱', 'FontSize', 14, 'FontWeight', 'bold');
set(gcf, 'Color', 'white');

% 保存图像
saveas(gcf, 'task1_signal_examples.png');
saveas(gcf, 'task1_signal_examples.fig');
fprintf('信号示例图已保存\n');

% 8. 保存预处理结果
fprintf('\n8. 保存预处理结果...\n');

% 保存数据表格
writetable(file_table, 'task1_complete_preprocessing.csv');
save('task1_complete_preprocessing.mat', 'file_table', 'signal_samples', 'error_files');

% 生成详细报告
fid = fopen('task1_complete_preprocessing_report.txt', 'w', 'n', 'UTF-8');
fprintf(fid, '任务1 - 完整数据预处理报告\n');
fprintf(fid, '================================\n\n');

fprintf(fid, '总体统计:\n');
fprintf(fid, '- 总文件数: %d\n', total_files);
fprintf(fid, '- 成功处理: %d\n', processed_count);
fprintf(fid, '- 处理失败: %d\n\n', length(error_files));

fprintf(fid, '故障类型分布:\n');
for i = 1:length(fault_types)
    ft = fault_types{i};
    count = sum(strcmp(file_table.FaultType, ft));
    fprintf(fid, '- %s: %d (%.1f%%)\n', ft, count, count/height(file_table)*100);
end

fprintf(fid, '\n采样频率分布:\n');
for i = 1:length(freqs)
    f = freqs(i);
    count = sum(file_table.SamplingFreq == f);
    fprintf(fid, '- %d Hz: %d (%.1f%%)\n', f, count, count/height(file_table)*100);
end

fprintf(fid, '\n信号统计信息:\n');
fprintf(fid, '- 平均信号长度: %.0f 点\n', mean(file_table.SignalLength));
fprintf(fid, '- 最短信号: %d 点\n', min(file_table.SignalLength));
fprintf(fid, '- 最长信号: %d 点\n', max(file_table.SignalLength));
fprintf(fid, '- 平均RMS值: %.4f\n', mean(file_table.RMS));
fprintf(fid, '- RMS标准差: %.4f\n', std(file_table.RMS));

if ~isempty(error_files)
    fprintf(fid, '\n错误文件列表:\n');
    for i = 1:min(10, length(error_files))
        fprintf(fid, '%s\n', error_files{i});
    end
    if length(error_files) > 10
        fprintf(fid, '... (还有 %d 个错误)\n', length(error_files) - 10);
    end
end

fclose(fid);
fprintf('详细报告已保存到 task1_complete_preprocessing_report.txt\n');

fprintf('\n=== 预处理完成 ===\n');
fprintf('生成的文件:\n');
fprintf('- task1_complete_preprocessing.csv/mat: 完整的数据表格\n');
fprintf('- task1_preprocessing_visualization.png/fig: 统计分布图\n');
fprintf('- task1_signal_examples.png/fig: 信号示例图\n');
fprintf('- task1_complete_preprocessing_report.txt: 详细报告\n');