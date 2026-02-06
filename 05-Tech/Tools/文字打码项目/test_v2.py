# ==========================================
# 签名检测与打码 v2.0
# GLM直接返回坐标 + CV精细化 + 打码
# ==========================================

import cv2
import base64
import numpy as np
import json
import re
import os
from openai import OpenAI

# ========== API 配置 ==========
# 请设置环境变量: export GLM_API_KEY="your_api_key"
API_KEY = os.getenv("GLM_API_KEY", "ec06750a1d0447cb8bcfd28879a57bff.4yNBx2M2CBNd6zXu")

client = OpenAI(
    api_key=API_KEY,
    base_url="https://open.bigmodel.cn/api/paas/v4"
)


def encode_image(image_path):
    """图片转base64"""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def get_image_size(image_path):
    """获取图片尺寸"""
    img = cv2.imread(image_path)
    return img.shape[1], img.shape[0]  # width, height


def glm_detect_signature(image_path):
    """
    用 GLM-4.6V 直接检测签名位置，返回坐标
    """
    base64_image = encode_image(image_path)
    width, height = get_image_size(image_path)
    media_type = "image/png" if image_path.endswith(".png") else "image/jpeg"
    
    prompt = f"""检测图片中所有手写签名的位置。

要求：
1. 只检测手写签名，忽略印刷体文字（如 Signed:、Date: 等）
2. 边界框要尽量贴合签名笔迹
3. 图片尺寸为 {width}x{height} 像素

返回格式（严格JSON，不要其他文字）：
{{"signatures": [{{"box": [x1, y1, x2, y2], "content": "签名内容"}}]}}

坐标说明：
- [x1, y1] 为左上角坐标
- [x2, y2] 为右下角坐标
- 使用像素值

如果没有手写签名，返回：{{"signatures": []}}"""

    response = client.chat.completions.create(
        model="glm-4v-plus",  # 或 glm-4v-plus
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
        max_tokens=512
    )
    
    result_text = response.choices[0].message.content.strip()
    print(f"GLM 原始返回:\n{result_text}\n")
    
    # 解析JSON
    try:
        # 尝试提取JSON部分
        json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            return result.get("signatures", [])
    except json.JSONDecodeError as e:
        print(f"JSON解析失败: {e}")
    
    return []


def refine_signature_box(image, coarse_box, padding=5):
    """
    CV精细化：将VLM返回的粗框精细化到笔迹边缘
    
    Args:
        image: cv2读取的图片
        coarse_box: [x1, y1, x2, y2] 粗略边界框
        padding: 精细框的边距
    
    Returns:
        refined_box: [x1, y1, x2, y2] 精细边界框
    """
    x1, y1, x2, y2 = map(int, coarse_box)
    
    # 边界检查
    h, w = image.shape[:2]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    
    if x2 <= x1 or y2 <= y1:
        return coarse_box
    
    # 裁剪ROI
    roi = image[y1:y2, x1:x2]
    
    # 转灰度
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    
    # 自适应二值化（应对不同光照）
    binary = cv2.adaptiveThreshold(
        gray, 255, 
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 
        11, 5
    )
    
    # 形态学闭运算：连接断开的笔画
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    
    # 找到非零像素的边界
    coords = cv2.findNonZero(binary)
    if coords is None:
        return coarse_box
    
    # 计算最小外接矩形
    rx, ry, rw, rh = cv2.boundingRect(coords)
    
    # 映射回原图坐标 + padding
    refined_box = [
        max(0, x1 + rx - padding),
        max(0, y1 + ry - padding),
        min(w, x1 + rx + rw + padding),
        min(h, y1 + ry + rh + padding)
    ]
    
    return refined_box


