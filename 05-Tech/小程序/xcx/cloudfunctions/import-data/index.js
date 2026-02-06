// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// =============================================
// 嵌入数据源（不可从本地文件读取）
// =============================================

// 嵌入词汇数据
const VOCABULARY_DATA = [
  { word: "姹紫嫣红", pinyin: "chà zǐ yān hóng", definition: "形容各种颜色的花朵，娇艳、绚丽、好看。", example: "花园里姹紫嫣红，生机盎然。", synonyms: ["五彩缤纷", "万紫千红", "花团锦簇"], antonyms: ["枯槁凋零", "残花败柳"] },
  { word: "美轮美奂", pinyin: "měi lún měi huàn", definition: "形容房屋高大华丽。轮：高大；奂：众多。", example: "这座新建的大厦美轮美奂，十分壮观。", synonyms: ["富丽堂皇", "雕梁画栋", "金碧辉煌"], antonyms: ["因陋就简", "土里土气"] },
  { word: "脍炙人口", pinyin: "kuài zhì rén kǒu", definition: "脍：切细的肉；炙：烤肉。比喻好的诗文或事物为众人所称颂。", example: "《红楼梦》是一部脍炙人口的古典小说。", synonyms: ["有口皆碑", "家喻户晓", "喜闻乐见"], antonyms: ["鲜为人知", "默默无闻"] },
  { word: "抑扬顿挫", pinyin: "yì yáng dùn cuò", definition: "抑：降低；扬：升高；顿：停顿；挫：转折。指声音的高低起伏和停顿转折。", example: "他的朗读抑扬顿挫，十分动听。", synonyms: ["铿锵有力", "朗朗上口"], antonyms: ["平淡无奇", "枯燥乏味"] },
  { word: "相得益彰", pinyin: "xiāng dé yì zhāng", definition: "指两个人或两件事物互相配合，双方的能力和作用更能显示出来。", example: "这两种方法相得益彰，结合使用效果更好。", synonyms: ["相辅相成", "锦上添花"], antonyms: ["适得其反", "雪上加霜"] },
  { word: "锲而不舍", pinyin: "qiè ér bù shě", definition: "锲：刻；舍：停止。不断地雕刻。比喻有恒心，有毅力，坚持不懈。", example: "学习需要锲而不舍的精神，不能半途而废。", synonyms: ["坚持不懈", "持之以恒", "坚韧不拔"], antonyms: ["半途而废", "浅尝辄止"] },
  { word: "未雨绸缪", pinyin: "wèi yǔ chóu móu", definition: "绸缪：紧密缠缚。在天没下雨时，就修补好门窗。比喻事先做好准备工作。", example: "我们要未雨绸缪，提前做好防范措施。", synonyms: ["有备无患", "防患未然", "居安思危"], antonyms: ["临渴掘井", "亡羊补牢"] },
  { word: "厚积薄发", pinyin: "hòu jī bó fā", definition: "厚积：大量积累；薄发：少量喷发。形容长时间积累，慢慢释放出来。", example: "成功需要厚积薄发，不能急于求成。", synonyms: ["博观约取", "温故知新"], antonyms: ["浅尝辄止", "好高骛远"] },
  { word: "熟能生巧", pinyin: "shú néng shēng qiǎo", definition: "熟练了就能产生巧办法，或找到窍门。", example: "多练习几次，熟能生巧，自然就学会了。", synonyms: ["游刃有余", "得心应手"], antonyms: ["半生不熟"] },
  { word: "精益求精", pinyin: "jīng yì qiú jīng", definition: "精：完美；益：更加。已经很好了，还要求更好。", example: "他对工作精益求精，从不满足于现状。", synonyms: ["锦上添花", "好上加好"], antonyms: ["得过且过", "粗制滥造"] },
  { word: "因地制宜", pinyin: "yīn dì zhì yí", definition: "根据各地的具体情况，制定适宜的办法。", example: "种植农作物要因地制宜，选择适合的品种。", synonyms: ["量体裁衣", "对症下药"], antonyms: ["生搬硬套", "一刀切"] },
  { word: "络绎不绝", pinyin: "luò yì bù jué", definition: "形容行人车马来来往往，接连不断。", example: "节日期间，参观博物馆的人络绎不绝。", synonyms: ["川流不息", "纷至沓来", "接连不断"], antonyms: ["寥寥无几", "门可罗雀"] },
  { word: "鳞次栉比", pinyin: "lín cì zhì bǐ", definition: "形容房屋或船只等排列得很密很整齐。", example: "高楼鳞次栉比，街道宽敞整洁。", synonyms: ["星罗棋布", "密密麻麻"], antonyms: ["寥寥可数", "屈指可数"] },
  { word: "别出心裁", pinyin: "bié chū xīn cái", definition: "心裁：心中的设计、构思。指想出的办法与众不同。", example: "这篇作文的构思别出心裁，让人耳目一新。", synonyms: ["独出心裁", "别具一格", "标新立异"], antonyms: ["千篇一律"] },
  { word: "历历在目", pinyin: "lì lì zài mù", definition: "历历：清楚，分明的样子。指远方的景物看得清清楚楚，或过去的事情清清楚楚地重现在眼前。", example: "童年往事历历在目，仿佛就在昨天。", synonyms: ["记忆犹新", "念念不忘"], antonyms: ["烟消云散", "记忆模糊"] },
  { word: "郑重其事", pinyin: "zhèng zhòng qí shì", definition: "郑重：审慎，严肃认真。形容说话做事时态度非常严肃认真。", example: "老师郑重其事地宣布了考试时间。", synonyms: ["一本正经", "严肃认真"], antonyms: ["敷衍了事", "嬉皮笑脸"] },
  { word: "漫不经心", pinyin: "màn bù jīng xīn", definition: "漫：随便。随随便便，不放在心上。", example: "他漫不经心地翻着书，没在认真看。", synonyms: ["粗心大意", "心不在焉"], antonyms: ["全神贯注", "聚精会神"] },
  { word: "惊慌失措", pinyin: "jīng huāng shī cuò", definition: "失措：举止失去常态。不知怎么办才好。形容惊慌害怕到了极点。", example: "遇到火灾不要惊慌失措，要冷静逃生。", synonyms: ["惊惶失措", "手足无措"], antonyms: ["从容不迫", "泰然自若"] },
  { word: "焕然一新", pinyin: "huàn rán yī xīn", definition: "焕然：鲜明光亮的样子。形容出现了崭新的面貌。", example: "经过装修，教室焕然一新。", synonyms: ["耳目一新", "改头换面"], antonyms: ["依然如故", "旧貌不改"] },
  { word: "谈笑风生", pinyin: "tán xiào fēng shēng", definition: "形容谈话时有说有笑，兴致很高，并且很有风趣。", example: "他在聚会上谈笑风生，大家都喜欢和他聊天。", synonyms: ["妙趣横生", "兴高采烈"], antonyms: ["哑口无言", "沉闷寡言"] },
  { word: "迫在眉睫", pinyin: "pò zài méi jié", definition: "迫：紧急；睫：眉毛和睫毛。事情紧挨着眼睫毛，比喻十分紧迫。", example: "考试迫在眉睫，我们要抓紧复习。", synonyms: ["刻不容缓", "燃眉之急"], antonyms: ["遥遥无期", "慢条斯理"] },
  { word: "再接再厉", pinyin: "zài jiē zài lì", definition: "接：接战；厉：磨快，引申为奋勉，努力。指公鸡相斗，每次交锋以前先磨磨嘴。比喻继续努力，再加一把劲。", example: "希望大家再接再厉，取得更好的成绩。", synonyms: ["百尺竿头", "更进一步"], antonyms: ["固步自封", "得过且过"] },
  { word: "流连忘返", pinyin: "liú lián wàng fǎn", definition: "流连：留恋不止，舍不得离去。返：归，回。留恋得忘记了回去。", example: "公园景色太美了，让人流连忘返。", synonyms: ["依依不舍", "恋恋不舍"], antonyms: ["归心似箭"] },
  { word: "震耳欲聋", pinyin: "zhèn ěr yù lóng", definition: "形容声音很大，耳朵都快震聋了。", example: "鞭炮声震耳欲聋，十分热闹。", synonyms: ["响彻云霄", "震天动地"], antonyms: ["鸦雀无声", "寂静无声"] },
  { word: "不可思议", pinyin: "bù kě sī yì", definition: "原有神秘奥妙的意思。现多指无法想象，难以理解。", example: "这个结果真是不可思议，谁也没想到。", synonyms: ["难以置信", "不可思议"], antonyms: ["合情合理", "理所当然"] },
  { word: "随声附和", pinyin: "suí shēng fù hè", definition: "和：声音相应。自己没有主见，别人说什么，自己跟着说什么。", example: "我们要有独立见解，不能随声附和。", synonyms: ["人云亦云", "亦步亦趋"], antonyms: ["独树一帜", "各抒己见"] },
  { word: "一丝不苟", pinyin: "yī sī bù gǒu", definition: "苟：随便。形容办事认真，连最细微的地方也不马虎。", example: "他工作一丝不苟，从不马虎。", synonyms: ["兢兢业业", "精益求精"], antonyms: ["粗心大意", "马马虎虎"] },
  { word: "专心致志", pinyin: "zhuān xīn zhì zhì", definition: "致：尽，极；志：心意。把心思全放在上面。形容一心一意，聚精会神。", example: "他专心致志地学习，没有注意到周围的人。", synonyms: ["全神贯注", "聚精会神"], antonyms: ["心不在焉", "三心二意"] },
  { word: "聚精会神", pinyin: "jù jīng huì shén", definition: "会：集中。原指君臣协力，集思广益。后形容精神高度集中。", example: "同学们聚精会神地听老师讲课。", synonyms: ["全神贯注", "专心致志"], antonyms: ["心不在焉", "神思恍惚"] },
  { word: "全神贯注", pinyin: "quán shén guàn zhù", definition: "贯注：集中。全部精神集中在一点上。形容注意力高度集中。", example: "他全神贯注地盯着屏幕，不放过任何细节。", synonyms: ["聚精会神", "专心致志"], antonyms: ["心不在焉", "漫不经心"] },
  { word: "废寝忘食", pinyin: "fèi qǐn wàng shí", definition: "顾不得睡觉，忘记了吃饭。形容专心努力。", example: "科学家们废寝忘食地研究新药。", synonyms: ["日理万机", "夜以继日"], antonyms: ["饱食终日", "无所事事"] },
  { word: "日以继夜", pinyin: "rì yǐ jì yè", definition: "晚上连着白天，形容加紧工作或学习。", example: "工人们日以继夜地工作，只为按时完成工程。", synonyms: ["夜以继日", "通宵达旦"], antonyms: ["无所事事"] },
  { word: "孜孜不倦", pinyin: "zī zī bù juàn", definition: "孜孜：勤勉，不懈怠。指工作或学习勤奋不知疲倦。", example: "老师孜孜不倦地教导我们。", synonyms: ["废寝忘食", "手不释卷"], antonyms: ["无心向学", "游手好闲"] },
  { word: "手不释卷", pinyin: "shǒu bù shì juàn", definition: "释：放下；卷：指书籍。书本不离手。形容勤奋好学。", example: "他是个手不释卷的书迷，一天到晚都在看书。", synonyms: ["学而不厌", "废寝忘食"], antonyms: ["不学无术"] },
  { word: "学而不厌", pinyin: "xué ér bù yàn", definition: "学习总感到不满足。形容好学。", example: "孔子说：学而不厌，诲人不倦。", synonyms: ["手不释卷", "勤学苦练"], antonyms: ["不学无术"] },
  { word: "诲人不倦", pinyin: "huì rén bù juàn", definition: "诲：教导。教导人特别耐心，从不厌倦。", example: "王老师诲人不倦，深受学生爱戴。", synonyms: ["循循善诱", "谆谆教导"], antonyms: ["误人子弟"] },
  { word: "循循善诱", pinyin: "xún xún shàn yòu", definition: "循循：有次序的样子；诱：引导。指善于循序渐进地引导、教育。", example: "老师循循善诱，引导我们逐步理解复杂的问题。", synonyms: ["谆谆教导", "诲人不倦"], antonyms: ["误人子弟"] },
  { word: "春风化雨", pinyin: "chūn fēng huà yǔ", definition: "比喻良好的熏陶和教育。多用来称颂师长的教诲。", example: "老师的教育如春风化雨，滋润着我们的心田。", synonyms: ["循循善诱", "诲人不倦"], antonyms: ["误人子弟"] },
  { word: "桃李满天下", pinyin: "táo lǐ mǎn tiān xià", definition: "桃李：指培养的学生。比喻学生很多，各地都有。", example: "王老师教了四十年书，真是桃李满天下。", synonyms: ["桃李芬芳", "门墙桃李"], antonyms: [] },
  { word: "望尘莫及", pinyin: "wàng chén mò jí", definition: "指望见前面骑马的人走过扬起的尘土而不能赶上，比喻远远落在后面。", example: "他的成绩太好了，我们只能望尘莫及。", synonyms: ["可望而不可即", "高不可攀"], antonyms: ["后来居上", "迎头赶上"] },
  { word: "青出于蓝", pinyin: "qīng chū yú lán", definition: "青：靛青；蓝：蓼蓝之类可作染料的草。靛青是从蓼蓝中提炼出来的，但颜色比蓼蓝更深。比喻学生超过老师或后人胜过前人。", example: "他的技艺已经青出于蓝，超过了他的老师。", synonyms: ["后来居上", "后起之秀"], antonyms: ["每况愈下", "一代不如一代"] },
  { word: "后来居上", pinyin: "hòu lái jū shàng", definition: "后来的超过先前的。", example: "这位年轻选手后来居上，赢得了比赛。", synonyms: ["青出于蓝", "后起之秀"], antonyms: ["望尘莫及", "一代不如一代"] },
  { word: "后起之秀", pinyin: "hòu qǐ zhī xiù", definition: "后来出现的或新成长起来的优秀人物。", example: "他是公司里公认的后起之秀。", synonyms: ["新秀", "青出于蓝"], antonyms: ["元老", "前辈"] },
  { word: "风华正茂", pinyin: "fēng huá zhèng mào", definition: "风华：风采才华；茂：茂盛。正是青春焕发、才华横溢的时候。", example: "青年人风华正茂，应该努力奋斗。", synonyms: ["年轻有为", "朝气蓬勃"], antonyms: ["风烛残年", "老态龙钟"] },
  { word: "朝气蓬勃", pinyin: "zhāo qì péng bó", definition: "朝气：早上的空气，引申为旺盛、向上的精神。蓬勃：旺盛的样子。形容充满了生命和活力。", example: "学生们朝气蓬勃地迎接新的一天。", synonyms: ["生机勃勃", "意气风发"], antonyms: ["暮气沉沉", "死气沉沉"] },
  { word: "生机勃勃", pinyin: "shēng jī bó bó", definition: "形容自然界充满生命力，或社会生活活跃。", example: "春天来了，大地一片生机勃勃。", synonyms: ["生意盎然", "朝气蓬勃"], antonyms: ["死气沉沉", "万马齐喑"] },
  { word: "兴高采烈", pinyin: "xìng gāo cǎi liè", definition: "兴：原指志趣，后指兴致；采：原指神采，后指精神。形容兴致高，精神饱满。", example: "同学们兴高采烈地参加春游活动。", synonyms: ["欢欣鼓舞", "欣喜若狂"], antonyms: ["无精打采", "闷闷不乐"] },
  { word: "欢欣鼓舞", pinyin: "huān xīn gǔ wǔ", definition: "欢欣：欣喜；鼓舞：振奋。形容高兴而振奋。", example: "听到胜利的消息，人们欢欣鼓舞。", synonyms: ["欣喜若狂", "兴高采烈"], antonyms: ["垂头丧气", "黯然神伤"] },
  { word: "欣喜若狂", pinyin: "xīn xǐ ruò kuáng", definition: "欣喜：快乐；若：好像；狂：失去控制。形容高兴到了极点。", example: "听到录取的消息，他欣喜若狂。", synonyms: ["欢天喜地", "喜出望外"], antonyms: ["悲痛欲绝", "肝肠寸断"] },
  { word: "喜出望外", pinyin: "xǐ chū wàng wài", definition: "望：希望，意料。由于没有想到的好事而非常高兴。", example: "收到意外的礼物，她喜出望外。", synonyms: ["喜从天降", "惊喜万分"], antonyms: ["大失所望", "失望至极"] },
  { word: "心花怒放", pinyin: "xīn huā nù fàng", definition: "怒放：盛开。心里高兴得像花儿盛开一样。形容极其高兴。", example: "听到好消息，他心花怒放。", synonyms: ["欣喜若狂", "乐不可支"], antonyms: ["愁眉苦脸", "闷闷不乐"] },
  { word: "乐不可支", pinyin: "lè bù kě zhī", definition: "支：撑持。快乐到不能撑持的程度。形容欣喜到了极点。", example: "这个笑话让大家乐不可支。", synonyms: ["欣喜若狂", "笑逐颜开"], antonyms: ["愁眉不展", "郁郁寡欢"] },
  { word: "眉开眼笑", pinyin: "méi kāi yǎn xiào", definition: "眉头舒展，眼含笑意。形容高兴愉快的样子。", example: "看到孩子，她眉开眼笑。", synonyms: ["喜笑颜开", "笑容可掬"], antonyms: ["愁眉苦脸", "愁眉不展"] },
  { word: "笑容可掬", pinyin: "xiào róng kě jū", definition: "掬：用双手捧。笑容满面，好像可以用手捧住。", example: "老师笑容可掬地迎接新同学。", synonyms: ["眉开眼笑", "喜笑颜开"], antonyms: ["愁眉苦脸"] },
  { word: "和蔼可亲", pinyin: "hé ǎi kě qīn", definition: "和蔼：和善。态度温和，容易接近。", example: "李老师和蔼可亲，学生们都很喜欢她。", synonyms: ["平易近人", "和颜悦色"], antonyms: ["气势汹汹", "冷若冰霜"] },
  { word: "平易近人", pinyin: "píng yì jìn rén", definition: "对人和蔼可亲，没有架子，使人容易接近。也指文字浅显，容易了解。", example: "这位老教授平易近人，没有一点架子。", synonyms: ["和蔼可亲", "和颜悦色"], antonyms: ["盛气凌人", "高高在上"] },
  { word: "和颜悦色", pinyin: "hé yán yuè sè", definition: "和蔼：和善；悦：喜悦。形容态度和蔼可亲。", example: "妈妈和颜悦色地给我讲故事。", synonyms: ["和蔼可亲", "平易近人"], antonyms: ["怒气冲冲", "横眉冷对"] },
  { word: "彬彬有礼", pinyin: "bīn bīn yǒu lǐ", definition: "彬彬：文雅的样子。形容文雅有礼貌的样子。", example: "他是个彬彬有礼的好孩子。", synonyms: ["温文尔雅", "落落大方"], antonyms: ["蛮横无理", "粗鲁无礼"] },
  { word: "温文尔雅", pinyin: "wēn wén ěr yǎ", definition: "态度温和，举止文雅。", example: "他温文尔雅，说话轻声细语。", synonyms: ["彬彬有礼", "文质彬彬"], antonyms: ["粗鲁无礼", "野蛮无理"] },
  { word: "落落大方", pinyin: "luò luò dà fāng", definition: "落落：坦率，开朗的样子。形容言谈举止自然大方。", example: "她在舞台上落落大方，表现很出色。", synonyms: ["举止大方", "雍容华贵"], antonyms: ["缩手缩脚", "局促不安"] },
  { word: "雍容华贵", pinyin: "yōng róng huá guì", definition: "形容态度文雅从容，气度高雅，豪华富贵。", example: "这位女士雍容华贵，气质非凡。", synonyms: ["华贵雍容", "仪态万方"], antonyms: ["穷酸潦倒", "寒酸卑微"] },
  { word: "气宇轩昂", pinyin: "qì yǔ xuān áng", definition: "气宇：人的仪表、气概；轩昂：精神饱满的样子。形容人精力充沛，风度不凡。", example: "这位战士气宇轩昂，威武雄壮。", synonyms: ["英姿飒爽", "神采奕奕"], antonyms: ["萎靡不振", "无精打采"] },
  { word: "神采奕奕", pinyin: "shén cǎi yì yì", definition: "神采：人面部的神气和光彩。奕奕：精神焕发的样子。形容精神饱满，容光焕发。", example: "他今天神采奕奕，精神很好。", synonyms: ["精神饱满", "容光焕发"], antonyms: ["无精打采", "萎靡不振"] },
  { word: "容光焕发", pinyin: "róng guāng huàn fā", definition: "容光：脸上的光彩；焕发：光彩四射。形容身体好，精神饱满。", example: "经过休息，他容光焕发，精神了许多。", synonyms: ["神采奕奕", "精神焕发"], antonyms: ["面容憔悴", "萎靡不振"] },
  { word: "精神焕发", pinyin: "jīng shén huàn fā", definition: "形容精神振作，情绪饱满。", example: "新年新气象，大家精神焕发。", synonyms: ["精神饱满", "神采飞扬"], antonyms: ["精神萎靡", "无精打采"] },
  { word: "精神饱满", pinyin: "jīng shén bǎo mǎn", definition: "形容精神振作，情绪高昂。", example: "运动员们精神饱满地走进赛场。", synonyms: ["神采奕奕", "精神焕发"], antonyms: ["萎靡不振", "无精打采"] },
  { word: "斗志昂扬", pinyin: "dòu zhì áng yáng", definition: "昂扬：情绪高涨。斗争的情绪高涨。", example: "我军斗志昂扬，一举击溃了敌人。", synonyms: ["意气风发", "士气高昂"], antonyms: ["垂头丧气", "萎靡不振"] },
  { word: "意气风发", pinyin: "yì qì fēng fā", definition: "意气：意志和气概；风发：像风吹一样。形容精神振奋，气概豪迈。", example: "青年人意气风发，志在四方。", synonyms: ["斗志昂扬", "神采飞扬"], antonyms: ["萎靡不振", "垂头丧气"] },
  { word: "豪情壮志", pinyin: "háo qíng zhuàng zhì", definition: "豪迈的情感，雄壮的志向。", example: "我们要有豪情壮志，为祖国建设贡献力量。", synonyms: ["雄心壮志", "壮志凌云"], antonyms: ["胸无大志", "鼠目寸光"] },
  { word: "雄心壮志", pinyin: "xióng xīn zhuàng zhì", definition: "雄心：远大的理想；壮志：豪壮的志愿。形容理想远大，志向宏大。", example: "年轻人要有雄心壮志，敢于追梦。", synonyms: ["壮志凌云", "豪情壮志"], antonyms: ["胸无大志", "得过且过"] },
  { word: "壮志凌云", pinyin: "zhuàng zhì líng yún", definition: "壮志：宏大的志愿；凌云：直上云霄。形容理想宏大，志向高远。", example: "他从小就有壮志凌云的抱负。", synonyms: ["雄心壮志", "豪情壮志"], antonyms: ["胸无大志"] },
  { word: "胸怀大志", pinyin: "xiōng huái dà zhì", definition: "胸怀：胸襟。有远大的志向和抱负。", example: "我们要胸怀大志，脚踏实地。", synonyms: ["胸怀大志", "志存高远"], antonyms: ["胸无大志", "鼠目寸光"] },
  { word: "志存高远", pinyin: "zhì cún gāo yuǎn", definition: "指立志很高远，有远大理想。", example: "青年人应该志存高远，脚踏实地。", synonyms: ["胸怀大志", "雄心壮志"], antonyms: ["胸无大志", "鼠目寸光"] },
  { word: "脚踏实地", pinyin: "jiǎo tà shí dì", definition: "脚踏在坚实的土地上。比喻做事踏实，认真。", example: "我们要脚踏实地，一步一个脚印前进。", synonyms: ["兢兢业业", "实事求是"], antonyms: ["好高骛远", "眼高手低"] },
  { word: "实事求是", pinyin: "shí shì qiú shì", definition: "指从实际对象出发，探求事物的内部联系及其发展的规律性，认识事物的本质。", example: "做学问要实事求是，不能弄虚作假。", synonyms: ["脚踏实地", "恰如其分"], antonyms: ["弄虚作假", "浮而不实"] },
  { word: "名副其实", pinyin: "míng fù qí shí", definition: "名声或名称与实际相符合。", example: "他是一位名副其实的英雄。", synonyms: ["名不虚传", "当之无愧"], antonyms: ["名不副实", "徒有虚名"] },
  { word: "名不虚传", pinyin: "míng bù xū chuán", definition: "传出的名声不是虚假的。指实在很好，不是空有虚名。", example: "黄山美景名不虚传，值得一游。", synonyms: ["名副其实", "当之无愧"], antonyms: ["名不副实", "徒有虚名"] },
  { word: "当之无愧", pinyin: "dāng zhī wú kuì", definition: "当：承当，承受。当得起某种称号或荣誉，无须感到惭愧。", example: "他是当之无愧的劳动模范。", synonyms: ["名副其实", "受之无愧"], antonyms: ["名不副实", "受之有愧"] },
  { word: "受之无愧", pinyin: "shòu zhī wú kuì", definition: "接受某种荣誉或称号等是当之无愧的。", example: "这项荣誉他受之无愧。", synonyms: ["当之无愧", "名副其实"], antonyms: ["受之有愧"] },
  { word: "问心无愧", pinyin: "wèn xīn wú kuì", definition: "问心：问问自己。扪心自问，毫无惭愧。", example: "我尽力了，问心无愧。", synonyms: ["心安理得", "无愧于色"], antonyms: ["问心有愧", "无地自容"] },
  { word: "心安理得", pinyin: "xīn ān lǐ dé", definition: "得：适合。自以为做的事情合乎道理，心里很坦然。", example: "既然没做错事，就心安理得。", synonyms: ["问心无愧", "无愧于心"], antonyms: ["问心有愧", "忐忑不安"] },
  { word: "理直气壮", pinyin: "lǐ zhí qì zhuàng", definition: "理直：理由正确、充分；气壮：气势旺盛。理由充分，说话气势就壮。", example: "他理直气壮地反驳了对方的指责。", synonyms: ["义正词严", "慷慨陈词"], antonyms: ["理屈词穷", "强词夺理"] },
  { word: "义正词严", pinyin: "yì zhèng cí yán", definition: "义：道理；词：言辞。道理正当，言辞严厉。", example: "他义正词严地指出对方的错误。", synonyms: ["理直气壮", "慷慨陈词"], antonyms: ["理屈词穷", "强词夺理"] },
  { word: "慷慨陈词", pinyin: "kāng kǎi chén cí", definition: "慷慨：情绪激动，充满正气；陈：陈述。充满正气地陈述自己的观点。", example: "他在会上慷慨陈词，表达了自己的看法。", synonyms: ["义正词严", "侃侃而谈"], antonyms: ["吞吞吐吐", "支支吾吾"] },
  { word: "侃侃而谈", pinyin: "kǎn kǎn ér tán", definition: "侃侃：理直气壮、从容不迫地说话。形容说话理直气壮、从容不迫。", example: "他在会上侃侃而谈，赢得了大家的掌声。", synonyms: ["滔滔不绝", "口若悬河"], antonyms: ["吞吞吐吐", "哑口无言"] },
  { word: "滔滔不绝", pinyin: "tāo tāo bù jué", definition: "滔滔：形容流水不断。像流水那样毫不间断。指话很多，说起来没个完。", example: "他滔滔不绝地讲了两个小时。", synonyms: ["口若悬河", "侃侃而谈"], antonyms: ["哑口无言", "张口结舌"] },
  { word: "口若悬河", pinyin: "kǒu ruò xuán hé", definition: "讲起话来滔滔不绝，像瀑布不停地奔流倾泻。形容能说会辩，口才很好，言辞不断。", example: "这位演讲家口若悬河，十分精彩。", synonyms: ["滔滔不绝", "侃侃而谈"], antonyms: ["笨嘴拙舌", "哑口无言"] },
  { word: "能说会道", pinyin: "néng shuō huì dào", definition: "形容很会讲话，口才好。", example: "她能说会道，很适合做销售工作。", synonyms: ["能言善辩", "巧舌如簧"], antonyms: ["笨嘴拙舌", "哑口无言"] },
  { word: "能言善辩", pinyin: "néng yán shàn biàn", definition: "形容能说会道，善于辩解。", example: "律师能言善辩，为当事人争取权益。", synonyms: ["能说会道", "口若悬河"], antonyms: ["笨嘴拙舌", "拙口钝腮"] },
  { word: "笨嘴拙舌", pinyin: "bèn zuǐ zhuō shé", definition: "拙：不巧。形容没有口才，不善言辞。", example: "我笨嘴拙舌的，不会说话。", synonyms: ["拙口钝腮", "木讷寡言"], antonyms: ["能说会道", "口若悬河"] },
  { word: "拙口钝腮", pinyin: "zhuō kǒu dùn sāi", definition: "比喻嘴笨，没有口才。", example: "我拙口钝腮，说不出什么好听的。", synonyms: ["笨嘴拙舌", "木讷寡言"], antonyms: ["能说会道", "口若悬河"] },
  { word: "哑口无言", pinyin: "yǎ kǒu wú yán", definition: "哑口：像哑巴一样。像哑巴一样说不出话来。形容理屈词穷的样子。", example: "面对事实，他哑口无言。", synonyms: ["张口结舌", "理屈词穷"], antonyms: ["滔滔不绝", "侃侃而谈"] },
  { word: "张口结舌", pinyin: "zhāng kǒu jié shé", definition: "张口：张开嘴；结舌：舌头打结。形容害怕或吃惊而说不出话的样子。", example: "他被问得张口结舌，不知如何回答。", synonyms: ["哑口无言", "目瞪口呆"], antonyms: ["对答如流", "口若悬河"] },
  { word: "目瞪口呆", pinyin: "mù dèng kǒu dāi", definition: "形容因吃惊或害怕而发愣的样子。", example: "听到这个消息，大家都目瞪口呆。", synonyms: ["瞠目结舌", "呆若木鸡"], antonyms: ["泰然自若", "若无其事"] },
  { word: "瞠目结舌", pinyin: "chēng mù jié shé", definition: "瞠：瞪着眼；结舌：说不出话。瞪着眼睛，说不出话来。形容窘困或惊呆的样子。", example: "这个问题让他瞠目结舌，答不上来。", synonyms: ["目瞪口呆", "张口结舌"], antonyms: ["对答如流", "应对如流"] },
  { word: "呆若木鸡", pinyin: "dāi ruò mù jī", definition: "呆：傻，发愣的样子。形容因恐惧或惊讶而发愣的样子。", example: "他吓得呆若木鸡，一动不动。", synonyms: ["目瞪口呆", "瞠目结舌"], antonyms: ["神采奕奕", "生机勃勃"] },
  { word: "泰然自若", pinyin: "tài rán zì ruò", definition: "泰然：安然，不以为意的样子；自若：自在，如常。形容在紧急情况下沉着镇定，不慌不忙。", example: "面对危险，他泰然自若，从容应对。", synonyms: ["从容不迫", "镇定自若"], antonyms: ["惊慌失措", "手足无措"] },
  { word: "从容不迫", pinyin: "cóng róng bù pò", definition: "从容：不慌不忙，镇静；不迫：不急促。不慌不忙，沉着镇定。", example: "他从容不迫地回答了所有问题。", synonyms: ["泰然自若", "镇定自若"], antonyms: ["惊慌失措", "手足无措"] },
  { word: "镇定自若", pinyin: "zhèn dìng zì ruò", definition: "面对灾难或紧急情况时，神情脸色毫无变异。形容非常镇静、从容。", example: "他在危机面前镇定自若，指挥若定。", synonyms: ["泰然自若", "从容不迫"], antonyms: ["惊慌失措", "手足无措"] },
  { word: "若无其事", pinyin: "ruò wú qí shì", definition: "好像没有那回事一样。形容态度镇静，或办事沉着。也形容对发生的事情无动于衷。", example: "他若无其事地走进教室，好像什么都没发生。", synonyms: ["泰然自若", "从容不迫"], antonyms: ["惊慌失措", "如坐针毡"] },
  { word: "如坐针毡", pinyin: "rú zuò zhēn zhān", definition: "像坐在插着针的毡子上。形容心神不宁，坐立不安。", example: "等待面试的时候，他如坐针毡，坐立不安。", synonyms: ["坐立不安", "心神不宁"], antonyms: ["泰然自若", "心安理得"] },
  { word: "坐立不安", pinyin: "zuò lì bù ān", definition: "坐着也不是，站着也不是。形容心情紧张，情绪不安。", example: "考试前，他坐立不安，很紧张。", synonyms: ["忐忑不安", "心神不宁"], antonyms: ["泰然自若", "从容不迫"] },
  { word: "忐忑不安", pinyin: "tǎn tè bù ān", definition: "忐忑：心神不定。心神极为不安。", example: "他在外面忐忑不安地等待结果。", synonyms: ["坐立不安", "心神不宁"], antonyms: ["心安理得", "泰然自若"] },
  { word: "心神不宁", pinyin: "xīn shén bù níng", definition: "形容心情不平静。心神：心情，神志。", example: "家里出了事，他心神不宁的。", synonyms: ["忐忑不安", "坐立不安"], antonyms: ["心安理得", "心平气和"] },
  { word: "心平气和", pinyin: "xīn píng qì hé", definition: "心情平静，态度温和。指不急躁，不生气。", example: "我们要心平气和地解决问题。", synonyms: ["平心静气", "从容不迫"], antonyms: ["气急败坏", "怒火中烧"] },
  { word: "平心静气", pinyin: "píng xīn jìng qì", definition: "心情平和，态度冷静。", example: "遇到问题要平心静气地分析。", synonyms: ["心平气和", "沉着冷静"], antonyms: ["气急败坏", "暴跳如雷"] },
  { word: "气急败坏", pinyin: "qì jí bài huài", definition: "上气不接下气，狼狈不堪。形容十分荒张或恼怒。", example: "他气急败坏地冲了出去。", synonyms: ["暴跳如雷", "恼羞成怒"], antonyms: ["心平气和", "泰然自若"] },
  { word: "暴跳如雷", pinyin: "bào tiào rú léi", definition: "暴：暴烈，急躁。急得叫跳，像打雷一样。形容大怒的样子。", example: "听到这个消息，他暴跳如雷。", synonyms: ["大发雷霆", "怒火中烧"], antonyms: ["心平气和", "和颜悦色"] },
  { word: "大发雷霆", pinyin: "dà fā léi tíng", definition: "霆：暴雷；雷霆：震耳的雷声。形容大发脾气，高声斥责。", example: "他对这种行为大发雷霆。", synonyms: ["暴跳如雷", "怒发冲冠"], antonyms: ["和颜悦色", "心平气和"] },
  { word: "怒发冲冠", pinyin: "nù fà chōng guān", definition: "冠：帽子。愤怒得头发直立，顶起帽子。形容愤怒到了极点。", example: "听到这个消息，他怒发冲冠。", synonyms: ["怒气冲天", "怒不可遏"], antonyms: ["喜笑颜开", "心平气和"] },
  { word: "怒不可遏", pinyin: "nù bù kě è", definition: "遏：止。愤怒地难以抑制。形容愤怒到了极点。", example: "看到不公正的事情，他怒不可遏。", synonyms: ["怒发冲冠", "怒火中烧"], antonyms: ["心平气和", "喜笑颜开"] },
  { word: "义愤填膺", pinyin: "yì fèn tián yīng", definition: "义愤：对违反正义的事情所产生的愤怒；膺：胸。由于违反正义的事情所激起的愤怒充满胸膛。", example: "听到这种不公正的事，大家义愤填膺。", synonyms: ["愤愤不平", "满腔义愤"], antonyms: ["心平气和"] },
  { word: "愤愤不平", pinyin: "fèn fèn bù píng", definition: "愤愤：很生气的样子。心中不服，感到气愤。", example: "他对这个结果感到愤愤不平。", synonyms: ["愤愤不平", "鸣不平"], antonyms: ["心平气和"] },
  { word: "感慨万千", pinyin: "gǎn kǎi wàn qiān", definition: "因外界事物变化很大而引起许多感想、感触。", example: "回想起往事，他感慨万千。", synonyms: ["百感交集", "思绪万千"], antonyms: ["无动于衷"] },
  { word: "百感交集", pinyin: "bǎi gǎn jiāo jí", definition: "感：感想；交：同时发生。各种感触交织在一起。形容感触很多，心情复杂。", example: "离别时，大家百感交集，不知说什么好。", synonyms: ["感慨万千", "悲喜交加"], antonyms: ["无动于衷"] },
  { word: "热泪盈眶", pinyin: "rè lèi yíng kuàng", definition: "盈：充满。因感情激动而使眼泪充满了眼眶，形容感动至极或非常悲伤。", example: "看到这一幕，她热泪盈眶。", synonyms: ["潸然泪下", "泪流满面"], antonyms: ["兴高采烈", "眉开眼笑"] },
  { word: "潸然泪下", pinyin: "shān rán lèi xià", definition: "潸然：流泪的样子。形容泪流不止。", example: "听到这个悲伤的故事，大家都潸然泪下。", synonyms: ["泪流满面", "热泪盈眶"], antonyms: ["兴高采烈", "欢天喜地"] },
  { word: "泪流满面", pinyin: "lèi liú mǎn miàn", definition: "眼泪流了一脸。形容非常悲伤或感动。", example: "他伤心地哭得泪流满面。", synonyms: ["涕泗横流", "潸然泪下"], antonyms: ["眉开眼笑"] },
  { word: "悲痛欲绝", pinyin: "bēi tòng yù jué", definition: "绝：穷尽，死。指悲哀悲痛到了极点。", example: "听到亲人去世的消息，他悲痛欲绝。", synonyms: ["痛不欲生", "肝肠寸断"], antonyms: ["欣喜若狂", "兴高采烈"] },
  { word: "痛不欲生", pinyin: "tòng bù yù shēng", definition: "悲痛得不想活下去。形容悲痛到极点。", example: "失去爱子，她痛不欲生。", synonyms: ["悲痛欲绝", "哀痛欲绝"], antonyms: ["欣喜若狂"] },
  { word: "肝肠寸断", pinyin: "gān cháng cùn duàn", definition: "肝肠一寸寸断开。比喻伤心到极点。", example: "听到这个噩耗，他肝肠寸断。", synonyms: ["悲痛欲绝", "心碎欲绝"], antonyms: ["欣喜若狂"] },
  { word: "心碎欲绝", pinyin: "xīn suì yù jué", definition: "心都碎了，想要断绝。形容极度伤心。", example: "经历这场变故，她心碎欲绝。", synonyms: ["肝肠寸断", "悲痛欲绝"], antonyms: ["欣喜若狂"] },
  { word: "孤苦伶仃", pinyin: "gū kǔ líng dīng", definition: "伶仃：孤独，没有依靠。孤单困苦，没有依靠。", example: "这位老人孤苦伶仃，无依无靠。", synonyms: ["形单影只", "无依无靠"], antonyms: ["儿孙满堂", "儿孙绕膝"] },
  { word: "形单影只", pinyin: "xíng dān yǐng zhī", definition: "形容孤独，没有同伴。", example: "他独自一人在异乡，形单影只。", synonyms: ["孤苦伶仃", "孑然一身"], antonyms: ["成群结队", "三五成群"] },
  { word: "孑然一身", pinyin: "jié rán yī shēn", definition: "孑：单独。孤孤单单一个人。", example: "他孑然一身，无牵无挂。", synonyms: ["形单影只", "孤苦伶仃"], antonyms: ["成群结队"] },
  { word: "相依为命", pinyin: "xiāng yī wéi mìng", definition: "互相依靠着过日子。泛指两人关系密切，谁也离不开谁。", example: "母女俩相依为命，生活很艰难。", synonyms: ["患难与共", "相濡以沫"], antonyms: ["漠不关心", "形同陌路"] },
  { word: "相濡以沫", pinyin: "xiāng rú yǐ mò", definition: "濡：沾湿；沫：唾沫。泉水干了，鱼吐沫互相润湿。比喻一同在困难的处境里，用微薄的力量互相帮助。", example: "在困难时期，大家相濡以沫，共度难关。", synonyms: ["同舟共济", "患难与共"], antonyms: ["落井下石", "趁火打劫"] },
  { word: "同舟共济", pinyin: "tóng zhōu gòng jì", definition: "舟：船；济：渡，过。坐一条船，共同渡河。比喻团结互助，同心协力，战胜困难。", example: "在困难面前，我们要同舟共济。", synonyms: ["风雨同舟", "患难与共"], antonyms: ["分道扬镳", "各行其是"] },
  { word: "风雨同舟", pinyin: "fēng yǔ tóng zhōu", definition: "在狂风暴雨中同乘一条船，一起与风雨搏斗。比喻共同经历患难。", example: "多年来，我们风雨同舟，建立了深厚的友谊。", synonyms: ["同舟共济", "患难与共"], antonyms: ["分道扬镳"] },
  { word: "患难与共", pinyin: "huàn nàn yǔ gòng", definition: "共同承担危险和困难。", example: "真正的朋友应该患难与共。", synonyms: ["同舟共济", "风雨同舟"], antonyms: ["落井下石", "趁火打劫"] },
  { word: "肝胆相照", pinyin: "gān dǎn xiāng zhào", definition: "肝胆：比喻真心诚意。比喻以真心相见。", example: "他们是肝胆相照的好朋友。", synonyms: ["赤诚相待", "真心实意"], antonyms: ["虚情假意", "假仁假义"] },
  { word: "赤诚相待", pinyin: "chì chéng xiāng dài", definition: "极真诚地对待别人。", example: "我们要赤诚相待，建立真正的友谊。", synonyms: ["真诚相待", "真心实意"], antonyms: ["虚情假意", "假仁假义"] },
  { word: "真诚相待", pinyin: "zhēn chéng xiāng dài", definition: "真心实意地对待别人。", example: "朋友之间应该真诚相待。", synonyms: ["赤诚相待", "真心实意"], antonyms: ["虚情假意"] },
  { word: "虚情假意", pinyin: "xū qíng jiǎ yì", definition: "虚：假。装着对人热情，不是真心实意。", example: "他对你只是虚情假意，不要当真。", synonyms: ["假仁假义", "虚与委蛇"], antonyms: ["真心实意", "赤诚相待"] },
  { word: "假仁假义", pinyin: "jiǎ rén jiǎ yì", definition: "伪装仁慈善良。", example: "这是个假仁假义的伪君子。", synonyms: ["虚情假意", "装模作样"], antonyms: ["真心实意", "仁至义尽"] },
  { word: "虚与委蛇", pinyin: "xū yǔ wēi yí", definition: "虚：假；委蛇：敷衍。指对人虚情假意，敷衍应酬。", example: "我不喜欢他，只能虚与委蛇地应付一下。", synonyms: ["敷衍了事", "虚情假意"], antonyms: ["真心实意", "开诚布公"] },
  { word: "敷衍了事", pinyin: "fū yǎn liǎo shì", definition: "敷衍：做事不认真；了：完。指办事不认真，只是应付过去。", example: "工作要认真负责，不能敷衍了事。", synonyms: ["马马虎虎", "草草了事"], antonyms: ["一丝不苟", "兢兢业业"] },
  { word: "马马虎虎", pinyin: "mǎ ma hū hū", definition: "形容做事不认真，不仔细。", example: "他做事总是马马虎虎，经常出错。", synonyms: ["粗心大意", "敷衍了事"], antonyms: ["一丝不苟", "认真细致"] },
  { word: "粗心大意", pinyin: "cū xīn dà yì", definition: "粗：粗疏。指做事不细心，马马虎虎。", example: "这次考试失利是因为粗心大意。", synonyms: ["马马虎虎", "漫不经心"], antonyms: ["一丝不苟", "小心翼翼"] },
  { word: "小心翼翼", pinyin: "xiǎo xīn yì yì", definition: "本是严肃恭敬的意思。现形容举动十分谨慎，丝毫不敢疏忽。", example: "他小心翼翼地捧着易碎的瓷器。", synonyms: ["谨小慎微", "一丝不苟"], antonyms: ["粗心大意", "漫不经心"] },
  { word: "谨小慎微", pinyin: "jǐn xiǎo shèn wēi", definition: "过分小心谨慎，缩手缩脚，不敢放手去做。", example: "他做事谨小慎微，生怕出错。", synonyms: ["小心翼翼", "小心谨慎"], antonyms: ["大胆妄为", "粗心大意"] },
  { word: "大张旗鼓", pinyin: "dà zhāng qí gǔ", definition: "大张：大规模地；旗鼓：战旗和战鼓。形容进攻的声势和规模很大。也形容群众活动声势和规模很大。", example: "学校大张旗鼓地开展了环保宣传活动。", synonyms: ["轰轰烈烈", "声势浩大"], antonyms: ["偷偷摸摸", "无声无息"] },
  { word: "轰轰烈烈", pinyin: "hōng hōng liè liè", definition: "轰轰：象声词；烈烈：火焰炽盛的样子。形容事业的兴旺。也形容声势浩大，气魄宏伟。", example: "我们要轰轰烈烈地干一番事业。", synonyms: ["大张旗鼓", "声势浩大"], antonyms: ["偃旗息鼓", "无声无息"] },
  { word: "声势浩大", pinyin: "shēng shì hào dà", definition: "声势：声威和气势；浩大：巨大。形容声威和气势非常壮大。", example: "这次活动的声势浩大，影响深远。", synonyms: ["大张旗鼓", "轰轰烈烈"], antonyms: ["无声无息"] },
  { word: "悄无声息", pinyin: "qiǎo wú shēng xī", definition: "静悄悄的，听不到声音。指非常寂静。", example: "夜深了，街道上悄无声息。", synonyms: ["鸦雀无声", "寂静无声"], antonyms: ["人声鼎沸", "热闹非凡"] },
  { word: "鸦雀无声", pinyin: "yā què wú shēng", definition: "连乌鸦麻雀的声音都没有。形容非常静。", example: "教室里鸦雀无声，同学们都在认真考试。", synonyms: ["悄无声息", "寂静无声"], antonyms: ["人声鼎沸", "喧闹非凡"] },
  { word: "人声鼎沸", pinyin: "rén shēng dǐng fèi", definition: "人群的声音像水在锅里沸腾一样。形容人多嘈杂。", example: "集市上人声鼎沸，热闹非凡。", synonyms: ["人山人海", "热闹非凡"], antonyms: ["鸦雀无声", "门可罗雀"] },
  { word: "人山人海", pinyin: "rén shān rén hǎi", definition: "人群如山似海。形容人聚集得非常多。", example: "节假日，公园里人山人海。", synonyms: ["万人空巷", "熙熙攘攘"], antonyms: ["寥寥无几", "三三两两"] },
  { word: "熙熙攘攘", pinyin: "xī xī rǎng rǎng", definition: "熙熙：和乐的样子；攘攘：纷乱的样子。形容人来人往，非常热闹拥挤。", example: "街上熙熙攘攘，人来人往。", synonyms: ["车水马龙", "川流不息"], antonyms: ["冷冷清清", "门可罗雀"] },
  { word: "车水马龙", pinyin: "chē shuǐ mǎ lóng", definition: "车像流水，马像游龙。形容来往车马很多，连续不断的热闹情景。", example: "繁华的街道上车水马龙，十分热闹。", synonyms: ["熙熙攘攘", "川流不息"], antonyms: ["门可罗雀", "冷冷清清"] },
  { word: "门可罗雀", pinyin: "mén kě luó què", definition: "大门前可以张网捕雀。形容门庭冷落，没有什么人往来。", example: "自从他失势后，家里门可罗雀，再也没人来拜访。", synonyms: ["门庭冷落", "冷冷清清"], antonyms: ["门庭若市", "车水马龙"] },
  { word: "冷冷清清", pinyin: "lěng lěng qīng qīng", definition: "形容事物被冷落、被忽视的萧条景象。", example: "节日过后，街上冷冷清清的。", synonyms: ["冷落萧条", "门庭冷落"], antonyms: ["热热闹闹", "熙熙攘攘"] },
  { word: "生机盎然", pinyin: "shēng jī àng rán", definition: "盎然：形容气氛或趣味等浓厚的样子。形容生命力旺盛的样子。", example: "春天到了，大地一片生机盎然。", synonyms: ["生机勃勃", "欣欣向荣"], antonyms: ["死气沉沉", "万马齐喑"] },
  { word: "欣欣向荣", pinyin: "xīn xīn xiàng róng", definition: "欣欣：草木旺盛的样子；荣：茂盛。形容草木长得茂盛。比喻事业蓬勃发展。", example: "我们的祖国欣欣向荣，繁荣富强。", synonyms: ["蒸蒸日上", "蓬勃发展"], antonyms: ["日薄西山", "气息奄奄"] },
  { word: "蒸蒸日上", pinyin: "zhēng zhēng rì shàng", definition: "蒸蒸：兴盛的样子。一天比一天上升发展，形容事业一天天向上发展。", example: "他的生意蒸蒸日上，越来越红火。", synonyms: ["欣欣向荣", "蓬勃发展"], antonyms: ["每况愈下", "江河日下"] },
  { word: "蓬勃发展", pinyin: "péng péng fā zhǎn", definition: "繁荣：繁荣发展；蓬勃：繁荣旺盛。形容发展迅速。", example: "我国经济蓬勃发展，人民生活水平不断提高。", synonyms: ["欣欣向荣", "蒸蒸日上"], antonyms: ["萧条冷落", "停滞不前"] },
  { word: "日新月异", pinyin: "rì xīn yuè yì", definition: "每天都在更新，每月都有变化。形容发展、进步很快。", example: "科技的发展日新月异，我们的生活也越来越好。", synonyms: ["一日千里", "突飞猛进"], antonyms: ["一成不变", "停滞不前"] },
  { word: "一日千里", pinyin: "yī rì qiān lǐ", definition: "原形容马跑得很快。后比喻进展极快。", example: "我国航天事业一日千里，取得了巨大成就。", synonyms: ["日新月异", "突飞猛进"], antonyms: ["停滞不前", "蜗行牛步"] },
  { word: "突飞猛进", pinyin: "tū fēi měng jìn", definition: "突、猛：形容飞快发展或进步。", example: "近年来，我国科技事业突飞猛进。", synonyms: ["一日千里", "日新月异"], antonyms: ["停滞不前", "蜗行牛步"] },
  { word: "一帆风顺", pinyin: "yī fān fēng shùn", definition: "船挂着满帆顺风行驶。比喻非常顺利，没有任何阻碍。", example: "祝你一帆风顺，前程似锦。", synonyms: ["顺风顺水", "无往不利"], antonyms: ["一波三折", "寸步难行"] },
  { word: "顺风顺水", pinyin: "shùn fēng shùn shuǐ", definition: "比喻运气好，做事顺利，没有阻碍。", example: "这次比赛他顺风顺水，一路过关斩将。", synonyms: ["一帆风顺", "无往不利"], antonyms: ["逆水行舟", "一波三折"] },
  { word: "无往不利", pinyin: "wú wǎng bù lì", definition: "无论到哪里，没有不顺利的。指事事顺利或处处行得通。", example: "凭借他的能力和经验，做什么都无往不利。", synonyms: ["一帆风顺", "左右逢源"], antonyms: ["处处碰壁", "寸步难行"] },
  { word: "左右逢源", pinyin: "zuǒ yòu féng yuán", definition: "逢：遇到；源：水源。到处都能遇到水源。比喻做事得心应手，非常顺利。", example: "他善于处理人际关系，在工作中左右逢源。", synonyms: ["得心应手", "无往不利"], antonyms: ["左右为难", "进退两难"] },
  { word: "得心应手", pinyin: "dé xīn yìng shǒu", definition: "得：得到，适应；应：反应。心里怎么想，手就能怎么做。比喻技艺纯熟或做事情非常顺利。", example: "经过多年练习，他弹钢琴早已得心应手。", synonyms: ["左右逢源", "游刃有余"], antonyms: ["手忙脚乱", "笨手笨脚"] },
  { word: "游刃有余", pinyin: "yóu rèn yǒu yú", definition: "刀刃运转于骨节空隙中，在有回旋的余地。比喻工作熟练，有实际经验，解决问题毫不费事。", example: "对于这项工作，他早已游刃有余。", synonyms: ["得心应手", "轻车熟路"], antonyms: ["捉襟见肘", "力不从心"] },
  { word: "轻车熟路", pinyin: "qīng chē shú lù", definition: "赶着装载很轻的车子，走在熟悉的路上。比喻对某事有经验，做起来容易。", example: "这是他的老本行，做起来轻车熟路。", synonyms: ["得心应手", "游刃有余"], antonyms: ["人生地不熟", "举步维艰"] },
  { word: "举步维艰", pinyin: "jǔ bù wéi jiān", definition: "迈步艰难。比喻办事情每向前进行一步都十分不容易。", example: "在困难面前，他虽然举步维艰，但从未放弃。", synonyms: ["寸步难行", "步履维艰"], antonyms: ["一帆风顺", "如履平地"] },
  { word: "寸步难行", pinyin: "cùn bù nán xíng", definition: "连一步都难以进行。形容走路困难，也比喻处境艰难。", example: "山路上积雪很深，寸步难行。", synonyms: ["步履维艰", "举步维艰"], antonyms: ["一帆风顺", "畅通无阻"] },
  { word: "畅通无阻", pinyin: "chàng tōng wú zǔ", definition: "毫无阻碍地通行或通过。", example: "这条路经过扩建后，现在畅通无阻。", synonyms: ["一帆风顺", "通行无阻"], antonyms: ["寸步难行", "阻塞不通"] },
  { word: "四通八达", pinyin: "sì tōng bā dá", definition: "四面八方都有路可通。形容交通极便利。也形容通向各方。", example: "这个城市交通便利，道路四通八达。", synonyms: ["畅通无阻", "交通便利"], antonyms: ["闭塞不通", "交通不便"] },
  { word: "天伦之乐", pinyin: "tiān lún zhī lè", definition: "天伦：旧指父子、兄弟等亲属关系。泛指家庭的乐趣。", example: "春节一家人团聚，享受天伦之乐。", synonyms: ["合家欢乐", "天伦叙乐"], antonyms: ["妻离子散", "家破人亡"] },
  { word: "合家欢乐", pinyin: "hé jiā huān lè", definition: "全家人都很快乐。", example: "祝大家春节快乐，合家欢乐！", synonyms: ["阖家欢乐", "天伦之乐"], antonyms: ["家破人亡"] },
  { word: "其乐无穷", pinyin: "qí lè wú qióng", definition: "其中的乐趣没有穷尽。指进行某一件事，感到乐在其中。", example: "读书是我最大的爱好，真是其乐无穷。", synonyms: ["乐在其中", "乐不思蜀"], antonyms: ["索然无味", "枯燥无味"] },
  { word: "乐在其中", pinyin: "lè zài qí zhōng", definition: "快乐就在其中。比喻在做某事的过程中获得乐趣。", example: "虽然工作辛苦，但他乐在其中。", synonyms: ["其乐无穷", "乐此不疲"], antonyms: ["索然无味", "苦不堪言"] },
  { word: "乐此不疲", pinyin: "lè cǐ bù pí", definition: "因酷爱做某事而不感觉厌烦。形容对某事特别爱好而沉浸其中。", example: "他酷爱集邮，乐此不疲。", synonyms: ["乐在其中", "津津有味"], antonyms: ["兴味索然", "枯燥无味"] },
  { word: "津津有味", pinyin: "jīn jīn yǒu wèi", definition: "形容吃得很有味道或说话很有兴趣。", example: "孩子们津津有味地听着老师讲故事。", synonyms: ["兴致勃勃", "全神贯注"], antonyms: ["索然无味", "枯燥无味"] },
  { word: "兴致勃勃", pinyin: "xìng zhì bó bó", definition: "兴致：兴趣；勃勃：旺盛的样子。形容兴趣浓厚。", example: "同学们兴致勃勃地参观博物馆。", synonyms: ["津津有味", "兴高采烈"], antonyms: ["兴味索然", "无精打采"] },
  { word: "兴味索然", pinyin: "xìng wèi suǒ rán", definition: "兴味：兴趣；索然：没有意味的样子。形容兴趣全无，没有一点兴趣。", example: "这个电影太无聊了，大家看得兴味索然。", synonyms: ["索然无味", "枯燥无味"], antonyms: ["兴致勃勃", "津津有味"] },
  { word: "索然无味", pinyin: "suǒ rán wú wèi", definition: "索然：没有意味、没有情趣的样子。形容事物枯燥无味（多指文章）。", example: "这篇文章写得索然无味，没有吸引力。", synonyms: ["枯燥无味", "味同嚼蜡"], antonyms: ["津津有味", "兴趣盎然"] },
  { word: "枯燥无味", pinyin: "kū zào wú wèi", definition: "枯燥：单调。形容非常单调，没有趣味。", example: "没有娱乐活动，农村生活显得枯燥无味。", synonyms: ["索然无味", "味同嚼蜡"], antonyms: ["津津有味", "妙趣横生"] },
  { word: "妙趣横生", pinyin: "miào qù héng shēng", definition: "横生：层现迭出。形容语言、文章等洋溢着美妙的意趣。", example: "这本书写得妙趣横生，让人爱不释手。", synonyms: ["风趣横生", "饶有风趣"], antonyms: ["索然无味", "枯燥无味"] },
  { word: "饶有风趣", pinyin: "ráo yǒu fēng qù", definition: "很有风趣。形容很有趣。", example: "他说话饶有风趣，大家都很喜欢听。", synonyms: ["风趣横生", "妙趣横生"], antonyms: ["索然无味"] },
  { word: "意味深长", pinyin: "yì wèi shēn cháng", definition: "含意深远，耐人寻味。", example: "老师的话意味深长，值得我们深思。", synonyms: ["耐人寻味", "发人深省"], antonyms: ["平淡无奇", "索然无味"] },
  { word: "耐人寻味", pinyin: "nài rén xún wèi", definition: "意味深长，值得人仔细体会琢磨。", example: "这篇文章耐人寻味，值得一读再读。", synonyms: ["意味深长", "回味无穷"], antonyms: ["索然无味", "平淡无奇"] },
  { word: "回味无穷", pinyin: "huí wèi wú qióng", definition: "比喻事后越想越觉得有意思。", example: "这场演出精彩绝伦，让人回味无穷。", synonyms: ["耐人寻味", "余味无穷"], antonyms: ["索然无味"] },
  { word: "受益匪浅", pinyin: "shòu yì fěi qiǎn", definition: "匪：通非，得到的好处很多。", example: "听了这堂课，我受益匪浅。", synonyms: ["获益良多", "受益良多"], antonyms: ["一无所获", "毫无收获"] },
  { word: "获益良多", pinyin: "huò yì liáng duō", definition: "获得了很大的好处、收获。", example: "参加这次培训，我获益良多。", synonyms: ["受益匪浅", "受益良多"], antonyms: ["一无所获"] },
  { word: "茅塞顿开", pinyin: "máo sè dùn kāi", definition: "茅塞：喻人思路闭塞或不懂事；顿：立刻。忽然弄通了思路或窍门。", example: "听了老师的讲解，我茅塞顿开，终于明白了。", synonyms: ["豁然开朗", "恍然大悟"], antonyms: ["百思不解", "大惑不解"] },
  { word: "豁然开朗", pinyin: "huò rán kāi lǎng", definition: "豁然：开阔敞亮的样子。从黑暗狭窄变得宽敞明亮。比喻突然领悟了一个道理。", example: "经过他的点拨，我豁然开朗。", synonyms: ["茅塞顿开", "恍然大悟"], antonyms: ["百思不解", "大惑不解"] },
  { word: "恍然大悟", pinyin: "huǎng rán dà wù", definition: "恍然：猛然清醒的样子；悟：心里明白。形容一下子明白过来。", example: "听了这话，他恍然大悟。", synonyms: ["豁然开朗", "茅塞顿开"], antonyms: ["百思不解", "如堕烟海"] },
  { word: "深有感触", pinyin: "shēn yǒu gǎn chù", definition: "形容感触很深，受到很大触动。", example: "看完这部电影，我深有感触。", synonyms: ["感触良多", "感慨万千"], antonyms: ["无动于衷"] }
]

