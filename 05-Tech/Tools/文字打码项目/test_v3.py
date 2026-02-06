# ==========================================
# 签名检测与打码 v3.0
# 改进：优化prompt、排除日期、增加坐标校验
# ==========================================

import cv2
import base64
import numpy as np
import json
import re
import os
from openai import OpenAI

# ========== API 配置 ==========
API_KEY = os.getenv("GLM_API_KEY", "ec06750a1d0447cb8bcfd28879a57bff.4yNBx2M2CBNd6zXu")

client = OpenAI(
    api_key=API_KEY,
    base_url="https://open.bigmodel.cn/api/paas/v4"
)

# 智谱视觉模型列表（按推荐顺序）
VISION_MODELS = [
    "glm-4v-flash",      # 免费版
    "glm-4v-plus",       # 付费增强版
    # "glm-4.6v",        # 可能需要不同的调用方式
]


def encode_image(image_path):
    """图片转base64"""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def get_image_size(image_path):
    """获取图片尺寸"""
    img = cv2.imread(image_path)
    return img.shape[1], img.shape[0]  # width, height


def glm_detect_signature_v3(image_path, model="glm-4v-flash"):
    """
    改进版：GLM检测签名位置
    - 更精确的prompt
    - 明确排除日期、印刷体
    """
    base64_image = encode_image(image_path)
    width, height = get_image_size(image_path)
    media_type = "image/png" if image_path.endswith(".png") else "image/jpeg"
    
    # 改进的prompt
    prompt = f"""你是一个精确的文档分析助手。请检测图片中的【手写签名】位置。

【重要】只检测手写签名，必须排除以下内容：
- 印刷体文字（如 "Signed:"、"Date:"、"Name:" 等标签）
- 手写或印刷的日期（如 "08/02/2021"、"2024-01-01" 等）
- 打印的表格线、横线
- 任何非签名的手写内容

图片尺寸：{width} x {height} 像素

请返回严格的JSON格式（不要markdown代码块，不要其他解释）：
{{"signatures": [{{"box": [x1, y1, x2, y2], "content": "签名内容"}}]}}

坐标要求：
- [x1, y1] 是签名区域的左上角像素坐标
- [x2, y2] 是签名区域的右下角像素坐标
- 边界框要紧贴签名笔迹，不要包含周围空白
- 坐标必须是整数像素值，不是比例值

如果没有检测到手写签名，返回：{{"signatures": []}}"""

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{media_type};base64,{base64_image}"}
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ],
            max_tokens=512,
            temperature=0.1  # 降低随机性，提高一致性
        )
        
        result_text = response.choices[0].message.content.strip()
        print(f"模型: {model}")
        print(f"GLM 原始返回:\n{result_text}\n")
        
        # 解析JSON
        return parse_glm_response(result_text, width, height)
        
    except Exception as e:
        print(f"API调用失败 ({model}): {e}")
        return []


def parse_glm_response(text, img_width, img_height):
    """
    解析GLM返回的JSON，处理各种格式问题
    """
    # 移除markdown代码块标记
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    text = text.strip()
    
    try:
        # 尝试提取JSON
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            signatures = result.get("signatures", [])
            
            # 校验和修正坐标
            valid_signatures = []
            for sig in signatures:
                box = sig.get("box", [])
                if len(box) == 4:
                    # 校验坐标是否合理
                    box = validate_and_fix_box(box, img_width, img_height)
                    if box:
                        sig["box"] = box
                        valid_signatures.append(sig)
            
            return valid_signatures
            
    except json.JSONDecodeError as e:
        print(f"JSON解析失败: {e}")
    
    return []


def validate_and_fix_box(box, img_width, img_height):
    """
    校验和修正边界框坐标
    处理：归一化坐标、越界、负值等问题
    """
    x1, y1, x2, y2 = box
    
    # 检测是否为归一化坐标（0-1或0-1000范围）
    if all(0 <= v <= 1 for v in box):
        # 0-1 归一化
        x1 = int(x1 * img_width)
        y1 = int(y1 * img_height)
        x2 = int(x2 * img_width)
        y2 = int(y2 * img_height)
        print(f"  [修正] 检测到0-1归一化坐标，已转换")
    elif all(0 <= v <= 1000 for v in box) and max(box) > 100:
        # 0-1000 归一化（智谱常用）
        x1 = int(x1 / 1000 * img_width)
        y1 = int(y1 / 1000 * img_height)
        x2 = int(x2 / 1000 * img_width)
        y2 = int(y2 / 1000 * img_height)
        print(f"  [修正] 检测到0-1000归一化坐标，已转换")
    else:
        # 假设是像素坐标
        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
    
    # 确保坐标顺序正确
    if x1 > x2:
        x1, x2 = x2, x1
    if y1 > y2:
        y1, y2 = y2, y1
    
    # 边界裁剪
    x1 = max(0, min(x1, img_width - 1))
    y1 = max(0, min(y1, img_height - 1))
    x2 = max(0, min(x2, img_width))
    y2 = max(0, min(y2, img_height))
    
    # 检查有效性
    if x2 <= x1 or y2 <= y1:
        print(f"  [警告] 无效框: [{x1}, {y1}, {x2}, {y2}]")
        return None
    
    # 检查框是否太小（可能是噪声）
    if (x2 - x1) < 10 or (y2 - y1) < 5:
        print(f"  [警告] 框太小，跳过: [{x1}, {y1}, {x2}, {y2}]")
        return None
    
    return [x1, y1, x2, y2]


