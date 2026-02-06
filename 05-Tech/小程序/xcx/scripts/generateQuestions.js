/**
 * 题库数据生成器
 * 基于原始题目模板生成大量模拟题目
 */

// 拼音题模板库
const pinyinTemplates = [
  {
    question: "下列词语中加点字的读音，完全正确的一项是（ ）",
    options: [
      { word: "A", items: [
        { text: "发酵（jiào）", correct: true },
        { text: "处理（chǔ）", correct: true },
        { text: "因为（wèi）", correct: true },
        { text: "角色（jiǎo）", correct: true }
      ]},
      { word: "B", items: [
        { text: "强迫（qiǎng）", correct: true },
        { text: "模样（mú）", correct: true },
        { text: "称呼（chēng）", correct: true },
        { text: "比较（jiào）", correct: true }
      ]},
      { word: "C", items: [
        { text: "暂时（zàn）", correct: true },
        { text: "给予（jǐ）", correct: true },
        { text: "参与（yù）", correct: true },
        { text: "召开（zhào）", correct: true }
      ]},
      { word: "D", items: [
        { text: "惩罚（chéng）", correct: false, real: "chéng" },
        { text: "档案（dǎng）", correct: true },
        { text: "甚至（shèn）", correct: true },
        { text: "尽管（jǐn）", correct: true }
      ]}
    ],
    answer: "D",
    explanation: "A项中\"惩罚\"读音应为 chéng，正确。"
  },
  {
    question: "下列各组词语中加点字的读音全都相同的一项是（ ）",
    options: [
      { word: "A", items: ["藩篱 樊笼 翻天覆地"] },
      { word: "B", items: ["几案 肌理 反唇相讥"] },
      { word: "C", items: ["揭露 露底 风餐露宿"] },
      { word: "D", items: ["结实 结余 结党营私"] }
    ],
    answer: "A",
    explanation: "A项均读 fān；B项读 jī/jī/jī；C项读 jié/lù/lù；D项读 jié/jié/jié。"
  },
  {
    question: "下列词语中加点字的读音，不正确的一项是（ ）",
    options: [
      { text: "A. 衡量（liáng）", correct: true },
      { text: "B. 塑（shù）造", correct: false },
      { text: "C. 时髦（máo）", correct: true },
      { text: "D. 勉强（qiǎng）", correct: true }
    ],
    answer: "B",
    explanation: "\"塑\"应读 sù。"
  }
]

// 词汇题模板库
const vocabularyTemplates = [
  {
    question: "依次填入下列横线处的词语，最恰当的一项是（ ）",
    type: "fill_blank",
    options: ["调试 体貌 功能", "调适 体貌 功绩", "调试 体魄 功绩", "调适 体魄 功能"],
    answer: "D",
    explanation: "\"调适\"指调整适应；\"体魄\"指体格；\"功能\"指机能。"
  },
  {
    question: "下列句子中加点成语的使用，不恰当的一项是（ ）",
    options: [
      "毋庸置疑，\"四肢发达就是体育\"的陈旧观念，还难以在社会上和学校里彻底消除。",
      "成功体验与竞争意识相辅相成。安排比赛要考虑学生在体能、技术方面存在的差异。",
      "保了传球、他还不断突破，急停跳投，接二连三撕开对方防线，为比分反超立下大功。",
      "快到终点时，他的速度越来越快，强弩之末，势如破竹，终于毫无悬念的夺得了冠军。"
    ],
    answer: "D",
    explanation: "\"强弩之末\"比喻力量已衰，不能发挥作用，与\"速度越来越快\"语境不符。"
  },
  {
    question: "下列各句中加点词语的使用，不正确的一项是（ ）",
    options: [
      "在国际市场竞争中，虽说\"胳膊拧不过大腿\"，但这家小厂却凭借产品更新赢得了发展。",
      "\"墙倒众人推\"，只要我们团结一致，充分发挥集体的智慧和力量，就一定能战胜困难。",
      "割鸡焉用牛刀？对付这样的弱队，我们主力队员不上场也完全能取胜，这个自信应该有。",
      "对于这次比赛事故，他的辩解驴唇不对马嘴，偏离事实，自相矛盾，难以服人。"
    ],
    answer: "C",
    explanation: "\"割鸡焉用牛刀\"比喻做小事不值得花费大力量，是反问句，语境不当。"
  }
]

