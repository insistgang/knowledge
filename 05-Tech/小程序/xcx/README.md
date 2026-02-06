# AI 语文助手小程序

基于 Taro + 微信云开发的语文学习小程序，提供词汇、诗词、成语、拼音等学习功能，以及 AI 智能辅导。

## 项目特性

- 📚 **丰富的学习内容**：词汇学习、古诗词、成语熟语、拼音学习、病句修改
- 📝 **练习系统**：单选、多选、填空、判断等多种题型
- 🤖 **AI 智能辅导**：集成 DeepSeek AI，提供语文学习智能问答
- 📊 **学习分析**：学习记录、学习报告、学习分析、薄弱环节诊断
- 🎯 **模拟考试**：真实考试模拟，检验学习效果

## 技术栈

- **前端框架**：Taro 3.x + React
- **UI 组件**：Taro UI
- **后端**：微信云开发（云函数 + 云数据库）
- **AI 能力**：DeepSeek API

## 项目结构

```
xcx/
├── src/                         # 前端源码
│   ├── app.jsx                  # 应用入口
│   ├── app.config.js            # 应用配置
│   ├── app.less                 # 全局样式
│   ├── pages/                   # 页面
│   │   ├── login/               # 登录注册
│   │   ├── home/                # 首页仪表板
│   │   ├── vocabulary/          # 词汇学习
│   │   ├── literature/          # 古诗词
│   │   ├── idiom/               # 成语熟语
│   │   ├── pinyin/              # 拼音学习
│   │   ├── correction/          # 病句修改
│   │   ├── exercise/            # 练习中心
│   │   ├── exercise-detail/     # 练习详情
│   │   ├── mock-exam/           # 模拟考试
│   │   ├── chat/                # AI 聊天
│   │   ├── study-record/        # 学习记录
│   │   ├── study-report/        # 学习报告
│   │   ├── study-analysis/      # 学习分析
│   │   └── profile/             # 个人中心
│   ├── services/                # 服务层
│   │   ├── request.js           # 请求封装
│   │   ├── auth.js              # 认证服务
│   │   ├── question.js          # 题目服务
│   │   ├── study.js             # 学习记录服务
│   │   ├── chat.js              # AI 聊天服务
│   │   └── vocabulary.js        # 词汇服务
│   ├── context/                 # 全局状态
│   │   └── AuthContext.jsx      # 认证上下文
│   ├── utils/                   # 工具函数
│   │   ├── constants.js         # 常量定义
│   │   └── storage.js           # 存储封装
│   └── styles/                  # 样式
│       └── variables.less       # 样式变量
│
├── cloudfunctions/              # 云函数
│   ├── login/                   # 登录注册
│   ├── user/                    # 用户管理
│   ├── question/                # 题目管理
│   ├── study/                   # 学习记录
│   ├── chat/                    # AI 聊天
│   └── vocabulary/              # 词汇服务
│
├── cloudbase/                   # 云数据库设计
│   └── database.schema.json     # 数据库结构
│
├── config/                      # Taro 配置
│   ├── index.js                 # 默认配置
│   ├── dev.js                   # 开发配置
│   └── prod.js                  # 生产配置
│
├── project.config.json          # 小程序配置
├── cloud.json                   # 云开发配置
└── package.json                 # 依赖配置
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式

```bash
npm run dev:weapp
```

### 3. 微信开发者工具

1. 打开微信开发者工具
2. 导入项目，选择 `xcx` 目录
3. 开通云开发服务
4. 上传云函数并配置环境
5. 配置 DeepSeek API Key（在 `cloudfunctions/chat/index.js` 中）

## 云数据库配置

需要在云开发控制台创建以下集合：

| 集合名 | 说明 | 权限 |
|--------|------|------|
| users | 用户信息 | 仅创建者可读写 |
| questions | 题目库 | 所有人可读 |
| study_records | 学习记录 | 仅创建者可读写 |
| chat_history | 聊天历史 | 仅创建者可读写 |
| answer_history | 答题历史 | 仅创建者可读写 |
| favorites | 收藏题目 | 仅创建者可读写 |
| vocabulary | 词汇库 | 所有人可读 |
| idioms | 成语库 | 所有人可读 |
| word_favorites | 收藏词语 | 仅创建者可读写 |

## 云函数配置

每个云函数需要单独上传并配置：

- **login**：处理用户登录注册
- **user**：用户信息管理
- **question**：题目管理和答题
- **study**：学习记录和分析
- **chat**：AI 聊天（需配置 DeepSeek API Key）
- **vocabulary**：词汇和成语查询

## 主要功能

### 1. 学习模块

| 模块 | 功能 |
|------|------|
| 词汇学习 | 词语查询、拼音、释义、例句、近反义词 |
| 古诗词 | 诗词列表、详情展示、背诵练习 |
| 成语熟语 | 成语查询、释义、例句 |
| 拼音学习 | 声母韵母、声调练习 |
| 病句修改 | 病句识别、修改建议 |

### 2. 练习模块

- 练习中心：按题型分类练习
- 练习详情：答题、查看解析
- 模拟考试：倒计时、答题卡、自动交卷

### 3. AI 助手

- 智能问答语文学习问题
- 支持词语释义、诗词赏析、语法知识、写作技巧
- 聊天历史记录

### 4. 个人中心

- 学习记录查看
- 学习报告统计
- 学习分析诊断
- 成就展示

## 注意事项

1. **云开发环境**：需要在微信开发者工具中开通云开发
2. **API 密钥**：DeepSeek API Key 需要在云函数中配置
3. **域名白名单**：如需外部 API，需在微信小程序后台配置服务器域名
4. **图片资源**：TabBar 图标需自行准备，或使用文字版 TabBar

## 许可证

MIT
