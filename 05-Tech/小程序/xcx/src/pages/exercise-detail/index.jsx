/**
 * 练习详情页面
 * 支持从题库中随机抽取题目，每次练习题目不同
 */
import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Radio, Checkbox } from '@tarojs/components'
import Taro, { getCurrentInstance, navigateBack, useDidShow, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import questionService from '../../services/question'
import studyService from '../../services/study'
import { QUESTION_TYPES } from '../../utils/constants'
import { pageShareConfigs } from '../../utils/share'
import './index.less'

// 收藏状态缓存（用于存储当前用户已收藏的题目ID）
let FAVORITES_CACHE = new Set()

// 题库数据缓存
let ALL_QUESTIONS_CACHE = null

// 获取所有题目（从question service或本地生成）
const getAllQuestions = () => {
  if (ALL_QUESTIONS_CACHE) {
    return ALL_QUESTIONS_CACHE
  }

  // 基础题目
  const baseQuestions = [
    // 拼音题
    { id: 'py001', type: 'pinyin', question: '下列加点字注音完全正确的一项是：', options: ['A. 狡狞(níng)', 'B. 机械(jiè)', 'C. 同仇敌忾(kài)', 'D. 玷污(zhēn)'], correctAnswer: 2, explanation: 'C项注音完全正确。' },
    { id: 'py002', type: 'pinyin', question: '下列词语中加点字的读音，与所给注音全部相同的一项是：', options: ['A. 供 gòng 供给 供认 供品', 'B. 角 jué 角色 口角 角逐', 'C. 强 qiáng 强迫 倔强 强壮', 'D. 处 chǔ 处理 处分 处所'], correctAnswer: 1, explanation: 'B项全部读jué。' },
    { id: 'py003', type: 'pinyin', question: '"参"在"参加"中读：', options: ['A. cēn', 'B. shēn', 'C. cān', 'D. cī'], correctAnswer: 2, explanation: '"参"在"参加"中读cān。' },
    { id: 'py004', type: 'pinyin', question: '"薄"在"薄雾"中读：', options: ['A. báo', 'B. bó', 'C. bò', 'D. bē'], correctAnswer: 0, explanation: '"薄"在"薄雾"中读báo。' },
    { id: 'py005', type: 'pinyin', question: '下列加点字读音完全正确的一项是：', options: ['A. 贮蓄(zhù) 菡萏(hàn) 酝酿(niàng)', 'B. 粗糙(cāo) 确凿(záo) 唯妙唯肖(xiào)', 'C. 讪笑(shàn) 挑衅(xìn) 哂笑(xī)', 'D. 媲美(pì) 缄默(jiān) 酷肖(xiào)'], correctAnswer: 0, explanation: 'A项正确。' },
    { id: 'py006', type: 'pinyin', question: '"翘"在"翘首"中读：', options: ['A. qiào', 'B. qiáo', 'C. qiāo', 'D. qiü'], correctAnswer: 1, explanation: '"翘"在"翘首"中读qiáo。' },
    { id: 'py007', type: 'pinyin', question: '下列加点字注音有误的一项是：', options: ['A. 菜畦(qí) 确凿(záo)', 'B. 脑髓(suǐ) 伛偻(lǚ)', 'C. 盔甲(kuī) 骊歌(lí)', 'D. 逾越(yù) 栖息(qī)'], correctAnswer: 1, explanation: 'B项"伛偻"的"偻"应读lǚ。' },
    { id: 'py008', type: 'pinyin', question: '"模"在"模样"中读：', options: ['A. mó', 'B. mú', 'C. mǒ', 'D. mù'], correctAnswer: 1, explanation: '"模"在"模样"中读mú。' },
    { id: 'py009', type: 'pinyin', question: '下列加点字注音完全正确的一项是：', options: ['A. 褶皱(zhě) 狩猎(shòu) 蜷缩(juǎn)', 'B. 嗔视(chēn) 娴熟(xián) 惩罚(chěng)', 'C. 剽悍(piāo) 旖旎(yǐ) 畸形(qí)', 'D. 氛围(fèn) 殷红(yīn) 龟裂(jūn)'], correctAnswer: 2, explanation: 'C项正确。' },
    { id: 'py010', type: 'pinyin', question: '"咽"在"狼吞虎咽"中读：', options: ['A. yàn', 'B. yān', 'C. yè', 'D. yīn'], correctAnswer: 0, explanation: '"咽"在"狼吞虎咽"中读yàn。' },
    // 成语题
    { id: 'cy001', type: 'idiom', question: '下列成语中使用正确的一项是：', options: ['A. 电影情节自相矛盾', 'B. 文章见解不同凡响', 'C. 经济发展举世瞩目', 'D. 失利后重整旗鼓'], correctAnswer: 3, explanation: 'D项"重整旗鼓"使用正确。' },
    { id: 'cy002', type: 'idiom', question: '"画蛇添足"比喻：', options: ['A. 做事要认真', 'B. 做多余的事反不好', 'C. 抓住机会', 'D. 坚持到底'], correctAnswer: 1, explanation: '"画蛇添足"比喻做了多余的事。' },
    { id: 'cy003', type: 'idiom', question: '下列成语使用不恰当的一项是：', options: ['A. 脱颖而出', 'B. 感人肺腑', 'C. 半途而废、坚持不懈', 'D. 独具匠心'], correctAnswer: 2, explanation: 'C项"坚持不懈"不能形容"半途而废"。' },
    { id: 'cy004', type: 'idiom', question: '"守株待兔"比喻：', options: ['A. 善于观察', 'B. 死守不知变通', 'C. 有耐心', 'D. 运气重要'], correctAnswer: 1, explanation: '"守株待兔"比喻死守经验不知变通。' },
    { id: 'cy005', type: 'idiom', question: '"亡羊补牢"的意思是：', options: ['A. 羊丢了不找', 'B. 出问题后补救', 'C. 修理羊圈', 'D. 预防问题'], correctAnswer: 1, explanation: '"亡羊补牢"比喻出了问题及时补救。' },
    { id: 'cy006', type: 'idiom', question: '"夸夸其谈"的意思是：', options: ['A. 说话好听', 'B. 浮夸不实际', 'C. 夸奖别人', 'D. 谈论夸夸'], correctAnswer: 1, explanation: '"夸夸其谈"形容说话浮夸。' },
    { id: 'cy007', type: 'idiom', question: '下列成语书写正确的一项是：', options: ['A. 巧夺天公', 'B. 迫不急待', 'C. 谈笑风生', 'D. 再接再励'], correctAnswer: 2, explanation: 'C项正确。' },
    { id: 'cy008', type: 'idiom', question: '"胸有成竹"比喻：', options: ['A. 心里有竹子', 'B. 做事有把握', 'C. 喜欢画画', 'D. 胸部宽广'], correctAnswer: 1, explanation: '"胸有成竹"比喻做事有把握。' },
    { id: 'cy009', type: 'idiom', question: '下列加点成语使用正确的一项是：', options: ['A. 他做事一丝不苟', 'B. 这次会议万人空巷', 'C. 他总是袖手旁观', 'D. 这篇文章别出心裁'], correctAnswer: 0, explanation: 'A项"一丝不苟"使用正确。' },
    { id: 'cy010', type: 'idiom', question: '"津津有味"的意思是：', options: ['A. 味道好', 'B. 兴趣浓厚', 'C. 津津有味', 'D. 很有味道'], correctAnswer: 1, explanation: '"津津有味"形容兴趣浓厚。' },
    // 词汇题
    { id: 'vo001', type: 'vocabulary', question: '"姹紫嫣红"的意思是：', options: ['A. 颜色单一', 'B. 各种花朵娇艳', 'C. 紫色红色', 'D. 花朵凋零'], correctAnswer: 1, explanation: '"姹紫嫣红"形容各种颜色花朵娇艳。' },
    { id: 'vo002', type: 'vocabulary', question: '下列词语中没有错别字的一项是：', options: ['A. 再接再励', 'B. 谈笑风生', 'C. 巧夺天公', 'D. 迫不急待'], correctAnswer: 1, explanation: 'B项正确。' },
    { id: 'vo003', type: 'vocabulary', question: '"美轮美奂"形容：', options: ['A. 美丽风景', 'B. 高大华丽建筑', 'C. 美丽的人', 'D. 美好音乐'], correctAnswer: 1, explanation: '"美轮美奂"形容房屋高大华丽。' },
    { id: 'vo004', type: 'vocabulary', question: '"鳞次栉比"的意思是：', options: ['A. 排列密', 'B. 鱼和梳子', 'C. 次序混乱', 'D. 整齐稀疏'], correctAnswer: 0, explanation: '"鳞次栉比"形容建筑物排列密整。' },
    { id: 'vo005', type: 'vocabulary', question: '"川流不息"的"川"意思是：', options: ['A. 山川', 'B. 河流', 'C. 平原', 'D. 道路'], correctAnswer: 1, explanation: '"川"指河流。' },
    { id: 'vo006', type: 'vocabulary', question: '"因地制宜"的意思是：', options: ['A. 根据当地制定措施', 'B. 改造环境', 'C. 适应环境', 'D. 改变制度'], correctAnswer: 0, explanation: '"因地制宜"指根据情况制定办法。' },
    { id: 'vo007', type: 'vocabulary', question: '下列词语解释有误的一项是：', options: ['A. 凛冽：寒冷', 'B. 逶迤：弯曲', 'C. 妥帖：恰当', 'D. 俨然：严肃'], correctAnswer: 3, explanation: 'D项"俨然"主要指很像。' },
    { id: 'vo008', type: 'vocabulary', question: '"不可思议"的意思是：', options: ['A. 无法想象', 'B. 不可议论', 'C. 很神奇', 'D. 不讲理'], correctAnswer: 0, explanation: '"不可思议"形容难以想象。' },
    { id: 'vo009', type: 'vocabulary', question: '下列词语中没有错别字的一项是：', options: ['A. 焕然一新', 'B. 谈笑风声', 'C. 迫不急待', 'D. 再接再励'], correctAnswer: 0, explanation: 'A项正确。' },
    { id: 'vo010', type: 'vocabulary', question: '"抑扬顿挫"形容：', options: ['A. 声音高低起伏', 'B. 抑制', 'C. 挫折', 'D. 停顿'], correctAnswer: 0, explanation: '"抑扬顿挫"形容声音高低起伏和谐。' },
    // 病句题
    { id: 'bc001', type: 'correction', question: '下列句子中没有语病的一项是：', options: ['A. 通过活动，使我明白', 'B. 态度端正，成绩提高', 'C. 打扫教室卫生', 'D. 改进方法，增加效率'], correctAnswer: 1, explanation: 'B项无语病。' },
    { id: 'bc002', type: 'correction', question: '"增加效率"的错误类型是：', options: ['A. 语序不当', 'B. 搭配不当', 'C. 成分残缺', 'D. 表意不明'], correctAnswer: 1, explanation: '"增加"与"效率"搭配不当。' },
    { id: 'bc003', type: 'correction', question: '下列句子中有语病的一项是：', options: ['A. 北京秋天美丽', 'B. 文章观点深刻', 'C. 穿着上衣戴帽子', 'D. 养成学习习惯'], correctAnswer: 2, explanation: 'C项搭配不当。' },
    { id: 'bc004', type: 'correction', question: '"通过学习，使我受益"病因是：', options: ['A. 成分残缺', 'B. 搭配不当', 'C. 语序不当', 'D. 结构混乱'], correctAnswer: 0, explanation: '滥用介词导致主语缺失。' },
    { id: 'bc005', type: 'correction', question: '修改"稻米是主要粮食"正确的是：', options: ['A. 稻米是粮食', 'B. 稻米是粮食作物', 'C. 粮食是稻米', 'D. 稻米是主要'], correctAnswer: 1, explanation: '应改为"稻米是粮食作物"。' },
    { id: 'bc006', type: 'correction', question: '下列没有语病的一项是：', options: ['A. 文章对我有兴趣', 'B. 我对文章有兴趣', 'C. 文章引起兴趣', 'D. 文章让我感兴趣'], correctAnswer: 2, explanation: 'C项无语病。' },
    { id: 'bc007', type: 'correction', question: '"即使遇到挫折，也要坚持"：', options: ['A. 有语病', 'B. 无语病', 'C. 缺主语', 'D. 搭配不当'], correctAnswer: 1, explanation: '这句话无语病。' },
    { id: 'bc008', type: 'correction', question: '下列有语病的一项是：', options: ['A. 培养习惯', 'B. 明白道理', 'C. 努力取得成绩', 'D. 作者是鲁迅写的'], correctAnswer: 3, explanation: 'D项句式杂糅。' },
    { id: 'bc009', type: 'correction', question: '下列句子没有语病的一项是：', options: ['A. 通过学习使我进步', 'B. 他进步了', 'C. 他穿着衣服和帽子', 'D. 提高工作效率'], correctAnswer: 3, explanation: 'D项无语病。' },
    { id: 'bc010', type: 'correction', question: '"这本书的作者是鲁迅写的"病因是：', options: ['A. 成分残缺', 'B. 句式杂糅', 'C. 搭配不当', 'D. 表意不明'], correctAnswer: 1, explanation: '句式杂糅。' },
    // 古诗词题
    { id: 'gs001', type: 'literature', question: '"采菊东篱下，悠然见南山"出自谁：', options: ['A. 李白', 'B. 杜甫', 'C. 陶渊明', 'D. 王维'], correctAnswer: 2, explanation: '陶渊明《饮酒》。' },
    { id: 'gs002', type: 'literature', question: '"海内存知己，天涯若比邻"出自：', options: ['A. 王勃', 'B. 李白', 'C. 王维', 'D. 杜甫'], correctAnswer: 0, explanation: '王勃《送杜少府之任蜀州》。' },
    { id: 'gs003', type: 'literature', question: '"春眠不觉晓"下一句是：', options: ['A. 花落知多少', 'B. 处处闻啼鸟', 'C. 夜来风雨声', 'D. 江清月近人'], correctAnswer: 1, explanation: '"春眠不觉晓，处处闻啼鸟"。' },
    { id: 'gs004', type: 'literature', question: '"但愿人长久"下一句是：', options: ['A. 千里共婵娟', 'B. 明月几时有', 'C. 把酒问青天', 'D. 何似在人间'], correctAnswer: 0, explanation: '"但愿人长久，千里共婵娟"。' },
    { id: 'gs005', type: 'literature', question: '"会当凌绝顶"下一句是：', options: ['A. 一览众山小', 'B. 造化钟神秀', 'C. 决眦入归鸟', 'D. 荡胸生层云'], correctAnswer: 0, explanation: '"会当凌绝顶，一览众山小》。' },
    { id: 'gs006', type: 'literature', question: '"人生自古谁无死"下一句是：', options: ['A. 留取丹心照汗青', 'B. 身世浮沉雨打萍', 'C. 惶恐滩头说惶恐', 'D. 干戈寥落四周星'], correctAnswer: 0, explanation: '文天祥《过零丁洋》。' },
    { id: 'gs007', type: 'literature', question: '"落红不是无情物"下一句是：', options: ['A. 化作春泥更护花', 'B. 浩荡离愁白日斜', 'C. 吟鞭东指即天涯', 'D. 伴我直到 Subcommittee'], correctAnswer: 0, explanation: '龚自珍《己亥杂诗》。' },
    { id: 'gs008', type: 'literature', question: '"大漠孤烟直"下一句是：', options: ['A. 长河落日圆', 'B. 萧关逢候骑', 'C. 都护在燕然', 'D. 征蓬出汉塞'], correctAnswer: 0, explanation: '王维《使至塞上》。' },
    { id: 'gs009', type: 'literature', question: '"商女不知亡国恨"下一句是：', options: ['A. 隔江犹唱后庭花', 'B. 烟笼寒水月笼沙', 'C. 夜泊秦淮近酒家', 'D. 三山半落青天外'], correctAnswer: 0, explanation: '杜牧《泊秦淮》。' },
    { id: 'gs010', type: 'literature', question: '"山重水复疑无路"下一句是：', options: ['A. 柳暗花明又一村', 'B. 丰年留客足鸡豚', 'C. 山重水复疑无路', 'D. 柳暗花明'], correctAnswer: 0, explanation: '陆游《游山西村》。' }
  ]

  // 生成扩展题目
  const extendedQuestions = generateExtendedQuestions()

  ALL_QUESTIONS_CACHE = [...baseQuestions, ...extendedQuestions]
  return ALL_QUESTIONS_CACHE
}

// 生成扩展题目（带真实干扰项）
const generateExtendedQuestions = () => {
  const questions = []
  let id = 200

  // 多音字题库
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
      explanation: `"${p.char}"在"${p.words[1]}"中读${p.readings[1]}。`
    })
  })

  // 成语题库
  const idioms = [
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
    { name: '画龙点睛', meaning: '比喻在关键处加上一笔，使内容更生动传神' }
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
      explanation: i.meaning
    })
  })

  // 词汇题库
  const vocabWords = [
    { word: '焕然一新', error: '换然一新' },
    { word: '谈笑风生', error: '谈笑风声' },
    { word: '迫在眉睫', error: '迫在眉捷' },
    { word: '再接再厉', error: '再接再励' },
    { word: '相得益彰', error: '相得益章' },
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
    { word: '流连忘返', error: '留连忘返' }
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
      explanation: `${`ABCD`[correctIndex]}项"${v.word}"正确。`
    })
  })

  // 病句题库
  const errorTypes = [
    { type: '成分残缺', example: '通过学习，使我受益' },
    { type: '搭配不当', example: '增加效率' },
    { type: '句式杂糅', example: '这本书的作者是鲁迅写的' },
    { type: '表意不明', example: '两个学校的老师都来了' },
    { type: '语序不当', example: '博物馆展出了两千多年前新出土的文物' },
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
      explanation: `${e.type}。`
    })
  })

  // 古诗词题库
  const poems = [
    { q: '白日依山尽', a: '黄河入海流', author: '王之涣', title: '登鹳雀楼' },
    { q: '欲穷千里目', a: '更上一层楼', author: '王之涣', title: '登鹳雀楼' },
    { q: '床前明月光', a: '疑是地上霜', author: '李白', title: '静夜思' },
    { q: '举头望明月', a: '低头思故乡', author: '李白', title: '静夜思' },
    { q: '劝君更尽一杯酒', a: '西出阳关无故人', author: '王维', title: '送元二使安西' },
    { q: '桃花潭水深千尺', a: '不及汪伦送我情', author: '李白', title: '赠汪伦' },
    { q: '莫愁前路无知己', a: '天下谁人不识君', author: '高适', title: '别董大' },
    { q: '夜来风雨声', a: '花落知多少', author: '孟浩然', title: '春晓' },
    { q: '国破山河在', a: '城春草木深', author: '杜甫', title: '春望' },
    { q: '感时花溅泪', a: '恨别鸟惊心', author: '杜甫', title: '春望' },
    { q: '烽火连三月', a: '家书抵万金', author: '杜甫', title: '春望' },
    { q: '孤帆远影碧空尽', a: '唯见长江天际流', author: '李白', title: '黄鹤楼送孟浩然之广陵' },
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
      explanation: `${p.author}《${p.title}》。`
    })
  })

  return questions
}