def refine_signature_box(image, coarse_box, padding=5):
    """
    CV精细化：将粗框精细化到笔迹边缘
    """
    x1, y1, x2, y2 = map(int, coarse_box)
    h, w = image.shape[:2]
    
    # 边界检查
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    
    if x2 <= x1 or y2 <= y1:
        return coarse_box
    
    # 裁剪ROI
    roi = image[y1:y2, x1:x2]
    
    # 转灰度
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    
    # 自适应二值化
    binary = cv2.adaptiveThreshold(
        gray, 255, 
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 
        11, 5
    )
    
    # 形态学闭运算
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    
    # 找笔迹边界
    coords = cv2.findNonZero(binary)
    if coords is None:
        return coarse_box
    
    rx, ry, rw, rh = cv2.boundingRect(coords)
    
    # 映射回原图 + padding
    refined = [
        max(0, x1 + rx - padding),
        max(0, y1 + ry - padding),
        min(w, x1 + rx + rw + padding),
        min(h, y1 + ry + rh + padding)
    ]
    
    return refined


def apply_mask(image, box, mask_type="mosaic"):
    """打码"""
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


def detect_and_mask_v3(
    image_path, 
    output_path="output_masked.png",
    mask_type="mosaic",
    refine=True,
    draw_debug=False,
    model="glm-4v-flash"
):
    """
    完整流程 v3：检测签名 → 精细化 → 打码
    """
    print("=" * 60)
    print("签名检测与打码 v3.0")
    print("=" * 60)
    
    # Step 1: GLM 检测
    print(f"\n🔍 Step 1: 使用 {model} 检测签名...")
    signatures = glm_detect_signature_v3(image_path, model)
    
    if not signatures:
        print("❌ 未检测到签名")
        return []
    
    print(f"✅ 检测到 {len(signatures)} 个签名区域")
    
    # Step 2: 读取图片
    image = cv2.imread(image_path)
    result_image = image.copy()
    
    # Step 3: 处理每个签名
    for i, sig in enumerate(signatures):
        coarse_box = sig.get("box", [])
        content = sig.get("content", "未知")
        
        print(f"\n📍 签名 {i+1}: '{content}'")
        print(f"   原始框: {coarse_box}")
        
        # CV精细化
        if refine:
            print("   🔧 CV精细化...")
            refined_box = refine_signature_box(image, coarse_box)
            print(f"   精细框: {refined_box}")
        else:
            refined_box = coarse_box
        
        if draw_debug:
            # 红色原框，绿色精细框
            cv2.rectangle(result_image,
                (int(coarse_box[0]), int(coarse_box[1])),
                (int(coarse_box[2]), int(coarse_box[3])),
                (0, 0, 255), 2)
            cv2.rectangle(result_image,
                (int(refined_box[0]), int(refined_box[1])),
                (int(refined_box[2]), int(refined_box[3])),
                (0, 255, 0), 2)
            # 标注
            cv2.putText(result_image, f"Sig{i+1}", 
                (int(refined_box[0]), int(refined_box[1])-5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        else:
            apply_mask(result_image, refined_box, mask_type)
            print(f"   ✅ 已打码 ({mask_type})")
    
    # Step 4: 保存
    cv2.imwrite(output_path, result_image)
    print(f"\n{'=' * 60}")
    print(f"✅ 处理完成: {output_path}")
    print(f"{'=' * 60}")
    
    return signatures


# ==========================================
# 备选方案：结合你原来的代码思路
# ==========================================
def hybrid_detect(image_path, output_path="hybrid_masked.png", mask_type="mosaic"):
    """
    混合方案：GLM识别签名内容 + CV定位笔迹
    适用于GLM坐标不准但内容识别准确的情况
    """
    print("=" * 60)
    print("混合检测方案：GLM内容识别 + CV笔迹定位")
    print("=" * 60)
    
    image = cv2.imread(image_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 二值化找所有深色笔迹
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # 形态学处理
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 3))
    dilated = cv2.dilate(binary, kernel, iterations=2)
    
    # 找轮廓
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    result_image = image.copy()
    signature_candidates = []
    
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        
        # 过滤条件：签名通常是横向的、有一定大小
        aspect_ratio = w / h if h > 0 else 0
        area = w * h
        
        # 签名特征：宽高比 > 2，面积适中
        if aspect_ratio > 1.5 and area > 500 and w > 50:
            signature_candidates.append((x, y, w, h, area))
    
    # 按面积排序，取最大的几个
    signature_candidates.sort(key=lambda x: x[4], reverse=True)
    
    print(f"找到 {len(signature_candidates)} 个候选区域")
    
    for i, (x, y, w, h, area) in enumerate(signature_candidates[:3]):  # 最多3个
        print(f"  候选 {i+1}: [{x}, {y}, {x+w}, {y+h}], 面积={area}")
        
        # 这里可以用GLM验证是否为签名
        # 简化处理：直接打码
        box = [x, y, x+w, y+h]
        apply_mask(result_image, box, mask_type)
    
    cv2.imwrite(output_path, result_image)
    print(f"\n✅ 混合方案完成: {output_path}")
    
    return signature_candidates


# ==========================================
# 测试
# ==========================================
if __name__ == "__main__":
    import sys
    
    image_path = sys.argv[1] if len(sys.argv) > 1 else "test.png"
    mode = sys.argv[2] if len(sys.argv) > 2 else "mask"
    
    if mode == "detect":
        # 只检测，绘制边界框
        detect_and_mask_v3(
            image_path,
            output_path="detected_v3.png",
            draw_debug=True,
            model="glm-4v-flash"
        )
    elif mode == "hybrid":
        # 混合方案
        hybrid_detect(image_path, output_path="hybrid_masked.png")
    else:
        # 检测 + 打码
        detect_and_mask_v3(
            image_path,
            output_path="masked_v3.png",
            mask_type="mosaic",
            refine=True,
            model="glm-4v-flash"
        )