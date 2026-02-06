/**
 * 学习记录服务
 */
import Taro from '@tarojs/taro'
import { callCloudFunction } from './request'
import { CLOUD_FUNCTIONS, STUDY_TYPES, TIME_RANGES, DEFAULT_PAGE } from '../utils/constants'

// 模拟学习记录数据
const MOCK_RECORDS = [
  { id: 1, type: 'vocabulary', title: '词汇学习', date: '2025-01-03', score: 85, duration: 15, correctCount: 8, totalCount: 10 },
  { id: 2, type: 'idiom', title: '成语学习', date: '2025-01-03', score: 90, duration: 12, correctCount: 9, totalCount: 10 },
  { id: 3, type: 'pinyin', title: '拼音练习', date: '2025-01-03', score: 75, duration: 10, correctCount: 6, totalCount: 8 },
  { id: 4, type: 'correction', title: '病句修改', date: '2025-01-02', score: 88, duration: 20, correctCount: 7, totalCount: 8 },
  { id: 5, type: 'vocabulary', title: '词汇学习', date: '2025-01-02', score: 82, duration: 15, correctCount: 9, totalCount: 10 },
  { id: 6, type: 'pinyin', title: '拼音练习', date: '2025-01-02', score: 95, duration: 18, correctCount: 10, totalCount: 10 },
  { id: 7, type: 'idiom', title: '成语练习', date: '2025-01-01', score: 78, duration: 15, correctCount: 7, totalCount: 10 },
  { id: 8, type: 'correction', title: '病句修改', date: '2025-01-01', score: 85, duration: 20, correctCount: 6, totalCount: 8 },
  { id: 9, type: 'mock_exam', title: '模拟考试', date: '2024-12-31', score: 80, duration: 60, correctCount: 4, totalCount: 5 },
  { id: 10, type: 'vocabulary', title: '词汇学习', date: '2024-12-31', score: 88, duration: 15, correctCount: 8, totalCount: 10 }
]

class StudyService {
  /**
   * 添加学习记录
   */
  async addRecord(data) {
    try {
      console.log('[studyService] 调用 addRecord 云函数，数据:', data)
      const res = await callCloudFunction(CLOUD_FUNCTIONS.STUDY, {
        action: 'add',
        ...data
      })
      console.log('[studyService] addRecord 云函数返回:', res)

      // 修复：返回完整响应，保留 success 标志
      // 云函数返回 { success: true, data: { _id: 'xxx', ... } }
      // 如果只返回 res.data，会丢失 success 标志
      if (res && res.success) {
        return res
      }
      // 兼容处理：如果没有 success 标志但有 data，说明成功了
      return { success: true, data: res.data || res }
    } catch (err) {
      console.error('[studyService] 添加记录失败（云函数未部署或网络错误）:', err, '数据:', data)
      return { success: false, error: err.message }
    }
  }