def apply_mask(image, box, mask_type="mosaic"):
    """
    对指定区域打码
    
    Args:
        image: cv2图片
        box: [x1, y1, x2, y2]
        mask_type: "mosaic" | "blur" | "black"
    """
    x1, y1, x2, y2 = map(int, box)
    w, h = x2 - x1, y2 - y1
    
    if w <= 0 or h <= 0:
        return
    
    if mask_type == "mosaic":
        roi = image[y1:y2, x1:x2]
        # 缩小再放大产生马赛克效果
        small = cv2.resize(roi, (max(1, w // 10), max(1, h // 10)))
        image[y1:y2, x1:x2] = cv2.resize(small, (w, h), interpolation=cv2.INTER_NEAREST)
    
    elif mask_type == "blur":
        roi = image[y1:y2, x1:x2]
        image[y1:y2, x1:x2] = cv2.GaussianBlur(roi, (51, 51), 0)
    
    elif mask_type == "black":
        cv2.rectangle(image, (x1, y1), (x2, y2), (0, 0, 0), -1)


def detect_and_mask_signatures(
    image_path, 
    output_path="output_masked.png",
    mask_type="mosaic",
    refine=True,
    draw_debug=False
):
    """
    完整流程：检测签名 → 精细化 → 打码
    
    Args:
        image_path: 输入图片路径
        output_path: 输出图片路径
        mask_type: 打码类型 "mosaic" | "blur" | "black"
        refine: 是否启用CV精细化
        draw_debug: 是否绘制调试框（红=原始，绿=精细）
    
    Returns:
        signatures: 检测到的签名列表
    """
    print("=" * 50)
    print("签名检测与打码 v2.0")
    print("=" * 50)
    
    # Step 1: GLM 检测签名
    print("\n🔍 Step 1: GLM 检测签名位置...")
    signatures = glm_detect_signature(image_path)
    
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
        
        if len(coarse_box) != 4:
            print(f"  ⚠️ 签名 {i+1} 坐标格式错误，跳过")
            continue
        
        print(f"\n📍 签名 {i+1}: '{content}'")
        print(f"   原始框: {coarse_box}")
        
        # Step 3.1: CV精细化（可选）
        if refine:
            print("   🔧 CV精细化...")
            refined_box = refine_signature_box(image, coarse_box)
            print(f"   精细框: {refined_box}")
        else:
            refined_box = coarse_box
        
        # Step 3.2: 绘制调试框（可选）
        if draw_debug:
            # 红色：原始框
            cv2.rectangle(
                result_image,
                (int(coarse_box[0]), int(coarse_box[1])),
                (int(coarse_box[2]), int(coarse_box[3])),
                (0, 0, 255), 2
            )
            # 绿色：精细框
            cv2.rectangle(
                result_image,
                (int(refined_box[0]), int(refined_box[1])),
                (int(refined_box[2]), int(refined_box[3])),
                (0, 255, 0), 2
            )
        else:
            # Step 3.3: 打码
            apply_mask(result_image, refined_box, mask_type)
            print(f"   ✅ 已打码 ({mask_type})")
    
    # Step 4: 保存结果
    cv2.imwrite(output_path, result_image)
    print(f"\n{'=' * 50}")
    print(f"✅ 处理完成: {output_path}")
    print(f"{'=' * 50}")
    
    return signatures


def detect_only(image_path, output_path="output_detected.png", refine=True):
    """
    只检测不打码，绘制边界框用于调试
    """
    return detect_and_mask_signatures(
        image_path,
        output_path=output_path,
        refine=refine,
        draw_debug=True
    )


# ==========================================
# 测试
# ==========================================
if __name__ == "__main__":
    import sys
    
    # 默认测试图片
    image_path = sys.argv[1] if len(sys.argv) > 1 else "test.png"
    
    # 模式选择
    mode = sys.argv[2] if len(sys.argv) > 2 else "mask"
    
    if mode == "detect":
        # 只检测，绘制边界框
        detect_only(
            image_path,
            output_path="detected.png",
            refine=True
        )
    else:
        # 检测 + 打码
        detect_and_mask_signatures(
            image_path,
            output_path="masked.png",
            mask_type="mosaic",  # mosaic / blur / black
            refine=True
        )