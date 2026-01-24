#!/usr/bin/env python3
"""
Diary MCP Server
提供日记查询、搜索、列表等功能

安装依赖：
    pip install mcp

运行服务：
    python diary_server.py

在 Claude Code 中连接：
    在 .claude/config.json 中添加：
    {
      "mcpServers": {
        "diary": {
          "command": "python",
          "args": ["/mnt/e/000/knowledge/scripts/mcp-server-diary/diary_server.py"]
        }
      }
    }
"""

import asyncio
import re
from datetime import datetime
from pathlib import Path
from typing import Any

# 导入 MCP 相关模块
try:
    from mcp.server.models import InitializationOptions
    from mcp.server import NotificationOptions, Server
    from mcp.server.stdio import stdio_server
    from mcp.types import (
        Resource,
        Tool,
        TextContent,
        ImageContent,
        EmbeddedResource,
    )
except ImportError:
    print("请先安装 mcp: pip install mcp")
    exit(1)

import platform

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

# 创建 Server 实例
server = Server("diary-server")

# 获取所有日记文件
def get_diary_files() -> list[Path]:
    """获取所有日记文件，按日期排序"""
    diary_path = Path(DIARY_DIR)
    if not diary_path.exists():
        return []
    return sorted(diary_path.glob("2026-01-*.md"))

# 解析日记 frontmatter 和内容
def parse_diary(file_path: Path) -> dict[str, Any]:
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
                # 处理列表格式
                if value == '' and i + 1 < len(lines) and lines[i + 1].strip().startswith('-'):
                    list_values = []
                    j = i + 1
                    while j < len(lines) and not lines[j].startswith('---') and lines[j].strip().startswith('-'):
                        list_values.append(lines[j].strip()[2:].strip())
                        j += 1
                    metadata[key] = list_values
                else:
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

# ==================== Resources ====================

@server.list_resources()
async def handle_list_resources() -> list[Resource]:
    """列出所有可用的日记资源"""
    files = get_diary_files()
    resources = []

    for file in files:
        date = file.stem
        resources.append(
            Resource(
                uri=f"diary://{date}",
                name=f"日记: {date}",
                description=f"查看 {date} 的日记内容",
                mimeType="text/markdown"
            )
        )

    return resources

@server.read_resource()
async def handle_read_resource(uri: str) -> str:
    """读取指定日记内容"""
    if uri.startswith("diary://"):
        date = uri.replace("diary://", "")
        file_path = Path(DIARY_DIR) / f"{date}.md"

        if file_path.exists():
            diary = parse_diary(file_path)
            return diary["full_content"]
        else:
            return f"# 日记不存在\n\n日期 {date} 的日记文件不存在。"

    return "未知的资源 URI"

# ==================== Tools ====================