  /**
   * 批量添加学习记录
   */
  async addRecords(records) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.STUDY, {
        action: 'addBatch',
        records
      })
      return res.data || []
    } catch (err) {
      console.log('批量添加失败（本地模式）')
      return records.map(r => ({ ...r, id: Date.now() + Math.random() }))
    }
  }

  /**
   * 获取学习记录列表
   */
  async getRecords(filters = {}, page = DEFAULT_PAGE.page, pageSize = DEFAULT_PAGE.pageSize) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.STUDY, {
        action: 'list',
        ...filters,
        page,
        pageSize
      })
      if (res.data && res.data.length > 0) {
        return res.data
      }
    } catch (err) {
      console.log('获取记录失败，返回空数组')
    }

    // 不再使用假数据，返回空数组让前端显示"暂无学习记录"
    return []
  }

  /**
   * 获取学习统计
   * 基于云函数返回真实数据，失败时返回零值
   */
  async getStatistics(timeRange = TIME_RANGES.MONTH) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.STUDY, {
        action: 'statistics',
        timeRange
      })
      if (res.data && res.success) {
        // 从云函数获取基础数据
        const baseData = res.data

        // 尝试从 question 云函数获取答题统计
        try {
          const questionRes = await callCloudFunction(CLOUD_FUNCTIONS.QUESTION, {
            action: 'stats'
          })

          if (questionRes.data && questionRes.success) {
            return {
              totalDays: baseData.totalDays || 1,
              totalScore: baseData.totalScore || 0,
              totalQuestions: questionRes.data.answered || 0,
              correctRate: questionRes.data.accuracy || 0
            }
          }
        } catch (e) {
          // 忽略 question 统计失败，使用基础数据
        }

        return {
          totalDays: baseData.totalDays || 1,
          totalScore: baseData.totalScore || 0,
          totalQuestions: baseData.totalQuestions || 0,
          correctRate: baseData.correctRate || 0
        }
      }
    } catch (err) {
      console.log('获取统计失败，返回零值')
    }

    // 返回零值（不再使用模拟数据）
    return {
      totalDays: 0,
      totalScore: 0,
      totalQuestions: 0,
      correctRate: 0
    }
  }

  /**
   * 获取首页统计数据
   * 基于云函数返回真实数据，失败时返回零值（而非模拟数据）
   */
  async getHomeStatistics() {
    try {
      console.log('[studyService] 调用 getHomeStatistics 云函数')
      const res = await callCloudFunction(CLOUD_FUNCTIONS.STUDY, {
        action: 'homeStats'
      })
      console.log('[studyService] getHomeStatistics 云函数返回:', res)
      if (res.data && res.success && Object.keys(res.data).length > 0) {
        return res.data
      }
    } catch (err) {
      console.error('[studyService] 获取首页统计失败，返回零值:', err)
    }

    // 返回零值（不再使用硬编码的模拟数据）
    return {
      todayScore: 0,
      wrongCount: 0,
      totalDuration: 0,
      studyDays: 1,
      accuracy: 0,
      progress: {
        pinyin: 0,
        idiom: 0,
        vocabulary: 0,
        correction: 0
      }
    }
  }

  /**
   * 获取学习报告
   */
  async getReport(startDate, endDate) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.STUDY, {
        action: 'report',
        startDate,
        endDate
      })
      if (res.data && Object.keys(res.data).length > 0) {
        return res.data
      }
    } catch (err) {
      console.log('获取报告失败，返回空数据')
    }

    // 返回空数据结构（不使用假数据）
    return {
      totalScore: 0,
      totalDuration: 0,
      correctRate: 0,
      dailyData: [],
      typeStats: []
    }
  }

  /**
   * 获取学习分析
   */
  async getAnalysis() {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.STUDY, {
        action: 'analysis'
      })
      if (res.data && Object.keys(res.data).length > 0) {
        return res.data
      }
    } catch (err) {
      console.log('获取分析失败，返回空数据')
    }

    // 返回空数据结构（不使用假数据）
    return {
      strongPoints: [],
      weakPoints: [],
      trend: 'none',
      suggestions: [],
      weeklyTrend: []
    }
  }

  /**
   * 删除学习记录
   */
  async deleteRecord(id) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.STUDY, {
        action: 'delete',
        id
      })
      return res.success
    } catch (err) {
      console.log('删除记录失败（本地模式）')
      Taro.showToast({ title: '删除失败', icon: 'none' })
      return false
    }
  }

  /**
   * 获取学习日历（打卡记录）
   */
  async getStudyCalendar(year, month) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.STUDY, {
        action: 'calendar',
        year,
        month
      })
      if (res.data && res.data.length > 0) {
        return res.data
      }
    } catch (err) {
      console.log('获取日历失败，返回空数组')
    }

    // 返回空数组（不使用假数据）
    return []
  }

  /**
   * 记录学习行为
   */
  async trackStudy(type, data = {}) {
    return await this.addRecord({
      type,
      ...data,
      timestamp: Date.now()
    })
  }

  /**
   * 获取用户成就数据
   * 基于真实答题记录计算成就进度
   */
  async getAchievements() {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.QUESTION, {
        action: 'achievements'
      })
      if (res.data && Object.keys(res.data).length > 0) {
        return res.data
      }
    } catch (err) {
      console.log('获取成就失败，计算本地数据')
    }

    // 本地计算成就数据（基于 answer_history 和 study_records）
    return this.calculateLocalAchievements()
  }

  /**
   * 本地计算成就数据
   * 当云函数不可用时使用
   */
  async calculateLocalAchievements() {
    try {
      // 获取学习记录统计
      const stats = await this.getStatistics()
      const homeStats = await this.getHomeStatistics()

      // 计算成就
      const totalQuestions = stats.totalQuestions || 0
      const totalScore = stats.totalScore || 0
      const studyDays = homeStats.studyDays || 1
      const accuracy = stats.correctRate || 0

      // 满分次数（从学习记录中统计）
      const records = await this.getRecords({}, 1, 100)
      const perfectCount = records.filter(r => r.score === 100).length

      // 连续学习天数（使用 homeStats.studyDays）
      const streakDays = homeStats.studyDays || 1

      return {
        beginner: { unlocked: totalQuestions > 0, progress: '已解锁' },
        week: { unlocked: streakDays >= 7, progress: `${Math.min(streakDays, 7)}/7天` },
        perfect: { unlocked: perfectCount >= 10, progress: `${perfectCount}/10次` },
        master: { unlocked: totalQuestions >= 500, progress: `${totalQuestions}/500题` },
        speed: { unlocked: totalQuestions >= 100, progress: `${Math.min(totalQuestions, 100)}/100题` },
        bookworm: { unlocked: totalScore >= 1000, progress: `${totalScore}/1000分` },
        scholar: { unlocked: accuracy >= 90 && totalQuestions >= 50, progress: `${accuracy}%` }
      }
    } catch (err) {
      // 返回默认成就数据
      return {
        beginner: { unlocked: true, progress: '已解锁' },
        week: { unlocked: false, progress: '1/7天' },
        perfect: { unlocked: false, progress: '0/10次' },
        master: { unlocked: false, progress: '0/500题' },
        speed: { unlocked: false, progress: '0/100题' },
        bookworm: { unlocked: false, progress: '0/1000分' },
        scholar: { unlocked: false, progress: '0%' }
      }
    }
  }
}

export default new StudyService()
