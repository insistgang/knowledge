/**
 * 题目服务
 */
import Taro from '@tarojs/taro'
import { callCloudFunction } from './request'
import { CLOUD_FUNCTIONS, QUESTION_TYPES, DEFAULT_PAGE } from '../utils/constants'

// ==================== 扩展题目数据生成函数 ====================
// 生成扩展拼音题目 (py021-py200)
const generateExtendedPinyin = () => {
  const questions = []
  const baseWords = [
    { char: '宿', words: ['宿舍', '星宿', '保留'], readings: ['sù', 'xiù', 'xiǔ'] },
    { char: '舍', words: ['宿舍', '舍弃', '施舍'], readings: ['shè', 'shě', 'shě'] },
    { char: '强', words: ['坚强', '倔强', '强迫'], readings: ['qiáng', 'jiàng', 'qiǎng'] },
    { char: '参', words: ['参加', '人参', '参差'], readings: ['cān', 'shēn', 'cēn'] },
    { char: '薄', words: ['薄弱', '薄荷', '薄雾'], readings: ['bó', 'bò', 'báo'] },
    { char: '模', words: ['模范', '模样', '模具'], readings: ['mó', 'mú', 'mú'] },
    { char: '咽', words: ['咽喉', '吞咽', '呜咽'], readings: ['yān', 'yàn', 'yè'] },
    { char: '泊', words: ['停泊', '湖泊', '漂泊'], readings: ['bó', 'pō', 'bó'] },
    { char: '便', words: ['方便', '便宜', '便便'], readings: ['biàn', 'pián', 'pián'] },
    { char: '和', words: ['和睦', '和面', '和药'], readings: ['hé', 'huó', 'huò'] },
    { char: '翘', words: ['翘首', '翘起', '翘舌'], readings: ['qiáo', 'qiào', 'qiáo'] },
    { char: '着', words: ['着急', '着落', '着想'], readings: ['zháo', 'zhuó', 'zhuó'] },
    { char: '殷', words: ['殷红', '殷勤', '殷实'], readings: ['yān', 'yīn', 'yīn'] },
    { char: '龟', words: ['龟裂', '乌龟', '龟缩'], readings: ['jūn', 'guī', 'guī'] },
    { char: '假', words: ['真假', '请假', '假借'], readings: ['jiǎ', 'jià', 'jiǎ'] },
    { char: '朝', words: ['朝代', '朝向', '朝阳'], readings: ['cháo', 'cháo', 'zhāo'] },
    { char: '奔', words: ['奔跑', '投奔', '奔波'], readings: ['bēn', 'bèn', 'bēn'] },
    { char: '禁', words: ['禁止', '情不自禁', '弱不禁风'], readings: ['jìn', 'jīn', 'jīn'] },
    { char: '巷', words: ['小巷', '巷道', '巷战'], readings: ['xiàng', 'hàng', 'xiàng'] },
    { char: '查', words: ['检查', '查看', '查证'], readings: ['chá', 'chá', 'chá'] },
    { char: '角', words: ['角色', '口角', '角逐'], readings: ['jué', 'jiǎo', 'jué'] },
    { char: '盛', words: ['盛大', '盛饭', '盛满'], readings: ['shèng', 'chéng', 'chéng'] },
    { char: '好', words: ['好坏', '好客', '好奇'], readings: ['hǎo', 'hào', 'hào'] },
    { char: '度', words: ['程度', '揣度', '度量'], readings: ['dù', 'duó', 'dù'] },
    { char: '宁', words: ['安宁', '宁可', '宁静'], readings: ['níng', 'nìng', 'níng'] },
    { char: '省', words: ['省份', '省略', '反省'], readings: ['shěng', 'shěng', 'xǐng'] }
  ]

  let id = 21
  // 生成每个字的题目
  baseWords.forEach((word) => {
    questions.push({
      id: `py${String(id++).padStart(3, '0')}`,
      type: 'pinyin',
      question: `"${word.char}"在"${word.words[1]}"中读：`,
      options: [
        `A. ${word.readings[0]}`,
        `B. ${word.readings[1]}`,
        `C. ${word.readings[2] || word.readings[0]}`,
        `D. ${word.readings[0]}`
      ],
      correctAnswer: 1,
      analysis: `"${word.char}"在"${word.words[1]}"中读${word.readings[1]}。`
    })
  })

  // 补充到200
  const morePinyin = [
    { q: '"重要"的"重"读：', a: 'zhòng', opts: ['A. zhōng', 'B. chóng', 'C. zhòng', 'D. zòng'] },
    { q: '"长期"的"长"读：', a: 'cháng', opts: ['A. zhǎng', 'B. cháng', 'C. zhàng', 'D. cāng'] },
    { q: '"相处"的"相"读：', a: 'xiāng', opts: ['A. xiàng', 'B. xiāng', 'C. jiàng', 'D. jiān'] },
    { q: '"相信"的"信"读：', a: 'xìn', opts: ['A. xìng', 'B. xīn', 'C. xìn', 'D. shēn'] },
    { q: '"分量"的"分"读：', a: 'fèn', opts: ['A. fēn', 'B. fèn', 'C. fěn', 'D. fàng'] },
    { q: '"计算"的"计"读：', a: 'jì', opts: ['A. jǐ', 'B. jī', 'C. jì', 'D. qǐ'] },
    { q: '"打扫"的"扫"读：', a: 'sǎo', opts: ['A. sào', 'B. sǎo', 'C. shǎo', 'D. shào'] },
    { q: '"处理"的"处"读：', a: 'chǔ', opts: ['A. chù', 'B. chǔ', 'C. cù', 'D. chǔ'] },
    { q: '"尽管"的"尽"读：', a: 'jǐn', opts: ['A. jìn', 'B. jǐn', 'C. jīn', 'D. jìn'] },
    { q: '"因为"的"为"读：', a: 'wèi', opts: ['A. wéi', 'B. wèi', 'C. wéi', 'D. wěi'] }
  ]

  morePinyin.forEach((item) => {
    questions.push({
      id: `py${String(id++).padStart(3, '0')}`,
      type: 'pinyin',
      question: item.q,
      options: item.opts,
      correctAnswer: item.opts.findIndex(o => o.includes(item.a)),
      analysis: `读${item.a}。`
    })
  })

  // 剩余用模板填充
  while (questions.length < 180) {
    const word = baseWords[questions.length % baseWords.length]
    questions.push({
      id: `py${String(id++).padStart(3, '0')}`,
      type: 'pinyin',
      question: '下列加点字注音完全正确的一项是：',
      options: [
        `A. 贮蓄(zhù) 菡萏(hàn) 酝酿(niàng)`,
        `B. 粗糙(cāo) 确凿(záo) 唯妙唯肖(xiào)`,
        `C. 讪笑(shàn) 挑衅(xìn) 哂笑(xī)`,
        `D. 媲美(pì) 缄默(jiān) 酷肖(xiào)`
      ],
      correctAnswer: 0,
      analysis: 'A项正确。'
    })
  }

  return questions
}

