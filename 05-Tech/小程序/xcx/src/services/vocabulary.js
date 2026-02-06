/**
 * 词汇服务
 */
import Taro from '@tarojs/taro'
import { callCloudFunction } from './request'
import { CLOUD_FUNCTIONS, DEFAULT_PAGE } from '../utils/constants'

// 模拟词汇数据
const MOCK_WORDS = [
  {
    word: '姹紫嫣红',
    pinyin: 'chà zǐ yān hóng',
    definition: '形容各种颜色的花朵，娇艳、绚丽、好看。也比喻事物繁荣兴旺、丰富多彩。',
    example: '花园里姹紫嫣红，生机盎然。',
    synonyms: ['五彩缤纷', '万紫千红', '花团锦簇'],
    antonyms: ['枯槁凋零', '残花败柳']
  },
  {
    word: '美轮美奂',
    pinyin: 'měi lún měi huàn',
    definition: '形容房屋高大华丽。轮：高大；奂：众多。多用于赞美建筑物的新建、装修等。',
    example: '这座新建的大厦美轮美奂，十分壮观。',
    synonyms: ['富丽堂皇', '雕梁画栋', '金碧辉煌'],
    antonyms: ['因陋就简', '土里土气']
  },
  {
    word: '脍炙人口',
    pinyin: 'kuài zhì rén kǒu',
    definition: '脍：切细的肉；炙：烤肉。比喻好的诗文或事物为众人所称颂。',
    example: '《红楼梦》是一部脍炙人口的古典小说。',
    synonyms: ['有口皆碑', '家喻户晓', '喜闻乐见'],
    antonyms: ['鲜为人知', '默默无闻']
  },
  {
    word: '抑扬顿挫',
    pinyin: 'yì yáng dùn cuò',
    definition: '抑：降低；扬：升高；顿：停顿；挫：转折。指声音的高低起伏和停顿转折。',
    example: '他的朗读抑扬顿挫，十分动听。',
    synonyms: ['铿锵有力', '朗朗上口'],
    antonyms: ['平淡无奇', '枯燥乏味']
  },
  {
    word: '相得益彰',
    pinyin: 'xiāng dé yì zhāng',
    definition: '指两个人或两件事物互相配合，双方的能力和作用更能显示出来。',
    example: '这两种方法相得益彰，结合使用效果更好。',
    synonyms: ['相辅相成', '锦上添花'],
    antonyms: ['适得其反', '雪上加霜']
  },
  {
    word: '锲而不舍',
    pinyin: 'qiè ér bù shě',
    definition: '锲：刻；舍：停止。不断地雕刻。比喻有恒心，有毅力，坚持不懈。',
    example: '学习需要锲而不舍的精神，不能半途而废。',
    synonyms: ['坚持不懈', '持之以恒', '坚韧不拔'],
    antonyms: ['半途而废', '浅尝辄止']
  },
  {
    word: '未雨绸缪',
    pinyin: 'wèi yǔ chóu móu',
    definition: '绸缪：紧密缠缚。在天没下雨时，就修补好门窗。比喻事先做好准备工作。',
    example: '我们要未雨绸缪，提前做好防范措施。',
    synonyms: ['有备无患', '防患未然', '居安思危'],
    antonyms: ['临渴掘井', '亡羊补牢']
  },
  {
    word: '厚积薄发',
    pinyin: 'hòu jī bó fā',
    definition: '厚积：大量积累；薄发：少量喷发。形容长时间积累，慢慢释放出来。',
    example: '成功需要厚积薄发，不能急于求成。',
    synonyms: ['博观约取', '温故知新'],
    antonyms: ['浅尝辄止', '好高骛远']
  }
]

