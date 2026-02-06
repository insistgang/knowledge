/**
 * 认证上下文
 */
import { createContext, useContext, useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import authService from '../services/auth'
import storage from '../utils/storage'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null)
  const [openid, setOpenid] = useState('')
  const [isLogin, setIsLogin] = useState(false)
  const [loading, setLoading] = useState(true)

  // 初始化：检查登录状态
  useEffect(() => {
    checkAuthStatus()
  }, [])

  /**
   * 检查登录状态
   */
  const checkAuthStatus = async () => {
    try {
      const logged = await authService.checkLogin()
      if (logged) {
        const user = await storage.getUserInfo()
        const oid = await storage.getOpenid()
        setUserInfo(user)
        setOpenid(oid)
        setIsLogin(true)
      }
    } catch (err) {
      console.error('检查登录状态失败:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 微信登录
   */
  const login = async () => {
    try {
      Taro.showLoading({ title: '登录中...' })
      const data = await authService.login()
      setUserInfo(data.user)
      setOpenid(data.openid)
      setIsLogin(true)
      return data
    } catch (err) {
      Taro.showToast({
        title: err.message || '登录失败',
        icon: 'none'
      })
      throw err
    } finally {
      Taro.hideLoading()
    }
  }

  /**
   * 用户注册（设置昵称）
   */
  const register = async (nickname, avatar) => {
    try {
      Taro.showLoading({ title: '注册中...' })
      const data = await authService.register(nickname, avatar)
      setUserInfo(data)
      setIsLogin(true)
      return data
    } catch (err) {
      Taro.showToast({
        title: err.message || '注册失败',
        icon: 'none'
      })
      throw err
    } finally {
      Taro.hideLoading()
    }
  }

  /**
   * 退出登录
   */
  const logout = async () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: async (res) => {
        if (res.confirm) {
          await authService.logout()
          setUserInfo(null)
          setOpenid('')
          setIsLogin(false)
        }
      }
    })
  }

  /**
   * 更新用户信息
   */
  const updateUserInfo = async (data) => {
    try {
      const updatedUser = await authService.updateProfile(data)
      setUserInfo(updatedUser)
      return updatedUser
    } catch (err) {
      Taro.showToast({
        title: err.message || '更新失败',
        icon: 'none'
      })
      throw err
    }
  }

  /**
   * 刷新用户信息
   */
  const refreshUserInfo = async () => {
    const user = await storage.getUserInfo()
    setUserInfo(user)
    return user
  }

  const value = {
    userInfo,
    openid,
    isLogin,
    loading,
    login,
    register,
    logout,
    updateUserInfo,
    refreshUserInfo,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
