/**
 * 成语学习页面 - 选择题模式
 */
import { useState, useRef, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import studyService from '../../services/study'
import questionService from '../../services/question'
import eventBus, { EVENTS } from '../../utils/eventBus'
import { pageShareConfigs } from '../../utils/share'
import './index.less'

// 收藏状态缓存
let FAVORITES_CACHE = new Set()

// 成语选择题库（基于K12真题）
const IDIOM_QUESTIONS = [
  // 成语填空
  { id: 'i001', type: 'fill', question: '画___添足', options: ['A. 蛇', 'B. 龙', 'C. 鱼', 'D. 鸟'], correctAnswer: 0, explanation: '"画蛇添足"比喻做了多余的事，非但无益，反而不合适。' },
  { id: 'i002', type: 'fill', question: '守___待兔', options: ['A. 猪', 'B. 株', 'C. 珠', 'D. 竹'], correctAnswer: 1, explanation: '"守株待兔"比喻死守狭隘经验，不知变通。' },
  { id: 'i003', type: 'fill', question: '掩___盗铃', options: ['A. 耳', 'B. 目', 'C. 手', 'D. 口'], correctAnswer: 0, explanation: '"掩耳盗铃"比喻自己欺骗自己。' },
  { id: 'i004', type: 'fill', question: '亡羊___牢', options: ['A. 补', 'B. 捕', 'C. 不', 'D. 修'], correctAnswer: 0, explanation: '"亡羊补牢"比喻出了问题以后想办法补救，可以防止继续受损失。' },
  { id: 'i005', type: 'fill', question: '刻舟求___', options: ['A. 剑', 'B. 箭', 'C. 健', 'D. 见'], correctAnswer: 0, explanation: '"刻舟求剑"比喻拘泥成法，不知道变通。' },
  { id: 'i006', type: 'fill', question: '井底之___', options: ['A. 蛙', 'B. 虾', 'C. 鱼', 'D. 蟹'], correctAnswer: 0, explanation: '"井底之蛙"比喻见识狭窄的人。' },
  { id: 'i007', type: 'fill', question: '狐假___威', options: ['A. 虎', 'B. 狼', 'C. 狮', 'D. 豹'], correctAnswer: 0, explanation: '"狐假虎威"比喻依仗别人的势力来欺压人。' },
  { id: 'i008', type: 'fill', question: '自相___', options: ['A. 矛盾', 'B. 矛顿', 'C. 茅盾', 'D. 矛楯'], correctAnswer: 0, explanation: '"自相矛盾"比喻自己说话做事前后抵触。' },
  { id: 'i009', type: 'fill', question: '拔苗___长', options: ['A. 助', 'B. 促', 'C. 驻', 'D. 注'], correctAnswer: 0, explanation: '"拔苗助长"比喻违反事物发展的客观规律，急于求成，反而把事情弄糟。' },
  { id: 'i010', type: 'fill', question: '滥竽___数', options: ['A. 充', 'B. 冲', 'C. 重', 'D. 宠'], correctAnswer: 0, explanation: '"滥竽充数"比喻没有真才实学的人混在行家里面充数。' },
  { id: 'i011', type: 'fill', question: '杯弓___影', options: ['A. 蛇', 'B. 龙', 'C. 虫', 'D. 鸟'], correctAnswer: 0, explanation: '"杯弓蛇影"比喻因疑神疑鬼而引起恐惧。' },
  { id: 'i012', type: 'fill', question: '对牛弹___', options: ['A. 琴', 'B. 芹', 'C. 勤', 'D. 秦'], correctAnswer: 0, explanation: '"对牛弹琴"比喻对不讲道理的人讲道理。' },
  { id: 'i013', type: 'fill', question: '杞人___天', options: ['A. 忧', 'B. 优', 'C. 幽', 'D. 悠'], correctAnswer: 0, explanation: '"杞人忧天"比喻不必要的或缺乏根据的忧虑和担心。' },
  { id: 'i014', type: 'fill', question: '胸有成___', options: ['A. 竹', 'B. 足', 'C. 筑', 'D. 逐'], correctAnswer: 0, explanation: '"胸有成竹"比喻做事之前已经有通盘的考虑。' },
  { id: 'i015', type: 'fill', question: '望___止渴', options: ['A. 梅', 'B. 煤', 'C. 眉', 'D. 没'], correctAnswer: 0, explanation: '"望梅止渴"比喻用空想安慰自己。' },

  // 成语释义选择
  { id: 'i016', type: 'meaning', question: '"指鹿为马"的意思是：', options: ['A. 故意颠倒黑白', 'B. 分不清动物', 'C. 喜欢动物', 'D. 眼力不好'], correctAnswer: 0, explanation: '"指鹿为马"比喻故意颠倒黑白，混淆是非。' },
  { id: 'i017', type: 'meaning', question: '"草木皆兵"形容：', options: ['A. 植物很多', 'B. 军队强壮', 'C. 惊慌时疑神疑鬼', 'D. 自然环境好'], correctAnswer: 2, explanation: '"草木皆兵"形容人在惊慌时疑神疑鬼。' },
  { id: 'i018', type: 'meaning', question: '"纸上谈兵"比喻：', options: ['A. 纸上画画', 'B. 空谈理论', 'C. 研究军事', 'D. 写字很好'], correctAnswer: 1, explanation: '"纸上谈兵"比喻空谈理论，不能解决实际问题。' },
  { id: 'i019', type: 'meaning', question: '"破釜沉舟"比喻：', options: ['A. 摔坏东西', 'B. 下决心干到底', 'C. 破船沉水', 'D. 失败了'], correctAnswer: 1, explanation: '"破釜沉舟"比喻下决心不顾一切地干到底。' },
  { id: 'i020', type: 'meaning', question: '"卧薪尝胆"形容：', options: ['A. 生活艰苦', 'B. 刻苦自励', 'C. 睡不好觉', 'D. 吃苦胆'], correctAnswer: 1, explanation: '"卧薪尝胆"形容人刻苦自励，发愤图强。' },
  { id: 'i021', type: 'meaning', question: '"三顾茅庐"比喻：', options: ['A. 参观茅屋', 'B. 诚心邀请', 'C. 旅游观光', 'D. 三次出门'], correctAnswer: 1, explanation: '"三顾茅庐"比喻诚心诚意地邀请人家。' },
  { id: 'i022', type: 'meaning', question: '"负荆请罪"表示：', options: ['A. 背着荆条', 'B. 承认错误', 'C. 请人吃饭', 'D. 探望病人'], correctAnswer: 1, explanation: '"负荆请罪"表示向人认错赔罪。' },
  { id: 'i023', type: 'meaning', question: '"完璧归赵"比喻：', options: ['A. 完整的玉', 'B. 物归原主', 'C. 送给别人', 'D. 借东西'], correctAnswer: 1, explanation: '"完璧归赵"比喻把物品完好地归还给物品的主人。' },
  { id: 'i024', type: 'meaning', question: '"程门立雪"形容：', options: ['A. 雪天玩耍', 'B. 尊师重道', 'C. 站着休息', 'D. 冬天寒冷'], correctAnswer: 1, explanation: '"程门立雪"形容尊师重道，虔诚求教。' },
  { id: 'i025', type: 'meaning', question: '"闻鸡起舞"比喻：', options: ['A. 早晨跳舞', 'B. 养鸡为业', 'C. 及时奋起', 'D. 喜欢音乐'], correctAnswer: 2, explanation: '"闻鸡起舞"比喻有志报国的人及时奋起。' },
  { id: 'i026', type: 'meaning', question: '"入木三分"形容：', options: ['A. 木工技术', 'B. 分析深刻', 'C. 雕刻艺术', 'D. 力气很大'], correctAnswer: 1, explanation: '"入木三分"形容书法极有笔力，现多比喻分析问题很深刻。' },
  { id: 'i027', type: 'meaning', question: '"望洋兴叹"比喻：', options: ['A. 看海感叹', 'B. 无可奈何', 'C. 欣赏风景', 'D. 想要游泳'], correctAnswer: 1, explanation: '"望洋兴叹"比喻做事时因力不胜任或没有条件而感到无可奈何。' },
  { id: 'i028', type: 'meaning', question: '"叶公好龙"比喻：', options: ['A. 喜欢动物', 'B. 口头爱好实际不真', 'C. 爱好广泛', 'D. 收藏龙'], correctAnswer: 1, explanation: '"叶公好龙"比喻口头上说爱好某事物，实际上并不真爱好。' },
  { id: 'i029', type: 'meaning', question: '"黔驴技穷"比喻：', options: ['A. 驴子技穷', 'B. 本领用尽', 'C. 动物有趣', 'D. 技能不足'], correctAnswer: 1, explanation: '"黔驴技穷"比喻有限的一点本领也已经用完了。' },
  { id: 'i030', type: 'meaning', question: '"南辕北辙"比喻：', options: ['A. 南北方向', 'B. 行动目的相反', 'C. 路途遥远', 'D. 方向正确'], correctAnswer: 1, explanation: '"南辕北辙"比喻行动和目的正好相反。' },
  { id: 'i031', type: 'meaning', question: '"一鸣惊人"比喻：', options: ['A. 叫声很大', 'B. 突然成功', 'C. 平时不突出一做惊人', 'D. 令人惊讶'], correctAnswer: 2, explanation: '"一鸣惊人"比喻平时没有特殊表现，一做起来就有惊人的成绩。' },
  { id: 'i032', type: 'meaning', question: '"邯郸学步"比喻：', options: ['A. 学习走路', 'B. 模仿别人失本领', 'C. 去邯郸旅游', 'D. 体育训练'], correctAnswer: 1, explanation: '"邯郸学步"比喻模仿别人不到家，反而把自己原有的东西忘了。' },
  { id: 'i033', type: 'meaning', question: '"东施效颦"比喻：', options: ['A. 美女模仿', 'B. 盲目模仿适得其反', 'C. 学习美容', 'D. 喜欢表演'], correctAnswer: 1, explanation: '"东施效颦"比喻盲目模仿，效果适得其反。' },
  { id: 'i034', type: 'meaning', question: '"滥竽充数"的意思是：', options: ['A. 音乐演奏', 'B. 没真才实学混充数', 'C. 人多热闹', 'D. 欺骗行为'], correctAnswer: 1, explanation: '"滥竽充数"比喻没有真才实学的人混在行家里面充数。' },
  { id: 'i035', type: 'meaning', question: '"按部就班"的意思是：', options: ['A. 部分上班', 'B. 按步骤办事', 'C. 等待上班', 'D. 遵守纪律'], correctAnswer: 1, explanation: '"按部就班"指按照一定的条理、步骤做事。' },

  // 成语改错
  { id: 'i036', type: 'correct', question: '下列成语书写正确的是：', options: ['A. 迫不急待', 'B. 迫不及待', 'C. 泊不及待', 'D. 迫不既待'], correctAnswer: 1, explanation: '正确写法是"迫不及待"，意思是急迫得不能等待。' },
  { id: 'i037', type: 'correct', question: '下列成语书写正确的是：', options: ['A. 谈笑风生', 'B. 谈笑风声', 'C. 谈笑风森', 'D. 谈笑锋声'], correctAnswer: 0, explanation: '正确写法是"谈笑风生"，形容谈话时有说有笑，兴致很高。' },
  { id: 'i038', type: 'correct', question: '下列成语书写正确的是：', options: ['A. 美仑美奂', 'B. 美轮美奂', 'C. 美伦美奂', 'D. 美论美奂'], correctAnswer: 1, explanation: '正确写法是"美轮美奂"，形容房屋高大华丽。' },
  { id: 'i039', type: 'correct', question: '下列成语书写正确的是：', options: ['A. 巧夺天功', 'B. 巧夺天工', 'C. 巧夺天工', 'D. 巧夺天攻'], correctAnswer: 1, explanation: '正确写法是"巧夺天工"，形容技艺高超。' },
  { id: 'i040', type: 'correct', question: '下列成语书写正确的是：', options: ['A. 再接再励', 'B. 再接再厉', 'C. 再接再力', 'D. 再接再利'], correctAnswer: 1, explanation: '正确写法是"再接再厉"，比喻继续努力。' },
  { id: 'i041', type: 'correct', question: '下列成语书写正确的是：', options: ['A. 恢心壮志', 'B. 灰心壮志', 'C. 诲人不倦', 'D. 诲人不卷'], correctAnswer: 2, explanation: '"诲人不倦"意思是教导人特别耐心，从不厌倦。' },
  { id: 'i042', type: 'correct', question: '"换然一新"的正确写法是：', options: ['A. 换然一新', 'B. 焕然一新', 'C. 涣然一新', 'D. 幻然一新'], correctAnswer: 1, explanation: '正确写法是"焕然一新"，形容出现了崭新的面貌。' },
  { id: 'i043', type: 'correct', question: '"直接了当"的正确写法是：', options: ['A. 直接了当', 'B. 直截了当', 'C. 直节了当', 'D. 直捷了当'], correctAnswer: 1, explanation: '正确写法是"直截了当"，形容说话做事爽快。' },
  { id: 'i044', type: 'correct', question: '"一愁莫展"的正确写法是：', options: ['A. 一愁莫展', 'B. 一筹莫展', 'C. 一愁莫展', 'D. 一酬莫展'], correctAnswer: 1, explanation: '正确写法是"一筹莫展"，一点计策也施展不出。' },
  { id: 'i045', type: 'correct', question: '"名符其实"的正确写法是：', options: ['A. 名符其实', 'B. 名副其实', 'C. 名付其实', 'D. 名弗其实'], correctAnswer: 1, explanation: '正确写法是"名副其实"，名称或名声与实际相符合。' },
  { id: 'i046', type: 'correct', question: '"不可思意"的正确写法是：', options: ['A. 不可思意', 'B. 不可思议', 'C. 不思意议', 'D. 不可思异'], correctAnswer: 1, explanation: '正确写法是"不可思议"，不可想象，难以理解。' },
  { id: 'i047', type: 'correct', question: '"事倍功半"的反义词是：', options: ['A. 事半工倍', 'B. 事半功倍', 'C. 事半功半', 'D. 事倍功倍'], correctAnswer: 1, explanation: '"事倍功半"的反义词是"事半功倍"，形容效率高。' },
  { id: 'i048', type: 'correct', question: '"守株待兔"的寓意是：', options: ['A. 等待机会', 'B. 死守不知变通', 'C. 耐心等待', 'D. 盼望成功'], correctAnswer: 1, explanation: '"守株待兔"比喻死守狭隘经验，不知变通。' },
  { id: 'i049', type: 'correct', question: '"画蛇添足"告诉我们：', options: ['A. 多做是好的', 'B. 做多余的事反不好', 'C. 画画要细致', 'D. 蛇有脚'], correctAnswer: 1, explanation: '"画蛇添足"比喻做了多余的事，非但无益，反而不合适。' },
  { id: 'i050', type: 'correct', question: '"拔苗助长"告诉我们：', options: ['A. 帮助植物', 'B. 急于求成坏事', 'C. 辛勤劳动', 'D. 爱护庄稼'], correctAnswer: 1, explanation: '"拔苗助长"比喻违反事物发展规律，急于求成反而坏事。' },

  // 成语使用判断（K12真题）
  { id: 'i051', type: 'usage', question: '下列句子中加点成语的使用，不正确的一项是：\nA. 北京冬残奥会即将开幕，中国体育代表团近百名运动员___，整装待发。', options: ['A. 厉兵秣马', 'B. 使用正确', 'C. 使用正确', 'D. 使用正确'], correctAnswer: 0, explanation: '"厉兵秣马"指磨好兵器，喂好马，形容准备战斗，也比喻事前积极准备。用于运动员准备比赛是恰当的。' },
  { id: 'i052', type: 'usage', question: '下列句子中加点成语的使用，不正确的一项是：\nB. "开学第一课"上，同学们观看了女足亚洲杯夺冠的视频片段，纷纷___。', options: ['A. 拍手称快', 'B. 使用正确', 'C. 使用正确', 'D. 使用正确'], correctAnswer: 0, explanation: '"拍手称快"指拍掌叫好，多指仇恨得到消除或事情的结束（一般用于坏事）。用于形容观看夺冠视频不恰当。' },
  { id: 'i053', type: 'usage', question: '下列成语使用正确的一项是：', options: ['A. 这部电影风景如画，气候宜人，前来旅游的人不绝如缕', 'B. 谈起黄梅戏，孩子说得头头是道，让人惊叹不已', 'C. 对孩子进行爱国教育是每个家长任劳任怨的责任', 'D. 这次比赛他真让人另眼相看'], correctAnswer: 1, explanation: 'A项"不绝如缕"应为"络绎不绝"；B项正确；C项"任劳任怨"应为"义不容辞"；D项"另眼相看"用错语境。' },
  { id: 'i054', type: 'usage', question: '下列成语使用恰当的一项是：', options: ['A. 他这次比赛___，顺利晋级', 'B. 在决赛前的恳谈会上，队员们___，总结了技战术', 'C. 羊毛出在羊身上，这些球星通过商业活动赚回转会费', 'D. 这支球队的___，三下五除二就击倒了对手'], correctAnswer: 1, explanation: 'A项应为"旗开得胜"；B项"打开天窗说亮话"正确；C项不是成语；D项"三下五除二"用错语境。' },
  { id: 'i055', type: 'usage', question: '下列成语使用不正确的一项是：', options: ['A. 她边走边笑道："你___，哪里还记得我们这些小百姓呢。"', 'B. 果然是___，她这么一打扮，简直跟换了个人似的', 'C. 这件事___呢，你先别着急啊', 'D. 他们俩___，自此变成了仇人，互相争斗怨恨了一辈子'], correctAnswer: 3, explanation: 'D项"不打不相识"是褒义词，指经过冲突后更了解对方，不能用于变成仇人。应为"结下仇怨"。' },
  { id: 'i056', type: 'usage', question: '"蔚然成风"的意思是：', options: ['A. 形容风很大', 'B. 形容事物蓬勃发展，形成风气', 'C. 形容风景优美', 'D. 形容风向改变'], correctAnswer: 1, explanation: '"蔚然成风"形容一件事情逐渐发展盛行，形成一种风气。' },
  { id: 'i057', type: 'usage', question: '"锱铢必较"的意思是：', options: ['A. 非常仔细', 'B. 对极少的钱或很小的事都十分计较', 'C. 认真负责', 'D. 精打细算'], correctAnswer: 1, explanation: '"锱铢必较"形容对很少的钱或很小的事都十分计较。' },
  { id: 'i058', type: 'usage', question: '"半途而废"比喻：', options: ['A. 走到一半停止', 'B. 做事不能坚持到底', 'C. 半路放弃', 'D. 事情做了一半'], correctAnswer: 1, explanation: '"半途而废"比喻做事不能坚持到底，中途停止。' },
  { id: 'i059', type: 'usage', question: '"持之以恒"的意思是：', options: ['A. 坚持到底', 'B. 长久地坚持下去', 'C. 持续不断', 'D. 永恒不变'], correctAnswer: 1, explanation: '"持之以恒"指长久地坚持下去。' },
  { id: 'i060', type: 'usage', question: '"囫囵吞枣"比喻：', options: ['A. 吃枣太快', 'B. 读书等不加分析地笼统接受', 'C. 吃东西不嚼', 'D. 贪吃'], correctAnswer: 1, explanation: '"囫囵吞枣"比喻读书等不加分析地笼统接受。' },
  { id: 'i061', type: 'usage', question: '"不遗余力"的意思是：', options: ['A. 保留力量', 'B. 把全部力量都使出来', 'C. 不浪费力量', 'D. 有余力'], correctAnswer: 1, explanation: '"不遗余力"指把全部力量都使出来。' },
  { id: 'i062', type: 'usage', question: '"奋不顾身"形容：', options: ['A. 奋勇向前', 'B. 不顾自身安危，勇往直前', 'C. 不顾身体', 'D. 奋力前行'], correctAnswer: 1, explanation: '"奋不顾身"指不顾自身安危，勇往直前。' },
  { id: 'i063', type: 'usage', question: '"见义勇为"的意思是：', options: ['A. 见到正义的事就勇敢地做', 'B. 勇敢地做正义的事', 'C. 为正义而奋斗', 'D. 勇敢行为'], correctAnswer: 0, explanation: '"见义勇为"指见到正义的事就勇敢地去做。' },
  { id: 'i064', type: 'usage', question: '"舍己为人"形容：', options: ['A. 舍弃自己', 'B. 为了他人牺牲自己的利益', 'C. 放弃自己', 'D. 舍己救人'], correctAnswer: 1, explanation: '"舍己为人"指为了他人的利益而不惜牺牲自己的利益。' },
  { id: 'i065', type: 'usage', question: '"大公无私"的意思是：', options: ['A. 很大方', 'B. 完全为人民利益着想，毫无私心', 'C. 公正无私', 'D. 大公'], correctAnswer: 1, explanation: '"大公无私"指完全为人民利益着想，毫无私心。' },
  { id: 'i066', type: 'usage', question: '"光明磊落"形容：', options: ['A. 光明正大', 'B. 心地光明，胸怀坦白', 'C. 正大光明', 'D. 光明磊落'], correctAnswer: 1, explanation: '"光明磊落"形容心地光明，胸怀坦白。' },
  { id: 'i067', type: 'usage', question: '"两袖清风"形容：', options: ['A. 袖子很干净', 'B. 为官清廉', 'C. 生活简朴', 'D. 手很干净'], correctAnswer: 1, explanation: '"两袖清风"形容为官清廉，除衣袖中的清风外，别无所有。' },
  { id: 'i068', type: 'usage', question: '"克己奉公"的意思是：', options: ['A. 克服自己', 'B. 严格要求自己，一心为公', 'C. 克制私心', 'D. 奉公守法'], correctAnswer: 1, explanation: '"克己奉公"指严格要求自己，一心为公。' },
  { id: 'i069', type: 'usage', question: '"鞠躬尽瘁"的意思是：', options: ['A. 鞠躬致敬', 'B. 小心谨慎', 'C. 贡献全部力量', 'D. 尽职尽责'], correctAnswer: 2, explanation: '"鞠躬尽瘁"指恭敬谨慎，竭尽心力去效劳。' },
  { id: 'i070', type: 'usage', question: '"死而后已"形容：', options: ['A. 死了才算', 'B. 形容为事业奋斗到死', 'C. 死后结束', 'D. 直到死'], correctAnswer: 1, explanation: '"死而后已"指形容为事业奋斗到死为止。' },
  { id: 'i071', type: 'usage', question: '"一丝不苟"形容：', options: ['A. 不马虎', 'B. 连最细微的地方也不马虎', 'C. 认真', 'D. 细心'], correctAnswer: 1, explanation: '"一丝不苟"形容连最细微的地方也不马虎。' },
  { id: 'i072', type: 'usage', question: '"精益求精"的意思是：', options: ['A. 非常精细', 'B. 已经很好了还要求更好', 'C. 精益求精', 'D. 求精'], correctAnswer: 1, explanation: '"精益求精"指已经很好了，还要求更好。' },
  { id: 'i073', type: 'usage', question: '"专心致志"形容：', options: ['A. 非常专心', 'B. 一心一意，集中精神', 'C. 专注', 'D. 致志'], correctAnswer: 1, explanation: '"专心致志"形容一心一意，集中精神。' },
  { id: 'i074', type: 'usage', question: '"全神贯注"的意思是：', options: ['A. 全部精神', 'B. 注意力高度集中', 'C. 全神', 'D. 贯注'], correctAnswer: 1, explanation: '"全神贯注"形容注意力高度集中。' },

  // 更多成语辨析
  { id: 'i075', type: 'distinguish', question: '"不可思议"的意思是：', options: ['A. 不可想象', 'B. 难以理解', 'C. 无法想象，难以理解', 'D. 神奇'], correctAnswer: 2, explanation: '"不可思议"形容不可想象，难以理解。' },
  { id: 'i076', type: 'distinguish', question: '"历历在目"形容：', options: ['A. 清楚在眼前', 'B. 过去的事情清楚地出现在眼前', 'C. 看得清楚', 'D. 回忆清晰'], correctAnswer: 1, explanation: '"历历在目"形容过去的事情清楚地出现在眼前。' },
  { id: 'i077', type: 'distinguish', question: '"记忆犹新"的意思是：', options: ['A. 记忆很好', 'B. 过去的事印象还很深', 'C. 记忆犹在', 'D. 记忆清晰'], correctAnswer: 1, explanation: '"记忆犹新"指过去的事情印象还很深，记得很清楚。' },
  { id: 'i078', type: 'distinguish', question: '"恍如隔世"形容：', options: ['A. 好像隔了一世', 'B. 感觉一切都变了', 'C. 隔世之感', 'D. 世事变迁'], correctAnswer: 1, explanation: '"恍如隔世"形容仿佛隔了一代，感觉一切都变了。' },
  { id: 'i079', type: 'distinguish', question: '"历久弥新"的意思是：', options: ['A. 很久还是新的', 'B. 经过长久时间反而更加鲜活', 'C. 历久弥坚', 'D. 越久越好'], correctAnswer: 1, explanation: '"历久弥新"指经历长久的时间而更加鲜活，更加有活力。' },
  { id: 'i080', type: 'distinguish', question: '"源远流长"形容：', options: ['A. 河流很长', 'B. 历史悠久', 'C. 来源很远', 'D. 流传久远'], correctAnswer: 1, explanation: '"源远流长"形容河流的源头很远，水流很长，比喻历史悠久。' },
  { id: 'i081', type: 'distinguish', question: '"博大精深"形容：', options: ['A. 广大深厚', 'B. 思想、学识等广博高深', 'C. 博大', 'D. 精深'], correctAnswer: 1, explanation: '"博大精深"形容思想、学说等广博高深。' },
  { id: 'i082', type: 'distinguish', question: '"脍炙人口"的意思是：', options: ['A. 很多人吃', 'B. 好的诗文为众人称颂', 'C. 流行广泛', 'D. 口口相传'], correctAnswer: 1, explanation: '"脍炙人口"比喻好的诗文或事物为众人所称颂。' },
  { id: 'i083', type: 'distinguish', question: '"喜闻乐见"形容：', options: ['A. 喜欢听喜欢看', 'B. 很受欢迎', 'C. 众人喜欢', 'D. 大众喜爱'], correctAnswer: 1, explanation: '"喜闻乐见"指喜欢听，乐意看，形容很受欢迎。' },
  { id: 'i084', type: 'distinguish', question: '"津津乐道"的意思是：', options: ['A. 很有味道地说', 'B. 很有兴趣地谈论', 'C. 快乐地说', 'D. 津津有味'], correctAnswer: 1, explanation: '"津津乐道"形容很有兴趣地谈论。' },
  { id: 'i085', type: 'distinguish', question: '"夸夸其谈"形容：', options: ['A. 说话流利', 'B. 说话浮夸不切实际', 'C. 夸夸其谈', 'D. 说话夸张'], correctAnswer: 1, explanation: '"夸夸其谈"形容说话浮夸，不切实际。' },
  { id: 'i086', type: 'distinguish', question: '"口若悬河"形容：', options: ['A. 说话像河水', 'B. 口才好，说话多', 'C. 善于言谈', 'D. 能说会道'], correctAnswer: 1, explanation: '"口若悬河"形容口才好，说话多而流畅。' },
  { id: 'i087', type: 'distinguish', question: '"滔滔不绝"的意思是：', options: ['A. 河水不断', 'B. 话多不断', 'C. 连续不断', 'D. 说话连续'], correctAnswer: 1, explanation: '"滔滔不绝"形容话很多，连续不断。' },
  { id: 'i088', type: 'distinguish', question: '"娓娓道来"形容：', options: ['A. 说话动听', 'B. 温柔从容地说话', 'C. 娓娓而谈', 'D. 说话好听'], correctAnswer: 1, explanation: '"娓娓道来"形容说话温柔从容，不间断。' },
  { id: 'i089', type: 'distinguish', question: '"喋喋不休"形容：', options: ['A. 说话不停', 'B. 没完没了地说', 'C. 说话多', 'D. 啰嗦'], correctAnswer: 1, explanation: '"喋喋不休"形容说话没完没了。' },
  { id: 'i090', type: 'distinguish', question: '"振振有词"的意思是：', options: ['A. 说得有理', 'B. 理直气壮地说', 'C. 振振有词', 'D. 说话有力'], correctAnswer: 1, explanation: '"振振有词"形容理由似乎很充分，说个不休。' },

  // 成语近义反义
  { id: 'i091', type: 'relation', question: '"事半功倍"的反义词是：', options: ['A. 事倍功半', 'B. 事半功半', 'C. 事半工倍', 'D. 功半事倍'], correctAnswer: 0, explanation: '"事半功倍"的反义词是"事倍功半"。' },
  { id: 'i092', type: 'relation', question: '"深谋远虑"的近义词是：', options: ['A. 深思熟虑', 'B. 老谋深算', 'C. 谋划深远', 'D. 考虑周全'], correctAnswer: 0, explanation: '"深谋远虑"的近义词是"深思熟虑"。' },
  { id: 'i093', type: 'relation', question: '"唯利是图"的反义词是：', options: ['A. 大公无私', 'B. 公而忘私', 'C. 先公后私', 'D. 不谋私利'], correctAnswer: 0, explanation: '"唯利是图"的反义词是"大公无私"。' },
  { id: 'i094', type: 'relation', question: '"粗心大意"的反义词是：', options: ['A. 小心谨慎', 'B. 细心', 'C. 一丝不苟', 'D. 精益求精'], correctAnswer: 0, explanation: '"粗心大意"的反义词是"小心谨慎"。' },
  { id: 'i095', type: 'relation', question: '"举世闻名"的近义词是：', options: ['A. 赫赫有名', 'B. 世界闻名', 'C. 名扬天下', 'D. 大名鼎鼎'], correctAnswer: 0, explanation: '"举世闻名"的近义词是"赫赫有名"。' },
  { id: 'i096', type: 'relation', question: '"微不足道"的反义词是：', options: ['A. 举足轻重', 'B. 举足轻重', 'C. 至关重要', 'D. 非常重要'], correctAnswer: 0, explanation: '"微不足道"的反义词是"举足轻重"。' },
  { id: 'i097', type: 'relation', question: '"斤斤计较"的近义词是：', options: ['A. 锱铢必较', 'B. 睚眦必报', 'C. 斤斤计较', 'D. 计较小事'], correctAnswer: 0, explanation: '"斤斤计较"的近义词是"锱铢必较"。' },
  { id: 'i098', type: 'relation', question: '"漠不关心"的反义词是：', options: ['A. 关怀备至', 'B. 关心体贴', 'C. 体贴入微', 'D. 热情关怀'], correctAnswer: 0, explanation: '"漠不关心"的反义词是"关怀备至"。' },
  { id: 'i099', type: 'relation', question: '"一帆风顺"的反义词是：', options: ['A. 千难万险', 'B. 艰难曲折', 'C. 曲折坎坷', 'D. 风雨飘摇'], correctAnswer: 0, explanation: '"一帆风顺"的反义词是"千难万险"。' },
  { id: 'i100', type: 'relation', question: '"垂头丧气"的近义词是：', options: ['A. 灰心丧气', 'B. 没精打采', 'C. 垂头丧气', 'D. 丧气'], correctAnswer: 1, explanation: '"垂头丧气"的近义词是"没精打采"。' }
]

function Idiom() {
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  // 记录每道题的答案，用于保存到 answer_history
  const userAnswers = useRef({})

  const currentQuestion = questions[currentIndex]

  useDidShow(() => {
    startPractice()
    loadFavorites()
  })

  // 启用页面分享
  useShareAppMessage(() => {
    return pageShareConfigs.idiom
  })

  // 启用朋友圈分享
  useShareTimeline(() => {
    return {
      title: pageShareConfigs.idiom.title,
      query: ''
    }
  })

  /**
   * 加载用户的收藏列表
   */
  const loadFavorites = async () => {
    try {
      const favorites = await questionService.getFavorites(1, 1000)
      FAVORITES_CACHE = new Set(favorites.map(f => f.id || f._id))
      updateFavoriteStatus()
    } catch (err) {
      console.error('加载收藏失败:', err)
    }
  }

  /**
   * 更新当前题目的收藏状态
   */
  const updateFavoriteStatus = () => {
    if (currentQuestion) {
      setIsFavorited(FAVORITES_CACHE.has(currentQuestion.id))
    }
  }

  /**
   * 切换收藏状态
   */
  const handleToggleFavorite = async () => {
    if (!currentQuestion || favoriteLoading) return

    setFavoriteLoading(true)
    try {
      // 传递完整的题目数据
      const questionData = {
        id: currentQuestion.id,
        type: currentQuestion.type || 'idiom',
        question: currentQuestion.question,
        options: currentQuestion.options,
        correctAnswer: currentQuestion.correctAnswer,
        explanation: currentQuestion.explanation || ''
      }

      const success = await questionService.toggleFavorite(currentQuestion.id, questionData)
      if (success) {
        if (isFavorited) {
          FAVORITES_CACHE.delete(currentQuestion.id)
        } else {
          FAVORITES_CACHE.add(currentQuestion.id)
        }
        setIsFavorited(!isFavorited)
        Taro.showToast({
          title: isFavorited ? '已取消收藏' : '已收藏',
          icon: isFavorited ? 'none' : 'success',
          duration: 1500
        })
      }
    } catch (err) {
      console.error('收藏失败:', err)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      setFavoriteLoading(false)
    }
  }

  // 题目变化时更新收藏状态
  useEffect(() => {
    updateFavoriteStatus()
  }, [currentIndex, questions])

  const startPractice = () => {
    // 随机打乱题目，取10道
    const shuffled = [...IDIOM_QUESTIONS].sort(() => Math.random() - 0.5)
    setQuestions(shuffled.slice(0, 10))
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setCompleted(false)
    userAnswers.current = {} // 清空答案记录
  }

  const handleAnswer = (index) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(index)

    const currentQuestion = questions[currentIndex]
    // 记录用户答案
    userAnswers.current[currentQuestion.id] = index

    if (index === currentQuestion.correctAnswer) {
      setScore(score + 1)
    }
    setShowResult(true)
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      finishPractice()
    }
  }

  const finishPractice = async () => {
    console.log('=== finishPractice 被调用 (成语) ===')
    console.log('questions 数量:', questions.length)
    console.log('userAnswers.current:', JSON.stringify(userAnswers.current))

    setCompleted(true)

    // 准备答题数据，包含完整题目信息
    const answerData = questions.map(q => {
      const userAnswer = userAnswers.current[q.id] ?? -1
      const isCorrect = userAnswer === q.correctAnswer
      return {
        questionId: q.id,
        answer: userAnswer,
        isCorrect,
        questionType: 'idiom',
        // 包含完整题目信息，以便错题重做时使用
        questionText: q.question || '',
        options: q.options || [],
        correctAnswer: q.correctAnswer
      }
    })

    console.log('=== answerData 准备完成 (成语) ===')
    console.log('answerData 数量:', answerData.length)

    // 1. 保存答题历史到 answer_history
    try {
      console.log('=== 开始调用 question 云函数 submitBatch (成语) ===')
      const submitResult = await Taro.cloud.callFunction({
        name: 'question',
        data: {
          action: 'submitBatch',
          answers: answerData
        }
      })
      console.log('=== question 云函数返回 (成语) ===')
      console.log('result:', JSON.stringify(submitResult.result))
    } catch (err) {
      console.error('=== question 云函数调用失败 (成语) ===')
      console.error('错误:', err.errMsg || err.message)
      Taro.showToast({ title: '保存失败，请重试', icon: 'none', duration: 2000 })
    }

    // 2. 保存学习记录到 study_records
    try {
      await studyService.addRecord({
        type: 'idiom',
        title: '成语学习',
        score: Math.round((score / questions.length) * 100),
        totalQuestions: questions.length,
        correctAnswers: score,
        duration: 5
      })

      eventBus.emit(EVENTS.STUDY_RECORD_UPDATED, {
        type: 'idiom',
        score: Math.round((score / questions.length) * 100),
        correctCount: score,
        totalCount: questions.length
      })
    } catch (err) {
      console.error('保存学习记录失败:', err)
    }
  }

  if (questions.length === 0) {
    return <View className="idiom-page"><Text>加载中...</Text></View>
  }

  if (completed) {
    return (
      <View className="idiom-page">
        <View className="result-page">
          <View className="result-card">
            <Text className="result-title">练习完成！</Text>
            <Text className="result-score">{score} / {questions.length}</Text>
            <Text className="result-desc">
              {score >= questions.length * 0.8 ? '太棒了！' :
               score >= questions.length * 0.6 ? '继续加油！' : '再练习一下吧！'}
            </Text>
            <View className="result-actions">
              <View className="action-btn secondary" onClick={startPractice}>再练一次</View>
              <View className="action-btn" onClick={() => Taro.navigateBack()}>返回</View>
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="idiom-page">
      {/* 进度条 */}
      <View className="progress-bar">
        <View
          className="progress-fill"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </View>

      <ScrollView scrollY className="content-scroll">
        {/* 题目卡片 */}
        <View className="question-card">
          <View className="question-header">
            <Text className="question-num">第 {currentIndex + 1} / {questions.length} 题</Text>
            <View className="question-tag">成语学习</View>
            <View
              className={`favorite-btn ${isFavorited ? 'favorited' : ''} ${favoriteLoading ? 'loading' : ''}`}
              onClick={handleToggleFavorite}
            >
              <Text className="favorite-icon">{isFavorited ? '★' : '☆'}</Text>
            </View>
          </View>

          <View className="question-content">
            <Text className="question-text">{currentQuestion?.question}</Text>
          </View>

          {/* 选项列表 */}
          <View className="options-list">
            {currentQuestion?.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrect = index === currentQuestion.correctAnswer
              const showCorrect = showResult && isCorrect

              return (
                <View
                  key={index}
                  className={`option-item ${isSelected ? (isCorrect ? 'correct' : 'wrong') : ''} ${showCorrect ? 'correct' : ''}`}
                  onClick={() => handleAnswer(index)}
                >
                  <Text className="option-text">{option}</Text>
                  {showCorrect && <Text className="option-icon">✓</Text>}
                  {isSelected && !isCorrect && <Text className="option-icon">×</Text>}
                </View>
              )
            })}
          </View>

          {/* 解析 */}
          {showResult && currentQuestion?.explanation && (
            <View className="explanation-box">
              <Text className="explanation-label">解析</Text>
              <Text className="explanation-text">{currentQuestion.explanation}</Text>
            </View>
          )}

          {/* 下一题按钮 */}
          {showResult && (
            <View className="next-btn" onClick={handleNext}>
              <Text>{currentIndex < questions.length - 1 ? '下一题' : '查看结果'}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default Idiom