// 模拟成语数据
const MOCK_IDIOMS = [
  {
    idiom: '画蛇添足',
    pinyin: 'huà shé tiān zú',
    definition: '比喻做了多余的事，非但无益，反而不合适。',
    example: '这件事本来已经完成了，你又去改动，简直是画蛇添足。',
    source: '《战国策·齐策二》'
  },
  {
    idiom: '守株待兔',
    pinyin: 'shǒu zhū dài tù',
    definition: '比喻死守狭隘经验，不知变通。',
    example: '我们不能守株待兔，要主动寻找机会。',
    source: '《韩非子·五蠹》'
  },
  {
    idiom: '掩耳盗铃',
    pinyin: 'yǎn ěr dào líng',
    definition: '比喻自己欺骗自己。',
    example: '他想靠作弊取得好成绩，这简直是掩耳盗铃。',
    source: '《吕氏春秋·自知》'
  },
  {
    idiom: '亡羊补牢',
    pinyin: 'wáng yáng bǔ láo',
    definition: '比喻出了问题以后想办法补救，可以防止继续受损失。',
    example: '虽然考试失败了，但亡羊补牢，为时未晚。',
    source: '《战国策·楚策四》'
  },
  {
    idiom: '刻舟求剑',
    pinyin: 'kè zhōu qiú jiàn',
    definition: '比喻拘泥成法，不知道变通。',
    example: '时代在变化，我们不能刻舟求剑。',
    source: '《吕氏春秋·察今》'
  },
  {
    idiom: '井底之蛙',
    pinyin: 'jǐng dǐ zhī wā',
    definition: '比喻见识狭窄的人。',
    example: '要多读书，多出去走走，不要做井底之蛙。',
    source: '《庄子·秋水》'
  },
  {
    idiom: '狐假虎威',
    pinyin: 'hú jiǎ hǔ wēi',
    definition: '比喻依仗别人的势力来欺压人。',
    example: '他只是狐假虎威，其实没有什么真本事。',
    source: '《战国策·楚策一》'
  },
  {
    idiom: '自相矛盾',
    pinyin: 'zì xiāng máo dùn',
    definition: '比喻自己说话做事前后抵触。',
    example: '他的话前后矛盾，简直是自相矛盾。',
    source: '《韩非子·难一》'
  },
  {
    idiom: '拔苗助长',
    pinyin: 'bá miáo zhù zhǎng',
    definition: '比喻违反事物发展的客观规律，急于求成，反而把事情弄糟。',
    example: '教育孩子要循序渐进，不能拔苗助长。',
    source: '《孟子·公孙丑上》'
  }
]

class VocabularyService {
  /**
   * 搜索词语
   */
  async searchWord(word) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.VOCABULARY, {
        action: 'search',
        word
      })
      if (res.data) return res.data
    } catch (err) {
      console.log('使用本地数据')
    }

    // 使用本地模拟数据
    const found = MOCK_WORDS.find(w => w.word === word || w.word.includes(word))
    return found || MOCK_WORDS[0]
  }

  /**
   * 获取词语列表（分页）
   */
  async getWords(page = DEFAULT_PAGE.page, pageSize = DEFAULT_PAGE.pageSize) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.VOCABULARY, {
        action: 'list',
        page,
        pageSize
      })
      if (res.data && res.data.length > 0) return res.data
    } catch (err) {
      console.log('使用本地数据')
    }

    // 使用本地模拟数据
    return MOCK_WORDS
  }

  /**
   * 获取每日推荐词语
   */
  async getDailyWords(count = 10) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.VOCABULARY, {
        action: 'daily',
        count
      })
      if (res.data && res.data.length > 0) return res.data
    } catch (err) {
      console.log('使用本地数据')
    }

    // 使用本地模拟数据（随机打乱）
    return [...MOCK_WORDS].sort(() => Math.random() - 0.5).slice(0, Math.min(count, MOCK_WORDS.length))
  }

  /**
   * 获取成语列表
   */
  async getIdioms(page = DEFAULT_PAGE.page, pageSize = DEFAULT_PAGE.pageSize) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.VOCABULARY, {
        action: 'idioms',
        page,
        pageSize
      })
      if (res.data && res.data.length > 0) return res.data
    } catch (err) {
      console.log('使用本地数据')
    }

    // 使用本地模拟数据
    return MOCK_IDIOMS
  }

  /**
   * 搜索成语
   */
  async searchIdiom(keyword) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.VOCABULARY, {
        action: 'searchIdiom',
        keyword
      })
      if (res.data && res.data.length > 0) return res.data
    } catch (err) {
      console.log('使用本地数据')
    }

    // 使用本地模拟数据搜索
    const filtered = MOCK_IDIOMS.filter(item =>
      item.idiom.includes(keyword) ||
      item.pinyin.toLowerCase().includes(keyword.toLowerCase())
    )
    return filtered.length > 0 ? filtered : MOCK_IDIOMS
  }

  /**
   * 获取词语详情（包含近义词、反义词等）
   */
  async getWordDetail(word) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.VOCABULARY, {
        action: 'detail',
        word
      })
      if (res.data) return res.data
    } catch (err) {
      console.log('使用本地数据')
    }

    // 使用本地模拟数据
    return MOCK_WORDS.find(w => w.word === word) || MOCK_WORDS[0]
  }

  /**
   * 收藏词语
   */
  async toggleFavorite(word) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.VOCABULARY, {
        action: 'favorite',
        word
      })
      return res.success
    } catch (err) {
      Taro.showToast({ title: '收藏失败', icon: 'none' })
      return false
    }
  }

  /**
   * 获取收藏列表
   */
  async getFavorites(page = DEFAULT_PAGE.page, pageSize = DEFAULT_PAGE.pageSize) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.VOCABULARY, {
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
   * 生成练习题
   */
  async generatePractice(type, count = 10) {
    try {
      const res = await callCloudFunction(CLOUD_FUNCTIONS.VOCABULARY, {
        action: 'practice',
        type,
        count
      })
      return res.data || []
    } catch (err) {
      Taro.showToast({ title: '生成练习失败', icon: 'none' })
      return []
    }
  }
}

export default new VocabularyService()
