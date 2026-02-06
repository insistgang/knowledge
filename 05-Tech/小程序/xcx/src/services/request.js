/**
 * 云函数调用封装
 */
import Taro from '@tarojs/taro'
import { CLOUD_FUNCTIONS } from '../utils/constants'
import storage from '../utils/storage'

/**
 * 调用云函数
 * @param {string} name 云函数名称
 * @param {object} data 传递的数据
 * @param {object} options 额外配置
 */
export const callCloudFunction = async (name, data = {}, options = {}) => {
  try {
    // 添加 openid
    const openid = await storage.getOpenid()
    const requestData = {
      ...data,
      _openid: openid
    }

    const res = await Taro.cloud.callFunction({
      name,
      data: requestData,
      ...options
    })

    // 检查 res 是否存在
    if (!res) {
      console.warn(`云函数 ${name} 返回为空，可能未部署云开发环境`)
      throw new Error('云函数未初始化')
    }

    if (res.errMsg !== 'cloud.callFunction:ok') {
      throw new Error(res.errMsg)
    }

    return res.result
  } catch (err) {
    // 静默处理错误，不显示 toast，让上层服务处理 fallback
    console.log(`云函数 ${name} 调用失败，将使用本地数据:`, err.message || err)
    throw err
  }
}

/**
 * 云数据库操作封装
 */
export class DB {
  constructor() {
    // 懒加载：只在首次使用时初始化
    this._db = null
    this._cmd = null
  }

  // 获取数据库实例
  get db() {
    if (!this._db) {
      this._db = Taro.cloud.database()
    }
    return this._db
  }

  // 获取数据库命令
  get cmd() {
    if (!this._cmd) {
      this._cmd = this.db.command
    }
    return this._cmd
  }

  get _() {
    return this.cmd
  }

  /**
   * 获取集合
   */
  collection(name) {
    return this.db.collection(name)
  }

  /**
   * 获取单条记录
   */
  async getOne(collectionName, where = {}) {
    try {
      const res = await this.db.collection(collectionName)
        .where(where)
        .limit(1)
        .get()
      return res.data[0] || null
    } catch (err) {
      console.error('查询失败:', err)
      return null
    }
  }

  /**
   * 获取多条记录
   */
  async getList(collectionName, where = {}, options = {}) {
    try {
      const { limit = 20, skip = 0, orderBy = '', order = 'asc' } = options

      let query = this.db.collection(collectionName).where(where)

      if (orderBy) {
        query = query.orderBy(orderBy, order)
      }

      const res = await query.limit(limit).skip(skip).get()
      return res.data
    } catch (err) {
      console.error('查询列表失败:', err)
      return []
    }
  }

  /**
   * 添加记录
   */
  async add(collectionName, data) {
    try {
      const res = await this.db.collection(collectionName).add({
        data
      })
      return res._id
    } catch (err) {
      console.error('添加失败:', err)
      throw err
    }
  }

  /**
   * 更新记录
   */
  async update(collectionName, id, data) {
    try {
      await this.db.collection(collectionName).doc(id).update({
        data
      })
      return true
    } catch (err) {
      console.error('更新失败:', err)
      throw err
    }
  }

  /**
   * 删除记录
   */
  async remove(collectionName, id) {
    try {
      await this.db.collection(collectionName).doc(id).remove()
      return true
    } catch (err) {
      console.error('删除失败:', err)
      throw err
    }
  }

  /**
   * 统计数量
   */
  async count(collectionName, where = {}) {
    try {
      const res = await this.db.collection(collectionName).where(where).count()
      return res.total
    } catch (err) {
      console.error('统计失败:', err)
      return 0
    }
  }
}

export default new DB()
