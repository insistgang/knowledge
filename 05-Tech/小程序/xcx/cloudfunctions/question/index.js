// 题目管理云函数
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command

// 题库集合名称
const QUESTIONS_COLLECTION = 'questions_bank'

// Action 白名单
const ALLOWED_ACTIONS = [
  'random', 'list', 'detail', 'submit', 'submitBatch', 'stats', 'types',
  'favorite', 'favorites', 'wrong', 'removeWrong', 'practice', 'achievements',
  'adminCheck', 'adminStats', 'adminUserList', 'adminUserDetail'
]

exports.main = async (event, context) => {
  const { action, _openid, ...params } = event

  // 验证 action 参数
  if (!action || !ALLOWED_ACTIONS.includes(action)) {
    return { success: false, message: 'Invalid action' }
  }

  // 从微信上下文获取真实的 openid（不可伪造）
  const wxContext = cloud.getWXContext()
  const realOpenid = wxContext.OPENID

  if (!realOpenid) {
    return { success: false, message: '无法获取用户身份信息' }
  }

  // 如果请求中包含 _openid 字段，必须与 realOpenid 完全一致，否则拒绝
  if (typeof _openid !== 'undefined' && _openid !== realOpenid) {
    return { success: false, message: '身份验证失败' }
  }

  // 需要身份的 action 始终使用服务端获取的真实 openid
  const effectiveOpenid = realOpenid

  switch (action) {
    case 'random':
      return await getRandomQuestions(params.count, params.type, params.difficulty)
    case 'list':
      return await getQuestionsByType(params.type, params.page, params.pageSize, params.difficulty)
    case 'detail':
      return await getQuestionDetail(params.id)
    case 'submit':
      return await submitAnswer(effectiveOpenid, params.questionId, params.answer)
    case 'submitBatch':
      return await submitBatchAnswers(effectiveOpenid, params.answers)
    case 'stats':
      return await getStatistics(effectiveOpenid)
    case 'types':
      return await getQuestionTypes()
    case 'favorite':
      return await toggleFavorite(effectiveOpenid, params.questionId, params.questionData)
    case 'favorites':
      return await getFavorites(effectiveOpenid, params.page, params.pageSize)
    case 'wrong':
      return await getWrongQuestions(effectiveOpenid, params.page, params.pageSize)
    case 'removeWrong':
      return await removeWrongQuestion(effectiveOpenid, params.questionId)
    case 'practice':
      return await generatePractice(params.type, params.count, params.difficulty)
    case 'achievements':
      return await getAchievements(effectiveOpenid)
    // 管理员接口
    case 'adminCheck':
      return await checkAdmin(effectiveOpenid)
    case 'adminStats':
      return await getAdminStats(effectiveOpenid)
    case 'adminUserList':
      return await getAdminUserList(effectiveOpenid, params.page, params.pageSize)
    case 'adminUserDetail':
      return await getAdminUserDetail(effectiveOpenid, params.targetOpenid)
    default:
      return { success: false, message: '未知操作' }
  }
}

/**
 * Fisher-Yates 洗牌算法 - 真随机打乱数组
 * @param {Array} array - 待打乱的数组
 * @returns {Array} 打乱后的新数组
 */
