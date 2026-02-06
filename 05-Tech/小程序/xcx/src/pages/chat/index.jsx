/**
 * 语文助手 - 智能答疑页面
 */
import { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import chatService from '../../services/chat'
import { pageShareConfigs } from '../../utils/share'
import './index.less'

function Chat() {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  // 使用数字作为滚动锚点，避免 React 的 id 更新问题
  const [scrollAnchor, setScrollAnchor] = useState(0)
  // 存储定时器引用，用于清理
  const timerRef = useRef(null)

  // 初始化：从本地加载聊天历史
  useEffect(() => {
    if (!initialized) {
      const localHistory = chatService.loadLocalHistory()
      if (localHistory.length > 0) {
        setMessages(localHistory)
      } else {
        // 首次使用显示欢迎消息
        setMessages([
          {
            id: 0,
            role: 'assistant',
            content: '你好！我是你的语文学习助手，可以帮你解答语文学习中的问题。\n\n你可以问我：\n• 词语释义\n• 诗词赏析\n• 语法知识\n• 写作技巧\n\n快来提问吧！'
          }
        ])
      }
      setInitialized(true)
    }

    // 组件卸载时清除定时器
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [initialized])

  useDidShow(() => {
    // 延迟滚动，确保 ScrollView 已渲染
    timerRef.current = setTimeout(() => {
      scrollToBottom()
    }, 300)
  })

  // 启用页面分享
  useShareAppMessage(() => {
    return pageShareConfigs.chat
  })

  // 启用朋友圈分享
  useShareTimeline(() => {
    return {
      title: pageShareConfigs.chat.title,
      query: ''
    }
  })

  // 使用 Taro 的 createSelectorQuery 实现滚动
  const scrollToBottom = () => {
    Taro.createSelectorQuery()
      .select('.message-list')
      .boundingClientRect()
      .exec((res) => {
        if (res && res[0]) {
          const { height } = res[0]
          // 使用 setData 的方式更新 scrollAnchor，触发 scrollIntoView
          setScrollAnchor(Date.now())
        }
      })
  }

  const handleSend = async () => {
    if (!inputText.trim() || loading) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputText.trim()
    }

    setMessages([...messages, userMessage])
    setInputText('')
    setLoading(true)

    // 延迟滚动，等待 DOM 更新
    timerRef.current = setTimeout(scrollToBottom, 100)

    try {
      const response = await chatService.sendMessage(inputText.trim())

      const assistantMessage = {
        id: response.messageId || Date.now() + 1,
        role: 'assistant',
        content: response.reply
      }

      setMessages(prev => [...prev, assistantMessage])
      timerRef.current = setTimeout(scrollToBottom, 100)
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: '抱歉，我遇到了一些问题，请稍后再试。'
      }])
      timerRef.current = setTimeout(scrollToBottom, 100)
    } finally {
      setLoading(false)
    }
  }

  const handlePresetQuestion = async (question) => {
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: question
    }

    setMessages([...messages, userMessage])
    setInputText('')
    setLoading(true)

    timerRef.current = setTimeout(scrollToBottom, 100)

    try {
      const response = await chatService.sendMessage(question)

      const assistantMessage = {
        id: response.messageId || Date.now() + 1,
        role: 'assistant',
        content: response.reply
      }

      setMessages(prev => [...prev, assistantMessage])
      timerRef.current = setTimeout(scrollToBottom, 100)
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: '抱歉，我遇到了一些问题，请稍后再试。'
      }])
      timerRef.current = setTimeout(scrollToBottom, 100)
    } finally {
      setLoading(false)
    }
  }

  const presetQuestions = [
    '什么是比喻？',
    '什么是拟人？',
    '古诗中常用的意象有哪些？',
    '如何区分近义词？',
    '怎样修改病句？',
    '如何写好作文开头？'
  ]

  return (
    <View className="chat-page">
      <ScrollView
        scrollY
        scrollIntoView={`anchor-${scrollAnchor}`}
        scrollWithAnimation
        className="message-list"
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            className={`message-item ${msg.role === 'user' ? 'user' : 'assistant'}`}
          >
            {msg.role === 'assistant' && (
              <View className="avatar">
                <Text className="avatar-emoji">🤖</Text>
              </View>
            )}
            <View className={`message-content ${msg.role}`}>
              <Text className="message-text">{msg.content}</Text>
            </View>
            {msg.role === 'user' && (
              <View className="avatar user">
                <Text className="avatar-emoji">👤</Text>
              </View>
            )}
          </View>
        ))}

        {/* 滚动锚点 - 使用 Text 组件确保 id 生效 */}
        <Text id={`anchor-${scrollAnchor}`} style={{ display: 'block', height: '2px' }}></Text>

        {loading && (
          <View className="message-item assistant">
            <View className="avatar">
              <Text className="avatar-emoji">🤖</Text>
            </View>
            <View className="message-content assistant typing">
              <View className="typing-dots">
                <Text className="dot">.</Text>
                <Text className="dot">.</Text>
                <Text className="dot">.</Text>
              </View>
            </View>
          </View>
        )}

        {messages.length === 0 && (
          <View className="empty-state">
            <Text className="empty-icon">💬</Text>
            <Text className="empty-text">开始你的学习之旅</Text>
            <View className="preset-questions">
              {presetQuestions.map((q, index) => (
                <View
                  key={index}
                  className="preset-btn"
                  onClick={() => handlePresetQuestion(q)}
                >
                  {q}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View className="input-area">
        <View className="input-wrapper">
          <Input
            className="chat-input"
            placeholder="输入你的问题..."
            value={inputText}
            onInput={(e) => setInputText(e.detail.value)}
            onConfirm={handleSend}
            disabled={loading}
            maxlength={500}
          />
          <View
            className={`send-btn ${inputText.trim() && !loading ? 'active' : ''}`}
            onClick={handleSend}
          >
            发送
          </View>
        </View>
      </View>
    </View>
  )
}

export default Chat