// 古诗词题模板库
const literatureTemplates = [
  {
    question: "补全下列诗句：\"采菊东篱下，________。\"",
    options: [
      "悠然见南山",
      "飞鸟相与还",
      "山气日夕佳",
      "结庐在人境"
    ],
    answer: "A",
    explanation: "出自陶渊明《饮酒·其五》"
  },
  {
    question: "\"春风又绿江南岸\"的下一句是：",
    options: [
      "二月春风似剪刀",
      "明月何时照我还",
      "江南好，风景旧曾谙",
      "日出江花红胜火"
    ],
    answer: "B",
    explanation: "出自王安石《泊船瓜洲》"
  },
  {
    question: "\"采菊东篱下，悠然见南山\"的作者是：",
    options: ["李白", "杜甫", "陶渊明", "王维"],
    answer: "C",
    explanation: "陶渊明是东晋诗人，这首诗出自《饮酒·其五》。"
  },
  {
    question: "\"床前明月光\"的正确下一句是：",
    options: ["疑是地上霜", "举头望明月", "低头思故乡", "地上霜"],
    answer: "A",
    explanation: "《静夜思》完整诗句：床前明月光，疑是地上霜。"
  },
  {
    question: "\"千山鸟飞绝\"的下一句是：",
    options: ["万径人踪灭", "孤舟蓑笠翁", "独钓寒江雪", "江雪独钓舟"],
    answer: "A",
    explanation: "出自柳宗元《江雪》。"
  }
]

// 成语题模板库
const idiomTemplates = [
  {
    question: "\"画蛇添足\"的意思是：",
    options: [
      "比喻做事认真细致",
      "比喻做了多余的事",
      "比喻坚持不懈",
      "比喻技艺高超"
    ],
    answer: "B",
    explanation: "画蛇添足：比喻做了多余的事，非但无益，反而不合适。"
  },
  {
    question: "\"守株待兔\"比喻：",
    options: [
      "勤奋好学",
      "死守狭隘经验",
      "聪明机智",
      "坚持不懈"
    ],
    answer: "B",
    explanation: "守株待兔：比喻死守狭隘经验，不知变通。"
  },
  {
    question: "\"掩耳盗铃\"的意思是：",
    options: [
      "保护自己",
      "自己欺骗自己",
      "非常聪明",
      "小心翼翼"
    ],
    answer: "B",
    explanation: "掩耳盗铃：比喻自己欺骗自己。"
  },
  {
    question: "\"亡羊补牢\"的意思是：",
    options: [
      "无能为力",
      "为时已晚",
      "出了问题及时补救",
      "后悔莫及"
    ],
    answer: "C",
    explanation: "亡羊补牢：比喻出了问题以后想办法补救，可以防止继续受损失。"
  }
]

// 语法/病句题模板库
const correctionTemplates = [
  {
    question: "下列句子中，没有语病的一项是（ ）",
    options: [
      "通过这次活动，使我受益匪浅。",
      "他的学习态度端正，成绩也提高了。",
      "昨天下午，我们班打扫了教室卫生。",
      "我们要不断改进学习方法，增加学习效率。"
    ],
    answer: "B",
    explanation: "A项成分残缺（缺主语）；C项\"打扫\"和\"卫生\"语义重复；D项\"增加\"应改为\"提高\"。"
  },
  {
    question: "下列句子中，有语病的一项是（ ）",
    options: [
      "我们应该养成良好的学习习惯。",
      "经过老师的教育，他终于认识到自己的错误。",
      "在阅读中，我们可以积累丰富的语言材料。",
      "通过这次活动，使我明白了团结的重要性。"
    ],
    answer: "D",
    explanation: "\"通过\"和\"使\"同时使用，导致句子缺少主语。"
  },
  {
    question: "下列句子中，表意明确的一项是（ ）",
    options: [
      "稻米是浙江、江苏一带的主要粮食。",
      "三个学校的老师都来了。",
      "他在这里做了一天工作。",
      "这是一个快乐的时刻。"
    ],
    answer: "A",
    explanation: "B项有歧义（三个学校/三个老师）；C项\"一天\"有歧义；D项语义不明确。"
  }
]

// 阅读理解题模板库
const comprehensionTemplates = [
  {
    question: "下列有关作家作品的表述，不正确的一项是( )",
    options: [
      "唐代诗人李商隐的《锦瑟》，意象朦胧，意境凄迷，情思缠绵，是脍炙人口的佳作。",
      "巴金的散文《包身工》，表现了上世纪40年代中国女工在日本纱厂被奴役的黑暗现实。",
      "《装在套子里的人》作者是俄国作家契诃夫，别里科夫是这篇小说中的主要人物。",
      "《我有一个梦想》是美国黑人民权运动领袖马丁·路德·金在一次集会上的演讲。"
    ],
    answer: "B",
    explanation: "《包身工》报告文学作品，发表于1936年，反映的是上世纪30年代中国女工的境遇。"
  }
]

