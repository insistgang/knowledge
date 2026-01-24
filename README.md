# Leo 的 Obsidian 知识管理系统

## 文件夹结构

```
📁 Knowledge Vault/
├── 📁 00-Inbox/                    # 快速捕获，待整理
│   └── 临时笔记、想法、截图
│
├── 📁 01-Daily/                    # 每日记录
│   ├── 2025-01/
│   │   ├── 2025-01-15.md
│   │   └── ...
│   └── Templates/
│       └── daily-template.md
│
├── 📁 02-Thesis/                   # 论文核心区
│   ├── 📁 Literature/              # 文献笔记
│   │   ├── 按年份或主题分类/
│   │   └── 每篇论文一个笔记
│   ├── 📁 Experiments/             # 实验记录
│   │   ├── YOLO违建检测/
│   │   ├── 路面损伤检测/
│   │   └── 路灯检测算法/
│   ├── 📁 Writing/                 # 论文撰写
│   │   ├── 章节草稿/
│   │   └── 修改记录/
│   ├── 开题报告.md
│   ├── 研究进度追踪.md
│   └── 答辩准备.md
│
├── 📁 03-Projects/                 # 项目管理
│   ├── 📁 中国电信合作/
│   ├── 📁 中电科50所/
│   ├── 📁 红楼梦研究协助/
│   └── 📁 Archive/                 # 已完成项目
│
├── 📁 04-Competitions/             # 竞赛专区
│   ├── 📁 2025/
│   │   └── 按竞赛名分类
│   ├── 📁 Archive/                 # 已完成竞赛
│   │   ├── 华为杯AI国三/
│   │   ├── 华为杯网安国三/
│   │   ├── EDA精英挑战赛国三/
│   │   ├── 西门子杯省一/
│   │   ├── 数学建模国二/
│   │   └── 电子设计省三/
│   └── 竞赛经验总结.md
│
├── 📁 05-Tech/                     # 技术知识库
│   ├── 📁 CV/                      # 计算机视觉
│   │   ├── YOLO系列/
│   │   ├── 目标检测/
│   │   └── 图像处理/
│   ├── 📁 DeepLearning/
│   ├── 📁 Tools/                   # 工具使用
│   │   ├── Claude Code/
│   │   ├── Git/
│   │   └── Python环境/
│   └── 📁 SmartCity/               # 智慧城市
│
├── 📁 06-Growth/                   # 个人成长
│   ├── 📁 Party/                   # 党建相关
│   │   ├── 学习心得/
│   │   └── 广富林街道项目/
│   ├── 📁 Health/                  # 健康管理
│   │   └── 运动饮食记录
│   ├── 📁 Reflection/              # 深度反思
│   │   └── 残酷真相纠正计划.md
│   └── 博士规划.md
│
├── 📁 07-Resources/                # 资源汇总
│   ├── 常用链接.md
│   ├── 代码片段.md
│   └── 模板库.md
│
└── 📁 Attachments/                 # 统一存放附件
    ├── images/
    ├── pdfs/
    └── files/
```

---

## 核心模板

### 每日笔记模板 (daily-template.md)

```markdown
---
date: {{date}}
tags: daily
energy: /10
thesis_progress: false
---

# {{date:YYYY-MM-DD}} {{date:dddd}}

## 🎯 今日要事 (MIT - Most Important Tasks)
- [ ] 论文：
- [ ] 项目：
- [ ] 其他：

## 📖 论文30分钟
> 今日论文工作记录（必填）

**做了什么**：

**遇到的问题**：

**明日计划**：

## 📝 工作日志
### 上午

### 下午

### 晚间 (19:00-22:00 黄金时段)

## 💧 健康打卡
- [ ] 饮水 2000ml+
- [ ] 19:00 散步
- [ ] 低GI饮食

## 🌙 22:00 晚间复盘
### 今日收获

### 需要改进

### 明日预告

## 📎 快速捕获
> 随时记录的想法、灵感、待办
```

### 文献笔记模板 (paper-template.md)

```markdown
---
title: "{{title}}"
authors: 
year: 
venue: 
tags: [literature, ]
status: unread/reading/finished
rating: /5
related_to_thesis: true/false
---

# {{title}}

## 📋 基本信息
- **DOI/链接**：
- **引用格式**：
- **关键词**：

## 🎯 核心贡献
> 一句话总结这篇论文做了什么

## 📖 内容摘要
### 问题 (Problem)

### 方法 (Method)

### 实验 (Experiments)

### 结论 (Conclusion)

## 💡 对我的启发
> 与我的违建检测研究的关联

## ❓ 疑问与思考

## 📎 重要图表
> 截图或链接

## 🔗 相关文献
- [[相关论文1]]
- [[相关论文2]]
```

