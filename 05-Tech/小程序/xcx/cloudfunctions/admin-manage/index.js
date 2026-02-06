// 管理员管理云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// Action 白名单
const ALLOWED_ACTIONS = ['addAdmin', 'removeAdmin', 'listAdmins']

exports.main = async (event, context) => {
  const { action, targetOpenid, ...params } = event

  // 验证 action 参数
  if (!action || !ALLOWED_ACTIONS.includes(action)) {
    return { success: false, message: 'Invalid action' }
  }

  // 获取当前用户 openid
  const wxContext = cloud.getWXContext()
  const currentOpenid = wxContext.OPENID

  if (!currentOpenid) {
    return { success: false, message: '无法获取用户身份信息' }
  }

  // 验证当前用户是否是管理员
  const isAdmin = await checkIsAdmin(currentOpenid)
  if (!isAdmin) {
    return { success: false, message: '无权限操作，需要管理员身份' }
  }

  try {
    switch (action) {
      case 'addAdmin':
        return await addAdmin(targetOpenid)
      case 'removeAdmin':
        return await removeAdmin(targetOpenid)
      case 'listAdmins':
        return await listAdmins()
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}

/**
 * 检查是否是管理员
 */
async function checkIsAdmin(openid) {
  try {
    const result = await db.collection('admins')
      .where({ _openid: openid })
      .get()
    return result.data.length > 0
  } catch (err) {
    return false
  }
}

/**
 * 添加管理员
 */
async function addAdmin(targetOpenid) {
  if (!targetOpenid) {
    return { success: false, message: '缺少目标用户openid' }
  }

  // 检查是否已经是管理员
  const existing = await db.collection('admins')
    .where({ _openid: targetOpenid })
    .get()

  if (existing.data.length > 0) {
    return { success: false, message: '该用户已经是管理员' }
  }

  // 添加管理员记录
  await db.collection('admins').add({
    data: {
      _openid: targetOpenid,
      role: 'admin',
      createdAt: db.serverDate()
    }
  })

  return { success: true, message: '添加管理员成功' }
}

/**
 * 移除管理员
 */
async function removeAdmin(targetOpenid) {
  if (!targetOpenid) {
    return { success: false, message: '缺少目标用户openid' }
  }

  const result = await db.collection('admins')
    .where({ _openid: targetOpenid })
    .get()

  if (result.data.length === 0) {
    return { success: false, message: '该用户不是管理员' }
  }

  await db.collection('admins').doc(result.data[0]._id).remove()

  return { success: true, message: '移除管理员成功' }
}

/**
 * 获取管理员列表
 */
async function listAdmins() {
  const result = await db.collection('admins').get()
  return { success: true, data: result.data }
}
