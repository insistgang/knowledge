/**
 * 数据导入管理页面
 * 用于导入模拟卷题目到数据库
 */
import { useState } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.less'

function AdminImport() {
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState([])

  // 添加日志
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev])
  }

  // 检查状态
  const checkStatus = async () => {
    try {
      addLog('正在检查数据状态...')
      const res = await Taro.cloud.callFunction({
        name: 'import-data',
        data: { action: 'checkStatus' }
      })
      if (res.result.success) {
        const { status } = res.result
        addLog(`词汇库: ${status.vocabulary || 0}/${status.vocabularyTotal || 0}`)
        addLog(`成语库: ${status.idioms || 0}/${status.idiomsTotal || 0}`)
        addLog(`模拟卷题目: ${status.mockExam || 0}/${status.mockExamTotal || 0}`)
      } else {
        addLog(`状态检查失败: ${res.result.message}`)
      }
    } catch (err) {
      addLog(`状态检查异常: ${err.message || err.errMsg}`)
    }
  }

  // 导入模拟卷题目
  const importMockExamQuestions = async () => {
    if (importing) return

    setImporting(true)
    setProgress(0)
    setLogs([])

    try {
      addLog('开始导入模拟卷题目...')

      // 先获取总数
      const totalRes = await Taro.cloud.callFunction({
        name: 'import-data',
        data: { action: 'getTotal' }
      })

      const total = totalRes.result.data?.mockExam || 0
      addLog(`待导入题目总数: ${total}`)

      if (total === 0) {
        addLog('错误: 没有可导入的题目数据')
        setImporting(false)
        return
      }

      // 分批导入
      const BATCH_SIZE = 20
      let startIndex = 0
      let totalImported = 0
      let totalFailed = 0

      while (startIndex < total) {
        addLog(`正在导入第 ${startIndex + 1}-${Math.min(startIndex + BATCH_SIZE, total)} 题...`)

        const res = await Taro.cloud.callFunction({
          name: 'import-data',
          data: {
            action: 'importBatch',
            type: 'mockExam',
            startIndex,
            batchSize: BATCH_SIZE
          }
        })

        const result = res.result
        if (result.success) {
          totalImported += result.successCount
          totalFailed += result.failedCount
          startIndex = result.nextIndex || startIndex + BATCH_SIZE
          setProgress(Math.round((startIndex / total) * 100))

          addLog(`成功: ${result.successCount} 条${result.failedCount > 0 ? `，失败: ${result.failedCount} 条` : ''}`)

          if (result.completed) {
            addLog('导入完成!')
            break
          }
        } else {
          addLog(`导入失败: ${result.message}`)
          break
        }

        // 稍微延迟避免过快调用
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      addLog(`导入完成! 成功: ${totalImported} 条，失败: ${totalFailed} 条`)

      // 最后检查状态
      await checkStatus()

    } catch (err) {
      addLog(`导入异常: ${err.message || err.errMsg}`)
    } finally {
      setImporting(false)
    }
  }

  // 清空模拟卷题目
  const clearMockExamQuestions = async () => {
    const confirm = await Taro.showModal({
      title: '确认清空',
      content: '确定要清空所有模拟卷题目吗？此操作不可恢复！'
    })

    if (!confirm.confirm) return

    try {
      addLog('正在清空模拟卷题目...')
      const res = await Taro.cloud.callFunction({
        name: 'import-data',
        data: {
          action: 'clearCollection',
          collection: 'questions_bank'
        }
      })

      if (res.result.success) {
        addLog(`清空成功，删除了 ${res.result.deleted} 条记录`)
      } else {
        addLog(`清空失败: ${res.result.message}`)
      }
    } catch (err) {
      addLog(`清空异常: ${err.message || err.errMsg}`)
    }
  }

  return (
    <View className="admin-import-page">
      <View className="header">
        <Text className="title">数据导入管理</Text>
      </View>

      <ScrollView className="logs" scrollY>
        {logs.length === 0 && (
          <Text className="empty-log">点击下方按钮开始操作</Text>
        )}
        {logs.map((log, index) => (
          <Text key={index} className="log-item">{log}</Text>
        ))}
      </ScrollView>

      {progress > 0 && progress < 100 && (
        <View className="progress-bar">
          <View className="progress-fill" style={{ width: `${progress}%` }}></View>
          <Text className="progress-text">{progress}%</Text>
        </View>
      )}

      <View className="actions">
        <Button
          className="btn btn-check"
          onClick={checkStatus}
          disabled={importing}
        >
          检查状态
        </Button>
        <Button
          className="btn btn-import"
          onClick={importMockExamQuestions}
          disabled={importing}
        >
          {importing ? '导入中...' : '导入模拟卷题目'}
        </Button>
        <Button
          className="btn btn-clear"
          onClick={clearMockExamQuestions}
          disabled={importing}
        >
          清空题目
        </Button>
      </View>
    </View>
  )
}

export default AdminImport
