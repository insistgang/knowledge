const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// Action 白名单
const ALLOWED_ACTIONS = ['get', 'update', 'updateStudy']

exports.main = async (event, context) => {
  const { action, openid, ...data } = event

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
      case 'get':
        return await getUser(realOpenid)
      case 'update':
        return await updateUser(realOpenid, data)
      case 'updateStudy':
        return await updateStudyData(realOpenid, data)
      default:
        return { success: false, message: 'Unknown action' }
    }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}

/**
 * 获取用户信息
 * 统一返回结构：有数据返回 { success: true, data: user }，无数据返回 { success: true, data: null }
 */
async function getUser(openid) {
  try {
    const res = await db.collection('users').where({ openid }).get()
    const user = res.data[0]
    // 统一返回 success: true，data 为 null 表示未找到
    return { success: true, data: user || null }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

/**
 * 更新用户信息
 */
async function updateUser(openid, { nickname, avatar }) {
  try {
    const res = await db.collection('users').where({ openid }).update({
      data: { nickname, avatar, updatedAt: new Date() }
    })
    return { success: true, data: res }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

/**
 * 更新学习数据
 */
async function updateStudyData(openid, { studyDays, totalScore }) {
  try {
    const updateData = { updatedAt: new Date() }
    if (studyDays) updateData.studyDays = studyDays
    if (totalScore !== undefined) updateData.totalScore = totalScore

    const res = await db.collection('users').where({ openid }).update({
      data: updateData
    })
    return { success: true, data: res }
  } catch (err) {
    return { success: false, message: err.message }
  }
}
