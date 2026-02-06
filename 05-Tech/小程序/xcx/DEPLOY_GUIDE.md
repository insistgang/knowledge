# 数据导入部署指南

## 概述

本指南用于导入题库、词汇、成语等基础数据到微信云开发数据库。

## 文件准备

确保以下数据文件已准备好：

- `cloudbase/vocabulary.json` - 100+ 词语数据
- `cloudbase/idioms.json` - 100+ 成语数据
- `cloudbase/questions-bank.json` - 完整题库（如有）

## 云函数部署步骤

### 1. 打开微信开发者工具

### 2. 找到 import-data 云函数

在项目根目录下的 `cloudfunctions/import-data/` 文件夹

### 3. 上传并部署

- 右键点击 `import-data` 文件夹
- 选择 **"上传并部署：云端安装依赖"**
- 等待上传完成（底部会显示 "上传成功"）

## 调用云函数导入数据

### 方法一：云开发控制台调用（推荐）

1. 打开 **云开发** 控制台
2. 进入 **云函数** → 找到 `import-data` → 点击 **"云端测试"**
3. 输入以下 JSON 参数：

```json
{
  "action": "importAll"
}
```

4. 点击 **"开始测试"**
5. 等待执行完成，查看返回结果

### 方法二：在小程序中调用

在小程序代码中调用：

```javascript
Taro.cloud.callFunction({
  name: 'import-data',
  data: { action: 'importAll' }
}).then(res => {
  console.log('导入结果:', res.result)
})
```

## 可用的操作参数

| action | 说明 |
|--------|------|
| `importAll` | 导入所有数据（词汇→成语→题库） |
| `importVocabulary` | 仅导入词汇 |
| `importIdioms` | 仅导入成语 |
| `importQuestions` | 仅导入题库 |
| `checkStatus` | 检查各集合数据状态 |
| `clearCollection` | 清空指定集合（需传 collection 参数） |

### 示例：仅导入词汇

```json
{
  "action": "importVocabulary"
}
```

### 示例：检查数据状态

```json
{
  "action": "checkStatus"
}
```

### 示例：清空集合（谨慎使用）

```json
{
  "action": "clearCollection",
  "collection": "vocabulary"
}
```

## 验证导入结果

1. 打开 **云开发** 控制台
2. 进入 **数据库**
3. 查看各集合记录数：
   - `vocabulary` - 应有 100+ 条
   - `idioms` - 应有 100+ 条
   - `questions_bank` - 根据题库文件大小

## 注意事项

1. **首次导入**：直接使用 `importAll` 即可
2. **重复导入**：会追加数据，不会覆盖。如需重新导入，先使用 `clearCollection` 清空
3. **超时问题**：导入采用分批处理（每批100条），大量数据可能需要多次调用
4. **权限问题**：确保云开发环境已正确初始化

## 需要重新部署的云函数

根据之前的修复，以下云函数需要重新部署：

| 云函数 | 修复内容 |
|--------|----------|
| `chat` | 修复变量引用错误，添加集合自动创建 |
| `question` | 修复随机算法，添加空值检查 |
| `vocabulary` | 修复随机获取，增强拼音生成 |
| `study` | 修复硬编码统计数据 |

重新部署步骤：右键云函数文件夹 → **"上传并部署：云端安装依赖"**
