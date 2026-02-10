# C盘分析报告

生成时间：2026-02-07
分析范围：C盘全部内容
系统版本：Windows 10.0.19045.3754

---

## 一、磁盘空间概览

| 项目 | 大小 |
|------|------|
| 总容量 | 378 GB |
| 已使用 | 193 GB (52%) |
| 可用空间 | 185 GB |

---

## 二、空间占用TOP 10 (精确数据)

| 排名 | 目录 | 大小 | 说明 |
|------|------|------|------|
| 1 | C:\Users | 130 GB | 用户文件夹 (占总使用67%) |
| 2 | C:\Windows | 18-20 GB | 系统文件 |
| 3 | C:\Program Files | 18 GB | 64位程序 |
| 4 | C:\ProgramData | 9.4 GB | 公共程序数据 |
| 5 | C:\Program Files (x86) | 8.8-12 GB | 32位程序 |
| 6 | C:\Python312 | 7.8-8.2 GB | Python开发环境 |
| 7 | C:\Users\Administrator\Desktop | 17.6 GB | 桌面文件 |
| 8 | C:\Users\Administrator\.cache | 8.9 GB | 缓存文件 |
| 9 | C:\Users\Administrator\AppData\Local\Google | 10.9 GB | Chrome浏览器 |
| 10 | C:\Users\Administrator\AppData\Local\Packages | 15.3 GB | WSL/Ubuntu |

---

## 三、用户目录分析 (C:\Users\Administrator - 约120GB)

### 3.1 主要文件夹大小

| 目录 | 大小 | 说明 |
|------|------|------|
| AppData\Local | 49 GB | 本地应用数据 |
| AppData\Roaming | 39 GB | 漫游应用数据 |
| .cache | 8.9 GB | 缓存文件夹 |
| .vscode | 2.2 GB | VS Code数据 |
| .claude | 1.8 GB | Claude AI配置 |
| .cursor | 871 MB | Cursor编辑器 |
| .gemini | 743 MB | Gemini AI |
| AppData\LocalLow | 1017 MB | 低权限应用数据 |

### 3.2 桌面内容

**开发项目文件夹：**
- code/ - 包含多个项目：
  - ai_tutor2
  - demo_hot_study
  - douyin_scraper
  - k12
  - meisai
  - suo_50
  - test
  - xcx
  - 导师项目报告
  - 论文
  - 文字打码项目
  - 西门子发票及凭证
  - 新快捷方式.lnk

- Leo-demos/ - AI中文学习助手项目
- ruanzhu/ - 软注相关项目

**桌面快捷方式：**
- Adobe系列：Photoshop 2024, After Effects 2024, Premiere Pro 2024
- 开发工具：Dev-C++, Cursor, VS Code
- AI工具：AutoGLM, Kimi, Trae, Claude
- 其他：EV录屏, Fliqlo屏保, UU远程, Telegram, Origin 2025b

### 3.3 AppData\Local 大型文件夹

| 应用 | 大小 | 说明 |
|------|------|------|
| Google | 11 GB | Chrome浏览器数据 |
| Packages | 16 GB | WSL Ubuntu (15GB) |
| Microsoft | 3.2 GB | 微软应用 |
| npm-cache | 2.5 GB | NPM包缓存 |
| MathWorks | 2.1 GB | MATLAB相关 |
| 微信开发者工具 | 1.4 GB | |
| Programs | 1.4 GB | 本地程序 |
| NetEase | 1.3 GB | 网易应用 |
| JetBrains | 1.1 GB | IDE配置 |
| ima.copilot | 842 MB | |
| Steam | 559 MB | |
| Temp | 540 MB | 临时文件 |
| ms-playwright | 492 MB | |
| Quark | 469 MB | 夸克浏览器 |
| DingTalk | 460 MB | 钉钉 |
| OfficePLUS | 442 MB | |
| lm-studio-updater | 415 MB | LLM工具 |
| chatboxapp-updater | 370 MB | |
| conda | 335 MB | Python环境 |

### 3.4 AppData\Roaming 大型文件夹

| 应用 | 大小 | 说明 |
|------|------|------|
| Code | 2.4 GB | VS Code数据 |
| 360se6 | - | 360浏览器 |
| Adobe | - | Adobe软件数据 |
| Cursor | 132 MB | |
| Claude | - | Claude AI |
| clash_win | - | 代理工具 |

