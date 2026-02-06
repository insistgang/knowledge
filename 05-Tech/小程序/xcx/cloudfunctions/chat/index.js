// AI聊天云函数
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command
const $ = db.aggregate.command

// DeepSeek API 配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
// 从环境变量获取 API Key（必须配置，无硬编码 fallback）
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

console.log('=== 云函数初始化 ===')
console.log('API Key 存在:', !!DEEPSEEK_API_KEY)
console.log('API Key 长度:', DEEPSEEK_API_KEY ? DEEPSEEK_API_KEY.length : 0)

// 本地知识库 - 常见问题快速回答
const KNOWLEDGE_BASE = {
  // 修辞手法
  '比喻': '比喻是一种修辞手法，用跟甲事物有相似之点的乙事物来描写或说明甲事物。比喻由三部分组成：本体（被比喻的事物）、喻体（用来比喻的事物）和比喻词（如"像"、"如"等）。',
  '拟人': '拟人是一种修辞手法，把事物人格化，将本来不具备人动作和感情的事物，变成和人一样具有动作和感情的样子。例如："小鸟在唱歌"。',
  '夸张': '夸张是一种为了达到某种表达效果，对事物的形象、特征、作用、程度等方面着意扩大或缩小的修辞方式。',
  '排比': '排比是一种把结构相同或相似、意思密切相关、语气一致的词语或句子成串地排列的一种修辞方法。',
  '设问': '设问是明知故问，自问自答。目的是引起注意，启发思考。',
  '反问': '反问是用疑问的形式表达确定的意思，以加强语气。',

  // 诗词意象
  '月亮': '月亮是古诗中常见的意象，常象征思乡、团圆、美好。如李白"举头望明月，低头思故乡"表达思乡之情。',
  '梅花': '梅花象征高洁、坚强、不畏严寒的品质。如王安石"墙角数枝梅，凌寒独自开"。',
  '柳树': '"柳"谐音"留"，常象征离别、留恋。如"渭城朝雨浥轻尘，客舍青青柳色新"。',
  '菊花': '菊花象征隐逸、高洁、坚贞。如陶渊明"采菊东篱下，悠然见南山"。',
  '杜鹃': '杜鹃象征凄凉、哀伤、思乡。如"庄生晓梦迷蝴蝶，望帝春心托杜鹃"。',
  '鸿雁': '鸿雁象征书信、思念。如"云中谁寄锦书来，雁字回时，月满西楼"。',

  // 文言虚词
  '之': '"之"是文言文中最常见的虚词之一，用法包括：1.代词(代人/事/物)；2.助词(的)；3.动词(往，到)；4.宾语前置的标志。',
  '而': '"而"主要用法：1.连词(表并列、递进、转折、因果等关系)；2.表修饰关系。',
  '于': '"于"主要用法：1.介词(在、从、向、对、到等)；2.介词(比)；3.被动句的标志。',
  '以': '"以"主要用法：1.介词(用、凭借、因为等)；2.连词(表并列、递进等)。',

  // 病句类型
  '病句': '常见病句类型有：语序不当、搭配不当、成分残缺或赘余、结构混乱、表意不明、不合逻辑。修改时要仔细分析句子结构。',
  '修改病句': '修改病句的方法：1.提干法(提取主干)；2.造句类比法；3.符号标记法；4.语感审读法。找出病因后对症下药。',

  // 写作技巧
  '作文开头': '好的作文开头方法：1.开门见山；2.设问悬念；3.引用名言；4.描绘画面；5.运用修辞。开头要简洁、新颖，能吸引读者。',
  '作文结尾': '好的作文结尾方法：1.自然收束；2.首尾呼应；3.升华主题；4.发出号召；5.留下思考。结尾要简洁有力，余味无穷。',

  // 近义词辨析
  '近义词': '区分近义词的方法：1.看词义的侧重点；2.看词义的轻重；3.看适用对象；4.看感情色彩(褒义/贬义)；5.看语体风格(口语/书面语)。'
}

// 集合名称
const COLLECTION_NAME = 'chat_history'

// Action 白名单
const ALLOWED_ACTIONS = ['sendMessage', 'history', 'conversation', 'clear', 'delete']

