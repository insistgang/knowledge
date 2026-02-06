/**
 * 错题重做页面
 */
import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { useDidShow, useShareAppMessage, useShareTimeline, navigateTo, showToast } from '@tarojs/taro'
import questionService from '../../services/question'
import { pageShareConfigs } from '../../utils/share'
import './index.less'

function WrongPractice() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  useDidShow(() => {
    loadWrongQuestions()
  })

  useShareAppMessage(() => pageShareConfigs.exercise)
  useShareTimeline(() => pageShareConfigs.exercise)

  const loadWrongQuestions = async () => {
    setLoading(true)
    try {
      console.log('=== 加载错题列表 ===')
      const data = await questionService.getWrongQuestions(1, 100)
      console.log('获取到错题数量:', data?.length || 0)
      console.log('错题数据示例:', data?.[0] ? { id: data[0].id, questionId: data[0].questionId, type: data[0].type } : '无')
      setQuestions(data || [])
    } catch (err) {
      console.error('加载错题失败:', err)
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleStartPractice = () => {
    if (questions.length === 0) {
      showToast({ title: '暂无错题', icon: 'none' })
      return
    }

    console.log('=== 开始错题重做 ===')
    console.log('错题数量:', questions.length)
    console.log('即将跳转到 mode=wrong 模式')

    // 传递全部错题数量
    navigateTo({
      url: `/pages/exercise-detail/index?mode=wrong&count=${questions.length}`
    })
  }

  if (loading) {
    return (
      <View className="wrong-practice-page">
        <View className="header-card">
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="wrong-practice-page">
      {/* 顶部红色卡片 */}
      <View className="header-card">
        <View className="icon">❌</View>
        <Text className="title">错题本</Text>
        <Text className="subtitle">攻克薄弱知识点</Text>
        <View className="stats">
          <View className="stat-item">
            <Text className="stat-value">{questions.length}</Text>
            <Text className="stat-label">错题总数</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{questions.length}</Text>
            <Text className="stat-label">待重做</Text>
          </View>
        </View>
        {questions.length > 0 ? (
          <View className="start-btn" onClick={handleStartPractice}>
            <Text>开始重做</Text>
          </View>
        ) : (
          <View className="empty-tip">
            <Text>🎉 暂无错题，继续努力学习吧！</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default WrongPractice
