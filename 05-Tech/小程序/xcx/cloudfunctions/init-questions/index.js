/**
 * 题库初始化云函数
 * 用于将 questions-bank.json 批量导入到云数据库
 *
 * 使用方法：
 * 1. 部署此云函数
 * 2. 在小程序中调用：Taro.cloud.callFunction({ name: 'init-questions', data: { action: 'import' } })
 * 3. 或者直接在云开发控制台测试
 */

const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

// 题库数据（需要将 questions-bank.json 的内容复制到这里）
// 由于云函数代码大小限制，这里只提供示例框架
// 实际使用时，建议在云开发控制台直接导入 JSON 文件

const questionsData = require('./questions-data.json')

exports.main = async (event, context) => {
  const { action } = event

  switch (action) {
    case 'import':
      return await importQuestions()
    case 'clear':
      return await clearQuestions()
    case 'count':
      return await countQuestions()
    case 'stats':
      return await getStats()
    default:
      return { success: false, message: '未知操作' }
  }
}

/**
 * 导入题目到数据库
 */
async function importQuestions() {
  try {
    // 检查是否已有数据
    const existingRes = await db.collection('questions_bank').limit(1).get()
    if (existingRes.data.length > 0) {
      return {
        success: false,
        message: '题库已存在数据，请先清空再导入',
        existingCount: existingRes.data.length
      }
    }

    const questions = questionsData
    const batchSize = 100
    let imported = 0
    let errors = []

    // 批量导入（云数据库不支持真正的批量插入，需要循环添加）
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize)

      for (const question of batch) {
        try {
          await db.collection('questions_bank').add({
            data: {
              type: question.type,
              question: question.content || question.question,
              options: question.options ? (typeof question.options === 'string' ? JSON.parse(question.options) : question.options) : [],
              correctAnswer: question.answer || question.correctAnswer,
              explanation: question.explanation || '',
              source: question.source || '',
              difficulty: question.difficulty || 'medium',
              year: question.year || new Date().getFullYear(),
              tags: question.tags || [question.type],
              createdAt: db.serverDate()
            }
          })
          imported++
        } catch (err) {
          errors.push({ question: question.id, error: err.message })
        }
      }

      console.log(`已导入 ${Math.min(i + batchSize, questions.length)}/${questions.length}`)
    }

    return {
      success: true,
      message: `成功导入 ${imported} 道题目`,
      imported,
      errors: errors.slice(0, 10) // 只返回前10个错误
    }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

/**
 * 清空题库
 */
async function clearQuestions() {
  try {
    // 获取所有记录
    const res = await db.collection('questions_bank').get()
    const count = res.data.length

    // 逐条删除
    for (const doc of res.data) {
      await db.collection('questions_bank').doc(doc._id).remove()
    }

    return {
      success: true,
      message: `已清空 ${count} 条记录`
    }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

/**
 * 统计题目数量
 */
async function countQuestions() {
  try {
    const totalRes = await db.collection('questions_bank').count()
    const total = totalRes.total

    // 按类型统计
    const types = ['pinyin', 'literature', 'idiom', 'correction', 'vocabulary', 'comprehension', 'grammar', 'reading']
    const typeStats = {}

    for (const type of types) {
      const res = await db.collection('questions_bank').where({ type }).count()
      typeStats[type] = res.total
    }

    return {
      success: true,
      data: {
        total,
        typeStats
      }
    }
  } catch (err) {
    return { success: false, message: err.message, data: {} }
  }
}

/**
 * 获取题库统计信息
 */
async function getStats() {
  try {
    const res = await db.collection('questions_bank').limit(1).get()

    if (res.data.length === 0) {
      return {
        success: true,
        data: {
          initialized: false,
          message: '题库未初始化'
        }
      }
    }

    const stats = await countQuestions()
    return {
      success: true,
      data: {
        initialized: true,
        ...stats.data
      }
    }
  } catch (err) {
    return { success: false, message: err.message }
  }
}
