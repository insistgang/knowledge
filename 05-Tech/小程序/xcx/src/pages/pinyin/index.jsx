/**
 * 拼音学习页面 - 选择题模式
 */
import { useState, useRef, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useDidShow, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import studyService from '../../services/study'
import questionService from '../../services/question'
import eventBus, { EVENTS } from '../../utils/eventBus'
import { pageShareConfigs } from '../../utils/share'
import './index.less'

// 收藏状态缓存
let FAVORITES_CACHE = new Set()

// 拼音选择题库
const PINYIN_QUESTIONS = [
  // 选择正确读音
  { id: 'p001', type: 'pronunciation', question: '"中"的正确读音是：', options: ['A. zōng', 'B. zhōng', 'C. zòng'], correctAnswer: 1, explanation: '"中"读 zhōng，表示中间、中心。' },
  { id: 'p002', type: 'pronunciation', question: '"国"的正确读音是：', options: ['A. guó', 'B. guō', 'C. gúo'], correctAnswer: 0, explanation: '"国"读 guó，第二声。' },
  { id: 'p003', type: 'pronunciation', question: '"人"的正确读音是：', options: ['A. lén', 'B. rèn', 'C. rén'], correctAnswer: 2, explanation: '"人"读 rén，第二声。' },
  { id: 'p004', type: 'pronunciation', question: '"大"的正确读音是：', options: ['A. dà', 'B. dài', 'C. dá'], correctAnswer: 0, explanation: '"大"读 dà，第四声。' },
  { id: 'p005', type: 'pronunciation', question: '"小"的正确读音是：', options: ['A. xiǎu', 'B. xiǎo', 'C. xǎo'], correctAnswer: 1, explanation: '"小"读 xiǎo，第三声。' },
  { id: 'p006', type: 'pronunciation', question: '"水"的正确读音是：', options: ['A. suǐ', 'B. shùi', 'C. shuǐ'], correctAnswer: 2, explanation: '"水"读 shuǐ，第三声。' },
  { id: 'p007', type: 'pronunciation', question: '"火"的正确读音是：', options: ['A. huǒ', 'B. hǒ', 'C. huò'], correctAnswer: 0, explanation: '"火"读 huǒ，第三声。' },
  { id: 'p008', type: 'pronunciation', question: '"山"的正确读音是：', options: ['A. sān', 'B. shán', 'C. shān'], correctAnswer: 2, explanation: '"山"读 shān，第一声。' },
  { id: 'p009', type: 'pronunciation', question: '"书"的正确读音是：', options: ['A. sū', 'B. shū', 'C. shù'], correctAnswer: 1, explanation: '"书"读 shū，第一声。' },
  { id: 'p010', type: 'pronunciation', question: '"学"的正确读音是：', options: ['A. xüé', 'B. xué', 'C. xě'], correctAnswer: 1, explanation: '"学"读 xué，第二声。' },
  { id: 'p011', type: 'pronunciation', question: '"吃"的正确读音是：', options: ['A. cī', 'B. chī', 'C. chí'], correctAnswer: 1, explanation: '"吃"读 chī，第一声。' },
  { id: 'p012', type: 'pronunciation', question: '"睡"的正确读音是：', options: ['A. suì', 'B. shùi', 'C. shuì'], correctAnswer: 2, explanation: '"睡"读 shuì，第四声。' },
  { id: 'p013', type: 'pronunciation', question: '"走"的正确读音是：', options: ['A. zhǒu', 'B. zǒu', 'C. zòu'], correctAnswer: 1, explanation: '"走"读 zǒu，第三声。' },
  { id: 'p014', type: 'pronunciation', question: '"飞"的正确读音是：', options: ['A. fēī', 'B. fēi', 'C. féi'], correctAnswer: 1, explanation: '"飞"读 fēi，第一声。' },
  { id: 'p015', type: 'pronunciation', question: '"爱"的正确读音是：', options: ['A. āi', 'B. aì', 'C. ài'], correctAnswer: 2, explanation: '"爱"读 ài，第四声。' },

  // 多音字辨析
  { id: 'p016', type: 'multi', question: '"长"在"长高"中读：', options: ['A. cháng', 'B. zhǎng', 'C. cǎng'], correctAnswer: 1, explanation: '"长"在表示生长时读 zhǎng，在表示长短时读 cháng。' },
  { id: 'p017', type: 'multi', question: '"好"在"好人"中读：', options: ['A. hǎo', 'B. hào', 'C. háo'], correctAnswer: 0, explanation: '"好"在表示优点时读 hǎo，在表示爱好时读 hào。' },
  { id: 'p018', type: 'multi', question: '"乐"在"快乐"中读：', options: ['A. lè', 'B. yuè', 'C. luè'], correctAnswer: 0, explanation: '"乐"在表示快乐时读 lè，在表示音乐时读 yuè。' },
  { id: 'p019', type: 'multi', question: '"行"在"行走"中读：', options: ['A. xíng', 'B. háng', 'C. héng'], correctAnswer: 0, explanation: '"行"在表示行走时读 xíng，在表示行业时读 háng。' },
  { id: 'p020', type: 'multi', question: '"少"在"少年"中读：', options: ['A. shǎo', 'B. shào', 'C. sǎo'], correctAnswer: 1, explanation: '"少"在表示年轻时读 shào，在表示不多时读 shǎo。' },
  { id: 'p021', type: 'multi', question: '"重"在"重要"中读：', options: ['A. zhòng', 'B. chóng', 'C. zòng'], correctAnswer: 0, explanation: '"重"在表示重要/重量时读 zhòng，在表示重复时读 chóng。' },
  { id: 'p022', type: 'multi', question: '"都"在"都是"中读：', options: ['A. dū', 'B. dōu', 'C. dù'], correctAnswer: 1, explanation: '"都"在表示全部时读 dōu，在表示首都时读 dū。' },
  { id: 'p023', type: 'multi', question: '"只"在"只有"中读：', options: ['A. zhī', 'B. zhǐ', 'C. zǐ'], correctAnswer: 1, explanation: '"只"在表示只有时读 zhǐ，在表示一只时读 zhī。' },
  { id: 'p024', type: 'multi', question: '"种"在"种树"中读：', options: ['A. zhǒng', 'B. zhòng', 'C. zǒng'], correctAnswer: 1, explanation: '"种"在表示种植时读 zhòng，在表示种子时读 zhǒng。' },
  { id: 'p025', type: 'multi', question: '"分"在"分外"中读：', options: ['A. fēn', 'B. fèn', 'C. fēng'], correctAnswer: 1, explanation: '"分"在表示格外/分内时读 fèn，在表示分开时读 fēn。' },
  { id: 'p026', type: 'multi', question: '"得"在"得到"中读：', options: ['A. de', 'B. dé', 'C. děi'], correctAnswer: 1, explanation: '"得"在表示得到时读 dé，作助词时读 de。' },
  { id: 'p027', type: 'multi', question: '"了"在"了解"中读：', options: ['A. le', 'B. liǎo', 'C. lè'], correctAnswer: 1, explanation: '"了"在表示明白/结束时读 liǎo，作助词时读 le。' },
  { id: 'p028', type: 'multi', question: '"没"在"没有"中读：', options: ['A. méi', 'B. mò', 'C. mèi'], correctAnswer: 0, explanation: '"没"在表示没有时读 méi，在表示淹没时读 mò。' },
  { id: 'p029', type: 'multi', question: '"看"在"看守"中读：', options: ['A. kàn', 'B. kān', 'C. kán'], correctAnswer: 1, explanation: '"看"在表示看守时读 kān，在表示看见时读 kàn。' },
  { id: 'p030', type: 'multi', question: '"地"在"土地"中读：', options: ['A. de', 'B. dì', 'C. dí'], correctAnswer: 1, explanation: '"地"在表示土地时读 dì，作助词时读 de。' },

  // 声调判断
  { id: 'p031', type: 'tone', question: '"风"是第几声？', options: ['A. 第一声', 'B. 第二声', 'C. 第三声'], correctAnswer: 0, explanation: '"风"读 fēng，是第一声（阴平）。' },
  { id: 'p032', type: 'tone', question: '"云"是第几声？', options: ['A. 第一声', 'B. 第二声', 'C. 第三声'], correctAnswer: 1, explanation: '"云"读 yún，是第二声（阳平）。' },
  { id: 'p033', type: 'tone', question: '"雨"是第几声？', options: ['A. 第二声', 'B. 第三声', 'C. 第四声'], correctAnswer: 1, explanation: '"雨"读 yǔ，是第三声（上声）。' },
  { id: 'p034', type: 'tone', question: '"树"是第几声？', options: ['A. 第二声', 'B. 第三声', 'C. 第四声'], correctAnswer: 2, explanation: '"树"读 shù，是第四声（去声）。' },
  { id: 'p035', type: 'tone', question: '"花"是第几声？', options: ['A. 第一声', 'B. 第二声', 'C. 第三声'], correctAnswer: 0, explanation: '"花"读 huā，是第一声（阴平）。' },
  { id: 'p036', type: 'tone', question: '"草"是第几声？', options: ['A. 第一声', 'B. 第二声', 'C. 第三声'], correctAnswer: 2, explanation: '"草"读 cǎo，是第三声（上声）。' },
  { id: 'p037', type: 'tone', question: '"鸟"是第几声？', options: ['A. 第二声', 'B. 第三声', 'C. 第四声'], correctAnswer: 1, explanation: '"鸟"读 niǎo，是第三声（上声）。' },
  { id: 'p038', type: 'tone', question: '"鱼"是第几声？', options: ['A. 第一声', 'B. 第二声', 'C. 第三声'], correctAnswer: 1, explanation: '"鱼"读 yú，是第二声（阳平）。' },
  { id: 'p039', type: 'tone', question: '"马"是第几声？', options: ['A. 第二声', 'B. 第三声', 'C. 第四声'], correctAnswer: 1, explanation: '"马"读 mǎ，是第三声（上声）。' },
  { id: 'p040', type: 'tone', question: '"牛"是第几声？', options: ['A. 第一声', 'B. 第二声', 'C. 第三声'], correctAnswer: 1, explanation: '"牛"读 niú，是第二声（阳平）。' },

  // 易错读音
  { id: 'p041', type: 'error', question: '"比较"的"较"读：', options: ['A. jiǎo', 'B. jiào', 'C. jiāo'], correctAnswer: 1, explanation: '"较"在比较中读 jiào，第四声。' },
  { id: 'p042', type: 'error', question: '"因为"的"为"读：', options: ['A. wéi', 'B. wèi', 'C. wèi'], correctAnswer: 1, explanation: '"因为"读 yīn wèi，"为"读第四声。' },
  { id: 'p043', type: 'error', question: '"虽然"的"虽"读：', options: ['A. suī', 'B. suí', 'C. shuī'], correctAnswer: 0, explanation: '"虽"读 suī，第一声。' },
  { id: 'p044', type: 'error', question: '"而且"的"而"读：', options: ['A. ěr', 'B. ér', 'C. èr'], correctAnswer: 1, explanation: '"而"读 ér，第二声。' },
  { id: 'p045', type: 'error', question: '"甚至"的"甚"读：', options: ['A. shèn', 'B. shéng', 'C. sèn'], correctAnswer: 0, explanation: '"甚"读 shèn，第四声。' },
  { id: 'p046', type: 'error', question: '"暂时"的"暂"读：', options: ['A. zàn', 'B. zhàn', 'C. zhǎn'], correctAnswer: 0, explanation: '"暂"读 zàn，第四声。' },
  { id: 'p047', type: 'error', question: '"即使"的"即"读：', options: ['A. jí', 'B. jì', 'C. jī'], correctAnswer: 0, explanation: '"即"读 jí，第二声。' },
  { id: 'p048', type: 'error', question: '"气氛"的"氛"读：', options: ['A. fēn', 'B. fèn', 'C. fèn'], correctAnswer: 0, explanation: '"氛"读 fēn，第一声。' },
  { id: 'p049', type: 'error', question: '"召开"的"召"读：', options: ['A. zhào', 'B. zhāo', 'C. zào'], correctAnswer: 0, explanation: '"召"读 zhào，第四声。' },
  { id: 'p050', type: 'error', question: '"处理"的"处"读：', options: ['A. chǔ', 'B. chù', 'C. cǔ'], correctAnswer: 0, explanation: '"处"在处理中读 chǔ，第三声。' },

  // 更多易错读音
  { id: 'p051', type: 'error', question: '"模样"的"模"读：', options: ['A. mó', 'B. mú', 'C. mò'], correctAnswer: 1, explanation: '"模"在模样中读 mú，第二声。' },
  { id: 'p052', type: 'error', question: '"薄弱"的"薄"读：', options: ['A. bó', 'B. báo', 'C. bò'], correctAnswer: 0, explanation: '"薄"在薄弱中读 bó，第二声。' },
  { id: 'p053', type: 'error', question: '"剥削"的"削"读：', options: ['A. xiāo', 'B. xuē', 'C. xiào'], correctAnswer: 1, explanation: '"削"在剥削中读 xuē，第一声。' },
  { id: 'p054', type: 'error', question: '"血泊"的"泊"读：', options: ['A. bó', 'B. pō', 'C. pò'], correctAnswer: 1, explanation: '"泊"在血泊中读 pō，第一声。' },
  { id: 'p055', type: 'error', question: '"参差"的读音是：', options: ['A. cān chā', 'B. cēn cī', 'C. shēn chà'], correctAnswer: 1, explanation: '"参差"读 cēn cī，是特殊读音。' },
  { id: 'p056', type: 'error', question: '"蛤蜊"的"蛤"读：', options: ['A. gé', 'B. há', 'C. gá'], correctAnswer: 1, explanation: '"蛤"在蛤蜊中读 há，第二声。' },
  { id: 'p057', type: 'error', question: '"脊梁"的"脊"读：', options: ['A. jí', 'B. jǐ', 'C. jǐ'], correctAnswer: 1, explanation: '"脊"在脊梁中读 jǐ，第三声。' },
  { id: 'p058', type: 'error', question: '"尽快"的"尽"读：', options: ['A. jìn', 'B. jǐn', 'C. jīn'], correctAnswer: 1, explanation: '"尽"在尽快中读 jǐn，第三声。' },
  { id: 'p059', type: 'error', question: '"给予"的读音是：', options: ['A. gěi yǔ', 'B. jǐ yǔ', 'C. gěi yǔ'], correctAnswer: 1, explanation: '"给予"读 jǐ yǔ，是特殊读音。' },
  { id: 'p060', type: 'error', question: '"拮据"的"据"读：', options: ['A. jù', 'B. jū', 'C. jǔ'], correctAnswer: 1, explanation: '"据"在拮据中读 jū，第一声。' },

  // 更多多音字
  { id: 'p061', type: 'multi', question: '"和"在"和气"中读：', options: ['A. hé', 'B. hè', 'C. huó'], correctAnswer: 0, explanation: '"和"在表示和气时读 hé，在附和时读 hè，在和面时读 huó。' },
  { id: 'p062', type: 'multi', question: '"和"在"和面"中读：', options: ['A. hé', 'B. hè', 'C. huó'], correctAnswer: 2, explanation: '"和"在和面时读 huó，第二声。' },
  { id: 'p063', type: 'multi', question: '"差"在"差别"中读：', options: ['A. chā', 'B. chà', 'C. chāi'], correctAnswer: 0, explanation: '"差"在表示差别时读 chā，在表示不好时读 chà，在出差时读 chāi。' },
  { id: 'p064', type: 'multi', question: '"差"在"差不多"中读：', options: ['A. chā', 'B. chà', 'C. chāi'], correctAnswer: 1, explanation: '"差"在差不多中表示程度，读 chà，第四声。' },
  { id: 'p065', type: 'multi', question: '"宿"在"住宿"中读：', options: ['A. sù', 'B. xiǔ', 'C. xiù'], correctAnswer: 0, explanation: '"宿"在住宿中读 sù，在表示一宿时读 xiǔ，在星宿时读 xiù。' },
  { id: 'p066', type: 'multi', question: '"咽"在"咽下"中读：', options: ['A. yān', 'B. yàn', 'C. yè'], correctAnswer: 1, explanation: '"咽"在咽下时读 yàn，在咽喉时读 yān，在呜咽时读 yè。' },
  { id: 'p067', type: 'multi', question: '"盛"在"茂盛"中读：', options: ['A. shèng', 'B. chéng', 'C. shén'], correctAnswer: 0, explanation: '"盛"在茂盛中读 shèng，在盛饭时读 chéng。' },
  { id: 'p068', type: 'multi', question: '"假"在"放假"中读：', options: ['A. jiǎ', 'B. jià', 'C. jiā'], correctAnswer: 1, explanation: '"假"在放假中读 jià，第四声；在真假中读 jiǎ。' },
  { id: 'p069', type: 'multi', question: '"难"在"困难"中读：', options: ['A. nán', 'B. nàn', 'C. nǎn'], correctAnswer: 0, explanation: '"难"在困难中读 nán，第二声；在灾难中读 nàn。' },
  { id: 'p070', type: 'multi', question: '"强"在"坚强"中读：', options: ['A. qiáng', 'B. qiǎng', 'C. jiàng'], correctAnswer: 0, explanation: '"强"在坚强中读 qiáng，在勉强中读 qiǎng，在倔强中读 jiàng。' },

  // ü拼写规则
  { id: 'p071', type: 'rule', question: '"jü"的正确拼写是：', options: ['A. jü', 'B. ju', 'C. ju'], correctAnswer: 1, explanation: 'ü与j、q、x相拼时，ü上两点省略，写成ju。' },
  { id: 'p072', type: 'rule', question: '"qü"的正确拼写是：', options: ['A. qü', 'B. qu', 'C. qù'], correctAnswer: 1, explanation: 'ü与j、q、x相拼时，ü上两点省略，写成qu。' },
  { id: 'p073', type: 'rule', question: '"xü"的正确拼写是：', options: ['A. xü', 'B. xu', 'C. xù'], correctAnswer: 1, explanation: 'ü与j、q、x相拼时，ü上两点省略，写成xu。' },
  { id: 'p074', type: 'rule', question: '"lü"的正确拼写是：', options: ['A. lü', 'B. lu', 'C. lv'], correctAnswer: 0, explanation: 'ü与l、n相拼时，ü上两点不能省略，写成lü。' },
  { id: 'p075', type: 'rule', question: '"nü"的正确拼写是：', options: ['A. nü', 'B. nu', 'C. nv'], correctAnswer: 0, explanation: 'ü与l、n相拼时，ü上两点不能省略，写成nü。' },
  { id: 'p076', type: 'rule', question: '"女"的正确拼音是：', options: ['A. nǚ', 'B. nǔ', 'C. nü'], correctAnswer: 0, explanation: '"女"读 nǚ，ü与n相拼时两点保留。' },
  { id: 'p077', type: 'rule', question: '"绿"的正确拼音是：', options: ['A. lǜ', 'B. lǔ', 'C. lù'], correctAnswer: 0, explanation: '"绿"读 lǜ，ü与l相拼时两点保留。' },
  { id: 'p078', type: 'rule', question: '"去"的正确拼音是：', options: ['A. qù', 'B. qǜ', 'C. qü'], correctAnswer: 0, explanation: '"去"读 qù，ü与q相拼时两点省略。' },
  { id: 'p079', type: 'rule', question: '"句"的正确拼音是：', options: ['A. jù', 'B. jǜ', 'C. jü'], correctAnswer: 0, explanation: '"句"读 jù，ü与j相拼时两点省略。' },
  { id: 'p080', type: 'rule', question: '"学"的正确拼音是：', options: ['A. xüé', 'B. xué', 'C. xé'], correctAnswer: 1, explanation: '"学"读 xué，ü与x相拼时两点省略。' },

  // 整体认读音节
  { id: 'p081', type: 'overall', question: '"知"是：', options: ['A. 整体认读音节', 'B. 拼读音节', 'C. 三拼音节'], correctAnswer: 0, explanation: '"知"是整体认读音节zhi，不用拼读。' },
  { id: 'p082', type: 'overall', question: '"吃"是：', options: ['A. 整体认读音节', 'B. 拼读音节', 'C. 三拼音节'], correctAnswer: 0, explanation: '"吃"是整体认读音节chi，不用拼读。' },
  { id: 'p083', type: 'overall', question: '"日"是：', options: ['A. 整体认读音节', 'B. 拼读音节', 'C. 三拼音节'], correctAnswer: 0, explanation: '"日"是整体认读音节ri，不用拼读。' },
  { id: 'p084', type: 'overall', question: '"子"是：', options: ['A. 整体认读音节', 'B. 拼读音节', 'C. 三拼音节'], correctAnswer: 0, explanation: '"子"是整体认读音节zi，不用拼读。' },
  { id: 'p085', type: 'overall', question: '"词"是：', options: ['A. 整体认读音节', 'B. 拼读音节', 'C. 三拼音节'], correctAnswer: 0, explanation: '"词"是整体认读音节ci，不用拼读。' },
  { id: 'p086', type: 'overall', question: '"思"是：', options: ['A. 整体认读音节', 'B. 拼读音节', 'C. 三拼音节'], correctAnswer: 0, explanation: '"思"是整体认读音节si，不用拼读。' },
  { id: 'p087', type: 'overall', question: '"衣"是：', options: ['A. 整体认读音节', 'B. 拼读音节', 'C. 三拼音节'], correctAnswer: 0, explanation: '"衣"是整体认读音节yi，不用拼读。' },
  { id: 'p088', type: 'overall', question: '"乌"是：', options: ['A. 整体认读音节', 'B. 拼读音节', 'C. 三拼音节'], correctAnswer: 0, explanation: '"乌"是整体认读音节wu，不用拼读。' },
  { id: 'p089', type: 'overall', question: '"雨"是：', options: ['A. 整体认读音节', 'B. 拼读音节', 'C. 三拼音节'], correctAnswer: 0, explanation: '"雨"是整体认读音节yu，不用拼读。' },
  { id: 'p090', type: 'overall', question: '"远"是：', options: ['A. 整体认读音节', 'B. 拼读音节', 'C. 三拼音节'], correctAnswer: 0, explanation: '"远"是整体认读音节yuan，不用拼读。' },

  // 变调规则
  { id: 'p091', type: 'tone_change', question: '"一"在"一天"中读：', options: ['A. 第一声', 'B. 第二声', 'C. 第四声'], correctAnswer: 0, explanation: '"一"在第一声前读原声（第一声），如"一天"。' },
  { id: 'p092', type: 'tone_change', question: '"一"在"一年"中读：', options: ['A. 第一声', 'B. 第二声', 'C. 第四声'], correctAnswer: 0, explanation: '"一"在第二声前读原声（第一声），如"一年"。' },
  { id: 'p093', type: 'tone_change', question: '"一"在"一起"中读：', options: ['A. 第一声', 'B. 第二声', 'C. 第四声'], correctAnswer: 1, explanation: '"一"在第三声前读第二声，如"一起"。' },
  { id: 'p094', type: 'tone_change', question: '"一"在"一半"中读：', options: ['A. 第一声', 'B. 第二声', 'C. 第四声'], correctAnswer: 1, explanation: '"一"在第四声前读第二声，如"一半"。' },
  { id: 'p095', type: 'tone_change', question: '"不"在"不是"中读：', options: ['A. 第二声', 'B. 第四声', 'C. 第一声'], correctAnswer: 1, explanation: '"不"在第四声前读第二声，如"不是"。' },
  { id: 'p096', type: 'tone_change', question: '"不"在"不去"中读：', options: ['A. 第二声', 'B. 第四声', 'C. 第一声'], correctAnswer: 0, explanation: '"不"在第四声"去"前读第二声。' },
  { id: 'p097', type: 'tone_change', question: '"不"在"不好"中读：', options: ['A. 第二声', 'B. 第四声', 'C. 第一声'], correctAnswer: 0, explanation: '"不"在第三声前读第二声，如"不好"。' },
  { id: 'p098', type: 'tone_change', question: '"不"在"不多"中读：', options: ['A. 第二声', 'B. 第四声', 'C. 第一声'], correctAnswer: 0, explanation: '"不"在第一声前读原声（第四声），但"不多"特殊处理。' },
  { id: 'p099', type: 'tone_change', question: '"一个"中"一"读：', options: ['A. 第一声', 'B. 第二声', 'C. 第四声'], correctAnswer: 1, explanation: '"一"在第四声"个"前读第二声，如"一个"。' },
  { id: 'p100', type: 'tone_change', question: '"三声变调"中，两个三声连读时，第一个变成：', options: ['A. 第一声', 'B. 第二声', 'C. 第四声'], correctAnswer: 1, explanation: '两个三声连读，第一个变成第二声，如"你好"中"你"读二声。' }
]

function Pinyin() {
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
    return pageShareConfigs.pinyin
  })

  // 启用朋友圈分享
  useShareTimeline(() => {
    return {
      title: pageShareConfigs.pinyin.title,
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
        type: currentQuestion.type || 'pinyin',
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
    const shuffled = [...PINYIN_QUESTIONS].sort(() => Math.random() - 0.5)
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
    setCompleted(true)

    // 准备答题数据，包含完整题目信息
    const answerData = questions.map(q => {
      const userAnswer = userAnswers.current[q.id] ?? -1
      const isCorrect = userAnswer === q.correctAnswer
      return {
        questionId: q.id,
        answer: userAnswer,
        isCorrect,
        questionType: 'pinyin',
        // 包含完整题目信息，以便错题重做时使用
        questionText: q.question || '',
        options: q.options || [],
        correctAnswer: q.correctAnswer
      }
    })

    // 1. 保存答题历史到 answer_history
    try {
      await Taro.cloud.callFunction({
        name: 'question',
        data: {
          action: 'submitBatch',
          answers: answerData
        }
      })
    } catch (err) {
      Taro.showToast({ title: '保存失败，请重试', icon: 'none', duration: 2000 })
    }

    // 2. 保存学习记录到 study_records
    try {
      await studyService.addRecord({
        type: 'pinyin',
        title: '拼音学习',
        score: Math.round((score / questions.length) * 100),
        totalQuestions: questions.length,
        correctAnswers: score,
        duration: 5
      })

      // 3. 触发统计更新事件（实现实时刷新）
      eventBus.emit(EVENTS.STUDY_RECORD_UPDATED, {
        type: 'pinyin',
        score: Math.round((score / questions.length) * 100),
        correctCount: score,
        totalCount: questions.length
      })
    } catch (err) {
      console.error('保存学习记录失败:', err)
    }
  }

  if (questions.length === 0) {
    return <View className="pinyin-page"><Text>加载中...</Text></View>
  }

  if (completed) {
    return (
      <View className="pinyin-page">
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
    <View className="pinyin-page">
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
            <View className="question-tag">拼音练习</View>
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

export default Pinyin