// 嵌入成语数据（精选 100 条常用成语）
const IDIOMS_DATA = [
  { idiom: "画蛇添足", pinyin: "huà shé tiān zú", definition: "比喻做了多余的事反不好。", example: "这样做是画蛇添足，没有必要。", source: "《战国策·齐策二》" },
  { idiom: "守株待兔", pinyin: "shǒu zhū dài tù", definition: "比喻死守狭隘经验，不知变通。", example: "学习方法要灵活，不能守株待兔。", source: "《韩非子·五蠹》" },
  { idiom: "掩耳盗铃", pinyin: "yǎn ěr dào líng", definition: "比喻自己欺骗自己。", example: "自欺欺人就是掩耳盗铃。", source: "《吕氏春秋·自知》" },
  { idiom: "亡羊补牢", pinyin: "wáng yáng bǔ láo", definition: "比喻出了问题及时补救。", example: "亡羊补牢，为时未晚。", source: "《战国策·楚策》" },
  { idiom: "刻舟求剑", pinyin: "kè zhōu qiú jiàn", definition: "比喻拘泥成法，不知道变通。", example: "情况变了，不能刻舟求剑。", source: "《吕氏春秋·察今》" },
  { idiom: "南辕北辙", pinyin: "nán yuán běi zhé", definition: "比喻行动和目的正好相反。", example: "这样做南辕北辙，达不到目的。", source: "《战国策·魏策》" },
  { idiom: "一鸣惊人", pinyin: "yī míng jīng rén", definition: "比喻平时没有特殊表现，一做起来就有惊人的成绩。", example: "他一鸣惊人，获得了冠军。", source: "《史记·滑稽列传》" },
  { idiom: "三顾茅庐", pinyin: "sān gù máo lú", definition: "比喻诚心诚意地邀请人家。", example: "他三顾茅庐，请来了专家。", source: "《三国志·蜀书·诸葛亮传》" },
  { idiom: "负荆请罪", pinyin: "fù jīng qǐng zuì", definition: "表示向人认错赔罪。", example: "他负荆请罪，得到了原谅。", source: "《史记·廉颇蔺相如列传》" },
  { idiom: "完璧归赵", pinyin: "wán bì guī zhào", definition: "比喻把物品完好地归还给物品的主人。", example: "借东西要完璧归赵。", source: "《史记·廉颇蔺相如列传》" },
  { idiom: "卧薪尝胆", pinyin: "wò xīn cháng dǎn", definition: "形容人刻苦自励，发愤图强。", example: "他卧薪尝胆，终于成功了。", source: "《史记·越王勾践世家》" },
  { idiom: "破釜沉舟", pinyin: "pò fǔ chén zhōu", definition: "比喻下决心不顾一切地干到底。", example: "破釜沉舟，勇往直前。", source: "《史记·项羽本纪》" },
  { idiom: "背水一战", pinyin: "bèi shuǐ yī zhàn", definition: "比喻决一死战，求得一胜。", example: "情况危急，只能背水一战。", source: "《史记·淮阴侯列传》" },
  { idiom: "纸上谈兵", pinyin: "zhǐ shàng tán bīng", definition: "比喻空谈理论，不能解决实际问题。", example: "要实干，不要纸上谈兵。", source: "《史记·廉颇蔺相如列传》" },
  { idiom: "指鹿为马", pinyin: "zhǐ lù wéi mǎ", definition: "比喻故意颠倒黑白，混淆是非。", example: "不能指鹿为马，颠倒黑白。", source: "《史记·秦始皇本纪》" },
  { idiom: "草木皆兵", pinyin: "cǎo mù jiē bīng", definition: "形容人在惊慌时疑神疑鬼。", example: "他吓坏了，草木皆兵。", source: "《晋书·苻坚载记》" },
  { idiom: "望梅止渴", pinyin: "wàng méi zhǐ kě", definition: "比喻用空想来安慰自己。", example: "空谈理想是望梅止渴。", source: "《世说新语·假谲》" },
  { idiom: "画饼充饥", pinyin: "huà bǐng chōng jī", definition: "比喻虚有其名而无实惠。", example: "空谈理想是画饼充饥。", source: "《三国志·魏书·卢毓传》" },
  { idiom: "锦上添花", pinyin: "jǐn shàng tiān huā", definition: "比喻好上加好，美上加美。", example: "这个方案是锦上添花。", source: "《宋书》" },
  { idiom: "雪中送炭", pinyin: "xuě zhōng sòng tàn", definition: "比喻在急需时给以物质上或精神上的帮助。", example: "感谢你雪中送炭。", source: "《范成大》" },
  { idiom: "因人而异", pinyin: "yīn rén ér yì", definition: "根据人的不同而有所不同。", example: "教学方法要因人而异。", source: "《论语》" },
  { idiom: "因地制宜", pinyin: "yīn dì zhì yí", definition: "根据各地的具体情况，制定适宜的办法。", example: "种植农作物要因地制宜。", source: "《吴越春秋》" },
  { idiom: "对症下药", pinyin: "duì zhèng xià yào", definition: "比喻针对具体情况决定解决问题的办法。", example: "解决问题要对症下药。", source: "《朱子语类》" },
  { idiom: "有的放矢", pinyin: "yǒu dì fàng shǐ", definition: "比喻说话做事有针对性。", example: "发言要有的放矢。", source: "《庄子》" },
  { idiom: "实事求是", pinyin: "shí shì qiú shì", definition: "指从实际对象出发，探求事物的内部联系。", example: "做学问要实事求是。", source: "《汉书·河间献王传》" },
  { idiom: "任劳任怨", pinyin: "rèn láo rèn yuàn", definition: "做事不辞劳苦，不怕别人埋怨。", example: "他任劳任怨，从不抱怨。", source: "《尚书·大禹谟》" },
  { idiom: "兢兢业业", pinyin: "jīng jīng yè yè", definition: "形容做事小心谨慎，认真踏实。", example: "老师兢兢业业地工作。", source: "《诗经·大雅》" },
  { idiom: "一丝不苟", pinyin: "yī sī bù gǒu", definition: "形容办事认真，连最细微的地方也不马虎。", example: "他工作一丝不苟。", source: "《儒林外史》" },
  { idiom: "精益求精", pinyin: "jīng yì qiú jīng", definition: "已经很好了，还要求更好。", example: "他对工作精益求精。", source: "《论语》" },
  { idiom: "孜孜不倦", pinyin: "zī zī bù juàn", definition: "指工作或学习勤奋不知疲倦。", example: "老师孜孜不倦地教导我们。", source: "《尚书》" },
  { idiom: "持之以恒", pinyin: "chí zhī yǐ héng", definition: "长久坚持下去。", example: "学习要持之以恒。", source: "《东坡文集》" },
  { idiom: "坚持不懈", pinyin: "jiān chí bù xiè", definition: "坚持到底，一点不松懈。", example: "他坚持不懈，终于成功了。", source: "《魏书》" },
  { idiom: "锲而不舍", pinyin: "qiè ér bù shě", definition: "比喻有恒心，有毅力，坚持不懈。", example: "学习需要锲而不舍的精神。", source: "《荀子·劝学》" },
  { idiom: "百折不挠", pinyin: "bǎi zhé bù náo", definition: "比喻意志坚强，无论受到多少次挫折，毫不动摇退缩。", example: "他百折不挠，终于成功。", source: "《汉语言文字词典》" },
  { idiom: "知难而进", pinyin: "zhī nán ér jìn", definition: "明知有困难，却勇往直前。", example: "我们要知难而进。", source: "《左传》" },
  { idiom: "迎难而上", pinyin: "yíng nán ér shàng", definition: "面对困难，勇往直前。", example: "我们要迎难而上。", source: "《人民日报》" },
  { idiom: "一往无前", pinyin: "yī wǎng wú qián", definition: "一直往前，无所阻挡。", example: "他一往无前，冲向终点。", source: "《程廷祚》" },
  { idiom: "勇往直前", pinyin: "yǒng wǎng zhí qián", definition: "勇敢地一直向前进。", example: "战士们勇往直前。", source: "《欧阳予倩》" },
  { idiom: "义无反顾", pinyin: "yì wú fǎn gù", definition: "为正义勇往直前，不回首后退。", example: "他义无反顾地去了前线。", source: "《蜀演义》" },
  { idiom: "破釜沉舟", pinyin: "pò fǔ chén zhōu", definition: "比喻下决心不顾一切地干到底。", example: "破釜沉舟，勇往直前。", source: "《史记·项羽本纪》" },
  { idiom: "前功尽弃", pinyin: "qián gōng jìn qì", definition: "以前的功劳全部丢失。", example: "如果现在放弃，就前功尽弃了。", source: "《战国策·西周策》" },
  { idiom: "功亏一篑", pinyin: "gōng kuī yī kuì", definition: "做事只差最后一点没能完成。", example: "就差最后一步了，不能功亏一篑。", source: "《尚书·旅獒》" },
  { idiom: "半途而废", pinyin: "bàn tú ér fèi", definition: "指做事不能坚持到底，中途停顿。", example: "学习不能半途而废。", source: "《礼记·中庸》" },
  { idiom: "有始有终", pinyin: "yǒu shǐ yǒu zhōng", definition: "形容做事能贯彻到底，不半途而废。", example: "做事要有始有终。", source: "《论语》" },
  { idiom: "善始善终", pinyin: "shàn shǐ shàn zhōng", definition: "事情从头到尾都做得很好。", example: "工作要善始善终。", source: "《战国策》" },
  { idiom: "持之以恒", pinyin: "chí zhī yǐ héng", definition: "长久坚持下去。", example: "学习要持之以恒。", source: "《东坡文集》" },
  { idiom: "日积月累", pinyin: "rì jī yuè lěi", definition: "一天天一月月不断积累。", example: "知识要日积月累。", source: "《宋史》" },
  { idiom: "积少成多", pinyin: "jī shǎo chéng duō", definition: "积累少量的东西，能成为巨大的数量。", example: "学习要积少成多。", source: "《汉书·董仲舒传》" },
  { idiom: "集腋成裘", pinyin: "jí yè chéng qiú", definition: "比喻积少成多。", example: "知识要一点一滴积累，集腋成裘。", source: "《慎子·内篇》" },
  { idiom: "聚沙成塔", pinyin: "jù shā chéng tǎ", definition: "聚细沙成宝塔。比喻积少成多。", example: "学习要聚沙成塔。", source: "《妙法莲华经》" },
  { idiom: "水滴石穿", pinyin: "shuǐ dī shí chuān", definition: "比喻只要有恒心，不断努力，事情就一定能成功。", example: "只要有水滴石穿的精神，就能成功。", source: "《汉书·枚乘传》" },
  { idiom: "愚公移山", pinyin: "yú gōng yí shān", definition: "比喻坚持不懈地改造自然和坚定不移地进行斗争。", example: "我们要有愚公移山的精神。", source: "《列子·汤问》" },
  { idiom: "精卫填海", pinyin: "jīng wèi tián hǎi", definition: "比喻意志坚决，不畏艰难。", example: "他有着精卫填海般的毅力。", source: "《山海经·北山经》" },
  { idiom: "夸父逐日", pinyin: "kuā fù zhú rì", definition: "比喻人有大志，也比喻不自量力。", example: "他有着夸父逐日般的理想。", source: "《山海经·海外北经》" },
  { idiom: "愚公移山", pinyin: "yú gōng yí shān", definition: "比喻坚持不懈地改造自然和坚定不移地进行斗争。", example: "我们要有愚公移山的精神。", source: "《列子·汤问》" },
  { idiom: "画龙点睛", pinyin: "huà lóng diǎn jīng", definition: "比喻在关键处加上一笔，使内容更生动传神。", example: "这句话是画龙点睛。", source: "《历代名画记》" },
  { idiom: "锦上添花", pinyin: "jǐn shàng tiān huā", definition: "比喻好上加好，美上加美。", example: "这个方案是锦上添花。", source: "《宋书》" },
  { idiom: "雪中送炭", pinyin: "xuě zhōng sòng tàn", definition: "比喻在急需时给以物质上或精神上的帮助。", example: "感谢你雪中送炭。", source: "《范成大》" },
  { idiom: "春风化雨", pinyin: "chūn fēng huà yǔ", definition: "比喻良好的熏陶和教育。", example: "老师的教育如春风化雨。", source: "《说苑》" },
  { idiom: "循循善诱", pinyin: "xún xún shàn yòu", definition: "指善于循序渐进地引导、教育。", example: "老师循循善诱。", source: "《论语》" },
  { idiom: "诲人不倦", pinyin: "huì rén bù juàn", definition: "教导人特别耐心，从不厌倦。", example: "老师诲人不倦。", source: "《论语》" },
  { idiom: "桃李满天下", pinyin: "táo lǐ mǎn tiān xià", definition: "比喻学生很多，各地都有。", example: "王老师桃李满天下。", source: "《韩诗外传》" },
  { idiom: "尊师重道", pinyin: "zūn shī zhòng dào", definition: "尊敬师长，重视老师的教导。", example: "我们要尊师重道。", source: "《礼记》" },
  { idiom: "程门立雪", pinyin: "chéng mén lì xuě", definition: "形容尊师重道，虔诚求教。", example: "他程门立雪，求学心切。", source: "《宋史·杨时传》" },
  { idiom: "百尺竿头", pinyin: "bǎi chǐ gān tóu", definition: "比喻学问、成绩等达到很高程度后继续努力。", example: "百尺竿头，更进一步。", source: "《景德传灯录》" },
  { idiom: "更上一层楼", pinyin: "gèng shàng yī céng lóu", definition: "比喻达到一定高度后继续提高。", example: "学习要更上一层楼。", source: "《王之涣·登鹳雀楼》" },
  { idiom: "登峰造极", pinyin: "dēng fēng zào jí", definition: "比喻学问、技能等达到最高境界。", example: "他的书法登峰造极。", source: "《世说新语》" },
  { idiom: "炉火纯青", pinyin: "lú huǒ chún qīng", definition: "比喻功夫达到纯熟完美的境界。", example: "他的技艺炉火纯青。", source: "《四谈录》" },
  { idiom: "出神入化", pinyin: "chū shén rù huà", definition: "形容技艺达到极高的境界。", example: "他的表演出神入化。", source: "《寓言》" },
  { idiom: "巧夺天工", pinyin: "qiǎo duó tiān gōng", definition: "形容技艺极其精巧。", example: "这件工艺品巧夺天工。", source: "《元遗山集》" },
  { idiom: "独具匠心", pinyin: "dú jù jiàng xīn", definition: "形容在艺术构思等方面有独特的创造性。", example: "这篇作文独具匠心。", source: "《唐诗纪事》" },
  { idiom: "别出心裁", pinyin: "bié chū xīn cái", definition: "指想出的办法与众不同。", example: "这个方案别出心裁。", source: "《李渔》" },
  { idiom: "标新立异", pinyin: "biāo xīn lì yì", definition: "提出新的见解，表示与一般不同。", example: "他的观点标新立异。", source: "《南史》" },
  { idiom: "独树一帜", pinyin: "dú shù yī zhì", definition: "比喻创造出独特的风格或主张。", example: "他的作品独树一帜。", source: "《龚自珍》" },
  { idiom: "不落俗套", pinyin: "bù luò sú tào", definition: "形容新颖、独特，不落俗套。", example: "这个设计不落俗套。", source: "《茅盾》" },
  { idiom: "别开生面", pinyin: "bié kāi shēng miàn", definition: "开创了新的局面。", example: "这个改革别开生面。", source: "《红楼梦》" },
  { idiom: "耳目一新", pinyin: "ěr mù yī xīn", definition: "形容看到了新的、美好的东西。", example: "这里的变化让人耳目一新。", source: "《鲁迅》" },
  { idiom: "焕然一新", pinyin: "huàn rán yī xīn", definition: "形容出现了崭新的面貌。", example: "装修后教室焕然一新。", source: "《文学报》" },
  { idiom: "气象万千", pinyin: "qì xiàng wàn qiān", definition: "形容景象或事物壮丽而多变化。", example: "日出时气象万千。", source: "《范仲淹·岳阳楼记》" },
  { idiom: "波澜壮阔", pinyin: "bō lán zhuàng kuò", definition: "比喻声势雄壮或规模宏大。", example: "改革的浪潮波澜壮阔。", source: "《杨沫》" },
  { idiom: "气势磅礴", pinyin: "qì shì páng bó", definition: "形容气势雄伟浩大。", example: "瀑布气势磅礴。", source: "《马识途》" },
  { idiom: "蔚为壮观", pinyin: "wèi wéi zhuàng guān", definition: "形容景象盛大，气势雄伟。", example: "展览蔚为壮观。", source: "《秦牧》" },
  { idiom: "宏伟壮观", pinyin: "hóng wěi zhuàng guān", definition: "形容景象宏大，气势雄伟。", example: "建筑宏伟壮观。", source: "《人民日报》" },
  { idiom: "金碧辉煌", pinyin: "jīn bì huī huáng", definition: "形容建筑物装饰华丽。", example: "宫殿金碧辉煌。", source: "《巴金》" },
  { idiom: "富丽堂皇", pinyin: "fù lì táng huáng", definition: "形容房屋宏伟豪华。", example: "大厅富丽堂皇。", source: "《茅盾》" },
  { idiom: "美轮美奂", pinyin: "měi lún měi huàn", definition: "形容房屋高大华丽。", example: "这座大厦美轮美奂。", source: "《礼记》" },
  { idiom: "雕梁画栋", pinyin: "diāo liáng huà dòng", definition: "形容建筑物装饰华丽。", example: "宫殿雕梁画栋。", source: "《水浒传》" },
  { idiom: "飞檐流丹", pinyin: "fēi yán liú dān", definition: "形容建筑宏伟美丽。", example: "古寺飞檐流丹。", source: "《阿房宫赋》" },
  { idiom: "古色古香", pinyin: "gǔ sè gǔ xiāng", definition: "形容富有古雅的色彩和情调。", example: "家具古色古香。", source: "《鲁迅》" },
  { idiom: "别具一格", pinyin: "bié jù yī gé", definition: "风格独特。", example: "他的作品别具一格。", source: "《清史稿》" },
  { idiom: "自成一派", pinyin: "zì chéng yī pài", definition: "形成了自己的风格。", example: "他的画风自成一派。", source: "《艺术概论》" },
  { idiom: "独树一帜", pinyin: "dú shù yī zhì", definition: "比喻创造出独特的风格。", example: "他的作品独树一帜。", source: "《龚自珍》" },
  { idiom: "不拘一格", pinyin: "bù jū yī gé", definition: "不局限于一种规格或方式。", example: "用人要不拘一格。", source: "《龚自珍·己亥杂诗》" },
  { idiom: "千篇一律", pinyin: "qiān piān yī lǜ", definition: "文章公式化，也比喻办事按一个格式，非常机械。", example: "作文不能千篇一律。", source: "《红楼梦》" },
  { idiom: "如法炮制", pinyin: "rú fǎ páo zhì", definition: "比喻照着现成的样子做。", example: "如法炮制，依样画葫芦。", source: "《水浒传》" },
  { idiom: "依样画葫芦", pinyin: "yī yàng huà hú lu", definition: "比喻单纯模仿，缺乏创造。", example: "不能依样画葫芦。", source: "《宋史》" },
  { idiom: "东施效颦", pinyin: "dōng shī xiào pín", definition: "比喻盲目模仿，效果很坏。", example: "不要东施效颦。", source: "《庄子》" },
  { idiom: "邯郸学步", pinyin: "hán dān xué bù", definition: "比喻模仿人不到家，反把原本自己会的东西忘了。", example: "学习要创新，不能邯郸学步。", source: "《庄子》" },
  { idiom: "生搬硬套", pinyin: "shēng bān yìng tào", definition: "形容不顾实际，盲目模仿。", example: "不能生搬硬套。", source: "《红旗》" }
]