### 实验记录模板 (experiment-template.md)

```markdown
---
date: {{date}}
project: 
tags: [experiment]
status: ongoing/completed/failed
---

# 实验：{{实验名称}}

## 🎯 实验目的

## ⚙️ 实验配置
- **数据集**：
- **模型**：
- **参数**：
```yaml
# 关键参数
```

## 📊 实验结果
| 指标 | 结果 |
|------|------|
| mAP | |
| Precision | |
| Recall | |

## 📈 结果分析

## 🐛 问题与解决

## 📝 下一步计划

## 💾 相关代码/数据位置
```

---

## 工作流设计

### 每日流程

```
07:00  起床，查看今日笔记模板
       ↓
08:00-12:00  核心工作时间
       ↓ (随时记录到 Inbox)
12:00  午餐，简单回顾上午
       ↓
14:00-18:00  项目/实验时间
       ↓
18:00  晚餐
       ↓
19:00  固定散步 ✓
       ↓
19:30-22:00  黄金效率时段（论文30分钟在此完成）
       ↓
22:00  晚间复盘，整理 Inbox → 对应文件夹
       ↓
22:30  结束工作
```

### 文献管理流程

```
1. 发现论文 → 存入 00-Inbox/待读论文.md（只记标题和链接）
      ↓
2. 阅读时 → 用模板创建 02-Thesis/Literature/论文名.md
      ↓
3. 阅读中 → 边读边填模板，重点写"对我的启发"
      ↓
4. 读完后 → 添加双向链接，连接到相关笔记
      ↓
5. 写论文时 → 通过关系图谱快速找到相关文献
```

### 论文撰写流程

```
02-Thesis/Writing/
├── 00-大纲.md              # 整体结构
├── 01-绪论-v1.md           # 版本命名
├── 01-绪论-v2.md
├── 02-相关工作.md
├── 03-方法.md
├── 04-实验.md
├── 05-结论.md
└── 修改日志.md             # 记录每次修改
```

**关键习惯**：每次修改另存新版本，保留历史。

---

## 推荐插件配置

### 必装插件

| 插件 | 用途 |
|------|------|
| **Calendar** | 日历视图，快速跳转每日笔记 |
| **Dataview** | 数据查询，追踪论文进度 |
| **Templater** | 高级模板，自动填充日期等 |
| **Tag Wrangler** | 标签管理 |
| **Obsidian Git** | 自动备份到 GitHub |

### 可选插件

| 插件 | 用途 |
|------|------|
| **Zotero Integration** | 文献管理联动 |
| **Excalidraw** | 画图、思维导图 |
| **Kanban** | 看板式任务管理 |
| **Tasks** | 任务追踪和提醒 |

---

## Dataview 实用查询

### 追踪论文每日进度

放在某个 MOC (Map of Content) 页面：

```dataview
TABLE thesis_progress as "论文", energy as "精力"
FROM "01-Daily"
WHERE date >= date(today) - dur(7 days)
SORT date DESC
```

### 待读文献列表

```dataview
TABLE authors, year, rating
FROM "02-Thesis/Literature"
WHERE status = "unread"
SORT file.ctime DESC
```

### 本周实验汇总

```dataview
LIST
FROM "02-Thesis/Experiments"
WHERE date >= date(today) - dur(7 days)
SORT date DESC
```

---

## 与 Claude Code 联动

### 场景1：论文润色

```bash
claude -p "帮我润色这段论文摘要，保持学术风格：$(cat 02-Thesis/Writing/摘要.md)"
```

### 场景2：文献总结

```bash
claude -p "总结这篇论文的核心方法：" < paper.pdf
```

### 场景3：代码解释

在实验记录中遇到复杂代码时：

```bash
claude /read experiments/yolo_train.py
claude -p "解释这段代码的检测逻辑"
```

---

## 快速启动清单

### 今天就做

- [ ] 创建 Vault，按上述结构建文件夹
- [ ] 复制每日模板，开始今天的记录
- [ ] 安装 Calendar + Templater 插件
- [ ] 设置快捷键：`Alt+D` 创建今日笔记

### 本周完成

- [ ] 把现有论文文献迁移到 Literature 文件夹
- [ ] 建立 3-5 篇核心论文的文献笔记
- [ ] 配置 Obsidian Git 自动备份

### 持续习惯

- [ ] 每日22:00复盘，清空Inbox
- [ ] 每篇论文必写"对我的启发"
- [ ] 每周日回顾关系图谱，发现知识连接

---

> 💡 **记住**：系统是为你服务的，不是负担。先用起来，逐步迭代完善。
