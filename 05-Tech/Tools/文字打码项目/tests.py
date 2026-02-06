# ==========================================
# GLM-4.7 API 调用示例（Z.ai 平台）
# 注册：https://z.ai
# ==========================================

from openai import OpenAI
from datetime import datetime

# Z.ai 平台的 API Key
API_KEY = "03a7ff3a175d413bb5c99a30907cd364.H96ML67vnOVYAmAC"

client = OpenAI(
    api_key=API_KEY,
    base_url="https://api.z.ai/api/paas/v4"
)

today = datetime.now().strftime("%Y年%m月%d日")

print("正在连接 GLM-4.7...")

try:
    response = client.chat.completions.create(
        model="glm-4.7",
        messages=[
            {
                "role": "system",
                "content": f"你是一个智能助手。当前日期：{today}"
            },
            {
                "role": "user",
                "content": "你好，请介绍一下你自己，并告诉我今天是几号。"
            }
        ],
        max_tokens=4096,
        temperature=1.0,
        stream=True
    )

    print("-" * 40)
    for chunk in response:
        if chunk.choices[0].delta.content:
            print(chunk.choices[0].delta.content, end="", flush=True)
    print("\n" + "-" * 40)

except Exception as e:
    print(f"❌ 发生错误: {e}")