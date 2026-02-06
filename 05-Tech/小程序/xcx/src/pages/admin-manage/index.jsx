/**
 * 管理员管理页面
 */
import { useState, useEffect } from 'react'
import { View, Text, Input, Button, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import './index.less'

function AdminManage() {
  const [admins, setAdmins] = useState([])
  const [targetOpenid, setTargetOpenid] = useState('')
  const [loading, setLoading] = useState(false)

  useDidShow(() => {
    loadAdmins()
  })

  // 获取管理员列表
  const loadAdmins = async () => {
    try {
      const res = await Taro.cloud.callFunction({
        name: 'admin-manage',
        data: { action: 'listAdmins' }
      })

      if (res.result.success) {
        setAdmins(res.result.data)
      } else {
        Taro.showToast({ title: res.result.message, icon: 'none' })
      }
    } catch (err) {
      console.error('加载管理员列表失败:', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  // 添加管理员
  const handleAddAdmin = async () => {
    if (!targetOpenid.trim()) {
      Taro.showToast({ title: '请输入用户openid', icon: 'none' })
      return
    }

    try {
      setLoading(true)
      const res = await Taro.cloud.callFunction({
        name: 'admin-manage',
        data: {
          action: 'addAdmin',
          targetOpenid: targetOpenid.trim()
        }
      })

      if (res.result.success) {
        Taro.showToast({ title: '添加成功', icon: 'success' })
        setTargetOpenid('')
        loadAdmins()
      } else {
        Taro.showToast({ title: res.result.message, icon: 'none' })
      }
    } catch (err) {
      console.error('添加管理员失败:', err)
      Taro.showToast({ title: '添加失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 移除管理员
  const handleRemoveAdmin = async (openid) => {
    const { confirm } = await Taro.showModal({
      title: '确认移除',
      content: '确定要移除该管理员吗？'
    })

    if (!confirm) return

    try {
      const res = await Taro.cloud.callFunction({
        name: 'admin-manage',
        data: {
          action: 'removeAdmin',
          targetOpenid: openid
        }
      })

      if (res.result.success) {
        Taro.showToast({ title: '移除成功', icon: 'success' })
        loadAdmins()
      } else {
        Taro.showToast({ title: res.result.message, icon: 'none' })
      }
    } catch (err) {
      console.error('移除管理员失败:', err)
      Taro.showToast({ title: '移除失败', icon: 'none' })
    }
  }

  return (
    <View className="admin-manage-page">
      <ScrollView scrollY className="content-scroll">
        {/* 添加管理员区域 */}
        <View className="section">
          <View className="section-title">添加管理员</View>
          <View className="input-group">
            <Input
              className="admin-input"
              placeholder="输入要添加的用户openid"
              value={targetOpenid}
              onInput={(e) => setTargetOpenid(e.detail.value)}
            />
            <Button
              className="add-btn"
              onClick={handleAddAdmin}
              loading={loading}
              disabled={loading}
            >
              添加
            </Button>
          </View>
          <View className="tips">
            <Text className="tips-text">
              💡 提示：如何获取用户openid？
            </Text>
            <Text className="tips-desc">
              1. 在管理后台的用户列表中查看{'\n'}
              2. 或让用户在个人中心页面查看自己的openid
            </Text>
          </View>
        </View>

        {/* 管理员列表 */}
        <View className="section">
          <View className="section-title">
            管理员列表
            <Text className="count">（{admins.length}人）</Text>
          </View>
          <View className="admin-list">
            {admins.map((admin) => (
              <View key={admin._id} className="admin-item">
                <View className="admin-info">
                  <Text className="admin-openid">{admin._openid}</Text>
                  <Text className="admin-time">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Button
                  className="remove-btn"
                  size="mini"
                  onClick={() => handleRemoveAdmin(admin._openid)}
                >
                  移除
                </Button>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default AdminManage
