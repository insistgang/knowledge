# ==========================================
# 签名检测与打码 v5.0
# 改进：排除日期、优化签名筛选
# ==========================================

import cv2
import base64
import numpy as np
import os
from openai import OpenAI

# ========== API 配置 ==========
API_KEY = os.getenv("GLM_API_KEY", "ec06750a1d0447cb8bcfd28879a57bff.4yNBx2M2CBNd6zXu")

client = OpenAI(
    api_key=API_KEY,
    base_url="https://open.bigmodel.cn/api/paas/v4"
)


def encode_image(image_path):
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def glm_check_has_signature(image_path, model="glm-4v-flash"):
    """GLM验证是否有签名"""
    base64_image = encode_image(image_path)
    media_type = "image/png" if image_path.endswith(".png") else "image/jpeg"
    
    prompt = """请分析这张图片：
1. 图片中是否有手写签名？（不包括印刷体和日期）
2. 签名内容是什么？

回答格式：
有签名：是/否
签名内容：xxx"""

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{base64_image}"}},
                    {"type": "text", "text": prompt}
                ]
            }],
            max_tokens=256,
            temperature=0.1
        )
        
        result = response.choices[0].message.content.strip()
        print(f"GLM分析结果:\n{result}\n")
        
        has_signature = "是" in result.split('\n')[0] if result else False
        content = ""
        for line in result.split('\n'):
            if "签名内容" in line:
                content = line.split('：')[-1].strip() if '：' in line else line.split(':')[-1].strip()
                break
        
        return has_signature, content
        
    except Exception as e:
        print(f"GLM调用失败: {e}")
        return False, ""