// 拼音题库数据（用于生成变体）
const pinyinData = {
  words: [
    { word: "发酵", pinyin: "jiào" },
    { word: "处理", pinyin: "chǔ" },
    { word: "因为", pinyin: "wèi" },
    { word: "角色", pinyin: "jué" },
    { word: "强迫", pinyin: "qiǎng" },
    { word: "模样", pinyin: "mú" },
    { word: "暂时", pinyin: "zàn" },
    { word: "给予", pinyin: "jǐ" },
    { word: "参与", pinyin: "yù" },
    { word: "尽管", pinyin: "jǐn" },
    { word: "召开", pinyin: "zhào" },
    { word: "档案", pinyin: "dàng" },
    { word: "甚至", pinyin: "shèn" },
    { word: "惩罚", pinyin: "chéng" },
    { word: "衡量", pinyin: "liáng" },
    { word: "塑", pinyin: "sù" },
    { word: "时髦", pinyin: "máo" },
    { word: "勉强", pinyin: "qiǎng" },
    { word: "比较", pinyin: "jiào" },
    { word: "称呼", pinyin: "chēng" },
    { word: "虽然", pinyin: "suī" },
    { word: "因为", pinyin: "wèi" },
    { word: "教室", pinyin: "shì" },
    { word: "比较", pinyin: "jiào" },
    { word: "暴露", pinyin: "pù" },
    { word: "气氛", pinyin: "fēn" },
    { word: "因为", pinyin: "wèi" },
    { word: "处理", pinyin: "chǔ" },
    { word: "因为", pinyin: "wèi" },
    { word: "因为", pinyin: "wèi" }
  ]
}

// 古诗词数据
const poems = [
  { line1: "采菊东篱下", line2: "悠然见南山", author: "陶渊明", title: "饮酒" },
  { line1: "床前明月光", line2: "疑是地上霜", author: "李白", title: "静夜思" },
  { line1: "千山鸟飞绝", line2: "万径人踪灭", author: "柳宗元", title: "江雪" },
  { line1: "白日依山尽", line2: "黄河入海流", author: "王之涣", title: "登鹳雀楼" },
  { line1: "春眠不觉晓", line2: "处处闻啼鸟", author: "孟浩然", title: "春晓" },
  { line1: "红豆生南国", line2: "春来发几枝", author: "王维", title: "相思" },
  { line1: "空山新雨后", line2: "天气晚来秋", author: "王维", title: "山居秋暝" },
  { line1: "独在异乡为异客", line2: "每逢佳节倍思亲", author: "王维", title: "九月九日忆山东兄弟" },
  { line1: "春蚕到死丝方尽", line2: "蜡炬成灰泪始干", author: "李商隐", title: "无题" },
  { line1: "野火烧不尽", line2: "春风吹又生", author: "白居易", title: "赋得古原草送别" },
  { line1: "离离原上草", line2: "一岁一枯荣", author: "白居易", title: "赋得古原草送别" },
  { line1: "不知细叶谁裁出", line2: "二月春风似剪刀", author: "贺知章", title: "咏柳" },
  { line1: "日出江花红胜火", line2: "春来江水绿如蓝", author: "白居易", title: "忆江南" },
  { line1: "春风又绿江南岸", line2: "明月何时照我还", author: "王安石", title: "泊船瓜洲" },
  { line1: "明月几时有", line2: "把酒问青天", author: "苏轼", title: "水调歌头" },
  { line1: "但愿人长久", line2: "千里共婵娟", author: "苏轼", title: "水调歌头" },
  { line1: "大漠孤烟直", line2: "长河落日圆", author: "王维", title: "使至塞上" },
  { line1: "会当凌绝顶", line2: "一览众山小", author: "杜甫", title: "望岳" },
  { line1: "国破山河在", line2: "城春草木深", author: "杜甫", title: "春望" },
  { line1: "随风潜入夜", line2: "润物细无声", author: "杜甫", title: "春夜喜雨" },
  { line1: "两个黄鹂鸣翠柳", line2: "一行白鹭上青天", author: "杜甫", title: "绝句" },
  { line1: "飞流直下三千尺", line2: "疑是银河落九天", author: "李白", title: "望庐山瀑布" },
  { line1: "两岸猿声啼不住", line2: "轻舟已过万重山", author: "李白", title: "早发白帝城" },
  { line1: "孤帆远影碧空尽", line2: "唯见长江天际流", author: "李白", title: "黄鹤楼送孟浩然之广陵" },
  { line1: "桃花潭水深千尺", line2: "不及汪伦送我情", author: "李白", title: "赠汪伦" },
  { line1: "姑苏城外寒山寺", line2: "夜半钟声到客船", author: "张继", title: "枫桥夜泊" },
  { line1: "清明时节雨纷纷", line2: "路上行人欲断魂", author: "杜牧", title: "清明" }
]