// =============================================
// 嵌入模拟卷题目数据
// =============================================

// 从 mock-exam-questions-full.js 引入题目数据（如果文件存在）
let MOCK_EXAM_QUESTIONS = []
try {
  MOCK_EXAM_QUESTIONS = require('./mock-exam-questions-full.js').MOCK_EXAM_QUESTIONS || []
} catch (e) {
  console.log('mock-exam-questions-full.js 不存在或加载失败，将使用空数组')
}

// =============================================
// 配置常量
// =============================================

// 每次处理的数量（避免单次超时）
const BATCH_SIZE = 20

// 最大执行时间限制（毫秒，云函数最大60秒，留出余量）
const MAX_EXECUTION_TIME = 50000

// =============================================
// 辅助函数
// =============================================

/**
 * 获取数据源总数量
 */
function getTotalCount(type) {
  if (type === 'vocabulary') return VOCABULARY_DATA.length
  if (type === 'idioms') return IDIOMS_DATA.length
  if (type === 'mockExam') return MOCK_EXAM_QUESTIONS.length
  return 0
}

/**
 * 获取数据源分片
 */
function getDataSlice(type, start, count) {
  if (type === 'vocabulary') return VOCABULARY_DATA.slice(start, start + count)
  if (type === 'idioms') return IDIOMS_DATA.slice(start, start + count)
  if (type === 'mockExam') return MOCK_EXAM_QUESTIONS.slice(start, start + count)
  return []
}

