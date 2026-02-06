import { useState, useEffect } from 'react'
import { Card, Tabs, Input, Button, List, Badge, Tag, Empty, Spin, message } from 'antd'
import { SearchOutlined, BookOutlined, HistoryOutlined, StarOutlined, StarFilled, CheckCircleOutlined }
  from '@ant-design/icons'

const { TabPane } = Tabs
const { Search } = Input

// 模拟熟语/成语数据
const mockIdioms = [
  {
    id: 1,
    title: '一举两得',
    pronunciation: 'yī jǔ liǎng dé',
    explanation: '做一件事得到两方面的好处。',
    origin: '《晋书·束皙传》："赐其十年炎复，以慰重迁之情，一举两得，外实内宽。"',
    example: '利用废物，既可变废为宝，又可减少空气污染，是一举两得的好事。',
    category: '褒义',
    theme: '效率',
    relatedIdioms: [2, 3, 4]
  },
  {
    id: 2,
    title: '一箭双雕',
    pronunciation: 'yī jiàn shuāng diāo',
    explanation: '原指射箭技术高超，一箭射中两只雕。后比喻做一件事达到两个目的。',
    origin: '《北史·长孙晟传》："尝有二雕飞而争肉，因以箭两只与晟，请射取之。晟驰往，遇雕相攫，遂一发双贯焉。"',
    example: '你这样做真是一箭双雕，既解决了问题，又提升了自己的能力。',
    category: '褒义',
    theme: '效率',
    relatedIdioms: [1, 3, 5]
  },
  {
    id: 3,
    title: '两全其美',
    pronunciation: 'liǎng quán qí měi',
    explanation: '指做一件事顾全到双方，使两方面都得到好处。',
    origin: '元·无名氏《连环计》第三折："司徒，你若肯与了我呵，堪可两全其美也。"',
    example: '我们应该想一个两全其美的办法，既不伤害别人，也能解决问题。',
    category: '褒义',
    theme: '和谐',
    relatedIdioms: [1, 2, 6]
  },
  {
    id: 4,
    title: '事半功倍',
    pronunciation: 'shì bàn gōng bèi',
    explanation: '指做事得法，因而费力小，收效大。',
    origin: '《孟子·公孙丑上》："故事半古之人，功必倍之，惟此时为然。"',
    example: '掌握了正确的学习方法，往往能够事半功倍。',
    category: '褒义',
    theme: '效率',
    relatedIdioms: [1, 7, 8]
  },
  {
    id: 5,
    title: '一举多得',
    pronunciation: 'yī jǔ duō dé',
    explanation: '做一件事得到多方面的好处。',
    origin: '《晋书·束皙传》："赐其十年炎复，以慰重迁之情，一举两得，外实内宽。" 后演变为"一举多得"。',
    example: '开展植树造林活动，一举多得，既美化环境，又改善气候，还能增加收入。',
    category: '褒义',
    theme: '效率',
    relatedIdioms: [2, 9, 10]
  },
  {
    id: 6,
    title: '各得其所',
    pronunciation: 'gè dé qí suǒ',
    explanation: '原指各人都得到满足。后指每个人或事物都得到恰当的位置或安排。',
    origin: '《周易·系辞下》："日中为市，致天下之民，聚天下之货，交易而退，各得其所。"',
    example: '这个方案很合理，让每个人都能各得其所。',
    category: '中性',
    theme: '和谐',
    relatedIdioms: [3, 11, 12]
  },
  {
    id: 7,
    title: '一本万利',
    pronunciation: 'yī běn wàn lì',
    explanation: '本钱小，利润大。',
    origin: '清·姬文《市声》第二十六回："这回破釜沉舟，远行一趟，却指望收它个一本万利哩。"',
    example: '投资教育是一本万利的事情，它能改变人的一生。',
    category: '中性',
    theme: '收益',
    relatedIdioms: [4, 13, 14]
  },
  {
    id: 8,
    title: '一石二鸟',
    pronunciation: 'yī shí èr niǎo',
    explanation: '扔一颗石子打到两只鸟。比喻做一件事情得到两种好处。',
    origin: '源自英语成语 "Kill two birds with one stone" 的直译。',
    example: '他的这个提议真是一石二鸟，既解决了资金问题，又提高了效率。',
    category: '褒义',
    theme: '效率',
    relatedIdioms: [4, 1, 2]
  },
  {
    id: 9,
    title: '一举成功',
    pronunciation: 'yī jǔ chéng gōng',
    explanation: '一下子就获得成功。',
    origin: '《史记·项羽本纪》："吾闻先即制人，后则为人所制。吾欲发兵，使公及桓楚将。"',
    example: '只要准备充分，这次面试肯定能一举成功。',
    category: '褒义',
    theme: '成功',
    relatedIdioms: [5, 15, 16]
  },
  {
    id: 10,
    title: '多才多艺',
    pronunciation: 'duō cái duō yì',
    explanation: '具有多方面的才能和技艺。',
    origin: '《尚书·金滕》："予仁若考，能多才多艺，能事鬼神。"',
    example: '他是一个多才多艺的人，不仅会画画，还会弹钢琴。',
    category: '褒义',
    theme: '能力',
    relatedIdioms: [5, 17, 18]
  }
]

