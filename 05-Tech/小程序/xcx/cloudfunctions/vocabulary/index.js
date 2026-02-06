// 词汇服务云函数
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

// Action 白名单
const ALLOWED_ACTIONS = ['search', 'list', 'daily', 'idioms', 'searchIdiom', 'detail', 'favorite', 'favorites', 'practice']

exports.main = async (event, context) => {
  const { action, _openid, ...params } = event

  // 验证 action 参数
  if (!action || !ALLOWED_ACTIONS.includes(action)) {
    return { success: false, message: 'Invalid action' }
  }

  // 从微信上下文获取真实的 openid（不可伪造）
  const wxContext = cloud.getWXContext()
  const realOpenid = wxContext.OPENID

  if (!realOpenid) {
    return { success: false, message: '无法获取用户身份信息' }
  }

  // 如果请求中包含 _openid 字段，必须与 realOpenid 完全一致，否则拒绝
  if (typeof _openid !== 'undefined' && _openid !== realOpenid) {
    return { success: false, message: '身份验证失败' }
  }

  // 需要身份的 action 始终使用服务端获取的真实 openid
  const effectiveOpenid = realOpenid

  switch (action) {
    case 'search':
      return await searchWord(params.word)
    case 'list':
      return await getWords(params.page, params.pageSize)
    case 'daily':
      return await getDailyWords(params.count)
    case 'idioms':
      return await getIdioms(params.page, params.pageSize)
    case 'searchIdiom':
      return await searchIdiom(params.keyword)
    case 'detail':
      return await getWordDetail(params.word)
    case 'favorite':
      return await toggleFavorite(effectiveOpenid, params.word)
    case 'favorites':
      return await getFavorites(effectiveOpenid, params.page, params.pageSize)
    case 'practice':
      return await generatePractice(params.type, params.count)
    default:
      return { success: false, message: '未知操作' }
  }
}

/**
 * 搜索词语
 */
async function searchWord(word) {
  try {
    const res = await db.collection('vocabulary')
      .where({ word })
      .get()

    if (res.data.length > 0) {
      return { success: true, data: res.data[0] }
    }

    // 词库中没有，返回模拟数据
    return {
      success: true,
      data: {
        word,
        pinyin: generatePinyin(word),
        definition: '该词语暂无释义',
        example: '',
        synonyms: [],
        antonyms: []
      }
    }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

/**
 * 获取词语列表
 */
async function getWords(page = 1, pageSize = 20) {
  try {
    const skip = (page - 1) * pageSize
    const res = await db.collection('vocabulary')
      .skip(skip)
      .limit(pageSize)
      .get()
    return { success: true, data: res.data }
  } catch (err) {
    return { success: false, message: err.message, data: [] }
  }
}

/**
 * 获取每日推荐
 */
async function getDailyWords(count = 10) {
  try {
    // 先获取总数，然后随机跳过
    const countRes = await db.collection('vocabulary').count()
    const total = countRes.total

    if (total === 0) {
      return { success: true, data: [] }
    }

    // 请求数量不能超过总数
    const actualCount = Math.min(count, total)

    // 随机跳过一些记录来实现随机选择
    const maxSkip = Math.max(0, total - actualCount)
    const skip = Math.floor(Math.random() * (maxSkip + 1))

    const res = await db.collection('vocabulary')
      .skip(skip)
      .limit(actualCount)
      .get()
    return { success: true, data: res.data }
  } catch (err) {
    return { success: false, message: err.message, data: [] }
  }
}

/**
 * 获取成语列表
 */
async function getIdioms(page = 1, pageSize = 20) {
  try {
    const skip = (page - 1) * pageSize
    const res = await db.collection('idioms')
      .skip(skip)
      .limit(pageSize)
      .get()
    return { success: true, data: res.data }
  } catch (err) {
    // 模拟数据
    const mockIdioms = [
      { idiom: '画蛇添足', pinyin: 'huà shé tiān zú', definition: '比喻做了多余的事。', example: '' },
      { idiom: '守株待兔', pinyin: 'shǒu zhū dài tù', definition: '比喻死守狭隘经验。', example: '' },
      { idiom: '掩耳盗铃', pinyin: 'yǎn ěr dào líng', definition: '比喻自己欺骗自己。', example: '' },
      { idiom: '亡羊补牢', pinyin: 'wáng yáng bǔ láo', definition: '比喻出了问题及时补救。', example: '' }
    ]
    return { success: true, data: mockIdioms }
  }
}

/**
 * 搜索成语
 */
async function searchIdiom(keyword) {
  try {
    const res = await db.collection('idioms')
      .where({
        idiom: db.RegExp({
          regexp: keyword,
          options: 'i'
        })
      })
      .limit(10)
      .get()
    return { success: true, data: res.data }
  } catch (err) {
    return { success: false, message: err.message, data: [] }
  }
}

/**
 * 获取词语详情
 */
async function getWordDetail(word) {
  return await searchWord(word)
}

/**
 * 收藏词语
 */
async function toggleFavorite(openid, word) {
  try {
    const existingRes = await db.collection('word_favorites')
      .where({ _openid: openid, word })
      .get()

    if (existingRes.data.length > 0) {
      await db.collection('word_favorites')
        .doc(existingRes.data[0]._id)
        .remove()
      return { success: true, data: { favorited: false } }
    } else {
      await db.collection('word_favorites').add({
        data: {
          _openid: openid,
          word,
          createdAt: db.serverDate()
        }
      })
      return { success: true, data: { favorited: true } }
    }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

/**
 * 获取收藏列表
 */
async function getFavorites(openid, page = 1, pageSize = 20) {
  try {
    const skip = (page - 1) * pageSize
    const res = await db.collection('word_favorites')
      .where({ _openid: openid })
      .skip(skip)
      .limit(pageSize)
      .get()
    return { success: true, data: res.data }
  } catch (err) {
    return { success: false, message: err.message, data: [] }
  }
}

/**
 * 生成练习题
 */
async function generatePractice(type, count = 10) {
  try {
    // 模拟练习题生成
    return {
      success: true,
      data: [
        {
          id: 1,
          type: 'single_choice',
          question: '"画蛇添足"这个成语的意思是？',
          options: ['A. 比喻做事认真', 'B. 比喻做了多余的事', 'C. 比喻坚持不懈', 'D. 比喻技艺高超'],
          correctAnswer: 1
        }
      ]
    }
  } catch (err) {
    return { success: false, message: err.message, data: [] }
  }
}

/**
 * 简单拼音生成（示例）
 * 注意：实际生产环境应使用专业的拼音库，如 pinyin-pro
 */
function generatePinyin(word) {
  // 常见字的简单拼音映射（仅作示例）
  const commonPinyin = {
    '语文': 'yǔ wén', '学习': 'xué xí', '阅读': 'yuè dú', '写作': 'xiě zuò',
    '诗词': 'shī cí', '成语': 'chéng yǔ', '拼音': 'pīn yīn', '汉字': 'hàn zì',
    '词汇': 'cí huì', '语法': 'yǔ fǎ', '句子': 'jù zi', '文章': 'wén zhāng'
  }

  // 检查是否有预定义的拼音
  if (commonPinyin[word]) {
    return commonPinyin[word]
  }

  // 如果没有预定义，返回提示信息
  return '（暂无拼音数据）'
}
