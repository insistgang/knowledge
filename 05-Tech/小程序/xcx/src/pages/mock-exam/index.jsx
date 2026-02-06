/**
 * 模拟考试页面
 * 从数据库题库中随机抽取题目，每次考试题目都不同
 */
import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { navigateBack, useDidShow, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { QUESTION_TYPES } from '../../utils/constants'
import studyService from '../../services/study'
import questionService from '../../services/question'
import eventBus, { EVENTS } from '../../utils/eventBus'
import { pageShareConfigs } from '../../utils/share'
import './index.less'

// 引入扩展后的题目数据（1000道题）
// 使用动态 import 避免循环依赖
let ALL_QUESTIONS = []

// 初始化题目数据
const initQuestions = () => {
  if (ALL_QUESTIONS.length === 0) {
    // 这里使用动态构造题目数据
    // 从 question.js 中的生成函数获取题目
    const baseQuestions = [
      // 拼音题 - 基础20题
      { id: 'py001', type: 'pinyin', question: '下列加点字注音完全正确的一项是：', options: ['A. 狡狞(níng)', 'B. 机械(jiè)', 'C. 同仇敌忾(kài)', 'D. 玷污(zhēn)'], correctAnswer: 2, analysis: 'C项注音完全正确。' },
      { id: 'py002', type: 'pinyin', question: '下列词语中加点字的读音，与所给注音全部相同的一项是：', options: ['A. 供 gòng 供给 供认 供品', 'B. 角 jué 角色 口角 角逐', 'C. 强 qiáng 强迫 倔强 强壮', 'D. 处 chǔ 处理 处分 处所'], correctAnswer: 1, analysis: 'B项全部读jué。' },
      { id: 'py003', type: 'pinyin', question: '"参"在"参加"中读：', options: ['A. cēn', 'B. shēn', 'C. cān', 'D. cī'], correctAnswer: 2, analysis: '"参"在"参加"中读cān。' },
      { id: 'py004', type: 'pinyin', question: '"薄"在"薄雾"中读：', options: ['A. báo', 'B. bó', 'C. bò', 'D. bē'], correctAnswer: 0, analysis: '"薄"在"薄雾"中读báo。' },
      { id: 'py005', type: 'pinyin', question: '下列加点字读音完全正确的一项是：', options: ['A. 贮蓄(zhù) 菡萏(hàn) 酝酿(niàng)', 'B. 粗糙(cāo) 确凿(záo) 唯妙唯肖(xiào)', 'C. 讪笑(shàn) 挑衅(xìn) 哂笑(xī)', 'D. 媲美(pì) 缄默(jiān) 酷肖(xiào)'], correctAnswer: 0, analysis: 'A项正确。' },
      // 成语题
      { id: 'cy001', type: 'idiom', question: '下列成语中使用正确的一项是：', options: ['A. 电影情节自相矛盾', 'B. 文章见解不同凡响', 'C. 经济发展举世瞩目', 'D. 失利后重整旗鼓'], correctAnswer: 3, analysis: 'D项"重整旗鼓"使用正确。' },
      { id: 'cy002', type: 'idiom', question: '"画蛇添足"比喻：', options: ['A. 做事要认真', 'B. 做多余的事反不好', 'C. 抓住机会', 'D. 坚持到底'], correctAnswer: 1, analysis: '"画蛇添足"比喻做了多余的事。' },
      { id: 'cy003', type: 'idiom', question: '"守株待兔"比喻：', options: ['A. 善于观察', 'B. 死守不知变通', 'C. 有耐心', 'D. 运气重要'], correctAnswer: 1, analysis: '"守株待兔"比喻死守经验不知变通。' },
      { id: 'cy004', type: 'idiom', question: '"亡羊补牢"的意思是：', options: ['A. 羊丢了不找', 'B. 出问题后补救', 'C. 修理羊圈', 'D. 预防问题'], correctAnswer: 1, analysis: '"亡羊补牢"比喻出了问题及时补救。' },
      { id: 'cy005', type: 'idiom', question: '"胸有成竹"比喻：', options: ['A. 心里有竹子', 'B. 做事有把握', 'C. 喜欢画画', 'D. 胸部宽广'], correctAnswer: 1, analysis: '"胸有成竹"比喻做事有把握。' },
      // 词汇题
      { id: 'vo001', type: 'vocabulary', question: '"姹紫嫣红"的意思是：', options: ['A. 颜色单一', 'B. 各种花朵娇艳', 'C. 紫色红色', 'D. 花朵凋零'], correctAnswer: 1, analysis: '"姹紫嫣红"形容各种颜色花朵娇艳。' },
      { id: 'vo002', type: 'vocabulary', question: '下列词语中没有错别字的一项是：', options: ['A. 再接再励', 'B. 谈笑风生', 'C. 巧夺天公', 'D. 迫不急待'], correctAnswer: 1, analysis: 'B项正确。' },
      { id: 'vo003', type: 'vocabulary', question: '"美轮美奂"形容：', options: ['A. 美丽风景', 'B. 高大华丽建筑', 'C. 美丽的人', 'D. 美好音乐'], correctAnswer: 1, analysis: '"美轮美奂"形容房屋高大华丽。' },
      { id: 'vo004', type: 'vocabulary', question: '"鳞次栉比"的意思是：', options: ['A. 排列密', 'B. 鱼和梳子', 'C. 次序混乱', 'D. 整齐稀疏'], correctAnswer: 0, analysis: '"鳞次栉比"形容建筑物排列密整。' },
      { id: 'vo005', type: 'vocabulary', question: '"因地制宜"的意思是：', options: ['A. 根据当地制定措施', 'B. 改造环境', 'C. 适应环境', 'D. 改变制度'], correctAnswer: 0, analysis: '"因地制宜"指根据情况制定办法。' },
      // 病句题
      { id: 'bc001', type: 'correction', question: '下列句子中没有语病的一项是：', options: ['A. 通过活动，使我明白', 'B. 态度端正，成绩提高', 'C. 打扫教室卫生', 'D. 改进方法，增加效率'], correctAnswer: 1, analysis: 'B项无语病。' },
      { id: 'bc002', type: 'correction', question: '"增加效率"的错误类型是：', options: ['A. 语序不当', 'B. 搭配不当', 'C. 成分残缺', 'D. 表意不明'], correctAnswer: 1, analysis: '"增加"与"效率"搭配不当。' },
      { id: 'bc003', type: 'correction', question: '下列句子中有语病的一项是：', options: ['A. 北京秋天美丽', 'B. 文章观点深刻', 'C. 穿着上衣戴帽子', 'D. 养成学习习惯'], correctAnswer: 2, analysis: 'C项搭配不当。' },
      { id: 'bc004', type: 'correction', question: '"通过学习，使我受益"病因是：', options: ['A. 成分残缺', 'B. 搭配不当', 'C. 语序不当', 'D. 结构混乱'], correctAnswer: 0, analysis: '滥用介词导致主语缺失。' },
      { id: 'bc005', type: 'correction', question: '下列没有语病的一项是：', options: ['A. 文章对我有兴趣', 'B. 我对文章有兴趣', 'C. 文章引起兴趣', 'D. 文章让我感兴趣'], correctAnswer: 2, analysis: 'C项无语病。' },
      // 古诗词题
      { id: 'gs001', type: 'literature', question: '"采菊东篱下，悠然见南山"出自谁：', options: ['A. 李白', 'B. 杜甫', 'C. 陶渊明', 'D. 王维'], correctAnswer: 2, analysis: '陶渊明《饮酒》。' },
      { id: 'gs002', type: 'literature', question: '"海内存知己，天涯若比邻"出自：', options: ['A. 王勃', 'B. 李白', 'C. 王维', 'D. 杜甫'], correctAnswer: 0, analysis: '王勃《送杜少府之任蜀州》。' },
      { id: 'gs003', type: 'literature', question: '"春眠不觉晓"下一句是：', options: ['A. 花落知多少', 'B. 处处闻啼鸟', 'C. 夜来风雨声', 'D. 江清月近人'], correctAnswer: 1, analysis: '"春眠不觉晓，处处闻啼鸟"。' },
      { id: 'gs004', type: 'literature', question: '"但愿人长久"下一句是：', options: ['A. 千里共婵娟', 'B. 明月几时有', 'C. 把酒问青天', 'D. 何似在人间'], correctAnswer: 0, analysis: '"但愿人长久，千里共婵娟"。' },
      { id: 'gs005', type: 'literature', question: '"会当凌绝顶"下一句是：', options: ['A. 一览众山小', 'B. 造化钟神秀', 'C. 决眦入归鸟', 'D. 荡胸生层云'], correctAnswer: 0, analysis: '"会当凌绝顶，一览众山小"。' }
    ]

    // 扩展题目 - 参考k12_md中的题型生成更多题目
    const extendedQuestions = generateExtendedQuestions()
    ALL_QUESTIONS = [...baseQuestions, ...extendedQuestions]
  }
  return ALL_QUESTIONS
}

// 生成扩展题目（模拟从question.js中的1000道题抽取）
const generateExtendedQuestions = () => {
  const questions = []
  let id = 100

  // 多音字题目
  const polyphones = [
    { char: '宿', words: ['宿舍', '星宿', '保留'], readings: ['sù', 'xiù', 'xiǔ'] },
    { char: '舍', words: ['宿舍', '舍弃', '施舍'], readings: ['shè', 'shě', 'shě'] },
    { char: '强', words: ['坚强', '倔强', '强迫'], readings: ['qiáng', 'jiàng', 'qiǎng'] },
    { char: '参', words: ['参加', '人参', '参差'], readings: ['cān', 'shēn', 'cēn'] },
    { char: '薄', words: ['薄弱', '薄荷', '薄雾'], readings: ['bó', 'bò', 'báo'] },
    { char: '模', words: ['模范', '模样', '模具'], readings: ['mó', 'mú', 'mú'] },
    { char: '咽', words: ['咽喉', '吞咽', '呜咽'], readings: ['yān', 'yàn', 'yè'] },
    { char: '泊', words: ['停泊', '湖泊', '漂泊'], readings: ['bó', 'pō', 'bó'] },
    { char: '角', words: ['角色', '口角', '角逐'], readings: ['jué', 'jiǎo', 'jué'] },
    { char: '盛', words: ['盛大', '盛饭', '盛满'], readings: ['shèng', 'chéng', 'chéng'] }
  ]

  polyphones.forEach(p => {
    questions.push({
      id: `py${id++}`,
      type: 'pinyin',
      question: `"${p.char}"在"${p.words[1]}"中读：`,
      options: [`A. ${p.readings[0]}`, `B. ${p.readings[1]}`, `C. ${p.readings[2]}`, `D. ${p.readings[0]}`],
      correctAnswer: 1,
      analysis: `"${p.char}"在"${p.words[1]}"中读${p.readings[1]}。`
    })
  })

  // 成语题目
  const idioms = [
    { name: '画龙点睛', meaning: '比喻在关键处加上一笔，使内容更生动传神' },
    { name: '锦上添花', meaning: '比喻好上加好，美上加美' },
    { name: '雪中送炭', meaning: '比喻在急需时给以物质上或精神上的帮助' },
    { name: '纸上谈兵', meaning: '比喻空谈理论，不能解决实际问题' },
    { name: '刻舟求剑', meaning: '比喻拘泥成法，不知道变通' },
    { name: '南辕北辙', meaning: '比喻行动和目的正好相反' },
    { name: '一鸣惊人', meaning: '比喻平时没有特殊表现，一做起来就有惊人的成绩' },
    { name: '三顾茅庐', meaning: '比喻诚心诚意地邀请人家' },
    { name: '负荆请罪', meaning: '表示向人认错赔罪' },
    { name: '完璧归赵', meaning: '比喻把物品完好地归还给物品的主人' },
    { name: '程门立雪', meaning: '形容尊师重道，虔诚求教' },
    { name: '闻鸡起舞', meaning: '比喻有志报国的人及时奋起' },
    { name: '入木三分', meaning: '形容书法极有笔力，现多比喻分析问题很深刻' },
    { name: '望洋兴叹', meaning: '比喻做事时因力不胜任或没有条件而感到无可奈何' },
    { name: '叶公好龙', meaning: '比喻口头上说爱好某事物，实际上并不真爱好' },
    { name: '黔驴技穷', meaning: '比喻有限的一点本领也已经用完了' },
    { name: '杞人忧天', meaning: '比喻不必要的或缺乏根据的忧虑和担心' },
    { name: '杯弓蛇影', meaning: '比喻因疑神疑鬼而引起恐惧' },
    { name: '对牛弹琴', meaning: '比喻对不讲道理的人讲道理' },
    { name: '指鹿为马', meaning: '比喻故意颠倒黑白，混淆是非' }
  ]

  idioms.forEach(i => {
    // 生成混淆选项
    const wrongOptions = idioms
      .filter(x => x.name !== i.name)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(x => x.meaning)

    // 打乱选项顺序
    const allOptions = [i.meaning, ...wrongOptions].sort(() => Math.random() - 0.5)
    const correctIndex = allOptions.indexOf(i.meaning)

    questions.push({
      id: `cy${id++}`,
      type: 'idiom',
      question: `"${i.name}"的意思是：`,
      options: allOptions.map((opt, idx) => `ABCD`[idx] + `. ${opt}`),
      correctAnswer: correctIndex,
      analysis: i.meaning
    })
  })

  // 词汇题目
  const vocabWords = [
    { word: '焕然一新', error: '换然一新' },
    { word: '谈笑风生', error: '谈笑风声' },
    { word: '迫在眉睫', error: '迫在眉捷' },
    { word: '再接再厉', error: '再接再励' },
    { word: '相得益彰', error: '相得益章' },
    { word: '流连忘返', error: '留连忘返' },
    { word: '震耳欲聋', error: '振耳欲聋' },
    { word: '郑重其事', error: '郑重其是' },
    { word: '漫不经心', error: '慢不经心' },
    { word: '惊慌失措', error: '惊慌失错' },
    { word: '别出心裁', error: '别出新裁' },
    { word: '历历在目', error: '历历在木' },
    { word: '络绎不绝', error: '落绎不绝' },
    { word: '随声附和', error: '随声附合' },
    { word: '因地制宜', error: '因至制宜' },
    { word: '鳞次栉比', error: '鳞次栉此' },
    { word: '抑扬顿挫', error: '抑扬顿措' },
    { word: '相濡以沫', error: '相儒以沫' },
    { word: '不可思议', error: '不可思义' },
    { word: '姹紫嫣红', error: '诧紫嫣红' }
  ]

  vocabWords.forEach((v, idx) => {
    // 生成混淆选项
    const wrongOptions = vocabWords
      .filter((x, i) => i !== idx)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(x => x.word)

    // 打乱选项顺序
    const allOptions = [v.word, v.error, ...wrongOptions.slice(0, 2)].sort(() => Math.random() - 0.5)
    const correctIndex = allOptions.indexOf(v.word)

    questions.push({
      id: `vo${id++}`,
      type: 'vocabulary',
      question: '下列词语中没有错别字的一项是：',
      options: allOptions.map((opt, i) => `ABCD`[i] + `. ${opt}`),
      correctAnswer: correctIndex,
      analysis: `${`ABCD`[correctIndex]}项"${v.word}"正确。`
    })
  })

  // 病句题目
  const errorTypes = [
    { type: '成分残缺', example: '通过学习，使我受益' },
    { type: '搭配不当', example: '增加效率' },
    { type: '语序不当', example: '博物馆展出了两千多年前新出土的文物' },
    { type: '句式杂糅', example: '这本书的作者是鲁迅写的' },
    { type: '表意不明', example: '两个学校的老师都来了' },
    { type: '否定失当', example: '防止不要发生事故' },
    { type: '成分赘余', example: '大约10个左右' },
    { type: '主客颠倒', example: '这篇文章对我很感兴趣' }
  ]

  errorTypes.forEach((e, idx) => {
    // 生成混淆选项
    const wrongOptions = errorTypes
      .filter((x, i) => i !== idx)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(x => x.type)

    // 打乱选项顺序
    const allOptions = [e.type, ...wrongOptions].sort(() => Math.random() - 0.5)
    const correctIndex = allOptions.indexOf(e.type)

    questions.push({
      id: `bc${id++}`,
      type: 'correction',
      question: `"${e.example}"的病因是：`,
      options: allOptions.map((opt, i) => `ABCD`[i] + `. ${opt}`),
      correctAnswer: correctIndex,
      analysis: `${e.type}。`
    })
  })

  // 古诗词题目
  const poems = [
    { q: '国破山河在', a: '城春草木深', author: '杜甫', title: '春望' },
    { q: '感时花溅泪', a: '恨别鸟惊心', author: '杜甫', title: '春望' },
    { q: '烽火连三月', a: '家书抵万金', author: '杜甫', title: '春望' },
    { q: '白日依山尽', a: '黄河入海流', author: '王之涣', title: '登鹳雀楼' },
    { q: '欲穷千里目', a: '更上一层楼', author: '王之涣', title: '登鹳雀楼' },
    { q: '床前明月光', a: '疑是地上霜', author: '李白', title: '静夜思' },
    { q: '举头望明月', a: '低头思故乡', author: '李白', title: '静夜思' },
    { q: '孤帆远影碧空尽', a: '唯见长江天际流', author: '李白', title: '黄鹤楼送孟浩然之广陵' },
    { q: '劝君更尽一杯酒', a: '西出阳关无故人', author: '王维', title: '送元二使安西' },
    { q: '桃花潭水深千尺', a: '不及汪伦送我情', author: '李白', title: '赠汪伦' },
    { q: '莫愁前路无知己', a: '天下谁人不识君', author: '高适', title: '别董大' },
    { q: '夜来风雨声', a: '花落知多少', author: '孟浩然', title: '春晓' },
    { q: '明月几时有', a: '把酒问青天', author: '苏轼', title: '水调歌头' },
    { q: '我欲乘风归去', a: '又恐琼楼玉宇', author: '苏轼', title: '水调歌头' },
    { q: '人有悲欢离合', a: '月有阴晴圆缺', author: '苏轼', title: '水调歌头' }
  ]

  poems.forEach((p, idx) => {
    // 生成混淆选项
    const wrongOptions = poems
      .filter((x, i) => i !== idx)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(x => x.a)

    // 打乱选项顺序
    const allOptions = [p.a, ...wrongOptions].sort(() => Math.random() - 0.5)
    const correctIndex = allOptions.indexOf(p.a)

    questions.push({
      id: `gs${id++}`,
      type: 'literature',
      question: `"${p.q}"下一句是：`,
      options: allOptions.map((opt, i) => `ABCD`[i] + `. ${opt}`),
      correctAnswer: correctIndex,
      analysis: `${p.author}《${p.title}》。`
    })
  })

  return questions
}

function MockExam() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(120 * 60) // 120分钟
  const [showResult, setShowResult] = useState(false)
  const [showCard, setShowCard] = useState(false)
  const [examStarted, setExamStarted] = useState(false)
  const [timerId, setTimerId] = useState(null)

  // 使用 useDidShow 确保题目在页面显示时加载
  useDidShow(() => {
    loadQuestions()
  })

  // 启用页面分享
  useShareAppMessage(() => {
    return pageShareConfigs.home
  })

  // 启用朋友圈分享
  useShareTimeline(() => {
    return {
      title: pageShareConfigs.home.title,
      query: ''
    }
  })

  const loadQuestions = async () => {
    setLoading(true)

    try {
      // 从数据库随机抽取50道题目
      const questions = await questionService.getRandomQuestions(50)

      if (questions && questions.length > 0) {
        console.log('从数据库加载模拟考试题目数量:', questions.length)

        // 将数据库题目格式转换为页面需要的格式
        const examQuestions = questions.map((q) => ({
          id: q._id || q.id,
          type: q.type,
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          analysis: q.explanation || ''
        }))

        setQuestions(examQuestions)
        setLoading(false)
      } else {
        // 如果数据库没有题目，使用本地备用题目
        console.log('数据库暂无题目，使用本地备用题目')
        loadLocalQuestions()
      }
    } catch (err) {
      console.error('从数据库加载题目失败，使用本地备用题目:', err)
      loadLocalQuestions()
    }
  }

  // 本地备用题目加载函数
  const loadLocalQuestions = () => {
    const allQuestions = initQuestions()

    // Fisher-Yates 洗牌算法打乱顺序
    const shuffled = [...allQuestions]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    const examQuestions = shuffled.slice(0, 50)
    console.log('使用本地备用题目数量:', examQuestions.length)
    setQuestions(examQuestions)
    setLoading(false)
  }

  const startExam = () => {
    setExamStarted(true)
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    setTimerId(timer)
  }

  useEffect(() => {
    return () => {
      if (timerId) clearInterval(timerId)
    }
  }, [timerId])

  // 加载中
  if (loading) {
    return (
      <View className="mock-exam-page">
        <View className="exam-loading">
          <Text className="loading-text">正在加载试卷...</Text>
        </View>
      </View>
    )
  }

  // 准备开始页面
  if (!examStarted) {
    return (
      <View className="mock-exam-page">
        <ScrollView scrollY className="content-scroll">
          <View className="exam-intro">
            <Text className="intro-title">模拟考试</Text>
            <View className="intro-info">
              <View className="info-item">
                <Text className="info-label">题目数量</Text>
                <Text className="info-value">{questions.length} 题</Text>
              </View>
              <View className="info-item">
                <Text className="info-label">考试时长</Text>
                <Text className="info-value">120 分钟</Text>
              </View>
              <View className="info-item">
                <Text className="info-label">总分</Text>
                <Text className="info-value">100 分</Text>
              </View>
            </View>
            <View className="intro-tips">
              <Text className="tips-title">考试须知：</Text>
              <Text className="tips-item">• 考试开始后倒计时自动启动</Text>
              <Text className="tips-item">• 答题完成后可交卷</Text>
              <Text className="tips-item">• 超时自动交卷</Text>
            </View>
            <View className="start-btn" onClick={startExam}>
              开始考试
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswer = (value) => {
    const questionId = questions[currentIndex]?.id
    if (!questionId) return
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const jumpTo = (index) => {
    setCurrentIndex(index)
    setShowCard(false)
  }

  const handleSubmit = async (force = false) => {
    // 检查未答题目
    const answeredCount = Object.keys(answers).length
    const unansweredCount = questions.length - answeredCount
    
    if (unansweredCount > 0 && !force) {
      Taro.showModal({
        title: '确认交卷',
        content: `你还有 ${unansweredCount} 道题未作答，确定要交卷吗？`,
        confirmText: '仍要交卷',
        cancelText: '继续答题',
        success: (res) => {
          if (res.confirm) {
            handleSubmit(true)
          }
        }
      })
      return
    }
    
    if (timerId) clearInterval(timerId)

    // 计算分数并保存数据
    const correctCount = questions.filter(q => answers[q.id] === q.correctAnswer).length
    const score = Math.round((correctCount / questions.length) * 100)

    // 保存学习记录到 study_records
    try {
      await studyService.addRecord({
        type: 'mock_exam',
        title: '模拟考试',
        score: score,
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        duration: Math.round((7200 - timeLeft) / 60) // 120分钟 = 7200秒
      })

      // 触发统计更新事件（实现实时刷新）
      eventBus.emit(EVENTS.STUDY_RECORD_UPDATED, {
        type: 'mock_exam',
        score: score,
        correctCount: correctCount,
        totalCount: questions.length
      })
    } catch (err) {
      console.error('保存学习记录失败:', err)
    }

    // 保存答题记录到 answer_history（包含 isCorrect 和 questionType）
    try {
      const answerData = questions.map(q => {
        const userAnswer = answers[q.id]
        const isCorrect = userAnswer === q.correctAnswer
        return {
          questionId: q.id,
          answer: userAnswer,
          isCorrect,
          questionType: q.type
        }
      })
      await Taro.cloud.callFunction({
        name: 'question',
        data: {
          action: 'submitBatch',
          answers: answerData
        }
      })
    } catch (err) {
      console.error('保存答题历史失败:', err)
    }

    setShowResult(true)
  }

  const getAnswerStatus = (index) => {
    const q = questions[index]
    if (answers[q.id] === undefined) return 'unanswered'
    return 'answered'
  }

  // 结果页面
  if (showResult) {
    // 正确计算答对、答错、未答数量
    const correctCount = questions.filter(q => answers[q.id] === q.correctAnswer).length
    const wrongCount = questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== q.correctAnswer).length
    const unansweredCount = questions.length - correctCount - wrongCount
    const score = Math.round((correctCount / questions.length) * 100)

    // 跳转到解析页面
    const handleViewAnalysis = () => {
      const resultData = {
        questions: questions,
        answers: answers,
        score: score
      }
      Taro.navigateTo({
        url: `/pages/exam-result/index?data=${JSON.stringify(resultData)}`
      })
    }

    return (
      <View className="exam-result">
        <View className="result-header">
          <Text className="result-score">{score}</Text>
          <Text className="result-text">分</Text>
        </View>
        <View className="result-stats">
          <View className="stat-item">
            <Text className="stat-value">{correctCount}</Text>
            <Text className="stat-label">答对</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{wrongCount}</Text>
            <Text className="stat-label">答错</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{unansweredCount}</Text>
            <Text className="stat-label">未答</Text>
          </View>
        </View>
        <View className="result-actions">
          <View className="action-btn" onClick={navigateBack}>返回</View>
          <View className="action-btn primary" onClick={handleViewAnalysis}>查看解析</View>
        </View>
      </View>
    )
  }

  // 答题页面
  return (
    <View className="mock-exam-page">
      {/* 顶部栏 */}
      <View className="exam-header">
        <Text className="time-display">{formatTime(timeLeft)}</Text>
        <View className="header-actions">
          <View className="action-item" onClick={() => setShowCard(!showCard)}>
            <Text className="action-icon">📋</Text>
            <Text className="action-text">答题卡</Text>
          </View>
        </View>
      </View>

      {/* 答题卡 */}
      {showCard && (
        <View className="answer-card">
          <View className="card-header">
            <Text className="card-title">答题卡</Text>
            <Text className="card-close" onClick={() => setShowCard(false)}>×</Text>
          </View>
          <View className="card-grid">
            {questions.map((q, index) => (
              <View
                key={q.id}
                className={`card-item ${getAnswerStatus(index)} ${index === currentIndex ? 'current' : ''}`}
                onClick={() => jumpTo(index)}
              >
                {index + 1}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 题目 */}
      <ScrollView scrollY className="content-scroll">
        <View className="question-content">
          <View className="question-header">
            <Text className="question-num">第 {currentIndex + 1} 题</Text>
            <Text className="question-type">单选题</Text>
          </View>

          <Text className="question-text">
            {questions[currentIndex]?.question}
          </Text>

          <View className="options-list">
            {questions[currentIndex]?.options?.map((option, index) => (
              <View
                key={index}
                className={`option-item ${answers[questions[currentIndex]?.id] === index ? 'selected' : ''}`}
                onClick={() => handleAnswer(index)}
              >
                <View className="option-radio">
                  {answers[questions[currentIndex]?.id] === index && <View className="radio-dot" />}
                </View>
                <Text className="option-text">{option}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 底部导航 */}
      <View className="exam-footer">
        <View
          className={`nav-btn ${currentIndex === 0 ? 'disabled' : ''}`}
          onClick={handlePrev}
        >
          上一题
        </View>
        <View className="progress-text">
          {currentIndex + 1} / {questions.length}
        </View>
        <View
          className={`nav-btn ${currentIndex === questions.length - 1 ? 'submit' : ''}`}
          onClick={currentIndex === questions.length - 1 ? handleSubmit : handleNext}
        >
          {currentIndex === questions.length - 1 ? '交卷' : '下一题'}
        </View>
      </View>
    </View>
  )
}

export default MockExam
