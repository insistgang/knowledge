/**
 * 常量定义
 */

// 题目类型
export const QUESTION_TYPES = {
  SINGLE_CHOICE: 'single_choice',      // 单选题
  MULTIPLE_CHOICE: 'multiple_choice',  // 多选题
  BLANK_FILLING: 'blank_filling',      // 填空题
  JUDGE: 'judge',                      // 判断题
  ESSAY: 'essay'                       // 简答题
}

// 题目类型名称映射
export const QUESTION_TYPE_NAMES = {
  [QUESTION_TYPES.SINGLE_CHOICE]: '单选题',
  [QUESTION_TYPES.MULTIPLE_CHOICE]: '多选题',
  [QUESTION_TYPES.BLANK_FILLING]: '填空题',
  [QUESTION_TYPES.JUDGE]: '判断题',
  [QUESTION_TYPES.ESSAY]: '简答题'
}

// 学习记录类型
export const STUDY_TYPES = {
  VOCABULARY: 'vocabulary',     // 词汇学习
  LITERATURE: 'literature',     // 古诗词
  IDIOM: 'idiom',               // 成语熟语
  PINYIN: 'pinyin',             // 拼音学习
  CORRECTION: 'correction',     // 病句修改
  EXERCISE: 'exercise',         // 练习题
  MOCK_EXAM: 'mock_exam'        // 模拟考试
}

// 难度等级
export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
}

// 难度名称映射
export const DIFFICULTY_NAMES = {
  [DIFFICULTY_LEVELS.EASY]: '简单',
  [DIFFICULTY_LEVELS.MEDIUM]: '中等',
  [DIFFICULTY_LEVELS.HARD]: '困难'
}

// 存储键名
export const STORAGE_KEYS = {
  TOKEN: 'authToken',
  USER_INFO: 'userInfo',
  OPENID: 'openid',
  CHAT_HISTORY: 'chatHistory',
  STUDY_CACHE: 'studyCache',
  FAVORITES: 'favorites'
}

// 云函数名称
export const CLOUD_FUNCTIONS = {
  LOGIN: 'login',
  USER: 'user',
  QUESTION: 'question',
  STUDY: 'study',
  CHAT: 'chat',
  VOCABULARY: 'vocabulary'
}

// API 响应状态
export const RESPONSE_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  UNAUTHORIZED: 'unauthorized',
  NOT_FOUND: 'not_found'
}

// 学习统计时间范围
export const TIME_RANGES = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  CUSTOM: 'custom'
}

// 优先级
export const PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
}

// 成就类型
export const ACHIEVEMENT_TYPES = {
  FIRST_LOGIN: 'first_login',           // 首次登录
  STUDY_STREAK_7: 'study_streak_7',     // 连续学习7天
  STUDY_STREAK_30: 'study_streak_30',   // 连续学习30天
  VOCABULARY_100: 'vocabulary_100',     // 词汇学习100个
  POEM_50: 'poem_50',                   // 背诵50首诗词
  EXERCISE_100: 'exercise_100',         // 完成100道题
  PERFECT_SCORE: 'perfect_score'        // 满分
}

// 默认分页参数
export const DEFAULT_PAGE = {
  page: 1,
  pageSize: 20
}

// 初始配置
export const APP_CONFIG = {
  // 每日推荐数量
  dailyRecommendCount: 10,
  // 练习默认题数
  defaultExerciseCount: 20,
  // 模拟考试时长（分钟）
  examDuration: 120
}