/**
 * 获取集合名称
 */
function getCollectionName(type) {
  if (type === 'vocabulary') return 'vocabulary'
  if (type === 'idioms') return 'idioms'
  if (type === 'mockExam') return 'questions_bank'
  return ''
}

// =============================================
// 核心导入函数
// =============================================

/**
 * 分批导入数据
 * @param {string} type - 数据类型 'vocabulary' | 'idioms'
 * @param {number} startIndex - 开始索引（断点续传）
 * @param {number} batchSize - 每批处理数量
 * @returns {Promise<Object>} 导入结果
 */
async function importBatch(type, startIndex = 0, batchSize = BATCH_SIZE) {
  const startTime = Date.now()
  const collectionName = getCollectionName(type)
  const totalCount = getTotalCount(type)

  console.log(`=== 开始导入 ${type} ===`)
  console.log(`集合: ${collectionName}`)
  console.log(`总数: ${totalCount}`)
  console.log(`起始索引: ${startIndex}`)
  console.log(`每批数量: ${batchSize}`)

  try {
    // 如果已到末尾，返回完成状态
    if (startIndex >= totalCount) {
      return {
        success: true,
        completed: true,
        message: `${type} 数据已全部导入完成`,
        type,
        totalCount,
        processedCount: totalCount,
        successCount: totalCount,
        failedCount: 0,
        nextIndex: null,
        progress: 100
      }
    }

    // 获取当前批次数据
    const data = getDataSlice(type, startIndex, batchSize)
    const actualCount = data.length
    const endIndex = startIndex + actualCount

    console.log(`本次处理: ${startIndex} - ${endIndex}，共 ${actualCount} 条`)

    let successCount = 0
    let failedCount = 0
    const errors = []

    // 逐条插入（确保单条失败不影响整体）
    for (let i = 0; i < data.length; i++) {
      const item = data[i]

      try {
        if (type === 'vocabulary') {
          await db.collection('vocabulary').add({
            data: {
              word: item.word,
              pinyin: item.pinyin,
              definition: item.definition,
              example: item.example,
              synonyms: item.synonyms || [],
              antonyms: item.antonyms || [],
              createTime: db.serverDate()
            }
          })
        } else if (type === 'idioms') {
          await db.collection('idioms').add({
            data: {
              name: item.idiom,
              pinyin: item.pinyin,
              meaning: item.definition,
              example: item.example,
              source: item.source || '',
              createTime: db.serverDate()
            }
          })
        } else if (type === 'mockExam') {
          await db.collection('questions_bank').add({
            data: {
              id: item.id,
              type: item.type,
              question: item.question,
              options: item.options,
              correctAnswer: item.correctAnswer,
              explanation: item.explanation || '',
              difficulty: 'medium',
              source: '模拟卷',
              createTime: db.serverDate()
            }
          })
        }
        successCount++
      } catch (err) {
        failedCount++
        errors.push({
          index: startIndex + i,
          error: err.message || err.errMsg
        })
        console.error(`插入失败 [${startIndex + i}]:`, err.message)
      }

      // 检查执行时间，避免超时
      const elapsed = Date.now() - startTime
      if (elapsed > MAX_EXECUTION_TIME) {
        console.log(`接近执行时间限制，提前返回`)
        break
      }
    }

    const processedCount = startIndex + successCount + failedCount
    const progress = Math.round((processedCount / totalCount) * 100)
    const completed = processedCount >= totalCount

    return {
      success: true,
      completed,
      message: completed
        ? `${type} 数据导入完成！成功 ${successCount} 条，失败 ${failedCount} 条`
        : `${type} 数据导入中...进度 ${progress}%`,
      type,
      totalCount,
      processedCount,
      successCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined,
      nextIndex: completed ? null : processedCount,
      progress
    }
  } catch (err) {
    console.error(`导入 ${type} 失败:`, err)
    return {
      success: false,
      completed: false,
      message: `${type} 数据导入失败: ${err.message || err.errMsg}`,
      error: err.message || err.errMsg,
      type,
      totalCount,
      processedCount: startIndex,
      nextIndex: startIndex,
      progress: Math.round((startIndex / totalCount) * 100)
    }
  }
}

