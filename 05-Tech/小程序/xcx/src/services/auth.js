/**
 * 认证服务
 */
import Taro from '@tarojs/taro'
import { callCloudFunction } from './request'
import { CLOUD_FUNCTIONS } from '../utils/constants'
import storage from '../utils/storage'

class AuthService {
  /**
   * 微信登录
   */
  async login() {
    try {
      // 获取微信登录 code
      const { code } = await Taro.login()

      // 调用云函数登录
      const res = await callCloudFunction(CLOUD_FUNCTIONS.LOGIN, {
        action: 'login',
        code
      })

      if (res.success) {
        // 如果需要注册
        if (res.data.needRegister) {
          // 保存 openid 供注册使用
          await storage.setOpenid(res.data.openid)
          return { needRegister: true, openid: res.data.openid }
        }

        // 保存用户信息和 token
        await storage.setUserInfo(res.data.user)
        await storage.setOpenid(res.data.openid)
        await storage.setToken(res.data.token)

        return res.data
      }

      throw new Error(res.message || '登录失败')
    } catch (err) {
      console.error('登录失败:', err)
      throw err
    }
  }

  /**
   * 用户注册（设置昵称）
   */
  async register(nickname, avatar = '') {
    try {
      const openid = await storage.getOpenid()
      const res = await callCloudFunction(CLOUD_FUNCTIONS.LOGIN, {
        action: 'register',
        openid,
        nickname,
        avatar
      })

      if (res.success) {
        await storage.setUserInfo(res.data)
        return res.data
      }

      throw new Error(res.message || '注册失败')
    } catch (err) {
      console.error('注册失败:', err)
      throw err
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser() {
    return await storage.getUserInfo()
  }

  /**
   * 更新用户信息
   */
  async updateProfile(data) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.USER, {
        action: 'update',
        ...data
      })

      if (res.success) {
        await storage.setUserInfo(res.data)
        return res.data
      }

      throw new Error(res.message || '更新失败')
    } catch (err) {
      console.error('更新用户信息失败:', err)
      throw err
    }
  }

  /**
   * 退出登录
   */
  async logout() {
    await storage.clearAuth()
    Taro.reLaunch({
      url: '/pages/login/index'
    })
  }

  /**
   * 检查登录状态
   */
  async checkLogin() {
    const userInfo = await storage.getUserInfo()
    const openid = await storage.getOpenid()
    return !!(userInfo && openid)
  }
}

export default new AuthService()
