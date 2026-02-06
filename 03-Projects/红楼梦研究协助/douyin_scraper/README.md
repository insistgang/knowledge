# 抖音红学视频爬取工具

用于新红学研究项目，爬取抖音平台红学相关短视频数据。

## 项目结构

```
douyin_scraper/
├── main.py          # 主程序入口（交互式命令行）
├── scraper.py       # 爬虫核心模块
├── config.py        # 配置文件
├── test.py          # 测试脚本
├── requirements.txt # 依赖
└── data/            # 数据输出目录
    ├── cookies.json       # 登录Cookie（自动生成）
    ├── videos_*.csv       # 爬取的视频数据
    ├── scraper.log        # 日志文件
    └── debug_page.html    # 调试用页面HTML
```

## 安装

### 1. 安装Python依赖

```bash
pip install -r requirements.txt
```

### 2. 安装浏览器

```bash
playwright install chromium
```

## 使用方法

### 启动程序

```bash
python main.py
```

### 可用命令

| 命令 | 说明 |
|------|------|
| `login` | 登录抖音（扫码登录） |
| `user [名字]` | 搜索用户，如 `user 大车轱辘` |
| `search [关键词]` | 搜索视频，如 `search 红楼梦` |
| `goto <url>` | 访问指定URL |
| `scroll [次数]` | 向下滚动页面加载更多 |
| `get` | 获取当前页面的视频列表 |
| `save` | 保存已收集的数据 |
| `status` | 查看收集状态 |
| `clear` | 清空收集的数据 |
| `help` | 显示帮助 |
| `quit` | 退出程序 |

### 推荐操作流程

```
>>> login                    # 1. 先登录
(在浏览器中扫码登录)

>>> user 大车轱辘            # 2. 搜索目标博主
(在浏览器中点击进入博主主页)

>>> scroll 5                 # 3. 滚动加载更多视频
>>> get                      # 4. 获取视频列表

>>> user 正电兔              # 5. 换下一个博主，重复
...

>>> save                     # 6. 保存数据
```

## 登录说明

1. 执行 `login` 命令后，浏览器会打开抖音首页
2. 使用抖音APP扫码登录
3. 登录成功后，Cookie会自动保存
4. 下次启动程序会自动加载Cookie，无需重复登录

## 输出数据

保存的CSV文件包含以下字段：

| 字段 | 说明 |
|------|------|
| video_id | 视频ID |
| text | 视频标题/描述 |
| is_hongxue | 是否红学相关 |
| keywords | 匹配的红学关键词 |
| crawl_time | 爬取时间 |

## 红学关键词

程序会自动识别以下关键词相关的视频：

- 红楼梦、红学、新红学
- 贾宝玉、林黛玉、薛宝钗、王熙凤
- 曹雪芹、高鹗、脂砚斋
- 大观园、荣国府

可以在 `config.py` 中修改关键词列表。

## 注意事项

1. **需要本地运行** - 此程序需要在本地电脑运行，需要显示浏览器窗口
2. **登录后操作** - 建议先登录再进行爬取，否则可能遇到限制
3. **适度使用** - 不要频繁大量爬取，以免触发风控
4. **数据用途** - 仅供学术研究使用

## 故障排除

### 问题：浏览器启动失败
```bash
# 重新安装浏览器
playwright install chromium --force
```

### 问题：页面一直显示登录
- 检查Cookie是否保存成功
- 尝试删除 `data/cookies.json` 重新登录

### 问题：获取不到视频
- 确保页面已完全加载
- 尝试多滚动几次 `scroll 5`
- 检查 `data/debug_page.html` 文件内容

## 目标博主

预设的红学博主：
- 大车轱辘
- 正电兔
- 吃瓜蒙主

可以在 `config.py` 的 `TARGET_BLOGGERS` 中添加更多。
