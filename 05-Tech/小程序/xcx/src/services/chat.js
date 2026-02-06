/**
 * AI 聊天服务
 */
import Taro from '@tarojs/taro'
import { callCloudFunction } from './request'
import { CLOUD_FUNCTIONS, DEFAULT_PAGE } from '../utils/constants'

// 聊天历史存储键
const CHAT_HISTORY_KEY = 'chat_history_local'
const CHAT_MAX_HISTORY = 100 // 本地最多保存100条消息

// 本地知识库
const KNOWLEDGE_BASE = {
  // 修辞手法
  '比喻': '比喻是一种修辞手法，用跟甲事物有相似之点的乙事物来描写或说明甲事物。比喻由三部分组成：本体（被比喻的事物）、喻体（用来比喻的事物）和比喻词（如"像""好像""仿佛"等）。\n\n例如："月亮像圆盘"中，月亮是本体，圆盘是喻体，像是比喻词。',
  '明喻': '明喻是比喻的一种，本体、喻体都出现，中间用"像""好像""仿佛""犹如"等比喻词连接。\n\n例如："弯弯的月亮像小船。"',
  '暗喻': '暗喻是比喻的一种，本体、喻体都出现，中间用"是""变成""成为""等于"等词连接。\n\n例如："老师是辛勤的园丁。"',
  '借喻': '借喻是比喻的一种，只出现喻体，不出现本体和比喻词。\n\n例如："落光了叶子的树枝上，挂满了亮晶晶的银条儿"（借喻雪挂）。',
  '拟人': '拟人是一种修辞手法，把事物人格化，将本来不具备人动作和感情的事物，变成和人一样具有动作和感情的样子。\n\n例如："花儿在风中微笑。"',

  // 诗词
  '意象': '古诗中常用的意象有：\n\n1. 月亮：象征思乡、团圆、美好\n2. 柳树：象征离别、挽留\n3. 菊花：象征高洁、隐逸\n4. 梅花：象征坚强、高洁\n5. 松柏：象征坚贞、不屈\n6. 荷花：象征高洁、出淤泥而不染\n7. 杜鹃：象征哀怨、思乡\n8. 鸿雁：象征书信、思念',
  '思乡': '古诗中表达思乡之情的常用意象和诗句：\n\n• 月亮："举头望明月，低头思故乡"\n• 柳树："昔我往矣，杨柳依依"\n• 鸿雁："鸿雁长飞光不度"\n• 梧桐："梧桐更兼细雨，到黄昏点点滴滴"',

  // 词语
  '近义词': '区分近义词的方法：\n\n1. 词义轻重不同：如"批评"与"批判"\n2. 词义范围不同：如"战争"与"战役"\n3. 感情色彩不同：如"果断"与"武断"\n4. 搭配关系不同：如"发挥"与"发扬"\n\n建议通过多读多写、查字典、比较辨析来掌握。',
  '反义词': '反义词是指意义相反或相对的词。\n\n构成反义关系的词必须属于同一意义范畴，如"长"和"短"（长度范畴），"古"和"今"（时间范畴）。\n\n注意：并非所有词都有反义词，如"书""桌子"等名词就没有反义词。',

  // 语法
  '病句': '常见的病句类型及修改方法：\n\n1. 成分残缺：缺主语、谓语、宾语\n   修改：补充残缺成分\n\n2. 搭配不当：主谓、动宾、修饰语与中心语搭配不当\n   修改：调整词语使搭配恰当\n\n3. 语序不当：定语、状语、补语位置不当\n   修改：调整词语顺序\n\n4. 结构混乱：句式杂糅、中途易辙\n   修改：理清结构，改为单一句式',
  '语法': '语文语法基础知识：\n\n1. 词类：名、动、形、数、量、代、副、介、连、助、叹、拟声\n2. 句子成分：主、谓、宾、定、状、补\n3. 句式：陈述句、疑问句、祈使句、感叹句\n4. 复句类型：并列、递进、选择、转折、因果、假设、条件',

  // 写作
  '作文': '写好作文的要点：\n\n1. 开头：要吸引人，可以开门见山、设置悬念、引用名言\n2. 中间：要有具体事例，详略得当，有细节描写\n3. 结尾：要点题，可以总结全文、呼应开头、发人深省\n4. 语言：要生动形象，运用修辞手法\n5. 情感：要真挚感人',
  '开头': '好的作文开头方法：\n\n1. 开门见山：直接点明主题\n2. 设置悬念：引起读者兴趣\n3. 引用名言：增加文采\n4. 描写环境：烘托气氛\n5. 抒情议论：表达情感观点\n\n例如："春天又到了，望着窗外那片新绿，我不禁想起了奶奶..."',

  // 文言文
  '文言文': '文言文虚词常用用法：\n\n之：①代词 ②助词"的" ③动词"去"\n\n而：①连词表并列 ②连词表承接 ③连词表转折\n\n以：①介词"用、凭借" ②连词"因为" ③连词"来"\n\n于：①介词"在" ②介词"向" ③介词"对"\n\n为：①动词"是、做" ②介词"被、替" ③介词"为了"',

  // 标点符号
  '标点': '常用标点符号用法：\n\n1. 句号（。）：陈述句末尾\n2. 问号（？）：疑问句末尾\n3. 叹号（！）：感叹句末尾\n4. 逗号（，）：句子中间停顿\n5. 分号（；）：并列分句之间\n6. 冒号（：）：提示下文\n7. 引号（""""）：引用、强调\n8. 破折号（——）：解释、转折',

  // 默认回复
  'default': '感谢你的提问！作为语文学习助手，我可以帮你解答关于：\n\n• 词语释义、近义词、反义词\n• 古诗词赏析和意象\n• 修辞手法和语法知识\n• 文言文基础知识\n• 写作技巧和作文方法\n\n请提出你的具体问题，我会尽力为你解答！'
}

