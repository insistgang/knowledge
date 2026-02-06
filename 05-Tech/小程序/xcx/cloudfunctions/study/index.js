// 学习记录云函数
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

// Action 白名单
const ALLOWED_ACTIONS = ['add', 'addBatch', 'list', 'statistics', 'homeStats', 'report', 'analysis', 'delete', 'calendar']

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
    case 'add':
      return await addRecord(effectiveOpenid, params)
    case 'addBatch':
      return await addRecords(effectiveOpenid, params.records)
    case 'list':
      return await getRecords(effectiveOpenid, params)
    case 'statistics':
      return await getStatistics(effectiveOpenid, params.timeRange)
    case 'homeStats':
      return await getHomeStatistics(effectiveOpenid)
    case 'report':
      return await getReport(effectiveOpenid, params.startDate, params.endDate)
    case 'analysis':
      return await getAnalysis(effectiveOpenid)
    case 'delete':
      return await deleteRecord(effectiveOpenid, params.id)
    case 'calendar':
      return await getStudyCalendar(effectiveOpenid, params.year, params.month)
    default:
      return { success: false, message: '未知操作' }
  }
}

/**
 * 添加学习记录
 */
async function addRecord(openid, data) {
  console.log('=== addRecord 被调用 ===')
  console.log('openid:', openid)
  console.log('data:', JSON.stringify(data))

  try {
    const record = {
      _openid: openid,
      ...data,
      createdAt: db.serverDate()
    }
    console.log('准备写入的数据:', JSON.stringify(record))

    const res = await db.collection('study_records').add({ data: record })
    console.log('写入成功，_id:', res._id)

    return { success: true, data: { _id: res._id, ...record } }
  } catch (err) {
    console.error('写入失败:', err)
    return { success: false, message: err.message, error: err.errMsg || err.message }
  }
}

/**
 * 批量添加学习记录
 */