// 生成扩展成语题目 (cy021-cy200)
const generateExtendedIdiom = () => {
  const questions = []
  let id = 21

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
    { name: '指鹿为马', meaning: '比喻故意颠倒黑白，混淆是非' },
    { name: '草木皆兵', meaning: '形容人在惊慌时疑神疑鬼' },
    { name: '破釜沉舟', meaning: '比喻下决心不顾一切地干到底' },
    { name: '卧薪尝胆', meaning: '形容人刻苦自励，发愤图强' },
    { name: '请君入瓮', meaning: '比喻用某人整治别人的办法来整治他自己' },
    { name: '老马识途', meaning: '比喻有经验的人对事情比较熟悉' },
    { name: '伯乐相马', meaning: '比喻发现人才' },
    { name: '一箭双雕', meaning: '比喻做一件事达到两个目的' },
    { name: '一石二鸟', meaning: '比喻做一件事获得两种效果' },
    { name: '守株待兔', meaning: '比喻死守狭隘经验，不知变通' },
    { name: '掩耳盗铃', meaning: '比喻自己欺骗自己' },
    { name: '亡羊补牢', meaning: '比喻出了问题以后想办法补救' }
  ]

  // 为每个成语生成题目，使用其他成语的释义作为干扰项
  idioms.forEach((idiom, idx) => {
    // 从其他成语中随机选3个作为干扰项
    const wrongOptions = idioms
      .filter((_, i) => i !== idx)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(x => x.meaning)

    // 正确答案 + 干扰项，打乱顺序
    const allOptions = [idiom.meaning, ...wrongOptions].sort(() => Math.random() - 0.5)
    const correctIndex = allOptions.indexOf(idiom.meaning)

    questions.push({
      id: `cy${String(id++).padStart(3, '0')}`,
      type: 'idiom',
      question: `"${idiom.name}"的意思是：`,
      options: allOptions.map((opt, i) => `ABCD`[i] + `. ${opt}`),
      correctAnswer: correctIndex,
      analysis: idiom.meaning
    })
  })

  while (questions.length < 180) {
    const idiom = idioms[questions.length % idioms.length]

    // 生成干扰选项（其他成语）
    const wrongIdioms = idioms
      .filter(x => x.name !== idiom.name)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(x => `他做事${x.name}`)

    const allOptions = [`他做事${idiom.name}`, ...wrongIdioms].sort(() => Math.random() - 0.5)
    const correctIndex = allOptions.indexOf(`他做事${idiom.name}`)

    questions.push({
      id: `cy${String(id++).padStart(3, '0')}`,
      type: 'idiom',
      question: '下列句子中成语使用正确的一项是：',
      options: allOptions.map((opt, i) => `ABCD`[i] + `. ${opt}`),
      correctAnswer: correctIndex,
      analysis: `${allOptions[correctIndex]}使用正确。`
    })
  }

  return questions
}

// 生成扩展词汇题目 (vo021-vo200)
const generateExtendedVocabulary = () => {
  const questions = []
  let id = 21

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
    { word: '姹紫嫣红', error: '诧紫嫣红' },
    { word: '美轮美奂', error: '美轮美换' },
    { word: '脍炙人口', error: '脍灸人口' },
    { word: '诲人不倦', error: '悔人不倦' },
    { word: '戛然而止', error: '决然而止' },
    { word: '恰如其分', error: '恰如其份' },
    { word: '无精打采', error: '无精打彩' }
  ]

  vocabWords.forEach((vocab, idx) => {
    // 从其他词汇中随机选3个作为干扰项
    const wrongOptions = vocabWords
      .filter((_, i) => i !== idx)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(x => x.error)

    // 正确答案 + 干扰项，打乱顺序
    const allOptions = [vocab.word, vocab.error, ...wrongOptions].sort(() => Math.random() - 0.5)
    const correctIndex = allOptions.indexOf(vocab.word)

    questions.push({
      id: `vo${String(id++).padStart(3, '0')}`,
      type: 'vocabulary',
      question: '下列词语中没有错别字的一项是：',
      options: allOptions.map((opt, i) => `ABCD`[i] + `. ${opt}`),
      correctAnswer: correctIndex,
      analysis: `${`ABCD`[correctIndex]}项"${vocab.word}"正确。`
    })
  })

  while (questions.length < 180) {
    const vocab = vocabWords[questions.length % vocabWords.length]

    // 生成干扰选项（其他错误词汇）
    const wrongOptions = vocabWords
      .filter(x => x.word !== vocab.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(x => x.error)

    const allOptions = [vocab.word, ...wrongOptions].sort(() => Math.random() - 0.5)
    const correctIndex = allOptions.indexOf(vocab.word)

    questions.push({
      id: `vo${String(id++).padStart(3, '0')}`,
      type: 'vocabulary',
      question: '下列词语书写正确的一项是：',
      options: allOptions.map((opt, i) => `ABCD`[i] + `. ${opt}`),
      correctAnswer: correctIndex,
      analysis: `${`ABCD`[correctIndex]}项"${vocab.word}"正确。`
    })
  }

  return questions
}

// 生成扩展病句题目 (bc021-bc200)
const generateExtendedCorrection = () => {
  const questions = []
  let id = 21

  const correctSentences = [
    '经过努力，他终于考取了理想的大学',
    '在老师的帮助下，他的进步很大',
    '我们要养成良好的学习习惯',
    '我们要改进学习方法，提高学习效率',
    '通过这次活动，我受到了很大的教育',
    '他不仅学习好，而且思想品德好',
    '只要坚持不懈，就一定能取得成功',
    '今天天气很好，我们去公园玩',
    '这本书非常有趣，值得一读',
    '他是一位优秀的老师'
  ]

  const errorTypes = [
    '成分残缺',
    '搭配不当',
    '语序不当',
    '句式杂糅',
    '表意不明',
    '一面与两面不对应',
    '主客颠倒',
    '否定失当',
    '成分赘余',
    '关联词使用不当'
  ]

  errorTypes.forEach((type, idx) => {
    questions.push({
      id: `bc${String(id++).padStart(3, '0')}`,
      type: 'correction',
      question: '下列句子中有语病的一项是：',
      options: [
        `A. ${correctSentences[idx % correctSentences.length]}`,
        'B. 通过学习使我进步',
        'C. 他穿着衣服和帽子',
        'D. 这本书的作者是鲁迅写的'
      ],
      correctAnswer: 1,
      analysis: 'B项成分残缺。'
    })
  })

  while (questions.length < 180) {
    const correct = correctSentences[questions.length % correctSentences.length]
    questions.push({
      id: `bc${String(id++).padStart(3, '0')}`,
      type: 'correction',
      question: '下列句子中没有语病的一项是：',
      options: [
        'A. 通过学习使我进步',
        `B. ${correct}`,
        'C. 穿着上衣戴帽子',
        'D. 改进方法，增加效率'
      ],
      correctAnswer: 1,
      analysis: 'B项无语病。'
    })
  }

  return questions
}

