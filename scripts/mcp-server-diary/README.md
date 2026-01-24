# Diary MCP Server

用于查询和管理 Obsidian 日记的 MCP Server。

## 功能

| 工具 | 描述 |
|------|------|
| `list_diaries` | 列出所有日记 |
| `read_diary` | 读取指定日期的日记 |
| `search_diaries` | 搜索关键词 |
| `get_diary_summary` | 获取日记摘要 |
| `search_by_state` | 按精力/情绪搜索 |
| `get_habits_summary` | 习惯打卡统计 |

## 安装

```bash
pip install mcp
```

## 配置 Claude Code

编辑 `~/.claude/config.json`，添加：

```json
{
  "mcpServers": {
    "diary": {
      "command": "python",
      "args": ["/mnt/e/000/knowledge/scripts/mcp-server-diary/diary_server.py"]
    }
  }
}
```

Windows 下使用绝对路径：
```json
{
  "mcpServers": {
    "diary": {
      "command": "python",
      "args": ["E:\\000\\knowledge\\scripts\\mcp-server-diary\\diary_server.py"]
    }
  }
}
```

## 使用示例

在 Claude Code 中：

```
# 列出最近7天的日记
请使用 diary MCP 工具列出最近的日记

# 搜索包含"小程序"的日记
请用 diary MCP 工具搜索"小程序"

# 查看2026-01-21的日记
请读取 2026-01-21 的日记

# 查看精力状态好的日记
请搜索精力>=8的日记

# 习惯统计
请查看最近7天的习惯打卡情况
```

## 资源 URI

- `diary://2026-01-21` - 读取指定日期的日记