### 3.5 AI/开发工具缓存 (.cache)

| 缓存类型 | 大小 |
|----------|------|
| huggingface | 7.9 GB |
| puppeteer | 639 MB |
| modelscope | 363 MB |
| selenium | 35 MB |
| torch | 2.8 MB |

---

## 四、已安装程序分析

### 4.1 Program Files (64位程序 - 18GB)

**创意设计：**
- Maxon Cinema 4D 2023
- Adobe系列（通过Creative Cloud）

**开发工具：**
- GitHub CLI
- nodejs (v18.18.2, npm 9.8.1)
- Microsoft Visual Studio 10.0
- Microsoft.NET
- MSBuild
- dotnet

**办公/生产力：**
- Microsoft Office
- Microsoft Office 15
- Microsoft OfficePLUS
- Microsoft SQL Server (含MSSQL15.WINCC)

**浏览器/通讯：**
- Google Chrome
- Internet Explorer

**安全/系统：**
- Norton Security
- AntiCheatExpert
- ENE
- GIGABYTE（技嘉工具）
- HP（惠普工具）
- Intel工具
- Npcap（网络抓包）

**媒体/娱乐：**
- JianyingPro（剪映专业版）
- IQIYI Video（爱奇艺）
- NetEase（网易）
- MuMuVMMVbox（模拟器）

**其他：**
- Application Verifier
- ModifiableWindowsApps

### 4.2 Program Files (x86) (32位程序 - 8.8GB)

**开发工具：**
- Microsoft Visual Studio
- Microsoft SDKs
- Reference Assemblies
- OPC Foundation
- dotnet
- MSBuild

**图形/硬件：**
- NVIDIA Corporation（显卡驱动）
- NVIDIA PhysX
- Realtek（声卡驱动）

**办公软件：**
- Microsoft Office
- Microsoft OneDrive
- Kingsoft（金山办公）
- MasterPDF

**工具：**
- Intel
- HP
- GIGABYTE
- Application Verifier
- InstallShield Installation Information

**其他：**
- AlibabaProtect（阿里保护）
- ByteDance（字节跳动）
- QuarkUpdater（夸克更新）
- SIEMENS（西门子）

### 4.3 Python开发环境

- Python 3.12.6 (C:\Python312 - 8.2GB)
- pip 25.2
- conda环境配置存在

---

## 五、特殊系统文件夹

### 5.1 系统文件夹

| 文件夹 | 大小 | 说明 |
|--------|------|------|
| Windows | 18 GB | 系统核心文件 |
| Boot | - | 启动配置 |
| Recovery | 5 KB | 恢复分区（几乎没有内容） |
| System Volume Information | 6 KB | 系统还原点（几乎为空） |

### 5.2 其他特殊文件夹

| 文件夹 | 大小 | 说明 |
|--------|------|------|
| Config.Msi | 4.2 MB | 安装配置 |
| $RECYCLE.BIN | - | 回收站（权限限制无法读取） |
| swapfile.sys | 256 MB | 虚拟内存交换文件 |
| DumpStack.log | 8 KB | 系统崩溃日志 |

### 5.3 第三方应用根目录文件夹

| 文件夹 | 大小 | 说明 |
|--------|------|------|
| CloudMusic | 0 B | 网易云音乐（空文件夹） |
| Python312 | 8.2 GB | Python开发环境 |
| KingsoftData | 0 B | 金山数据（空文件夹） |
| 图吧工具箱 | 30 MB | 硬件检测工具 |
| AX NF ZZ | 660 KB | SIS芯片组驱动文件（.EKB格式） |
| Intel | 36 KB | Intel相关文件 |

---

## 六、开发环境配置

### 6.1 版本控制
- Git配置用户：insistgang <insistgang@163.com>
- 使用Git LFS
- 配置了HTTP代理（127.0.0.1:7890）

### 6.2 开发工具
- **编辑器：**
  - VS Code (2.2GB数据)
  - Cursor (871MB数据)
  - Dev-C++

- **AI辅助工具：**
  - Claude (1.8GB)
  - Cursor AI (871MB)
  - Gemini (743MB)
  - AutoGLM
  - Kimi
  - Trae
  - ima.copilot
  - LM Studio
  - Chatbox