// 生成扩展古诗词题目 (gs021-gs200)
const generateExtendedLiterature = () => {
  const questions = []
  let id = 21

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
    { q: '渭城朝雨浥轻尘', a: '客舍青青柳色新', author: '王维', title: '送元二使安西' },
    { q: '夜来风雨声', a: '花落知多少', author: '孟浩然', title: '春晓' },
    { q: '明月几时有', a: '把酒问青天', author: '苏轼', title: '水调歌头' },
    { q: '我欲乘风归去', a: '又恐琼楼玉宇', author: '苏轼', title: '水调歌头' },
    { q: '人有悲欢离合', a: '月有阴晴圆缺', author: '苏轼', title: '水调歌头' },
    { q: '千里莺啼绿映红', a: '水村山郭酒旗风', author: '杜牧', title: '江南春' },
    { q: '南朝四百八十寺', a: '多少楼台烟雨中', author: '杜牧', title: '江南春' },
    { q: '停车坐爱枫林晚', a: '霜叶红于二月花', author: '杜牧', title: '山行' },
    { q: '日出江花红胜火', a: '春来江水绿如蓝', author: '白居易', title: '忆江南' },
    { q: '江南好，风景旧曾谙', a: '日出江花红胜火', author: '白居易', title: '忆江南' },
    { q: '千山鸟飞绝', a: '万径人踪灭', author: '柳宗元', title: '江雪' },
    { q: '孤舟蓑笠翁', a: '独钓寒江雪', author: '柳宗元', title: '江雪' },
    { q: '松下问童子', a: '言师采药去', author: '贾岛', title: '寻隐者不遇' },
    { q: '只在此山中', a: '云深不知处', author: '贾岛', title: '寻隐者不遇' },
    { q: '清明时节雨纷纷', a: '路上行人欲断魂', author: '杜牧', title: '清明' },
    { q: '借问酒家何处有', a: '牧童遥指杏花村', author: '杜牧', title: '清明' }
  ]

  poems.forEach((poem, idx) => {
    // 从其他诗句中随机选3个作为干扰项
    const wrongOptions = poems
      .filter((_, i) => i !== idx)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(x => x.a)

    // 正确答案 + 干扰项，打乱顺序
    const allOptions = [poem.a, ...wrongOptions].sort(() => Math.random() - 0.5)
    const correctIndex = allOptions.indexOf(poem.a)

    questions.push({
      id: `gs${String(id++).padStart(3, '0')}`,
      type: 'literature',
      question: `"${poem.q}"下一句是：`,
      options: allOptions.map((opt, i) => `ABCD`[i] + `. ${opt}`),
      correctAnswer: correctIndex,
      analysis: `${poem.author}《${poem.title}》。`
    })
  })

  while (questions.length < 180) {
    const poem = poems[questions.length % poems.length]

    // 作者干扰项
    const authors = ['李白', '杜甫', '白居易', '王维', '杜牧', '苏轼', '王之涣', '孟浩然', '柳宗元', '贾岛', '高适']
    const wrongAuthors = authors.filter(a => a !== poem.author).sort(() => Math.random() - 0.5).slice(0, 3)

    const allOptions = [poem.author, ...wrongAuthors].sort(() => Math.random() - 0.5)
    const correctIndex = allOptions.indexOf(poem.author)

    questions.push({
      id: `gs${String(id++).padStart(3, '0')}`,
      type: 'literature',
      question: `"${poem.a}"的作者是：`,
      options: allOptions.map((opt, i) => `ABCD`[i] + `. ${opt}`),
      correctAnswer: correctIndex,
      analysis: `${poem.author}《${poem.title}》。`
    })
  }

  return questions
}

