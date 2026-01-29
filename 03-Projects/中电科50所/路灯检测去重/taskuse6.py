import torch
import cv2
import os
from pathlib import Path
import numpy as np
from collections import defaultdict

# 第一部分：图像预处理
def enhance_dark_regions(image):
    """增强暗部区域"""
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    l_enhanced = clahe.apply(l)
    
    enhanced_lab = cv2.merge([l_enhanced, a, b])
    enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
    
    return enhanced_bgr

# 第二部分：多目标跟踪器核心类
class AdvancedStableTracker:
    """增强版稳定性跟踪器（已修复ID重复bug + 暗光检测优化）"""
    def __init__(self, distance_threshold=50, iou_threshold=0.2, 
                 feature_threshold=0.7, max_disappeared=60,
                 min_hits=10, min_frames=20,
                 min_avg_confidence=0.5,
                 max_y_position=0.6):
        
        self.next_id = 0
        self.objects = {}
        self.disappeared = {}
        self.distance_threshold = distance_threshold
        self.iou_threshold = iou_threshold
        self.feature_threshold = feature_threshold
        self.max_disappeared = max_disappeared
        
        self.min_hits = min_hits
        self.min_frames = min_frames
        self.min_avg_confidence = min_avg_confidence
        self.max_y_position = max_y_position
        
        self.object_features = {}
        self.all_tracked_ids = set()
        self.id_class_history = {}
        
        self.hit_count = {}
        self.first_frame = {}
        self.last_frame = {}
        self.stable_ids = set()
        
        self.confidence_history = {}
        self.position_history = {}
        
        self.final_class = {}
        self.class_history = {}
        
        self.current_frame = 0
        self.image_height = 1080
        
        self.active_ids_in_frame = set()
    # 特征提取模块
    def extract_feature(self, image, bbox):
        """提取视觉特征"""
        x1, y1, x2, y2 = map(int, bbox[:4])
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(image.shape[1], x2), min(image.shape[0], y2)
        
        if x2 <= x1 or y2 <= y1:
            return None
        
        roi = image[y1:y2, x1:x2]
        if roi.size == 0:
            return None
        
        hist_features = []
        for i in range(3):
            hist = cv2.calcHist([roi], [i], None, [32], [0, 256])
            hist = cv2.normalize(hist, hist).flatten()
            hist_features.extend(hist)
        
        feature = np.array(hist_features, dtype=np.float32)
        feature = feature / (np.linalg.norm(feature) + 1e-6)
        
        return feature
    # 几何相似度计算模块
    def calculate_feature_similarity(self, feat1, feat2):
        if feat1 is None or feat2 is None:
            return 0.0
        return np.dot(feat1, feat2)
    
    def calculate_center_distance(self, box1, box2):
        x1_min, y1_min, x1_max, y1_max = box1
        x2_min, y2_min, x2_max, y2_max = box2
        
        cx1 = (x1_min + x1_max) / 2
        cy1 = (y1_min + y1_max) / 2
        cx2 = (x2_min + x2_max) / 2
        cy2 = (y2_min + y2_max) / 2
        
        return np.sqrt((cx1 - cx2)**2 + (cy1 - cy2)**2)
    
    def calculate_iou(self, box1, box2):
        x1_min, y1_min, x1_max, y1_max = box1
        x2_min, y2_min, x2_max, y2_max = box2
        
        inter_x_min = max(x1_min, x2_min)
        inter_y_min = max(y1_min, y2_min)
        inter_x_max = min(x1_max, x2_max)
        inter_y_max = min(y1_max, y2_max)
        
        if inter_x_max < inter_x_min or inter_y_max < inter_y_min:
            return 0.0
        
        inter_area = (inter_x_max - inter_x_min) * (inter_y_max - inter_y_min)
        box1_area = (x1_max - x1_min) * (y1_max - y1_min)
        box2_area = (x2_max - x2_min) * (y2_max - y2_min)
        union_area = box1_area + box2_area - inter_area
        
        return inter_area / union_area if union_area > 0 else 0.0
    
    def calculate_similarity(self, box1, box2):
        distance = self.calculate_center_distance(box1, box2)
        iou = self.calculate_iou(box1, box2)
        
        if distance < self.distance_threshold or iou > self.iou_threshold:
            distance_score = max(0, 1 - distance / 200)
            return 0.6 * iou + 0.4 * distance_score
        return 0.0
    # ReID重链接模块
    def find_relink_candidate(self, new_feature, new_class, excluded_ids=None):
        if excluded_ids is None:
            excluded_ids = set()
        
        best_match_id = None
        best_similarity = 0
        
        for obj_id in list(self.disappeared.keys()):
            if obj_id in excluded_ids:
                continue
                
            if self.id_class_history.get(obj_id) != new_class:
                continue
            
            if obj_id in self.object_features:
                similarity = self.calculate_feature_similarity(
                    new_feature, 
                    self.object_features[obj_id]
                )
                
                if similarity > best_similarity and similarity > self.feature_threshold:
                    best_similarity = similarity
                    best_match_id = obj_id
        
        return best_match_id, best_similarity
    # 稳定性判断模块 - 四维过滤
    def is_stable(self, obj_id):
        if obj_id not in self.hit_count:
            return False, "未追踪"
        
        hits = self.hit_count[obj_id]
        if hits < self.min_hits:
            return False, f"检测次数不足({hits}<{self.min_hits})"
        
        if obj_id in self.first_frame and obj_id in self.last_frame:
            lifespan = self.last_frame[obj_id] - self.first_frame[obj_id] + 1
        else:
            lifespan = 0
        
        if lifespan < self.min_frames:
            return False, f"存活时间不足({lifespan}<{self.min_frames}帧)"
        
        if obj_id in self.confidence_history:
            avg_conf = np.mean(self.confidence_history[obj_id])
            if avg_conf < self.min_avg_confidence:
                return False, f"置信度过低(avg={avg_conf:.2f}<{self.min_avg_confidence})"
        else:
            return False, "无置信度记录"
        
        if obj_id in self.position_history and len(self.position_history[obj_id]) > 0:
            avg_y_positions = []
            for y1, y2 in self.position_history[obj_id]:
                center_y = (y1 + y2) / 2
                normalized_y = center_y / self.image_height
                avg_y_positions.append(normalized_y)
            
            avg_y = np.mean(avg_y_positions)
            
            if avg_y > self.max_y_position:
                return False, f"位置异常(y={avg_y:.2f}>{self.max_y_position})"
        
        return True, "稳定"
    # 多数投票模块
    def get_most_common_class(self, obj_id):
        if obj_id in self.class_history and len(self.class_history[obj_id]) > 0:
            most_common = max(set(self.class_history[obj_id]), 
                            key=self.class_history[obj_id].count)
            return most_common
        elif obj_id in self.id_class_history:
            return self.id_class_history[obj_id]
        else:
            return 0
    # 主更新逻辑
    def update(self, detections, frame):
        """
        更新跟踪器 - 核心主循环
        
        完整流程：
        1. 帧号递增，清空当前帧活跃ID集合
        2. 特殊情况处理：无检测时更新消失计数器
        3. 特征提取：为每个检测提取颜色直方图特征
        4. 初始化：第一帧直接分配新ID
        5. 匹配阶段：
           a. 计算相似度矩阵
           b. 匈牙利算法求解最优匹配
           c. 更新匹配成功的对象
        6. ReID重链接：为未匹配的检测尝试恢复旧ID
        7. 新目标：为仍未匹配的检测分配新ID
        8. 消失处理：更新消失计数器，删除超时对象
        9. ID唯一性校验：检测并去除重复ID
        
        参数：
            detections: 当前帧的检测结果列表
                       每个元素格式：[x1, y1, x2, y2, conf, class]
            frame: 当前帧图像（用于特征提取）
        
        返回：
            tracked_detections: 跟踪结果列表
                               每个元素格式：[x1, y1, x2, y2, conf, class, track_id]
        
        参考算法：
            - SORT (Bewley et al., 2016)
            - DeepSORT (Wojke et al., 2017)
            - ByteTrack (Zhang et al., 2022)
"""
        # ========== 阶段0: 帧管理 ==========
        self.current_frame += 1# 帧号递增
        self.image_height = frame.shape[0]# 更新图像高度
        self.active_ids_in_frame = set()# 清空当前帧活跃ID（防重复）
        
        # ========== 阶段1: 无检测的特殊处理 ==========
        if len(detections) == 0:
            # 更新所有对象的消失计数器
            for obj_id in list(self.disappeared.keys()):
                self.disappeared[obj_id] += 1
                # 如果消失时间超过阈值，删除该对象
                if self.disappeared[obj_id] > self.max_disappeared:
                    # 评估是否稳定
                    is_stable, reason = self.is_stable(obj_id)
                    if is_stable:
                        self.stable_ids.add(obj_id)
                        # 多数投票确定最终类别
                        self.final_class[obj_id] = self.get_most_common_class(obj_id)
                    else:
                        if obj_id in self.stable_ids:
                            self.stable_ids.remove(obj_id)
                    # 清理数据
                    del self.objects[obj_id]
                    del self.disappeared[obj_id]
                    if obj_id in self.object_features:
                        del self.object_features[obj_id]
            return []# 无检测，返回空列表
        
        # ========== 阶段2: 解析检测结果 ==========
        current_boxes = [det[:4] for det in detections]# 边界框列表
        current_classes = [int(det[5]) for det in detections]# 类别列表
        current_confidences = [det[4] for det in detections]# 置信度列表
        
        # ========== 阶段3: 特征提取 ==========
        current_features = []
        for det in detections:
            feat = self.extract_feature(frame, det[:4])
            current_features.append(feat)
        # ========== 阶段4: 初始化（第一帧） ==========
        if len(self.objects) == 0:
            tracked_detections = []
            # 为每个检测分配新ID
            for det, cls, feat, conf in zip(detections, current_classes, current_features, current_confidences):
                # 初始化所有数据结构
                obj_id = self.next_id
                self.objects[obj_id] = det[:4]
                self.disappeared[obj_id] = 0
                self.all_tracked_ids.add(obj_id)
                self.id_class_history[obj_id] = cls
                
                self.hit_count[obj_id] = 1
                self.first_frame[obj_id] = self.current_frame
                self.last_frame[obj_id] = self.current_frame
                
                self.confidence_history[obj_id] = [conf]
                self.position_history[obj_id] = [(det[1], det[3])]
                self.class_history[obj_id] = [cls]
                
                if feat is not None:
                    self.object_features[obj_id] = feat
                
                self.active_ids_in_frame.add(obj_id)
                self.next_id += 1
                tracked_detections.append((*det, obj_id))
            return tracked_detections
        # ========== 阶段5: 匹配阶段 ==========
        # 5.1 准备数据
        object_ids = list(self.objects.keys())
        object_boxes = [self.objects[obj_id] for obj_id in object_ids]
        # 5.2 计算相似度矩阵
        # 行：旧对象，列：新检测
        similarity_matrix = np.zeros((len(object_boxes), len(current_boxes)))
        for i, obj_box in enumerate(object_boxes):
            for j, curr_box in enumerate(current_boxes):
                similarity_matrix[i, j] = self.calculate_similarity(obj_box, curr_box)
        # 5.3 匈牙利算法求解最优匹配
        try:
            from scipy.optimize import linear_sum_assignment
            # 转换为代价矩阵（相似度越大，代价越小）
            cost_matrix = 1 - similarity_matrix
            cost_matrix[similarity_matrix < 0.1] = 1e6# 低相似度设为极大值
            
            # 匈牙利算法求解
            row_indices, col_indices = linear_sum_assignment(cost_matrix)
            
            # 提取有效匹配
            matched_indices = []
            used_detections = set()
            used_objects = set()
            
            for i, j in zip(row_indices, col_indices):
                if cost_matrix[i, j] < 1e6:
                    matched_indices.append((i, j))
                    used_objects.add(i)
                    used_detections.add(j)
        except ImportError:
            # 降级到贪心算法
            matched_indices = []
            used_detections = set()
            used_objects = set()
            
            while True:
                max_sim = 0
                max_i, max_j = -1, -1
                
                for i in range(len(object_ids)):
                    if i in used_objects:
                        continue
                    for j in range(len(current_boxes)):
                        if j in used_detections:
                            continue
                        if similarity_matrix[i, j] > max_sim and similarity_matrix[i, j] > 0.1:
                            max_sim = similarity_matrix[i, j]
                            max_i, max_j = i, j
                
                if max_i == -1:
                    break
                
                matched_indices.append((max_i, max_j))
                used_objects.add(max_i)
                used_detections.add(max_j)
        # 5.4 更新匹配成功的对象
        tracked_detections = []
        for i, j in matched_indices:
            obj_id = object_ids[i]
            
            # ID唯一性检查（第一重）
            if obj_id in self.active_ids_in_frame:
                continue# 跳过已使用的ID
            
            # 更新对象状态
            self.objects[obj_id] = current_boxes[j]
            self.disappeared[obj_id] = 0# 重置消失计数器
            self.id_class_history[obj_id] = current_classes[j]
            
            # 更新统计信息
            self.hit_count[obj_id] = self.hit_count.get(obj_id, 0) + 1
            self.last_frame[obj_id] = self.current_frame
            
            # 更新历史记录
            if obj_id not in self.confidence_history:
                self.confidence_history[obj_id] = []
            self.confidence_history[obj_id].append(current_confidences[j])
            
            if obj_id not in self.position_history:
                self.position_history[obj_id] = []
            y1, y2 = current_boxes[j][1], current_boxes[j][3]
            self.position_history[obj_id].append((y1, y2))
            
            if obj_id not in self.class_history:
                self.class_history[obj_id] = []
            self.class_history[obj_id].append(current_classes[j])
            
            # 实时评估稳定性
            is_stable, reason = self.is_stable(obj_id)
            if is_stable:
                self.stable_ids.add(obj_id)
                self.final_class[obj_id] = self.get_most_common_class(obj_id)
            else:
                if obj_id in self.stable_ids:
                    self.stable_ids.discard(obj_id)
            
            if current_features[j] is not None:
                self.object_features[obj_id] = current_features[j]
            
            self.active_ids_in_frame.add(obj_id)
            tracked_detections.append((*detections[j], obj_id))
        # ========== 阶段6: ReID重链接 ==========
        for j in range(len(current_boxes)):
            if j not in used_detections:# 未匹配的检测
                # 尝试重链接到消失的对象
                relink_id, similarity = self.find_relink_candidate(
                    current_features[j], 
                    current_classes[j],
                    excluded_ids=self.active_ids_in_frame
                )
                # ID唯一性检查（第二重）
                if relink_id is not None:
                    if relink_id in self.active_ids_in_frame:
                        relink_id = None# 强制创建新ID
                
                if relink_id is not None:
                    # 重链接成功，恢复旧ID
                    self.objects[relink_id] = current_boxes[j]
                    self.disappeared[relink_id] = 0
                    self.id_class_history[relink_id] = current_classes[j]
                    
                    self.hit_count[relink_id] = self.hit_count.get(relink_id, 0) + 1
                    self.last_frame[relink_id] = self.current_frame
                    
                    self.confidence_history[relink_id].append(current_confidences[j])
                    y1, y2 = current_boxes[j][1], current_boxes[j][3]
                    self.position_history[relink_id].append((y1, y2))
                    self.class_history[relink_id].append(current_classes[j])
                    
                    if current_features[j] is not None:
                        self.object_features[relink_id] = current_features[j]
                    
                    self.active_ids_in_frame.add(relink_id)
                    tracked_detections.append((*detections[j], relink_id))
                else:
                    # ========== 阶段7: 新目标 ==========
                    # ReID失败，分配新ID
                    obj_id = self.next_id
                    self.objects[obj_id] = current_boxes[j]
                    self.disappeared[obj_id] = 0
                    self.all_tracked_ids.add(obj_id)
                    self.id_class_history[obj_id] = current_classes[j]
                    
                    self.hit_count[obj_id] = 1
                    self.first_frame[obj_id] = self.current_frame
                    self.last_frame[obj_id] = self.current_frame
                    
                    self.confidence_history[obj_id] = [current_confidences[j]]
                    y1, y2 = current_boxes[j][1], current_boxes[j][3]
                    self.position_history[obj_id] = [(y1, y2)]
                    self.class_history[obj_id] = [current_classes[j]]
                    
                    if current_features[j] is not None:
                        self.object_features[obj_id] = current_features[j]
                    
                    self.active_ids_in_frame.add(obj_id)
                    self.next_id += 1
                    tracked_detections.append((*detections[j], obj_id))
        # ========== 阶段8: 处理消失的对象 ==========
        for i in range(len(object_ids)):
            if i not in used_objects:
                obj_id = object_ids[i]
                self.disappeared[obj_id] += 1
                # 如果消失时间超过阈值
                if self.disappeared[obj_id] > self.max_disappeared:
                    is_stable, reason = self.is_stable(obj_id)
                    if is_stable:
                        self.stable_ids.add(obj_id)
                        self.final_class[obj_id] = self.get_most_common_class(obj_id)
                    else:
                        if obj_id in self.stable_ids:
                            self.stable_ids.remove(obj_id)
                    # 删除对象
                    del self.objects[obj_id]
                    del self.disappeared[obj_id]
                    if obj_id in self.object_features:
                        del self.object_features[obj_id]
        # ========== 阶段9: ID唯一性最终校验（第三重）==========
        id_counts = defaultdict(int)
        for det in tracked_detections:
            track_id = det[6]
            id_counts[track_id] += 1
        
        duplicate_ids = [id for id, count in id_counts.items() if count > 1]
        if duplicate_ids:
            # 发现重复ID，去重（保留第一个）
            seen_ids = set()
            filtered_detections = []
            for det in tracked_detections:
                if det[6] not in seen_ids:
                    seen_ids.add(det[6])
                    filtered_detections.append(det)
            tracked_detections = filtered_detections
        
        return tracked_detections
    # 统计信息模块
    def get_statistics(self, filter_unstable=True):
        """
        获取统计信息
        
        参数：
            filter_unstable: 是否过滤不稳定对象
                           - True: 只统计稳定对象
                           - False: 统计所有对象
        
        返回：
            class_counts: 字典 {class: count} 每个类别的数量
            stable_count: 稳定对象总数
            unstable_count: 不稳定对象数量
        """
        if filter_unstable:
            valid_ids = self.stable_ids
        else:
            valid_ids = self.all_tracked_ids
        
        class_counts = defaultdict(int)
        unstable_count = 0
        
        for obj_id in self.all_tracked_ids:
            if obj_id in valid_ids:
                if obj_id in self.final_class:
                    cls = self.final_class[obj_id]
                    class_counts[cls] += 1
                elif obj_id in self.id_class_history:
                    cls = self.id_class_history[obj_id]
                    class_counts[cls] += 1
            else:
                unstable_count += 1
        
        return class_counts, len(valid_ids), unstable_count

