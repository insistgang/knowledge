/**
 * 学习报告页面
 */
import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { useDidShow, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import studyService from '../../services/study'
import { pageShareConfigs } from '../../utils/share'
import './index.less'

function StudyReport() {
  const [report, setReport] = useState({
    totalScore: 0,
    totalDuration: 0,
    correctRate: 0,
    dailyData: []
  })
  const [timeRange, setTimeRange] = useState('week') // week | month
  const [loading, setLoading] = useState(true)

  useDidShow(() => {
    loadReport()
  })

  // 启用页面分享
  useShareAppMessage(() => {
    return pageShareConfigs.studyReport
  })

  // 启用朋友圈分享
  useShareTimeline(() => {
    return {
      title: pageShareConfigs.studyReport.title,
      query: ''
    }
  })

  const loadReport = async () => {
    setLoading(true)
    try {
      // 计算日期范围
      const now = new Date()
      const days = timeRange === 'week' ? 7 : 30
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      const endDate = now

      const data = await studyService.getReport(
        startDate.toISOString(),
        endDate.toISOString()
      )

      // 如果返回了真实数据，使用真实数据
      if (data && (data.totalScore > 0 || data.dailyData?.length > 0)) {
        setReport(data)
      } else {
        // 如果没有数据，返回零值
        setReport({
          totalScore: 0,
          totalDuration: 0,
          correctRate: 0,
          dailyData: generateEmptyDailyData(days)
        })
      }
    } catch (err) {
      console.error('加载报告失败:', err)
      // 返回空数据而不是模拟数据
      setReport({
        totalScore: 0,
        totalDuration: 0,
        correctRate: 0,
        dailyData: generateEmptyDailyData(timeRange === 'week' ? 7 : 30)
      })
    } finally {
      setLoading(false)
    }
  }

  // 生成空的每日数据
  const generateEmptyDailyData = (days) => {
    const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const data = []
    for (let i = 0; i < Math.min(days, 7); i++) {
      data.push({
        date: weekDays[i],
        score: 0,
        duration: 0
      })
    }
    return data
  }

  const handleTimeRangeChange = (range) => {
    setTimeRange(range)
    loadReport()
  }

  return (
    <View className="study-report-page">
      <View className="time-range-tabs">
        <View
          className={`tab ${timeRange === 'week' ? 'active' : ''}`}
          onClick={() => handleTimeRangeChange('week')}
        >
          本周
        </View>
        <View
          className={`tab ${timeRange === 'month' ? 'active' : ''}`}
          onClick={() => handleTimeRangeChange('month')}
        >
          本月
        </View>
      </View>

      <ScrollView scrollY className="content-scroll">
        {loading ? (
          <View className="loading-state">
            <Text>加载中...</Text>
          </View>
        ) : (
          <>
            {/* 统计卡片 */}
            <View className="stats-cards">
              <View className="stat-item">
                <Text className="stat-value">{report.totalScore}</Text>
                <Text className="stat-label">总得分</Text>
              </View>
              <View className="stat-item">
                <Text className="stat-value">{report.totalDuration}</Text>
                <Text className="stat-label">学习时长(分)</Text>
              </View>
              <View className="stat-item">
                <Text className="stat-value">{report.correctRate}%</Text>
                <Text className="stat-label">正确率</Text>
              </View>
            </View>

            {/* 学习趋势 */}
            <View className="chart-section">
              <View className="section-title">学习趋势</View>
              <View className="chart-placeholder">
                <View className="bar-chart">
                  {report.dailyData.map((item, index) => (
                    <View key={index} className="bar-item">
                      <View
                        className="bar"
                        style={{ height: `${Math.max(item.duration || 5, 5)}px`, background: item.score > 0 ? '#4A90E2' : '#E0E0E0' }}
                      />
                      <Text className="bar-label">{item.date}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* 学习建议 */}
            <View className="tips-section">
              <View className="section-title">学习建议</View>
              {report.totalScore > 0 ? (
                <View className="tips-list">
                  <View className="tip-item">
                    <Text className="tip-icon">💡</Text>
                    <Text className="tip-text">保持每天学习，养成良好的学习习惯</Text>
                  </View>
                  <View className="tip-item">
                    <Text className="tip-icon">📚</Text>
                    <Text className="tip-text">继续坚持练习，每天完成10道题目</Text>
                  </View>
                </View>
              ) : (
                <View className="empty-tips">
                  <Text className="empty-tip-text">开始学习后，这里会显示你的学习建议</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

export default StudyReport