- **IDE：**
  - JetBrains PyCharm CE 2024.3
  - Microsoft Visual Studio 10.0

### 6.3 运行时环境
- Node.js v18.18.2 + npm 9.8.1
- Python 3.12.6 + pip 25.2
- Conda环境
- .NET Framework
- SQL Server

### 6.4 浏览器
- Google Chrome (11GB数据)
- Chrome for Testing
- 360浏览器 (360se6)
- 夸克浏览器 (Quark)

---

## 七、媒体内容

### Videos文件夹内容
- 《AI改变生活的24小时》.mp4
- 多个录屏文件（OBS Studio捕获）
- NVIDIA ShadowPlay录制

### Music文件夹
- 仅包含desktop.ini（基本为空）

---

## 八、空间优化建议

### 8.1 可清理项目 (详细清单)

| 项目 | 预计释放空间 | 风险 | 位置 |
|------|-------------|------|------|
| **tests2.rar压缩包** | 406 MB | 低 | Desktop\code\suo_50\area_calc\ |
| npm缓存 | ~2.4 GB | 低 | AppData\Local\npm-cache |
| Huggingface缓存 | ~7.9 GB | 低（如不需要模型） | .cache\huggingface |
| Chrome浏览器缓存 | 部分 | 低 | AppData\Local\Google |
| 各种updater文件夹 | ~3 GB | 低 | AppData\Local\*-updater |
| WSL Ubuntu | 15 GB | 中（如不使用Linux） | AppData\Local\Packages |
| Windows\Installer | ~2.7 GB | 中（安装程序缓存） | Windows\Installer |
| AppData\Local\Temp | ~540 MB | 低 | AppData\Local\Temp |
| Config.Msi旧文件 | 4.2 MB | 低 | C:\Config.Msi |
| 回收站 | 9.2 MB | 低 | C:\$RECYCLE.BIN |
| 视频测试文件 | ~230 MB | 低 | Desktop\code\suo_50\area_calc\*.mp4 |
| WPS云盘同步数据 | 8.78 GB | 中 | WPSDrive (如不需要) |

### 8.2 特殊发现

1. **页文件配置:** 主页文件在D盘 (28 GB)，C盘仅有256 MB swapfile.sys
2. **系统还原点:** 几乎为空，建议启用以保护系统
3. **WSL Ubuntu:** 占用15 GB，如不使用Linux可删除
4. **西门子工业文件:** AX NF ZZ文件夹包含259个.EKB格式文件
5. **空文件夹残留:** CloudMusic、KingsoftData基本为空，可删除
6. **最大单个文件:** tests2.rar (406 MB) 位于 Desktop\code\suo_50\area_calc\

### 8.3 清理命令建议

```bash
# 清理npm缓存
npm cache clean --force

# 清理pip缓存
pip cache purge

# 清理Windows临时文件
# 运行磁盘清理工具：cleanmgr

# 清理WSL（如不使用）
wsl --unregister Ubuntu
```

### 8.3 迁移建议

1. **将大型开发工具迁移到其他分区**
   - Python环境 (8.2 GB)
   - Huggingface模型缓存 (7.9 GB)

2. **清理重复的AI工具数据**
   - 多个AI助手同时占用空间
   - 考虑卸载不常用的工具

3. **媒体文件迁移**
   - Videos文件夹中的视频文件

---

## 九、系统健康状态

| 项目 | 状态 |
|------|------|
| 磁盘空间使用率 | 52% - 良好 |
| 系统文件完整性 | 正常 |
| 回收站 | 无法检测（权限限制） |
| 系统还原点 | 几乎为空（建议创建） |
| 虚拟内存 | 正常（256MB交换文件） |

---

## 十、软件清单总结

### 设计创作类
- Adobe Photoshop 2024
- Adobe After Effects 2024
- Adobe Premiere Pro 2024
- Cinema 4D 2023

### 开发类
- VS Code
- Cursor
- PyCharm CE 2024.3
- Visual Studio 10.0
- Node.js 18.18.2
- Python 3.12.6
- Git/GitHub CLI
- SQL Server

### AI/辅助类
- Claude
- Gemini
- Cursor AI
- AutoGLM
- Kimi
- Trae
- ima.copilot
- LM Studio
- Chatbox

