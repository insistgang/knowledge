/**
 * 学习分析页面
 */
import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import studyService from '../../services/study'
import { pageShareConfigs } from '../../utils/share'
import './index.less'

function StudyAnalysis() {
  const [analysis, setAnalysis] = useState({
    strongPoints: [],
    weakPoints: [],
    trend: 'stable',
    suggestions: []
  })

  useEffect(() => {
    loadAnalysis()
  }, [])

  // 启用页面分享
  useShareAppMessage(() => {
    return pageShareConfigs.profile
  })

  // 启用朋友圈分享
  useShareTimeline(() => {
    return {
      title: pageShareConfigs.profile.title,
      query: ''
    }
  })

  const loadAnalysis = async () => {
    try {
      const data = await studyService.getAnalysis()
      setAnalysis(data)
    } catch (err) {
      // 模拟数据
      setAnalysis({
        strongPoints: ['古诗词', '词汇积累'],
        weakPoints: ['病句修改', '文言文'],
        trend: 'up',
        suggestions: [
          { title: '加强病句修改练习', desc: '每天练习5道病句修改题' },
          { title: '增加文言文阅读', desc: '每天阅读一篇文言文短文' },
          { title: '巩固古诗词', desc: '继续保持古诗词学习优势' }
        ]
      })
    }
  }

  return (
    <View className="study-analysis-page">
      <ScrollView scrollY className="content-scroll">
        {/* 优势分析 */}
        <View className="analysis-section">
          <View className="section-title with-icon">
            <Text className="title-icon">💪</Text>
            <Text className="title-text">学习优势</Text>
          </View>
          <View className="tags-list">
            {analysis.strongPoints.map((item, index) => (
              <View key={index} className="tag-item good">
                <Text className="tag-icon">✓</Text>
                <Text className="tag-text">{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 薄弱环节 */}
        <View className="analysis-section">
          <View className="section-title with-icon">
            <Text className="title-icon">🎯</Text>
            <Text className="title-text">需要加强</Text>
          </View>
          <View className="tags-list">
            {analysis.weakPoints.map((item, index) => (
              <View key={index} className="tag-item weak">
                <Text className="tag-icon">!</Text>
                <Text className="tag-text">{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 学习趋势 */}
        <View className="analysis-section">
          <View className="section-title with-icon">
            <Text className="title-icon">📈</Text>
            <Text className="title-text">学习趋势</Text>
          </View>
          <View className="trend-card">
            <Text className="trend-icon">
              {analysis.trend === 'up' ? '📈' : analysis.trend === 'down' ? '📉' : '➡️'}
            </Text>
            <Text className="trend-text">
              {analysis.trend === 'up' ? '稳步上升' : analysis.trend === 'down' ? '需要加油' : '保持平稳'}
            </Text>
          </View>
        </View>

        {/* 个性化建议 */}
        <View className="analysis-section">
          <View className="section-title with-icon">
            <Text className="title-icon">🌟</Text>
            <Text className="title-text">个性化建议</Text>
          </View>
          <View className="suggestions-list">
            {analysis.suggestions.map((item, index) => (
              <View key={index} className="suggestion-item">
                <View className="suggestion-header">
                  <Text className="suggestion-num">{index + 1}</Text>
                  <Text className="suggestion-title">{item.title}</Text>
                </View>
                <Text className="suggestion-desc">{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default StudyAnalysis