// 标记集合是否已检查过
let collectionChecked = false

/**
 * 确保集合存在，如果不存在则创建
 */
async function ensureCollectionExists() {
  if (collectionChecked) {
    return true
  }

  try {
    console.log('检查集合是否存在:', COLLECTION_NAME)

    // 尝试查询集合（limit 0 只获取元数据）
    await db.collection(COLLECTION_NAME).limit(0).get()
    console.log('集合已存在:', COLLECTION_NAME)
    collectionChecked = true
    return true
  } catch (err) {
    console.log('集合不存在，尝试创建:', COLLECTION_NAME)

    // 集合不存在，尝试创建
    try {
      // 使用 management API 创建集合
      await cloud.database().createCollection(COLLECTION_NAME)
      console.log('✅ 集合创建成功:', COLLECTION_NAME)
      collectionChecked = true
      return true
    } catch (createErr) {
      console.error('❌ 创建集合失败:', createErr.message)
      // 如果创建失败，可能是权限问题或集合名已存在
      // 标记为已检查，避免重复尝试
      collectionChecked = true
      return false
    }
  }
}

/**
 * 安全的添加记录到集合
 * 自动处理集合不存在的情况
 */
async function safeAdd(data) {
  try {
    // 先确保集合存在
    await ensureCollectionExists()

    // 添加数据
    const result = await db.collection(COLLECTION_NAME).add({ data })
    return result
  } catch (err) {
    console.error('添加记录失败:', err.message)

    // 如果是集合不存在的错误，再次尝试
    if (err.errCode === -1 || err.message.includes('集合不存在')) {
      collectionChecked = false // 重置检查标记
      await ensureCollectionExists()
      return await db.collection(COLLECTION_NAME).add({ data })
    }

    throw err
  }
}

exports.main = async (event, context) => {
  console.log('=== 云函数被调用 ===')
  console.log('Action:', event.action)

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
    console.log('⚠️ openid 校验失败:', { client: _openid, server: realOpenid })
    return { success: false, message: '身份验证失败' }
  }

  // 需要身份的 action 始终使用服务端获取的真实 openid
  const effectiveOpenid = realOpenid

  switch (action) {
    case 'sendMessage':
      return await sendMessage(effectiveOpenid, params.message, params.conversationId)
    case 'history':
      return await getHistory(effectiveOpenid, params.page, params.pageSize)
    case 'conversation':
      return await getConversation(params.conversationId)
    case 'clear':
      return await clearHistory(effectiveOpenid, params.conversationId)
    case 'delete':
      return await deleteMessage(effectiveOpenid, params.messageId)
    default:
      return { success: false, message: '未知操作' }
  }
}

/**
 * 检查消息是否匹配本地知识库
 */
function checkKnowledgeBase(message) {
  const lowerMsg = message.toLowerCase()
  for (const [key, value] of Object.entries(KNOWLEDGE_BASE)) {
    if (lowerMsg.includes(key) || message.includes(key)) {
      console.log('匹配到本地知识库:', key)
      return value
    }
  }
  return null
}

/**
 * 发送消息给AI
 */