# 第三部分：视频处理主函数
def detect_with_advanced_filter(video_path, model_path='best.pt', output_path=None,
                               distance_threshold=50, iou_threshold=0.2,
                               feature_threshold=0.65, conf_threshold=0.5,  # ⭐ 默认降到0.5
                               min_hits=3, min_frames=5,  # ⭐ 降低要求
                               min_avg_confidence=0.3, max_y_position=0.7,  # ⭐ 放宽限制
                               use_enhancement=True):  # ⭐ 新增
    """
            带稳定性过滤和多数投票的视频检测主函数
            
            完整流程：
            1. 加载YOLOv5模型
            2. 初始化视频读写
            3. 创建跟踪器
            4. 逐帧处理：
            a. CLAHE图像增强（可选）
            b. YOLOv5目标检测
            c. 跟踪器更新
            d. 可视化绘制
            e. 写入输出视频
            5. 输出最终统计
            
            参数说明：
            ----------
            视频参数：
                video_path: 输入视频路径
                model_path: YOLOv5模型权重路径
                output_path: 输出视频路径（默认自动生成）
            
            匹配参数：
                distance_threshold: 中心距离阈值（像素）
                iou_threshold: IoU阈值
                feature_threshold: 特征相似度阈值
            
            检测参数：
                conf_threshold: YOLOv5置信度阈值
            
            稳定性过滤参数：
                min_hits: 最少检测次数
                min_frames: 最少存活帧数
                min_avg_confidence: 最低平均置信度
                max_y_position: 最大Y位置
            
            增强参数：
                use_enhancement: 是否启用CLAHE图像增强
            
            返回：
                无（直接保存视频文件）
"""
    # ========== 阶段1: 初始化 ==========    
    if output_path is None:
        video_name = Path(video_path).stem
        output_path = f"filtered_v6{video_name}.mp4"
    
    print(f"加载模型: {model_path}")
    model = torch.hub.load('ultralytics/yolov5', 'custom', path=model_path)
    # 打开视频
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"无法打开视频: {video_path}")
        return
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"视频信息: {width}x{height}, {fps:.2f}fps, {total_frames}帧")
    print(f"\n⭐ 优化配置（暗光检测增强）:")
    print(f"  - 置信度阈值: {conf_threshold} (降低以检测暗光)")
    print(f"  - 最少检测{min_hits}次")
    print(f"  - 最少存活{min_frames}帧")
    print(f"  - 平均置信度≥{min_avg_confidence}")
    print(f"  - Y位置≤{max_y_position}")
    print(f"  - 图像增强: {'开启' if use_enhancement else '关闭'}\n")
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    tracker = AdvancedStableTracker(
        distance_threshold=distance_threshold,
        iou_threshold=iou_threshold,
        feature_threshold=feature_threshold,
        max_disappeared=60,
        min_hits=min_hits,
        min_frames=min_frames,
        min_avg_confidence=min_avg_confidence,
        max_y_position=max_y_position
    )
    
    frame_count = 0
    print("开始处理...")
    # ========== 阶段2: 主循环 ==========
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # ⭐ 图像增强
        if use_enhancement:
            enhanced_frame = enhance_dark_regions(frame)
            results = model(enhanced_frame)
        else:
            results = model(frame)
        # 步骤2: 获取检测结果
        detections = results.xyxy[0].cpu().numpy()
        # 步骤3: 置信度过滤
        filtered_detections = []
        for det in detections:
            if det[4] > conf_threshold:
                filtered_detections.append(det)
        # 步骤4: 跟踪器更新
        tracked_detections = tracker.update(filtered_detections, frame)
        # 步骤5: 可视化绘制
        for det in tracked_detections:
            x1, y1, x2, y2, conf, cls, track_id = det
            class_id = int(cls)
            # 判断是否稳定
            is_stable = track_id in tracker.stable_ids
            # 根据类别选择颜色
            if class_id == 0:
                base_color = (0, 0, 255)
                status_text = "OFF"
            elif class_id == 1:
                base_color = (0, 255, 0)
                status_text = "ON"
            else:
                base_color = (255, 255, 0)
                status_text = f"C{class_id}"
            # 稳定对象：全彩+粗线；不稳定：半透明+细线
            if is_stable:
                color = base_color
                thickness = 2
                prefix = "✓"
            else:
                color = tuple(int(c * 0.5) for c in base_color)
                thickness = 1
                prefix = ""
            # 绘制边界框
            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, thickness)
            # 构造标签文本
            hits = tracker.hit_count.get(track_id, 0)
            avg_conf = np.mean(tracker.confidence_history.get(track_id, [conf]))
            # 绘制标签背景和文本
            label = f"ID:{track_id} {status_text} ({hits}h,{avg_conf:.2f}c)"
            
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 2)[0]
            cv2.rectangle(frame, (int(x1), int(y1) - label_size[1] - 8),
                        (int(x1) + label_size[0] + 5, int(y1)), color, -1)
            cv2.putText(frame, label, (int(x1), int(y1) - 4),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
        # 步骤6: 绘制统计信息
        stats, stable_count, unstable_count = tracker.get_statistics(filter_unstable=True)
        off_count = stats.get(0, 0)
        on_count = stats.get(1, 0)
        
        info_text = f"Stable: OFF={off_count} ON={on_count} Total={stable_count} (Filtered:{unstable_count})"
        cv2.putText(frame, info_text,
                   (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        cv2.putText(frame, f"Frame: {frame_count}/{total_frames} | Enhancement: {'ON' if use_enhancement else 'OFF'}",
                   (10, height - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        # 步骤7: 写入输出视频
        out.write(frame)
        # 步骤8: 进度打印
        frame_count += 1
        if frame_count % 100 == 0 or frame_count == total_frames:
            progress = frame_count / total_frames * 100
            print(f"进度: {frame_count}/{total_frames} ({progress:.1f}%) | 有效:{stable_count} (OFF:{off_count} ON:{on_count}) 过滤:{unstable_count}")
    # ========== 阶段3: 清理与统计 ==========
    cap.release()
    out.release()
    # 最终统计
    final_stats, stable_count, unstable_count = tracker.get_statistics(filter_unstable=True)
    off_count = final_stats.get(0, 0)
    on_count = final_stats.get(1, 0)
    
    print(f"\n✓ 视频处理完成!")
    print(f"输出文件: {output_path}")
    print(f"\n=== 最终统计 ===")
    print(f"  有效路灯:")
    print(f"    - OFF (灯灭): {off_count} 个")
    print(f"    - ON (灯亮): {on_count} 个")
    print(f"    - 总计: {stable_count} 个")
    print(f"  过滤掉: {unstable_count} 个")
    print(f"  过滤率: {unstable_count/(stable_count+unstable_count)*100:.1f}%")
# 第四部分：命令行交互入口
def main():
    """半自动版本 - 选择视频，参数固定"""
    print("=== 路灯检测跟踪工具 (参数预设版) ===\n")
    
    if not os.path.exists('best.pt'):
        print("错误: 未找到 best.pt 模型文件!")
        return
    
    video_files = list(Path('.').glob('*.mp4'))
    video_files = [f for f in video_files if not f.name.startswith(
        ('detected_', 'tracked_', 'reid_', 'stable_', 'filtered_')
    )]
    
    if not video_files:
        print("没有找到视频文件!")
        return
    
    print("找到的视频文件:")
    for i, vf in enumerate(video_files, 1):
        print(f"  {i}. {vf.name}")
    
    # 选择视频
    choice = input("\n请选择要处理的视频编号 (回车处理所有): ").strip()
    
    # ⭐ 写死的参数
    use_enhancement = True
    conf_threshold = 0.5
    min_hits = 10
    min_frames = 20
    min_avg_confidence = 0.3
    max_y_position = 0.7
    
    print(f"\n使用固定参数:")
    print(f"  图像增强: 开启")
    print(f"  置信度阈值: {conf_threshold}")
    print(f"  检测次数≥{min_hits}, 存活≥{min_frames}帧")
    print(f"  平均置信度≥{min_avg_confidence}, Y≤{max_y_position}\n")
    
    # 处理逻辑
    if choice == "":
        # 回车 → 处理所有
        for video_file in video_files:
            print(f"\n处理: {video_file.name}")
            detect_with_advanced_filter(
                str(video_file),
                conf_threshold=conf_threshold,
                min_hits=min_hits,
                min_frames=min_frames,
                min_avg_confidence=min_avg_confidence,
                max_y_position=max_y_position,
                use_enhancement=use_enhancement
            )

    elif choice.isdigit():
        idx = int(choice) - 1
        if 0 <= idx < len(video_files):
            detect_with_advanced_filter(
                str(video_files[idx]),
                conf_threshold=conf_threshold,
                min_hits=min_hits,
                min_frames=min_frames,
                min_avg_confidence=min_avg_confidence,
                max_y_position=max_y_position,
                use_enhancement=use_enhancement
            )
        else:
            print("无效的视频编号!")
    else:
        print("请输入有效的数字!")


if __name__ == "__main__":
    main()