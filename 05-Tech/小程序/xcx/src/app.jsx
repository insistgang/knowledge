/**
 * AI 语文助手 - 应用入口
 */
import Taro from '@tarojs/taro'
import { useLaunch } from '@tarojs/taro'
import { AuthProvider } from './context/AuthContext'
import './app.less'

// 在模块加载时立即初始化云开发（必须在任何使用云 API 之前）
if (process.env.TARO_ENV === 'weapp') {
  try {
    Taro.cloud.init({
      // 不指定 env，使用当前云环境（可在微信开发者工具中切换）
      traceUser: true
    })
    console.log('云开发初始化成功')
  } catch (e) {
    console.error('云开发初始化失败:', e)
  }
}

function App({ children }) {

  useLaunch(() => {
    console.log('App launched')
  })

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

export default App
