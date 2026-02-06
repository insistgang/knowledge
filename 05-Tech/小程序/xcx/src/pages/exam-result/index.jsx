/**
 * 考试结果解析页面
 * 显示每道题的题目、用户答案、正确答案和解析
 */
import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { navigateBack, getCurrentInstance } from '@tarojs/taro'
import './index.less'

function ExamResult() {
  const instance = getCurrentInstance()
  // 从路由参数获取数据
  const params = instance.router.params || {}
  const resultData = JSON.parse(params.data || '{}')

  const [questions, setQuestions] = useState(resultData.questions || [])
  const [answers, setAnswers] = useState(resultData.answers || {})
  const [score, setScore] = useState(resultData.score || 0)

  // 计算每道题的答题状态
  const getQuestionStatus = (question) => {
    const userAnswer = answers[question.id]
    if (userAnswer === undefined) return 'unanswered'
    return userAnswer === question.correctAnswer ? 'correct' : 'wrong'
  }

  // 获取选项文本
  const getOptionText = (question, index) => {
    if (!question.options || question.options.length <= index) return ''
    return question.options[index]
  }

  // 获取答案字母
  const getAnswerLetter = (index) => {
    return ['A', 'B', 'C', 'D'][index] || ''
  }

  // 统计数据
  const correctCount = questions.filter(q => answers[q.id] === q.correctAnswer).length
  const wrongCount = questions.filter(q => {
    const ans = answers[q.id]
    return ans !== undefined && ans !== q.correctAnswer
  }).length
  const unansweredCount = questions.length - Object.keys(answers).length

  return (
    <View className="exam-result-page">
      {/* 成绩卡片 */}
      <View className="score-card">
        <View className="score-header">
          <Text className="score-number">{score}</Text>
          <Text className="score-label">分</Text>
        </View>
        <View className="score-stats">
          <View className="stat-item correct">
            <Text className="stat-value">{correctCount}</Text>
            <Text className="stat-label">答对</Text>
          </View>
          <View className="stat-item wrong">
            <Text className="stat-value">{wrongCount}</Text>
            <Text className="stat-label">答错</Text>
          </View>
          <View className="stat-item unanswered">
            <Text className="stat-value">{unansweredCount}</Text>
            <Text className="stat-label">未答</Text>
          </View>
        </View>
      </View>

      {/* 题目解析列表 */}
      <ScrollView scrollY className="questions-list">
        {questions.map((question, index) => {
          const status = getQuestionStatus(question)
          const userAnswer = answers[question.id]

          return (
            <View key={question.id} className={`question-item ${status}`}>
              {/* 题目编号和状态 */}
              <View className="question-header">
                <Text className="question-num">第 {index + 1} 题</Text>
                <View className={`status-badge ${status}`}>
                  <Text className="status-text">
                    {status === 'correct' ? '正确' : status === 'wrong' ? '错误' : '未作答'}
                  </Text>
                </View>
              </View>

              {/* 题目内容 */}
              <View className="question-content">
                <Text className="question-text">{question.question}</Text>
              </View>

              {/* 选项列表 */}
              <View className="options-list">
                {question.options?.map((option, optIndex) => {
                  const isUserAnswer = userAnswer === optIndex
                  const isCorrectAnswer = question.correctAnswer === optIndex
                  const optionClass = isCorrectAnswer
                    ? 'option-correct'
                    : isUserAnswer
                      ? 'option-wrong'
                      : 'option-normal'

                  return (
                    <View key={optIndex} className={`option-item ${optionClass}`}>
                      <View className="option-marker">
                        {isCorrectAnswer && <Text className="marker-icon">✓</Text>}
                        {isUserAnswer && !isCorrectAnswer && <Text className="marker-icon">×</Text>}
                      </View>
                      <Text className="option-text">{option}</Text>
                    </View>
                  )
                })}
              </View>

              {/* 答案对比 */}
              {status !== 'unanswered' && (
                <View className="answer-compare">
                  <View className="compare-item">
                    <Text className="compare-label">您的答案：</Text>
                    <Text className={`compare-value user-${status}`}>
                      {userAnswer !== undefined ? getAnswerLetter(userAnswer) : '-'}
                    </Text>
                  </View>
                  <View className="compare-item">
                    <Text className="compare-label">正确答案：</Text>
                    <Text className="compare-value correct">
                      {getAnswerLetter(question.correctAnswer)}
                    </Text>
                  </View>
                </View>
              )}

              {/* 解析说明 */}
              {question.analysis && (
                <View className="analysis-section">
                  <Text className="analysis-label">【解析】</Text>
                  <Text className="analysis-text">{question.analysis}</Text>
                </View>
              )}

              {/* 题型标签 */}
              <View className="question-tags">
                <Text className="tag-item">
                  {question.type === 'pinyin' ? '拼音' :
                   question.type === 'idiom' ? '成语' :
                   question.type === 'vocabulary' ? '词汇' :
                   question.type === 'correction' ? '病句' :
                   question.type === 'literature' ? '古诗词' : '其他'}
                </Text>
              </View>
            </View>
          )
        })}
      </ScrollView>

      {/* 底部按钮 */}
      <View className="footer-actions">
        <View className="footer-btn" onClick={navigateBack}>返回</View>
      </View>
    </View>
  )
}

export default ExamResult