async function addRecords(openid, records) {
  try {
    const data = records.map(r => ({
      _openid: openid,
      ...r,
      createdAt: db.serverDate()
    }))
    const res = await db.collection('study_records').add({ data })
    return { success: true, data: res.ids || [] }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

/**
 * 获取学习记录列表
 */
async function getRecords(openid, filters = {}) {
  try {
    const { type, page = 1, pageSize = 20 } = filters
    const skip = (page - 1) * pageSize

    let query = db.collection('study_records').where({ _openid: openid })
    if (type) {
      query = query.and({ type })
    }

    const res = await query.orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    return { success: true, data: res.data }
  } catch (err) {
    return { success: false, message: err.message, data: [] }
  }
}

/**
 * 获取学习统计
 * 返回用户的完整学习统计信息
 */
async function getStatistics(openid, timeRange = 'month') {
  try {
    const now = new Date()
    let startDate

    if (timeRange === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (timeRange === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else {
      startDate = new Date(now.setHours(0, 0, 0, 0))
    }

    // 获取学习记录
    const recordsRes = await db.collection('study_records')
      .where({
        _openid: openid,
        createdAt: db.command.gte(startDate)
      })
      .get()

    const records = recordsRes.data
    const totalScore = records.reduce((sum, r) => sum + (r.score || 0), 0)
    const totalDuration = records.reduce((sum, r) => sum + (r.duration || 0), 0)

    // 计算总答题数和正确率
    const totalQuestions = records.reduce((sum, r) => sum + (r.totalQuestions || 0), 0)
    const correctAnswers = records.reduce((sum, r) => sum + (r.correctAnswers || 0), 0)
    const correctRate = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

    // 计算累计学习天数
    const allRecordsRes = await db.collection('study_records')
      .where({ _openid: openid })
      .get()
    const uniqueDays = new Set(
      allRecordsRes.data.map(r => new Date(r.createdAt).toDateString())
    ).size

    return {
      success: true,
      data: {
        totalScore,
        totalDuration,
        recordCount: records.length,
        totalDays: uniqueDays, // 累计学习天数
        totalQuestions,
        correctRate
      }
    }
  } catch (err) {
    return { success: false, message: err.message, data: {} }
  }
}

/**
 * 获取首页统计
 */
async function getHomeStatistics(openid) {
  console.log('=== getHomeStatistics 被调用 ===')
  console.log('openid:', openid)

  try {
    // 使用 UTC 时间获取今日零点
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    console.log('查询今日数据的起始时间(UTC):', today.toISOString())

    // 今日答题记录
    const todayRes = await db.collection('study_records')
      .where({
        _openid: openid,
        createdAt: db.command.gte(today)
      })
      .get()

    console.log('今日查询结果数量:', todayRes.data.length)
    if (todayRes.data.length > 0) {
      console.log('今日第一条记录:', JSON.stringify(todayRes.data[0]))
    }

    const todayScore = todayRes.data.reduce((sum, r) => sum + (r.score || 0), 0)
    const todayDuration = todayRes.data.reduce((sum, r) => sum + (r.duration || 0), 0)

    // 今日正确数和总题数
    const todayTotalQuestions = todayRes.data.reduce((sum, r) => sum + (r.totalQuestions || 0), 0)
    const todayCorrectAnswers = todayRes.data.reduce((sum, r) => sum + (r.correctAnswers || 0), 0)
    const todayAccuracy = todayTotalQuestions > 0 ? Math.round((todayCorrectAnswers / todayTotalQuestions) * 100) : 0

    console.log('统计结果: todayScore=' + todayScore + ', todayAccuracy=' + todayAccuracy + '%')

    // 今日错题数（从 answer_history 中统计）
    const todayWrongRes = await db.collection('answer_history')
      .where({
        _openid: openid,
        isCorrect: false,
        createdAt: db.command.gte(today)
      })
      .count()
    const todayWrongCount = todayWrongRes.total

    // 总错题数（用于显示累计错题）
    const wrongRes = await db.collection('answer_history')
      .where({ _openid: openid, isCorrect: false })
      .count()

    console.log('错题统计: totalWrong=' + wrongRes.total + ', todayWrong=' + todayWrongCount)

    // 学习天数（计算连续学习天数）
    const streakDays = await calculateStudyStreak(openid)

    // 总学习天数（历史累计）- 使用 UTC 日期
    const daysRes = await db.collection('study_records')
      .where({ _openid: openid })
      .get()
    const uniqueDays = new Set(
      daysRes.data.map(r => {
        const date = new Date(r.createdAt)
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
      })
    ).size

    console.log('学习天数: streakDays=' + streakDays + ', totalStudyDays=' + uniqueDays)

    // 计算各类型进度 - 基于用户在 answer_history 中的答题情况
    const types = ['pinyin', 'literature', 'idiom', 'correction', 'vocabulary', 'comprehension', 'grammar', 'reading']
    const progress = {}
    const totalPerType = 100 // 假设每种类型100题算完成

    for (const type of types) {
      // 获取该类型已答对的题目数
      const correctRes = await db.collection('answer_history')
        .where({
          _openid: openid,
          questionType: type,
          isCorrect: true
        })
        .count()

      // 计算进度百分比（上限100）
      const percent = Math.min(100, Math.round((correctRes.total / totalPerType) * 100))
      progress[type] = percent
    }

    const result = {
      success: true,
      data: {
        todayScore,
        todayQuestionCount: todayTotalQuestions, // 今日做题数（从 study_records 统计）
        totalDuration: todayDuration,
        studyDays: streakDays, // 连续学习天数
        totalStudyDays: uniqueDays, // 累计学习天数
        accuracy: todayAccuracy, // 今日正确率
        progress
      }
    }

    console.log('最终返回数据:', JSON.stringify(result.data))
    return result
  } catch (err) {
    console.error('getHomeStatistics 出错:', err)
    return { success: false, message: err.message, data: {} }
  }
}

/**
 * 获取学习报告
 */
async function getReport(openid, startDate, endDate) {
  try {
    const start = new Date(startDate)
    const end = new Date(endDate)

    const res = await db.collection('study_records')
      .where({
        _openid: openid,
        createdAt: db.command.and(db.command.gte(start), db.command.lte(end))
      })
      .get()

    const records = res.data
    const totalScore = records.reduce((sum, r) => sum + (r.score || 0), 0)
    const totalDuration = records.reduce((sum, r) => sum + (r.duration || 0), 0)

    // 按日期分组
    const dailyData = {}
    records.forEach(r => {
      const date = new Date(r.createdAt).toLocaleDateString('zh-CN', { weekday: 'short' })
      if (!dailyData[date]) {
        dailyData[date] = { score: 0, duration: 0 }
      }
      dailyData[date].score += r.score || 0
      dailyData[date].duration += r.duration || 0
    })

    // 计算正确率（从 answer_history 中统计）
    const answerHistoryRes = await db.collection('answer_history')
      .where({
        _openid: openid,
        createdAt: db.command.and(db.command.gte(start), db.command.lte(end))
      })
      .get()

    const correctCount = answerHistoryRes.data.filter(r => r.isCorrect).length
    const correctRate = answerHistoryRes.data.length > 0
      ? Math.round((correctCount / answerHistoryRes.data.length) * 100)
      : 0

    return {
      success: true,
      data: {
        totalScore,
        totalDuration,
        correctRate,
        dailyData: Object.entries(dailyData).map(([date, data]) => ({
          date,
          ...data
        }))
      }
    }
  } catch (err) {
    return { success: false, message: err.message, data: {} }
  }
}

/**
 * 获取学习分析（基于真实数据统计）
 */
async function getAnalysis(openid) {
  try {
    // 题型显示名称映射
    const TYPE_NAMES = {
      pinyin: '拼音练习',
      literature: '古诗词',
      idiom: '成语熟语',
      correction: '病句修改',
      vocabulary: '词汇积累',
      comprehension: '阅读理解',
      grammar: '语法知识',
      reading: '阅读'
    }

    // 获取各类型答题统计
    const types = ['pinyin', 'literature', 'idiom', 'correction', 'vocabulary', 'comprehension', 'grammar', 'reading']
    const typeStats = {}

    for (const type of types) {
      const totalRes = await db.collection('answer_history')
        .where({ _openid: openid, questionType: type })
        .count()
      const correctRes = await db.collection('answer_history')
        .where({ _openid: openid, questionType: type, isCorrect: true })
        .count()

      typeStats[type] = {
        total: totalRes.total,
        correct: correctRes.total,
        accuracy: totalRes.total > 0 ? Math.round((correctRes.total / totalRes.total) * 100) : 0
      }
    }

    // 判断是否有数据
    const hasData = Object.values(typeStats).some(s => s.total > 0)
    if (!hasData) {
      return {
        success: true,
        data: {
          strongPoints: [],
          weakPoints: [],
          trend: 'none',
          suggestions: [],
          typeStats: {}
        }
      }
    }

    // 计算强弱项（准确率 > 80% 为强项，< 60% 为弱项）
    const strongPoints = []
    const weakPoints = []
    for (const [type, stats] of Object.entries(typeStats)) {
      if (stats.total >= 5) { // 至少5题才计入统计
        if (stats.accuracy >= 80) {
          strongPoints.push(TYPE_NAMES[type] || type)
        } else if (stats.accuracy < 60) {
          weakPoints.push(TYPE_NAMES[type] || type)
        }
      }
    }

    // 计算趋势（比较最近7天和之前的平均正确率）
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recentRes = await db.collection('answer_history')
      .where({
        _openid: openid,
        createdAt: db.command.gte(weekAgo)
      })
      .get()
    const recentCorrect = recentRes.data.filter(r => r.isCorrect).length
    const recentAccuracy = recentRes.data.length > 0 ? (recentCorrect / recentRes.data.length) * 100 : 0

    // 获取全部历史正确率
    const allRes = await db.collection('answer_history')
      .where({ _openid: openid })
      .get()
    const allCorrect = allRes.data.filter(r => r.isCorrect).length
    const allAccuracy = allRes.data.length > 0 ? (allCorrect / allRes.data.length) * 100 : 0

    let trend = 'stable'
    if (recentAccuracy > allAccuracy + 10) trend = 'up'
    else if (recentAccuracy < allAccuracy - 10) trend = 'down'

    // 生成建议（基于弱项）
    const suggestions = []
    if (weakPoints.length > 0) {
      for (const weakPoint of weakPoints.slice(0, 2)) {
        suggestions.push({
          title: `加强${weakPoint}练习`,
          desc: `每天练习5道${weakPoint}题目，巩固薄弱环节`
        })
      }
    } else {
      suggestions.push({
        title: '保持学习状态',
        desc: '继续坚持练习，每天完成10道题目'
      })
    }

    return {
      success: true,
      data: {
        strongPoints,
        weakPoints,
        trend,
        suggestions,
        typeStats: Object.fromEntries(
          Object.entries(typeStats).map(([type, stats]) => [
            type,
            { accuracy: stats.accuracy, total: stats.total }
          ])
        )
      }
    }
  } catch (err) {
    return { success: false, message: err.message, data: {} }
  }
}

/**
 * 删除学习记录（验证所有权）
 */
async function deleteRecord(openid, id) {
  try {
    // 先查询记录，验证所有权
    const recordRes = await db.collection('study_records').doc(id).get()

    // 记录不存在
    if (!recordRes.data) {
      return { success: false, message: '记录不存在' }
    }

    // 验证所有权
    if (recordRes.data._openid !== openid) {
      return { success: false, message: '无权删除此记录' }
    }

    await db.collection('study_records').doc(id).remove()
    return { success: true, data: null }
  } catch (err) {
    // doc(id) 可能抛出异常，如 id 格式错误
    return { success: false, message: '删除失败' }
  }
}

/**
 * 获取学习日历
 */
async function getStudyCalendar(openid, year, month) {
  try {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const res = await db.collection('study_records')
      .where({
        _openid: openid,
        createdAt: db.command.and(db.command.gte(startDate), db.command.lte(endDate))
      })
      .get()

    const calendar = res.data.map(r => new Date(r.createdAt).getDate())
    return { success: true, data: calendar }
  } catch (err) {
    return { success: false, message: err.message, data: [] }
  }
}

/**
 * 计算连续学习天数
 * @param {string} openid - 用户openid
 * @returns {number} 连续学习天数
 */
async function calculateStudyStreak(openid) {
  try {
    // 获取所有学习记录的日期
    const res = await db.collection('study_records')
      .where({ _openid: openid })
      .orderBy('createdAt', 'desc')
      .get()

    if (res.data.length === 0) return 0

    // 使用 UTC 时间进行日期计算，避免时区问题
    const dates = res.data
      .map(r => {
        const date = new Date(r.createdAt)
        // 使用 UTC 日期，与 db.serverDate() 保持一致
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
      })
      .filter((d, i, arr) => arr.indexOf(d) === i)
      .sort()
      .reverse()

    if (dates.length === 0) return 0

    console.log('连续学习计算 - 不重复日期:', dates)

    // 获取今天的 UTC 日期
    const now = new Date()
    const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`

    // 获取昨天的 UTC 日期
    const yesterday = new Date(now)
    yesterday.setUTCDate(now.getUTCDate() - 1)
    const yesterdayStr = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`

    console.log('连续学习计算 - 今天:', todayStr, '昨天:', yesterdayStr, '最新记录:', dates[0])

    let streak = 0
    let checkDate = null

    // 检查今天或昨天是否学习
    if (dates[0] === todayStr) {
      streak = 1
      checkDate = new Date(now)
    } else if (dates[0] === yesterdayStr) {
      streak = 1
      checkDate = new Date(yesterday)
    } else {
      console.log('连续学习中断: 最新记录不是今天或昨天')
      return 0 // 没有连续学习
    }

    // 向前检查连续天数
    for (let i = 1; i < dates.length; i++) {
      checkDate.setUTCDate(checkDate.getUTCDate() - 1)
      const checkStr = `${checkDate.getUTCFullYear()}-${String(checkDate.getUTCMonth() + 1).padStart(2, '0')}-${String(checkDate.getUTCDate()).padStart(2, '0')}`

      if (dates.includes(checkStr)) {
        streak++
      } else {
        break
      }
    }

    console.log('连续学习天数:', streak)
    return streak
  } catch (err) {
    console.error('连续学习计算出错:', err)
    return 0
  }
}
