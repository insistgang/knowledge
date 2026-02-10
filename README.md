# Leo's Knowledge Base | 个人知识库

> 🧠 基于 Obsidian + Claude Code 构建的第二代个人知识管理系统
>
> 云端备份：[github.com/insistgang/knowledge](https://github.com/insistgang/knowledge)

---

## 📁 知识库结构

```
knowledge/
├── 📥 00-Inbox/          # 快速捕获，待整理
├── 📝 01-Daily/          # 每日记录、周/月/年复盘
├── 📚 02-Thesis/         # 论文核心：文献、实验、撰写
├── 📁 03-Projects/       # 项目管理：50所、软著、外包
├── 🏆 04-Competitions/   # 竞赛专区：美赛、金融科技
├── 💻 05-Tech/           # 技术库：CV、DL、工具笔记
├── 🌱 06-Growth/         # 个人成长：健康、教资、理财
├── 📦 07-Resources/      # 资源汇总：链接、代码、模板
├── 📎 Attachments/       # 附件：图片、PDF、文件
└── 🤖 提示词助手/         # AI 助手提示词模板
```

---

## 🚀 快速指令

### 复盘类
| 指令 | 行为 | 配置 |
|------|------|------|
| `今日复盘` / `写日记` | 整理日记并同步 Hexo | [`今日复盘skill.md`](./今日复盘skill.md) |
| `本周复盘` / `周复盘` | 周复盘，汇总本周数据 | [`01-Daily/周复盘skill.md`](./01-Daily/周复盘skill.md) |
| `本月复盘` / `月复盘` | 月度深度复盘 | [`01-Daily/月复盘skill.md`](./01-Daily/月复盘skill.md) |

### 论文类
| 指令 | 行为 | 配置 |
|------|------|------|
| `读论文` / `论文笔记` | 论文阅读模式，创建文献笔记 | [`02-Thesis/读论文skill.md`](./02-Thesis/读论文skill.md) |

### 项目类
| 指令 | 行为 | 配置 |
|------|------|------|
| `项目` / `50所` / `电信` | 项目管理，查看进度 | [`03-Projects/项目管理skill.md`](./03-Projects/项目管理skill.md) |
| `竞赛` / `美赛` / `建模` | 竞赛准备，材料整理 | [`04-Competitions/竞赛准备skill.md`](./04-Competitions/竞赛准备skill.md) |
| `软著` / `软件著作权` | 软著材料生成 | [`提示词助手/软著申请专家.md`](./提示词助手/软著申请专家.md) |

### 工具类
| 指令 | 行为 | 配置 |
|------|------|------|
| `commit` / `提交` | Git 提交助手 | [`提示词助手/Git提交助手.md`](./提示词助手/Git提交助手.md) |

---

## 🔄 工作流程

### 每日流程
```
07:00       起床
08:00-12:00 核心工作（随时记录到 00-Inbox/）
14:00-18:00 项目/实验
19:00       散步
19:30-22:00 黄金效率时段（论文30分钟）
22:00       晚间复盘，整理 00-Inbox/ → 对应文件夹
```

### 复盘节奏
- **日复盘**：每日 22:00，整理 Inbox → 生成日记 → 同步 Hexo
- **周复盘**：每周日，汇总本周数据，检查目标完成度
- **月复盘**：每月末，深度复盘，调整下月计划

---

## 📝 模板规范

| 类型 | 模板位置 |
|------|----------|
| 每日笔记 | [`01-Daily/Templates/daily-template.md`](./01-Daily/Templates/daily-template.md) |
| 周复盘 | [`01-Daily/Templates/weekly-review-template.md`](./01-Daily/Templates/weekly-review-template.md) |
| 文献笔记 | [`02-Thesis/Writing/paper-template.md`](./02-Thesis/Writing/paper-template.md) |
| 实验记录 | [`02-Thesis/Writing/experiment-template.md`](./02-Thesis/Writing/experiment-template.md) |

---

## 🔗 双向链接规则

使用 `[[文件名]]` 格式创建知识关联：

| 关键词 | 链接目标 |
|--------|----------|
| 论文/文献/实验/baseline | `[[MOC-论文地图]]` |
| 教资/备考/科目一 | `[[12周计划-仪表盘]]` |
| 50所/路灯/井盖 | `[[03-Projects/中电科50所/...]]` |
| 竞赛/美赛/获奖 | `[[MOC-竞赛荣誉墙]]` |
| 体重/运动/健康 | `[[06-Growth/Health/体重管理]]` |
| Claude/Code/AI | `[[05-Tech/Tools/Claude-Code/使用心得]]` |

---

## 📊 当前状态

- **最后更新**：2026-02-10
- **当前阶段**：论文撰写 + 教资备考 + 理财规划
- **Skills 体系**：已重构，支持多场景快速触发
- **AI 工具链**：Claude Code + Opus 4.6 + Kimi + AutoGLM

---

## 🛠️ 技术栈

| 类别 | 工具 |
|------|------|
| 知识管理 | Obsidian + Git |
| AI 助手 | Claude Code, Claude Opus 4.6, Kimi |
| 博客同步 | Hexo |
| 版本控制 | Git + GitHub |
| 自动化 | AutoGLM, Claude Skills |

---

## 📝 最近更新

- [2026-02-10] 日记整理：2月9日、2月10日复盘完成
- [2026-02-08] 论文初稿完成，文献阅读助手 GitHub 仓库搭建
- [2026-02-07] 组建 Agent Teams 助力科研
- [2026-02-05] 电脑空间整理计划启动

---

## ⚡ 快速开始

1. **日常使用**：在任意位置记录想法到 `00-Inbox/`
2. **晚间复盘**：说「今日复盘」自动整理日记
3. **论文工作**：说「读论文」进入论文阅读模式
4. **项目管理**：说「项目」查看各项目进度

---

> 💡 **提示**：进入特定模块时，Claude 会自动读取该模块的 `claude.md` 获取上下文。

---

*知识库版本：v2.0*
*构建工具：Claude Code + Obsidian*
*更新频率：每日*