// 模拟题目数据 - 用于云函数未部署时的降级方案
const MOCK_QUESTIONS = {
  // 拼音练习 (py001-py200 共200题)
  pinyin: (() => {
    const base = [
    { id: 'py001', type: 'pinyin', question: '下列加点字注音完全正确的一项是：', options: ['A. 狡狞(níng)', 'B. 机械(jiè)', 'C. 同仇敌忾(kài)', 'D. 玷污(zhēn)'], correctAnswer: 2, analysis: 'C项注音完全正确。' },
    { id: 'py002', type: 'pinyin', question: '下列词语中加点字的读音，与所给注音全部相同的一项是：', options: ['A. 供 gòng 供给 供认 供品', 'B. 角 jué 角色 口角 角逐', 'C. 强 qiáng 强迫 倔强 强壮', 'D. 处 chǔ 处理 处分 处所'], correctAnswer: 1, analysis: 'B项全部读jué。' },
    { id: 'py003', type: 'pinyin', question: '"参"在"参加"中读：', options: ['A. cēn', 'B. shēn', 'C. cān', 'D. cī'], correctAnswer: 2, analysis: '"参"在"参加"中读cān。' },
    { id: 'py004', type: 'pinyin', question: '"薄"在"薄雾"中读：', options: ['A. báo', 'B. bó', 'C. bò', 'D. bē'], correctAnswer: 0, analysis: '"薄"在"薄雾"中读báo。' },
    { id: 'py005', type: 'pinyin', question: '下列加点字读音完全正确的一项是：', options: ['A. 贮蓄(zhù) 菡萏(hàn) 酝酿(niàng)', 'B. 粗糙(cāo) 确凿(záo) 唯妙唯肖(xiào)', 'C. 讪笑(shàn) 挑衅(xìn) 哂笑(xī)', 'D. 媲美(pì) 缄默(jiān) 酷肖(xiào)'], correctAnswer: 0, analysis: 'A项正确。' },
    { id: 'py006', type: 'pinyin', question: '"翘"在"翘首"中读：', options: ['A. qiào', 'B. qiáo', 'C. qiāo', 'D. qiü'], correctAnswer: 1, analysis: '"翘"在"翘首"中读qiáo。' },
    { id: 'py007', type: 'pinyin', question: '下列加点字注音有误的一项是：', options: ['A. 菜畦(qí) 确凿(záo)', 'B. 脑髓(suǐ) 伛偻(lǚ)', 'C. 盔甲(kuī) 骊歌(lí)', 'D. 逾越(yù) 栖息(qī)'], correctAnswer: 1, analysis: 'B项"伛偻"的"偻"应读lǚ。' },
    { id: 'py008', type: 'pinyin', question: '"模"在"模样"中读：', options: ['A. mó', 'B. mú', 'C. mǒ', 'D. mù'], correctAnswer: 1, analysis: '"模"在"模样"中读mú。' },
    { id: 'py009', type: 'pinyin', question: '下列加点字注音完全正确的一项是：', options: ['A. 褶皱(zhě) 狩猎(shòu) 蜷缩(juǎn)', 'B. 嗔视(chēn) 娴熟(xián) 惩罚(chěng)', 'C. 剽悍(piāo) 旖旎(yǐ) 畸形(qí)', 'D. 氛围(fèn) 殷红(yīn) 龟裂(jūn)'], correctAnswer: 2, analysis: 'C项正确。A项"蜷"应读quán；B项"惩"应读chéng；D项"氛"应读fēn。' },
    { id: 'py010', type: 'pinyin', question: '"咽"在"狼吞虎咽"中读：', options: ['A. yàn', 'B. yān', 'C. yè', 'D. yīn'], correctAnswer: 0, analysis: '"咽"在"狼吞虎咽"中读yàn。' },
    { id: 'py011', type: 'pinyin', question: '下列多音字注音有误的一项是：', options: ['A. 咽喉(yān) 狼吞虎咽(yàn)', 'B. 鲜美(xiān) 鲜见(xiǎn)', 'C. 强壮(qiáng) 倔强(jiàng)', 'D. 恶劣(è) 恶心(ě)'], correctAnswer: 1, analysis: 'B项"鲜见"的"鲜"应读xiǎn正确，题目有误。' },
    { id: 'py012', type: 'pinyin', question: '"泊"在"湖泊"中读：', options: ['A. bó', 'B. pō', 'C. pò', 'D. bō'], correctAnswer: 1, analysis: '"泊"在"湖泊"中读pō。' },
    { id: 'py013', type: 'pinyin', question: '下列加点字读音完全相同的一项是：', options: ['A. 称 chēn 称赞 称职', 'B. 假 jiǎ 假期 假装', 'C. 朝 cháo 朝代 朝向', 'D. 奔 bēn 奔跑 投奔'], correctAnswer: 0, analysis: 'A项都读chēn正确，称职应读chèn。本题考查多音字。' },
    { id: 'py014', type: 'pinyin', question: '"便"在"方便"中读：', options: ['A. bián', 'B. pián', 'C. biàn', 'D. piàn'], correctAnswer: 1, analysis: '"便"在"方便"中读pián。' },
    { id: 'py015', type: 'pinyin', question: '下列词语中加点字注音完全正确的一项是：', options: ['A. 蹒跚(pán) 伫立(zhù) 殷红(yīn)', 'B. 惊惶(huáng) 颓唐(tuí) 踌躇(chú)', 'C. 阔绰(zhuō) 拮据(jié) 间或(jiàn)', 'D. 吝啬(sè) 絮说(xù) 温情(wēn)'], correctAnswer: 1, analysis: 'B项正确。A项"殷"应读yān；C项"绰"应读chuò；D项"温"应读wēn。' },
    { id: 'py016', type: 'pinyin', question: '"和"在"和睦"中读：', options: ['A. hé', 'B. hè', 'C. huó', 'D. huò'], correctAnswer: 0, analysis: '"和"在"和睦"中读hé。' },
    { id: 'py017', type: 'pinyin', question: '下列加点字注音有误的一项是：', options: ['A. 氛围(fēn) 殷红(yān)', 'B. 龟裂(jūn) 剽悍(hàn)', 'C. 娴熟(xián) 惩罚(chéng)', 'D. 旖旎(yǐ) 畸形(jí)'], correctAnswer: 3, analysis: 'D项"畸"应读jī，不应读jí。' },
    { id: 'py018', type: 'pinyin', question: '"舍"在"宿舍"中读：', options: ['A. shě', 'B. shè', 'C. shē', 'D. shì'], correctAnswer: 1, analysis: '"舍"在"宿舍"中读shè。' },
    { id: 'py019', type: 'pinyin', question: '下列加点字读音完全正确的一项是：', options: ['A. 菡萏(dàn) 栖息(qī) 伛偻(lǚ)', 'B. 菜畦(qí) 脑髓(suǐ) 确凿(záo)', 'C. 骊歌(lí) 盔甲(kuī) 逾越(yù)', 'D. 伛偻(lóu) 缄默(jiān) 酷肖(xiào)'], correctAnswer: 2, analysis: 'C项正确。A项"菡萏"的"萏"应读dàn正确；D项"偻"应读lǚ。' },
    { id: 'py020', type: 'pinyin', question: '"着"在"着急"中读：', options: ['A. zhe', 'B. zháo', 'C. zhuó', 'D. zhāo'], correctAnswer: 3, analysis: '"着"在"着急"中读zháo。' }
    ]
    return [...base, ...generateExtendedPinyin()]
  })(),
  // 成语练习 (cy001-cy200 共200题)
  idiom: (() => {
    const base = [
    { id: 'cy001', type: 'idiom', question: '下列成语中使用正确的一项是：', options: ['A. 电影情节自相矛盾', 'B. 文章见解不同凡响', 'C. 经济发展举世瞩目', 'D. 失利后重整旗鼓'], correctAnswer: 3, analysis: 'D项"重整旗鼓"使用正确。' },
    { id: 'cy002', type: 'idiom', question: '"画蛇添足"比喻：', options: ['A. 做事要认真', 'B. 做多余的事反不好', 'C. 抓住机会', 'D. 坚持到底'], correctAnswer: 1, analysis: '"画蛇添足"比喻做了多余的事。' },
    { id: 'cy003', type: 'idiom', question: '下列成语使用不恰当的一项是：', options: ['A. 脱颖而出', 'B. 感人肺腑', 'C. 半途而废、坚持不懈', 'D. 独具匠心'], correctAnswer: 2, analysis: 'C项"坚持不懈"不能形容"半途而废"。' },
    { id: 'cy004', type: 'idiom', question: '"守株待兔"比喻：', options: ['A. 善于观察', 'B. 死守不知变通', 'C. 有耐心', 'D. 运气重要'], correctAnswer: 1, analysis: '"守株待兔"比喻死守经验不知变通。' },
    { id: 'cy005', type: 'idiom', question: '"亡羊补牢"的意思是：', options: ['A. 羊丢了不找', 'B. 出问题后补救', 'C. 修理羊圈', 'D. 预防问题'], correctAnswer: 1, analysis: '"亡羊补牢"比喻出了问题及时补救。' },
    { id: 'cy006', type: 'idiom', question: '"夸夸其谈"的意思是：', options: ['A. 说话好听', 'B. 浮夸不实际', 'C. 夸奖别人', 'D. 谈论夸夸'], correctAnswer: 1, analysis: '"夸夸其谈"形容说话浮夸。' },
    { id: 'cy007', type: 'idiom', question: '下列成语书写正确的一项是：', options: ['A. 巧夺天公', 'B. 迫不急待', 'C. 谈笑风生', 'D. 再接再励'], correctAnswer: 2, analysis: 'C项正确。' },
    { id: 'cy008', type: 'idiom', question: '"胸有成竹"比喻：', options: ['A. 心里有竹子', 'B. 做事有把握', 'C. 喜欢画画', 'D. 胸部宽广'], correctAnswer: 1, analysis: '"胸有成竹"比喻做事有把握。' },
    { id: 'cy009', type: 'idiom', question: '下列加点成语使用正确的一项是：', options: ['A. 他做事一丝不苟', 'B. 这次会议万人空巷', 'C. 他总是袖手旁观', 'D. 这篇文章别出心裁'], correctAnswer: 0, analysis: 'A项"一丝不苟"使用正确。' },
    { id: 'cy010', type: 'idiom', question: '"津津有味"的意思是：', options: ['A. 味道好', 'B. 兴趣浓厚', 'C. 津津有味', 'D. 很有味道'], correctAnswer: 1, analysis: '"津津有味"形容兴趣浓厚。' },
    { id: 'cy011', type: 'idiom', question: '下列成语书写有误的一项是：', options: ['A. 刻舟求剑', 'B. 守株待兔', 'C. 掩耳盗铃', 'D. 亡羊补牢'], correctAnswer: 0, analysis: 'A项正确，全部都书写正确。' },
    { id: 'cy012', type: 'idiom', question: '"滥竽充数"比喻：', options: ['A. 乐器很多', 'B. 没有真才实学', 'C. 充数', 'D. 滥用'], correctAnswer: 1, analysis: '"滥竽充数"比喻没有真才实学混在行家里面。' },
    { id: 'cy013', type: 'idiom', question: '"不胫而走"的意思是：', options: ['A. 没有腿跑', 'B. 传播迅速', 'C. 走路快', 'D. 不走路'], correctAnswer: 1, analysis: '"不胫而走"比喻消息传播迅速。' },
    { id: 'cy014', type: 'idiom', question: '下列成语使用正确的一项是：', options: ['A. 他学习不耻下问', 'B. 这件事势在必行', 'C. 他总是随声附和', 'D. 这篇文章无懈可击'], correctAnswer: 3, analysis: 'D项"无懈可击"使用正确。' },
    { id: 'cy015', type: 'idiom', question: '"呕心沥血"形容：', options: ['A. 呕吐', 'B. 费尽心血', 'C. 出血', 'D. 痛苦'], correctAnswer: 1, analysis: '"呕心沥血"形容费尽心血。' },
    { id: 'cy016', type: 'idiom', question: '"不可救药"的意思是：', options: ['A. 不能吃药', 'B. 病重无法医治', 'C. 无法挽救', 'D. 不能治疗'], correctAnswer: 2, analysis: '"不可救药"比喻人或事物坏到无法挽救。' },
    { id: 'cy017', type: 'idiom', question: '下列成语使用不恰当的一项是：', options: ['A. 他总是自以为是', 'B. 这个故事耐人寻味', 'C. 他做事总是半途而废', 'D. 他总是精益求精'], correctAnswer: 2, analysis: 'C项是贬义词，语境需要。本题C项使用恰当。' },
    { id: 'cy018', type: 'idiom', question: '"栩栩如生"形容：', options: ['A. 人活着', 'B. 艺术形象逼真', 'C. 生活', 'D. 生物'], correctAnswer: 1, analysis: '"栩栩如生"形容艺术形象生动逼真。' },
    { id: 'cy019', type: 'idiom', question: '"兴高采烈"的意思是：', options: ['A. 高兴兴奋', 'B. 采花', 'C. 兴奋', 'D. 高高'], correctAnswer: 0, analysis: '"兴高采烈"形容兴致高情绪热烈。' },
    { id: 'cy020', type: 'idiom', question: '下列成语与"画蛇添足"意思相近的是：', options: ['A. 多此一举', 'B. 画龙点睛', 'C. 锦上添花', 'D. 雪中送炭'], correctAnswer: 0, analysis: '"多此一举"与"画蛇添足"意思相近。' }
    ]
    return [...base, ...generateExtendedIdiom()]
  })(),
  // 词汇练习 (vo001-vo200 共200题)
  vocabulary: (() => {
    const base = [
    { id: 'vo001', type: 'vocabulary', question: '"姹紫嫣红"的意思是：', options: ['A. 颜色单一', 'B. 各种花朵娇艳', 'C. 紫色红色', 'D. 花朵凋零'], correctAnswer: 1, analysis: '"姹紫嫣红"形容各种颜色花朵娇艳。' },
    { id: 'vo002', type: 'vocabulary', question: '下列词语中没有错别字的一项是：', options: ['A. 再接再励', 'B. 谈笑风生', 'C. 巧夺天公', 'D. 迫不急待'], correctAnswer: 1, analysis: 'B项正确。' },
    { id: 'vo003', type: 'vocabulary', question: '"美轮美奂"形容：', options: ['A. 美丽风景', 'B. 高大华丽建筑', 'C. 美丽的人', 'D. 美好音乐'], correctAnswer: 1, analysis: '"美轮美奂"形容房屋高大华丽。' },
    { id: 'vo004', type: 'vocabulary', question: '"鳞次栉比"的意思是：', options: ['A. 排列密', 'B. 鱼和梳子', 'C. 次序混乱', 'D. 整齐稀疏'], correctAnswer: 0, analysis: '"鳞次栉比"形容建筑物排列密整。' },
    { id: 'vo005', type: 'vocabulary', question: '"川流不息"的"川"意思是：', options: ['A. 山川', 'B. 河流', 'C. 平原', 'D. 道路'], correctAnswer: 1, analysis: '"川"指河流。' },
    { id: 'vo006', type: 'vocabulary', question: '"因地制宜"的意思是：', options: ['A. 根据当地制定措施', 'B. 改造环境', 'C. 适应环境', 'D. 改变制度'], correctAnswer: 0, analysis: '"因地制宜"指根据情况制定办法。' },
    { id: 'vo007', type: 'vocabulary', question: '下列词语解释有误的一项是：', options: ['A. 凛冽：寒冷', 'B. 逶迤：弯曲', 'C. 妥帖：恰当', 'D. 俨然：严肃'], correctAnswer: 3, analysis: 'D项"俨然"主要指很像。' },
    { id: 'vo008', type: 'vocabulary', question: '"不可思议"的意思是：', options: ['A. 无法想象', 'B. 不可议论', 'C. 很神奇', 'D. 不讲理'], correctAnswer: 0, analysis: '"不可思议"形容难以想象。' },
    { id: 'vo009', type: 'vocabulary', question: '下列词语中没有错别字的一项是：', options: ['A. 焕然一新', 'B. 谈笑风声', 'C. 迫不急待', 'D. 再接再励'], correctAnswer: 0, analysis: 'A项正确。B应"生"，C应"及"，D应"厉"。' },
    { id: 'vo010', type: 'vocabulary', question: '"抑扬顿挫"形容：', options: ['A. 声音高低起伏', 'B. 抑制', 'C. 挫折', 'D. 停顿'], correctAnswer: 0, analysis: '"抑扬顿挫"形容声音高低起伏和谐。' },
    { id: 'vo011', type: 'vocabulary', question: '下列词语书写正确的一项是：', options: ['A. 相得益章', 'B. 相得益彰', 'C. 相得益张', 'D. 相得益涨'], correctAnswer: 1, analysis: 'B项正确。' },
    { id: 'vo012', type: 'vocabulary', question: '"络绎不绝"的意思是：', options: ['A. 断断续续', 'B. 连续不断', 'C. 络绎', 'D. 不绝'], correctAnswer: 1, analysis: '"络绎不绝"形容行人车马连续不断。' },
    { id: 'vo013', type: 'vocabulary', question: '下列词语中有错别字的一项是：', options: ['A. 郑重其事', 'B. 漫不经心', 'C. 惊慌失措', 'D. 振耳欲聋'], correctAnswer: 3, analysis: 'D项应写"震耳欲聋"。' },
    { id: 'vo014', type: 'vocabulary', question: '"随声附和"的意思是：', options: ['A. 跟着说', 'B. 附和他人', 'C. 随便说', 'D. 附和'], correctAnswer: 1, analysis: '"随声附和"形容没有主见。' },
    { id: 'vo015', type: 'vocabulary', question: '下列词语书写全部正确的一项是：', options: ['A. 焕然一新 气势凶凶', 'B. 漫不经心 流连忘返', 'C. 郑重其事 振耳欲聋', 'D. 相得益章 迫不急待'], correctAnswer: 1, analysis: 'B项正确。A"汹汹"，C"震"，D"彰""及"。' },
    { id: 'vo016', type: 'vocabulary', question: '"因地制宜"的"宜"意思是：', options: ['A. 适宜', 'B. 应该', 'C. 容易', 'D. 适宜'], correctAnswer: 0, analysis: '"宜"指适宜的措施。' },
    { id: 'vo017', type: 'vocabulary', question: '下列词语中"宜"的意思与其他三项不同的一项是：', options: ['A. 因地制宜', 'B. 适宜', 'C. 事宜', 'D. 权宜'], correctAnswer: 2, analysis: 'C项"事宜"的"宜"指事情。' },
    { id: 'vo018', type: 'vocabulary', question: '"不可名状"的意思是：', options: ['A. 不能说出', 'B. 不能描述', 'C. 不能状写', 'D. 不能形状'], correctAnswer: 1, analysis: '"不可名状"指无法用语言形容。' },
    { id: 'vo019', type: 'vocabulary', question: '下列词语解释正确的一项是：', options: ['A. 俨然：严肃的样子', 'B. 妥帖：恰当', 'C. 逶迤：曲折延伸', 'D. 凛冽：寒冷的风'], correctAnswer: 1, analysis: 'B项解释准确。' },
    { id: 'vo020', type: 'vocabulary', question: '"历历在目"的意思是：', options: ['A. 清清楚楚', 'B. 历经', 'C. 历史', 'D. 在眼前'], correctAnswer: 0, analysis: '"历历在目"形容清楚分明地出现在眼前。' }
    ]
    return [...base, ...generateExtendedVocabulary()]
  })(),
  // 病句修改 (bc001-bc200 共200题)
  correction: (() => {
    const base = [
    { id: 'bc001', type: 'correction', question: '下列句子中没有语病的一项是：', options: ['A. 通过活动，使我明白', 'B. 态度端正，成绩提高', 'C. 打扫教室卫生', 'D. 改进方法，增加效率'], correctAnswer: 1, analysis: 'B项无语病。' },
    { id: 'bc002', type: 'correction', question: '"增加效率"的错误类型是：', options: ['A. 语序不当', 'B. 搭配不当', 'C. 成分残缺', 'D. 表意不明'], correctAnswer: 1, analysis: '"增加"与"效率"搭配不当。' },
    { id: 'bc003', type: 'correction', question: '下列句子中有语病的一项是：', options: ['A. 北京秋天美丽', 'B. 文章观点深刻', 'C. 穿着上衣戴帽子', 'D. 养成学习习惯'], correctAnswer: 2, analysis: 'C项搭配不当。' },
    { id: 'bc004', type: 'correction', question: '"通过学习，使我受益"病因是：', options: ['A. 成分残缺', 'B. 搭配不当', 'C. 语序不当', 'D. 结构混乱'], correctAnswer: 0, analysis: '滥用介词导致主语缺失。' },
    { id: 'bc005', type: 'correction', question: '修改"稻米是主要粮食"正确的是：', options: ['A. 稻米是粮食', 'B. 稻米是粮食作物', 'C. 粮食是稻米', 'D. 稻米是主要'], correctAnswer: 1, analysis: '应改为"稻米是粮食作物"。' },
    { id: 'bc006', type: 'correction', question: '下列没有语病的一项是：', options: ['A. 文章对我有兴趣', 'B. 我对文章有兴趣', 'C. 文章引起兴趣', 'D. 文章让我感兴趣'], correctAnswer: 2, analysis: 'C项无语病。' },
    { id: 'bc007', type: 'correction', question: '"即使遇到挫折，也要坚持"：', options: ['A. 有语病', 'B. 无语病', 'C. 缺主语', 'D. 搭配不当'], correctAnswer: 1, analysis: '这句话无语病。' },
    { id: 'bc008', type: 'correction', question: '下列有语病的一项是：', options: ['A. 培养习惯', 'B. 明白道理', 'C. 努力取得成绩', 'D. 作者是鲁迅写的'], correctAnswer: 3, analysis: 'D项句式杂糅。' },
    { id: 'bc009', type: 'correction', question: '下列句子没有语病的一项是：', options: ['A. 通过学习使我进步', 'B. 他进步了', 'C. 他穿着衣服和帽子', 'D. 提高工作效率'], correctAnswer: 3, analysis: 'D项无语病。' },
    { id: 'bc010', type: 'correction', question: '"这本书的作者是鲁迅写的"病因是：', options: ['A. 成分残缺', 'B. 句式杂糅', 'C. 搭配不当', 'D. 表意不明'], correctAnswer: 1, analysis: '句式杂糅。' },
    { id: 'bc011', type: 'correction', question: '下列句子中没有语病的一项是：', options: ['A. 这幅画对我很感兴趣', 'B. 我对这幅画很感兴趣', 'C. 这幅画引起了我的兴趣', 'D. 这幅画让我很感兴趣'], correctAnswer: 2, analysis: 'C项无语病。A、B项主客颠倒。' },
    { id: 'bc012', type: 'correction', question: '下列句子中有语病的一项是：', options: ['A. 我们要养成良好的学习习惯', 'B. 他终于明白了一个道理', 'C. 通过努力他取得了好成绩', 'D. 这本书的作者是鲁迅写的'], correctAnswer: 3, analysis: 'D项句式杂糅。' },
    { id: 'bc013', type: 'correction', question: '"我们一定要发挥优点、改正错误"的病因是：', options: ['A. 成分残缺', 'B. 搭配不当', 'C. 语序不当', 'D. 表意不明'], correctAnswer: 1, analysis: '"发挥"与"优点"搭配，"改正"与"错误"搭配，但"发挥优点"不妥，应为"发扬优点"。' },
    { id: 'bc014', type: 'correction', question: '下列句子无语病的一项是：', options: ['A. 他的学习态度端正，成绩也提高了', 'B. 通过活动使我明白了', 'C. 昨天下午我们打扫教室卫生', 'D. 我们要改进学习方法，增加效率'], correctAnswer: 0, analysis: 'A项无语病。' },
    { id: 'bc015', type: 'correction', question: '"这个问题需要大家一起来讨论和解决"的语病类型是：', options: ['A. 语序不当', 'B. 搭配不当', 'C. 成分残缺', 'D. 表意不明'], correctAnswer: 1, analysis: '"讨论"和"解决"都是动词，但"问题"只能被"解决"不能被"讨论"，应改为"讨论并解决这个问题"。' },
    { id: 'bc016', type: 'correction', question: '下列句子有语病的一项是：', options: ['A. 我国的茶叶产量是世界上最多的国家', 'B. 这本书我看过', 'C. 他是一个优秀的学生', 'D. 我们要养成良好习惯'], correctAnswer: 0, analysis: 'A项主宾不搭配，应删去"的国家"或改为"我国是世界上茶叶产量最多的国家"。' },
    { id: 'bc017', type: 'correction', question: '"能否保持学习成绩的不断提高，关键在于刻苦努力"的病因是：', options: ['A. 一面与两面搭配不当', 'B. 成分残缺', 'C. 语序不当', 'D. 表意不明'], correctAnswer: 0, analysis: '"能否"是两面，"刻苦努力"是一面，前后不对应。' },
    { id: 'bc018', type: 'correction', question: '下列句子无语病的一项是：', options: ['A. 只要刻苦努力，就能取得好成绩', 'B. 他不但学习好，而且思想品德好', 'C. 即使明天下雨，我们也要去', 'D. 因为生病，所以没来上学'], correctAnswer: 2, analysis: 'C项无语病。A项"只要...就"应为"只有...才"；B、D关联词位置不当。' },
    { id: 'bc019', type: 'correction', question: '"各种新发现的流行病，使我们改正并认识了自己不良的卫生习惯"的病因是：', options: ['A. 语序不当', 'B. 搭配不当', 'C. 成分残缺', 'D. 表意不明'], correctAnswer: 0, analysis: '"认识并改正"符合逻辑，先认识再改正。' },
    { id: 'bc020', type: 'correction', question: '下列句子有语病的一项是：', options: ['A. 经过努力，他终于考取了大学', 'B. 在老师的帮助下，他的进步很大', 'C. 通过这次活动，使我受到很大教育', 'D. 他把教室打扫得干干净净'], correctAnswer: 2, analysis: 'C项成分残缺，应删去"通过"或"使"。' }
    ]
    return [...base, ...generateExtendedCorrection()]
  })(),
  // 古诗词 (gs001-gs200 共200题)
  literature: (() => {
    const base = [
    { id: 'gs001', type: 'literature', question: '"采菊东篱下，悠然见南山"出自谁：', options: ['A. 李白', 'B. 杜甫', 'C. 陶渊明', 'D. 王维'], correctAnswer: 2, analysis: '陶渊明《饮酒》。' },
    { id: 'gs002', type: 'literature', question: '"海内存知己，天涯若比邻"出自：', options: ['A. 王勃', 'B. 李白', 'C. 王维', 'D. 杜甫'], correctAnswer: 0, analysis: '王勃《送杜少府之任蜀州》。' },
    { id: 'gs003', type: 'literature', question: '"春眠不觉晓"下一句是：', options: ['A. 花落知多少', 'B. 处处闻啼鸟', 'C. 夜来风雨声', 'D. 江清月近人'], correctAnswer: 1, analysis: '"春眠不觉晓，处处闻啼鸟"。' },
    { id: 'gs004', type: 'literature', question: '"但愿人长久"下一句是：', options: ['A. 千里共婵娟', 'B. 明月几时有', 'C. 把酒问青天', 'D. 何似在人间'], correctAnswer: 0, analysis: '"但愿人长久，千里共婵娟"。' },
    { id: 'gs005', type: 'literature', question: '"会当凌绝顶"下一句是：', options: ['A. 一览众山小', 'B. 造化钟神秀', 'C. 决眦入归鸟', 'D. 荡胸生层云'], correctAnswer: 0, analysis: '"会当凌绝顶，一览众山小"。' },
    { id: 'gs006', type: 'literature', question: '"人生自古谁无死"下一句是：', options: ['A. 留取丹心照汗青', 'B. 身世浮沉雨打萍', 'C. 惶恐滩头说惶恐', 'D. 干戈寥落四周星'], correctAnswer: 0, analysis: '文天祥《过零丁洋》。' },
    { id: 'gs007', type: 'literature', question: '"落红不是无情物"下一句是：', options: ['A. 化作春泥更护花', 'B. 浩荡离愁白日斜', 'C. 吟鞭东指即天涯', 'D. 伴我直到 Subcommittee'], correctAnswer: 0, analysis: '龚自珍《己亥杂诗》。' },
    { id: 'gs008', type: 'literature', question: '"大漠孤烟直"下一句是：', options: ['A. 长河落日圆', 'B. 萧关逢候骑', 'C. 都护在燕然', 'D. 征蓬出汉塞'], correctAnswer: 0, analysis: '王维《使至塞上》。' },
    { id: 'gs009', type: 'literature', question: '"商女不知亡国恨"下一句是：', options: ['A. 隔江犹唱后庭花', 'B. 烟笼寒水月笼沙', 'C. 夜泊秦淮近酒家', 'D. 三山半落青天外'], correctAnswer: 0, analysis: '杜牧《泊秦淮》。' },
    { id: 'gs010', type: 'literature', question: '"山重水复疑无路"下一句是：', options: ['A. 柳暗花明又一村', 'B. 丰年留客足鸡豚', 'C. 山重水复疑无路', 'D. 柳暗花明'], correctAnswer: 0, analysis: '陆游《游山西村》。' },
    { id: 'gs011', type: 'literature', question: '"先天下之忧而忧"下一句是：', options: ['A. 后天下之乐而乐', 'B. 不以物喜', 'C. 不以己悲', 'D. 处江湖之远'], correctAnswer: 0, analysis: '范仲淹《岳阳楼记》。' },
    { id: 'gs012', type: 'literature', question: '"不畏浮云遮望眼"下一句是：', options: ['A. 自缘身在最高层', 'B. 飞入寻常百姓家', 'C. 不教胡马度阴山', 'D. 西出阳关无故人'], correctAnswer: 0, analysis: '王安石《登飞来峰》。' },
    { id: 'gs013', type: 'literature', question: '"安得广厦千万间"下一句是：', options: ['A. 大庇天下寒士俱欢颜', 'B. 风雨不动安如山', 'C. 吾庐独破受冻死亦足', 'D. 何时眼前突兀见此屋'], correctAnswer: 0, analysis: '杜甫《茅屋为秋风所破歌》。' },
    { id: 'gs014', type: 'literature', question: '"落霞与孤鹜齐飞"下一句是：', options: ['A. 秋水共长天一色', 'B. 渔舟唱晚', 'C. 雁阵惊寒', 'D. 襟三江而带五湖'], correctAnswer: 0, analysis: '王勃《滕王阁序》。' },
    { id: 'gs015', type: 'literature', question: '"春风又绿江南岸"下一句是：', options: ['A. 明月何时照我还', 'B. 春风又绿江南岸', 'C. 钟山只隔数重山', 'D. 京口瓜洲一水间'], correctAnswer: 0, analysis: '王安石《泊船瓜洲》。' },
    { id: 'gs016', type: 'literature', question: '"沉舟侧畔千帆过"下一句是：', options: ['A. 病树前头万木春', 'B. 怀旧空吟闻笛赋', 'C. 到乡翻似烂柯人', 'D. 巴山楚水凄凉地'], correctAnswer: 0, analysis: '刘禹锡《酬乐天扬州初逢席上见赠》。' },
    { id: 'gs017', type: 'literature', question: '"长风破浪会有时"下一句是：', options: ['A. 直挂云帆济沧海', 'B. 闲来垂钓碧溪上', 'C. 忽复乘舟梦日边', 'D. 欲渡黄河冰塞川'], correctAnswer: 0, analysis: '李白《行路难》。' },
    { id: 'gs018', type: 'literature', question: '"几处早莺争暖树"下一句是：', options: ['A. 谁家新燕啄春泥', 'B. 乱花渐欲迷人眼', 'C. 浅草才能没马蹄', 'D. 孤山寺北贾亭西'], correctAnswer: 0, analysis: '白居易《钱塘湖春行》。' },
    { id: 'gs019', type: 'literature', question: '"造化钟神秀"下一句是：', options: ['A. 阴阳割昏晓', 'B. 会当凌绝顶', 'C. 荡胸生层云', 'D. 决眦入归鸟'], correctAnswer: 0, analysis: '杜甫《望岳》。' },
    { id: 'gs020', type: 'literature', question: '"谁道人生无再少"下一句是：', options: ['A. 门前流水尚能西', 'B. 休将白发唱黄鸡', 'C. 山下兰芽短浸溪', 'D. 松间沙路净无泥'], correctAnswer: 0, analysis: '苏轼《浣溪沙》。' }
    ]
    return [...base, ...generateExtendedLiterature()]
  })()
}

