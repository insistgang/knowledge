/**
 * 首页 - AI语文助手
 */
import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useDidShow, navigateTo, switchTab, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { useAuth } from '../../context/AuthContext'
import studyService from '../../services/study'
import eventBus, { EVENTS } from '../../utils/eventBus'
import { pageShareConfigs } from '../../utils/share'
import { requireLogin } from '../../utils/authCheck'
import './index.less'

// 名言警句库
const QUOTES = [
  { text: '学而时习之，不亦说乎？', author: '《论语》' },
  { text: '读书破万卷，下笔如有神。', author: '杜甫' },
  { text: '书山有路勤为径，学海无涯苦作舟。', author: '韩愈' },
  { text: '温故而知新，可以为师矣。', author: '《论语》' },
  { text: '业精于勤，荒于嬉；行成于思，毁于随。', author: '韩愈' },
  { text: '少壮不努力，老大徒伤悲。', author: '《长歌行》' },
  { text: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '佚名' },
  { text: '千里之行，始于足下。', author: '《老子》' }
]

function Home() {
  const { userInfo } = useAuth()
  const [stats, setStats] = useState({
    todayScore: 0,
    totalQuestions: 0,
    accuracy: 0
  })
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [examCountdown, setExamCountdown] = useState(0)

  // 计算距离2026年3月30日的考试倒计时
  const getExamCountdown = () => {
    const examDate = new Date('2026-03-30T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffTime = examDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  // 组件挂载时计算倒计时
  useEffect(() => {
    setExamCountdown(getExamCountdown())
  }, [])

  // 加载首页统计数据
  const loadStats = async () => {
    try {
      const data = await studyService.getHomeStatistics()
      setStats({
        todayScore: data.todayScore || 0,
        totalQuestions: data.totalQuestions || data.todayQuestionCount || 0,
        accuracy: data.accuracy || 0
      })
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
    return {
      ...pageShareConfigs.home,
      success: () => {
        console.log('分享成功')
      }
    }
  })

  // 启用朋友圈分享
  useShareTimeline(() => {
    return {
      title: pageShareConfigs.home.title,
      query: ''
    }
  })

  // 名言轮播
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // 获取问候语
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 9) return '早上好'
    if (hour < 12) return '上午好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    if (hour < 22) return '晚上好'
    return '夜深了'
  }

  // 学习模块配置（带颜色主题）
  const studyModules = [
    { id: 'vocabulary', name: '词汇学习', icon: '📖', desc: '词语释义与运用', theme: 'blue', path: '/pages/vocabulary/index' },
    { id: 'idiom', name: '成语熟语', icon: '🦊', desc: '成语积累与练习', theme: 'orange', path: '/pages/idiom/index' },
    { id: 'pinyin', name: '拼音练习', icon: '🔤', desc: '拼音声调学习', theme: 'green', path: '/pages/pinyin/index' },
    { id: 'correction', name: '病句修改', icon: '✏️', desc: '语法病句分析', theme: 'yellow', path: '/pages/correction/index' }
  ]

  // 快捷功能配置
  const quickActions = [
    { id: 'mock', name: '模拟考试', icon: '📝', desc: '真题模拟测试', path: '/pages/mock-exam/index' },
    { id: 'chat', name: '智能答疑', icon: '🤖', desc: '语文问题解答', path: '/pages/chat/index' },
    { id: 'record', name: '学习记录', icon: '📊', desc: '查看学习历史', path: '/pages/study-record/index' },
    { id: 'report', name: '学习报告', icon: '📈', desc: '学习数据分析', path: '/pages/study-report/index' }
  ]

  // 处理导航（学习模块游客可进，其他功能需登录）
  const handleNavigate = async (path) => {
    // 学习模块允许游客浏览
    const guestPaths = ['/pages/vocabulary', '/pages/idiom', '/pages/pinyin', '/pages/correction']
    const isGuestPath = guestPaths.some(p => path.includes(p))
    
    if (!isGuestPath) {
      const isLogin = await requireLogin({ message: '该功能需要登录后使用' })
      if (!isLogin) return
    }
    
    // chat是tabBar页面，需要使用switchTab
    if (path.includes('/pages/chat/index')) {
      switchTab({ url: path })
    } else {
      navigateTo({ url: path })
    }
  }

  return (
    <View className="home-page">
      <ScrollView scrollY className="content-scroll">
        {/* 头部问候区 - 蓝色渐变背景 */}
        <View className="header-section">
          <View className="header-content">
            {/* 左侧头像 */}
            <View className="avatar-wrapper">
              {userInfo?.avatar ? (
                <Image src={userInfo.avatar} className="avatar-img" />
              ) : (
                <View className="avatar-default">
                  <Text className="avatar-text">{(userInfo?.nickname || '同学')[0] || '同'}</Text>
                </View>
              )}
            </View>

            {/* 右侧问候 */}
            <View className="greeting-wrapper">
              <Text className="greeting-text">{getGreeting()}，{userInfo?.nickname || '同学'}！</Text>
              <Text className="greeting-subtitle">今天也要加油学习哦！</Text>
            </View>
          </View>

          {/* 考试倒计时横幅 */}
          <View className="study-days-banner">
            <Text className="days-icon">📅</Text>
            <Text className="days-text">距离考试还剩 {examCountdown} 天</Text>
          </View>
        </View>

        {/* 今日统计卡片 - 白色圆角阴影 */}
        <View className="stats-section">
          <View className="stats-card">
            <View className="stat-item stat-blue">
              <Text className="stat-value">{stats.todayScore}</Text>
              <Text className="stat-label">今日得分</Text>
            </View>
            <View className="stat-divider" />
            <View className="stat-item stat-orange">
              <Text className="stat-value">{stats.totalQuestions}</Text>
              <Text className="stat-label">做题数</Text>
            </View>
            <View className="stat-divider" />
            <View className="stat-item stat-green">
              <Text className="stat-value">{stats.accuracy}%</Text>
              <Text className="stat-label">正确率</Text>
            </View>
          </View>
        </View>

        {/* 学习模块 - 2x2网格，彩色顶边 */}
        <View className="section">
          <View className="section-header">
            <Text className="section-title">学习模块</Text>
            <Text className="section-more">查看全部 {'>'}</Text>
          </View>
          <View className="module-grid">
            {studyModules.map((module) => (
              <View
                key={module.id}
                className={`module-item module-${module.theme}`}
                onClick={() => handleNavigate(module.path)}
              >
                <View className="module-border" />
                <View className="module-icon">{module.icon}</View>
                <Text className="module-name">{module.name}</Text>
                <Text className="module-desc">{module.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 快捷功能 - 横向4个入口 */}
        <View className="section">
          <View className="section-header">
            <Text className="section-title">快捷功能</Text>
          </View>
          <View className="quick-grid">
            {quickActions.map((action) => (
              <View
                key={action.id}
                className="quick-item"
                onClick={() => handleNavigate(action.path)}
              >
                <View className="quick-icon">{action.icon}</View>
                <Text className="quick-name">{action.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 名言警句 - 紫色渐变 */}
        <View className="quote-section">
          <View className="quote-card">
            <Text className="quote-icon">💭</Text>
            <Text className="quote-text">"{QUOTES[quoteIndex].text}"</Text>
            <Text className="quote-author">—— {QUOTES[quoteIndex].author}</Text>
            {/* 轮播指示点 */}
            <View className="quote-dots">
              {QUOTES.map((_, index) => (
                <View
                  key={index}
                  className={`dot ${index === quoteIndex ? 'dot-active' : ''}`}
                />
              ))}
            </View>
          </View>
        </View>

        {/* 底部留白 */}
        <View style={{ height: '100rpx' }} />
      </ScrollView>
    </View>
  )
}

export default Home