// 关键词匹配
const KEYWORD_MAP = {
  '比喻': '比喻', '明喻': '明喻', '暗喻': '暗喻', '借喻': '借喻',
  '拟人': '拟人', '夸张': '比喻', '排比': '作文',
  '近义词': '近义词', '反义词': '反义词', '同义词': '近义词',
  '意象': '意象', '思乡': '思乡', '思乡': '思乡', '家乡': '思乡',
  '病句': '病句', '修改': '病句', '语法': '语法',
  '作文': '作文', '写作': '作文', '开头': '开头', '结尾': '作文',
  '文言文': '文言文', '虚词': '文言文', '实词': '文言文',
  '标点': '标点', '符号': '标点'
}

class ChatService {
  /**
   * 从本地存储加载聊天历史
   */
  loadLocalHistory() {
    try {
      const history = Taro.getStorageSync(CHAT_HISTORY_KEY)
      return history || []
    } catch (err) {
      console.error('加载本地历史失败:', err)
      return []
    }
  }

  /**
   * 保存聊天历史到本地
   */
  saveLocalHistory(messages) {
    try {
      // 只保留最近的 N 条消息
      const toSave = messages.slice(-CHAT_MAX_HISTORY)
      Taro.setStorageSync(CHAT_HISTORY_KEY, toSave)
    } catch (err) {
      console.error('保存本地历史失败:', err)
    }
  }

  /**
   * 添加消息到本地历史
   */
  addMessageToLocal(message) {
    const history = this.loadLocalHistory()
    history.push({
      ...message,
      timestamp: Date.now()
    })
    this.saveLocalHistory(history)
  }

  /**
   * 清空本地聊天历史
   */
  clearLocalHistory() {
    try {
      Taro.removeStorageSync(CHAT_HISTORY_KEY)
    } catch (err) {
      console.error('清空本地历史失败:', err)
    }
  }

