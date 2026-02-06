这张图展示的是 **AGENTS.md** 这个规范支持的AI编程工具生态。我来给你分个档：

## 第一梯队（最强/最火）

| 工具                 | 评价                             |
| ------------------ | ------------------------------ |
| **Cursor**         | 目前最火的AI IDE，体验丝滑，很多开发者主力工具     |
| **GitHub Copilot** | 用户量最大，IDE集成最好，微软背书             |
| **Devin**          | "AI软件工程师"，能自主完成复杂任务，但贵（$500/月） |
| **Codex (OpenAI)** | Copilot的底层模型，OpenAI出品          |

## 第二梯队（实用/有特色）

|工具|评价|
|---|---|
|**Aider**|开源命令行工具，技术圈口碑很好，免费|
|**Gemini CLI**|Google出的，免费额度大方|
|**Zed**|高性能编辑器+AI，速度快|
|**Warp**|AI终端，命令行党喜欢|

## 第三梯队（新兴/小众）

Jules、Amp、RooCode、Kilo Code、Factory等，要么刚起步，要么针对特定场景。


## Claude Code 核心原理

本质上是一个 **Agentic Loop（智能体循环）**：

```
用户指令 → 理解任务 → 读取代码 → 思考方案 → 执行操作 → 检查结果 → 继续/完成
              ↑                                              |
              └──────────────── 循环 ←─────────────────────┘
```

---

## 关键机制

**1. 代码库索引**

启动时扫描项目结构，建立文件树的理解，知道哪些文件是什么用途

**2. 工具调用（Tool Use）**

Claude 本身只能"思考"，但 Claude Code 给它配了一套工具：

- `read_file` — 读文件内容
- `write_file` — 写/改文件
- `run_command` — 执行终端命令（如 `python test.py`）
- `search` — 搜索代码库

模型根据任务自主决定调用哪个工具

**3. 上下文管理**

把相关代码、错误信息、执行结果塞进 prompt，让模型在足够的上下文中做决策。Claude 的 200K 上下文窗口在这里很关键

**4. 循环执行**

不是一次性输出答案，而是：

```
思考 → 调用工具 → 拿到结果 → 再思考 → 再调用 → ... → 任务完成
```

---

## 简化示意

```python
while not task_done:
    # 1. 把当前状态给模型
    response = claude.think(context + user_task)
    
    # 2. 模型决定下一步动作
    if response.action == "read_file":
        result = read_file(response.path)
    elif response.action == "write_file":
        result = write_file(response.path, response.content)
    elif response.action == "run_command":
        result = shell(response.command)
    
    # 3. 把结果加入上下文，继续循环
    context += result
```

---
