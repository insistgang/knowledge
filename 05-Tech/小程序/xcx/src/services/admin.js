/**
 * 管理员服务
 */
import Taro from '@tarojs/taro'
import { callCloudFunction } from './request'

const CLOUD_FUNCTIONS = {
  QUESTION: 'question'
}

/**
 * 管理员服务
 */
export const adminService = {
  /**
   * 检查当前用户是否是管理员
   */
  async checkAdmin() {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.QUESTION, {
        action: 'adminCheck'
      })
      return res.isAdmin === true
    } catch (err) {
      console.error('检查管理员权限失败:', err)
      return false
    }
  },

  /**
   * 获取管理员统计数据
   */
  async getStats() {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.QUESTION, {
        action: 'adminStats'
      })
      if (!res.success) {
        throw new Error(res.message || '获取统计失败')
      }
      return res.data
    } catch (err) {
      Taro.showToast({ title: err.message || '获取统计失败', icon: 'none' })
      throw err
    }
  },

  /**
   * 获取用户列表
   */
  async getUserList(page = 1, pageSize = 20) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.QUESTION, {
        action: 'adminUserList',
        page,
        pageSize
      })
      if (!res.success) {
        throw new Error(res.message || '获取用户列表失败')
      }
      return res.data
    } catch (err) {
      Taro.showToast({ title: err.message || '获取用户列表失败', icon: 'none' })
      throw err
    }
  },

  /**
   * 获取用户详情
   */
  async getUserDetail(targetOpenid) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.QUESTION, {
        action: 'adminUserDetail',
        targetOpenid
      })
      if (!res.success) {
        throw new Error(res.message || '获取用户详情失败')
      }
      return res.data
    } catch (err) {
      Taro.showToast({ title: err.message || '获取用户详情失败', icon: 'none' })
      throw err
    }
  }
}

export default adminService