// =============================================
// 其他辅助函数
// =============================================

/**
 * 清空集合
 */
async function clearCollection(collectionName) {
  try {
    const { data } = await db.collection(collectionName).limit(1000).get()

    if (data.length === 0) {
      return {
        success: true,
        message: `${collectionName} 集合为空，无需清空`,
        deleted: 0
      }
    }

    const deletePromises = data.map(item =>
      db.collection(collectionName).doc(item._id).remove()
    )
    await Promise.all(deletePromises)

    return {
      success: true,
      message: `已清空 ${collectionName} 集合`,
      deleted: data.length
    }
  } catch (err) {
    return {
      success: false,
      message: `清空集合失败: ${err.message || err.errMsg}`,
      error: err.message || err.errMsg
    }
  }
}

/**
 * 检查状态
 */
async function checkStatus() {
  try {
    const vocabularyCount = await db.collection('vocabulary').count()
    const idiomsCount = await db.collection('idioms').count()
    const questionsCount = await db.collection('questions_bank').where({ source: '模拟卷' }).count()

    return {
      success: true,
      status: {
        vocabulary: vocabularyCount.total,
        vocabularyTotal: VOCABULARY_DATA.length,
        idioms: idiomsCount.total,
        idiomsTotal: IDIOMS_DATA.length,
        mockExam: questionsCount.total,
        mockExamTotal: MOCK_EXAM_QUESTIONS.length
      },
      message: '数据状态检查完成'
    }
  } catch (err) {
    return {
      success: false,
      message: `状态检查失败: ${err.message || err.errMsg}`,
      error: err.message || err.errMsg
    }
  }
}

