#!/usr/bin/env python3
"""
测试 Diary MCP Server
不依赖 MCP 客户端，直接测试核心功能
"""

import platform
from pathlib import Path
from datetime import datetime
import re

# WSL 路径映射
def get_real_path(windows_path: str) -> Path:
    """将 Windows 路径转换为 WSL 路径"""
    release = platform.uname().release.lower()
    is_wsl = "wsl" in release or "microsoft" in release

    if platform.system() == "Linux" and is_wsl:
        path = windows_path.replace("\\", "/")
        if path.startswith("E:/"):
            path = "/mnt/e" + path[2:]
        elif path.startswith("C:/"):
            path = "/mnt/c" + path[2:]
        return Path(path)
    return Path(windows_path)

# 日记目录配置
DIARY_DIR = get_real_path(r"E:\000\knowledge\01-Daily\2026-01")

# 获取所有日记文件
def get_diary_files() -> list[Path]:
    """获取所有日记文件，按日期排序"""
    diary_path = Path(DIARY_DIR)
    if not diary_path.exists():
        return []
    return sorted(diary_path.glob("2026-01-*.md"))

# 解析日记 frontmatter 和内容
def parse_diary(file_path: Path) -> dict:
    """解析日记文件"""
    content = file_path.read_text(encoding='utf-8')
    lines = content.split('\n')

    metadata = {}
    body_start = 0

    # 解析 frontmatter
    if lines and lines[0] == '---':
        for i, line in enumerate(lines[1:], 1):
            if line == '---':
                body_start = i + 1
                break
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip()
                metadata[key] = value

    body = '\n'.join(lines[body_start:])

    return {
        "metadata": metadata,
        "body": body,
        "full_content": content,
        "file_path": str(file_path),
        "file_name": file_path.name,
        "date": file_path.stem
    }

print("=" * 50)
print("Diary MCP Server 测试")
print("=" * 50)

# 测试 1: 目录配置
print(f"\n1. 日记目录: {DIARY_DIR}")
print(f"   目录存在: {Path(DIARY_DIR).exists()}")

# 测试 2: 获取日记列表
files = get_diary_files()
print(f"\n2. 找到日记数量: {len(files)}")
if files:
    print(f"   最早: {files[0].name}")
    print(f"   最新: {files[-1].name}")

# 测试 3: 解析日记
if files:
    print(f"\n3. 测试解析最新日记: {files[-1].name}")
    diary = parse_diary(files[-1])

    print(f"   日期: {diary['date']}")
    print(f"   标题: {diary['metadata'].get('title', '无')}")
    print(f"   正文长度: {len(diary['body'])} 字符")

    # 提取状态
    import re
    state_match = re.search(r'精力\s+(\d+)/10.*?情绪\s+(\d+)/10', diary['body'])
    if state_match:
        print(f"   精力: {state_match.group(1)}/10")
        print(f"   情绪: {state_match.group(2)}/10")

# 测试 4: 搜索功能
print(f"\n4. 测试搜索功能: '小程序'")
keyword = "小程序"
count = 0
for file in files[-10:]:  # 只搜最近10篇
    diary = parse_diary(file)
    if keyword in diary['body'] or keyword in diary['metadata'].get('title', ''):
        count += 1
        print(f"   ✓ {diary['date']}")

print(f"   找到 {count} 篇")

# 测试 5: 状态统计
print(f"\n5. 测试习惯统计 (最近7天)")
recent_files = files[-7:] if len(files) >= 7 else files
habits = {"论文": 0, "运动": 0, "喝水": 0}

for file in recent_files:
    diary = parse_diary(file)
    body = diary['body']
    if "论文" in body:
        habits["论文"] += 1
    if "运动" in body or "散步" in body or "健身" in body:
        habits["运动"] += 1
    if "喝水" in body:
        habits["喝水"] += 1

total = len(recent_files)
for habit, count in habits.items():
    rate = count / total * 100 if total > 0 else 0
    print(f"   {habit}: {count}/{total} ({rate:.0f}%)")

print("\n" + "=" * 50)
print("测试完成！")
print("=" * 50)
