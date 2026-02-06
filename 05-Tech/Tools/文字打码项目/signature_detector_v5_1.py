# ==========================================
# 签名检测与打码 v5.1
# 修复：调整日期排除逻辑，避免误排签名
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
    找签名区域，用评分而不是硬排除
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
    
    binary_original = binary.copy()
    
    # 形态学连接
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 8))
    connected = cv2.dilate(binary, kernel, iterations=2)
    
    # 找轮廓
    contours, _ = cv2.findContours(connected, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    candidates = []
    
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        
        # 基本尺寸过滤
        if w < 30 or h < 10:
            continue
        if w * h > img_w * img_h * 0.6:
            continue
        
        # 计算特征
        roi_binary = binary_original[y:y+h, x:x+w]
        density = np.sum(roi_binary > 0) / (w * h) if w * h > 0 else 0
        aspect_ratio = w / h
        area = w * h
        relative_y = y / img_h
        
        # ========== 评分系统（不硬排除）==========
        score = 0
        
        # 1. 宽高比：签名通常横向，宽高比2-8分最高
        if aspect_ratio >= 2:
            score += min(aspect_ratio / 4, 1) * 30  # 最高30分
        elif aspect_ratio >= 1.5:
            score += 15
        
        # 2. 宽度：签名通常比较宽（>100像素）
        if w > 150:
            score += 25
        elif w > 100:
            score += 20
        elif w > 50:
            score += 10
        
        # 3. 密度：签名密度通常0.05-0.2
        if 0.05 <= density <= 0.2:
            score += 20
        elif 0.02 <= density <= 0.3:
            score += 10
        
        # 4. 高度：签名有一定高度（不会太矮）
        if h > 30:
            score += 15
        elif h > 20:
            score += 10
        
        # 5. 面积
        if area > 3000:
            score += 10
        
        # ========== 日期惩罚（不是排除，是降分）==========
        # 日期特征：窄、矮、在最下方
        is_date_like = False
        
        # 非常窄且矮，且在最下方
        if w < 150 and h < 30 and relative_y > 0.7:
            score -= 30  # 惩罚
            is_date_like = True
        
        # 宽高比小于3且高度小于25，可能是日期
        if aspect_ratio < 3 and h < 25 and relative_y > 0.6:
            score -= 20
            is_date_like = True
        
        print(f"   区域 [{x}, {y}, {x+w}, {y+h}]: w={w}, h={h}, 宽高比={aspect_ratio:.1f}, 密度={density:.2f}, 评分={score}")
        if is_date_like:
            print(f"      (可能是日期，已降分)")
        
        if score > 0:  # 只保留正分的候选
            candidates.append({
                'box': [x, y, x+w, y+h],
                'width': w,
                'height': h,
                'density': density,
                'aspect_ratio': aspect_ratio,
                'score': score
            })
    
    # 按评分排序
    candidates.sort(key=lambda x: x['score'], reverse=True)
    
    return candidates


def refine_to_handwriting(image, coarse_box, padding=5):
    """精细化到笔迹"""
    x1, y1, x2, y2 = coarse_box
    h, w = image.shape[:2]
    
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    
    if x2 <= x1 or y2 <= y1:
        return coarse_box
    
    roi = image[y1:y2, x1:x2]
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    
    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        11, 5
    )
    
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    
    coords = cv2.findNonZero(binary)
    if coords is None:
        return coarse_box
    
    rx, ry, rw, rh = cv2.boundingRect(coords)
    
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


def detect_and_mask(
    image_path,
    output_path="masked.png",
    mask_type="mosaic",
    use_glm=True,
    draw_debug=False
):
    """
    v5.1 主函数
    """
    print("=" * 60)
    print("签名检测与打码 v5.1")
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
    print("\n🔍 Step 2: CV定位...")
    candidates = find_signature_region(image)
    
    if not candidates:
        print("❌ 未找到签名区域")
        return []
    
    # Step 3: 选最佳
    print(f"\n🔍 Step 3: 选择最佳候选...")
    best = candidates[0]
    coarse_box = best['box']
    print(f"   ✅ 选中: {coarse_box}, 评分={best['score']}")
    
    # Step 4: 精细化
    print("\n🔍 Step 4: 精细化...")
    refined_box = refine_to_handwriting(image, coarse_box)
    print(f"   精细框: {refined_box}")
    
    # Step 5: 输出
    if draw_debug:
        cv2.rectangle(result_image,
            (coarse_box[0], coarse_box[1]),
            (coarse_box[2], coarse_box[3]),
            (0, 0, 255), 2)
        cv2.rectangle(result_image,
            (refined_box[0], refined_box[1]),
            (refined_box[2], refined_box[3]),
            (0, 255, 0), 2)
        cv2.putText(result_image, f"Score:{best['score']:.0f}",
            (refined_box[0], refined_box[1]-5),
            cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 1)
    else:
        apply_mask(result_image, refined_box, mask_type)
        print(f"   ✅ 已打码 ({mask_type})")
    
    cv2.imwrite(output_path, result_image)
    print(f"\n{'=' * 60}")
    print(f"✅ 完成: {output_path}")
    
    return [best]


if __name__ == "__main__":
    import sys
    
    image_path = sys.argv[1] if len(sys.argv) > 1 else "test.png"
    mode = sys.argv[2] if len(sys.argv) > 2 else "mask"
    
    if mode == "detect":
        detect_and_mask(image_path, "detected.png", draw_debug=True)
    else:
        detect_and_mask(image_path, "masked.png", mask_type="mosaic")