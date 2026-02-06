/**
 * 本地存储封装
 */
import Taro from '@tarojs/taro'
import { STORAGE_KEYS } from './constants'

class Storage {
  /**
   * 设置数据
   */
  async set(key, value) {
    try {
      await Taro.setStorage({
        key,
        data: value
      })
      return true
    } catch (err) {
      console.error('存储失败:', err)
      return false
    }
  }

  /**
   * 获取数据
   */
  async get(key, defaultValue = null) {
    try {
      const res = await Taro.getStorage({ key })
      return res.data
    } catch (err) {
      return defaultValue
    }
  }

  /**
   * 删除数据
   */
  async remove(key) {
    try {
      await Taro.removeStorage({ key })
      return true
    } catch (err) {
      console.error('删除失败:', err)
      return false
    }
  }

  /**
   * 清空所有数据
   */
  async clear() {
    try {
      await Taro.clearStorage()
      return true
    } catch (err) {
      console.error('清空失败:', err)
      return false
    }
  }

  /**
   * 获取 Token
   */
  async getToken() {
    return await this.get(STORAGE_KEYS.TOKEN, '')
  }

  /**
   * 设置 Token
   */
  async setToken(token) {
    return await this.set(STORAGE_KEYS.TOKEN, token)
  }

  /**
   * 获取用户信息
   */
  async getUserInfo() {
    return await this.get(STORAGE_KEYS.USER_INFO, null)
  }

  /**
   * 设置用户信息
   */
  async setUserInfo(userInfo) {
    return await this.set(STORAGE_KEYS.USER_INFO, userInfo)
  }

  /**
   * 获取 OpenID
   */
  async getOpenid() {
    return await this.get(STORAGE_KEYS.OPENID, '')
  }

  /**
   * 设置 OpenID
   */
  async setOpenid(openid) {
    return await this.set(STORAGE_KEYS.OPENID, openid)
  }

  /**
   * 清除登录信息
   */
  async clearAuth() {
    await this.remove(STORAGE_KEYS.TOKEN)
    await this.remove(STORAGE_KEYS.USER_INFO)
    await this.remove(STORAGE_KEYS.OPENID)
  }
}

export default new Storage()