// 成语数据
const idioms = [
  { idiom: "画蛇添足", pinyin: "huà shé tiān zú", meaning: "比喻做了多余的事" },
  { idiom: "守株待兔", pinyin: "shǒu zhū dài tù", meaning: "比喻死守狭隘经验" },
  { idiom: "掩耳盗铃", pinyin: "yǎn ěr dào líng", meaning: "比喻自己欺骗自己" },
  { idiom: "亡羊补牢", pinyin: "wáng yáng bǔ láo", meaning: "出了问题及时补救" },
  { idiom: "拔苗助长", pinyin: "bá miáo zhù zhǎng", meaning: "比喻违反规律急于求成" },
  { idiom: "刻舟求剑", pinyin: "kè zhōu qiú jiàn", meaning: "比喻拘泥成法不知变通" },
  { idiom: "井底之蛙", pinyin: "jǐng dǐ zhī wā", meaning: "比喻见识短浅" },
  { idiom: "狐假虎威", pinyin: "hú jiǎ hǔ wēi", meaning: "比喻依仗他人势力欺压人" },
  { idiom: "画龙点睛", pinyin: "huà lóng diǎn jīng", meaning: "比喻关键一笔使事物生动" },
  { idiom: "对牛弹琴", pinyin: "duì niú tán qín", meaning: "比喻对不懂道理的人讲道理" },
  { idiom: "班门弄斧", pinyin: "bān mén nòng fǔ", meaning: "比喻在行家面前卖弄" },
  { idiom: "半途而废", pinyin: "bàn tú ér fèi", meaning: "做事中途停止" },
  { idiom: "自相矛盾", pinyin: "zì xiāng máo dùn", meaning: "比喻言行自相抵触" },
  { idiom: "滥竽充数", pinyin: "làn yú chōng shù", meaning: "比喻无真才实学混在行家里面" },
  { idiom: "杞人忧天", pinyin: "qǐ rén yōu tiān", meaning: "比喻不必要的忧虑" },
  { idiom: "杯弓蛇影", pinyin: "bēi gōng shé yǐng", meaning: "比喻疑神疑鬼自相惊扰" },
  { idiom: "指鹿为马", pinyin: "zhǐ lù wéi mǎ", meaning: "比喻颠倒黑白" },
  { idiom: "纸上谈兵", pinyin: "zhǐ shàng tán bīng", meaning: "比喻空谈理论不能解决实际问题" },
  { idiom: "望梅止渴", pinyin: "wàng méi zhǐ kě", meaning: "比喻用空想安慰自己" },
  { idiom: "草木皆兵", pinyin: "cǎo mù jiē bīng", meaning: "形容极度惊恐疑神疑鬼" }
]

/**
 * 题目生成器类
 */
class QuestionGenerator {
  /**
   * 生成拼音题
   */
  generatePinyinQuestions(count) {
    const questions = []
    const templateTypes = [
      'single_correct',     // 单选正确项
      'single_wrong',        // 单选错误项
      'same_pinyin',         // 同音字题
      'all_same'            // 全相同读音
    ]

    for (let i = 0; i < count; i++) {
      const type = templateTypes[i % templateTypes.length]
      questions.push(this.createPinyinQuestion(i, type))
    }
    return questions
  }

