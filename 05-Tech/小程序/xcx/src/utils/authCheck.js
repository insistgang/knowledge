/**
 * 登录检查工具
 */
import Taro from '@tarojs/taro'
import storage from './storage'

/**
 * 检查是否已登录
 * @returns {boolean}
 */
export const checkLogin = async () => {
  const openid = await storage.getOpenid()
  return !!openid
}

/**
 * 检查登录状态，未登录则显示提示并引导到登录页
 * @param {Object} options - 配置项
 * @param {string} options.message - 提示消息
 * @param {boolean} options.showModal - 是否显示确认框（false则直接跳转）
 * @returns {Promise<boolean>} 是否已登录
 */
export const requireLogin = async (options = {}) => {
  const { 
    message = '该功能需要登录后才能使用',
    showModal = true 
  } = options
  
  const isLogin = await checkLogin()
  
  if (isLogin) {
    return true
  }
  
  if (showModal) {
    const { confirm } = await Taro.showModal({
      title: '提示',
      content: message,
      confirmText: '去登录',
      cancelText: '暂不'
    })
    
    if (confirm) {
      Taro.navigateTo({ url: '/pages/login/index' })
    }
  } else {
    Taro.navigateTo({ url: '/pages/login/index' })
  }
  
  return false
}

/**
 * 直接跳转到登录页
 */
export const goToLogin = () => {
  Taro.navigateTo({ url: '/pages/login/index' })
}

export default {
  checkLogin,
  requireLogin,
  goToLogin
}
