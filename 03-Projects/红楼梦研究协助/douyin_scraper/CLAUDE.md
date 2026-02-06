# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概述

这是一个专门的网页爬取工具，用于收集抖音平台上与"红学"（《红楼梦》研究）相关的短视频，供学术研究使用。该工具使用 Playwright 进行浏览器自动化，具有反检测措施，并提供交互式命令行界面进行数据收集。

## 开发命令

### 环境配置
```bash
# 安装 Python 依赖
pip install -r requirements.txt

# 安装 Playwright 浏览器
playwright install chromium

# 运行测试验证配置
python test.py
```

### 运行应用
```bash
# 启动交互式命令行界面
python main.py
```

### 测试
```bash
# 运行所有测试
python test.py

# 单独运行浏览器测试
python -c "import asyncio; from test import test_browser; asyncio.run(test_browser())"
```

## 架构设计

### 核心组件

1. **main.py** - 程序入口，包含 `App` 类管理交互式命令行
   - 处理命令解析和执行
   - 管理视频收集和 CSV 导出（去重）
   - 使用 asyncio 进行异步操作

2. **scraper.py** - 核心爬虫引擎，包含 `DouyinScraper` 类
   - 使用 Playwright 进行浏览器自动化
   - Cookie 持久化保存登录会话
   - 反爬虫检测措施
   - 多选择器策略应对页面结构变化

3. **config.py** - 集中配置管理
   - `HONGXUE_KEYWORDS`：内容过滤的预定义关键词
   - `TARGET_BLOGGERS`：目标内容创作者列表
   - 路径配置

### 关键设计模式

- **异步编程**：所有浏览器操作都是异步的
- **Cookie 持久化**：会话保存到 `data/cookies.json`
- **多选择器策略**：多个 CSS 选择器处理页面结构变化
- **反检测措施**：自定义用户代理和移除 webdriver 属性

### 数据流程

1. 用户扫码登录 → Cookie 本地保存
2. 导航到用户/页面 → 滚动加载内容
3. 提取视频数据 → 根据红学关键词过滤
4. 内存收集 → 导出 CSV 并去重

## 交互式命令行

应用运行交互式命令行，支持以下命令：

- `login` - 打开浏览器进行扫码登录
- `user [名字]` - 搜索特定用户
- `search [关键词]` - 按关键词搜索视频
- `goto <url>` - 导航到指定 URL
- `scroll [次数]` - 滚动页面加载更多内容
- `get` - 提取当前页面的视频列表
- `save` - 将收集的数据导出为 CSV
- `status` - 显示收集统计信息
- `clear` - 清空已收集的数据
- `help` - 显示帮助信息
- `quit` - 退出程序

## 文件位置

- 数据输出：`data/videos_YYYYMMDD_HHMMSS.csv`
- 日志文件：`data/scraper.log`
- Cookie 文件：`data/cookies.json`
- 调试 HTML：`data/debug_page.html`

## 重要实现细节

### 浏览器配置
- 使用 Chromium 自定义用户代理
- 默认关闭无头模式便于调试
- 视口大小：1280x800
- 语言环境：zh-CN

### 内容过滤
视频包含以下内容时自动标记为红学相关：
- 主要术语："红楼梦"、"红学"、"新红学"
- 人物名称："贾宝玉"、"林黛玉"、"薛宝钗"、"王熙凤"
- 作者："曹雪芹"、"高鹗"、"脂砚斋"
- 地点："大观园"、"荣国府"

### 错误处理
- 全面的异常处理和详细日志记录
- 提取失败时自动保存 HTML 快照
- Cookie 损坏检测和恢复

## 开发注意事项

- 此工具仅供学术研究使用
- 需要在本地运行并显示浏览器窗口
- 通过受控滚动实现速率限制
- 无硬编码凭据或 API 密钥
- CSV 导出包含视频 ID、描述、红学相关性和时间戳