  /**
   * 查找本地知识库答案
   */
  findLocalAnswer(message) {
    const msg = message.toLowerCase().trim()

    // 1. 完全匹配关键词
    for (const [keyword, answerKey] of Object.entries(KEYWORD_MAP)) {
      if (msg.includes(keyword)) {
        return KNOWLEDGE_BASE[answerKey] || KNOWLEDGE_BASE['default']
      }
    }

    // 2. 检查具体问题
    if (msg.includes('什么是') || msg.includes('什么')) {
      for (const [keyword, answerKey] of Object.entries(KEYWORD_MAP)) {
        if (msg.includes(keyword)) {
          return KNOWLEDGE_BASE[answerKey] || KNOWLEDGE_BASE['default']
        }
      }
    }

    // 3. 检查"如何""怎样"类问题
    if (msg.includes('如何') || msg.includes('怎样') || msg.includes('怎么')) {
      if (msg.includes('区分') || msg.includes('近义词') || msg.includes('反义词')) {
        return KNOWLEDGE_BASE['近义词']
      }
      if (msg.includes('修改') || msg.includes('病句')) {
        return KNOWLEDGE_BASE['病句']
      }
      if (msg.includes('写') || msg.includes('作文')) {
        return KNOWLEDGE_BASE['作文']
      }
    }

    // 4. 默认回复
    return KNOWLEDGE_BASE['default']
  }

  /**
   * 发送消息给 AI
   */
  async sendMessage(message, conversationId = null) {
    // 先保存用户消息到本地
    this.addMessageToLocal({
      id: Date.now(),
      role: 'user',
      content: message
    })

    Taro.showLoading({ title: '思考中...' })

    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.CHAT, {
        action: 'sendMessage',
        message,
        conversationId
      })

      if (res && res.success) {
        // 保存 AI 回复到本地
        this.addMessageToLocal({
          id: res.data.messageId || Date.now() + 1,
          role: 'assistant',
          content: res.data.reply
        })
        return res.data
      }

      throw new Error(res?.message || '发送失败')
    } catch (err) {
      console.log('云函数调用失败，使用本地知识库')

      // 使用本地知识库作为 fallback
      const localReply = this.findLocalAnswer(message)
      const result = {
        messageId: Date.now(),
        reply: localReply,
        fromLocal: true
      }

      // 保存 AI 回复到本地
      this.addMessageToLocal({
        id: result.messageId,
        role: 'assistant',
        content: localReply
      })

      return result
    } finally {
      Taro.hideLoading()
    }
  }

  /**
   * 获取聊天历史
   */
  async getHistory(page = DEFAULT_PAGE.page, pageSize = DEFAULT_PAGE.pageSize) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.CHAT, {
        action: 'history',
        page,
        pageSize
      })
      return res?.data || []
    } catch (err) {
      console.log('获取云端历史失败，返回本地历史')
      // 云端获取失败时返回本地历史
      return this.loadLocalHistory()
    }
  }

  /**
   * 获取会话详情
   */
  async getConversation(conversationId) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.CHAT, {
        action: 'conversation',
        conversationId
      })
      return res?.data || null
    } catch (err) {
      // 返回本地历史作为 fallback
      return {
        messages: this.loadLocalHistory()
      }
    }
  }

  /**
   * 清空聊天记录
   */
  async clearHistory(conversationId = null) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.CHAT, {
        action: 'clear',
        conversationId
      })
    } catch (err) {
      console.log('清空云端历史失败')
    }
    // 同时清空本地历史
    this.clearLocalHistory()
    return true
  }

  /**
   * 删除单条消息
   */
  async deleteMessage(messageId) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.CHAT, {
        action: 'delete',
        messageId
      })
      return res?.success || false
    } catch (err) {
      Taro.showToast({ title: '删除失败', icon: 'none' })
      return false
    }
  }

  /**
   * 获取预设问题
   */
  async getPresetQuestions() {
    return [
      { id: 1, text: '什么是比喻？' },
      { id: 2, text: '什么是拟人？' },
      { id: 3, text: '古诗中常用的意象有哪些？' },
      { id: 4, text: '如何区分近义词？' },
      { id: 5, text: '怎样修改病句？' },
      { id: 6, text: '如何写好作文开头？' }
    ]
  }

  /**
   * 流式回复（云函数支持的话）
   */
  async streamMessage(message, onMessage, onComplete) {
    const res = await this.sendMessage(message)
    if (onMessage) {
      onMessage(res.reply)
    }
    if (onComplete) {
      onComplete(res)
    }
    return res
  }
}

export default new ChatService()
