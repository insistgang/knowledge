#!/usr/bin/env python3
"""
日记同步脚本
将 Obsidian 日记同步到 Hexo 博客

用法：
    python sync_diary_to_hexo.py              # 同步今天
    python sync_diary_to_hexo.py --all        # 同步所有
    python sync_diary_to_hexo.py --date 2026-01-21  # 指定日期
"""

import os
import re
from datetime import datetime
from pathlib import Path
import argparse

# 路径配置（自动检测 WSL/Windows）
import platform

# WSL 路径映射
def get_real_path(windows_path: str) -> Path:
    """将 Windows 路径转换为 WSL 路径"""
    release = platform.uname().release.lower()
    is_wsl = "wsl" in release or "microsoft" in release

    if platform.system() == "Linux" and is_wsl:
        # WSL 环境：手动转换 E:\000\... → /mnt/e/000/...
        path = windows_path.replace("\\", "/")
        if path.startswith("E:/"):
            path = "/mnt/e" + path[2:]
        elif path.startswith("C:/"):
            path = "/mnt/c" + path[2:]
        return Path(path)
    return Path(windows_path)

OBSIDIAN_DIARY_WIN = r"E:\000\knowledge\01-Daily\2026-02"
HEXO_DIARY_WIN = r"E:\000\Hexo\source\_posts\日记"

OBSIDIAN_DIARY_DIR = get_real_path(OBSIDIAN_DIARY_WIN)
HEXO_DIARY_DIR = get_real_path(HEXO_DIARY_WIN)

def parse_obsidian_frontmatter(content: str) -> dict:
    """解析 Obsidian YAML frontmatter"""
    lines = content.split('\n')
    metadata = {}
    body_start = 0

    if lines[0] == '---':
        for i, line in enumerate(lines[1:], 1):
            if line == '---':
                body_start = i + 1
                break
            # 解析 key: value 格式
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip()
                # 处理列表格式 (tags: \n  - 日记)
                if value == '' and i + 1 < len(lines) and lines[i + 1].strip().startswith('-'):
                    # 这是一个列表
                    list_values = []
                    j = i + 1
                    while j < len(lines) and not lines[j].startswith('---') and lines[j].strip().startswith('-'):
                        list_values.append(lines[j].strip()[2:].strip())
                        j += 1
                    metadata[key] = list_values
                else:
                    metadata[key] = value

    # 提取正文
    body = '\n'.join(lines[body_start:])

    return metadata, body

def convert_to_hexo_frontmatter(metadata: dict, body: str, date_str: str) -> str:
    """转换为 Hexo frontmatter 格式"""

    # 从 Obsidian metadata 获取值，或使用默认值
    title = metadata.get('title', f'{date_str}日复盘')
    orig_date = metadata.get('date', f'{date_str} 00:00:00')
    abbrlink = metadata.get('abbrlink', '')

    # 处理 tags：Obsidian 是列表 ['日记']，Hexo 要单行 '日记'
    tags = metadata.get('tags', [])
    if isinstance(tags, list):
        tags_str = '日记' if '日记' in tags else tags[0] if tags else '日记'
    else:
        tags_str = tags

    # cover 路径调整
    cover = metadata.get('cover', '/img/riji.png')

    # 构建 Hexo frontmatter
    hexo_fm = f"""---
title: {title}
tags: {tags_str}
categories:
  - 日记
cover: {cover}"""

    if abbrlink:
        hexo_fm += f"\nabbrlink: {abbrlink}"

    hexo_fm += f"\ndate: {orig_date}"
    hexo_fm += "\n---\n\n"

    return hexo_fm + body

def sync_diary(diary_path: Path, hexo_dir: Path):
    """同步单篇日记"""
    # 读取内容
    content = diary_path.read_text(encoding='utf-8')

    # 解析 Obsidian 格式
    metadata, body = parse_obsidian_frontmatter(content)

    # 解析日期
    date_match = re.search(r'(\d{4}-\d{2}-\d{2})', diary_path.stem)
    if date_match:
        date_str = date_match.group(1)
    else:
        date_str = datetime.now().strftime("%Y-%m-%d")

    # 转换为 Hexo 格式
    hexo_content = convert_to_hexo_frontmatter(metadata, body, date_str)

    # 写入 Hexo 目录（文件名保持不变）
    filename = diary_path.name  # 保持原文件名，如 2026-01-21.md
    output_path = hexo_dir / filename
    output_path.write_text(hexo_content, encoding='utf-8')

    print(f"  ✓ {date_str} → {output_path.name}")

def sync_all():
    """同步所有日记"""
    obsidian_dir = Path(OBSIDIAN_DIARY_DIR)
    hexo_dir = Path(HEXO_DIARY_DIR)

    hexo_dir.mkdir(parents=True, exist_ok=True)

    # 只同步日期格式的日记，排除周复盘等
    diaries = sorted(obsidian_dir.glob("2026-01-*.md"))
    print(f"找到 {len(diaries)} 篇日记，开始同步...\n")

    for diary in diaries:
        sync_diary(diary, hexo_dir)

    print(f"\n✅ 同步完成！共 {len(diaries)} 篇")

def sync_today():
    """同步今天的日记"""
    today = datetime.now().strftime("%Y-%m-%d")
    diary_path = Path(OBSIDIAN_DIARY_DIR) / f"{today}.md"

    if not diary_path.exists():
        print(f"❌ 今天的日记不存在: {diary_path}")
        return

    hexo_dir = Path(HEXO_DIARY_DIR)
    hexo_dir.mkdir(parents=True, exist_ok=True)

    sync_diary(diary_path, hexo_dir)
    print("\n✅ 今日日记同步完成！")

def sync_date(date_str: str):
    """同步指定日期的日记"""
    diary_path = Path(OBSIDIAN_DIARY_DIR) / f"{date_str}.md"

    if not diary_path.exists():
        print(f"❌ 日记不存在: {diary_path}")
        return

    hexo_dir = Path(HEXO_DIARY_DIR)
    hexo_dir.mkdir(parents=True, exist_ok=True)

    sync_diary(diary_path, hexo_dir)
    print("\n✅ 指定日记同步完成！")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='同步日记到 Hexo')
    parser.add_argument('--all', action='store_true', help='同步所有日记')
    parser.add_argument('--date', type=str, help='指定日期 (YYYY-MM-DD)')
    args = parser.parse_args()

    if args.all:
        sync_all()
    elif args.date:
        sync_date(args.date)
    else:
        sync_today()
