/**
 * 登录页面
 */
import { useState } from 'react'
import { View, Button, Input, Image, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useAuth } from '../../context/AuthContext'
import './index.less'

function Login() {
  const { isLogin, login, register } = useAuth()
  const [mode, setMode] = useState('login') // login | register
  const [nickname, setNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false) // 用户协议勾选状态

  useLoad(() => {
    // 如果已登录，跳转到首页（使用 switchTab 因为首页是 tabBar 页面）
    if (isLogin) {
      Taro.switchTab({ url: '/pages/home/index' })
    }
  })

  /**
   * 微信授权登录
   */
  const handleWechatLogin = async () => {
    console.log('=== 点击登录按钮 ===')
    console.log('agreed 状态:', agreed)

    // 检查是否同意用户协议
    if (!agreed) {
      console.log('未勾选协议，阻止登录')
      Taro.showToast({
        title: '请先阅读并同意《用户协议》和《隐私政策》',
        icon: 'none',
        duration: 2000
      })
      return
    }

    console.log('已勾选协议，继续登录')
    try {
      setLoading(true)
      const result = await login()

      // 如果需要注册，切换到注册模式
      if (result && result.needRegister) {
        setMode('register')
        setLoading(false)
        return
      }

      // 登录成功，使用 switchTab 跳转（首页是 tabBar 页面）
      Taro.switchTab({ url: '/pages/home/index' })
    } catch (err) {
      console.error('登录失败:', err)
      setLoading(false)
      Taro.showToast({
        title: err.message || '登录失败',
        icon: 'none'
      })
    }
  }

  /**
   * 选择头像
   */
  const handleChooseAvatar = (e) => {
    const { avatarUrl } = e.detail
    setAvatarUrl(avatarUrl)
  }

  /**
   * 昵称输入
   */
  const handleNicknameInput = (e) => {
    setNickname(e.detail.value)
  }

  /**
   * 游客模式进入首页
   */
  const handleGuestEnter = () => {
    Taro.switchTab({ url: '/pages/home/index' })
  }

  /**
   * 切换协议勾选状态
   */
  const toggleAgreement = () => {
    const newValue = !agreed
    console.log('=== 点击协议复选框 ===')
    console.log('当前状态:', agreed)
    console.log('将设置为:', newValue)
    setAgreed(newValue)
  }

  /**
   * 完成注册（设置昵称）
   */
  const handleRegister = async () => {
    // 检查是否同意用户协议
    if (!agreed) {
      Taro.showToast({
        title: '请先阅读并同意《用户协议》和《隐私政策》',
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (!nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    try {
      setLoading(true)
      await register(nickname.trim(), avatarUrl)
      // 使用 switchTab 跳转（首页是 tabBar 页面）
      Taro.switchTab({ url: '/pages/home/index' })
    } catch (err) {
      console.error('注册失败:', err)
      Taro.showToast({
        title: err.message || '注册失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="login-page">
      {/* Logo 区域 */}
      <View className="logo-section">
        <View className="logo">📚</View>
        <View className="app-name">AI 语文助手</View>
        <View className="app-desc">智能学习，高效提升</View>
      </View>

      {/* 表单区域 */}
      <View className="form-section">
        {mode === 'login' ? (
          <>
            <Button
              className="btn-wechat"
              onClick={handleWechatLogin}
              loading={loading}
              disabled={loading}
            >
              <View className="btn-icon">🔐</View>
              微信授权登录
            </Button>

            <View className="agreement-section" onClick={toggleAgreement}>
              <View className={`custom-checkbox ${agreed ? 'checked' : ''}`}>
                {agreed && <View className="checkbox-check">✓</View>}
              </View>
              <View className="agreement-text">
                我已阅读并同意
                <Text className="agreement-link">《用户协议》</Text>
                和
                <Text className="agreement-link">《隐私政策》</Text>
                <Text style={{ marginLeft: '16px', color: agreed ? '#07C160' : '#999', fontSize: '20px' }}>
                  ({agreed ? '已同意' : '未同意'})
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* 头像选择 */}
            <View className="avatar-section">
              <Button
                className="avatar-wrapper"
                openType="chooseAvatar"
                onChooseAvatar={handleChooseAvatar}
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} className="avatar-img" mode="aspectFill" />
                ) : (
                  <View className="avatar-placeholder">📷</View>
                )}
              </Button>
              <View className="avatar-tip">点击选择头像</View>
            </View>

            {/* 昵称输入 */}
            <View className="form-item">
              <Input
                className="form-input"
                type="nickname"
                placeholder="请输入昵称"
                value={nickname}
                onInput={handleNicknameInput}
                maxlength={20}
              />
            </View>

            <Button
              className="btn-primary"
              onClick={handleRegister}
              loading={loading}
              disabled={loading || !nickname.trim()}
            >
              完成注册
            </Button>

            <View className="agreement-section" onClick={toggleAgreement}>
              <View className={`custom-checkbox ${agreed ? 'checked' : ''}`}>
                {agreed && <View className="checkbox-check">✓</View>}
              </View>
              <View className="agreement-text">
                我已阅读并同意
                <Text className="agreement-link">《用户协议》</Text>
                和
                <Text className="agreement-link">《隐私政策》</Text>
                <Text style={{ marginLeft: '16px', color: agreed ? '#07C160' : '#999', fontSize: '20px' }}>
                  ({agreed ? '已同意' : '未同意'})
                </Text>
              </View>
            </View>
          </>
        )}

        {mode === 'login' && (
          <>
            <View className="form-switch">
              <View className="switch-link" onClick={() => setMode('register')}>
                还没有账号？去注册
              </View>
            </View>
            <View className="guest-section">
              <View className="guest-divider">
                <View className="guest-line" />
                <Text className="guest-text">或</Text>
                <View className="guest-line" />
              </View>
              <View className="guest-btn" onClick={handleGuestEnter}>
                暂不登录，先浏览看看
              </View>
            </View>
          </>
        )}
      </View>

      {/* 功能介绍 */}
      <View className="features">
        <View className="feature-item">
          <View className="feature-icon">📖</View>
          <View className="feature-text">词汇诗词</View>
        </View>
        <View className="feature-item">
          <View className="feature-icon">✍️</View>
          <View className="feature-text">练习题库</View>
        </View>
        <View className="feature-item">
          <View className="feature-icon">🤖</View>
          <View className="feature-text">智能辅导</View>
        </View>
        <View className="feature-item">
          <View className="feature-icon">📊</View>
          <View className="feature-text">学习分析</View>
        </View>
      </View>
    </View>
  )
}

export default Login
