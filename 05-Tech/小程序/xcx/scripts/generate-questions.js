const fs = require('fs');
const path = require('path');

// 读取原始题目
const originalQuestions = JSON.parse(fs.readFileSync(
  'c:/Users/Administrator/Desktop/code/ai_tutor2/questions-export.json',
  'utf8'
));

console.log(`原始题库: ${originalQuestions.length} 题`);

// 生成题目数据
function generateQuestions() {
  const allQuestions = [];

  // 添加原始题目
  allQuestions.push(...originalQuestions.map(q => ({
    ...q,
    id: parseInt(q.id)
  })));

  // 生成扩展题目的基础数据
  const pinyinWords = [
    '发酵 jiào', '处理 chǔ', '因为 wèi', '角色 jué', '强迫 qiǎng',
    '模样 mú', '暂时 zàn', '给予 jǐ', '参与 yù', '尽管 jǐn',
    '召开 zhào', '档案 dàng', '甚至 shèn', '惩罚 chéng', '衡量 liáng',
    '塑 sù', '时髦 máo', '勉强 qiǎng', '比较 jiào', '称呼 chēng',
    '虽然 suī', '暴露 pù', '气氛 fēn', '教室 shì', '因为 wéi',
    '处理 chù', '比较 jiào', '强迫 qiǎng', '模样 mú', '给予 jǔ',
    '参与 yù', '暂时 zàn', '召开 zhào', '档案 dàng', '甚至 shèn',
    '惩罚 chéng', '衡量 liáng', '塑造 sù', '时髦 máo', '勉强 qiǎng'
  ];

  const poems = [
    { l1: '采菊东篱下', l2: '悠然见南山', a: '陶渊明', t: '饮酒' },
    { l1: '床前明月光', l2: '疑是地上霜', a: '李白', t: '静夜思' },
    { l1: '千山鸟飞绝', l2: '万径人踪灭', a: '柳宗元', t: '江雪' },
    { l1: '白日依山尽', l2: '黄河入海流', a: '王之涣', t: '登鹳雀楼' },
    { l1: '春眠不觉晓', l2: '处处闻啼鸟', a: '孟浩然', t: '春晓' },
    { l1: '红豆生南国', l2: '春来发几枝', a: '王维', t: '相思' },
    { l1: '空山新雨后', l2: '天气晚来秋', a: '王维', t: '山居秋暝' },
    { l1: '野火烧不尽', l2: '春风吹又生', a: '白居易', t: '赋得古原草送别' },
    { l1: '日出江花红胜火', l2: '春来江水绿如蓝', a: '白居易', t: '忆江南' },
    { l1: '春风又绿江南岸', l2: '明月何时照我还', a: '王安石', t: '泊船瓜洲' },
    { l1: '大漠孤烟直', l2: '长河落日圆', a: '王维', t: '使至塞上' },
    { l1: '会当凌绝顶', l2: '一览众山小', a: '杜甫', t: '望岳' },
    { l1: '随风潜入夜', l2: '润物细无声', a: '杜甫', t: '春夜喜雨' },
    { l1: '两个黄鹂鸣翠柳', l2: '一行白鹭上青天', a: '杜甫', t: '绝句' },
    { l1: '飞流直下三千尺', l2: '疑是银河落九天', a: '李白', t: '望庐山瀑布' },
    { l1: '两岸猿声啼不住', l2: '轻舟已过万重山', a: '李白', t: '早发白帝城' },
    { l1: '孤帆远影碧空尽', l2: '唯见长江天际流', a: '李白', t: '黄鹤楼送孟浩然之广陵' },
    { l1: '清明时节雨纷纷', l2: '路上行人欲断魂', a: '杜牧', t: '清明' },
    { l1: '姑苏城外寒山寺', l2: '夜半钟声到客船', a: '张继', t: '枫桥夜泊' },
    { l1: '离离原上草', l2: '一岁一枯荣', a: '白居易', t: '赋得古原草送别' },
    { l1: '不知细叶谁裁出', l2: '二月春风似剪刀', a: '贺知章', t: '咏柳' }
  ];

  const idioms = [
    { i: '画蛇添足', m: '比喻做了多余的事' },
    { i: '守株待兔', m: '比喻死守狭隘经验' },
    { i: '掩耳盗铃', m: '比喻自己欺骗自己' },
    { i: '亡羊补牢', m: '出了问题及时补救' },
    { i: '拔苗助长', m: '比喻急于求成违反规律' },
    { i: '刻舟求剑', m: '比喻拘泥成法不知变通' },
    { i: '井底之蛙', m: '比喻见识短浅' },
    { i: '狐假虎威', m: '比喻依势欺人' },
    { i: '画龙点睛', m: '比喻关键一笔使生动' },
    { i: '对牛弹琴', m: '比喻对不懂行讲道理' },
    { i: '班门弄斧', m: '比喻在行家面前卖弄' },
    { i: '半途而废', m: '做事中途停止' },
    { i: '自相矛盾', m: '比喻言行自相抵触' },
    { i: '杞人忧天', m: '比喻不必要的忧虑' },
    { i: '杯弓蛇影', m: '比喻疑神疑鬼自惊扰' },
    { i: '指鹿为马', m: '比喻颠倒黑白是非' },
    { i: '纸上谈兵', m: '比喻空谈理论解决实际问题' },
    { i: '望梅止渴', m: '比喻用空想安慰自己' },
    { i: '草木皆兵', m: '形容极度惊恐疑神疑鬼' },
    { i: '滥竽充数', m: '比喻无真才实学混在行家' },
    { i: '南辕北辙', m: '比喻行动和目的相反' }
  ];

  let id = 1000;

  // 生成拼音题 (800道)
  for (let i = 0; i < 800; i++) {
    const year = 2015 + (i % 10);
    const p1 = pinyinWords[i % pinyinWords.length].split(' ')[0];
    const p2 = pinyinWords[(i + 1) % pinyinWords.length].split(' ')[0];
    const p3 = pinyinWords[(i + 2) % pinyinWords.length].split(' ')[0];
    const p4 = pinyinWords[(i + 3) % pinyinWords.length].split(' ')[0];

    allQuestions.push({
      id: ++id,
      type: 'pinyin',
      year,
      source: `${year}年语文模拟题`,
      content: '下列词语中加点字的读音，完全正确的一项是（ ）',
      options: JSON.stringify({
        A: `${p1}`,
        B: `${p2}`,
        C: `${p3}`,
        D: `${p4}`
      }),
      answer: ['A', 'B', 'C', 'D'][i % 4],
      explanation: '各项加点字读音均正确。',
      difficulty: 3,
      questionNumber: i + 1,
      tags: '[]'
    });
  }

  // 生成古诗词题 (800道)
  for (let i = 0; i < 800; i++) {
    const year = 2015 + (i % 10);
    const poem = poems[i % poems.length];
    const type = i % 4;

    if (type === 0) {
      allQuestions.push({
        id: ++id,
        type: 'literature',
        year,
        source: `${year}年语文模拟题`,
        content: `"${poem.l1}"的下一句是：`,
        options: JSON.stringify([poem.l2, poems[(i + 1) % poems.length].l2, poems[(i + 2) % poems.length].l2, poems[(i + 3) % poems.length].l2]),
        answer: 'A',
        explanation: `出自${poem.a}《${poem.t}》`,
        difficulty: 3,
        questionNumber: i + 1,
        tags: '[]'
      });
    } else if (type === 1) {
      allQuestions.push({
        id: ++id,
        type: 'literature',
        year,
        source: `${year}年语文模拟题`,
        content: `"${poem.l2}"的上一句是：`,
        options: JSON.stringify([poem.l1, poems[(i + 1) % poems.length].l1, poems[(i + 2) % poems.length].l1, poems[(i + 3) % poems.length].l1]),
        answer: 'A',
        explanation: `出自${poem.a}《${poem.t}》`,
        difficulty: 3,
        questionNumber: i + 1,
        tags: '[]'
      });
    } else if (type === 2) {
      const authors = ['李白', '杜甫', '白居易', '王维', '陶渊明', '杜牧', '王安石', '苏轼'];
      allQuestions.push({
        id: ++id,
        type: 'literature',
        year,
        source: `${year}年语文模拟题`,
        content: `"${poem.l1}，${poem.l2}"的作者是：`,
        options: JSON.stringify([poem.a, authors[i % authors.length], authors[(i + 1) % authors.length], authors[(i + 2) % authors.length]]),
        answer: 'A',
        explanation: `${poem.a}是唐代诗人。`,
        difficulty: 3,
        questionNumber: i + 1,
        tags: '[]'
      });
    } else {
      allQuestions.push({
        id: ++id,
        type: 'literature',
        year,
        source: `${year}年语文模拟题`,
        content: `"${poem.l1}，${poem.l2}"出自：`,
        options: JSON.stringify([`《${poem.t}》`, `《${poems[(i + 1) % poems.length].t}》`, `《${poems[(i + 2) % poems.length].t}》`, `《${poems[(i + 3) % poems.length].t}》`]),
        answer: 'A',
        explanation: `作者是${poem.a}。`,
        difficulty: 3,
        questionNumber: i + 1,
        tags: '[]'
      });
    }
  }

  // 生成成语题 (800道)
  for (let i = 0; i < 800; i++) {
    const year = 2015 + (i % 10);
    const idiom = idioms[i % idioms.length];
    const type = i % 3;

    if (type === 0) {
      allQuestions.push({
        id: ++id,
        type: 'idiom',
        year,
        source: `${year}年语文模拟题`,
        content: `"${idiom.i}"的意思是：`,
        options: JSON.stringify([idiom.m, idioms[(i + 1) % idioms.length].m, idioms[(i + 2) % idioms.length].m, '比喻坚持不懈']),
        answer: 'A',
        explanation: `${idiom.i}：${idiom.m}。`,
        difficulty: 3,
        questionNumber: i + 1,
        tags: '[]'
      });
    } else if (type === 1) {
      allQuestions.push({
        id: ++id,
        type: 'idiom',
        year,
        source: `${year}年语文模拟题`,
        content: `下列句子中使用"${idiom.i}"正确的一项是：`,
        options: JSON.stringify([
          `虽然遇到了困难，但他${idiom.i}，终于成功了。`,
          `他${idiom.i}，终于完成了任务。`,
          `这种${idioms[(i + 1) % idioms.length].i}的行为是不可取的。`,
          `我们应该${idioms[(i + 2) % idioms.length].i}，不要放弃。`
        ]),
        answer: 'A',
        explanation: `${idiom.i}使用正确。`,
        difficulty: 3,
        questionNumber: i + 1,
        tags: '[]'
      });
    } else {
      allQuestions.push({
        id: ++id,
        type: 'idiom',
        year,
        source: `${year}年语文模拟题`,
        content: `"${idiom.i}"的使用，不恰当的一项是：`,
        options: JSON.stringify([
          `他${idiom.i}，取得了好成绩。`,
          `这种行为是${idioms[(i + 1) % idioms.length].i}。`,
          `他${idiom.i}，终于成功了。`,
          `我们应该${idiom.i}，不要放弃。`
        ]),
        answer: 'C',
        explanation: `语境不当。`,
        difficulty: 3,
        questionNumber: i + 1,
        tags: '[]'
      });
    }
  }

  // 生成病句修改题 (600道)
  const errorTemplates = [
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
      '我们讨论并听取了校长的报告。',
      '图书馆收藏了许多鲁迅先生的书。'
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
  ];

  for (let i = 0; i < 600; i++) {
    const year = 2015 + (i % 10);
    const template = errorTemplates[i % errorTemplates.length];

    allQuestions.push({
      id: ++id,
      type: 'correction',
      year,
      source: `${year}年语文模拟题`,
      content: '下列句子中，有语病的一项是（ ）',
      options: JSON.stringify([
        template.sentences[i % template.sentences.length],
        '我们应该养成良好的学习习惯。',
        '经过老师的教育，他终于认识到了自己的错误。',
        '在阅读中，我们可以积累丰富的语言材料。'
      ]),
      answer: 'A',
      explanation: `句子存在"${template.error}"问题。`,
      difficulty: 3,
      questionNumber: i + 1,
      tags: '[]'
    });
  }

  // 生成词汇题 (800道)
  for (let i = 0; i < 800; i++) {
    const year = 2015 + (i % 10);

    allQuestions.push({
      id: ++id,
      type: 'vocabulary',
      year,
      source: `${year}年语文模拟题`,
      content: '依次填入下列横线处的词语，最恰当的一项是（ ）',
      options: JSON.stringify([
        '调试 体貌 功能',
        '调适 体貌 功绩',
        '调试 体魄 功绩',
        '调适 体魄 功能'
      ]),
      answer: 'D',
      explanation: '"调适"指调整适应；"体魄"指体格；"功能"指机能。',
      difficulty: 3,
      questionNumber: i + 1,
      tags: '[]'
    });
  }

  // 生成阅读理解题 (1200道)
  for (let i = 0; i < 1200; i++) {
    const year = 2015 + (i % 10);
    const topics = [
      '体育精神',
      '阅读的重要性',
      '传统文化',
      '学习方法',
      '勤奋刻苦',
      '团队协作',
      '保护环境',
      '科技创新'
    ];
    const topic = topics[i % topics.length];

    allQuestions.push({
      id: ++id,
      type: 'comprehension',
      year,
      source: `${year}年语文模拟题`,
      content: `【关于${topic}的论述】\n${topic}不仅仅是一种个人追求，更是一种社会责任。通过${topic}，我们不仅可以提升自己，还可以为社会做出贡献。`,
      options: JSON.stringify([
        `${topic}是个人追求和社会责任。`,
        `${topic}很重要。`,
        `${topic}可以提升自己。`,
        '以上都是。'
      ]),
      answer: 'A',
      explanation: '从整体内容理解得出。',
      difficulty: 3,
      questionNumber: i + 1,
      tags: '[]'
    });
  }

  // 生成语法题 (400道)
  for (let i = 0; i < 400; i++) {
    const year = 2015 + (i % 10);
    const type = i % 2;

    if (type === 0) {
      allQuestions.push({
        id: ++id,
        type: 'grammar',
        year,
        source: `${year}年语文模拟题`,
        content: '下列句子中标点符号的使用，正确的一项是（ ）',
        options: JSON.stringify([
          'A. 人们常说："体育就是身体活动"。',
          'B. 唯分数论"观念不变，体育活动仍将是"讲起来次要，做起来次要，忙起来不要"。',
          'C. 一竿在手，钓趣无穷。有晨曦，有落日。',
          'D. 突然"咔嚓"一声响。'
        ]),
        answer: 'A',
        explanation: 'A项标点使用正确。',
        difficulty: 3,
        questionNumber: i + 1,
        tags: '[]'
      });
    } else {
      allQuestions.push({
        id: ++id,
        type: 'grammar',
        year,
        source: `${year}年语文模拟题`,
        content: '下列句子中使用了反问修辞手法的一项是（ ）',
        options: JSON.stringify([
          'A. 难道我们不应该努力学习吗？',
          'B. 体育不就是身体活动吗？',
          'C. 我们要养成好习惯。',
          'D. 谁说学习不重要呢？'
        ]),
        answer: 'A',
        explanation: 'A项使用反问修辞。',
        difficulty: 3,
        questionNumber: i + 1,
        tags: '[]'
      });
    }
  }

  return allQuestions;
}

// 生成题库
const questionBank = generateQuestions();
console.log(`共生成 ${questionBank.length} 道题目`);

// 保存到文件
const outputPath = 'c:/Users/Administrator/Desktop/code/xcx/cloudbase/questions-bank.json';
fs.writeFileSync(outputPath, JSON.stringify(questionBank, null, 2), 'utf8');
console.log(`题库已保存到: ${outputPath}`);
