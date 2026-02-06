const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// Action 白名单
const ALLOWED_ACTIONS = ['login', 'register']

exports.main = async (event, context) => {
  const { action, code, openid, nickname, avatar } = event

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

  // 如果请求中包含 openid 字段，必须与 realOpenid 完全一致，否则拒绝
  if (typeof openid !== 'undefined' && openid !== realOpenid) {
    return { success: false, message: '身份验证失败' }
  }

  try {
    switch (action) {
      case 'login': return await handleLogin(realOpenid)
      case 'register': return await handleRegister(realOpenid, nickname, avatar)
      default: return { success: false, message: 'Unknown action' }
    }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message || 'Operation failed' }
  }
}

async function handleLogin(openid) {
  if (!openid) return { success: false, message: 'Cannot get openid' }
  
  const userRes = await db.collection('users').where({ openid }).get()
  const user = userRes.data[0]
  
  if (!user) return { success: true, data: { openid, needRegister: true } }
  
  return {
    success: true,
    data: { openid, user: { id: user._id, nickname: user.nickname, avatar: user.avatar }, token: generateToken(openid) }
  }
}

async function handleRegister(openid, nickname, avatar) {
  if (!openid || !nickname) return { success: false, message: 'Missing params' }

  const now = new Date()
  const result = await db.collection('users').add({
    data: { openid, nickname, avatar, vipLevel: 0, vipExpire: null, studyDays: 0, totalScore: 0, createdAt: now, updatedAt: now }
  })

  return { success: true, data: { id: result._id, openid, nickname, avatar, vipLevel: 0 } }
}

function generateToken(openid) {
  return Buffer.from(openid + ':' + Date.now() + ':' + Math.random().toString(36).substring(2)).toString('base64')
}
