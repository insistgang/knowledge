/**
 * 简单的事件总线
 * 用于跨页面通信，例如答题完成后通知统计页面刷新
 */
class EventBus {
  constructor() {
    this.events = {}
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅的函数
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)

    // 返回取消订阅的函数
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback)
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {*} data - 传递的数据
   */
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        try {
          callback(data)
        } catch (err) {
          console.error(`事件回调执行失败 [${event}]:`, err)
        }
      })
    }
  }

  /**
   * 取消订阅
   * @param {string} event - 事件名称
   */
  off(event) {
    delete this.events[event]
  }
}

// 创建全局单例
const eventBus = new EventBus()

/**
 * 预定义的事件名称
 */
export const EVENTS = {
  // 答题完成后触发
  ANSWER_SUBMITTED: 'answer:submitted',
  // 练习完成后触发
  PRACTICE_COMPLETED: 'practice:completed',
  // 学习记录已更新
  STUDY_RECORD_UPDATED: 'study:record_updated',
  // 用户信息更新
  USER_INFO_UPDATED: 'user:info_updated'
}

export default eventBus