function fisherYatesShuffle(array) {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * 分批获取所有匹配的题目
 * @param {Object} query - 数据库查询对象
 * @param {number} total - 总数
 * @returns {Array} 所有题目数组
 */
async function fetchAllQuestions(query, total) {
  const BATCH_SIZE = 100
  const allQuestions = []
  const batches = Math.ceil(total / BATCH_SIZE)

  for (let i = 0; i < batches; i++) {
    const res = await query.skip(i * BATCH_SIZE).limit(BATCH_SIZE).get()
    allQuestions.push(...res.data)
  }

  return allQuestions
}

/**
 * 获取随机题目（使用 Fisher-Yates 洗牌算法保证真随机）
 * @param {number} count - 题目数量
 * @param {string} type - 题目类型 (可选)
 * @param {string} difficulty - 难度级别 (可选: easy/medium/hard)
 */
async function getRandomQuestions(count = 10, type = null, difficulty = null) {
  try {
    const collection = db.collection(QUESTIONS_COLLECTION)
    let query = collection

    const whereConditions = {}
    if (type) {
      whereConditions.type = type
    }
    if (difficulty) {
      whereConditions.difficulty = difficulty
    }

    if (Object.keys(whereConditions).length > 0) {
      query = query.where(whereConditions)
    }

    // 先获取总数
    const countRes = await query.count()
    const total = countRes.total

    if (total === 0) {
      return { success: true, data: [], total: 0 }
    }

    // 请求数量不能超过总数
    const actualCount = Math.min(count, total)

    // 全量获取匹配的题目
    const allQuestions = await fetchAllQuestions(query, total)

    // 使用 Fisher-Yates 洗牌算法打乱
    const shuffled = fisherYatesShuffle(allQuestions)

    // 取前 N 个
    const selected = shuffled.slice(0, actualCount)

    return { success: true, data: selected, total }
  } catch (err) {
    return { success: false, message: err.message, data: [] }
  }
}

/**
 * 按类型获取题目列表
 * @param {string} type - 题目类型
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @param {string} difficulty - 难度级别 (可选)
 */
async function getQuestionsByType(type, page = 1, pageSize = 20, difficulty = null) {
  try {
    const skip = (page - 1) * pageSize
    const whereConditions = { type }

    if (difficulty) {
      whereConditions.difficulty = difficulty
    }

    const res = await db.collection(QUESTIONS_COLLECTION)
      .where(whereConditions)
      .skip(skip)
      .limit(pageSize)
      .get()

    // 获取总数
    const countRes = await db.collection(QUESTIONS_COLLECTION)
      .where(whereConditions)
      .count()

    return {
      success: true,
      data: res.data,
      total: countRes.total,
      page,
      pageSize
    }
  } catch (err) {
    return { success: false, message: err.message, data: [], total: 0 }
  }
}

/**
 * 获取题目详情
 * @param {string} id - 题目ID
 */
async function getQuestionDetail(id) {
  try {
    const res = await db.collection(QUESTIONS_COLLECTION).doc(id).get()
    return { success: true, data: res.data }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

/**
 * 提交单题答案
 * @param {string} openid - 用户openid
 * @param {string} questionId - 题目ID
 * @param {string} answer - 用户答案
 */
async function submitAnswer(openid, questionId, answer) {
  try {
    const questionRes = await db.collection(QUESTIONS_COLLECTION).doc(questionId).get()
    const question = questionRes.data

    // 检查题目是否存在
    if (!question) {
      return { success: false, message: '题目不存在' }
    }

    const isCorrect = String(answer) === String(question.correctAnswer)

    // 记录答题历史
    await db.collection('answer_history').add({
      data: {
        _openid: openid,
        questionId,
        answer,
        isCorrect,
        questionType: question.type,
        createdAt: db.serverDate()
      }
    })

    return {
      success: true,
      data: {
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      }
    }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

/**
 * 批量提交答案
 * @param {string} openid - 用户openid
 * @param {Array} answers - 答案数组 [{questionId, answer, isCorrect, questionType}]
 *
 * 注意：对于练习页面（词汇、成语、拼音、病句），题目可能不在数据库中。
 * 此时 answers 数组应包含 isCorrect 和 questionType 字段。
 */
async function submitBatchAnswers(openid, answers) {
  console.log('===== submitBatchAnswers v2025-01-15-DEBUG =====')
  console.log('openid:', openid)
  console.log('answers 数量:', answers?.length)
  console.log('answers 示例:', JSON.stringify(answers?.[0]))

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    console.error('answers 参数无效:', answers)
    return {
      success: false,
      savedCount: 0,
      total: 0,
      version: 'v2025-01-15-EMPTY',
      message: '答案数据为空或格式错误'
    }
  }

  try {
    const results = []
    let correctCount = 0
    let savedCount = 0
    const errors = []

    for (let i = 0; i < answers.length; i++) {
      const item = answers[i]
      console.log(`[${i+1}/${answers.length}] 处理题目:`, item.questionId, '答案:', item.answer)

      // 先尝试从数据库获取题目
      let question = null
      try {
        const questionRes = await db.collection(QUESTIONS_COLLECTION).doc(item.questionId).get()
        question = questionRes.data
      } catch (e) {
        console.log('题目不在题库中:', item.questionId)
      }

      let isCorrect
      let questionType

      if (question) {
        isCorrect = String(item.answer) === String(question.correctAnswer)
        questionType = question.type
      } else {
        isCorrect = item.isCorrect ?? false
        questionType = item.questionType ?? 'practice'
      }

      if (isCorrect) correctCount++

      // 保存答题历史到 answer_history（包含完整题目信息）
      try {
        const recordData = {
          _openid: openid,
          questionId: item.questionId,
          answer: item.answer,
          isCorrect,
          questionType,
          createdAt: db.serverDate()
        }

        // 如果有完整的题目信息，一并保存
        if (item.questionText) {
          recordData.questionText = item.questionText
        }
        if (item.options && item.options.length > 0) {
          recordData.options = item.options
        }
        if (item.correctAnswer !== undefined) {
          recordData.correctAnswer = item.correctAnswer
        }

        const addResult = await db.collection('answer_history').add({
          data: recordData
        })
        console.log(`[${i+1}] 保存成功 _id:`, addResult._id)
        savedCount++
      } catch (saveErr) {
        console.error(`[${i+1}] 保存失败:`, saveErr)
        errors.push({ index: i, error: saveErr.message })
      }

      results.push({
        questionId: item.questionId,
        isCorrect,
        correctAnswer: question?.correctAnswer,
        explanation: question?.explanation
      })
    }

    console.log('===== submitBatch 完成 =====')
    console.log('尝试保存:', answers.length, '实际保存:', savedCount, '正确:', correctCount)

    // 直接返回扁平结构，兼容前端读取
    return {
      success: true,
      savedCount: savedCount,
      total: answers.length,
      correctCount: correctCount,
      score: answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0,
      version: 'v2025-01-15-NEW',
      data: {  // 保持兼容性
        results,
        savedCount,
        correctCount,
        totalCount: answers.length,
        version: 'v2025-01-15-NEW'
      }
    }
  } catch (err) {
    console.error('===== submitBatch 异常 =====:', err)
    return {
      success: false,
      savedCount: 0,
      total: answers?.length || 0,
      version: 'v2025-01-15-ERROR',
      message: err.message,
      error: String(err)
    }
  }
}

/**
 * 获取题目统计
 * @param {string} openid - 用户openid
 */
async function getStatistics(openid) {
  try {
    // 题库总数
    const totalRes = await db.collection(QUESTIONS_COLLECTION).count()
    const total = totalRes.total

    // 各类型题目数量
    const types = ['pinyin', 'literature', 'idiom', 'correction', 'vocabulary', 'comprehension', 'grammar', 'reading']
    const typeStats = {}

    for (const type of types) {
      const res = await db.collection(QUESTIONS_COLLECTION)
        .where({ type })
        .count()
      typeStats[type] = res.total
    }

    // 用户答题数
    const answeredRes = await db.collection('answer_history')
      .where({ _openid: openid })
      .count()
    const answered = answeredRes.total

    // 正确题数
    const correctRes = await db.collection('answer_history')
      .where({ _openid: openid, isCorrect: true })
      .count()
    const correct = correctRes.total

    // 今日答题数
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayRes = await db.collection('answer_history')
      .where({
        _openid: openid,
        createdAt: _.gte(today)
      })
      .count()
    const todayAnswered = todayRes.total

    return {
      success: true,
      data: {
        total,
        answered,
        correct,
        todayAnswered,
        accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
        typeStats
      }
    }
  } catch (err) {
    return { success: false, message: err.message, data: {} }
  }
}

/**
 * 获取题目类型列表
 */
async function getQuestionTypes() {
  try {
    const types = [
      { value: 'pinyin', label: '拼音', count: 0 },
      { value: 'literature', label: '古诗词', count: 0 },
      { value: 'idiom', label: '成语', count: 0 },
      { value: 'correction', label: '病句修改', count: 0 },
      { value: 'vocabulary', label: '词汇', count: 0 },
      { value: 'comprehension', label: '阅读理解', count: 0 },
      { value: 'grammar', label: '语法', count: 0 },
      { value: 'reading', label: '阅读', count: 0 }
    ]

    // 获取各类型实际数量
    for (const type of types) {
      const res = await db.collection(QUESTIONS_COLLECTION)
        .where({ type: type.value })
        .count()
      type.count = res.total
    }

    return { success: true, data: types }
  } catch (err) {
    return { success: false, message: err.message, data: [] }
  }
}

/**
 * 生成练习题
 * @param {string} type - 题目类型
 * @param {number} count - 题目数量
 * @param {string} difficulty - 难度
 */
async function generatePractice(type = null, count = 10, difficulty = null) {
  try {
    const result = await getRandomQuestions(count, type, difficulty)
    return result
  } catch (err) {
    return { success: false, message: err.message, data: [] }
  }
}

/**
 * 收藏/取消收藏题目
 * @param {string} openid - 用户 openid
 * @param {string} questionId - 题目 ID
 * @param {object} questionData - 题目完整数据（可选）
 */
async function toggleFavorite(openid, questionId, questionData = null) {
  console.log('=== toggleFavorite 开始 ===')
  console.log('questionId:', questionId)
  console.log('questionData:', questionData)

  try {
    const existingRes = await db.collection('favorites')
      .where({ _openid: openid, questionId })
      .get()

    if (existingRes.data.length > 0) {
      // 取消收藏
      await db.collection('favorites')
        .doc(existingRes.data[0]._id)
        .remove()
      console.log('取消收藏成功')
      return { success: true, data: { favorited: false } }
    } else {
      // 添加收藏 - 保存完整的题目数据
      const favoriteData = {
        _openid: openid,
        questionId,
        createdAt: db.serverDate()
      }

      // 如果提供了完整题目数据，一并保存
      if (questionData) {
        favoriteData.questionText = questionData.question || questionData.questionText || ''
        favoriteData.questionType = questionData.type || questionData.questionType || ''
        favoriteData.options = questionData.options || []
        favoriteData.correctAnswer = questionData.correctAnswer
        favoriteData.explanation = questionData.explanation || ''
        console.log('保存完整题目数据')
      } else {
        console.log('仅保存 questionId')
      }

      await db.collection('favorites').add({ data: favoriteData })
      console.log('添加收藏成功')
      return { success: true, data: { favorited: true } }
    }
  } catch (err) {
    console.error('toggleFavorite 错误:', err)
    return { success: false, message: err.message }
  }
}

/**
 * 获取收藏列表（包含完整题目详情）
 */
async function getFavorites(openid, page = 1, pageSize = 20) {
  console.log('=== getFavorites 开始 ===')
  console.log('openid:', openid)
  console.log('page:', page, 'pageSize:', pageSize)

  try {
    const skip = (page - 1) * pageSize
    const favRes = await db.collection('favorites')
      .where({ _openid: openid })
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    console.log('查询到收藏记录数:', favRes.data.length)
    console.log('收藏记录示例:', favRes.data[0])

    // 获取题目详情
    const questions = []
    for (const fav of favRes.data) {
      console.log('处理收藏记录:', fav.questionId)

      try {
        const qRes = await db.collection(QUESTIONS_COLLECTION).doc(fav.questionId).get()
        if (qRes.data) {
          console.log('从 questions_bank 找到题目')
          questions.push({
            ...qRes.data,
            _id: qRes.data._id || fav.questionId,
            id: qRes.data.id || fav.questionId,
            favoriteId: fav._id,
            favoriteCreatedAt: fav.createdAt
          })
        } else {
          throw new Error('题目不存在')
        }
      } catch (e) {
        // 题目在 questions_bank 中不存在，可能是内置题目（v001, i001 等）
        console.log('questions_bank 中未找到题目，检查是否有保存的题目数据')

        // 如果收藏记录中包含完整的题目数据，直接使用
        if (fav.questionText || fav.question || fav.options) {
          console.log('使用收藏记录中保存的题目数据')
          questions.push({
            id: fav.questionId,
            type: fav.questionType || 'unknown',
            question: fav.questionText || fav.question || '',
            options: fav.options || [],
            correctAnswer: fav.correctAnswer,
            explanation: fav.explanation || '',
            favoriteId: fav._id,
            favoriteCreatedAt: fav.createdAt,
            _id: fav.questionId
          })
        } else {
          console.log('收藏记录中也没有题目数据，跳过:', fav.questionId)
        }
      }
    }

    console.log('最终返回题目数:', questions.length)
    return { success: true, data: questions }
  } catch (err) {
    console.error('getFavorites 错误:', err)
    return { success: false, message: err.message, data: [] }
  }
}

/**
 * 获取错题集（包含完整题目详情）
 */
async function getWrongQuestions(openid, page = 1, pageSize = 20) {
  console.log('=== getWrongQuestions 开始 ===')
  console.log('openid:', openid)

  try {
    const skip = (page - 1) * pageSize
    const wrongRes = await db.collection('answer_history')
      .where({ _openid: openid, isCorrect: false })
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    console.log('错题记录数:', wrongRes.data.length)

    // 获取题目详情，去重（同一错题只保留最新一次）
    const questionMap = new Map()
    for (const record of wrongRes.data) {
      if (!questionMap.has(record.questionId)) {
        const questionType = record.questionType || record.type || 'unknown'
        console.log('处理错题:', record.questionId, '类型:', questionType)

        let questionData = null
        let useSavedData = false

        // 优先检查 answer_history 记录中是否已保存完整题目信息
        // (这是 submitBatchAnswers 在保存时写入的 questionText, options, correctAnswer)
        if (record.questionText || (record.options && record.options.length > 0)) {
          console.log('使用 answer_history 中保存的题目数据')
          useSavedData = true
          questionData = {
            id: record.questionId,
            type: questionType,
            question: record.questionText || record.question || `【${questionType}】题目 ID: ${record.questionId}`,
            questionText: record.questionText || record.question || '',
            options: record.options || [],
            correctAnswer: record.correctAnswer !== undefined ? record.correctAnswer : 0,
            answer: record.correctAnswer !== undefined ? record.correctAnswer : 0,
            explanation: record.explanation || ''
          }
          console.log('已保存数据 - options数量:', questionData.options.length)
        }

        // 如果记录中没有保存完整数据，尝试从 questions_bank 获取
        if (!questionData) {
          try {
            const qRes = await db.collection(QUESTIONS_COLLECTION).doc(record.questionId).get()
            if (qRes.data) {
              questionData = qRes.data
              console.log('从 questions_bank 找到题目')
            }
          } catch (e) {
            console.log('questions_bank 中没有该题目')
          }
        }

        if (questionData) {
          // 找到完整题目信息
          questionMap.set(record.questionId, {
            id: questionData.id || record.questionId,
            _id: questionData._id || record.questionId,
            type: questionType,
            question: questionData.question || questionData.content || '',
            questionText: questionData.question || questionData.content || '',
            options: questionData.options || [],
            correctAnswer: questionData.answer || questionData.correctAnswer || 0,
            answer: questionData.answer || questionData.correctAnswer || 0,
            explanation: questionData.explanation || '',
            wrongAnswer: record.answer,
            wrongAt: record.createdAt,
            isFromSavedData: useSavedData
          })
        } else {
          // 没有找到完整题目信息，使用基本记录
          console.log('未找到完整题目信息，使用基本记录')
          questionMap.set(record.questionId, {
            id: record.questionId,
            _id: record.questionId,
            type: questionType,
            question: `【${questionType}】题目 ID: ${record.questionId}`,
            questionText: `题目 ID: ${record.questionId}`,
            options: [],
            correctAnswer: 0,
            answer: 0,
            wrongAnswer: record.answer,
            wrongAt: record.createdAt,
            isFromHistory: true
          })
        }
      }
    }

    console.log('最终返回错题数:', questionMap.size)
    return { success: true, data: Array.from(questionMap.values()) }
  } catch (err) {
    console.error('getWrongQuestions 出错:', err)
    return { success: false, message: err.message, data: [] }
  }
}

/**
 * 移除错题（答对后调用）
 * 删除该用户对该题目的错题记录
 * @param {string} openid - 用户openid
 * @param {string} questionId - 题目ID
 */
async function removeWrongQuestion(openid, questionId) {
  console.log('===== removeWrongQuestion 开始 =====')
  console.log('openid:', openid)
  console.log('questionId:', questionId)

  if (!questionId) {
    console.log('错误: 缺少questionId参数')
    return { success: false, message: '缺少questionId参数' }
  }

  try {
    // 先检查有多少条错题记录
    const checkBefore = await db.collection('answer_history')
      .where({
        _openid: openid,
        questionId: questionId,
        isCorrect: false
      })
      .count()
    console.log('删除前错题记录数:', checkBefore.total)

    // 删除该用户对这道题目的错题记录（isCorrect: false 的记录）
    const deleteRes = await db.collection('answer_history')
      .where({
        _openid: openid,
        questionId: questionId,
        isCorrect: false
      })
      .remove()

    console.log('删除错题记录结果:', JSON.stringify(deleteRes))
    console.log('实际删除数量:', deleteRes.stats?.removed || 0)

    // 检查是否还有该题目的错题记录
    const checkAfter = await db.collection('answer_history')
      .where({
        _openid: openid,
        questionId: questionId,
        isCorrect: false
      })
      .count()

    const remaining = checkAfter.total
    console.log('删除后剩余错题记录数:', remaining)

    console.log('===== removeWrongQuestion 完成 =====')
    return {
      success: true,
      removed: deleteRes.stats?.removed || 0,
      remaining,
      message: remaining === 0 ? '错题已移除' : `还有${remaining}条记录`
    }
  } catch (err) {
    console.error('===== removeWrongQuestion 出错 =====:', err)
    return {
      success: false,
      message: err.message,
      removed: 0,
      error: String(err)
    }
  }
}

/**
 * 获取用户成就数据
 * 基于 answer_history 和 study_records 集合实时计算
 * @param {string} openid - 用户openid
 */
async function getAchievements(openid) {
  try {
    // 获取用户总答题数
    const answeredRes = await db.collection('answer_history')
      .where({ _openid: openid })
      .count()
    const totalQuestions = answeredRes.total

    // 获取用户正确答题数
    const correctRes = await db.collection('answer_history')
      .where({ _openid: openid, isCorrect: true })
      .count()
    const correctCount = correctRes.total

    // 计算正确率
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

    // 获取学习记录
    const recordsRes = await db.collection('study_records')
      .where({ _openid: openid })
      .get()

    const records = recordsRes.data

    // 计算总得分
    const totalScore = records.reduce((sum, r) => sum + (r.score || 0), 0)

    // 满分次数
    const perfectCount = records.filter(r => r.score === 100).length

    // 计算连续学习天数
    const studyDays = calculateStudyDays(records)

    // 成就判断
    const achievements = {
      beginner: {
        unlocked: totalQuestions > 0,
        progress: totalQuestions > 0 ? '已解锁' : '0/1题'
      },
      week: {
        unlocked: studyDays >= 7,
        progress: `${Math.min(studyDays, 7)}/7天`
      },
      perfect: {
        unlocked: perfectCount >= 10,
        progress: `${perfectCount}/10次`
      },
      master: {
        unlocked: totalQuestions >= 500,
        progress: `${totalQuestions}/500题`
      },
      speed: {
        unlocked: totalQuestions >= 100,
        progress: `${Math.min(totalQuestions, 100)}/100题`
      },
      bookworm: {
        unlocked: totalScore >= 1000,
        progress: `${totalScore}/1000分`
      },
      scholar: {
        unlocked: accuracy >= 90 && totalQuestions >= 50,
        progress: `${accuracy}%`
      }
    }

    return { success: true, data: achievements }
  } catch (err) {
    return { success: false, message: err.message, data: {} }
  }
}

/**
 * 计算连续学习天数
 * @param {Array} records - 学习记录数组
 * @returns {number} 连续学习天数
 */
function calculateStudyDays(records) {
  if (records.length === 0) return 0

  // 获取所有不重复的日期
  const dates = records
    .map(r => {
      const date = new Date(r.createdAt || r.timestamp)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    })
    .filter((d, i, arr) => arr.indexOf(d) === i)
    .sort()
    .reverse()

  if (dates.length === 0) return 0

  // 今天是否学习
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // 昨天是否学习
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

  let streak = 0
  let checkDate = null

  if (dates[0] === todayStr) {
    streak = 1
    checkDate = yesterday
  } else if (dates[0] === yesterdayStr) {
    streak = 1
    checkDate = yesterday
  } else {
    return 0
  }

  // 向前检查连续天数
  for (let i = 1; i < dates.length; i++) {
    checkDate.setDate(checkDate.getDate() - 1)
    const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`

    if (dates.includes(checkStr)) {
      streak++
    } else {
      break
    }
  }

  return streak
}

// ==================== 管理员功能 ====================

/**
 * 检查用户是否是管理员
 * @param {string} openid - 用户 openid
 * @returns {Object} { success: true, isAdmin: boolean }
 */
async function checkAdmin(openid) {
  try {
    const result = await db.collection('admins')
      .where({ _openid: openid })
      .get()

    const isAdmin = result.data.length > 0
    console.log('checkAdmin:', openid, isAdmin)

    return { success: true, isAdmin }
  } catch (err) {
    console.error('checkAdmin error:', err)
    return { success: false, message: err.message, isAdmin: false }
  }
}

/**
 * 验证管理员权限（内部函数）
 * @param {string} openid - 用户 openid
 * @returns {boolean} 是否是管理员
 */
async function isAdmin(openid) {
  const result = await checkAdmin(openid)
  return result.isAdmin === true
}

/**
 * 获取管理员统计数据
 * @param {string} openid - 用户 openid
 * @returns {Object} 统计数据
 */
async function getAdminStats(openid) {
  // 验证管理员权限
  if (!await isAdmin(openid)) {
    return { success: false, message: '无管理员权限' }
  }

  try {
    console.log('=== getAdminStats 开始 ===')

    // 1. 用户总数
    const usersRes = await db.collection('users').count()
    const totalUsers = usersRes.total

    // 2. 今日新增用户
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

    const newUsersRes = await db.collection('users')
      .where({
        createdAt: _.gte(todayStart).and(_.lte(todayEnd))
      })
      .count()
    const todayNewUsers = newUsersRes.total

    // 3. 总答题数
    const answerRes = await db.collection('answer_history').count()
    const totalAnswers = answerRes.total

    // 4. 正确答题数
    const correctRes = await db.collection('answer_history')
      .where({ isCorrect: true })
      .count()
    const correctAnswers = correctRes.total

    // 5. 平均正确率
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0

    // 6. 各题型练习分布（使用简单查询替代聚合）
    const recordsRes = await db.collection('study_records')
      .limit(1000)
      .get()

    const typeDistribution = {}
    const TYPE_NAMES = {
      'pinyin': '拼音练习',
      'idiom': '成语熟语',
      'vocabulary': '词汇学习',
      'correction': '病句修改',
      'literature': '诗词鉴赏',
      'grammar': '语法知识',
      'reading': '阅读理解'
    }

    // 在代码中统计各题型数量
    recordsRes.data.forEach(record => {
      const type = record.type || 'unknown'
      const typeName = TYPE_NAMES[type] || type
      typeDistribution[typeName] = (typeDistribution[typeName] || 0) + 1
    })

    // 7. 收藏题目总数
    const favoritesRes = await db.collection('favorites').count()
    const totalFavorites = favoritesRes.total

    // 8. 错题总数
    const wrongRes = await db.collection('answer_history')
      .where({ isCorrect: false })
      .count()
    const totalWrong = wrongRes.total

    return {
      success: true,
      data: {
        users: {
          total: totalUsers,
          todayNew: todayNewUsers
        },
        answers: {
          total: totalAnswers,
          correct: correctAnswers,
          accuracy: accuracy
        },
        typeDistribution,
        favorites: totalFavorites,
        wrongQuestions: totalWrong
      }
    }
  } catch (err) {
    console.error('getAdminStats error:', err)
    return { success: false, message: err.message }
  }
}

/**
 * 获取用户列表
 * @param {string} openid - 管理员 openid
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Object} 用户列表
 */
async function getAdminUserList(openid, page = 1, pageSize = 20) {
  // 验证管理员权限
  if (!await isAdmin(openid)) {
    return { success: false, message: '无管理员权限' }
  }

  try {
    console.log('=== getAdminUserList 开始 ===', page, pageSize)

    const skip = (page - 1) * pageSize

    // 获取用户列表（users集合使用openid字段，不是_openid）
    const usersRes = await db.collection('users')
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 获取总数
    const countRes = await db.collection('users').count()
    const total = countRes.total

    console.log('用户总数:', total)
    console.log('查询到的用户数:', usersRes.data.length)
    console.log('第一个用户示例:', usersRes.data[0])

    // 为每个用户获取统计数据
    const userList = await Promise.all(usersRes.data.map(async (user) => {
      const userOpenid = user.openid  // users集合使用openid字段

      // 答题数
      const answerRes = await db.collection('answer_history')
        .where({ _openid: userOpenid })
        .count()
      const answerCount = answerRes.total

      // 正确数
      const correctRes = await db.collection('answer_history')
        .where({ _openid: userOpenid, isCorrect: true })
        .count()
      const correctCount = correctRes.total

      // 正确率
      const accuracy = answerCount > 0 ? Math.round((correctCount / answerCount) * 100) : 0

      // 学习记录数
      const recordsRes = await db.collection('study_records')
        .where({ _openid: userOpenid })
        .count()
      const studyDays = recordsRes.total

      // 最后学习时间
      const lastRecordRes = await db.collection('study_records')
        .where({ _openid: userOpenid })
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get()
      const lastStudyTime = lastRecordRes.data.length > 0
        ? lastRecordRes.data[0].createdAt
        : null

      return {
        openid: userOpenid,
        nickName: user.nickname || '未设置',  // users集合使用nickname字段
        avatarUrl: user.avatar || '',
        createdAt: user.createdAt,
        stats: {
          answerCount,
          correctCount,
          accuracy,
          studyDays,
          lastStudyTime
        }
      }
    }))

    console.log('处理后的用户列表:', userList.length)

    return {
      success: true,
      data: {
        list: userList,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  } catch (err) {
    console.error('getAdminUserList error:', err)
    return { success: false, message: err.message }
  }
}

/**
 * 获取单个用户详情
 * @param {string} adminOpenid - 管理员 openid
 * @param {string} targetOpenid - 目标用户 openid
 * @returns {Object} 用户详情
 */
async function getAdminUserDetail(adminOpenid, targetOpenid) {
  // 验证管理员权限
  if (!await isAdmin(adminOpenid)) {
    return { success: false, message: '无管理员权限' }
  }

  if (!targetOpenid) {
    return { success: false, message: '缺少目标用户ID' }
  }

  try {
    console.log('=== getAdminUserDetail 开始 ===', targetOpenid)

    // 获取用户基本信息（users集合使用openid字段，不是_openid）
    const userRes = await db.collection('users')
      .where({ openid: targetOpenid })
      .get()

    if (userRes.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const user = userRes.data[0]

    // 获取答题历史
    const answerRes = await db.collection('answer_history')
      .where({ _openid: targetOpenid })
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get()

    // 答题统计
    const answerCount = answerRes.data.length
    const correctCount = answerRes.data.filter(a => a.isCorrect).length
    const accuracy = answerCount > 0 ? Math.round((correctCount / answerCount) * 100) : 0

    // 各题型统计
    const typeStats = {}
    answerRes.data.forEach(answer => {
      const type = answer.questionType || 'unknown'
      if (!typeStats[type]) {
        typeStats[type] = { total: 0, correct: 0 }
      }
      typeStats[type].total++
      if (answer.isCorrect) {
        typeStats[type].correct++
      }
    })

    // 获取学习记录
    const recordsRes = await db.collection('study_records')
      .where({ _openid: targetOpenid })
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    // 计算学习天数
    const studyDays = calculateStudyDays(recordsRes.data)

    // 获取收藏数
    const favoritesRes = await db.collection('favorites')
      .where({ _openid: targetOpenid })
      .count()
    const favoriteCount = favoritesRes.total

    // 获取错题数
    const wrongRes = await db.collection('answer_history')
      .where({ _openid: targetOpenid, isCorrect: false })
      .count()
    const wrongCount = wrongRes.total

    // 最近30天答题趋势
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const trendRes = await db.collection('answer_history')
      .where({
        _openid: targetOpenid,
        createdAt: _.gte(thirtyDaysAgo)
      })
      .get()

    // 按日期分组统计
    const dailyTrend = {}
    trendRes.data.forEach(item => {
      const date = new Date(item.createdAt)
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
      if (!dailyTrend[dateStr]) {
        dailyTrend[dateStr] = { total: 0, correct: 0 }
      }
      dailyTrend[dateStr].total++
      if (item.isCorrect) {
        dailyTrend[dateStr].correct++
      }
    })

    return {
      success: true,
      data: {
        userInfo: {
          openid: targetOpenid,
          nickName: user.nickname || '未设置',  // users集合使用nickname字段
          avatarUrl: user.avatar || '',
          createdAt: user.createdAt
        },
        stats: {
          answerCount,
          correctCount,
          accuracy,
          studyDays,
          favoriteCount,
          wrongCount
        },
        typeStats,
        studyRecords: recordsRes.data.map(r => ({
          type: r.type,
          score: r.score,
          totalQuestions: r.totalQuestions,
          correctAnswers: r.correctAnswers,
          createdAt: r.createdAt
        })),
        dailyTrend
      }
    }
  } catch (err) {
    console.error('getAdminUserDetail error:', err)
    return { success: false, message: err.message }
  }
}
