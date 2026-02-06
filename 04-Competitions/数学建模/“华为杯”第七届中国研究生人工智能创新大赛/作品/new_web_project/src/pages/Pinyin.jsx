import React, { useState, useEffect } from 'react'
import { Card, Button, Input, List, Radio, message, Divider, Progress, Statistic, Row, Col } from 'antd'
import { BookOutlined, PlayCircleOutlined, CheckOutlined, ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const Pinyin = () => {
  const navigate = useNavigate()
  const [isLearningStarted, setIsLearningStarted] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null)
  const [practiceResult, setPracticeResult] = useState({ correct: 0, total: 0 })
  const [exerciseCompleted, setExerciseCompleted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [answerHistory, setAnswerHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [difficulty, setDifficulty] = useState('easy')
  const [wordList, setWordList] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // 常用汉字数据集 - 按难度分级
  const wordDatasets = {
    easy: [
      { id: 1, character: '人', pinyin: 'rén', meaning: '人类' },
      { id: 2, character: '口', pinyin: 'kǒu', meaning: '嘴巴' },
      { id: 3, character: '手', pinyin: 'shǒu', meaning: '手部' },
      { id: 4, character: '足', pinyin: 'zú', meaning: '脚' },
      { id: 5, character: '目', pinyin: 'mù', meaning: '眼睛' },
      { id: 6, character: '耳', pinyin: 'ěr', meaning: '耳朵' },
      { id: 7, character: '日', pinyin: 'rì', meaning: '太阳' },
      { id: 8, character: '月', pinyin: 'yuè', meaning: '月亮' },
      { id: 9, character: '水', pinyin: 'shuǐ', meaning: '水流' },
      { id: 10, character: '火', pinyin: 'huǒ', meaning: '火焰' }
    ],
    medium: [
      { id: 11, character: '学', pinyin: 'xué', meaning: '学习' },
      { id: 12, character: '习', pinyin: 'xí', meaning: '练习' },
      { id: 13, character: '语', pinyin: 'yǔ', meaning: '语言' },
      { id: 14, character: '文', pinyin: 'wén', meaning: '文字' },
      { id: 15, character: '体', pinyin: 'tǐ', meaning: '身体' },
      { id: 16, character: '育', pinyin: 'yù', meaning: '教育' },
      { id: 17, character: '书', pinyin: 'shū', meaning: '书籍' },
      { id: 18, character: '写', pinyin: 'xiě', meaning: '书写' },
      { id: 19, character: '读', pinyin: 'dú', meaning: '阅读' },
      { id: 20, character: '听', pinyin: 'tīng', meaning: '听见' }
    ],
    hard: [
      { id: 21, character: '勤', pinyin: 'qín', meaning: '勤奋' },
      { id: 22, character: '奋', pinyin: 'fèn', meaning: '奋斗' },
      { id: 23, character: '智', pinyin: 'zhì', meaning: '智慧' },
      { id: 24, character: '慧', pinyin: 'huì', meaning: '聪慧' },
      { id: 25, character: '努', pinyin: 'nǔ', meaning: '努力' },
      { id: 26, character: '力', pinyin: 'lì', meaning: '力量' },
      { id: 27, character: '成', pinyin: 'chéng', meaning: '成功' },
      { id: 28, character: '功', pinyin: 'gōng', meaning: '功劳' },
      { id: 29, character: '坚', pinyin: 'jiān', meaning: '坚持' },
      { id: 30, character: '持', pinyin: 'chí', meaning: '持续' }
    ]
  }

  // 生成模拟选项
  const generateOptions = (correctPinyin, exclude = []) => {
    const mockOptions = ['rén', 'kǒu', 'shǒu', 'zú', 'mù', 'ěr', 'rì', 'yuè', 'shuǐ', 'huǒ', 
                        'xué', 'xí', 'yǔ', 'wén', 'tǐ', 'yù', 'shū', 'xiě', 'dú', 'tīng',
                        'qín', 'fèn', 'zhì', 'huì', 'nǔ', 'lì', 'chéng', 'gōng', 'jiān', 'chí']
    
    // 确保正确答案在选项中
    const options = [correctPinyin]
    
    // 随机添加其他选项，避免重复
    while (options.length < 4) {
      const randomIndex = Math.floor(Math.random() * mockOptions.length)
      const randomOption = mockOptions[randomIndex]
      if (!options.includes(randomOption) && !exclude.includes(randomOption)) {
        options.push(randomOption)
      }
    }
    
    // 打乱选项顺序
    return options.sort(() => Math.random() - 0.5)
  }

  // 开始学习
  const startLearning = () => {
    setIsLoading(true)
    
    // 模拟加载延迟
    setTimeout(() => {
      setWordList(wordDatasets[difficulty])
      setCurrentWordIndex(0)
      setPracticeResult({ correct: 0, total: wordDatasets[difficulty].length })
      setProgress(0)
      setIsLearningStarted(true)
      setExerciseCompleted(false)
      setAnswerHistory([])
      setSelectedOption(null)
      setIsAnswerCorrect(null)
      setIsLoading(false)
    }, 800)
  }

  // 处理选项选择
  const handleOptionSelect = (e) => {
    const selectedValue = e.target.value
    setSelectedOption(selectedValue)
    
    const currentWord = wordList[currentWordIndex]
    const isCorrect = selectedValue === currentWord.pinyin
    setIsAnswerCorrect(isCorrect)
    
    // 更新练习结果
    if (isCorrect && !answerHistory[currentWordIndex]) {
      setPracticeResult(prev => ({
        ...prev,
        correct: prev.correct + 1
      }))
    }
    
    // 记录答案历史
    const newHistory = [...answerHistory]
    newHistory[currentWordIndex] = {
      character: currentWord.character,
      correctPinyin: currentWord.pinyin,
      selectedPinyin: selectedValue,
      isCorrect: isCorrect
    }
    setAnswerHistory(newHistory)
  }

  // 下一个汉字
  const goToNextWord = () => {
    if (currentWordIndex < wordList.length - 1) {
      const nextIndex = currentWordIndex + 1
      setCurrentWordIndex(nextIndex)
      setSelectedOption(null)
      setIsAnswerCorrect(null)
      setProgress(Math.round(((nextIndex + 1) / wordList.length) * 100))
    } else {
      // 练习完成
      setExerciseCompleted(true)
      setProgress(100)
      
      // 保存到本地存储
      const practiceRecord = {
        date: new Date().toISOString(),
        difficulty: difficulty,
        result: practiceResult,
        history: answerHistory
      }
      
      try {
        const existingRecords = JSON.parse(localStorage.getItem('pinyinPracticeRecords') || '[]')
        existingRecords.push(practiceRecord)
        localStorage.setItem('pinyinPracticeRecords', JSON.stringify(existingRecords))
      } catch (error) {
        console.error('保存练习记录失败:', error)
      }
    }
  }

  // 重新开始
  const restartLearning = () => {
    setIsLearningStarted(false)
    setExerciseCompleted(false)
    setCurrentWordIndex(0)
    setPracticeResult({ correct: 0, total: 0 })
    setProgress(0)
    setAnswerHistory([])
    setSelectedOption(null)
    setIsAnswerCorrect(null)
    setShowHistory(false)
  }

  // 返回主页
  const returnToHome = () => {
    navigate('/home')
  }

  // 播放发音（模拟）
  const playPronunciation = () => {
    const currentWord = wordList[currentWordIndex]
    message.success(`播放 ${currentWord.character} 的发音: ${currentWord.pinyin}`)
  }

  // 渲染开始学习界面
  const renderStartScreen = () => (
    <Card title="汉字拼音练习" className="pinyin-start-card">
      <div className="pinyin-start-content">
        <h3>练习常用汉字的拼音读音</h3>
        <p>通过选择正确的拼音，提升汉字发音识别能力</p>
        
        <div className="difficulty-selection">
          <h4>选择难度</h4>
          <Radio.Group onChange={(e) => setDifficulty(e.target.value)} value={difficulty}>
            <Radio.Button value="easy">简单</Radio.Button>
            <Radio.Button value="medium">中等</Radio.Button>
            <Radio.Button value="hard">困难</Radio.Button>
          </Radio.Group>
        </div>
        
        <div className="preview-section">
          <h4>示例汉字</h4>
          <div className="preview-words">
            {wordDatasets[difficulty].slice(0, 5).map((word) => (
              <div key={word.id} className="preview-word">
                <span className="character">{word.character}</span>
                <span className="pinyin">{word.pinyin}</span>
                <span className="meaning">{word.meaning}</span>
              </div>
            ))}
          </div>
        </div>
        
        <Button 
          type="primary" 
          size="large" 
          onClick={startLearning} 
          icon={<BookOutlined />}
          className="start-btn"
          loading={isLoading}
        >
          开始学习
        </Button>
      </div>
    </Card>
  )

  // 渲染练习界面
  const renderLearningScreen = () => {
    if (isLoading || wordList.length === 0) {
      return (
        <Card className="loading-card">
          <div className="loading-content">
            <p>正在加载练习内容...</p>
          </div>
        </Card>
      )
    }

    const currentWord = wordList[currentWordIndex]
    const options = generateOptions(currentWord.pinyin, [])

    return (
      <>
        <div className="progress-section">
          <Row gutter={16}>
            <Col span={16}>
              <Progress percent={progress} status="active" showInfo />
            </Col>
            <Col span={8}>
              <Statistic 
                title="正确率" 
                value={Math.round((practiceResult.correct / (currentWordIndex + 1)) * 100)} 
                suffix="%" 
              />
            </Col>
          </Row>
        </div>
        
        <Card title={`汉字 ${currentWordIndex + 1}/${wordList.length}`} className="pinyin-learning-card">
          <div className="character-display">
            <h2>{currentWord.character}</h2>
            <p className="character-meaning">{currentWord.meaning}</p>
            <Button 
              type="text" 
              icon={<PlayCircleOutlined />} 
              onClick={playPronunciation}
              className="play-btn"
            >
              播放发音
            </Button>
          </div>
          
          <Divider>
            请选择正确的拼音
          </Divider>
          
          <Radio.Group onChange={handleOptionSelect} value={selectedOption} className="options-group">
            <List
              grid={{ gutter: 16, column: 2 }}
              dataSource={options}
              renderItem={(option) => (
                <List.Item>
                  <Radio value={option} className={`option-radio ${selectedOption === option ? 'selected' : ''}`}>
                    {option}
                  </Radio>
                </List.Item>
              )}
            />
          </Radio.Group>
          
          {selectedOption && (
            <div className={`answer-feedback ${isAnswerCorrect ? 'correct' : 'incorrect'}`}>
              {isAnswerCorrect ? (
                <>
                  <CheckOutlined className="feedback-icon" />
                  <span>回答正确！</span>
                </>
              ) : (
                <>
                  <span>回答错误！</span>
                  <span className="correct-answer">正确答案：{currentWord.pinyin}</span>
                </>
              )}
            </div>
          )}
          
          <div className="action-buttons">
            <Button 
              type={selectedOption ? 'primary' : 'default'} 
              onClick={goToNextWord} 
              icon={<ArrowRightOutlined />}
              disabled={!selectedOption}
              className="next-btn"
            >
              {currentWordIndex < wordList.length - 1 ? '下一个' : '完成练习'}
            </Button>
          </div>
        </Card>
      </>
    )
  }

  // 渲染练习完成界面
  const renderCompletedScreen = () => (
    <Card title="练习完成" className="pinyin-completed-card">
      <div className="completed-content">
        <div className="result-summary">
          <h3>恭喜你完成了所有练习！</h3>
          <div className="result-stats">
            <Statistic title="总字数" value={practiceResult.total} />
            <Statistic title="正确数" value={practiceResult.correct} />
            <Statistic title="正确率" value={Math.round((practiceResult.correct / practiceResult.total) * 100)} suffix="%" />
          </div>
        </div>
        
        <Button 
          type="primary" 
          onClick={() => setShowHistory(!showHistory)}
          className="history-btn"
        >
          {showHistory ? '隐藏答案历史' : '查看答案历史'}
        </Button>
        
        {showHistory && (
          <div className="answer-history">
            <h4>答案历史</h4>
            <List
              dataSource={answerHistory}
              renderItem={(item, index) => (
                <List.Item className={`history-item ${item.isCorrect ? 'correct' : 'incorrect'}`}>
                  <span className="history-character">{item.character}</span>
                  <span className="history-pinyin">正确: {item.correctPinyin}</span>
                  {!item.isCorrect && (
                    <span className="history-selected">你的答案: {item.selectedPinyin}</span>
                  )}
                  <span className="history-result">{item.isCorrect ? '✓' : '✗'}</span>
                </List.Item>
              )}
            />
          </div>
        )}
        
        <div className="final-actions">
          <Button 
            type="primary" 
            onClick={restartLearning} 
            icon={<ReloadOutlined />}
            className="restart-btn"
          >
            重新练习
          </Button>
          <Button 
            onClick={returnToHome}
            className="home-btn"
          >
            返回主页
          </Button>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="pinyin-container">
      {!isLearningStarted && renderStartScreen()}
      {isLearningStarted && !exerciseCompleted && renderLearningScreen()}
      {isLearningStarted && exerciseCompleted && renderCompletedScreen()}
    </div>
  )
}

export default Pinyin