async function sendMessage(openid, message, conversationId = null) {
  console.log('=== sendMessage 被调用 ===')
  console.log('OpenID:', openid)
  console.log('Message:', message)
  console.log('ConversationID:', conversationId)

  try {
    // 先检查本地知识库
    const localAnswer = checkKnowledgeBase(message)
    if (localAnswer) {
      console.log('使用本地知识库回复')

      // 保存用户消息
      await safeAdd({
        _openid: openid,
        conversationId,
        role: 'user',
        content: message,
        createdAt: db.serverDate()
      })

      // 保存AI回复
      const aiMsgRes = await safeAdd({
        _openid: openid,
        conversationId,
        role: 'assistant',
        content: localAnswer,
        createdAt: db.serverDate()
      })

      return {
        success: true,
        data: {
          messageId: assistantMsgRes._id,
          reply: localAnswer,
          conversationId
        }
      }
    }

    // 检查是否配置了API Key
    console.log('===== 检查 API Key =====')
    console.log('DEEPSEEK_API_KEY 存在:', !!DEEPSEEK_API_KEY)
    console.log('DEEPSEEK_API_KEY 长度:', DEEPSEEK_API_KEY?.length || 0)
    console.log('DEEPSEEK_API_KEY 前10位:', DEEPSEEK_API_KEY ? DEEPSEEK_API_KEY.substring(0, 10) + '...' : 'N/A')

    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'your-deepseek-api-key' || DEEPSEEK_API_KEY.length < 10) {
      console.log('❌ API Key 未配置或无效')
      // 返回错误信息，让用户知道需要配置 API Key
      return {
        success: true,
        data: {
          messageId: Date.now(),
          reply: '【系统提示】\n\n语文助手服务正在配置中，请稍后重试。\n\n如果问题持续存在，请联系管理员检查 DeepSeek API Key 配置。',
          conversationId
        }
      }
    }

    console.log('✅ API Key 有效，准备调用 DeepSeek API...')

    // 获取聊天历史
    let history = []
    try {
      await ensureCollectionExists()
      const historyRes = await db.collection(COLLECTION_NAME)
        .where({
          _openid: openid,
          ...(conversationId ? { conversationId } : {})
        })
        .orderBy('createdAt', 'asc')
        .limit(20)
        .get()
      history = historyRes.data || []
      console.log('获取到历史记录数:', history.length)
    } catch (historyErr) {
      console.log('获取历史记录失败，继续无历史调用:', historyErr.message)
    }

    const messages = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    // 添加当前消息
    messages.push({ role: 'user', content: message })

    // 系统提示词
    const systemPrompt = {
      role: 'system',
      content: '你是一位专业的语文学习助手，擅长解答词语释义、诗词赏析、语法知识、写作技巧等语文学习相关的问题。请用简洁明了的语言回答，尽量控制在200字以内。'
    }

    console.log('===== 准备调用 DeepSeek API =====')
    console.log('API URL:', DEEPSEEK_API_URL)
    console.log('API Key:', DEEPSEEK_API_KEY.substring(0, 10) + '...')
    console.log('消息数量:', messages.length)
    console.log('axios 库存在:', typeof axios !== 'undefined')

    // 调用 DeepSeek API
    let apiResponse
    try {
      console.log('🚀 开始发送 axios 请求...')
      apiResponse = await axios.post(DEEPSEEK_API_URL, {
        model: 'deepseek-chat',
        messages: [systemPrompt, ...messages],
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30秒超时
      })
      console.log('✅ API 响应状态:', apiResponse.status)
      console.log('✅ API 响应数据:', JSON.stringify(apiResponse.data).substring(0, 200) + '...')
    } catch (apiErr) {
      console.error('❌❌❌ DeepSeek API 调用失败 ❌❌❌')
      console.error('错误名称:', apiErr.name)
      console.error('错误信息:', apiErr.message)
      console.error('错误代码:', apiErr.code)
      console.error('API错误详情:', JSON.stringify(apiErr.response?.data || apiErr.message))
      if (apiErr.response) {
        console.error('HTTP状态:', apiErr.response.status)
        console.error('HTTP状态文本:', apiErr.response.statusText)
        console.error('响应头:', JSON.stringify(apiErr.response.headers))
      }
      if (apiErr.request) {
        console.error('请求信息:', '请求已发送但无响应（可能是网络问题或超时）')
      }
      // API 调用失败，返回默认回复
      return await getDefaultReply(openid, conversationId, message, `API调用失败: ${apiErr.message}`)
    }

    if (!apiResponse.data || !apiResponse.data.choices || apiResponse.data.choices.length === 0) {
      console.error('API 响应格式错误:', apiResponse.data)
      return await getDefaultReply(openid, conversationId, message)
    }

    const reply = apiResponse.data.choices[0].message.content
    console.log('助手回复长度:', reply.length)

    // 保存用户消息
    await safeAdd({
      _openid: openid,
      conversationId,
      role: 'user',
      content: message,
      createdAt: db.serverDate()
    })

    // 保存助手回复
    const assistantMsgRes = await safeAdd({
      _openid: openid,
      conversationId,
      role: 'assistant',
      content: reply,
      createdAt: db.serverDate()
    })

    return {
      success: true,
      data: {
        messageId: aiMsgRes._id,
        reply,
        conversationId
      }
    }
  } catch (err) {
    console.error('sendMessage 发生错误:')
    console.error('错误名称:', err.name)
    console.error('错误信息:', err.message)
    console.error('错误堆栈:', err.stack)

    // 发生错误，返回默认回复
    return await getDefaultReply(openid, conversationId, message, err.message)
  }
}