  /**
   * 创建单个拼音题
   */
  createPinyinQuestion(index, type) {
    const id = 10000 + index
    const year = 2015 + (index % 10)

    if (type === 'single_correct') {
      const correctWords = this.shuffle(pinyinData.words).slice(0, 4)
      return {
        id,
        type: 'pinyin',
        year,
        source: `${year}年语文模拟题`,
        content: '下列词语中加点字的读音，完全正确的一项是（ ）',
        options: JSON.stringify({
          A: `${correctWords[0].word}（${correctWords[0].pinyin}）`,
          B: `${correctWords[1].word}（${correctWords[1].pinyin}）`,
          C: `${correctWords[2].word}（${correctWords[2].pinyin}）`,
          D: `${correctWords[3].word}（${correctWords[3].pinyin}）`
        }),
        answer: 'A',
        explanation: '各项加点字读音均正确。',
        difficulty: 3,
        questionNumber: index + 1,
        tags: JSON.stringify([])
      }
    }

    if (type === 'single_wrong') {
      const correctWords = this.shuffle(pinyinData.words).slice(0, 3)
      const wrongWord = pinyinData.words[index % pinyinData.words.length]
      const wrongPinyin = this.getWrongPinyin(wrongWord.pinyin)
      const positions = ['A', 'B', 'C', 'D']
      const wrongPos = positions[index % 4]

      return {
        id,
        type: 'pinyin',
        year,
        source: `${year}年语文模拟题`,
        content: '下列词语中加点字的读音，不正确的一项是（ ）',
        options: JSON.stringify({
          A: `${pinyinData.words[(index) % 40].word}（${pinyinData.words[(index) % 40].pinyin}）`,
          B: `${pinyinData.words[(index + 1) % 40].word}（${pinyinData.words[(index + 1) % 40].pinyin}）`,
          C: `${pinyinData.words[(index + 2) % 40].word}（${pinyinData.words[(index + 2) % 40].pinyin}）`,
          D: `${pinyinData.words[(index + 3) % 40].word}（${pinyinData.words[(index + 3) % 40].pinyin}）`
        }),
        answer: wrongPos,
        explanation: `${wrongPos}项读音有误。`,
        difficulty: 3,
        questionNumber: index + 1,
        tags: JSON.stringify([])
      }
    }

    return {
      id,
      type: 'pinyin',
      year,
      source: `${year}年语文模拟题`,
      content: '下列词语中加点字的读音，完全正确的一项是（ ）',
      options: JSON.stringify({
        A: '发酵（jiào）',
        B: '处理（chǔ）',
        C: '因为（wèi）',
        D: '角色（jiǎo）'
      }),
      answer: 'A',
      explanation: '',
      difficulty: 3,
      questionNumber: index + 1,
      tags: JSON.stringify([])
    }
  }

  /**
   * 生成古诗词题
   */
  generateLiteratureQuestions(count) {
    const questions = []
    const poemTypes = ['fill_next', 'fill_prev', 'author', 'title']

    for (let i = 0; i < count; i++) {
      const poem = poems[i % poems.length]
      const type = poemTypes[i % poemTypes.length]
      const id = 20000 + i
      const year = 2015 + (i % 10)

      let question, options, answer, explanation

      switch (type) {
        case 'fill_next':
          question = `"${poem.line1}"的下一句是：`
          options = this.shuffle([
            poem.line2,
            poems[(i + 1) % poems.length].line2,
            poems[(i + 2) % poems.length].line2,
            poems[(i + 3) % poems.length].line2
          ])
          answer = 'A'
          explanation = `出自${poem.author}《${poem.title}》`
          break
        case 'fill_prev':
          question = `"${poem.line2}"的上一句是：`
          options = this.shuffle([
            poem.line1,
            poems[(i + 1) % poems.length].line1,
            poems[(i + 2) % poems.length].line1,
            poems[(i + 3) % poems.length].line1
          ])
          answer = 'A'
          explanation = `出自${poem.author}《${poem.title}》`
          break
        case 'author':
          question = `"${poem.line1}，${poem.line2}"的作者是：`
          options = this.shuffle([
            poem.author,
            '李白',
            '杜甫',
            '白居易',
            '王维'
          ].slice(0, 4))
          answer = 'A'
          explanation = `${poem.author}是${['唐', '宋', '东晋'][i % 3]}代诗人。`
          break
        case 'title':
          question = `"${poem.line1}，${poem.line2}"出自：`
          options = this.shuffle([
            `《${poem.title}》`,
            `《${poems[(i + 1) % poems.length].title}》`,
            `《${poems[(i + 2) % poems.length].title}》`,
            `《${poems[(i + 3) % poems.length].title}》`
          ])
          answer = 'A'
          explanation = `作者是${poem.author}。`
          break
      }

      questions.push({
        id,
        type: 'literature',
        year,
        source: `${year}年语文模拟题`,
        content: question,
        options: JSON.stringify(options),
        answer,
        explanation,
        difficulty: 3,
        questionNumber: i + 1,
        tags: JSON.stringify([])
      })
    }
    return questions
  }

