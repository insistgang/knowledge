# ==========================================
# 签名检测与打码 v4.0
# 核心思路：GLM识别签名内容 + CV定位笔迹
# 不依赖GLM返回的坐标（因为不准）
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
    """图片转base64"""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def glm_check_has_signature(image_path, model="glm-4v-flash"):
    """
    用GLM判断图片中是否有手写签名
    返回：(是否有签名, 签名内容)
    """
    base64_image = encode_image(image_path)
    media_type = "image/png" if image_path.endswith(".png") else "image/jpeg"
    
    prompt = """请分析这张图片，回答以下问题：
1. 图片中是否有手写签名？（不包括印刷体文字和日期）
2. 如果有，签名的内容是什么？

请用以下格式回答：
有签名：是/否
签名内容：xxx（如果没有签名则填"无"）"""

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
        
        # 解析结果
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


def find_handwriting_regions(image):
    """
    用CV找图片中的手写区域
    基于：手写笔迹通常是深色、连续的、有特定形态
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 自适应二值化
    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        15, 10
    )
    
    # 形态学操作：连接相近的笔画
    kernel_connect = cv2.getStructuringElement(cv2.MORPH_RECT, (20, 5))
    connected = cv2.dilate(binary, kernel_connect, iterations=2)
    
    # 找轮廓
    contours, _ = cv2.findContours(connected, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    regions = []
    img_h, img_w = image.shape[:2]
    
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        area = w * h
        aspect_ratio = w / h if h > 0 else 0
        
        # 签名特征过滤
        # 1. 宽高比：签名通常横向展开
        # 2. 面积：不能太小也不能太大
        # 3. 位置：通常在页面中下部
        
        if (aspect_ratio > 1.2 and           # 横向
            area > 500 and                    # 不能太小
            area < img_w * img_h * 0.5 and   # 不能太大
            w > 30 and h > 10):              # 最小尺寸
            
            # 计算区域内的笔迹密度
            roi_binary = binary[y:y+h, x:x+w]
            density = np.sum(roi_binary > 0) / (w * h) if w * h > 0 else 0
            
            regions.append({
                'box': [x, y, x+w, y+h],
                'area': area,
                'aspect_ratio': aspect_ratio,
                'density': density,
                'y_position': y / img_h  # 相对位置
            })
    
    # 按特征排序：优先选择密度适中、位置靠下、面积较大的区域
    # 签名通常密度在0.1-0.4之间（不太密也不太疏）
    def score_region(r):
        density_score = 1 - abs(r['density'] - 0.2) * 2  # 密度接近0.2得分高
        position_score = r['y_position']  # 位置越靠下得分越高（签名通常在下方）
        area_score = min(r['area'] / 5000, 1)  # 面积适中
        return density_score + position_score * 0.5 + area_score * 0.3
    
    regions.sort(key=score_region, reverse=True)
    
    return regions


def is_likely_signature(image, box):
    """
    判断一个区域是否可能是签名
    排除：纯印刷体、表格线、日期等
    """
    x1, y1, x2, y2 = box
    roi = image[y1:y2, x1:x2]
    
    if roi.size == 0:
        return False
    
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    
    # 边缘检测
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.sum(edges > 0) / edges.size
    
    # 签名特征：边缘密度中等（不像印刷体那么规整，也不像直线那么简单）
    # 印刷体边缘密度通常很高且规整
    # 签名边缘密度中等，且有曲线特征
    
    # 检查是否有曲线特征（签名通常有弧度）
    # 简化判断：如果宽高比很高且边缘密度低，可能是下划线
    w, h = x2 - x1, y2 - y1
    if w / h > 10 and edge_density < 0.1:
        return False  # 可能是下划线
    
    return True


def refine_box_to_ink(image, coarse_box, padding=5):
    """
    精细化边界框到笔迹边缘
    """
    x1, y1, x2, y2 = coarse_box
    h, w = image.shape[:2]
    
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    
    if x2 <= x1 or y2 <= y1:
        return coarse_box
    
    roi = image[y1:y2, x1:x2]
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    
    # 自适应二值化
    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        11, 5
    )
    
    # 形态学闭运算连接笔画
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


def detect_and_mask_v4(
    image_path,
    output_path="masked_v4.png",
    mask_type="mosaic",
    use_glm_verify=True,
    draw_debug=False
):
    """
    v4 完整流程：
    1. CV找所有可能的手写区域
    2. （可选）用GLM验证是否有签名
    3. 过滤出最可能的签名区域
    4. 精细化 + 打码
    """
    print("=" * 60)
    print("签名检测与打码 v4.0 (CV定位 + GLM验证)")
    print("=" * 60)
    
    image = cv2.imread(image_path)
    if image is None:
        print(f"❌ 无法读取图片: {image_path}")
        return []
    
    result_image = image.copy()
    
    # Step 1: GLM验证是否有签名（可选）
    if use_glm_verify:
        print("\n🔍 Step 1: GLM验证签名存在...")
        has_sig, sig_content = glm_check_has_signature(image_path)
        if not has_sig:
            print("❌ GLM未检测到签名")
            return []
        print(f"✅ GLM确认有签名: '{sig_content}'")
    
    # Step 2: CV找手写区域
    print("\n🔍 Step 2: CV定位手写区域...")
    regions = find_handwriting_regions(image)
    print(f"   找到 {len(regions)} 个候选区域")
    
    if not regions:
        print("❌ 未找到手写区域")
        return []
    
    # Step 3: 过滤和选择
    print("\n🔍 Step 3: 筛选签名区域...")
    signature_regions = []
    
    for i, r in enumerate(regions[:5]):  # 只看前5个候选
        box = r['box']
        print(f"   候选 {i+1}: {box}, 密度={r['density']:.2f}, 宽高比={r['aspect_ratio']:.1f}")
        
        if is_likely_signature(image, box):
            signature_regions.append(r)
            print(f"      → ✅ 可能是签名")
        else:
            print(f"      → ⏭️ 排除（不像签名）")
    
    if not signature_regions:
        # 如果没有通过验证的，取评分最高的
        print("   没有明确的签名区域，使用评分最高的候选")
        signature_regions = regions[:1]
    
    # Step 4: 处理签名区域
    print(f"\n🔍 Step 4: 处理 {len(signature_regions)} 个签名区域...")
    
    for i, r in enumerate(signature_regions[:2]):  # 最多处理2个
        coarse_box = r['box']
        print(f"\n📍 签名 {i+1}")
        print(f"   粗定位: {coarse_box}")
        
        # 精细化
        refined_box = refine_box_to_ink(image, coarse_box)
        print(f"   精细框: {refined_box}")
        
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
            cv2.putText(result_image, f"Sig{i+1}",
                (refined_box[0], refined_box[1]-5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        else:
            apply_mask(result_image, refined_box, mask_type)
            print(f"   ✅ 已打码 ({mask_type})")
    
    # 保存结果
    cv2.imwrite(output_path, result_image)
    print(f"\n{'=' * 60}")
    print(f"✅ 处理完成: {output_path}")
    print(f"{'=' * 60}")
    
    return signature_regions


def quick_mask_signature(image_path, output_path="quick_masked.png", mask_type="mosaic"):
    """
    快速模式：纯CV检测，不调用GLM
    适用于批量处理
    """
    print("=" * 60)
    print("快速签名打码 (纯CV模式)")
    print("=" * 60)
    
    image = cv2.imread(image_path)
    if image is None:
        print(f"❌ 无法读取图片")
        return
    
    regions = find_handwriting_regions(image)
    
    if not regions:
        print("❌ 未找到手写区域")
        return
    
    # 取评分最高的区域
    best_region = regions[0]
    box = best_region['box']
    
    print(f"📍 检测到签名区域: {box}")
    
    # 精细化
    refined = refine_box_to_ink(image, box)
    print(f"   精细框: {refined}")
    
    # 打码
    apply_mask(image, refined, mask_type)
    
    cv2.imwrite(output_path, image)
    print(f"✅ 完成: {output_path}")


# ==========================================
# 测试
# ==========================================
if __name__ == "__main__":
    import sys
    
    image_path = sys.argv[1] if len(sys.argv) > 1 else "test.png"
    mode = sys.argv[2] if len(sys.argv) > 2 else "mask"
    
    if mode == "detect":
        # 检测模式，绘制边界框
        detect_and_mask_v4(
            image_path,
            output_path="detected_v4.png",
            draw_debug=True,
            use_glm_verify=True
        )
    elif mode == "quick":
        # 快速模式，纯CV
        quick_mask_signature(
            image_path,
            output_path="quick_masked.png"
        )
    else:
        # 完整模式
        detect_and_mask_v4(
            image_path,
            output_path="masked_v4.png",
            mask_type="mosaic",
            use_glm_verify=True
        )