function ExerciseDetail() {
  const instance = getCurrentInstance()
  const params = instance.router.params
  const type = params.type || QUESTION_TYPES.SINGLE_CHOICE
  const mode = params.mode || 'type'
  const count = parseInt(params.count) || 10  // 支持自定义题目数量

  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [startTime, setStartTime] = useState(Date.now())
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  // 使用 useDidShow 确保题目在页面显示时加载
  useDidShow(() => {
    setStartTime(Date.now())
    loadQuestions()
    loadFavorites()
  })

  // 启用页面分享
  useShareAppMessage(() => {
    return pageShareConfigs.exercise
  })

  // 启用朋友圈分享
  useShareTimeline(() => {
    return {
      title: pageShareConfigs.exercise.title,
      query: ''
    }
  })

  /**
   * 加载用户的收藏列表（缓存到 FAVORITES_CACHE）
   */
  const loadFavorites = async () => {
    try {
      const favorites = await questionService.getFavorites(1, 1000)
      FAVORITES_CACHE = new Set(favorites.map(f => f.id || f._id))
      // 更新当前题目收藏状态
      updateCurrentFavoriteStatus()
    } catch (err) {
      console.error('加载收藏列表失败:', err)
    }
  }

  /**
   * 更新当前题目的收藏状态
   */
  const updateCurrentFavoriteStatus = () => {
    if (currentQuestion) {
      const questionId = currentQuestion.id || currentQuestion._id
      setIsFavorited(FAVORITES_CACHE.has(questionId))
    }
  }

  /**
   * 切换收藏状态
   */
  const handleToggleFavorite = async () => {
    if (!currentQuestion || favoriteLoading) return

    const questionId = currentQuestion.id || currentQuestion._id
    setFavoriteLoading(true)

    try {
      // 传递完整的题目数据
      const questionData = {
        id: questionId,
        type: currentQuestion.type || 'vocabulary',
        question: currentQuestion.question || currentQuestion.questionText || '',
        options: currentQuestion.options || [],
        correctAnswer: currentQuestion.correctAnswer,
        explanation: currentQuestion.explanation || ''
      }

      const success = await questionService.toggleFavorite(questionId, questionData)
      if (success) {
        // 更新缓存
        if (isFavorited) {
          FAVORITES_CACHE.delete(questionId)
          Taro.showToast({ title: '已取消收藏', icon: 'none' })
        } else {
          FAVORITES_CACHE.add(questionId)
          Taro.showToast({ title: '已收藏', icon: 'success' })
        }
        setIsFavorited(!isFavorited)
      }
    } catch (err) {
      console.error('收藏操作失败:', err)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      setFavoriteLoading(false)
    }
  }

  // 当前题目变化时更新收藏状态
  useEffect(() => {
    updateCurrentFavoriteStatus()
  }, [currentIndex, questions])

  /**
   * 解析选项字符串为数组
   * 支持多种格式:
   * 1. JSON对象字符串: '{"A":"xxx","B":"xxx","C":"xxx","D":"xxx"}'
   * 2. 普通格式: "A. xxx  B. xxx  C. xxx" 或 "A.xxx B.xxx C.xxx"
   */
  const parseOptions = (optionsStr) => {
    if (Array.isArray(optionsStr)) return optionsStr
    if (typeof optionsStr !== 'string') return []

    // 尝试解析 JSON 对象格式: {"A":"xxx","B":"xxx","C":"xxx","D":"xxx"}
    if (optionsStr.trim().startsWith('{')) {
      try {
        const obj = JSON.parse(optionsStr)
        const keys = Object.keys(obj).sort()
        return keys.map(key => `${key}. ${obj[key]}`)
      } catch (e) {
        // JSON 解析失败，继续尝试其他格式
      }
    }

    // 尝试匹配 A.  B.  C.  或 A. B. C. 格式
    const matches = optionsStr.match(/[A-D][.、]\s*[^A-D]+/g)
    if (matches) {
      return matches.map(s => s.trim())
    }
    // 如果没有匹配到，返回整个字符串作为单个选项
    return [optionsStr]
  }

  /**
   * 将答案字母转换为索引 (A->0, B->1, C->2, D->3)
   */
  const normalizeAnswer = (answer) => {
    if (typeof answer === 'number') return answer
    if (typeof answer === 'string') {
      const upper = answer.toUpperCase()
      const index = upper.charCodeAt(0) - 'A'.charCodeAt(0)
      if (index >= 0 && index <= 3) return index
    }
    return 0
  }

  /**
   * 标准化题目数据格式
   * 数据库格式: { content, options, answer } -> 前端格式: { question, options, correctAnswer }
   */
  const normalizeQuestion = (q) => {
    return {
      ...q,
      question: q.question || q.content || '',
      options: Array.isArray(q.options) ? q.options : parseOptions(q.options || ''),
      correctAnswer: normalizeAnswer(q.correctAnswer || q.answer || 0)
    }
  }

  const loadQuestions = async () => {
    setLoading(true)

    // 内置题目库 - 确保离线也能正常使用
    const BUILTIN_QUESTIONS = {
      pinyin: [
        { id: 'py001', type: 'pinyin', question: '下列加点字注音完全正确的一项是：', options: ['A. 狡狞(níng)', 'B. 机械(jiè)', 'C. 同仇敌忾(kài)', 'D. 玷污(zhēn)'], correctAnswer: 2, explanation: 'C项注音完全正确。' },
        { id: 'py002', type: 'pinyin', question: '下列词语中加点字的读音，与所给注音全部相同的一项是：', options: ['A. 供 gòng 供给 供认 供品', 'B. 角 jué 角色 口角 角逐', 'C. 强 qiáng 强迫 倔强 强壮', 'D. 处 chǔ 处理 处分 处所'], correctAnswer: 1, explanation: 'B项全部读jué。' },
        { id: 'py003', type: 'pinyin', question: '"参"在"参加"中读：', options: ['A. cēn', 'B. shēn', 'C. cān', 'D. cī'], correctAnswer: 2, explanation: '"参"在"参加"中读cān。' },
        { id: 'py004', type: 'pinyin', question: '"薄"在"薄雾"中读：', options: ['A. báo', 'B. bó', 'C. bò', 'D. bē'], correctAnswer: 0, explanation: '"薄"在"薄雾"中读báo。' },
        { id: 'py005', type: 'pinyin', question: '下列加点字读音完全正确的一项是：', options: ['A. 贮蓄(zhù) 菡萏(hàn) 酝酿(niàng)', 'B. 粗糙(cāo) 确凿(záo) 唯妙唯肖(xiào)', 'C. 讪笑(shàn) 挑衅(xìn) 哂笑(xī)', 'D. 媲美(pì) 缄默(jiān) 酷肖(xiào)'], correctAnswer: 0, explanation: 'A项正确。' },
        { id: 'py006', type: 'pinyin', question: '"翘"在"翘首"中读：', options: ['A. qiào', 'B. qiáo', 'C. qiāo', 'D. qiü'], correctAnswer: 1, explanation: '"翘"在"翘首"中读qiáo。' },
        { id: 'py007', type: 'pinyin', question: '下列加点字注音有误的一项是：', options: ['A. 菜畦(qí) 确凿(záo)', 'B. 脑髓(suǐ) 伛偻(lǚ)', 'C. 盔甲(kuī) 骊歌(lí)', 'D. 逾越(yù) 栖息(qī)'], correctAnswer: 1, explanation: 'B项"伛偻"的"偻"应读lǚ。' },
        { id: 'py008', type: 'pinyin', question: '"模"在"模样"中读：', options: ['A. mó', 'B. mú', 'C. mǒ', 'D. mù'], correctAnswer: 1, explanation: '"模"在"模样"中读mú。' },
        { id: 'py009', type: 'pinyin', question: '下列加点字注音完全正确的一项是：', options: ['A. 褶皱(zhě) 狩猎(shòu) 蜷缩(juǎn)', 'B. 嗔视(chēn) 娴熟(xián) 惩罚(chěng)', 'C. 剽悍(piāo) 旖旎(yǐ) 畸形(qí)', 'D. 氛围(fèn) 殷红(yīn) 龟裂(jūn)'], correctAnswer: 2, explanation: 'C项正确。' },
        { id: 'py010', type: 'pinyin', question: '"咽"在"狼吞虎咽"中读：', options: ['A. yàn', 'B. yān', 'C. yè', 'D. yīn'], correctAnswer: 0, explanation: '"咽"在"狼吞虎咽"中读yàn。' },
      ],
      idiom: [
        { id: 'cy001', type: 'idiom', question: '下列成语中使用正确的一项是：', options: ['A. 电影情节自相矛盾', 'B. 文章见解不同凡响', 'C. 经济发展举世瞩目', 'D. 失利后重整旗鼓'], correctAnswer: 3, explanation: 'D项"重整旗鼓"使用正确。' },
        { id: 'cy002', type: 'idiom', question: '"画蛇添足"比喻：', options: ['A. 做事要认真', 'B. 做多余的事反不好', 'C. 抓住机会', 'D. 坚持到底'], correctAnswer: 1, explanation: '"画蛇添足"比喻做了多余的事。' },
        { id: 'cy003', type: 'idiom', question: '下列成语使用不恰当的一项是：', options: ['A. 脱颖而出', 'B. 感人肺腑', 'C. 半途而废、坚持不懈', 'D. 独具匠心'], correctAnswer: 2, explanation: 'C项"坚持不懈"不能形容"半途而废"。' },
        { id: 'cy004', type: 'idiom', question: '"守株待兔"比喻：', options: ['A. 善于观察', 'B. 死守不知变通', 'C. 有耐心', 'D. 运气重要'], correctAnswer: 1, explanation: '"守株待兔"比喻死守经验不知变通。' },
        { id: 'cy005', type: 'idiom', question: '"亡羊补牢"的意思是：', options: ['A. 羊丢了不找', 'B. 出问题后补救', 'C. 修理羊圈', 'D. 预防问题'], correctAnswer: 1, explanation: '"亡羊补牢"比喻出了问题及时补救。' },
        { id: 'cy006', type: 'idiom', question: '"夸夸其谈"的意思是：', options: ['A. 说话好听', 'B. 浮夸不实际', 'C. 夸奖别人', 'D. 谈论夸夸'], correctAnswer: 1, explanation: '"夸夸其谈"形容说话浮夸。' },
        { id: 'cy007', type: 'idiom', question: '下列成语书写正确的一项是：', options: ['A. 巧夺天公', 'B. 迫不急待', 'C. 谈笑风生', 'D. 再接再励'], correctAnswer: 2, explanation: 'C项正确。' },
        { id: 'cy008', type: 'idiom', question: '"胸有成竹"比喻：', options: ['A. 心里有竹子', 'B. 做事有把握', 'C. 喜欢画画', 'D. 胸部宽广'], correctAnswer: 1, explanation: '"胸有成竹"比喻做事有把握。' },
        { id: 'cy009', type: 'idiom', question: '下列加点成语使用正确的一项是：', options: ['A. 他做事一丝不苟', 'B. 这次会议万人空巷', 'C. 他总是袖手旁观', 'D. 这篇文章别出心裁'], correctAnswer: 0, explanation: 'A项"一丝不苟"使用正确。' },
        { id: 'cy010', type: 'idiom', question: '"津津有味"的意思是：', options: ['A. 味道好', 'B. 兴趣浓厚', 'C. 津津有味', 'D. 很有味道'], correctAnswer: 1, explanation: '"津津有味"形容兴趣浓厚。' },
      ],
      vocabulary: [
        { id: 'vo001', type: 'vocabulary', question: '"姹紫嫣红"的意思是：', options: ['A. 颜色单一', 'B. 各种花朵娇艳', 'C. 紫色红色', 'D. 花朵凋零'], correctAnswer: 1, explanation: '"姹紫嫣红"形容各种颜色花朵娇艳。' },
        { id: 'vo002', type: 'vocabulary', question: '下列词语中没有错别字的一项是：', options: ['A. 再接再励', 'B. 谈笑风生', 'C. 巧夺天公', 'D. 迫不急待'], correctAnswer: 1, explanation: 'B项正确。' },
        { id: 'vo003', type: 'vocabulary', question: '"美轮美奂"形容：', options: ['A. 美丽风景', 'B. 高大华丽建筑', 'C. 美丽的人', 'D. 美好音乐'], correctAnswer: 1, explanation: '"美轮美奂"形容房屋高大华丽。' },
        { id: 'vo004', type: 'vocabulary', question: '"鳞次栉比"的意思是：', options: ['A. 排列密', 'B. 鱼和梳子', 'C. 次序混乱', 'D. 整齐稀疏'], correctAnswer: 0, explanation: '"鳞次栉比"形容建筑物排列密整。' },
        { id: 'vo005', type: 'vocabulary', question: '"川流不息"的"川"意思是：', options: ['A. 山川', 'B. 河流', 'C. 平原', 'D. 道路'], correctAnswer: 1, explanation: '"川"指河流。' },
        { id: 'vo006', type: 'vocabulary', question: '"因地制宜"的意思是：', options: ['A. 根据当地制定措施', 'B. 改造环境', 'C. 适应环境', 'D. 改变制度'], correctAnswer: 0, explanation: '"因地制宜"指根据情况制定办法。' },
        { id: 'vo007', type: 'vocabulary', question: '下列词语解释有误的一项是：', options: ['A. 凛冽：寒冷', 'B. 逶迤：弯曲', 'C. 妥帖：恰当', 'D. 俨然：严肃'], correctAnswer: 3, explanation: 'D项"俨然"主要指很像。' },
        { id: 'vo008', type: 'vocabulary', question: '"不可思议"的意思是：', options: ['A. 无法想象', 'B. 不可议论', 'C. 很神奇', 'D. 不讲理'], correctAnswer: 0, explanation: '"不可思议"形容难以想象。' },
        { id: 'vo009', type: 'vocabulary', question: '下列词语中没有错别字的一项是：', options: ['A. 焕然一新', 'B. 谈笑风声', 'C. 迫不急待', 'D. 再接再励'], correctAnswer: 0, explanation: 'A项正确。' },
        { id: 'vo010', type: 'vocabulary', question: '"抑扬顿挫"形容：', options: ['A. 声音高低起伏', 'B. 抑制', 'C. 挫折', 'D. 停顿'], correctAnswer: 0, explanation: '"抑扬顿挫"形容声音高低起伏和谐。' },
      ],
      correction: [
        { id: 'bc001', type: 'correction', question: '下列句子中没有语病的一项是：', options: ['A. 通过活动，使我明白', 'B. 态度端正，成绩提高', 'C. 打扫教室卫生', 'D. 改进方法，增加效率'], correctAnswer: 1, explanation: 'B项无语病。' },
        { id: 'bc002', type: 'correction', question: '"增加效率"的错误类型是：', options: ['A. 语序不当', 'B. 搭配不当', 'C. 成分残缺', 'D. 表意不明'], correctAnswer: 1, explanation: '"增加"与"效率"搭配不当。' },
        { id: 'bc003', type: 'correction', question: '下列句子中有语病的一项是：', options: ['A. 北京秋天美丽', 'B. 文章观点深刻', 'C. 穿着上衣戴帽子', 'D. 养成学习习惯'], correctAnswer: 2, explanation: 'C项搭配不当。' },
        { id: 'bc004', type: 'correction', question: '"通过学习，使我受益"病因是：', options: ['A. 成分残缺', 'B. 搭配不当', 'C. 语序不当', 'D. 结构混乱'], correctAnswer: 0, explanation: '滥用介词导致主语缺失。' },
        { id: 'bc005', type: 'correction', question: '修改"稻米是主要粮食"正确的是：', options: ['A. 稻米是粮食', 'B. 稻米是粮食作物', 'C. 粮食是稻米', 'D. 稻米是主要'], correctAnswer: 1, explanation: '应改为"稻米是粮食作物"。' },
        { id: 'bc006', type: 'correction', question: '下列没有语病的一项是：', options: ['A. 文章对我有兴趣', 'B. 我对文章有兴趣', 'C. 文章引起兴趣', 'D. 文章让我感兴趣'], correctAnswer: 2, explanation: 'C项无语病。' },
        { id: 'bc007', type: 'correction', question: '"即使遇到挫折，也要坚持"：', options: ['A. 有语病', 'B. 无语病', 'C. 缺主语', 'D. 搭配不当'], correctAnswer: 1, explanation: '这句话无语病。' },
        { id: 'bc008', type: 'correction', question: '下列有语病的一项是：', options: ['A. 培养习惯', 'B. 明白道理', 'C. 努力取得成绩', 'D. 作者是鲁迅写的'], correctAnswer: 3, explanation: 'D项句式杂糅。' },
        { id: 'bc009', type: 'correction', question: '下列句子没有语病的一项是：', options: ['A. 通过学习使我进步', 'B. 他进步了', 'C. 他穿着衣服和帽子', 'D. 提高工作效率'], correctAnswer: 3, explanation: 'D项无语病。' },
        { id: 'bc010', type: 'correction', question: '"这本书的作者是鲁迅写的"病因是：', options: ['A. 成分残缺', 'B. 句式杂糅', 'C. 搭配不当', 'D. 表意不明'], correctAnswer: 1, explanation: '句式杂糅。' },
      ]
    }

    // 获取所有题目并打乱
    const getAllQuestions = () => {
      const all = [
        ...BUILTIN_QUESTIONS.pinyin,
        ...BUILTIN_QUESTIONS.idiom,
        ...BUILTIN_QUESTIONS.vocabulary,
        ...BUILTIN_QUESTIONS.correction
      ]
      // Fisher-Yates 洗牌
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]]
      }
      return all
    }

    try {
      let data
      if (mode === 'single') {
        // 单题模式：直接显示传入的题目
        console.log('=== 单题模式 ===')
        try {
          const questionDataStr = params.questionData
          if (questionDataStr) {
            const parsedQuestion = JSON.parse(decodeURIComponent(questionDataStr))
            console.log('解析到的题目:', parsedQuestion)
            data = [normalizeQuestion(parsedQuestion)]
          } else {
            console.error('单题模式缺少 questionData 参数')
            data = []
          }
        } catch (err) {
          console.error('解析单题数据失败:', err)
          data = []
        }
      } else if (mode === 'favorite') {
        // 收藏练习模式：从云函数获取收藏的题目列表
        console.log('=== 收藏练习模式，从云函数获取收藏题目 ===')
        try {
          const favoriteQuestions = await questionService.getFavorites(1, count)
          console.log('从云函数获取到收藏题目:', favoriteQuestions?.length || 0, '题')
          if (favoriteQuestions && favoriteQuestions.length > 0) {
            // 标准化收藏题目数据格式
            data = favoriteQuestions.map(q => normalizeQuestion({
              id: q.id || q._id,
              type: q.type || q.questionType || 'vocabulary',
              question: q.question || q.questionText || '',
              options: q.options || [],
              correctAnswer: q.correctAnswer || 0,
              explanation: q.explanation || ''
            }))
          } else {
            // 没有收藏题目
            data = []
          }
        } catch (err) {
          console.error('获取收藏题目失败，使用空数组:', err)
          data = []
        }
      } else if (mode === 'wrong') {
        // 错题重做模式：从云函数获取真实的错题列表
        console.log('=== 错题重做模式，从云函数获取错题 ===')
        try {
          const wrongQuestions = await questionService.getWrongQuestions(1, count)
          console.log('从云函数获取到错题:', wrongQuestions?.length || 0, '题')
          if (wrongQuestions && wrongQuestions.length > 0) {
            // 标准化错题数据格式
            data = wrongQuestions.map(q => normalizeQuestion({
              id: q.id || q._id,
              type: q.type,
              question: q.question || q.questionText,
              options: q.options || [],
              correctAnswer: q.answer || q.correctAnswer || 0,
              explanation: q.explanation || ''
            }))
          } else {
            // 没有错题，使用空数组
            data = []
          }
        } catch (err) {
          console.error('获取错题失败，使用空数组:', err)
          data = []
        }
      } else if (mode === 'random') {
        // 随机模式：从所有题目中抽取
        const all = getAllQuestions()
        data = all.slice(0, Math.min(count, all.length))
      } else {
        // 按类型模式：从指定类型中抽取
        const typedQuestions = BUILTIN_QUESTIONS[type] || getAllQuestions()
        // 打乱顺序
        const shuffled = [...typedQuestions].sort(() => Math.random() - 0.5)
        data = shuffled.slice(0, Math.min(count, shuffled.length))
      }
      // 标准化题目数据格式
      if (data && data.length > 0 && mode !== 'wrong') {
        data = data.map(normalizeQuestion)
      }
      console.log('成功加载题目，数量:', data?.length || 0, '模式:', mode, '类型:', type)
      setQuestions(data || [])
    } catch (err) {
      console.error('加载题目失败:', err)
      // 最小fallback
      setQuestions([
        { id: 'f1', type: QUESTION_TYPES.SINGLE_CHOICE, question: '下列词语中，没有错别字的一组是：', options: ['A. 诡计多端', 'B. 走投无路', 'C. 谈笑风生', 'D. 汗流浃背'], correctAnswer: 2, explanation: 'C项正确。' },
        { id: 'f2', type: QUESTION_TYPES.SINGLE_CHOICE, question: '"春风又绿江南岸"中的"绿"字运用了什么修辞手法？', options: ['A. 比喻', 'B. 拟人', 'C. 夸张', 'D. 借代'], correctAnswer: 1, explanation: '拟人。' },
        { id: 'f3', type: QUESTION_TYPES.SINGLE_CHOICE, question: '"画蛇添足"比喻：', options: ['A. 做事要认真', 'B. 做多余的事', 'C. 抓住机会', 'D. 坚持到底'], correctAnswer: 1, explanation: '做了多余的事。' }
      ].slice(0, count))
    } finally {
      setLoading(false)
    }
  }

  const currentQuestion = questions[currentIndex]

  // 调试：打印当前题目信息
  if (currentQuestion && mode === 'wrong') {
    console.log('=== 当前错题信息 ===')
    console.log('题目ID:', currentQuestion.id)
    console.log('题目类型:', currentQuestion.type)
    console.log('题目内容:', currentQuestion.question?.substring(0, 50))
    console.log('选项数量:', currentQuestion.options?.length || 0)
    console.log('选项示例:', currentQuestion.options?.[0])
    console.log('完整题目数据:', currentQuestion)
  }

  const handleAnswer = (value) => {
    console.log('handleAnswer 被调用', { questionId: currentQuestion.id, value })
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: value
    }
    console.log('新答案状态', newAnswers)
    setAnswers(newAnswers)
  }

  // 处理多选题的选择（切换选中状态）
  const handleMultiSelectAnswer = (index) => {
    const currentAnswers = answers[currentQuestion.id] || []
    const isSelected = currentAnswers.includes(index)

    let newAnswers
    if (isSelected) {
      // 取消选中
      newAnswers = currentAnswers.filter(i => i !== index)
    } else {
      // 添加选中
      newAnswers = [...currentAnswers, index]
    }

    setAnswers({
      ...answers,
      [currentQuestion.id]: newAnswers
    })
  }

  // 检查当前题目是否已作答（用于按钮禁用状态）
  const hasAnswer = () => {
    const answer = answers[currentQuestion.id]
    if (answer === undefined || answer === null) return false
    // 多选题检查数组是否有元素
    if (Array.isArray(answer)) return answer.length > 0
    // 单选题检查是否有值
    return true
  }

  // 判断是否为多选题（只有 type 为 'multiple_choice' 才是多选题）
  const isMultipleChoice = () => {
    return currentQuestion?.type === QUESTION_TYPES.MULTIPLE_CHOICE
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowResult(false)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    // 计算分数并记录答对的题目
    let correct = 0
    const correctQuestionIds = [] // 记录答对的题目ID

    questions.forEach(q => {
      const userAnswer = answers[q.id]
      const correctAnswer = q.correctAnswer

      // 判断答案是否正确
      let isAnswerCorrect = false
      if (Array.isArray(userAnswer)) {
        // 多选题：需要排序后比较数组内容
        const sortedUser = [...userAnswer].sort()
        const sortedCorrect = Array.isArray(correctAnswer)
          ? [...correctAnswer].sort()
          : [correctAnswer]
        isAnswerCorrect = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect)
      } else {
        // 单选题：直接比较
        isAnswerCorrect = userAnswer === correctAnswer
      }

      if (isAnswerCorrect) {
        correct++
        correctQuestionIds.push(q.id)
      }
    })
    const finalScore = Math.round((correct / questions.length) * 100)
    setScore(finalScore)
    setShowResult(true)

    // 记录学习到 study_records
    try {
      await studyService.addRecord({
        type: 'exercise',
        title: '练习',
        score: finalScore,
        totalQuestions: questions.length,
        correctAnswers: correct,
        duration: Math.round((Date.now() - startTime) / 1000 / 60) || 5
      })
    } catch (err) {
      console.error('记录学习失败:', err)
    }

    // 批量写入答题记录到 answer_history（使用 question 云函数）
    try {
      // 计算每道题是否正确
      const answerData = questions.map(q => {
        const userAnswer = answers[q.id]
        const correctAnswer = q.correctAnswer

        let isAnswerCorrect = false
        if (Array.isArray(userAnswer)) {
          const sortedUser = [...userAnswer].sort()
          const sortedCorrect = Array.isArray(correctAnswer)
            ? [...correctAnswer].sort()
            : [correctAnswer]
          isAnswerCorrect = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect)
        } else {
          isAnswerCorrect = userAnswer === correctAnswer
        }

        return {
          questionId: q.id,
          answer: answers[q.id],
          questionType: q.type,
          isCorrect: isAnswerCorrect,
          // 包含完整题目信息，以便错题重做时使用
          questionText: q.question || q.questionText || '',
          options: q.options || [],
          correctAnswer: correctAnswer
        }
      })

      console.log('=== 提交答题数据 ===')
      console.log('答题数据示例:', answerData[0])

      await Taro.cloud.callFunction({
        name: 'question',
        data: {
          action: 'submitBatch',
          answers: answerData
        }
      })
    } catch (err) {
      console.error('记录答题历史失败:', err)
    }

    // 如果是错题重做模式，将答对的题目从错题集中移除
    if (mode === 'wrong' && correctQuestionIds.length > 0) {
      console.log('=== 错题重做模式，准备移除答对的题目 ===')
      console.log('答对的题目ID:', correctQuestionIds)
      console.log('当前 mode:', mode)

      try {
        // 逐个移除答对的错题
        for (const questionId of correctQuestionIds) {
          console.log('正在移除错题:', questionId)
          const res = await Taro.cloud.callFunction({
            name: 'question',
            data: {
              action: 'removeWrong',
              questionId: questionId
            }
          })
          console.log('移除结果:', res)
        }
        console.log(`=== 成功移除 ${correctQuestionIds.length} 道错题 ===`)
      } catch (err) {
        console.error('=== 移除错题失败 ===:', err)
        Taro.showToast({ title: '移除失败: ' + (err.errMsg || err.message || 'unknown'), icon: 'none', duration: 3000 })
      }
    } else {
      console.log('=== 不是错题重做模式 或 没有答对的题目 ===')
      console.log('mode:', mode, 'correctQuestionIds:', correctQuestionIds)
    }
  }

  const isCorrect = (questionId) => {
    const userAnswer = answers[questionId]
    const question = questions.find(q => q.id === questionId)
    if (!question) return false

    const correctAnswer = question.correctAnswer

    if (Array.isArray(userAnswer)) {
      // 多选题比较
      const sortedUser = [...userAnswer].sort()
      const sortedCorrect = Array.isArray(correctAnswer)
        ? [...correctAnswer].sort()
        : [correctAnswer]
      return JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect)
    }
    // 单选题比较
    return userAnswer === correctAnswer
  }

  if (loading) {
    return (
      <View className="loading-page">
        <Text>加载中...</Text>
      </View>
    )
  }

  if (showResult) {
    // 计算答对题数
    const correctCount = questions.filter(q => {
      const userAnswer = answers[q.id]
      const correctAnswer = q.correctAnswer

      if (Array.isArray(userAnswer)) {
        const sortedUser = [...userAnswer].sort()
        const sortedCorrect = Array.isArray(correctAnswer)
          ? [...correctAnswer].sort()
          : [correctAnswer]
        return JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect)
      }
      return userAnswer === correctAnswer
    }).length

    return (
      <View className="result-page">
        <View className="result-card">
          <Text className="result-score">{score}</Text>
          <Text className="result-label">得分</Text>
          <View className="result-detail">
            <Text className="detail-text">答对 {correctCount} 题</Text>
            <Text className="detail-text">共 {questions.length} 题</Text>
          </View>
        </View>

        <View className="result-actions">
          <View className="action-btn" onClick={() => navigateBack()}>返回</View>
          <View className="action-btn primary" onClick={() => {
            setAnswers({})
            setCurrentIndex(0)
            setShowResult(false)
          }}>再练一次</View>
        </View>
      </View>
    )
  }

  return (
    <View className="exercise-detail-page">
      {/* 进度条 */}
      <View className="progress-header">
        <View className="progress-bar">
          <View
            className="progress-fill"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </View>
        <Text className="progress-text">{currentIndex + 1} / {questions.length}</Text>
      </View>

      <ScrollView scrollY className="content-scroll">
        <View className="question-card">
          <View className="question-header">
            <View className="question-type">
              {isMultipleChoice() ? '多选题' : '单选题'}
            </View>
            <View
              className={`favorite-btn ${isFavorited ? 'favorited' : ''} ${favoriteLoading ? 'loading' : ''}`}
              onClick={handleToggleFavorite}
            >
              <Text className="favorite-icon">{isFavorited ? '★' : '☆'}</Text>
            </View>
          </View>

          <Text className="question-text">{currentQuestion?.question}</Text>

          {!isMultipleChoice() ? (
            <View className="options-list">
              {currentQuestion.options.map((option, index) => {
                const isSelected = answers[currentQuestion.id] === index
                return (
                  <View
                    key={index}
                    className={`option-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleAnswer(index)}
                  >
                    <Radio checked={isSelected} />
                    <Text className="option-text">{option}</Text>
                  </View>
                )
              })}
            </View>
          ) : (
            <View className="options-list">
              {currentQuestion?.options?.map((option, index) => {
                const currentAnswers = answers[currentQuestion.id] || []
                const isSelected = currentAnswers.includes(index)
                return (
                  <View
                    key={index}
                    className={`option-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleMultiSelectAnswer(index)}
                  >
                    <Checkbox checked={isSelected} />
                    <Text className="option-text">{option}</Text>
                  </View>
                )
              })}
            </View>
          )}
        </View>

        {currentQuestion?.explanation && answers[currentQuestion.id] !== undefined && (
          <View className="explanation-card">
            <Text className="explanation-title">解析</Text>
            <Text className="explanation-text">{currentQuestion.explanation}</Text>
          </View>
        )}
      </ScrollView>

      <View className="footer-btn">
        <View
          className={`btn ${!hasAnswer() ? 'disabled' : ''}`}
          onClick={() => {
            // 只有选择了答案才能点下一题
            if (hasAnswer()) {
              handleNext()
            }
          }}
        >
          {currentIndex < questions.length - 1 ? '下一题' : '提交'}
        </View>
      </View>
    </View>
  )
}

export default ExerciseDetail