  /**
   * 生成成语题
   */
  generateIdiomQuestions(count) {
    const questions = []
    const types = ['meaning', 'usage', 'fill_blank', 'pinyin']

    for (let i = 0; i < count; i++) {
      const idiom = idioms[i % idioms.length]
      const type = types[i % types.length]
      const id = 30000 + i
      const year = 2015 + (i % 10)

      let question, options, answer, explanation

      switch (type) {
        case 'meaning':
          question = `"${idiom.idiom}"的意思是：`
          options = this.shuffle([
            idiom.meaning,
            idioms[(i + 1) % idioms.length].meaning,
            idioms[(i + 2) % idioms.length].meaning,
            '比喻坚持不懈'
          ])
          answer = 'A'
          explanation = `${idiom.idiom}：${idiom.meaning}。`
          break
        case 'usage':
          question = `下列句子中使用"${idiom.idiom}"正确的一项是：`
          options = this.shuffle([
            `虽然遇到了困难，但他${idiom.idiom}，终于成功了。`,
            `他${idiom.idiom}，终于完成了任务。`,
            `这种${idiom.idiom}的行为是不可取的。`,
            `我们应该${idioms[(i + 1) % idioms.length].idiom}，不要放弃。`
          ])
          answer = 'A'
          explanation = `${idiom.idiom}使用正确。`
          break
        case 'pinyin':
          question = `"${idiom.idiom}"的拼音是：`
          options = this.shuffle([
            idiom.pinyin,
            idioms[(i + 1) % idioms.length].pinyin,
            idioms[(i + 2) % idioms.length].pinyin,
            idioms[(i + 3) % idioms.length].pinyin
          ])
          answer = 'A'
          explanation: ''
          break
        default:
          question = `"${idiom.idiom}"的意思是：`
          options = this.shuffle([
            idiom.meaning,
            idioms[(i + 1) % idioms.length].meaning,
            idioms[(i + 2) % idioms.length].meaning,
            '比喻坚持不懈'
          ])
          answer = 'A'
          explanation = ''
      }

      questions.push({
        id,
        type: 'idiom',
        year,
        source: `${year}年语文模拟题`,
        content: question,
        options: JSON.stringify(options),
        answer,
        explanation,
        difficulty: 3,
        questionNumber: i + 1,
        tags: JSON.stringify([])
      })
    }
    return questions
  }

  /**
   * 生成病句修改题
   */
  generateCorrectionQuestions(count) {
    const questions = []
    const errorTypes = [
      '成分残缺',
      '搭配不当',
      '语序不当',
      '表意不明',
      '前后矛盾'
    ]

    const templates = [
      { error: '成分残缺', sentences: [
        '通过这次活动，使我受益匪浅。',
        '在老师的帮助下，让我进步了。',
        '由于天气原因，取消了比赛。',
        '经过老师的教育，使我认识到了错误。'
      ]},
      { error: '搭配不当', sentences: [
        '我们要增加学习效率。',
        '这幅画是我昨天照的。',
        '我们要发扬优点，改正错误。',
        '大家讨论并听取了校长的报告。'
      ]},
      { error: '语序不当', sentences: [
        '博物馆展出了两千多年前新出土的文物。',
        '这位老爷爷是我的一个邻居。',
        '我仔细观察了这位老爷爷的面容。',
        '我们讨论并听取了校长的报告。'
      ]},
      { error: '表意不明', sentences: [
        '三个学校的老师都来了。',
        '他在这里做了一天工作。',
        '这是一个快乐的时刻。',
        '这个电影我看过不感兴趣。'
      ]},
      { error: '前后矛盾', sentences: [
        '这次考试他大概得了满分。',
        '他基本上把作业都完成了。',
        '这部电影我看过不感兴趣。',
        '今天大概肯定会下雨。'
      ]}
    ]

    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length]
      const id = 40000 + i
      const year = 2015 + (i % 10)
      const sentence = template.sentences[i % template.sentences.length]

      const questions = [
        { text: sentence, correct: false },
        { text: '我们应该养成良好的学习习惯。', correct: true },
        { text: '经过老师的教育，他终于认识到了自己的错误。', correct: true },
        { text: '在阅读中，我们可以积累丰富的语言材料。', correct: true }
      ]

      questions[0].correct = true // 第一题设为正确

