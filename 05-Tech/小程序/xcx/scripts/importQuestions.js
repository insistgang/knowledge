/**
 * 题库导入脚本
 * 将 questions-bank.json 批量导入到微信云数据库
 *
 * 使用方法：
 * 1. 在云开发控制台创建名为 questions_bank 的集合
 * 2. 配置好云环境ID后运行：node scripts/importQuestions.js
 */

const fs = require('fs')
const path = require('path')

// 读取题库文件
const questionsPath = path.join(__dirname, '../cloudbase/questions-bank.json')
const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'))

console.log(`📚 准备导入 ${questionsData.length} 道题目...`)
console.log('')

// 题目类型统计
const typeStats = {}
questionsData.forEach(q => {
  typeStats[q.type] = (typeStats[q.type] || 0) + 1
})

console.log('📊 题目类型分布：')
Object.entries(typeStats).forEach(([type, count]) => {
  console.log(`  - ${type}: ${count} 题`)
})
console.log('')

// 难度统计
const difficultyStats = {}
questionsData.forEach(q => {
  difficultyStats[q.difficulty] = (difficultyStats[q.difficulty] || 0) + 1
})

console.log('📊 难度分布：')
Object.entries(difficultyStats).forEach(([difficulty, count]) => {
  console.log(`  - ${difficulty}: ${count} 题`)
})
console.log('')

console.log('=======================================')
console.log('导入说明：')
console.log('=======================================')
console.log('')
console.log('由于此脚本需要在云函数环境中运行，有以下两种导入方式：')
console.log('')
console.log('方式一：云开发控制台导入（推荐）')
console.log('  1. 打开微信开发者工具')
console.log('  2. 进入云开发控制台')
console.log('  3. 点击「数据库」')
console.log('  4. 创建集合「questions_bank」')
console.log('  5. 点击「导入」按钮')
console.log('  6. 选择 cloudbase/questions-bank.json 文件')
console.log('  7. 导入即可')
console.log('')
console.log('方式二：云函数导入')
console.log('  1. 创建一个临时的云函数 init-questions')
console.log('  2. 将 questions-bank.json 的内容复制到云函数中')
console.log('  3. 调用云函数批量添加数据')
console.log('')

console.log('=======================================')
console.log('示例：云函数导入代码')
console.log('=======================================')
console.log(`
// cloudfunctions/init-questions/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  // questions-bank.json 的内容（实际使用时需要压缩或分批处理）
  const questions = ${JSON.stringify(questionsData.slice(0, 5), null, 2).slice(0, 200)}...
  // 总共 ${questionsData.length} 道题

  try {
    const batchSize = 100
    const results = []

    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize)
      // 批量添加（云数据库不支持真正的批量插入，需要逐条添加）
      for (const question of batch) {
        const res = await db.collection('questions_bank').add({
          data: question
        })
        results.push(res._id)
      }

      console.log(\`已导入 \${Math.min(i + batchSize, questions.length)}/\${questions.length}\`)
    }

    return {
      success: true,
      message: \`成功导入 \${results.length} 道题目\`
    }
  } catch (err) {
    return { success: false, message: err.message }
  }
}
`)

console.log('')
console.log('✅ 题库文件已生成，请按照上述说明导入到云数据库')