def find_signature_region(image):
    """
    专门找签名区域，排除日期和印刷体
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    img_h, img_w = image.shape[:2]
    
    # 二值化
    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        15, 10
    )
    
    # 保存原始二值图用于后续分析
    binary_original = binary.copy()
    
    # 形态学连接笔画
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 8))
    connected = cv2.dilate(binary, kernel, iterations=2)
    
    # 找轮廓
    contours, _ = cv2.findContours(connected, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    candidates = []
    
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        
        # 基本尺寸过滤
        if w < 50 or h < 15 or w * h < 1000:
            continue
        if w * h > img_w * img_h * 0.5:
            continue
        
        # 提取ROI进行分析
        roi_binary = binary_original[y:y+h, x:x+w]
        
        # 计算特征
        density = np.sum(roi_binary > 0) / (w * h) if w * h > 0 else 0
        aspect_ratio = w / h
        
        # ========== 关键：排除日期 ==========
        # 日期特征：
        # 1. 位置通常在签名下方
        # 2. 高度较小（通常只有一行）
        # 3. 宽高比适中（不会太宽）
        # 4. 通常包含数字和斜杠，笔画比较规整
        
        is_date_like = False
        
        # 高度较小且宽高比不是特别大，可能是日期
        if h < 40 and aspect_ratio < 10:
            # 检查是否像日期的笔画特征
            # 日期的笔画密度通常比签名高（更规整）
            if density > 0.08 and density < 0.25:
                # 进一步检查：日期通常在下半部分
                relative_y = y / img_h
                if relative_y > 0.5:  # 在图片下半部分
                    is_date_like = True
                    print(f"   [排除] 可能是日期: [{x}, {y}, {x+w}, {y+h}], 位置={relative_y:.2f}")
        
        # ========== 签名特征 ==========
        # 签名特征：
        # 1. 有一定的宽度（横向书写）
        # 2. 笔画有曲线特征（密度中等偏低）
        # 3. 宽高比较大
        
        is_signature_like = False
        
        if not is_date_like:
            # 签名通常宽高比 > 2
            if aspect_ratio > 1.5:
                # 密度不能太高（太高可能是印刷体）
                if density < 0.3:
                    is_signature_like = True
        
        if is_signature_like:
            # 计算评分
            score = 0
            score += min(aspect_ratio / 5, 1) * 0.4  # 宽高比越大越好
            score += (0.15 - abs(density - 0.15)) * 2  # 密度接近0.15最好
            score += (w * h / 10000) * 0.2  # 面积适中
            
            candidates.append({
                'box': [x, y, x+w, y+h],
                'density': density,
                'aspect_ratio': aspect_ratio,
                'score': score
            })
            print(f"   [候选] 签名: [{x}, {y}, {x+w}, {y+h}], 密度={density:.2f}, 宽高比={aspect_ratio:.1f}, 评分={score:.2f}")
    
    # 按评分排序
    candidates.sort(key=lambda x: x['score'], reverse=True)
    
    return candidates


def refine_to_handwriting_only(image, coarse_box, padding=5):
    """
    精细化：只保留手写笔迹，去掉印刷体标签
    """
    x1, y1, x2, y2 = coarse_box
    h, w = image.shape[:2]
    
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    
    if x2 <= x1 or y2 <= y1:
        return coarse_box
    
    roi = image[y1:y2, x1:x2]
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    
    # 二值化
    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        11, 5
    )
    
    # 形态学处理
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    
    # 找轮廓，分析每个连通区域
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # 找到最大的几个轮廓（签名主体）
    if not contours:
        return coarse_box
    
    # 按面积排序
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    
    # 合并最大的轮廓得到签名区域
    all_points = []
    total_area = sum(cv2.contourArea(c) for c in contours)
    accumulated_area = 0
    
    for cnt in contours:
        area = cv2.contourArea(cnt)
        accumulated_area += area
        all_points.extend(cnt.reshape(-1, 2).tolist())
        
        # 累积到80%的面积就停止（排除小的噪声）
        if accumulated_area > total_area * 0.8:
            break
    
    if not all_points:
        return coarse_box
    
    all_points = np.array(all_points)
    rx, ry, rw, rh = cv2.boundingRect(all_points)
    
    # 映射回原图坐标
    return [
        max(0, x1 + rx - padding),
        max(0, y1 + ry - padding),
        min(w, x1 + rx + rw + padding),
        min(h, y1 + ry + rh + padding)
    ]


def apply_mask(image, box, mask_type="mosaic"):
    x1, y1, x2, y2 = map(int, box)
    w, h = x2 - x1, y2 - y1
    
    if w <= 0 or h <= 0:
        return
    
    if mask_type == "mosaic":
        roi = image[y1:y2, x1:x2]
        small = cv2.resize(roi, (max(1, w // 10), max(1, h // 10)))
        image[y1:y2, x1:x2] = cv2.resize(small, (w, h), interpolation=cv2.INTER_NEAREST)
    elif mask_type == "blur":
        roi = image[y1:y2, x1:x2]
        image[y1:y2, x1:x2] = cv2.GaussianBlur(roi, (51, 51), 0)
    elif mask_type == "black":
        cv2.rectangle(image, (x1, y1), (x2, y2), (0, 0, 0), -1)


def detect_and_mask_v5(
    image_path,
    output_path="masked_v5.png",
    mask_type="mosaic",
    use_glm=True,
    draw_debug=False
):
    """
    v5：更精确的签名检测
    """
    print("=" * 60)
    print("签名检测与打码 v5.0 (排除日期优化版)")
    print("=" * 60)
    
    image = cv2.imread(image_path)
    if image is None:
        print(f"❌ 无法读取图片: {image_path}")
        return []
    
    result_image = image.copy()
    
    # Step 1: GLM验证
    if use_glm:
        print("\n🔍 Step 1: GLM验证...")
        has_sig, sig_content = glm_check_has_signature(image_path)
        if not has_sig:
            print("❌ GLM未检测到签名")
            return []
        print(f"✅ 确认有签名: '{sig_content}'")
    
    # Step 2: CV定位
    print("\n🔍 Step 2: CV定位签名区域...")
    candidates = find_signature_region(image)
    
    if not candidates:
        print("❌ 未找到签名区域")
        return []
    
    # Step 3: 只取评分最高的1个
    print(f"\n🔍 Step 3: 选择最佳候选...")
    best = candidates[0]
    coarse_box = best['box']
    print(f"   选中: {coarse_box}, 评分={best['score']:.2f}")
    
    # Step 4: 精细化
    print("\n🔍 Step 4: 精细化到笔迹...")
    refined_box = refine_to_handwriting_only(image, coarse_box)
    print(f"   精细框: {refined_box}")
    
    # Step 5: 绘制或打码
    if draw_debug:
        # 红色粗框，绿色精细框
        cv2.rectangle(result_image,
            (coarse_box[0], coarse_box[1]),
            (coarse_box[2], coarse_box[3]),
            (0, 0, 255), 2)
        cv2.rectangle(result_image,
            (refined_box[0], refined_box[1]),
            (refined_box[2], refined_box[3]),
            (0, 255, 0), 2)
        cv2.putText(result_image, "Signature",
            (refined_box[0], refined_box[1]-5),
            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
    else:
        apply_mask(result_image, refined_box, mask_type)
        print(f"   ✅ 已打码 ({mask_type})")
    
    cv2.imwrite(output_path, result_image)
    print(f"\n{'=' * 60}")
    print(f"✅ 完成: {output_path}")
    print(f"{'=' * 60}")
    
    return [best]


def quick_mask(image_path, output_path="quick_v5.png"):
    """快速模式，纯CV"""
    print("快速签名打码 v5")
    
    image = cv2.imread(image_path)
    if image is None:
        return
    
    candidates = find_signature_region(image)
    if not candidates:
        print("未找到签名")
        return
    
    best = candidates[0]
    refined = refine_to_handwriting_only(image, best['box'])
    apply_mask(image, refined, "mosaic")
    
    cv2.imwrite(output_path, image)
    print(f"完成: {output_path}")


if __name__ == "__main__":
    import sys
    
    image_path = sys.argv[1] if len(sys.argv) > 1 else "test.png"
    mode = sys.argv[2] if len(sys.argv) > 2 else "mask"
    
    if mode == "detect":
        detect_and_mask_v5(image_path, "detected_v5.png", draw_debug=True)
    elif mode == "quick":
        quick_mask(image_path, "quick_v5.png")
    else:
        detect_and_mask_v5(image_path, "masked_v5.png", mask_type="mosaic")