      questions.push({
        id,
        type: 'correction',
        year,
        source: `${year}年语文模拟题`,
        content: '下列句子中，有语病的一项是（ ）',
        options: JSON.stringify(questions.map((q, idx) => `${['A', 'B', 'C', 'D'][idx]}. ${q.text}`)),
        answer: 'A',
        explanation: `句子存在"${template.error}"问题。`,
        difficulty: 3,
        questionNumber: i + 1,
        tags: JSON.stringify([])
      })
    }
    return questions
  }

  /**
   * 生成词汇题
   */
  generateVocabularyQuestions(count) {
    const questions = []
    const types = ['fill_blank', 'usage', 'meaning', 'synonym']

    const fillTemplates = [
      { context: '__1__，__2__，__3__。', options: ['调试 体貌 功能', '调适 体貌 功绩', '调试 体魄 功绩', '调适 体魄 功能'] },
      { context: '我们__1__学习方法，__2__学习效率，__3__了优异成绩。', options: ['改进 提高 取得', '改善 提高 考取', '改进 改善 考取', '改善 提高 考取'] },
      { context: '__1__着__2__，他__3__地完成了任务。', options: ['带着 兴奋 愉快', '带 兴奋 愉快', '带着 兴奋 愉快', '带 兴奋 愉快'] },
      { context: '经过__1__，他__2__了__3__。', options: ['努力 认识 错误', '努力 认清 失误', '努力 认清 错误', '努力 认清 失误'] },
      { context: '__1__和__2__是__3__的基础。', options: ['词汇 阅读 写作', '词汇 阅读 写作', '词汇 阅读 写作', '词语 阅读 写作'] }
    ]

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length]
      const id = 50000 + i
      const year = 2015 + (i % 10)

      let question, options, answer, explanation

      switch (type) {
        case 'fill_blank':
          const template = fillTemplates[i % fillTemplates.length]
          question = `依次填入下列横线处的词语，最恰当的一项是（ ）\n${template.context}`
          options = template.options
          answer = 'A'
          explanation = '根据语境选择最恰当的词语。'
          break
        default:
          question = '依次填入下列横线处的词语，最恰当的一项是（ ）'
          options = ['调试 体貌 功能', '调适 体貌 功绩', '调试 体魄 功绩', '调适 体魄 功能']
          answer = 'D'
          explanation = '"调适"指调整适应；"体魄"指体格；"功能"指机能。'
      }

      questions.push({
        id,
        type: 'vocabulary',
        year,
        source: `${year}年语文模拟题`,
        content: question,
        options: JSON.stringify(options),
        answer,
        explanation,
        difficulty: 3,
        questionNumber: i + 1,
        tags: JSON.stringify([])
      })
    }
    return questions
  }

  /**
   * 生成阅读理解题
   */
  generateComprehensionQuestions(count) {
    const questions = []
    const passages = [
      {
        title: '关于体育精神的论述',
        content: '体育不仅仅是一种身体活动，更是一种精神追求。通过体育锻炼，我们不仅可以增强体质，还可以培养坚毅的品格和团队合作的精神。'
      },
      {
        title: '关于阅读的论述',
        content: '阅读是人类获取知识的重要途径。通过阅读，我们可以了解古今中外的文化成果，开阔视野，增长见识。'
      },
      {
        title: '关于传统文化的论述',
        content: '传统文化是一个民族的根和魂。保护和传承传统文化，对于维护文化多样性、促进文化创新具有重要意义。'
      }
    ]

    for (let i = 0; i < count; i++) {
      const id = 60000 + i
      const year = 2015 + (i % 10)
      const passage = passages[i % passages.length]

      const questionTypes = ['main_idea', 'detail', 'inference', 'author_attitude']
      const type = questionTypes[i % questionTypes.length]

      let question, options, answer, explanation

      switch (type) {
        case 'main_idea':
          question = '这段文字的主要观点是：'
          options = [
            '体育不仅是身体活动，更是精神追求。',
            '体育锻炼可以增强体质。',
            '团队合作很重要。',
            '体育活动很有趣。'
          ]
          answer = 'A'
          explanation = '从整体内容可以看出，这段话强调体育的精神价值。'
          break
        case 'detail':
          question = '根据文意，下列说法不正确的是：'
          options = [
            '体育锻炼可以增强体质。',
            '体育可以培养坚毅品格。',
            '体育完全是身体活动。',
            '体育能培养团队合作精神。'
          ]
          answer = 'C'
          explanation: '文中明确指出"体育不仅仅是一种身体活动"。'
          break
        case 'inference':
          question = '从文中可以推断出：'
          options = [
            '作者很重视体育精神。',
            '作者不喜欢体育。',
            '体育不重要。',
            '只有体育能培养品格。'
          ]
          answer = 'A'
          explanation: '从文中的积极态度可以推断。'
          break
        default:
          question = '这段文字的主要观点是：'
          options = passage.content.substring(0, 20).split('').slice(0, 4).map((_, idx) => `选项${idx + 1}`)
          answer = 'A'
          explanation = ''
      }

      questions.push({
        id,
        type: 'comprehension',
        year,
        source: `${year}年语文模拟题`,
        content: `【${passage.title}】\n${passage.content}\n\n${question}`,
        options: JSON.stringify(options),
        answer,
        explanation,
        difficulty: 3,
        questionNumber: i + 1,
        tags: JSON.stringify([])
      })
    }
    return questions
  }

  /**
   * 生成语法题
   */
  generateGrammarQuestions(count) {
    const questions = []
    const types = ['punctuation', 'rhetoric', 'sentence_order']

    for (let i = 0; i < count; i++) {
      const id = 70000 + i
      const year = 2015 + (i % 10)
      const type = types[i % types.length]

      let question, options, answer, explanation

      switch (type) {
        case 'punctuation':
          question = '下列句子中标点符号的使用，正确的一项是（ ）'
          options = [
            'A. 人们常会认为体育就是身体活动，是"简单的"体力活动。',
            'B. "唯分数论"观念不变，体育活动仍将是"讲起来次要，做起来次要，忙起来不要"。',
            'C. 一竿在手，钓趣无穷。有晨曦，有落日，有斜风，有细雨。',
            'D. 突然"咔嚓"一声响，断裂的冰块漂移而去。'
          ]
          answer = 'B'
          explanation = 'A项破折号使用不当；C项分号应为逗号；D项省略号使用不当。'
          break
        case 'rhetoric':
          question = '下列句子中，没有使用反问修辞手法的一项是（ ）'
          options = [
            'A. 没有了商品交换的社会，岂不要退回到自给自足的原始状态了吗？',
            'B. 用汉字写的国语，是否来用地方音读呢？不行！',
            'C. 我们已经长大成人，可是所有的大人不都是从孩童时代走来的吗？',
            'D. 哲学家倘若不能从心灵中汲取大部分的快乐，他算什么哲学家呢？'
          ]
          answer = 'C'
          explanation: 'C项是陈述句，不是反问句。'
          break
        default:
          question = '下列句子中标点符号的使用，正确的一项是（ ）'
          options = [
            'A. 人们常说："体育就是身体活动"。',
            'B. 唯分数论观念不变。',
            'C. 今天天气真好。',
            'D. 这很好。'
          ]
          answer = 'A'
          explanation = ''
      }

      questions.push({
        id,
        type: 'grammar',
        year,
        source: `${year}年语文模拟题`,
        content: question,
        options: JSON.stringify(options),
        answer,
        explanation,
        difficulty: 3,
        questionNumber: i + 1,
        tags: JSON.stringify([])
      })
    }
    return questions
  }

  /**
   * 生成所有题目
   */
  generateAll() {
    const allQuestions = []

    // 拼音题 800道
    console.log('生成拼音题...')
    allQuestions.push(...this.generatePinyinQuestions(800))

    // 古诗词题 800道
    console.log('生成古诗词题...')
    allQuestions.push(...this.generateLiteratureQuestions(800))

    // 成语题 800道
    console.log('生成成语题...')
    allQuestions.push(...this.generateIdiomQuestions(800))

    // 病句修改题 600道
    console.log('生成病句修改题...')
    allQuestions.push(...this.generateCorrectionQuestions(600))

    // 词汇题 800道
    console.log('生成词汇题...')
    allQuestions.push(...this.generateVocabularyQuestions(800))

    // 阅读理解题 1200道
    console.log('生成阅读理解题...')
    allQuestions.push(...this.generateComprehensionQuestions(1200))

    // 语法题 400道
    console.log('生成语法题...')
    allQuestions.push(...this.generateGrammarQuestions(400))

    // 添加原始题库（如果需要）
    // allQuestions.push(...originalQuestions)

    console.log(`总共生成 ${allQuestions.length} 道题目`)
    return allQuestions
  }

  /**
   * 工具方法 - 数组乱序
   */
  shuffle(array) {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  /**
   * 获取错误拼音
   */
  getWrongPinyin(correct) {
    const wrongMap = {
      'sù': 'shù',
      'chǔ': 'chù',
      'wèi': 'wéi',
      'jué': 'jiǎo',
      'qiǎng': 'qiǎng',
      'mú': 'mó'
    }
    return wrongMap[correct] || correct.replace(/[āáǎǎ]/g, 'a').replace(/[ēéěě]/g, 'e')
  }
}

// 生成并导出题库
const generator = new QuestionGenerator()
const questionBank = generator.generateAll()

console.log(JSON.stringify(questionBank, null, 2))
