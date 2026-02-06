# ==========================================
# GLM 视觉模型识别手写数字/签名
# ==========================================

import base64
from openai import OpenAI

API_KEY = "03a7ff3a175d413bb5c99a30907cd364.H96ML67vnOVYAmAC"

client = OpenAI(
    api_key=API_KEY,
    base_url="https://api.z.ai/api/paas/v4"
)

def encode_image(image_path):
    """将图片转为 base64"""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def recognize_handwriting(image_path):
    """识别手写内容"""
    base64_image = encode_image(image_path)
    
    # 判断图片格式
    if image_path.endswith(".png"):
        media_type = "image/png"
    else:
        media_type = "image/jpeg"
    
    response = client.chat.completions.create(
        model="glm-4.5v",  # 视觉模型
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{media_type};base64,{base64_image}"
                        }
                    },
                    {
                        "type": "text",
                        "text": "请识别这张图片中的手写数字或签名内容，只输出识别结果。"
                    }
                ]
            }
        ],
        max_tokens=1024
    )
    
    return response.choices[0].message.content

# 测试
if __name__ == "__main__":
    image_path = "test.png"  # 替换为你的图片
    result = recognize_handwriting(image_path)
    print(f"识别结果: {result}")