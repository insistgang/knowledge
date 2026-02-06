import React, { useState, useRef } from 'react'
import { Card, Input, Button, message, Typography, List, Tag, Divider, Alert } from 'antd'
import { HighlightOutlined, CheckCircleOutlined, CloseCircleOutlined, BookOutlined, EditOutlined, RotateLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { TextArea } = Input
const { Title, Text } = Typography

// 错别字纠错示例数据
const errorExamples = [
  {
    id: 1,
    originalText: '我们要发杨勤俭节约的传统美德。',
    correctText: '我们要发扬勤俭节约的传统美德。',
    errors: [
      { position: 3, original: '杨', correct: '扬', reason: "同音异形错别字，'扬'意为传播、发展" }
    ]
  },
  {
    id: 2,
    originalText: '他的学习成绩一直名列前矛。',
    correctText: '他的学习成绩一直名列前茅。',
    errors: [
      { position: 9, original: '矛', correct: '茅', reason: "音近错别字，'前茅'意为前列" }
    ]
  },
  {
    id: 3,
    originalText: '同学们兴高彩烈地参加了运动会。',
    correctText: '同学们兴高采烈地参加了运动会。',
    errors: [
      { position: 4, original: '彩', correct: '采', reason: "同音错别字，'采烈'形容兴致高" }
    ]
  },
  {
    id: 4,
    originalText: '老师语重心常地教导我们要好好学习。',
    correctText: '老师语重心长地教导我们要好好学习。',
    errors: [
      { position: 4, original: '常', correct: '长', reason: "音近错别字，'心长'意为情意深长" }
    ]
  },
  {
    id: 5,
    originalText: '她画了一幅风影优美的山水画。',
    correctText: '她画了一幅风景优美的山水画。',
    errors: [
      { position: 6, original: '影', correct: '景', reason: "音近错别字，'风景'指自然景色" }
    ]
  }
]

const Correction = () => {
  const navigate = useNavigate()
  const [isLearningStarted, setIsLearningStarted] = useState(false)
  const [selectedExample, setSelectedExample] = useState(null)
  const [userInput, setUserInput] = useState('')
  const [correctionResult, setCorrectionResult] = useState(null)
  const [score, setScore] = useState(0)
  const [completedExamples, setCompletedExamples] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [practiceHistory, setPracticeHistory] = useState([])
  const textAreaRef = useRef(null)

  // 从本地存储加载历史记录
  React.useEffect(() => {
    const savedHistory = localStorage.getItem('correctionHistory')
    if (savedHistory) {
      setPracticeHistory(JSON.parse(savedHistory))
    }
  }, [])

  // 开始学习
  const startLearning = () => {
    // 随机选择一个未完成的示例
    const availableExamples = errorExamples.filter(example => 
      !completedExamples.some(comp => comp.id === example.id)
    )
    
    if (availableExamples.length === 0) {
      message.success('恭喜您完成了所有错别字纠错练习！')
      // 记录练习结果
      const record = {
        id: Date.now(),
        type: '错别字纠错',
        score: score,
        totalQuestions: errorExamples.length,
        date: new Date().toLocaleString('zh-CN')
      }
      saveHistory(record)
      setShowHistory(true)
      return
    }
    
    const randomExample = availableExamples[Math.floor(Math.random() * availableExamples.length)]
    setSelectedExample(randomExample)
    setUserInput('')
    setCorrectionResult(null)
    setIsLearningStarted(true)
    
    // 聚焦到输入框
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus()
      }
    }, 100)
  }

  // 提交答案
  const submitAnswer = () => {
    if (!selectedExample || !userInput.trim()) {
      message.warning('请输入修正后的文本')
      return
    }
    
    // 检查答案是否正确
    const isCorrect = userInput.trim() === selectedExample.correctText
    
    // 计算分数（基于错误字数的修正情况）
    let newScore = score
    if (isCorrect) {
      newScore += 100 // 全对得100分
    } else {
      // 部分得分逻辑
      const userWords = userInput.trim().split('')
      const correctWords = selectedExample.correctText.split('')
      let correctCount = 0
      
      selectedExample.errors.forEach(error => {
        if (userWords[error.position] === error.correct) {
          correctCount++
        }
      })
      
      newScore += (correctCount / selectedExample.errors.length) * 100
    }
    
    setScore(Math.round(newScore))
    setCorrectionResult({
      isCorrect,
      userAnswer: userInput,
      correctAnswer: selectedExample.correctText,
      errors: selectedExample.errors
    })
    
    // 标记为已完成
    setCompletedExamples([...completedExamples, selectedExample])
  }

  // 下一题
  const nextExample = () => {
    startLearning()
  }

  // 保存历史记录
  const saveHistory = (record) => {
    const newHistory = [record, ...practiceHistory]
    setPracticeHistory(newHistory)
    localStorage.setItem('correctionHistory', JSON.stringify(newHistory))
  }

  // 重新开始
  const restartPractice = () => {
    setIsLearningStarted(false)
    setSelectedExample(null)
    setUserInput('')
    setCorrectionResult(null)
    setScore(0)
    setCompletedExamples([])
    setShowHistory(false)
  }

  // 渲染纠错结果
  const renderCorrectionResult = () => {
    if (!correctionResult) return null
    
    return (
      <div className="mt-4">
        <Title level={5} className="mb-2">纠错结果</Title>
        <div className="mb-3">
          <Text strong>您的答案：</Text>
          <div className="p-2 border rounded bg-gray-50 mt-1">
            {correctionResult.userAnswer}
          </div>
        </div>
        
        <div className="mb-3">
          <Text strong>正确答案：</Text>
          <div className="p-2 border rounded bg-gray-50 mt-1">
            {correctionResult.correctAnswer}
          </div>
        </div>
        
        <div className="mb-3">
          <Text strong>错误分析：</Text>
          <List
            dataSource={correctionResult.errors}
            renderItem={(error, index) => (
              <List.Item>
                <Tag color="red">错别字</Tag>
                <Text className="ml-2">'{error.original}' 应改为 '{error.correct}'</Text>
                <Text type="secondary" className="ml-2">（{error.reason}）</Text>
              </List.Item>
            )}
          />
        </div>
        
        {correctionResult.isCorrect ? (
          <Alert type="success" message="太棒了！您的答案完全正确！" showIcon />
        ) : (
          <Alert type="warning" message="部分错别字未修正，请继续努力！" showIcon />
        )}
      </div>
    )
  }

  // 渲染练习历史
  const renderPracticeHistory = () => {
    return (
      <Card title="练习历史" className="mt-4">
        <List
          dataSource={practiceHistory}
          renderItem={(record) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <div className="flex justify-between items-center">
                    <span>{record.type}</span>
                    <span className="text-blue-600">得分：{record.score}</span>
                  </div>
                }
                description={
                  <div className="flex justify-between items-center">
                    <span>完成题目数：{record.totalQuestions}</span>
                    <span>{record.date}</span>
                  </div>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无练习历史' }}
        />
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <HighlightOutlined className="text-red-600 mr-2" />
          <Title level={2}>错别字纠错练习</Title>
        </div>
        
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Title level={4}>练习进度</Title>
            <Text strong>当前得分：{score}</Text>
          </div>
          
          {!isLearningStarted && !showHistory ? (
            <div className="text-center py-10">
              <HighlightOutlined className="text-red-500 text-6xl mb-4" />
              <Title level={4} className="mb-4">提高语文水平的重要技能</Title>
              <Text className="block mb-6 text-gray-600">错别字纠错是学习语文的基础技能，通过练习可以提高文字表达的准确性</Text>
              <Button 
                type="primary" 
                size="large" 
                icon={<EditOutlined />}
                onClick={startLearning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                开始学习
              </Button>
            </div>
          ) : showHistory ? (
            <div>
              <Alert type="success" message="恭喜您完成了所有错别字纠错练习！" showIcon className="mb-4" />
              {renderPracticeHistory()}
              <Button 
                type="primary" 
                block 
                icon={<RotateLeftOutlined />}
                onClick={restartPractice}
                className="mt-4"
              >
                重新开始练习
              </Button>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <Title level={5}>请修正下面句子中的错别字：</Title>
                <div className="p-3 border-l-4 border-red-400 bg-red-50 mb-4">
                  <Text type="secondary">原句：</Text>
                  <Text>{selectedExample?.originalText}</Text>
                </div>
                
                <div className="mb-4">
                  <TextArea
                    ref={textAreaRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="请输入修正后的句子"
                    rows={3}
                    maxLength={100}
                    showCount
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button type="primary" onClick={submitAnswer} disabled={!userInput.trim()}>
                    提交答案
                  </Button>
                  <Button onClick={() => setUserInput('')}>清空</Button>
                </div>
              </div>
              
              {correctionResult && renderCorrectionResult()}
              
              {correctionResult && (
                <div className="mt-4 flex justify-end">
                  <Button type="primary" onClick={nextExample}>下一题</Button>
                </div>
              )}
            </div>
          )}
        </Card>
        
        {/* 学习提示卡片 */}
        <Card title="学习提示" type="inner">
          <List
            dataSource={[
              '注意区分同音字和形近字',
              '理解词语的含义有助于正确使用',
              '多阅读优秀作品可以提高对文字的敏感度',
              '练习时注重分析错误原因，而不仅仅是纠正' 
            ]}
            renderItem={(tip, index) => (
              <List.Item>
                <CheckCircleOutlined className="text-green-500 mr-2" />
                <Text>{tip}</Text>
              </List.Item>
            )}
          />
        </Card>
        
        {/* 相关推荐 */}
        <div className="mt-6">
          <Divider>相关推荐</Divider>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              hoverable
              className="cursor-pointer"
              onClick={() => navigate('/literature')}
            >
              <div className="flex items-center">
                <BookOutlined className="text-purple-600 mr-2" />
                <Text strong>古诗词赏析</Text>
              </div>
            </Card>
            <Card
              hoverable
              className="cursor-pointer"
              onClick={() => navigate('/vocabulary')}
            >
              <div className="flex items-center">
                <BookOutlined className="text-blue-600 mr-2" />
                <Text strong>词汇学习</Text>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Correction