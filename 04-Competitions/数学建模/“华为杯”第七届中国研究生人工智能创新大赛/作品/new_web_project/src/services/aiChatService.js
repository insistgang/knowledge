// AI聊天服务 - 用于调用硅基流动的DeepSeek API

class AIChatService {
  constructor() {
    // 服务配置
    this.config = {
      apiProvider: 'deepseek', // 服务提供商
      apiBaseUrl: 'https://api.deepseek.com/v1', // DeepSeek API基础URL
      timeout: 10000, // 请求超时时间（毫秒）
      cacheEnabled: true, // 是否启用缓存
      cacheTTL: 3600000, // 缓存有效期（毫秒）
      apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '', // 从环境变量读取API密钥
      model: 'deepseek-chat', // 使用的模型
      maxTokens: 2000, // 最大生成长度
      temperature: 0.7, // 温度参数，控制生成文本的随机性
    };
    
    // 初始化缓存
    this.cache = new Map();
  }
  
  // 初始化服务
  init(apiKey = '') {
    console.log('AIChatService initialized');
    // 优先使用传入的apiKey，如果没有则使用环境变量中的值
    if (apiKey) {
      this.config.apiKey = apiKey;
    }
  }
  
  // 设置API密钥
  setApiKey(apiKey) {
    this.config.apiKey = apiKey;
    console.log('DeepSeek API key set');
  }
  
  // 调用DeepSeek API
  async callDeepSeekAPI(messages, options = {}) {
    try {
      // 检查API密钥是否设置
      if (!this.config.apiKey) {
        throw new Error('DeepSeek API key is not configured');
      }
      
      // 构建API请求参数
      const requestData = {
        model: options.model || this.config.model,
        messages: messages,
        max_tokens: options.maxTokens || this.config.maxTokens,
        temperature: options.temperature !== undefined ? options.temperature : this.config.temperature,
      };
      
      // 构建缓存键
      const cacheKey = `deepseek_${JSON.stringify(requestData)}`;
      
      // 检查缓存
      if (this.config.cacheEnabled) {
        const cachedResult = this.getFromCache(cacheKey);
        if (cachedResult) {
          console.log('Returning cached DeepSeek API response');
          return cachedResult;
        }
      }
      
      // 发送请求
      const response = await fetch(`${this.config.apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      // 检查响应状态
      if (!response.ok) {
        throw new Error(`DeepSeek API request failed with status: ${response.status}`);
      }
      
      // 解析响应
      const data = await response.json();
      
      // 检查响应数据格式
      if (!data.choices || data.choices.length === 0) {
        throw new Error('Invalid DeepSeek API response format');
      }
      
      // 获取响应内容
      const result = data.choices[0].message.content;
      
      // 存入缓存
      if (this.config.cacheEnabled) {
        this.saveToCache(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      console.error('DeepSeek API call failed:', error);
      throw new Error(`DeepSeek API调用失败: ${error.message}`);
    }
  }
  
  // 与AI沟通学习情况
  async discussStudyProgress(studyData, question = '') {
    try {
      // 构建消息内容
      const messages = [
        {
          role: 'system',
          content: `你是一个专业的语文学习顾问，擅长分析学习数据并提供个性化建议。`
        },
        {
          role: 'user',
          content: this.buildStudyProgressPrompt(studyData, question)
        }
      ];
      
      // 调用API
      const response = await this.callDeepSeekAPI(messages, {
        temperature: 0.6, // 降低随机性，提高专业建议的准确性
      });
      
      return response;
    } catch (error) {
      console.error('Failed to discuss study progress:', error);
      throw error;
    }
  }
  
  // 构建学习进度讨论的提示词
  buildStudyProgressPrompt(studyData, question) {
    let prompt = `我的语文学习数据如下：\n`;
    
    // 添加学习统计数据
    if (studyData.statistics) {
      const stats = studyData.statistics;
      prompt += `- 总学习时长：${stats.totalStudyTime || 0}分钟\n`;
      prompt += `- 已学习词语：${stats.totalWordsLearned || 0}个\n`;
      prompt += `- 已完成练习：${stats.totalExercisesCompleted || 0}个\n`;
      prompt += `- 平均得分：${stats.averageScore || 0}分\n`;
      prompt += `- 完成率：${stats.completionRate || 0}%\n`;
      prompt += `- 连续学习天数：${stats.learningStreak || 0}天\n`;
    }
    
    // 添加分类学习数据
    if (studyData.categoryData && studyData.categoryData.length > 0) {
      prompt += `\n学习分类情况：\n`;
      studyData.categoryData.forEach(category => {
        prompt += `- ${category.category}：${category.studyTime || 0}分钟 (${category.percentage || 0}%)\n`;
      });
    }
    
    // 添加最近的学习记录
    if (studyData.recentRecords && studyData.recentRecords.length > 0) {
      prompt += `\n最近的学习记录：\n`;
      studyData.recentRecords.slice(0, 3).forEach(record => {
        prompt += `- ${record.title || '未命名练习'} (${record.studyDate || '日期不详'})：`;
        prompt += `${record.duration || 0}分钟，得分：${record.score || '未评分'}\n`;
      });
    }
    
    // 添加用户问题
    if (question) {
      prompt += `\n${question}`;
    } else {
      prompt += `\n请根据我的学习数据，分析我的学习情况，并提供个性化的学习建议。`;
    }
    
    return prompt;
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
const aiChatService = new AIChatService();

// 初始化服务
aiChatService.init();

export { aiChatService };