/**
 * 分享功能工具函数
 */
import Taro from '@tarojs/taro'

/**
 * 默认分享配置
 */
export const defaultShareConfig = {
  title: 'AI语文助手 - 智能学习，高效提升',
  path: '/pages/home/index',
  imageUrl: '', // 使用默认截图
}

/**
 * 获取分享配置
 * @param {Object} options - 自定义配置
 * @returns {Object} 分享配置对象
 */
export const getShareConfig = (options = {}) => {
  const userInfo = Taro.getStorageSync('userInfo') || {}
  const nickname = userInfo.nickname || '同学'
  
  return {
    title: options.title || `${nickname}邀请你一起学习语文 📚`,
    path: options.path || '/pages/home/index',
    imageUrl: options.imageUrl || '',
  }
}

/**
 * 各页面分享配置
 */
export const pageShareConfigs = {
  // 首页
  home: {
    title: 'AI语文助手 - 智能学习，高效提升 📚',
    path: '/pages/home/index',
  },
  // 练习中心
  exercise: {
    title: '快来挑战语文练习题！✍️',
    path: '/pages/exercise/index',
  },
  // 词汇学习
  vocabulary: {
    title: '每天学点新词汇，语文成绩蹭蹭涨 📖',
    path: '/pages/vocabulary/index',
  },
  // 成语学习
  idiom: {
    title: '成语大全，等你来挑战 🦊',
    path: '/pages/idiom/index',
  },
  // 拼音学习
  pinyin: {
    title: '拼音练习，打好语文基础 🔤',
    path: '/pages/pinyin/index',
  },
  // 病句修改
  correction: {
    title: '病句修改大挑战，你能得几分？✏️',
    path: '/pages/correction/index',
  },
  // 语文助手
  chat: {
    title: '语文学习助手，有问题随时问 📚',
    path: '/pages/chat/index',
  },
  // 学习记录
  studyRecord: {
    title: '看看我的学习记录 📊',
    path: '/pages/study-record/index',
  },
  // 学习报告
  studyReport: {
    title: '我的语文学习报告 📈',
    path: '/pages/study-report/index',
  },
  // 个人中心
  profile: {
    title: '加入AI语文助手，一起进步吧！🎯',
    path: '/pages/profile/index',
  },
}

/**
 * 显示分享菜单
 */
export const showShareMenu = () => {
  Taro.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline']
  })
}

/**
 * 隐藏分享菜单
 */
export const hideShareMenu = () => {
  Taro.hideShareMenu()
}

/**
 * 调用系统分享
 * @param {Object} options - 分享配置
 */
export const shareApp = (options = {}) => {
  const config = getShareConfig(options)
  
  // 使用微信分享
  return {
    ...config,
    success: () => {
      Taro.showToast({
        title: '分享成功',
        icon: 'success'
      })
    },
    fail: () => {
      Taro.showToast({
        title: '分享取消',
        icon: 'none'
      })
    }
  }
}

export default {
  defaultShareConfig,
  getShareConfig,
  pageShareConfigs,
  showShareMenu,
  hideShareMenu,
  shareApp,
}
