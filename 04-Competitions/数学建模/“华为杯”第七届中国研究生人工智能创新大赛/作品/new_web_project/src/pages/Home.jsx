import React, { useState } from 'react'
import { Card, Row, Col, Progress, Statistic, Button, Avatar, Badge, Tabs } from 'antd'
import { FileTextOutlined, AudioOutlined, HighlightOutlined, BookOutlined, LayoutOutlined, StarOutlined, TrophyOutlined, ClockCircleOutlined, ExclamationCircleOutlined, RobotOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'

const { TabPane } = Tabs

const Home = () => {
  const [userInfo, setUserInfo] = useState({
    name: '体育生小明',
    level: '初级',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming'
  })
  
  const [studyStats, setStudyStats] = useState({
    todayScore: 85,
    errorCount: 12,
    totalStudyTime: 360,
    studyDays: 15
  })
  
  const [progressList, setProgressList] = useState([
    { type: 'pinyin', name: '拼音掌握度', progress: 65 },
    { type: 'vocabulary', name: '词汇量', progress: 78 },
    { type: 'literature', name: '文学常识', progress: 45 },
    { type: 'idiom', name: '成语积累', progress: 62 }
  ])
  
  const [recommendList, setRecommendList] = useState([
    {
      id: 1,
      title: '汉字拼音练习',
      description: '练习常用汉字的拼音读音',
      type: 'pinyin',
      isNew: false,
      icon: <AudioOutlined />,
      path: '/pinyin'
    },
    {
      id: 2,
      title: '错别字纠错',
      description: '智能识别并纠正错别字',
      type: 'correction',
      isNew: true,
      icon: <HighlightOutlined />,
      path: '/correction'
    },
    {
      id: 3,
      title: '古诗词赏析',
      description: '学习经典古诗词',
      type: 'poetry',
      isNew: false,
      icon: <BookOutlined />,
      path: '/literature'
    }
  ])
  
  const [moduleList, setModuleList] = useState([
    {
      id: 1,
      title: '拼音学习',
      description: '汉字转拼音\n语音评测',
      icon: <AudioOutlined />,
      path: '/pinyin'
    },
    {
      id: 2,
      title: '错别字纠错',
      description: 'OCR识别\n智能纠错',
      icon: <HighlightOutlined />,
      path: '/correction'
    },
    {
      id: 3,
      title: '词汇学习',
      description: '词语查询\n语义理解',
      icon: <FileTextOutlined />,
      path: '/vocabulary'
    },
    {
      id: 4,
      title: '文学常识',
      description: '古诗词\n文学知识',
      icon: <BookOutlined />,
      path: '/literature'
    },
    {
      id: 5,
      title: '熟语俗语',
      description: '成语学习\n谚语理解',
      icon: <StarOutlined />,
      path: '/idiom'
    },
    {
      id: 6,
      title: '智能练习',
      description: '个性化题目\n自适应难度',
      icon: <LayoutOutlined />,
      path: '/exercise'
    },
    {
      id: 7,
      title: '智能助手',
      description: '学习问答\n智能辅导',
      icon: <RobotOutlined />,
      path: '/chat'
    }
  ])
  
  const formatStudyTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = Math.floor(minutes % 60)
    return `${hours}小时${remainingMinutes}分钟`
  }
  
  return (
    <div className="home-container">
      {/* 用户信息和学习概览 */}
      <Row gutter={[16, 16]} className="home-header">
        <Col xs={24} md={16}>
          <Card className="user-info-card">
            <div className="user-info">
              <Avatar size={80} src={userInfo.avatar} />
              <div className="user-details">
                <h2>欢迎回来，{userInfo.name}</h2>
                <p>当前等级：{userInfo.level}</p>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="study-overview-card">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="今日得分" value={studyStats.todayScore} suffix="分" />
              </Col>
              <Col span={12}>
                <Statistic title="总学习时间" value={formatStudyTime(studyStats.totalStudyTime)} />
              </Col>
              <Col span={12}>
                <Statistic title="已学习天数" value={studyStats.studyDays} suffix="天" />
              </Col>
              <Col span={12}>
                <Statistic title="错题数量" value={studyStats.errorCount} suffix="个" />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
      
      {/* 主要内容区域 */}
      <Tabs defaultActiveKey="1" className="home-tabs">
        <TabPane tab="推荐学习" key="1">
          <Row gutter={[16, 16]}>
            {recommendList.map(item => (
              <Col xs={24} sm={12} md={8} key={item.id}>
                <Card className="recommend-card" hoverable>
                  <div className="recommend-card-content">
                    <div className="recommend-icon">{item.icon}</div>
                    <div className="recommend-info">
                      <h3 className="recommend-title">
                        {item.title}
                        {item.isNew && <Badge color="green" text="新" />}
                      </h3>
                      <p className="recommend-desc">{item.description}</p>
                      <Link to={`/${item.type}`}>
                        <Button type="primary" size="small" className="recommend-btn">
                          开始学习
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
        
        <TabPane tab="学习模块" key="2">
          <Row gutter={[16, 16]}>
            {moduleList.map(item => (
              <Col xs={24} sm={12} md={8} key={item.id}>
                <Link to={item.path} className="module-link">
                  <Card className="module-card" hoverable>
                    <div className="module-content">
                      <div className="module-icon">{item.icon}</div>
                      <h3 className="module-title">{item.title}</h3>
                      <p className="module-desc" style={{ whiteSpace: 'pre-line' }}>
                        {item.description}
                      </p>
                    </div>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        </TabPane>
        
        <TabPane tab="学习进度" key="3">
          <Card className="progress-card">
            <h3 className="progress-title">学习进度概览</h3>
            <div className="progress-list">
              {progressList.map(item => (
                <div key={item.type} className="progress-item">
                  <div className="progress-header">
                    <span className="progress-name">{item.name}</span>
                    <span className="progress-value">{item.progress}%</span>
                  </div>
                  <Progress percent={item.progress} strokeColor="#4A90E2" />
                </div>
              ))}
            </div>
            <div className="progress-actions">
              <Link to="/report">
                <Button type="default" className="progress-btn">
                  查看详细报告
                </Button>
              </Link>
            </div>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default Home