@server.list_tools()
async def handle_list_tools() -> list[Tool]:
    """列出所有可用的工具"""
    return [
        Tool(
            name="list_diaries",
            description="列出所有日记，可以指定数量限制",
            inputSchema={
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "number",
                        "description": "返回的日记数量限制",
                        "default": 10
                    },
                    "recent": {
                        "type": "boolean",
                        "description": "是否只返回最近的日记",
                        "default": True
                    }
                }
            }
        ),
        Tool(
            name="read_diary",
            description="读取指定日期的日记完整内容",
            inputSchema={
                "type": "object",
                "properties": {
                    "date": {
                        "type": "string",
                        "description": "日记日期，格式: YYYY-MM-DD，例如: 2026-01-21"
                    }
                },
                "required": ["date"]
            }
        ),
        Tool(
            name="search_diaries",
            description="在所有日记中搜索关键词",
            inputSchema={
                "type": "object",
                "properties": {
                    "keyword": {
                        "type": "string",
                        "description": "要搜索的关键词"
                    },
                    "limit": {
                        "type": "number",
                        "description": "返回结果数量限制",
                        "default": 5
                    }
                },
                "required": ["keyword"]
            }
        ),
        Tool(
            name="get_diary_summary",
            description="获取日记的摘要信息（标题、日期、状态等）",
            inputSchema={
                "type": "object",
                "properties": {
                    "date": {
                        "type": "string",
                        "description": "日记日期，格式: YYYY-MM-DD"
                    }
                },
                "required": ["date"]
            }
        ),
        Tool(
            name="search_by_state",
            description="根据精力/情绪状态搜索日记",
            inputSchema={
                "type": "object",
                "properties": {
                    "min_energy": {
                        "type": "number",
                        "description": "最低精力分数 (0-10)",
                        "default": 0
                    },
                    "min_mood": {
                        "type": "number",
                        "description": "最低情绪分数 (0-10)",
                        "default": 0
                    }
                }
            }
        ),
        Tool(
            name="get_habits_summary",
            description="获取习惯打卡的统计（论文、运动、喝水、饮食）",
            inputSchema={
                "type": "object",
                "properties": {
                    "days": {
                        "type": "number",
                        "description": "统计最近几天的数据",
                        "default": 7
                    }
                }
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[TextContent | ImageContent | EmbeddedResource]:
    """处理工具调用"""

    # ===== list_diaries: 列出日记 =====
    if name == "list_diaries":
        files = get_diary_files()
        limit = arguments.get("limit", 10)
        recent = arguments.get("recent", True)

        if recent:
            files = files[-limit:]

        result = "# 日记列表\n\n"
        for file in files:
            date = file.stem
            diary = parse_diary(file)
            title = diary["metadata"].get("title", date)
            result += f"- **{date}**: {title}\n"

        result += f"\n共 {len(files)} 篇日记"
        return [TextContent(type="text", text=result)]

    # ===== read_diary: 读取日记 =====
    elif name == "read_diary":
        date = arguments.get("date")
        if not date:
            return [TextContent(type="text", text="错误: 请提供日期参数")]

        file_path = Path(DIARY_DIR) / f"{date}.md"

        if not file_path.exists():
            return [TextContent(type="text", text=f"错误: 日期 {date} 的日记不存在")]

        diary = parse_diary(file_path)
        return [TextContent(type="text", text=diary["full_content"])]

    # ===== search_diaries: 搜索日记 =====
    elif name == "search_diaries":
        keyword = arguments.get("keyword", "")
        limit = arguments.get("limit", 5)

        if not keyword:
            return [TextContent(type="text", text="错误: 请提供搜索关键词")]

        files = get_diary_files()
        results = []

        for file in files:
            diary = parse_diary(file)
            # 搜索标题和正文
            if keyword in diary["body"] or keyword in diary["metadata"].get("title", ""):
                # 提取匹配的上下文
                body_lines = diary["body"].split('\n')
                contexts = []
                for i, line in enumerate(body_lines):
                    if keyword in line:
                        start = max(0, i - 1)
                        end = min(len(body_lines), i + 2)
                        context = '\n'.join(body_lines[start:end])
                        contexts.append(context)

                results.append({
                    "date": diary["date"],
                    "title": diary["metadata"].get("title", diary["date"]),
                    "contexts": contexts[:3]  # 最多3个上下文
                })

        if not results:
            return [TextContent(type="text", text=f"未找到包含关键词 '{keyword}' 的日记")]

        # 格式化结果
        result_text = f"# 搜索结果: '{keyword}'\n\n"
        for r in results[:limit]:
            result_text += f"## {r['date']} - {r['title']}\n\n"
            for ctx in r['contexts']:
                result_text += f"```\n{ctx}\n```\n\n"
            result_text += "---\n\n"

        result_text += f"\n共找到 {len(results)} 篇相关日记"
        return [TextContent(type="text", text=result_text)]

    # ===== get_diary_summary: 获取日记摘要 =====
    elif name == "get_diary_summary":
        date = arguments.get("date")
        if not date:
            return [TextContent(type="text", text="错误: 请提供日期参数")]

        file_path = Path(DIARY_DIR) / f"{date}.md"

        if not file_path.exists():
            return [TextContent(type="text", text=f"错误: 日期 {date} 的日记不存在")]

        diary = parse_diary(file_path)
        metadata = diary["metadata"]
        body = diary["body"]

        # 提取状态信息
        state_match = re.search(r'精力\s+(\d+)/10.*?情绪\s+(\d+)/10', body)
        energy = state_match.group(1) if state_match else "未知"
        mood = state_match.group(2) if state_match else "未知"

        # 提取感悟
        insights_match = re.search(r'## 感悟\s*\n>(.*?)\n', body, re.DOTALL)
        insight = insights_match.group(1).strip() if insights_match else "无"

        result = f"""# {date} 日记摘要

**标题**: {metadata.get('title', date)}
**日期**: {metadata.get('date', date)}
**精力**: {energy}/10
**情绪**: {mood}/10

## 核心感悟
> {insight}

## 正文预览
{body[:500]}...
"""

        return [TextContent(type="text", text=result)]

    # ===== search_by_state: 按状态搜索 =====
    elif name == "search_by_state":
        min_energy = arguments.get("min_energy", 0)
        min_mood = arguments.get("min_mood", 0)

        files = get_diary_files()
        results = []

        for file in files:
            diary = parse_diary(file)
            body = diary["body"]

            state_match = re.search(r'精力\s+(\d+)/10.*?情绪\s+(\d+)/10', body)
            if state_match:
                energy = int(state_match.group(1))
                mood = int(state_match.group(2))

                if energy >= min_energy and mood >= min_mood:
                    results.append({
                        "date": diary["date"],
                        "title": diary["metadata"].get("title", diary["date"]),
                        "energy": energy,
                        "mood": mood
                    })

        if not results:
            return [TextContent(type="text", text=f"未找到符合条件 (精力>={min_energy}, 情绪>={min_mood}) 的日记")]

        result_text = f"# 按状态搜索结果 (精力>={min_energy}, 情绪>={min_mood})\n\n"
        for r in results:
            result_text += f"- **{r['date']}**: {r['title']} (精力 {r['energy']}/10, 情绪 {r['mood']}/10)\n"

        return [TextContent(type="text", text=result_text)]

    # ===== get_habits_summary: 习惯统计 =====
    elif name == "get_habits_summary":
        days = arguments.get("days", 7)

        files = get_diary_files()[-days:]

        habits = {
            "论文": 0,
            "运动": 0,
            "喝水": 0,
            "饮食": 0
        }

        total = len(files)

        for file in files:
            diary = parse_diary(file)
            body = diary["body"]

            # 简单检查习惯完成情况
            if "论文" in body and ("✅" in body or "完成" in body):
                habits["论文"] += 1
            if "运动" in body or "散步" in body or "健身" in body:
                habits["运动"] += 1
            if "喝水" in body and ("✅" in body or "L" in body or "ml" in body):
                habits["喝水"] += 1
            if "饮食" in body or "午：" in body or "晚：" in body:
                habits["饮食"] += 1

        result = f"# 习惯打卡统计 (最近 {total} 天)\n\n"
        result += "| 习惯 | 完成天数 | 完成率 |\n"
        result += "|------|---------|-------|\n"

        for habit, count in habits.items():
            rate = f"{count/total*100:.1f}%" if total > 0 else "0%"
            result += f"| {habit} | {count}/{total} | {rate} |\n"

        return [TextContent(type="text", text=result)]

    else:
        return [TextContent(type="text", text=f"未知的工具: {name}")]

# ==================== Main ====================

async def main():
    """启动 MCP 服务器"""
    # 运行服务器
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="diary-server",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                )
            )
        )

if __name__ == "__main__":
    asyncio.run(main())