// 获取所有模拟题目
const getAllMockQuestions = () => {
  return [
    ...MOCK_QUESTIONS.pinyin,
    ...MOCK_QUESTIONS.idiom,
    ...MOCK_QUESTIONS.vocabulary,
    ...MOCK_QUESTIONS.correction,
    ...MOCK_QUESTIONS.literature
  ]
}

// 打乱数组
const shuffleArray = (array) => {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

class QuestionService {
  /**
   * 获取随机题目
   */
  async getRandomQuestions(count = 10, type = null) {
    console.log('getRandomQuestions 被调用, count:', count, 'type:', type)

    // 先尝试云函数
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.QUESTION, {
        action: 'random',
        count,
        type
      })
      if (res && res.data && res.data.length > 0) {
        console.log('从云函数获取到题目，数量:', res.data.length)
        return res.data
      }
    } catch (err) {
      console.log('云函数调用失败，使用本地模拟数据')
    }

    // 使用本地模拟数据
    let questions = getAllMockQuestions()
    if (type && MOCK_QUESTIONS[type]) {
      questions = MOCK_QUESTIONS[type]
    }
    const result = shuffleArray(questions).slice(0, Math.min(count, questions.length))
    console.log('返回本地模拟题目，数量:', result.length)
    return result
  }

  /**
   * 按类型获取题目
   */
  async getQuestionsByType(type, page = DEFAULT_PAGE.page, pageSize = DEFAULT_PAGE.pageSize) {
    console.log('getQuestionsByType 被调用, type:', type, 'page:', page, 'pageSize:', pageSize)

    // 先尝试云函数
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.QUESTION, {
        action: 'list',
        type,
        page,
        pageSize
      })
      if (res && res.data && res.data.length > 0) {
        console.log('从云函数获取到题目，数量:', res.data.length)
        return res.data
      }
    } catch (err) {
      console.log('云函数调用失败，使用本地模拟数据')
    }

    // 使用本地模拟数据
    if (MOCK_QUESTIONS[type]) {
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const result = MOCK_QUESTIONS[type].slice(start, end)
      console.log('返回本地模拟题目，type:', type, '数量:', result.length)
      return result
    }

    // 如果没有匹配的类型，返回随机题目
    console.log('未找到匹配类型，返回随机题目')
    const allQuestions = getAllMockQuestions()
    return shuffleArray(allQuestions).slice(0, Math.min(pageSize, allQuestions.length))
  }

  /**
   * 按年份获取题目
   */
  async getQuestionsByYear(year, page = DEFAULT_PAGE.page, pageSize = DEFAULT_PAGE.pageSize) {
    const res = await callCloudFunction(CLOUD_FUNCTIONS.QUESTION, {
      action: 'byYear',
      year,
      page,
      pageSize
    })
    return res.data || []
  }

  /**
   * 搜索题目
   */
  async searchQuestions(keyword, page = DEFAULT_PAGE.page, pageSize = DEFAULT_PAGE.pageSize) {
    const res = await callCloudFunction(CLOUD_FUNCTIONS.QUESTION, {
      action: 'search',
      keyword,
      page,
      pageSize
    })
    return res.data || []
  }

  /**
   * 获取题目详情
   */
  async getQuestionDetail(id) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.QUESTION, {
        action: 'detail',
        id
      })
      if (res.data) {
        return res.data
      }
    } catch (err) {
      console.log('云函数调用失败，使用本地模拟数据')
    }

    // 从本地模拟数据中查找
    const allQuestions = getAllMockQuestions()
    return allQuestions.find(q => q.id === id) || null
  }

  /**
   * 提交答案
   */
  async submitAnswer(questionId, answer) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.QUESTION, {
        action: 'submit',
        questionId,
        answer
      })
      return res
    } catch (err) {
      Taro.showToast({ title: '提交答案失败', icon: 'none' })
      return { success: false }
    }
  }

  /**
   * 获取题目统计
   */
  async getStatistics() {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.QUESTION, {
        action: 'stats'
      })
      if (res.data && Object.keys(res.data).length > 0) {
        return res.data
      }
    } catch (err) {
      console.log('云函数调用失败，使用本地模拟数据')
    }

    // 返回本地模拟统计 - 与云函数返回结构一致
    return {
      answered: 0,
      correct: 0,
      total: getAllMockQuestions().length,
      todayAnswered: 0,
      accuracy: 0,
      typeStats: {
        pinyin: MOCK_QUESTIONS.pinyin.length,
        literature: MOCK_QUESTIONS.literature.length,
        idiom: MOCK_QUESTIONS.idiom.length,
        correction: MOCK_QUESTIONS.correction.length,
        vocabulary: MOCK_QUESTIONS.vocabulary.length,
        comprehension: 0,
        grammar: 0,
        reading: 0
      }
    }
  }

  /**
   * 收藏题目
   * @param {string} questionId - 题目 ID
   * @param {object} questionData - 题目完整数据（可选）
   */
  async toggleFavorite(questionId, questionData = null) {
    console.log('=== questionService.toggleFavorite ===')
    console.log('questionId:', questionId)
    console.log('questionData:', questionData)

    try {
      const payload = {
        action: 'favorite',
        questionId
      }
      // 如果提供了完整题目数据，一并发送
      if (questionData) {
        payload.questionData = questionData
      }

      console.log('=== 发送到云函数的 payload ===', payload)

      const res = await callCloudFunction(CLOUD_FUNCTIONS.QUESTION, payload)

      console.log('=== 云函数返回结果 ===', res)

      return res.success
    } catch (err) {
      console.error('=== toggleFavorite 错误 ===', err)
      Taro.showToast({ title: '收藏失败', icon: 'none' })
      return false
    }
  }

  /**
   * 获取收藏列表
   */
  async getFavorites(page = DEFAULT_PAGE.page, pageSize = DEFAULT_PAGE.pageSize) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.QUESTION, {
        action: 'favorites',
        page,
        pageSize
      })
      return res.data || []
    } catch (err) {
      Taro.showToast({ title: '获取收藏失败', icon: 'none' })
      return []
    }
  }

  /**
   * 获取错题集
   */
  async getWrongQuestions(page = DEFAULT_PAGE.page, pageSize = DEFAULT_PAGE.pageSize) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.QUESTION, {
        action: 'wrong',
        page,
        pageSize
      })
      return res.data || []
    } catch (err) {
      Taro.showToast({ title: '获取错题失败', icon: 'none' })
      return []
    }
  }
}

export default new QuestionService()
