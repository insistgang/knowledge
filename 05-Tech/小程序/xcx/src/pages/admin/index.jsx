/**
 * 管理后台页面
 */
import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { useDidShow, navigateTo, showToast } from '@tarojs/taro'
import adminService from '../../services/admin'
import './index.less'

function AdminPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userList, setUserList] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeTab, setActiveTab] = useState('stats') // stats | users

  useDidShow(() => {
    loadStats()
  })

  /**
   * 加载统计数据
   */
  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await adminService.getStats()
      setStats(data)
    } catch (err) {
      console.error('加载统计失败:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 加载用户列表
   */
  const loadUsers = async (page = 1) => {
    setLoading(true)
    try {
      const data = await adminService.getUserList(page, 20)
      setUserList(data.list || [])
      setTotalPages(data.totalPages || 1)
      setCurrentPage(data.page || 1)
    } catch (err) {
      console.error('加载用户列表失败:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 切换标签页
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'users' && userList.length === 0) {
      loadUsers(1)
    }
  }

  /**
   * 查看用户详情
   */
  const handleUserClick = (user) => {
    navigateTo({
      url: `/pages/admin/user-detail/index?openid=${user.openid}`
    })
  }

  /**
   * 格式化日期
   */
  const formatDate = (date) => {
    if (!date) return '-'
    const d = new Date(date)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  return (
    <View className="admin-page">
      {/* 标签页切换 */}
      <View className="tab-bar">
        <View
          className={`tab-item ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => handleTabChange('stats')}
        >
          <Text className="tab-text">数据总览</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => handleTabChange('users')}
        >
          <Text className="tab-text">用户管理</Text>
        </View>
        <View
          className="tab-item"
          onClick={() => navigateTo({ url: '/pages/admin-manage/index' })}
        >
          <Text className="tab-text">权限管理</Text>
        </View>
      </View>

      <ScrollView scrollY className="content-scroll">
        {loading && !stats ? (
          <View className="loading-state">
            <Text>加载中...</Text>
          </View>
        ) : activeTab === 'stats' ? (
          // 数据总览
          <View className="stats-container">
            {/* 用户统计 */}
            <View className="stats-section">
              <View className="section-title">
                <Text className="title-text">👥 用户统计</Text>
              </View>
              <View className="stats-grid">
                <View className="stat-card">
                  <Text className="stat-value">{stats?.users?.total || 0}</Text>
                  <Text className="stat-label">总用户数</Text>
                </View>
                <View className="stat-card">
                  <Text className="stat-value">+{stats?.users?.todayNew || 0}</Text>
                  <Text className="stat-label">今日新增</Text>
                </View>
              </View>
            </View>

            {/* 答题统计 */}
            <View className="stats-section">
              <View className="section-title">
                <Text className="title-text">📝 答题统计</Text>
              </View>
              <View className="stats-grid">
                <View className="stat-card">
                  <Text className="stat-value">{stats?.answers?.total || 0}</Text>
                  <Text className="stat-label">总答题数</Text>
                </View>
                <View className="stat-card">
                  <Text className="stat-value">{stats?.answers?.correct || 0}</Text>
                  <Text className="stat-label">正确答题</Text>
                </View>
                <View className="stat-card">
                  <Text className="stat-value">{stats?.answers?.accuracy || 0}%</Text>
                  <Text className="stat-label">正确率</Text>
                </View>
              </View>
            </View>

            {/* 其他统计 */}
            <View className="stats-section">
              <View className="section-title">
                <Text className="title-text">📊 其他统计</Text>
              </View>
              <View className="stats-grid">
                <View className="stat-card">
                  <Text className="stat-value">{stats?.favorites || 0}</Text>
                  <Text className="stat-label">收藏题目</Text>
                </View>
                <View className="stat-card">
                  <Text className="stat-value">{stats?.wrongQuestions || 0}</Text>
                  <Text className="stat-label">错题总数</Text>
                </View>
              </View>
            </View>

            {/* 题型分布 */}
            <View className="stats-section">
              <View className="section-title">
                <Text className="title-text">📋 题型分布</Text>
              </View>
              <View className="type-stats">
                {stats?.typeDistribution && Object.keys(stats.typeDistribution).length > 0 ? (
                  Object.entries(stats.typeDistribution).map(([type, count]) => (
                    <View key={type} className="type-stat-item">
                      <Text className="type-name">{type}</Text>
                      <Text className="type-count">{count} 次</Text>
                    </View>
                  ))
                ) : (
                  <Text className="empty-text">暂无数据</Text>
                )}
              </View>
            </View>

            {/* 刷新按钮 */}
            <View className="action-bar">
              <View className="refresh-btn" onClick={loadStats}>
                <Text className="refresh-text">🔄 刷新数据</Text>
              </View>
            </View>
          </View>
        ) : (
          // 用户列表
          <View className="users-container">
            <View className="users-header">
              <Text className="users-title">用户列表</Text>
              <Text className="users-count">共 {userList.length} 条</Text>
            </View>

            {userList.length === 0 ? (
              <View className="empty-state">
                <Text className="empty-text">暂无用户</Text>
              </View>
            ) : (
              <View className="user-list">
                {userList.map((user, index) => (
                  <View
                    key={user.openid}
                    className="user-item"
                    onClick={() => handleUserClick(user)}
                  >
                    <View className="user-avatar">
                      <Text className="avatar-text">{user.nickName?.charAt(0) || '用'}</Text>
                    </View>
                    <View className="user-info">
                      <Text className="user-name">{user.nickName || '未设置'}</Text>
                      <View className="user-stats-mini">
                        <Text className="stat-mini">答题{user.stats?.answerCount || 0}</Text>
                        <Text className="stat-mini">正确率{user.stats?.accuracy || 0}%</Text>
                      </View>
                    </View>
                    <Text className="user-arrow">›</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 分页 */}
            {totalPages > 1 && (
              <View className="pagination">
                {currentPage > 1 && (
                  <View className="page-btn" onClick={() => loadUsers(currentPage - 1)}>
                    <Text>上一页</Text>
                  </View>
                )}
                <Text className="page-info">{currentPage} / {totalPages}</Text>
                {currentPage < totalPages && (
                  <View className="page-btn" onClick={() => loadUsers(currentPage + 1)}>
                    <Text>下一页</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* 底部留白 */}
        <View style={{ height: '100rpx' }} />
      </ScrollView>
    </View>
  )
}

export default AdminPage
