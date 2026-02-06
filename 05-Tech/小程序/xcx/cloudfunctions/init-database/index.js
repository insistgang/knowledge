// 云函数入口文件：初始化数据库集合
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 需要创建的集合列表
const COLLECTIONS = [
  'users',
  'questions_bank',
  'study_records',
  'chat_history',
  'answer_history',
  'favorites',
  'vocabulary',
  'idioms',
  'word_favorites'
]

/**
 * 检查集合是否存在
 * wx-server-sdk 没有直接检查集合存在的方法，
 * 我们通过尝试获取集合信息来判断
 */
async function collectionExists(name) {
  try {
    // 尝试查询集合（限制 1 条），如果成功说明集合存在
    await db.collection(name).limit(1).get()
    return true
  } catch (err) {
    // 错误码 -1 通常表示集合不存在
    if (err.errCode === -1 || err.errMsg?.includes('collection does not exist')) {
      return false
    }
    // 其他情况假设存在
    return true
  }
}

/**
 * 创建集合
 */
async function createCollection(name) {
  try {
    await db.createCollection(name)
    return { success: true, message: `集合 ${name} 创建成功` }
  } catch (err) {
    // 如果集合已存在，不算错误
    if (err.errCode === -1 || err.errMsg?.includes('already exists') || err.errMsg?.includes('exists')) {
      return { success: true, message: `集合 ${name} 已存在，跳过` }
    }
    return { success: false, message: `集合 ${name} 创建失败: ${err.errMsg || err.message}` }
  }
}

/**
 * 为集合添加初始索引/权限配置（可选）
 */
async function setupCollectionPermissions(name) {
  // 这里可以添加集合权限配置
  // 实际项目中建议在云开发控制台手动配置更细粒度的权限
  return { success: true }
}

// 云函数入口
exports.main = async (event, context) => {
  const results = {
    success: true,
    message: '数据库初始化完成',
    data: {
      created: [],      // 新创建的集合
      existed: [],      // 已存在的集合
      failed: []        // 创建失败的集合
    }
  }

  try {
    // 遍历所有需要创建的集合
    for (const name of COLLECTIONS) {
      const exists = await collectionExists(name)

      if (exists) {
        results.data.existed.push(name)
        console.log(`集合 ${name} 已存在，跳过`)
      } else {
        const result = await createCollection(name)
        if (result.success) {
          results.data.created.push(name)
          console.log(`集合 ${name} 创建成功`)

          // 初始化权限配置
          await setupCollectionPermissions(name)
        } else {
          results.data.failed.push({ name, error: result.message })
          console.error(`集合 ${name} 创建失败:`, result.message)
        }
      }
    }

    // 如果有失败的，调整整体结果状态
    if (results.data.failed.length > 0) {
      results.success = false
      results.message = `部分集合创建失败：${results.data.failed.length} 个失败`
    }

    return results

  } catch (err) {
    console.error('数据库初始化异常:', err)
    return {
      success: false,
      message: `数据库初始化异常: ${err.errMsg || err.message}`,
      data: results.data
    }
  }
}
