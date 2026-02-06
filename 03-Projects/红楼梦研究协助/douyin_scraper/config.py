# -*- coding: utf-8 -*-
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
COOKIES_FILE = os.path.join(DATA_DIR, "cookies.json")

# 浏览器配置
USE_LOCAL_CHROME = True  # 是否使用本地安装的 Chrome 浏览器

# 目标博主列表
TARGET_BLOGGERS = ["大车轱辘", "正电兔", "吃瓜蒙主"]

# 红学关键词（用于内容过滤）
HONGXUE_KEYWORDS = [
    "红楼梦", "红学", "新红学", "红楼",
    "贾宝玉", "林黛玉", "薛宝钗", "王熙凤", "贾母",
    "曹雪芹", "高鹗", "脂砚斋", "脂批",
    "大观园", "荣国府", "宁国府",
    "程高本", "庚辰本", "甲戌本",
]