// =============================================
// 云函数入口
// =============================================

exports.main = async (event, context) => {
  const { action, type, startIndex, batchSize, collection } = event

  console.log('=== import-data 云函数被调用 ===')
  console.log('Action:', action)
  console.log('Type:', type)
  console.log('StartIndex:', startIndex)
  console.log('BatchSize:', batchSize)

  // action 参数白名单校验
  const VALID_ACTIONS = ['importBatch', 'clearCollection', 'checkStatus', 'getTotal']
  if (!action || !VALID_ACTIONS.includes(action)) {
    return {
      success: false,
      message: `无效的 action 参数。可用操作: ${VALID_ACTIONS.join(', ')}`,
      code: 'INVALID_ACTION'
    }
  }

  // type 参数校验
  const VALID_TYPES = ['vocabulary', 'idioms', 'mockExam']
  if (type && !VALID_TYPES.includes(type)) {
    return {
      success: false,
      message: `无效的 type 参数。可用类型: ${VALID_TYPES.join(', ')}`,
      code: 'INVALID_TYPE'
    }
  }

  switch (action) {
    case 'importBatch':
      if (!type) {
        return {
          success: false,
          message: '请指定 type 参数 (vocabulary 或 idioms)',
          code: 'MISSING_TYPE'
        }
      }
      return await importBatch(type, startIndex || 0, batchSize || BATCH_SIZE)

    case 'clearCollection':
      if (!collection) {
        return {
          success: false,
          message: '请指定要清空的集合名称 (collection)',
          code: 'MISSING_COLLECTION'
        }
      }
      return await clearCollection(collection)

    case 'checkStatus':
      return await checkStatus()

    case 'getTotal':
      return {
        success: true,
        data: {
          vocabulary: VOCABULARY_DATA.length,
          idioms: IDIOMS_DATA.length,
          mockExam: MOCK_EXAM_QUESTIONS.length
        }
      }

    default:
      return {
        success: false,
        message: '未知操作',
        code: 'UNKNOWN_ACTION'
      }
  }
}