### 办公类
- Microsoft Office
- Kingsoft Office
- Origin 2025b
- MathType

### 媒体娱乐类
- 网易云音乐
- 剪映专业版
- 爱奇艺
- EV录屏

### 浏览器类
- Google Chrome
- 360浏览器
- 夸克浏览器

### 实用工具类
- 图吧工具箱
- Norton Security
- Telegram
- UU远程
- 钉钉
- Fliqlo屏保

---

## 系统配置详细信息

### 硬件配置
- **处理器**: 支持超线程 (检测到32GB内存)
- **内存**: 32 GB (当前空闲约8GB)
- **硬盘**: Kingston SNV2S 1TB NVMe SSD
- **显卡**: NVIDIA GeForce (驱动版本 552.22)
- **主板**: GIGABYTE 技嘉主板

### 已安装软件详细清单 (共150+款程序)

#### 微软官方产品
- Microsoft Office 专业增强版 2024 (中文版)
- Microsoft Visio 2024
- Microsoft SQL Server 2019
- Visual Studio 2019
- PowerShell 7
- Windows SDK
- Windows Subsystem for Linux (WSL)
- OneDrive
- Microsoft Edge

#### 开发工具与IDE
- Python 3.12.6 + Anaconda3 2024.06
- Node.js 18.18.2 + npm 9.8.1
- Git 2.46.1 + GitHub CLI 2.78.0
- PyCharm Community Edition 2024.3.3
- Cursor 2.3.21 (AI编辑器)
- Cherry Studio 1.7.15 (AI编程工具)
- Dev-C++ 5.11
- Eclipse Temurin JDK 21 (Java)

#### AI/LLM工具
- Claude (1.8 GB配置)
- Gemini (743 MB)
- Kimi (月之暗面)
- AutoGLM (智谱AI)
- LM Studio
- Chatbox
- Cursor AI

#### 设计与创作
- Adobe Photoshop 2024
- Adobe After Effects 2024
- Adobe Premiere Pro 2024
- Cinema 4D 2023
- OBS Studio 31.0.3
- Red Giant Magic Bullet Suite

#### 数据分析与科学计算
- IBM SPSS Statistics 27
- Origin 2025b
- LINGO 18.0
- MATLAB (MathWorks)
- MiKTeX 24.1 (LaTeX)

#### 笔记与文档
- Obsidian 1.10.6
- Notion
- Typora 1.9.4
- Zotero 7.0.30 (文献管理)
- Microsoft OneNote

#### 虚拟化与远程
- VMware Workstation 17.0.0
- WSL (Ubuntu 22.04 LTS)
- MuMu模拟器
- ToDesk
- Xshell 8 / Xftp 8

#### 浏览器
- Google Chrome (11 GB数据)
- Microsoft Edge
- 360浏览器
- 夸克浏览器
- Firefox

#### 国产软件
- 腾讯系: QQ、微信、腾讯会议、腾讯文档
- 字节系: 剪映专业版、抖音桌面版
- 阿里系: 钉钉、语雀
- 其他: 百度网盘、网易云音乐、迅雷、搜狗输入法

#### 游戏平台
- Steam
- Epic Games Launcher
- WeGame

#### 安全与工具
- Norton Security
- Windows Defender
- WinRAR
- Format Factory
- PotPlayer
- Navicat Premium 17.1
- Clash Verge 1.7.7 (代理)

---

## 结论

该C盘主要作为开发工作环境使用，用户为开发者/创作者，配置了强大的硬件系统（32GB内存、1TB NVMe SSD），安装了超过150款应用程序，涵盖：

1. **全栈开发环境**: Python、Node.js、Java、Git等多套开发工具
2. **AI/机器学习**: 多个AI助手和LLM工具
3. **创意设计**: Adobe全家桶、Cinema 4D等专业软件
4. **数据分析**: SPSS、Origin、MATLAB等专业分析工具
5. **虚拟化**: VMware、WSL等多种虚拟化方案

磁盘使用率为52%，处于健康水平。通过清理缓存、删除updater文件夹和不使用的WSL，可释放约15-35GB空间。

系统整体运行状态良好，建议定期清理缓存文件，并考虑将大型AI模型缓存和开发环境迁移到其他分区以获得更佳性能。