// 分类数据
const categories = [
  { key: 'all', name: '全部', count: mockIdioms.length },
  { key: '褒义', name: '褒义', count: mockIdioms.filter(item => item.category === '褒义').length },
  { key: '贬义', name: '贬义', count: mockIdioms.filter(item => item.category === '贬义').length },
  { key: '中性', name: '中性', count: mockIdioms.filter(item => item.category === '中性').length }
]

// 主题数据
const themes = [
  { key: 'all', name: '全部', count: mockIdioms.length },
  { key: '效率', name: '效率', count: mockIdioms.filter(item => item.theme === '效率').length },
  { key: '和谐', name: '和谐', count: mockIdioms.filter(item => item.theme === '和谐').length },
  { key: '收益', name: '收益', count: mockIdioms.filter(item => item.theme === '收益').length },
  { key: '成功', name: '成功', count: mockIdioms.filter(item => item.theme === '成功').length },
  { key: '能力', name: '能力', count: mockIdioms.filter(item => item.theme === '能力').length }
]

const Idiom = () => {
  // 状态管理
  const [idioms, setIdioms] = useState([])
  const [currentTab, setCurrentTab] = useState('1')
  const [selectedIdiom, setSelectedIdiom] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [filteredIdioms, setFilteredIdioms] = useState([])
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState(new Set())
  const [searchHistory, setSearchHistory] = useState([])
  const [currentCategory, setCurrentCategory] = useState('all')
  const [currentTheme, setCurrentTheme] = useState('all')
  const [relatedIdioms, setRelatedIdioms] = useState([])
  const [exerciseMode, setExerciseMode] = useState(false)
  const [currentExercise, setCurrentExercise] = useState(null)
  const [exerciseAnswer, setExerciseAnswer] = useState('')
  const [exerciseResult, setExerciseResult] = useState(null)

  // 组件挂载时加载数据
  useEffect(() => {
    loadIdioms()
    loadFavorites()
    loadSearchHistory()
  }, [])

  // 过滤成语列表
  useEffect(() => {
    filterIdioms()
  }, [idioms, searchText, currentCategory, currentTheme])

  // 加载成语数据
  const loadIdioms = async () => {
    try {
      setLoading(true)
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      setIdioms(mockIdioms)
    } catch (error) {
      message.error('加载成语数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载收藏的成语
  const loadFavorites = () => {
    const savedFavorites = localStorage.getItem('idiomFavorites')
    if (savedFavorites) {
      try {
        const favoritesSet = new Set(JSON.parse(savedFavorites))
        setFavorites(favoritesSet)
      } catch (error) {
        console.error('加载收藏数据失败', error)
      }
    }
  }

  // 加载搜索历史
  const loadSearchHistory = () => {
    const savedHistory = localStorage.getItem('idiomSearchHistory')
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error('加载搜索历史失败', error)
      }
    }
  }

  // 保存收藏的成语
  const saveFavorites = (favoritesSet) => {
    try {
      localStorage.setItem('idiomFavorites', JSON.stringify(Array.from(favoritesSet)))
    } catch (error) {
      console.error('保存收藏数据失败', error)
    }
  }

  // 保存搜索历史
  const saveSearchHistory = (history) => {
    try {
      localStorage.setItem('idiomSearchHistory', JSON.stringify(history))
    } catch (error) {
      console.error('保存搜索历史失败', error)
    }
  }

  // 过滤成语
  const filterIdioms = () => {
    let filtered = [...idioms]

    // 搜索过滤
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase()
      filtered = filtered.filter(idiom => 
        idiom.title.toLowerCase().includes(searchLower) ||
        idiom.pronunciation.toLowerCase().includes(searchLower) ||
        idiom.explanation.toLowerCase().includes(searchLower)
      )
    }

    // 分类过滤
    if (currentCategory !== 'all') {
      filtered = filtered.filter(idiom => idiom.category === currentCategory)
    }

    // 主题过滤
    if (currentTheme !== 'all') {
      filtered = filtered.filter(idiom => idiom.theme === currentTheme)
    }

    setFilteredIdioms(filtered)
  }

  // 搜索成语
  const handleSearch = (value) => {
    setSearchText(value)
    
    // 添加到搜索历史
    if (value.trim()) {
      const newHistory = [value.trim(), ...searchHistory.filter(item => item !== value.trim())].slice(0, 10)
      setSearchHistory(newHistory)
      saveSearchHistory(newHistory)
    }
  }

  // 清除搜索历史
  const clearSearchHistory = () => {
    setSearchHistory([])
    saveSearchHistory([])
  }

  // 点击搜索历史项
  const handleHistoryClick = (item) => {
    setSearchText(item)
    filterIdioms()
  }

  // 查看成语详情
  const viewIdiomDetail = (idiom) => {
    setSelectedIdiom(idiom)
    setCurrentTab('2') // 切换到详情标签页
    
    // 加载相关成语
    const related = mockIdioms.filter(item => idiom.relatedIdioms.includes(item.id))
    setRelatedIdioms(related)
  }

  // 切换收藏状态
  const toggleFavorite = (idiomId) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(idiomId)) {
      newFavorites.delete(idiomId)
      message.success('已取消收藏')
    } else {
      newFavorites.add(idiomId)
      message.success('已添加到收藏')
    }
    setFavorites(newFavorites)
    saveFavorites(newFavorites)
  }

  // 开始练习
  const startExercise = () => {
    const randomIdiom = mockIdioms[Math.floor(Math.random() * mockIdioms.length)]
    setCurrentExercise(randomIdiom)
    setExerciseAnswer('')
    setExerciseResult(null)
    setExerciseMode(true)
  }

  // 提交练习答案
  const submitExercise = () => {
    if (!currentExercise) return
    
    const isCorrect = exerciseAnswer.trim() === currentExercise.title
    setExerciseResult({
      isCorrect,
      correctAnswer: currentExercise.title
    })
  }

  // 下一个练习
  const nextExercise = () => {
    startExercise()
  }

  // 渲染成语列表项
  const renderIdiomItem = (idiom) => (
    <Card
      key={idiom.id}
      className="idiom-item-card"
      hoverable
      onClick={() => viewIdiomDetail(idiom)}
      extra={
        <Button
          type="text"
          icon={favorites.has(idiom.id) ? <StarFilled style={{ color: '#ffd700' }} /> : <StarOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(idiom.id)
          }}
        />
      }
    >
      <div className="idiom-item-header">
        <h3>{idiom.title}</h3>
        <p className="pronunciation">{idiom.pronunciation}</p>
      </div>
      <p className="explanation-preview">{idiom.explanation}</p>
      <div className="idiom-item-tags">
        <Tag color={idiom.category === '褒义' ? 'green' : idiom.category === '贬义' ? 'red' : 'blue'}>
          {idiom.category}
        </Tag>
        <Tag color="purple">{idiom.theme}</Tag>
      </div>
    </Card>
  )

  // 渲染成语详情
  const renderIdiomDetail = () => {
    if (!selectedIdiom) {
      return <Empty description="请选择一个成语查看详情" />
    }

    return (
      <Card className="idiom-detail-card">
        <div className="idiom-detail-header">
          <h2>{selectedIdiom.title}</h2>
          <p className="pronunciation-large">{selectedIdiom.pronunciation}</p>
          <div className="idiom-detail-tags">
            <Tag color={selectedIdiom.category === '褒义' ? 'green' : selectedIdiom.category === '贬义' ? 'red' : 'blue'}>
              {selectedIdiom.category}
            </Tag>
            <Tag color="purple">{selectedIdiom.theme}</Tag>
          </div>
        </div>
        
        <div className="idiom-detail-content">
          <div className="detail-section">
            <h4>解释</h4>
            <p>{selectedIdiom.explanation}</p>
          </div>
          
          <div className="detail-section">
            <h4>出处</h4>
            <p>{selectedIdiom.origin}</p>
          </div>
          
          <div className="detail-section">
            <h4>例句</h4>
            <p>{selectedIdiom.example}</p>
          </div>
        </div>
        
        <div className="idiom-detail-actions">
          <Button
            type={favorites.has(selectedIdiom.id) ? 'default' : 'primary'}
            icon={favorites.has(selectedIdiom.id) ? <StarFilled style={{ color: '#ffd700' }} /> : <StarOutlined />}
            onClick={() => toggleFavorite(selectedIdiom.id)}
          >
            {favorites.has(selectedIdiom.id) ? '取消收藏' : '添加收藏'}
          </Button>
        </div>
        
        {relatedIdioms.length > 0 && (
          <div className="related-idioms-section">
            <h4>相关成语</h4>
            <div className="related-idioms-list">
              {relatedIdioms.map(idiom => (
                <Tag
                  key={idiom.id}
                  color="blue"
                  onClick={() => viewIdiomDetail(idiom)}
                  className="related-idiom-tag"
                >
                  {idiom.title}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </Card>
    )
  }

  // 渲染收藏的成语
  const renderFavoriteIdioms = () => {
    const favoriteList = mockIdioms.filter(idiom => favorites.has(idiom.id))
    
    if (favoriteList.length === 0) {
      return <Empty description="暂无收藏的成语" />
    }
    
    return (
      <div className="favorites-list">
        {favoriteList.map(idiom => (
          <Card
            key={idiom.id}
            className="favorite-idiom-item"
            hoverable
            onClick={() => viewIdiomDetail(idiom)}
            extra={
              <Button
                type="text"
                icon={<StarFilled style={{ color: '#ffd700' }} />}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(idiom.id)
                }}
              />
            }
          >
            <div className="favorite-idiom-content">
              <h3>{idiom.title}</h3>
              <p className="pronunciation">{idiom.pronunciation}</p>
              <p className="explanation-preview">{idiom.explanation}</p>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  // 渲染搜索历史
  const renderSearchHistory = () => {
    if (searchHistory.length === 0) {
      return <Empty description="暂无搜索历史" />
    }
    
    return (
      <div className="search-history-list">
        <div className="history-header">
          <h4>搜索历史</h4>
          <Button type="text" size="small" onClick={clearSearchHistory}>清除</Button>
        </div>
        <div className="history-items">
          {searchHistory.map((item, index) => (
            <Tag
              key={index}
              color="blue"
              className="history-item-tag"
              onClick={() => handleHistoryClick(item)}
              closable
              onClose={() => {
                const newHistory = searchHistory.filter((_, i) => i !== index)
                setSearchHistory(newHistory)
                saveSearchHistory(newHistory)
              }}
            >
              {item}
            </Tag>
          ))}
        </div>
      </div>
    )
  }

  // 渲染练习模式
  const renderExercise = () => {
    if (!exerciseMode) {
      return (
        <Card className="exercise-start-card">
          <div className="exercise-start-content">
            <h3>成语练习</h3>
            <p>通过练习巩固您对成语的理解和记忆能力</p>
            <Button type="primary" size="large" onClick={startExercise}>
              开始练习
            </Button>
          </div>
        </Card>
      )
    }

    if (!currentExercise) {
      return <Empty description="正在加载练习内容..." />
    }

    return (
      <Card className="exercise-card">
        <div className="exercise-content">
          <h3>根据释义写出成语</h3>
          <div className="exercise-question">
            <p>{currentExercise.explanation}</p>
          </div>
          
          <div className="exercise-answer">
            <Input
              placeholder="请输入成语"
              value={exerciseAnswer}
              onChange={(e) => setExerciseAnswer(e.target.value)}
              onPressEnter={submitExercise}
              style={{ marginBottom: '16px' }}
            />
            <Button type="primary" onClick={submitExercise}>
              提交答案
            </Button>
          </div>
          
          {exerciseResult && (
            <div className={`exercise-result ${exerciseResult.isCorrect ? 'correct' : 'incorrect'}`}>
              <div className="result-icon">
                <CheckCircleOutlined />
              </div>
              <div className="result-text">
                {exerciseResult.isCorrect ? '回答正确！' : `回答错误。正确答案是：${exerciseResult.correctAnswer}`}
              </div>
            </div>
          )}
          
          {exerciseResult && (
            <div className="exercise-actions">
              <Button type="primary" onClick={nextExercise}>
                下一题
              </Button>
              <Button onClick={() => setExerciseMode(false)}>
                结束练习
              </Button>
            </div>
          )}
        </div>
      </Card>
    )
  }

  // 主内容渲染
  return (
    <div className="idiom-container">
      <h1 className="page-title">熟语习语学习</h1>
      
      {/* 搜索和过滤区域 */}
      <div className="search-filter-section">
        <Search
          placeholder="搜索成语、拼音或释义"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          onChange={(e) => setSearchText(e.target.value)}
          value={searchText}
          className="search-input"
        />
        
        <div className="filter-tags">
          <div className="filter-group">
            <span className="filter-label">分类：</span>
            {categories.map(category => (
              <Tag
                key={category.key}
                color={currentCategory === category.key ? 'blue' : 'default'}
                onClick={() => setCurrentCategory(category.key)}
                className={currentCategory === category.key ? 'active-filter' : ''}
              >
                {category.name} ({category.count})
              </Tag>
            ))}
          </div>
          
          <div className="filter-group">
            <span className="filter-label">主题：</span>
            {themes.map(theme => (
              <Tag
                key={theme.key}
                color={currentTheme === theme.key ? 'purple' : 'default'}
                onClick={() => setCurrentTheme(theme.key)}
                className={currentTheme === theme.key ? 'active-filter' : ''}
              >
                {theme.name} ({theme.count})
              </Tag>
            ))}
          </div>
        </div>
      </div>
      
      {/* 内容标签页 */}
      <Tabs activeKey={currentTab} onChange={setCurrentTab} className="idiom-tabs">
        <TabPane tab="成语列表" key="1">
          {loading ? (
            <div className="loading-wrapper">
              <Spin size="large" tip="加载中..." />
            </div>
          ) : filteredIdioms.length > 0 ? (
            <div className="idioms-grid">
              {filteredIdioms.map(renderIdiomItem)}
            </div>
          ) : (
            <Empty description="没有找到匹配的成语" />
          )}
        </TabPane>
        
        <TabPane tab="成语详情" key="2">
          {renderIdiomDetail()}
        </TabPane>
        
        <TabPane tab="我的收藏" key="3">
          {renderFavoriteIdioms()}
        </TabPane>
        
        <TabPane tab="搜索历史" key="4">
          {renderSearchHistory()}
        </TabPane>
        
        <TabPane tab="成语练习" key="5">
          {renderExercise()}
        </TabPane>
      </Tabs>
    </div>
  )
}

export default Idiom