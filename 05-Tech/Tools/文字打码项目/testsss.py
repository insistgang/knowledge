# ==========================================
# 只打码签名区域（过滤印刷体）
# ==========================================

import cv2
import base64
import numpy as np
from openai import OpenAI
from paddleocr import PaddleOCR

# ========== GLM API 配置 ==========
API_KEY = "ec06750a1d0447cb8bcfd28879a57bff.4yNBx2M2CBNd6zXu"

client = OpenAI(
    api_key=API_KEY,
    base_url="https://api.z.ai/api/paas/v4"
)

ocr = PaddleOCR(lang='en')


def encode_image(image_path):
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def glm_get_signature_content(image_path):
    """用 GLM 识别签名内容"""
    base64_image = encode_image(image_path)
    media_type = "image/png" if image_path.endswith(".png") else "image/jpeg"
    
    response = client.chat.completions.create(
        model="glm-4.6v",
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
                        "text": "请只识别图片中的手写签名内容（不包括印刷体文字如Signed:、Date:等），只返回签名的文字内容，不要其他解释。"
                    }
                ]
            }
        ],
        max_tokens=256
    )
    
    return response.choices[0].message.content.strip()


def mask_signature_only(image_path, output_path="signature_masked.png", mask_type="mosaic"):
    """只打码签名区域"""
    
    # Step 1: GLM 识别签名内容
    print("🔍 GLM 识别签名内容...")
    signature_text = glm_get_signature_content(image_path)
    print(f"签名内容: {signature_text}")
    
    # 提取签名关键词（去掉空格，转小写，用于匹配）
    signature_keywords = signature_text.lower().replace(" ", "").replace("\n", "")
    
    # Step 2: PaddleOCR 定位
    print("\n📍 PaddleOCR 定位...")
    image = cv2.imread(image_path)
    results = ocr.predict(image_path)
    
    if not results or len(results) == 0:
        print("❌ 未检测到文字")
        return
    
    # Step 3: 只打码签名区域
    # 排除的印刷体关键词
    exclude_keywords = ['date', '08', '02', '2021',
                        'assistance', 'connection', 'including', 'execute',
                        'document', 'therewith']

    for result in results:
        dt_polys = result.get('dt_polys', [])
        rec_texts = result.get('rec_texts', [])
        rec_scores = result.get('rec_scores', [])

        for i, box in enumerate(dt_polys):
            text = rec_texts[i] if i < len(rec_texts) else ""
            score = rec_scores[i] if i < len(rec_scores) else 0
            text_lower = text.lower().strip()

            # 判断是否为签名区域
            is_signature = False

            # 方法1: 检查是否包含 GLM 识别的签名内容
            # 移除空格后进行匹配
            sig_content = signature_keywords.replace(" ", "").replace("\n", "").lower()
            text_clean = text_lower.replace(" ", "").replace(":", "")
            if sig_content in text_clean or text_clean in sig_content:
                is_signature = True
                print(f"  → 匹配签名: '{text_clean}' 包含 '{sig_content}'")

            # 方法2: 排除明显的印刷体（但优先保留签名）
            if not is_signature and any(ex in text_lower for ex in exclude_keywords):
                is_signature = False
            
            # 方法3: 置信度较低的可能是手写（可选）
            # if score < 0.9:
            #     is_signature = True
            
            if is_signature:
                print(f"  ✅ 签名区域: '{text}' (置信度: {score:.2f})")
                
                pts = np.array(box, dtype=np.int32)
                x, y, w, h = cv2.boundingRect(pts)
                
                padding = 10
                x = max(0, x - padding)
                y = max(0, y - padding)
                w = min(image.shape[1] - x, w + 2 * padding)
                h = min(image.shape[0] - y, h + 2 * padding)
                
                # 打码
                if mask_type == "blur":
                    roi = image[y:y+h, x:x+w]
                    image[y:y+h, x:x+w] = cv2.GaussianBlur(roi, (51, 51), 0)
                elif mask_type == "black":
                    cv2.rectangle(image, (x, y), (x+w, y+h), (0, 0, 0), -1)
                elif mask_type == "mosaic":
                    roi = image[y:y+h, x:x+w]
                    small = cv2.resize(roi, (max(1, w//10), max(1, h//10)))
                    image[y:y+h, x:x+w] = cv2.resize(small, (w, h), interpolation=cv2.INTER_NEAREST)
            else:
                print(f"  ⏭️ 跳过印刷体: '{text}'")
    
    cv2.imwrite(output_path, image)
    print(f"\n✅ 签名打码完成: {output_path}")
    return output_path


# ==========================================
# 测试
# ==========================================
if __name__ == "__main__":
    image_path = "test.png"
    
    mask_signature_only(
        image_path,
        output_path="signature_only_masked.png",
        mask_type="mosaic"
    )