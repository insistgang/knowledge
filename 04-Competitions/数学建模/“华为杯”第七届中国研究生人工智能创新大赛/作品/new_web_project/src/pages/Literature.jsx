import React, { useState, useEffect } from 'react'
import { Card, Input, Button, message, List, Typography, Divider } from 'antd'
import { BookOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'

const { TextArea } = Input
const { Title, Text } = Typography

// 古诗词数据库（包含赏析内容）
const poetryDatabase = [
  {
    id: 1,
    title: '静夜思',
    author: '李白',
    completeText: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
    blanks: ['明月光', '地上霜', '望明月', '思故乡'],
    appreciation: {
      background: '此诗作于李白出蜀漫游，客居异乡时。李白一生漂泊，对故乡有着深切的思念。',
      theme: '这首诗通过描绘秋夜望月的场景，表达了游子漂泊异乡的思乡之情。',
      artisticFeatures: '诗中以皎洁的月光为线索，运用比喻（月光如霜）和细节描写（举头、低头），将抽象的思乡之情具象化，语言质朴自然却韵味深远。',
      translations: 'Before my bed there is bright moonlight, which seems like frost on the ground. Looking up, I see the bright moon; lowering my head, I think of my hometown.'
    }
  },
  {
    id: 2,
    title: '望庐山瀑布',
    author: '李白',
    completeText: '日照香炉生紫烟，遥看瀑布挂前川。飞流直下三千尺，疑是银河落九天。',
    blanks: ['生紫烟', '挂前川', '三千尺', '落九天'],
    appreciation: {
      background: '李白游庐山时所作。庐山以雄、奇、险、秀闻名于世，瀑布更是其标志性景观。',
      theme: '这首诗生动地描绘了庐山瀑布的雄伟壮观，表达了诗人对大自然壮丽景色的赞美之情。',
      artisticFeatures: '诗中运用了比喻（瀑布如银河）、夸张（三千尺）和动态描写（飞流直下），将瀑布的气势磅礴展现得淋漓尽致，体现了李白诗歌豪放浪漫的风格。',
      translations: 'Sunshine bathes Incense Peak in purple mist; I see a waterfall hanging far away. Its torrent dashes down three thousand feet; it seems the Milky Way cascading from the Ninth Heaven.'
    }
  },
  {
    id: 3,
    title: '绝句',
    author: '杜甫',
    completeText: '两个黄鹂鸣翠柳，一行白鹭上青天。窗含西岭千秋雪，门泊东吴万里船。',
    blanks: ['鸣翠柳', '上青天', '千秋雪', '万里船'],
    appreciation: {
      background: '此诗作于杜甫在成都草堂居住时期，当时安史之乱已接近尾声，国家逐渐恢复安定。',
      theme: '这首诗通过描绘春日生机勃勃的景象，表达了诗人对和平生活的喜悦和对国家统一的期盼。',
      artisticFeatures: '诗中选取了黄鹂、翠柳、白鹭、青天、雪山、江船等典型意象，色彩鲜明，对仗工整，既有近景又有远景，构成了一幅绚丽多彩的春日画卷。',
      translations: 'Two golden orioles sing amid the willows green; A flock of white egrets flies into the blue sky. My window frames the snow-capped western mountains; From my door ships sail to distant eastern lands.'
    }
  },
  {
    id: 4,
    title: '登鹳雀楼',
    author: '王之涣',
    completeText: '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。',
    blanks: ['依山尽', '入海流', '千里目', '一层楼'],
    appreciation: {
      background: '鹳雀楼位于今山西省永济市，是唐代著名的观景楼阁。诗人王之涣登楼远眺，触景生情，写下此诗。',
      theme: '这首诗通过描绘壮丽的自然风光，表达了诗人积极向上、追求更高目标的进取精神。',
      artisticFeatures: '诗的前两句写景，气势宏大；后两句抒情，富有哲理。"欲穷千里目，更上一层楼"已成为千古名句，寓意只有站得更高，才能看得更远。',
      translations: 'The sun beyond the mountain glows; The Yellow River seaward flows. You can enjoy a grander sight; By climbing to a greater height.'
    }
  },
  {
    id: 5,
    title: '春晓',
    author: '孟浩然',
    completeText: '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
    blanks: ['不觉晓', '闻啼鸟', '风雨声', '知多少'],
    appreciation: {
      background: '这首诗是孟浩然隐居鹿门山时所作，描绘了春日早晨的情景。',
      theme: '诗中表达了诗人对春天的喜爱和对美好春光短暂易逝的惋惜之情。',
      artisticFeatures: '诗中运用了听觉描写（啼鸟、风雨声）和想象（花落），语言简洁明快，意境清新自然，生动地表现了春天的生机与活力。',
      translations: 'I slept soundly not realizing spring had dawned; Everywhere I hear birds singing their songs. Last night I heard the wind and rain so wild; How many petals fell? No one can tell.'
    }
  }
]

const Literature = () => {
  const [currentPoem, setCurrentPoem] = useState(null)
  const [userAnswers, setUserAnswers] = useState([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [completedPoems, setCompletedPoems] = useState([])
  const [history, setHistory] = useState([])
  const [isLearningStarted, setIsLearningStarted] = useState(false)
  const [showAppreciation, setShowAppreciation] = useState(false)
  const [results, setResults] = useState([])

  // 初始化加载
  useEffect(() => {
    loadHistory()
  }, [])

  // 从本地存储加载历史记录
  const loadHistory = () => {
    const savedHistory = localStorage.getItem('poetryHistory')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }

  // 保存历史记录到本地存储
  const saveHistory = (record) => {
    const newHistory = [record, ...history.slice(0, 9)] // 只保留最近10条记录
    setHistory(newHistory)
    localStorage.setItem('poetryHistory', JSON.stringify(newHistory))
  }

  // 开始学习
  const startLearning = () => {
    setIsLearningStarted(true)
    loadNextPoem()
  }

  // 加载下一首诗
  const loadNextPoem = () => {
    // 过滤掉已完成的诗
    const availablePoems = poetryDatabase.filter(poem => 
      !completedPoems.some(p => p.id === poem.id)
    )

    if (availablePoems.length === 0) {
      // 如果所有诗都已完成，重置已完成列表
      setCompletedPoems([])
      loadNextRandomPoem()
      return
    }

    loadNextRandomPoem()

    function loadNextRandomPoem() {
      const randomIndex = Math.floor(Math.random() * poetryDatabase.length)
      const poem = poetryDatabase[randomIndex]
      setCurrentPoem(poem)
      setUserAnswers(new Array(poem.blanks.length).fill(''))
      setIsCompleted(false)
      setScore(0)
      setShowAppreciation(false)
    }
  }

  // 处理答案输入变化
  const handleAnswerChange = (index, value) => {
    const newAnswers = [...userAnswers]
    newAnswers[index] = value
    setUserAnswers(newAnswers)
  }

  // 提交答案
  const submitAnswers = () => {
    if (!currentPoem) return

    // 计算分数
    let newScore = 0
    const newResults = userAnswers.map((answer, index) => {
      const isCorrect = answer.trim() === currentPoem.blanks[index]
      if (isCorrect) newScore += 25 // 每空25分
      return {
        index,
        answer,
        correctAnswer: currentPoem.blanks[index],
        isCorrect
      }
    })

    setResults(newResults)
    setScore(newScore)
    setIsCompleted(true)
    setCompletedPoems([...completedPoems, currentPoem])

    // 保存到历史记录
    const record = {
      id: Date.now(),
      poemTitle: currentPoem.title,
      author: currentPoem.author,
      score: newScore,
      date: new Date().toLocaleString('zh-CN')
    }
    saveHistory(record)

    message.success(`完成度：${newScore}分！`)
  }

  // 渲染赏析内容
  const renderAppreciation = () => {
    if (!currentPoem || !currentPoem.appreciation) return null

    const { appreciation } = currentPoem

    return (
      <Card title="诗歌赏析" className="appreciation-card mt-6">
        <div className="appreciation-content">
          <div className="appreciation-item">
            <Text strong>创作背景：</Text>
            <Text>{appreciation.background}</Text>
          </div>
          <Divider style={{ margin: '12px 0' }} />
          <div className="appreciation-item">
            <Text strong>主题思想：</Text>
            <Text>{appreciation.theme}</Text>
          </div>
          <Divider style={{ margin: '12px 0' }} />
          <div className="appreciation-item">
            <Text strong>艺术特色：</Text>
            <Text>{appreciation.artisticFeatures}</Text>
          </div>
          <Divider style={{ margin: '12px 0' }} />
          <div className="appreciation-item">
            <Text strong>英文翻译：</Text>
            <Text type="secondary">{appreciation.translations}</Text>
          </div>
        </div>
      </Card>
    )
  }

  // 渲染带空格的诗句
  const renderPoemWithBlanks = () => {
    if (!currentPoem) return null

    const lines = currentPoem.completeText.split('。').filter(line => line.trim())
    return lines.map((line, lineIndex) => {
      // 查找空格位置
      let processedLine = line
      const inputs = []
      
      currentPoem.blanks.forEach((blank, blankIndex) => {
        if (line.includes(blank)) {
          const before = processedLine.substring(0, processedLine.indexOf(blank))
          const after = processedLine.substring(processedLine.indexOf(blank) + blank.length)
          
          processedLine = before + after
          
          inputs.push(
            <div key={blankIndex} className="blank-input-wrapper">
              <TextArea
                rows={1}
                placeholder="请输入诗句"
                value={userAnswers[blankIndex]}
                onChange={(e) => handleAnswerChange(blankIndex, e.target.value)}
                disabled={isCompleted}
                className="blank-input"
              />
              {isCompleted && (
                <span className={`answer-result ${results[blankIndex]?.isCorrect ? 'correct' : 'incorrect'}`}>
                  {results[blankIndex]?.isCorrect ? (
                    <CheckCircleOutlined />
                  ) : (
                    <CloseCircleOutlined />
                  )}
                </span>
              )}
            </div>
          )
        }
      })

      return (
        <div key={lineIndex} className="poem-line">
          <Text className="poem-text">{processedLine}</Text>
          {inputs}
        </div>
      )
    })
  }

  // 渲染历史记录
  const renderHistory = () => {
    return (
      <Card title="练习历史" className="history-card">
        {history.length > 0 ? (
          <List
            dataSource={history}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  title={`${item.poemTitle} - ${item.author}`}
                  description={`得分：${item.score}分 | ${item.date}`}
                />
              </List.Item>
            )}
            pagination={{ pageSize: 5 }}
          />
        ) : (
          <Text type="secondary">暂无练习记录</Text>
        )}
      </Card>
    )
  }

  // 渲染推荐古诗词
  const renderRecommendedPoems = () => {
    return (
      <Card title="推荐学习" className="recommended-card">
        {poetryDatabase.slice(0, 5).map(poem => (
          <div key={poem.id} className="recommended-poem">
            <Title level={5}>{poem.title} - {poem.author}</Title>
            <Text type="secondary">{poem.completeText}</Text>
          </div>
        ))}
      </Card>
    )
  }

  return (
    <div className="literature-container min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <BookOutlined className="text-purple-600 mr-2" />
          <Title level={2}>古诗词学习</Title>
        </div>
        
        <div className="main-content">
          <Card className="poetry-card mb-6">
            {!isLearningStarted ? (
              <div className="text-center py-12">
                <BookOutlined className="text-purple-500 text-6xl mb-4" />
                <Title level={4} className="mb-4">探索中华文化的瑰宝</Title>
                <Text className="block mb-6 text-gray-600">通过古诗词赏析，感受中华文化的深厚底蕴和艺术魅力</Text>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<BookOutlined />}
                  onClick={startLearning}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  开始学习
                </Button>
              </div>
            ) : currentPoem ? (
              <>
                <Title level={3}>{currentPoem.title}</Title>
                <Text type="secondary" className="author">{currentPoem.author}</Text>
                
                <div className="poem-content">
                  {renderPoemWithBlanks()}
                </div>
                
                <Divider />
                
                {isCompleted ? (
                    <>
                      <div className="result-section">
                        <Title level={4} className="score">得分: {score}分</Title>
                        {score >= 80 ? (
                          <Text type="success">真棒！您对这首诗掌握得很好。</Text>
                        ) : score >= 60 ? (
                          <Text type="warning">还不错，继续努力！</Text>
                        ) : (
                          <Text type="danger">需要加强练习，加油！</Text>
                        )}
                        <div className="action-buttons">
                          <Button 
                            type="primary" 
                            onClick={() => setShowAppreciation(!showAppreciation)}
                            className="appreciation-btn"
                            style={{ marginRight: '10px' }}
                          >
                            {showAppreciation ? '隐藏赏析' : '查看赏析'}
                          </Button>
                          <Button type="primary" onClick={loadNextPoem} className="next-poem-btn">
                            下一首
                          </Button>
                        </div>
                      </div>
                      {showAppreciation ? renderAppreciation() : null}
                    </>
                ) : (
                  <Button 
                    type="primary" 
                    onClick={submitAnswers} 
                    className="submit-btn"
                    disabled={userAnswers.some(ans => ans.trim() === '')}
                  >
                    提交答案
                  </Button>
                )}
              </>
            ) : (
              <Text type="secondary">加载中...</Text>
            )}
          </Card>
          
          {renderHistory()}
        </div>
        
        {renderRecommendedPoems()}
      </div>
    </div>
  )
}

export default Literature