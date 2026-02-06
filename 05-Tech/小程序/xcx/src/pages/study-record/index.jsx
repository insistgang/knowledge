/**
 * 学习记录页面
 */
import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { useDidShow, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import studyService from '../../services/study'
import { pageShareConfigs } from '../../utils/share'
import './index.less'

function StudyRecord() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useDidShow(() => {
    loadRecords()
  })

  // 启用页面分享
  useShareAppMessage(() => {
    return pageShareConfigs.studyRecord
  })

  // 启用朋友圈分享
  useShareTimeline(() => {
    return {
      title: pageShareConfigs.studyRecord.title,
      query: ''
    }
  })

  const loadRecords = async () => {
    setLoading(true)
    try {
      const data = await studyService.getRecords()
      // 格式化日期显示
      const formattedData = data.map(r => ({
        ...r,
        displayDate: formatDate(r.createdAt || r.date)
      }))
      setRecords(formattedData)
    } catch (err) {
      console.error('加载学习记录失败:', err)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  // 格式化日期为显示格式
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}-${day}`
  }

  const getTypeName = (type) => {
    const typeMap = {
      'vocabulary': '词汇',
      'literature': '诗词',
      'idiom': '成语',
      'pinyin': '拼音',
      'correction': '病句',
      'exercise': '练习',
      'mock_exam': '考试'
    }
    return typeMap[type] || '练习'
  }

  return (
    <View className="study-record-page">
      <ScrollView scrollY className="content-scroll">
        {loading ? (
          <View className="loading-state">
            <Text>加载中...</Text>
          </View>
        ) : records.length > 0 ? (
          <View className="record-list">
            {records.map((record) => (
              <View key={record.id || record._id} className="record-item">
                <View className="record-header">
                  <Text className="record-title">{record.title || '练习'}</Text>
                  <Text className={`record-score ${record.score >= 80 ? 'good' : record.score >= 60 ? 'normal' : 'bad'}`}>
                    {record.score}分
                  </Text>
                </View>
                <View className="record-meta">
                  <Text className="record-type">{getTypeName(record.type)}</Text>
                  <Text className="record-date">{record.displayDate}</Text>
                  <Text className="record-duration">{record.duration || 0}分钟</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="empty-state">
            <Text className="empty-icon">📖</Text>
            <Text className="empty-text">暂无学习记录</Text>
            <Text className="empty-tip">完成练习后记录会显示在这里</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default StudyRecord
