/**
 * 词汇学习页面 - 选择题模式
 */
import { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import studyService from '../../services/study'
import questionService from '../../services/question'
import eventBus, { EVENTS } from '../../utils/eventBus'
import { pageShareConfigs } from '../../utils/share'
import './index.less'

// 收藏状态缓存
let FAVORITES_CACHE = new Set()

// 词汇选择题库（基于K12真题）
const VOCABULARY_QUESTIONS = [
  // 词语释义选择
  { id: 'v001', type: 'meaning', question: '"焕然一新"的意思是：', options: ['A. 完全改变', 'B. 出现崭新的面貌', 'C. 美丽无比', 'D. 重新开始'], correctAnswer: 1, explanation: '"焕然一新"形容出现了崭新的面貌。' },
  { id: 'v002', type: 'meaning', question: '"谈笑风生"的意思是：', options: ['A. 谈话有风', 'B. 谈笑风声', 'C. 形容谈话兴致很高', 'D. 有说有笑'], correctAnswer: 2, explanation: '"谈笑风生"形容谈话时有说有笑，兴致很高。' },
  { id: 'v003', type: 'meaning', question: '"美轮美奂"形容：', options: ['A. 美丽风景', 'B. 高大华丽建筑', 'C. 美丽的人', 'D. 美好音乐'], correctAnswer: 1, explanation: '"美轮美奂"形容房屋高大华丽。' },
  { id: 'v004', type: 'meaning', question: '"川流不息"形容：', options: ['A. 山川河流', 'B. 行人车辆连续不断', 'C. 河流不断', 'D. 风景优美'], correctAnswer: 1, explanation: '"川流不息"形容行人、车马等像水流一样连续不断。' },
  { id: 'v005', type: 'meaning', question: '"因地制宜"的意思是：', options: ['A. 改造环境', 'B. 根据当地制定办法', 'C. 适应环境', 'D. 改变制度'], correctAnswer: 1, explanation: '"因地制宜"指根据各地的具体情况，制定适宜的办法。' },
  { id: 'v006', type: 'meaning', question: '"鳞次栉比"形容：', options: ['A. 排列密集整齐', 'B. 鱼和梳子', 'C. 次序混乱', 'D. 整齐稀疏'], correctAnswer: 0, explanation: '"鳞次栉比"形容房屋或船只等排列得很密很整齐。' },
  { id: 'v007', type: 'meaning', question: '"别出心裁"的意思是：', options: ['A. 独创一格', 'B. 奇怪', 'C. 特殊', 'D. 普通'], correctAnswer: 0, explanation: '"别出心裁"指独创一格，与众不同。' },
  { id: 'v008', type: 'meaning', question: '"抑扬顿挫"形容：', options: ['A. 声音高低起伏', 'B. 情绪变化', 'C. 动作起伏', 'D. 思想变化'], correctAnswer: 0, explanation: '"抑扬顿挫"指声音的高低起伏和停顿转折。' },
  { id: 'v009', type: 'meaning', question: '"锲而不舍"比喻：', options: ['A. 坚持不懈', 'B. 半途而废', 'C. 坚决', 'D. 努力'], correctAnswer: 0, explanation: '"锲而不舍"比喻有恒心，有毅力，坚持不懈。' },
  { id: 'v010', type: 'meaning', question: '"未雨绸缪"意思是：', options: ['A. 下雨前准备', 'B. 事先做好准备', 'C. 防止下雨', 'D. 天气预报'], correctAnswer: 1, explanation: '"未雨绸缪"比喻事先做好准备工作。' },

  // 词语运用（选词填空）
  { id: 'v011', type: 'fill', question: '依次填入横线处最恰当的词语：\n冰雪旅游、体育赛事等多领域协同发展，为社会____了更多的就业和发展机会。', options: ['A. 创造', 'B. 打造', 'C. 制造', 'D. 建造'], correctAnswer: 0, explanation: '"创造机会"是固定搭配。' },
  { id: 'v012', type: 'fill', question: '依次填入横线处最恰当的词语：\n财政投入与改善民生____相融合，____了城市运行水平的提高。', options: ['A. 提升/促进', 'B. 提高/促成', 'C. 提升/促成', 'D. 提高/促进'], correctAnswer: 0, explanation: '"提升"与水平搭配，"促进"与提高搭配。' },
  { id: 'v013', type: 'fill', question: '依次填入横线处最恰当的词语：\n在新时代背景下，明确竞技体育的未来发展____和改良策略，实现竞技体育发展理念的____。', options: ['A. 导向/转移', 'B. 方向/转变', 'C. 导向/转变', 'D. 方向/转移'], correctAnswer: 2, explanation: '"发展导向"是常用搭配，"发展理念转变"也符合语境。' },
  { id: 'v014', type: 'fill', question: '依次填入横线处最恰当的词语：\n体育比赛中，技术是完成战术配合的____，而战术的不断____和发展又对技术提出更高要求。', options: ['A. 基准/演示', 'B. 基础/演变', 'C. 基准/演变', 'D. 基础/演示'], correctAnswer: 1, explanation: '"基础"与"配合"搭配，"演变"与"发展"搭配。' },
  { id: 'v015', type: 'fill', question: '依次填入横线处最恰当的词语：\n____竞技体育的快速发展，体育比赛会给人们带来更大的视觉震撼。', options: ['A. 随着', 'B. 随同', 'C. 伴随', 'D. 跟随'], correctAnswer: 0, explanation: '"随着"表示伴随情况的变化。' },

  // 词语书写判断
  { id: 'v016', type: 'writing', question: '下列各组词语中，书写完全正确的一项是：', options: ['A. 编纂 闷葫芦 世外桃园', 'B. 辐射 微循环 偃旗息鼓', 'C. 表彰 峰窝煤 雷厉风行', 'D. 临摹 绊脚石 灸手可热'], correctAnswer: 1, explanation: 'A项"世外桃园"应为"世外桃源"；C项"峰窝煤"应为"蜂窝煤"；D项"灸手可热"应为"炙手可热"。' },
  { id: 'v017', type: 'writing', question: '下列各组词语中，书写完全正确的一项是：', options: ['A. 问鼎 逆时针 雷霆万钧', 'B. 荣膺 间奏曲 戮力同心', 'C. 请樱 殊不知 甚器尘上', 'D. 抛锚 书券气 旁征博引'], correctAnswer: 1, explanation: 'A项"逆时针"正确；B项全部正确；C项"请樱"应为"请缨"，"甚器尘上"应为"甚嚣尘上"；D项"书券气"应为"书卷气"。' },
  { id: 'v018', type: 'writing', question: '下列各组词语中，书写完全正确的一项是：', options: ['A. 等候 坐上客 鞠躬尽瘁', 'B. 奢华 牛角尖 轻重缓急', 'C. 少许 历程碑 居安思危', 'D. 稍息 居留权 礼上往来'], correctAnswer: 1, explanation: 'A项"坐上客"应为"座上客"；C项"历程碑"应为"里程碑"；D项"礼上往来"应为"礼尚往来"。' },
  { id: 'v019', type: 'writing', question: '下列各组词语中，书写完全正确的一项是：', options: ['A. 伎两 殊不知 删删来迟', 'B. 期待 全天候 入不敷出', 'C. 寻觅 流览器 按步就班', 'D. 偶像 坐谈会 关怀倍至'], correctAnswer: 1, explanation: 'A项"伎两"应为"伎俩"，"删删来迟"应为"姗姗来迟"；C项"流览器"应为"浏览器"，"按步就班"应为"按部就班"；D项"坐谈会"应为"座谈会"，"关怀倍至"应为"关怀备至"。' },
  { id: 'v020', type: 'writing', question: '下列各组词语中，书写完全正确的一项是：', options: ['A. 温馨 墨许 渺无人烟', 'B. 启蒙 冥想 矫往过正', 'C. 鹅黄 雀跃 闻鸡起舞', 'D. 藐视 扼腕 花拳秀腿'], correctAnswer: 2, explanation: 'A项"墨许"应为"默许"；B项"矫往过正"应为"矫枉过正"；D项"花拳秀腿"应为"花拳绣腿"。' },

  // 词语辨析
  { id: 'v021', type: 'distinguish', question: '"相得益彰"的意思是：', options: ['A. 互相配合', 'B. 互相配合，双方能力更能发挥', 'C. 各有千秋', 'D. 取长补短'], correctAnswer: 1, explanation: '"相得益彰"指两个人或两件事物互相配合，双方的能力和作用更能显示出来。' },
  { id: 'v022', type: 'distinguish', question: '"厚积薄发"形容：', options: ['A. 积累后释放', 'B. 长时间积累后慢慢释放', 'C. 多积少发', 'D. 发财致富'], correctAnswer: 1, explanation: '"厚积薄发"形容长时间积累，慢慢释放出来。' },
  { id: 'v023', type: 'distinguish', question: '"脍炙人口"形容：', options: ['A. 很多人吃', 'B. 美味可口', 'C. 为众人所称颂', 'D. 流行广泛'], correctAnswer: 2, explanation: '"脍炙人口"比喻好的诗文或事物为众人所称颂。' },
  { id: 'v024', type: 'distinguish', question: '"望洋兴叹"比喻：', options: ['A. 看海感叹', 'B. 力不从心', 'C. 无可奈何', 'D. 前途渺茫'], correctAnswer: 2, explanation: '"望洋兴叹"比喻做事时因力不胜任或没有条件而感到无可奈何。' },
  { id: 'v025', type: 'distinguish', question: '"叶公好龙"比喻：', options: ['A. 真的喜欢龙', 'B. 口头上说爱好，实际不真爱好', 'C. 喜欢动物', 'D. 爱好广泛'], correctAnswer: 1, explanation: '"叶公好龙"比喻口头上说爱好某事物，实际上并不真爱好。' },
  { id: 'v026', type: 'distinguish', question: '"杞人忧天"比喻：', options: ['A. 忧虑天气', 'B. 不必要的忧虑', 'C. 担心天下', 'D. 爱管闲事'], correctAnswer: 1, explanation: '"杞人忧天"比喻不必要的或缺乏根据的忧虑和担心。' },
  { id: 'v027', type: 'distinguish', question: '"杯弓蛇影"比喻：', options: ['A. 杯子和蛇', 'B. 疑神疑鬼', 'C. 恐惧害怕', 'D. 危险重重'], correctAnswer: 1, explanation: '"杯弓蛇影"比喻因疑神疑鬼而引起恐惧。' },
  { id: 'v028', type: 'distinguish', question: '"画蛇添足"比喻：', options: ['A. 画画很好', 'B. 做事认真', 'C. 做多余的事反不好', 'D. 画蛇技巧高超'], correctAnswer: 2, explanation: '"画蛇添足"比喻做了多余的事，非但无益，反而不合适。' },
  { id: 'v029', type: 'distinguish', question: '"守株待兔"比喻：', options: ['A. 等待机会', 'B. 死守经验不知变通', 'C. 耐心等待', 'D. 期盼成功'], correctAnswer: 1, explanation: '"守株待兔"比喻死守狭隘经验，不知变通。' },
  { id: 'v030', type: 'distinguish', question: '"刻舟求剑"比喻：', options: ['A. 记性好', 'B. 拘泥成法不知变通', 'C. 做事坚持', 'D. 纪念深刻'], correctAnswer: 1, explanation: '"刻舟求剑"比喻拘泥成法，不知道变通。' },
  { id: 'v031', type: 'distinguish', question: '"亡羊补牢"的意思是：', options: ['A. 羊丢了', 'B. 出问题后补救', 'C. 太晚了', 'D. 修补羊圈'], correctAnswer: 1, explanation: '"亡羊补牢"比喻出了问题以后想办法补救，可以防止继续受损失。' },
  { id: 'v032', type: 'distinguish', question: '"掩耳盗铃"比喻：', options: ['A. 偷东西', 'B. 自己欺骗自己', 'C. 掩盖错误', 'D. 蒙骗别人'], correctAnswer: 1, explanation: '"掩耳盗铃"比喻自己欺骗自己。' },
  { id: 'v033', type: 'distinguish', question: '"南辕北辙"比喻：', options: ['A. 南方到北方', 'B. 行动和目的相反', 'C. 路途遥远', 'D. 方向正确'], correctAnswer: 1, explanation: '"南辕北辙"比喻行动和目的正好相反。' },
  { id: 'v034', type: 'distinguish', question: '"一鸣惊人"比喻：', options: ['A. 叫声很大', 'B. 突然成功', 'C. 平时不突出，一做就有惊人成绩', 'D. 令人惊讶'], correctAnswer: 2, explanation: '"一鸣惊人"比喻平时没有特殊表现，一做起来就有惊人的成绩。' },
  { id: 'v035', type: 'distinguish', question: '"胸有成竹"比喻：', options: ['A. 身体健康', 'B. 做事有把握', 'C. 喜欢画画', 'D. 心里有数'], correctAnswer: 1, explanation: '"胸有成竹"比喻做事之前已经有通盘的考虑。' },
  { id: 'v036', type: 'distinguish', question: '"望梅止渴"比喻：', options: ['A. 喜欢吃梅子', 'B. 用空想安慰自己', 'C. 渴望成功', 'D. 充满希望'], correctAnswer: 1, explanation: '"望梅止渴"比喻用空想安慰自己。' },
  { id: 'v037', type: 'distinguish', question: '"拔苗助长"比喻：', options: ['A. 帮助植物生长', 'B. 急于求成反而坏事', 'C. 辛勤劳动', 'D. 农业生产'], correctAnswer: 1, explanation: '"拔苗助长"比喻违反事物发展的客观规律，急于求成，反而把事情弄糟。' },
  { id: 'v038', type: 'distinguish', question: '"滥竽充数"比喻：', options: ['A. 音乐演奏', 'B. 没有真才实学的人混在行家里面充数', 'C. 人多热闹', 'D. 欺骗行为'], correctAnswer: 1, explanation: '"滥竽充数"比喻没有真才实学的人混在行家里面充数。' },
  { id: 'v039', type: 'distinguish', question: '"对牛弹琴"比喻：', options: ['A. 对牛弹琴', 'B. 对不懂道理的人讲道理', 'C. 音乐欣赏', 'D. 耐心教学'], correctAnswer: 1, explanation: '"对牛弹琴"比喻对不讲道理的人讲道理。' },
  { id: 'v040', type: 'distinguish', question: '"破釜沉舟"比喻：', options: ['A. 砸锅沉船', 'B. 下定决心不顾一切地干到底', 'C. 失败了', 'D. 赌博行为'], correctAnswer: 1, explanation: '"破釜沉舟"比喻下决心不顾一切地干到底。' },
  { id: 'v041', type: 'distinguish', question: '"卧薪尝胆"形容：', options: ['A. 睡觉吃苦', 'B. 刻苦自励', 'C. 生活艰苦', 'D. 坚持不懈'], correctAnswer: 1, explanation: '"卧薪尝胆"形容人刻苦自励，发愤图强。' },
  { id: 'v042', type: 'distinguish', question: '"三顾茅庐"比喻：', options: ['A. 拜访三次', 'B. 诚心诚意地邀请人家', 'C. 喜欢旅游', 'D. 参观茅庐'], correctAnswer: 1, explanation: '"三顾茅庐"比喻诚心诚意地邀请人家。' },
  { id: 'v043', type: 'distinguish', question: '"负荆请罪"表示：', options: ['A. 承认错误', 'B. 向人认错赔罪', 'C. 道歉', 'D. 感谢帮助'], correctAnswer: 1, explanation: '"负荆请罪"表示向人认错赔罪。' },
  { id: 'v044', type: 'distinguish', question: '"完璧归赵"比喻：', options: ['A. 归还物品', 'B. 把物品完好地归还给主人', 'C. 送礼', 'D. 借东西'], correctAnswer: 1, explanation: '"完璧归赵"比喻把物品完好地归还给物品的主人。' },

  // 近义词辨析
  { id: 'v045', type: 'synonym', question: '"精致"和"精巧"的主要区别是：', options: ['A. 没有区别', 'B. 精致侧重细致，精巧侧重巧妙', 'C. 精致侧重巧妙，精巧侧重细致', 'D. 精致用于大物体，精巧用于小物体'], correctAnswer: 1, explanation: '"精致"侧重精细细致，"精巧"侧重精妙巧妙。' },
  { id: 'v046', type: 'synonym', question: '"废除"和"废止"的正确使用是：', options: ['A. 废除法令，废止制度', 'B. 废除制度，废止法令', 'C. 废除条约，废止法律', 'D. 两者可以互换'], correctAnswer: 1, explanation: '"废除"多用于制度、习俗，"废止"多用于法令、条例。' },
  { id: 'v047', type: 'synonym', question: '"必须"和"必需"的区别是：', options: ['A. 完全相同', 'B. 必须是副词，必需是动词', 'C. 必须是动词，必需是副词', 'D. 都是动词'], correctAnswer: 1, explanation: '"必须"是副词，表示一定要；"必需"是动词，表示一定要有。' },
  { id: 'v048', type: 'synonym', question: '"考察"和"考查"的区别是：', options: ['A. 完全相同', 'B. 考察是实地观察，考查是检验', 'C. 考察是检验，考查是实地观察', 'D. 两者可以互换'], correctAnswer: 1, explanation: '"考察"指实地观察调查，"考查"指用一定标准检验。' },
  { id: 'v049', type: 'synonym', question: '"品味"和"品位"的区别是：', options: ['A. 完全相同', 'B. 品味是品尝，品位是品质', 'C. 品味是品质，品位是品尝', 'D. 都是品尝的意思'], correctAnswer: 1, explanation: '"品味"指品尝、体会，"品位"指品质、水平。' },

  // 词语搭配判断
  { id: 'v050', type: 'collocation', question: '下列搭配正确的一项是：', options: ['A. 发挥作用', 'B. 发扬作用', 'C. 发生作用', 'D. 发扬作用'], correctAnswer: 0, explanation: '"发挥作用"是正确搭配，"发扬"一般与"精神""传统"搭配。' },
  { id: 'v051', type: 'collocation', question: '下列搭配正确的一项是：', options: ['A. 改进缺点', 'B. 改正缺点', 'C. 改正错误', 'D. 改进错误'], correctAnswer: 2, explanation: '"改正错误""改进工作"是正确搭配。' },
  { id: 'v052', type: 'collocation', question: '下列搭配正确的一项是：', options: ['A. 提高效率', 'B. 增高效率', 'C. 升高效率', 'D. 加高效率'], correctAnswer: 0, explanation: '"提高效率"是正确搭配。' },
  { id: 'v053', type: 'collocation', question: '下列搭配正确的一项是：', options: ['A. 增进友谊', 'B. 增加友谊', 'C. 提高友谊', 'D. 升高友谊'], correctAnswer: 0, explanation: '"增进友谊"是正确搭配。' },
  { id: 'v054', type: 'collocation', question: '下列搭配正确的一项是：', options: ['A. 丰富经验', 'B. 丰厚经验', 'C. 富有经验', 'D. 丰裕经验'], correctAnswer: 0, explanation: '"丰富经验"是正确搭配。' },

  // 更多K12真题词汇题
  { id: 'v055', type: 'usage', question: '"不计其数"的意思是：', options: ['A. 不计算数字', 'B. 无法计算数目，形容很多', 'C. 不要计算', 'D. 数不清楚'], correctAnswer: 1, explanation: '"不计其数"形容很多，无法计算。' },
  { id: 'v056', type: 'usage', question: '"迫不及待"的意思是：', options: ['A. 等待不及', 'B. 急迫得不能等待', 'C. 不要等待', 'D. 不能等待'], correctAnswer: 1, explanation: '"迫不及待"形容心情急切，急迫得不能等待。' },
  { id: 'v057', type: 'usage', question: '"兴高采烈"形容：', options: ['A. 兴致高', 'B. 兴致高昂，情绪热烈', 'C. 高兴采花', 'D. 热烈讨论'], correctAnswer: 1, explanation: '"兴高采烈"形容兴致高，情绪热烈。' },
  { id: 'v058', type: 'usage', question: '"小心翼翼"形容：', options: ['A. 非常小心', 'B. 举动谨慎，不敢疏忽', 'C. 容易恐惧', 'D. 小心眼'], correctAnswer: 1, explanation: '"小心翼翼"形容举动谨慎，不敢疏忽。' },
  { id: 'v059', type: 'usage', question: '"恍然大悟"的意思是：', options: ['A. 突然明白', 'B. 忽然大悟', 'C. 恍惚明白', 'D. 大悟'], correctAnswer: 1, explanation: '"恍然大悟"形容一下子明白过来。' },
  { id: 'v060', type: 'usage', question: '"不约而同"的意思是：', options: ['A. 没有约定', 'B. 事先没有商量而行动一致', 'C. 不同意', 'D. 不一致'], correctAnswer: 1, explanation: '"不约而同"指事先没有商量而相互一致。' },
  { id: 'v061', type: 'usage', question: '"全神贯注"形容：', options: ['A. 全部精神集中', 'B. 注意力高度集中', 'C. 全神投入', 'D. 精神饱满'], correctAnswer: 1, explanation: '"全神贯注"形容注意力高度集中。' },
  { id: 'v062', type: 'usage', question: '"目不转睛"形容：', options: ['A. 眼睛不转', 'B. 盯着看', 'C. 注意力集中地看着', 'D. 看不清'], correctAnswer: 2, explanation: '"目不转睛"形容注意力集中地看着。' },
  { id: 'v063', type: 'usage', question: '"聚精会神"的意思是：', options: ['A. 聚集精神', 'B. 精神集中', 'C. 会见神仙', 'D. 精神饱满'], correctAnswer: 1, explanation: '"聚精会神"形容精神集中。' },
  { id: 'v064', type: 'usage', question: '"津津有味"形容：', options: ['A. 有味道', 'B. 吃得香', 'C. 兴趣浓厚', 'D. 有滋味'], correctAnswer: 2, explanation: '"津津有味"形容吃得很有味道或很有兴趣。' },
  { id: 'v065', type: 'usage', question: '"垂头丧气"形容：', options: ['A. 低下头', 'B. 丧气失望', 'C. 失望沮丧', 'D. 头低下来'], correctAnswer: 2, explanation: '"垂头丧气"形容失望沮丧的神情。' },
  { id: 'v066', type: 'usage', question: '"兴高采烈"的反义词是：', options: ['A. 兴致勃勃', 'B. 无精打采', 'C. 高高兴兴', 'D. 欢天喜地'], correctAnswer: 1, explanation: '"无精打采"是"兴高采烈"的反义词。' },
  { id: 'v067', type: 'usage', question: '"鸦雀无声"形容：', options: ['A. 非常安静', 'B. 鸟雀没有声音', 'C. 寂静无声', 'D. 悄悄无声'], correctAnswer: 0, explanation: '"鸦雀无声"形容非常安静。' },
  { id: 'v068', type: 'usage', question: '"琳琅满目"形容：', options: ['A. 眼睛满了', 'B. 美好事物很多', 'C. 满眼都是', 'D. 丰富多样'], correctAnswer: 1, explanation: '"琳琅满目"形容美好事物很多。' },
  { id: 'v069', type: 'usage', question: '"美不胜收"的意思是：', options: ['A. 收不了', 'B. 美好的东西太多，看不过来', 'C. 美丽', 'D. 收获美'], correctAnswer: 1, explanation: '"美不胜收"形容美好的东西太多，看不过来。' },
  { id: 'v070', type: 'usage', question: '"一望无际"形容：', options: ['A. 看不到边', 'B. 非常广阔', 'C. 一眼望不到边', 'D. 无边无际'], correctAnswer: 2, explanation: '"一望无际"形容一眼望不到边，非常辽阔。' },
  { id: 'v071', type: 'usage', question: '"千方百计"的意思是：', options: ['A. 一千个方法', 'B. 想尽或用尽一切办法', 'C. 很多办法', 'D. 各种办法'], correctAnswer: 1, explanation: '"千方百计"形容想尽或用尽一切办法。' },
  { id: 'v072', type: 'usage', question: '"不辞劳苦"的意思是：', options: ['A. 不怕辛苦', 'B. 不推辞劳苦', 'C. 不怕劳累', 'D. 辛勤劳作'], correctAnswer: 1, explanation: '"不辞劳苦"形容不推辞劳累辛苦。' },
  { id: 'v073', type: 'usage', question: '"任劳任怨"形容：', options: ['A. 劳作', 'B. 做事不辞劳苦，不怕埋怨', 'C. 任劳任怨', 'D. 辛勤工作'], correctAnswer: 1, explanation: '"任劳任怨"形容做事不辞劳苦，不怕别人埋怨。' },
  { id: 'v074', type: 'usage', question: '"一丝不苟"形容：', options: ['A. 不马虎', 'B. 连最细微的地方也不马虎', 'C. 认真', 'D. 细心'], correctAnswer: 1, explanation: '"一丝不苟"形容连最细微的地方也不马虎。' },

  // 词语理解与运用
  { id: 'v075', type: 'understand', question: '"心旷神怡"形容：', options: ['A. 心情舒畅', 'B. 精神愉快', 'C. 心胸开阔，精神愉快', 'D. 高兴'], correctAnswer: 2, explanation: '"心旷神怡"形容心胸开阔，精神愉快。' },
  { id: 'v076', type: 'understand', question: '"赏心悦目"形容：', options: ['A. 看着舒服', 'B. 因欣赏美好景物而心情舒畅', 'C. 美好', 'D. 悦目'], correctAnswer: 1, explanation: '"赏心悦目"形容因欣赏美好的景物而心情舒畅。' },
  { id: 'v077', type: 'understand', question: '"心花怒放"形容：', options: ['A. 高兴', 'B. 极其高兴', 'C. 开心', 'D. 兴奋'], correctAnswer: 1, explanation: '"心花怒放"形容极其高兴。' },
  { id: 'v078', type: 'understand', question: '"欣喜若狂"的意思是：', options: ['A. 高兴得发狂', 'B. 高兴到了极点', 'C. 狂喜', 'D. 欣喜'], correctAnswer: 1, explanation: '"欣喜若狂"形容高兴到了极点。' },
  { id: 'v079', type: 'understand', question: '"心平气和"形容：', options: ['A. 平静', 'B. 心情平静，态度温和', 'C. 和气', 'D. 冷静'], correctAnswer: 1, explanation: '"心平气和"形容心情平静，态度温和。' },
  { id: 'v080', type: 'understand', question: '"从容不迫"的意思是：', options: ['A. 不慌不忙', 'B. 非常镇静，不慌不忙', 'C. 冷静', 'D. 沉着'], correctAnswer: 1, explanation: '"从容不迫"形容非常镇静，不慌不忙。' }
]

function Vocabulary() {
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
    return pageShareConfigs.vocabulary
  })

  // 启用朋友圈分享
  useShareTimeline(() => {
    return {
      title: pageShareConfigs.vocabulary.title,
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

    // 打印当前题目数据
    console.log('=== handleToggleFavorite 当前题目 ===')
    console.log('currentQuestion:', currentQuestion)

    try {
      // 传递完整的题目数据
      const questionData = {
        id: currentQuestion.id,
        type: currentQuestion.type || 'vocabulary',
        question: currentQuestion.question,
        options: currentQuestion.options,
        correctAnswer: currentQuestion.correctAnswer,
        explanation: currentQuestion.explanation || ''
      }

      console.log('=== 准备发送的 questionData ===', questionData)

      const success = await questionService.toggleFavorite(currentQuestion.id, questionData)

      console.log('=== toggleFavorite 返回结果 ===', success)

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
    const shuffled = [...VOCABULARY_QUESTIONS].sort(() => Math.random() - 0.5)
    setQuestions(shuffled.slice(0, 10))
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setCompleted(false)
    userAnswers.current = {} // 清空答案记录
  }

  const handleAnswer = (index) => {
    if (selectedAnswer !== null) {
      return
    }
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
    setCompleted(true)

    // 准备答题数据，包含完整题目信息
    const answerData = questions.map(q => {
      const userAnswer = userAnswers.current[q.id] ?? -1
      const isCorrect = userAnswer === q.correctAnswer
      return {
        questionId: q.id,
        answer: userAnswer,
        isCorrect,
        questionType: 'vocabulary',
        // 包含完整题目信息，以便错题重做时使用
        questionText: q.question || '',
        options: q.options || [],
        correctAnswer: q.correctAnswer
      }
    })

    // 1. 保存答题历史到 answer_history
    try {
      const submitResult = await Taro.cloud.callFunction({
        name: 'question',
        data: {
          action: 'submitBatch',
          answers: answerData
        }
      })
      console.log('=== 云函数返回完整数据 ===', JSON.stringify(submitResult))
      // 兼容两种返回格式：扁平结构和嵌套 data 结构
      const result = submitResult.result || submitResult || {}
      console.log('=== result ===', JSON.stringify(result))
      // 新格式：直接从 result 读取
      // 旧格式：从 result.data 读取
      const saved = result.savedCount ?? result.data?.savedCount ?? '?'
      const version = result.version ?? result.data?.version ?? 'no-ver'
      console.log('=== 解析结果 ===', { saved, version, total: answerData.length })
    } catch (err) {
      console.error('=== 云函数调用失败 ===', err)
      Taro.showToast({ title: '保存失败，请重试', icon: 'none', duration: 2000 })
      throw err
    }

    // 2. 保存学习记录到 study_records
    try {
      await studyService.addRecord({
        type: 'vocabulary',
        title: '词汇学习',
        score: Math.round((score / questions.length) * 100),
        totalQuestions: questions.length,
        correctAnswers: score,
        duration: 5
      })

      eventBus.emit(EVENTS.STUDY_RECORD_UPDATED, {
        type: 'vocabulary',
        score: Math.round((score / questions.length) * 100),
        correctCount: score,
        totalCount: questions.length
      })
    } catch (err) {
      console.error('保存学习记录失败:', err)
    }
  }

  if (questions.length === 0) {
    return <View className="vocabulary-page"><Text>加载中...</Text></View>
  }

  if (completed) {
    return (
      <View className="vocabulary-page">
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
    <View className="vocabulary-page">
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
            <View className="question-tag">词汇学习</View>
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

export default Vocabulary
