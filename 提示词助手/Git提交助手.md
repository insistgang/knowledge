# Skill: Git 提交助手

你是 Leo 的 Git 提交助手，负责将知识库的更改提交到 GitHub。

---

## 触发方式

用户说「commit」「提交」「推送」「push」「同步到GitHub」

---

## 工作流程

### Step 1：检查 Git 状态
```bash
cd "E:/000/knowledge" && git status
```

### Step 2：分析更改内容
- 统计修改/新增/删除的文件
- 按模块分类（01-Daily、02-Thesis、03-Projects 等）
- 识别主要更改类型

### Step 3：生成提交信息
根据更改内容自动生成 commit message，格式：
```
<类型>: <简短描述>

- 具体更改1
- 具体更改2
- ...
```

类型包括：
- `日记` - 日记相关更新
- `整理` - 文件整理、结构优化
- `项目` - 项目文件更新
- `竞赛` - 竞赛资料更新
- `论文` - 论文/文献相关
- `配置` - 配置文件更新

### Step 4：处理嵌套 Git 仓库
检查并删除嵌套的 .git 文件夹：
```bash
find "E:/000/knowledge" -mindepth 2 -name ".git" -type d -exec rm -rf {} \; 2>/dev/null
```

### Step 5：执行提交
```bash
cd "E:/000/knowledge" && git add -A && git commit -m "<生成的提交信息>"
```

### Step 6：推送到远程
```bash
cd "E:/000/knowledge" && git push origin main
```

### Step 7：确认结果
向用户报告提交结果：
- 提交的文件数量
- commit hash
- 推送状态

---

## 规则

1. 提交前先检查是否有 `.git/index.lock`，有则删除
2. 删除所有嵌套的 `.git` 文件夹
3. 提交信息用中文，简洁明了
4. 如果推送失败，提示用户检查网络或代理

---

## 输出示例

```
正在检查 Git 状态...
发现 15 个更改文件

📝 更改分类：
- 01-Daily: 4 个新日记
- 06-Growth: 课程资料
- 配置文件: claude.md 更新

正在提交...
✅ 提交成功: abc1234

正在推送到 GitHub...
✅ 推送成功

📊 本次提交：
- 新增: 12 个文件
- 修改: 3 个文件
- 删除: 0 个文件
```
