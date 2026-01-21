# Leo 的知识库

> Claude Code 项目根提示词文件

## 项目概览

这是一个个人知识管理系统，使用 Obsidian 构建，采用**编号式结构**：

| 模块 | 路径 | 用途 |
|------|------|------|
| 📥 收件箱 | `00-Inbox/` | 快速捕获，待整理 |
| 📝 每日记录 | `01-Daily/` | 每日复盘、习惯打卡 |
| 📚 论文核心 | `02-Thesis/` | 文献、实验、撰写 |
| 📁 项目管理 | `03-Projects/` | 项目资料与进度 |
| 🏆 竞赛专区 | `04-Competitions/` | 各类竞赛资料 |
| 💻 技术库 | `05-Tech/` | CV、DL、工具 |
| 🌱 个人成长 | `06-Growth/` | 健康、教资、理财 |
| 📦 资源汇总 | `07-Resources/` | 链接、代码、模板 |
| 📎 附件 | `Attachments/` | 图片、PDF、文件 |
| 🤖 提示词助手 | `提示词助手/` | AI助手提示词模板 |

---

## 详细结构

```
knowledge/
├── 00-Inbox/                    # 快速捕获
│   └── claude.md
│
├── 01-Daily/                    # 每日记录
│   ├── 2025-12/                 # 历史日记
│   ├── 2026-01/                 # 当前日记
│   ├── ChatHistory/             # Claude聊天记录
│   ├── Templates/               # 模板文件
│   └── claude.md
│
├── 02-Thesis/                   # 论文核心
│   ├── Literature/              # 文献笔记（30篇）
│   ├── Experiments/             # 实验记录
│   ├── Writing/                 # 论文撰写
│   └── claude.md
│
├── 03-Projects/                 # 项目管理
│   ├── 中国电信合作/
│   ├── 中电科50所/
│   ├── 红楼梦研究协助/
│   └── claude.md
│
├── 04-Competitions/             # 竞赛专区
│   ├── 美赛/                    # 美赛建模资料
│   └── claude.md
│
├── 05-Tech/                     # 技术知识库
│   ├── CV/                      # 计算机视觉
│   ├── DeepLearning/            # 深度学习
│   ├── Tools/
│   │   ├── Claude-Code/         # Claude Code使用心得
│   │   ├── Obsidian/            # Obsidian使用指南
│   │   ├── Git/
│   │   └── Python环境/
│   ├── 小程序/                  # 小程序开发问题
│   ├── SmartCity/
│   └── claude.md
│
├── 06-Growth/                   # 个人成长
│   ├── Education/               # 教师资格证备考
│   ├── Finance/                 # 记账理财
│   ├── Party/                   # 党建相关
│   ├── Health/                  # 健康管理
│   └── Reflection/             # 深度反思
│
├── 07-Resources/                # 资源汇总
│   ├── 常用链接.md
│   └── 模板库.md
│
├── Attachments/                 # 附件存放
│   ├── images/
│   ├── pdfs/
│   └── files/
│
├── 提示词助手/                   # 独立模块
│   ├── claude.md
│   ├── 体育生命题专家.md
│   ├── 体重管理.md
│   ├── 小程序修复助手.md
│   └── 美赛建模智能体.md
│
├── claude.md                    # 本文件
└── obsidian-workflow-insistgang.md  # 工作流文档
```

---

## Claude Code 工作指南

### 进入特定模式

| 指令                   | 行为            | 读取配置                            |
| -------------------- | ------------- | ------------------------------- |
| "今日复盘" / "写日记"       | 读取昨日复盘，引导今日记录 | `01-Daily/claude.md`            |
| "读论文" / "论文笔记"       | 进入论文阅读模式      | `02-Thesis/claude.md`           |
| "教资" / "备考"          | 进入教资备考模式      | `06-Growth/Education/claude.md` |
| "记账" / "理财" / "财务复盘" | 进入财务复盘模式      | `06-Growth/Finance/claude.md`   |
| "美赛" / "建模"          | 进入美赛准备模式      | `04-Competitions/美赛/claude.md`  |

### 通用规则

1. **文件操作前先询问** - 涉及多个文件修改时，先确认
2. **保持格式一致** - 遵循各模块的模板规范
3. **双向链接** - 使用 `[[文件名]]` 格式创建关联
4. **日期格式** - 统一使用 `YYYY-MM-DD` 格式

### 每日流程

```
07:00  起床，查看今日笔记模板
08:00-12:00  核心工作时间（随时记录到 00-Inbox/）
12:00  午餐，简单回顾上午
14:00-18:00  项目/实验时间
18:00  晚餐
19:00  固定散步
19:30-22:00  黄金效率时段（论文30分钟在此完成）
22:00  晚间复盘，整理 00-Inbox/ → 对应文件夹
22:30  结束工作
```

---

## 模板文件

| 模板 | 位置 |
|------|------|
| 每日笔记 | `01-Daily/Templates/daily-template.md` |
| 周复盘 | `01-Daily/Templates/weekly-review-template.md` |
| 文献笔记 | `02-Thesis/Writing/paper-template.md` |
| 实验记录 | `02-Thesis/Writing/experiment-template.md` |

---

## 项目状态

- 最后更新：2026-01-15
- 当前阶段：论文阅读 + 教资备考 + 理财规划
- 已完成迁移：✓ 所有文件已迁移到新结构

---

> 当你需要我操作某个特定模块时，我会自动读取该模块的 claude.md 获取上下文。