/**
 * 获取默认回复
 */
async function getDefaultReply(openid, conversationId, message, errorMsg = null) {
  const defaultReply = `我是语文学习助手，可以帮你解答语文学习中的问题。

你可以问我关于：
📖 词语释义、成语典故
📜 诗词赏析、文言文
✍️ 语法知识、病句修改
💡 写作技巧、作文方法

请具体描述你的问题，我会尽力为你解答！${errorMsg ? '\n\n(技术提示: ' + errorMsg + ')' : ''}`

  try {
    // 保存用户消息
    await safeAdd({
      _openid: openid,
      conversationId,
      role: 'user',
      content: message,
      createdAt: db.serverDate()
    })

    // 保存AI回复
    const aiMsgRes = await safeAdd({
      _openid: openid,
      conversationId,
      role: 'assistant',
      content: defaultReply,
      createdAt: db.serverDate()
    })

    return {
      success: true,
      data: {
        messageId: aiMsgRes._id,
        reply: defaultReply,
        conversationId
      }
    }
  } catch (dbErr) {
    console.error('保存聊天记录失败:', dbErr.message)
    return {
      success: true,
      data: {
        messageId: Date.now(),
        reply: defaultReply,
        conversationId
      }
    }
  }
}

/**
 * 获取聊天历史
 */
async function getHistory(openid, page = 1, pageSize = 30) {
  console.log('=== getHistory 被调用 ===')
  try {
    await ensureCollectionExists()
    const skip = (page - 1) * pageSize
    const res = await db.collection(COLLECTION_NAME)
      .where({ _openid: openid })
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    console.log('获取历史记录数:', res.data.length)
    return { success: true, data: res.data.reverse() }
  } catch (err) {
    console.error('getHistory 错误:', err.message)
    return { success: false, message: err.message, data: [] }
  }
}

/**
 * 获取会话详情
 */
async function getConversation(conversationId) {
  console.log('=== getConversation 被调用 ===')
  try {
    await ensureCollectionExists()
    const res = await db.collection(COLLECTION_NAME)
      .where({ conversationId })
      .orderBy('createdAt', 'asc')
      .get()

    return { success: true, data: res.data }
  } catch (err) {
    console.error('getConversation 错误:', err.message)
    return { success: false, message: err.message, data: [] }
  }
}

/**
 * 清空聊天历史
 */
async function clearHistory(openid, conversationId = null) {
  console.log('=== clearHistory 被调用 ===')
  try {
    await ensureCollectionExists()
    const where = { _openid: openid }
    if (conversationId) {
      where.conversationId = conversationId
    }

    const res = await db.collection(COLLECTION_NAME)
      .where(where)
      .remove()

    console.log('清空历史记录成功')
    return { success: true, data: { removed: res.stats?.removed || 0 } }
  } catch (err) {
    console.error('clearHistory 错误:', err.message)
    return { success: false, message: err.message }
  }
}

/**
 * 删除单条消息（验证所有权）
 */
async function deleteMessage(openid, messageId) {
  console.log('=== deleteMessage 被调用 ===')
  try {
    await ensureCollectionExists()

    // 先查询消息，验证所有权
    const msgRes = await db.collection(COLLECTION_NAME).doc(messageId).get()

    // 消息不存在
    if (!msgRes.data) {
      return { success: false, message: '消息不存在' }
    }

    // 验证所有权
    if (msgRes.data._openid !== openid) {
      return { success: false, message: '无权删除此消息' }
    }

    await db.collection(COLLECTION_NAME).doc(messageId).remove()
    return { success: true, data: null }
  } catch (err) {
    console.error('deleteMessage 错误:', err.message)
    return { success: false, message: '删除失败' }
  }
}
