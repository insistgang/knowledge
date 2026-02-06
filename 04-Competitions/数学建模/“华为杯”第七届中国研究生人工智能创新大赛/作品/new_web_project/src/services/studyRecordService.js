// 学习记录服务 - 提供学习记录管理、统计等功能

class StudyRecordService {
  constructor() {
    // 服务配置
    this.config = {
      apiProvider: 'local', // 'local' 或 'remote'
      timeout: 5000,
      cacheEnabled: true,
      cacheTTL: 3600000, // 1小时
    };
    
    // 初始化缓存
    this.cache = new Map();
  }
  
  // 初始化服务
  init() {
    console.log('StudyRecordService initialized');
    // 可以在这里添加服务初始化逻辑
  }
  
  // 获取学习记录列表
  async getStudyRecords(filters = {}) {
    try {
      // 构建缓存键
      const cacheKey = `records_${JSON.stringify(filters)}`;
      
      // 检查缓存
      if (this.config.cacheEnabled) {
        const cachedResult = this.getFromCache(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 模拟获取学习记录
      const mockRecords = this.generateMockStudyRecords();
      
      // 根据筛选条件过滤数据
      let filteredRecords = [...mockRecords];
      
      // 按类型筛选
      if (filters.type && filters.type !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.type === filters.type);
      }
      
      // 按日期范围筛选
      if (filters.startDate && filters.endDate) {
        filteredRecords = filteredRecords.filter(record => {
          const recordDate = new Date(record.studyDate);
          return recordDate >= filters.startDate && recordDate <= filters.endDate;
        });
      }
      
      // 按完成状态筛选
      if (filters.completed !== undefined) {
        filteredRecords = filteredRecords.filter(record => 
          filters.completed ? record.completionRate === 100 : record.completionRate < 100
        );
      }
      
      // 排序
      if (filters.sortBy) {
        filteredRecords.sort((a, b) => {
          if (filters.sortBy === 'studyDate') {
            return new Date(b.studyDate) - new Date(a.studyDate);
          } else if (filters.sortBy === 'duration') {
            return b.duration - a.duration;
          } else if (filters.sortBy === 'score' && a.score !== null && b.score !== null) {
            return b.score - a.score;
          }
          return 0;
        });
      }
      
      // 分页
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const paginatedRecords = filteredRecords.slice(startIndex, startIndex + pageSize);
      
      const result = {
        data: paginatedRecords,
        total: filteredRecords.length,
        page,
        pageSize
      };
      
      // 存入缓存
      if (this.config.cacheEnabled) {
        this.saveToCache(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      console.error('获取学习记录失败:', error);
      throw new Error('获取学习记录失败，请稍后重试');
    }
  }
  
  // 获取学习统计数据
  async getStudyStatistics(filters = {}) {
    try {
      // 构建缓存键
      const cacheKey = `stats_${JSON.stringify(filters)}`;
      
      // 检查缓存
      if (this.config.cacheEnabled) {
        const cachedResult = this.getFromCache(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 模拟统计数据
      const mockStatistics = {
        totalStudyTime: 1800, // 分钟
        totalWordsLearned: 320,
        totalExercisesCompleted: 15,
        averageScore: 85,
        completionRate: 75,
        learningStreak: 3
      };
      
      // 根据筛选条件调整统计数据
      if (filters.startDate && filters.endDate) {
        // 模拟按日期范围调整数据
        const days = Math.ceil((filters.endDate - filters.startDate) / (1000 * 60 * 60 * 24));
        if (days < 30) {
          // 如果日期范围小于30天，按比例减少数据
          const ratio = days / 30;
          mockStatistics.totalStudyTime = Math.floor(mockStatistics.totalStudyTime * ratio);
          mockStatistics.totalWordsLearned = Math.floor(mockStatistics.totalWordsLearned * ratio);
          mockStatistics.totalExercisesCompleted = Math.floor(mockStatistics.totalExercisesCompleted * ratio);
        }
      }
      
      // 存入缓存
      if (this.config.cacheEnabled) {
        this.saveToCache(cacheKey, mockStatistics);
      }
      
      return mockStatistics;
    } catch (error) {
      console.error('获取学习统计失败:', error);
      throw new Error('获取学习统计失败，请稍后重试');
    }
  }
  
  // 获取周学习数据
  async getWeeklyStudyData() {
    try {
      // 构建缓存键
      const cacheKey = 'weekly_data';
      
      // 检查缓存
      if (this.config.cacheEnabled) {
        const cachedResult = this.getFromCache(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // 模拟周学习数据（最近7天）
      const mockWeeklyData = [
        { day: '周一', studyTime: 45, exercises: 2, wordsLearned: 15, completionRate: 80 },
        { day: '周二', studyTime: 60, exercises: 3, wordsLearned: 25, completionRate: 100 },
        { day: '周三', studyTime: 30, exercises: 1, wordsLearned: 10, completionRate: 60 },
        { day: '周四', studyTime: 90, exercises: 4, wordsLearned: 35, completionRate: 90 },
        { day: '周五', studyTime: 0, exercises: 0, wordsLearned: 0, completionRate: 0 },
        { day: '周六', studyTime: 75, exercises: 3, wordsLearned: 30, completionRate: 100 },
        { day: '周日', studyTime: 30, exercises: 1, wordsLearned: 10, completionRate: 70 }
      ];
      
      // 存入缓存
      if (this.config.cacheEnabled) {
        this.saveToCache(cacheKey, mockWeeklyData);
      }
      
      return mockWeeklyData;
    } catch (error) {
      console.error('获取周学习数据失败:', error);
      throw new Error('获取周学习数据失败，请稍后重试');
    }
  }
  
  // 获取月学习数据
  async getMonthlyStudyData(months = 6) {
    try {
      // 构建缓存键
      const cacheKey = `monthly_data_${months}`;
      
      // 检查缓存
      if (this.config.cacheEnabled) {
        const cachedResult = this.getFromCache(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // 模拟月学习数据
      const mockMonthlyData = [
        { month: '1月', studyTime: 320, exercises: 15, wordsLearned: 80, averageScore: 78, completionRate: 75 },
        { month: '2月', studyTime: 450, exercises: 20, wordsLearned: 120, averageScore: 80, completionRate: 80 },
        { month: '3月', studyTime: 380, exercises: 18, wordsLearned: 100, averageScore: 82, completionRate: 85 },
        { month: '4月', studyTime: 520, exercises: 25, wordsLearned: 150, averageScore: 85, completionRate: 90 },
        { month: '5月', studyTime: 480, exercises: 22, wordsLearned: 130, averageScore: 83, completionRate: 85 },
        { month: '6月', studyTime: 350, exercises: 16, wordsLearned: 90, averageScore: 86, completionRate: 90 }
      ];
      
      // 限制返回的月份数量
      const result = mockMonthlyData.slice(-months);
      
      // 存入缓存
      if (this.config.cacheEnabled) {
        this.saveToCache(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      console.error('获取月学习数据失败:', error);
      throw new Error('获取月学习数据失败，请稍后重试');
    }
  }
  
  // 获取分类学习数据
  async getCategoryStudyData() {
    try {
      // 构建缓存键
      const cacheKey = 'category_data';
      
      // 检查缓存
      if (this.config.cacheEnabled) {
        const cachedResult = this.getFromCache(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 模拟分类学习数据
      const mockCategoryData = [
        { category: '词语学习', studyTime: 650, percentage: 35, exercises: 20, wordsLearned: 180 },
        { category: '练习测试', studyTime: 720, percentage: 39, exercises: 25, wordsLearned: 90 },
        { category: '阅读理解', studyTime: 320, percentage: 17, exercises: 15, wordsLearned: 40 },
        { category: '成语学习', studyTime: 180, percentage: 9, exercises: 10, wordsLearned: 10 }
      ];
      
      // 存入缓存
      if (this.config.cacheEnabled) {
        this.saveToCache(cacheKey, mockCategoryData);
      }
      
      return mockCategoryData;
    } catch (error) {
      console.error('获取分类学习数据失败:', error);
      throw new Error('获取分类学习数据失败，请稍后重试');
    }
  }
  
  // 获取连续学习数据
  async getStreakData() {
    try {
      // 构建缓存键
      const cacheKey = 'streak_data';
      
      // 检查缓存
      if (this.config.cacheEnabled) {
        const cachedResult = this.getFromCache(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 模拟连续学习数据
      const mockStreakData = {
        current: 3, // 当前连续学习天数
        max: 15,    // 最大连续学习天数
        longestStreakDate: '2023-03-15', // 最长连续学习开始日期
        streakHistory: this.generateMockStreakHistory() // 最近30天的学习记录
      };
      
      // 存入缓存
      if (this.config.cacheEnabled) {
        this.saveToCache(cacheKey, mockStreakData);
      }
      
      return mockStreakData;
    } catch (error) {
      console.error('获取连续学习数据失败:', error);
      throw new Error('获取连续学习数据失败，请稍后重试');
    }
  }
  
  // 获取学习建议
  async getStudySuggestions() {
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 模拟学习建议数据
      const mockSuggestions = [
        {
          id: 1,
          type: 'praise',
          content: '你的词语学习时间充足，继续保持！',
          priority: 'high'
        },
        {
          id: 2,
          type: 'suggestion',
          content: '阅读理解练习相对较少，建议增加此类练习。',
          priority: 'medium'
        },
        {
          id: 3,
          type: 'encouragement',
          content: '连续学习3天，坚持下去！',
          priority: 'high'
        },
        {
          id: 4,
          type: 'reminder',
          content: '周五没有学习记录，建议保持每日学习习惯。',
          priority: 'low'
        },
        {
          id: 5,
          type: 'recommendation',
          content: '根据你的学习情况，推荐尝试"常见错别字辨析"练习。',
          priority: 'medium'
        }
      ];
      
      return mockSuggestions;
    } catch (error) {
      console.error('获取学习建议失败:', error);
      throw new Error('获取学习建议失败，请稍后重试');
    }
  }
  
  // 保存学习记录
  async saveStudyRecord(record) {
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // 实际项目中这里应该调用后端API保存记录
      // 这里只是模拟成功响应
      const savedRecord = {
        ...record,
        id: Math.floor(Math.random() * 1000000),
        studyDate: new Date().toISOString().split('T')[0],
        createTime: new Date().toISOString()
      };
      
      // 清除相关缓存
      this.clearCacheByPrefix('records_');
      this.clearCacheByPrefix('stats_');
      this.clearCacheByPrefix('weekly_');
      this.clearCacheByPrefix('monthly_');
      this.clearCacheByPrefix('category_');
      this.clearCacheByPrefix('streak_');
      
      return savedRecord;
    } catch (error) {
      console.error('保存学习记录失败:', error);
      throw new Error('保存学习记录失败，请稍后重试');
    }
  }
  
  // 删除学习记录
  async deleteStudyRecord(recordId) {
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 实际项目中这里应该调用后端API删除记录
      // 这里只是模拟成功响应
      
      // 清除相关缓存
      this.clearCacheByPrefix('records_');
      this.clearCacheByPrefix('stats_');
      this.clearCacheByPrefix('weekly_');
      this.clearCacheByPrefix('monthly_');
      this.clearCacheByPrefix('category_');
      this.clearCacheByPrefix('streak_');
      
      return {
        success: true,
        message: '学习记录已删除'
      };
    } catch (error) {
      console.error('删除学习记录失败:', error);
      throw new Error('删除学习记录失败，请稍后重试');
    }
  }
  
  // 生成模拟学习记录
  generateMockStudyRecords() {
    const types = ['词语学习', '练习测试', '阅读理解', '成语学习'];
    const titles = [
      '小学语文基础知识练习',
      '成语填空专项训练',
      '常见错别字辨析',
      '阅读理解提升练习',
      '古诗词默写与理解',
      '病句修改练习',
      '标点符号使用规范',
      '修辞手法识别',
      '近义词辨析练习',
      '反义词配对练习'
    ];
    
    const records = [];
    
    // 生成最近30天的记录
    for (let i = 0; i < 30; i++) {
      // 随机决定当天是否有学习记录（80%概率有记录）
      if (Math.random() > 0.2) {
        // 每天1-3条记录
        const recordCount = Math.floor(Math.random() * 3) + 1;
        
        for (let j = 0; j < recordCount; j++) {
          const type = types[Math.floor(Math.random() * types.length)];
          const title = titles[Math.floor(Math.random() * titles.length)];
          const duration = Math.floor(Math.random() * 60) + 15; // 15-75分钟
          const completionRate = Math.random() > 0.3 ? 100 : Math.floor(Math.random() * 90) + 10; // 10-100%
          const score = completionRate === 100 ? Math.floor(Math.random() * 30) + 70 : null; // 70-100分或null
          
          // 计算日期
          const date = new Date();
          date.setDate(date.getDate() - i);
          const studyDate = date.toISOString().split('T')[0];
          
          records.push({
            id: records.length + 1,
            title: title,
            type: type,
            duration: duration,
            completionRate: completionRate,
            score: score,
            studyDate: studyDate,
            createTime: date.toISOString()
          });
        }
      }
    }
    
    return records;
  }
  
  // 生成模拟连续学习历史
  generateMockStreakHistory() {
    const history = [];
    
    // 生成最近30天的学习历史
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // 随机决定是否学习（80%概率学习）
      const studied = Math.random() > 0.2;
      
      history.push({
        date: dateStr,
        studied: studied,
        studyTime: studied ? Math.floor(Math.random() * 60) + 15 : 0,
        exercises: studied ? Math.floor(Math.random() * 3) + 1 : 0
      });
    }
    
    return history;
  }
  
  // 缓存相关方法
  getFromCache(key) {
    const cachedItem = this.cache.get(key);
    if (!cachedItem) return null;
    
    const now = Date.now();
    if (now > cachedItem.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cachedItem.data;
  }
  
  saveToCache(key, data) {
    const expiry = Date.now() + this.config.cacheTTL;
    this.cache.set(key, { data, expiry });
  }
  
  clearCacheByPrefix(prefix) {
    for (let key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
  
  clearAllCache() {
    this.cache.clear();
  }
}

// 创建单例实例
const studyRecordService = new StudyRecordService();

// 初始化服务
studyRecordService.init();

export { studyRecordService };