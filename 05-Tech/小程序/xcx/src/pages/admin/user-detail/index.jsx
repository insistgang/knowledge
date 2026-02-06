/**
 * 用户详情页面
 */
import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { getCurrentInstance, navigateBack } from '@tarojs/taro'
import adminService from '../../../services/admin'
import './index.less'

function UserDetailPage() {
  const instance = getCurrentInstance()
  const params = instance.router.params
  const targetOpenid = params.openid

  const [userInfo, setUserInfo] = useState(null)
  const [stats, setStats] = useState(null)
  const [typeStats, setTypeStats] = useState(null)
  const [studyRecords, setStudyRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserDetail()
  }, [])

  /**
   * 加载用户详情
   */
  const loadUserDetail = async () => {
    setLoading(true)
    try {
      const data = await adminService.getUserDetail(targetOpenid)
      setUserInfo(data.userInfo)
      setStats(data.stats)
      setTypeStats(data.typeStats)
      setStudyRecords(data.studyRecords || [])
    } catch (err) {
      console.error('加载用户详情失败:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 格式化日期
   */
  const formatDate = (date) => {
    if (!date) return '-'
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  /**
   * 格式化日期时间
   */
  const formatDateTime = (date) => {
    if (!date) return '-'
    const d = new Date(date)
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  /**
   * 获取题型名称
   */
  const getTypeName = (type) => {
    const typeMap = {
      'pinyin': '拼音练习',
      'idiom': '成语熟语',
      'vocabulary': '词汇学习',
      'correction': '病句修改',
      'literature': '诗词鉴赏',
      'grammar': '语法知识',
      'reading': '阅读理解',
      'unknown': '其他'
    }
    return typeMap[type] || type
  }

  if (loading) {
    return (
      <View className="user-detail-page">
        <View className="loading-state">
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  if (!userInfo) {
    return (
      <View className="user-detail-page">
        <View className="error-state">
          <Text>用户不存在</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="user-detail-page">
      <ScrollView scrollY className="content-scroll">
        {/* 用户信息卡片 */}
        <View className="info-card">
          <View className="user-header">
            <View className="avatar-large">
              <Text className="avatar-text">{userInfo.nickName?.charAt(0) || '用'}</Text>
            </View>
            <View className="user-meta">
              <Text className="user-name-large">{userInfo.nickName || '未设置'}</Text>
              <Text className="user-openid">ID: {targetOpenid.substring(0, 16)}...</Text>
            </View>
          </View>
          <View className="join-date">
            <Text className="join-label">注册时间：</Text>
            <Text className="join-value">{formatDate(userInfo.createdAt)}</Text>
          </View>
        </View>

        {/* 学习统计 */}
        <View className="section-card">
          <Text className="section-title">📊 学习统计</Text>
          <View className="stats-grid-3">
            <View className="stat-item">
              <Text className="stat-number">{stats?.answerCount || 0}</Text>
              <Text className="stat-label">答题数</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-number">{stats?.correctCount || 0}</Text>
              <Text className="stat-label">正确数</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-number">{stats?.accuracy || 0}%</Text>
              <Text className="stat-label">正确率</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-number">{stats?.studyDays || 0}</Text>
              <Text className="stat-label">学习记录</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-number">{stats?.favoriteCount || 0}</Text>
              <Text className="stat-label">收藏数</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-number">{stats?.wrongCount || 0}</Text>
              <Text className="stat-label">错题数</Text>
            </View>
          </View>
        </View>

        {/* 题型统计 */}
        {typeStats && Object.keys(typeStats).length > 0 && (
          <View className="section-card">
            <Text className="section-title">📋 题型分布</Text>
            <View className="type-stats-list">
              {Object.entries(typeStats).map(([type, data]) => (
                <View key={type} className="type-stat-row">
                  <Text className="type-stat-name">{getTypeName(type)}</Text>
                  <View className="type-stat-bars">
                    <Text className="type-stat-count">{data.correct}/{data.total}</Text>
                    <Text className="type-stat-accuracy">
                      {data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 学习记录 */}
        {studyRecords.length > 0 && (
          <View className="section-card">
            <Text className="section-title">📝 最近学习记录</Text>
            <View className="records-list">
              {studyRecords.map((record, index) => (
                <View key={index} className="record-item">
                  <View className="record-header">
                    <Text className="record-type">{getTypeName(record.type)}</Text>
                    <Text className="record-score">{record.score}分</Text>
                  </View>
                  <View className="record-detail">
                    <Text className="record-info">
                      答对 {record.correctAnswers}/{record.totalQuestions} 题
                    </Text>
                    <Text className="record-time">{formatDateTime(record.createdAt)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 返回按钮 */}
        <View className="action-bar">
          <View className="back-btn" onClick={navigateBack}>
            <Text className="back-text">← 返回</Text>
          </View>
        </View>

        {/* 底部留白 */}
        <View style={{ height: '100rpx' }} />
      </ScrollView>
    </View>
  )
}

export default UserDetailPage
