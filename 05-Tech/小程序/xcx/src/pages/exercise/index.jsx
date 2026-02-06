/**
 * 练习中心 - AI语文助手
 */
import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { useDidShow, navigateTo, useShareAppMessage, useShareTimeline, switchTab } from '@tarojs/taro'
import studyService from '../../services/study'
import eventBus, { EVENTS } from '../../utils/eventBus'
import { pageShareConfigs } from '../../utils/share'
import { requireLogin } from '../../utils/authCheck'
import './index.less'

// 题型配置
const QUESTION_TYPES = [
  { id: 'pinyin', name: '拼音练习', icon: '🔤', desc: '汉语拼音学习', color: '#10B981', path: '/pages/pinyin/index' },
  { id: 'idiom', name: '成语熟语', icon: '🦊', desc: '成语积累运用', color: '#F59E0B', path: '/pages/idiom/index' },
  { id: 'vocabulary', name: '词汇学习', icon: '📖', desc: '词语释义辨析', color: '#4A90E2', path: '/pages/vocabulary/index' },
  { id: 'correction', name: '病句修改', icon: '✏️', desc: '语法病句分析', color: '#EF4444', path: '/pages/correction/index' }
]

function Exercise() {
  const [questionCounts, setQuestionCounts] = useState({
    pinyin: 0,
    idiom: 0,
    vocabulary: 0,
    correction: 0,
    total: 0
  })
  const [wrongCount, setWrongCount] = useState(0)
  const [favoriteCount, setFavoriteCount] = useState(0)

  // 加载题目数量统计
  const loadStats = async () => {
    try {
      // 获取题库数量统计
      const stats = await studyService.getHomeStatistics()
      if (stats.progress) {
        setQuestionCounts({
          pinyin: stats.progress.pinyin || 0,
          idiom: stats.progress.idiom || 0,
          vocabulary: stats.progress.vocabulary || 0,
          correction: stats.progress.correction || 0,
          total: (stats.progress.pinyin || 0) + (stats.progress.idiom || 0) +
                 (stats.progress.vocabulary || 0) + (stats.progress.correction || 0)
        })
      }

      // 错题数
      setWrongCount(stats.wrongCount || 0)

      // TODO: 获取收藏数量（可以从 favorites 集合获取）
      setFavoriteCount(0)
    } catch (err) {
      console.error('加载统计数据失败:', err)
    }
  }

  // 监听学习记录更新事件
  useEffect(() => {
    const unsubscribe = eventBus.on(EVENTS.STUDY_RECORD_UPDATED, () => {
      loadStats()
    })
    return unsubscribe
  }, [])

  useDidShow(() => {
    loadStats()
  })

  // 启用页面分享
  useShareAppMessage(() => {
    return pageShareConfigs.exercise
  })

  // 启用朋友圈分享
  useShareTimeline(() => {
    return {
      title: pageShareConfigs.exercise.title,
      query: ''
    }
  })

  // 处理练习卡片点击（需要登录）
  const handleCardClick = async (path) => {
    const isLogin = await requireLogin({ message: '练习功能需要登录后使用' })
    if (isLogin) {
      navigateTo({ url: path })
    }
  }

  // 碎片化学习 - 2x2彩色卡片（传递正确的题目数量参数）
  const fragmentCards = [
    { id: 'speed3', name: '极速3题', icon: '⚡', duration: '1分钟', gradient: 'orange-red', action: () => handleCardClick('/pages/exercise-detail/index?count=3') },
    { id: 'quick5', name: '快速5题', icon: '🚀', duration: '2分钟', gradient: 'cyan-green', action: () => handleCardClick('/pages/exercise-detail/index?count=5') },
    { id: 'random10', name: '随机10题', icon: '🎲', duration: '5分钟', gradient: 'green', action: () => handleCardClick('/pages/exercise-detail/index?count=10') },
    { id: 'mock', name: '模拟考试', icon: '📊', duration: '120分钟', gradient: 'orange-yellow', action: () => handleCardClick('/pages/mock-exam/index') }
  ]

  // 更多功能 - 指向专门页面
  const moreFeatures = [
    { id: 'record', name: '做题记录', icon: '📋', desc: '查看历史记录', path: '/pages/study-record/index' },
    { id: 'wrong', name: '错题集', icon: '❌', desc: '错题重做练习', path: '/pages/wrong-practice/index' },
    { id: 'favorite', name: '收藏夹', icon: '⭐', desc: '收藏题目练习', path: '/pages/favorite-practice/index' }
  ]

  return (
    <View className="exercise-page">
      <ScrollView scrollY className="content-scroll">
        {/* 碎片化学习 - 2x2彩色卡片 */}
        <View className="fragment-section">
          <View className="section-title-row">
            <Text className="section-icon">🎲</Text>
            <Text className="section-title">碎片化学习</Text>
          </View>
          <View className="fragment-grid">
            {fragmentCards.map((card) => (
              <View
                key={card.id}
                className={`fragment-card fragment-${card.gradient}`}
                onClick={card.action}
              >
                <Text className="fragment-icon">{card.icon}</Text>
                <Text className="fragment-name">{card.name}</Text>
                <Text className="fragment-duration">{card.duration}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 复习专区 */}
        <View className="review-section">
          <View className="section-title-row">
            <Text className="section-icon">📚</Text>
            <Text className="section-title">复习专区</Text>
          </View>
          <View className="review-grid">
            <View
              className="review-item review-wrong"
              onClick={async () => {
                const isLogin = await requireLogin({ message: '查看错题需要登录' })
                if (isLogin) navigateTo({ url: '/pages/wrong-practice/index' })
              }}
            >
              <Text className="review-icon">❌</Text>
              <Text className="review-name">错题重做</Text>
            </View>
            <View
              className="review-item review-favorite"
              onClick={async () => {
                const isLogin = await requireLogin({ message: '查看收藏需要登录' })
                if (isLogin) navigateTo({ url: '/pages/favorite-practice/index' })
              }}
            >
              <Text className="review-icon">⭐</Text>
              <Text className="review-name">收藏练习</Text>
            </View>
          </View>
        </View>

        {/* 题型分类 */}
        <View className="type-section">
          <View className="section-title-row">
            <Text className="section-icon">📋</Text>
            <Text className="section-title">题型分类</Text>
          </View>
          <View className="type-list">
            {QUESTION_TYPES.map((type) => {
              const count = questionCounts[type.id] || 0
              return (
                <View
                  key={type.id}
                  className="type-item"
                  onClick={() => navigateTo({ url: type.path })}
                >
                  <View className="type-icon-wrapper" style={{ backgroundColor: type.color + '20' }}>
                    <Text className="type-icon">{type.icon}</Text>
                  </View>
                  <View className="type-info">
                    <Text className="type-name">{type.name}</Text>
                    <Text className="type-desc">{type.desc}</Text>
                  </View>
                  <View className="type-badge" style={{ backgroundColor: type.color }}>
                    <Text className="badge-count">{count}</Text>
                  </View>
                  <Text className="type-arrow">›</Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* 更多功能 */}
        <View className="more-section">
          <View className="section-title-row">
            <Text className="section-icon">⚡</Text>
            <Text className="section-title">更多功能</Text>
          </View>
          <View className="more-grid">
            {moreFeatures.map((feature) => (
              <View
                key={feature.id}
                className="more-item"
                onClick={() => navigateTo({ url: feature.path })}
              >
                <View className="more-icon">{feature.icon}</View>
                <Text className="more-name">{feature.name}</Text>
                <Text className="more-desc">{feature.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 底部留白 */}
        <View style={{ height: '100rpx' }} />
      </ScrollView>
    </View>
  )
}

export default Exercise
