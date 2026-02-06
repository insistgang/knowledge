import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  HomeOutlined,
  BookOutlined,
  LineChartOutlined,
  BarChartOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined
} from '@ant-design/icons'
import Home from './pages/Home'
import Exercise from './pages/Exercise'
import StudyReport from './pages/StudyReport'
import StudyAnalysis from './pages/StudyAnalysis'
import StudyRecord from './pages/StudyRecord'
import Profile from './pages/Profile'
import Vocabulary from './pages/Vocabulary'
import Literature from './pages/Literature'
import Pinyin from './pages/Pinyin'
import Correction from './pages/Correction'
import Chat from './pages/Chat'
import Idiom from './pages/Idiom'
import ExerciseDetail from './pages/ExerciseDetail'
import './App.css'

const { Header, Content, Footer } = Layout

function App() {
  const [current, setCurrent] = useState('home')
  const [isLogin, setIsLogin] = useState(true) // 为了演示效果，默认设置为已登录

  const handleMenuClick = (e) => {
    setCurrent(e.key)
    const pathMap = {
      'home': '/home',
      'vocabulary': '/vocabulary',
      'literature': '/literature',
      'idiom': '/idiom',
      'exercise': '/exercise',
      'study-record': '/study-record',
      'study-report': '/study-report',
      'study-analysis': '/study-analysis',
      'profile': '/profile'
    }
    if (pathMap[e.key]) {
      window.location.href = pathMap[e.key]
    }
  }

  const handleLogout = () => {
    setIsLogin(false)
    setCurrent('login')
  }

  return (
    <Router>
      <Layout className="layout">
        <Header className="header">
          <div className="logo">AI语文助手</div>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[current]}
            onClick={handleMenuClick}
            className="header-menu"
          >
            {isLogin ? (
              <>
                <Menu.Item key="home" icon={<HomeOutlined />}>
                  首页
                </Menu.Item>
                <Menu.Item key="vocabulary" icon={<BookOutlined />}>
                  词语学习
                </Menu.Item>
                <Menu.Item key="literature" icon={<BookOutlined />}>
                  古诗词学习
                </Menu.Item>
                <Menu.Item key="idiom" icon={<BookOutlined />}>
                  熟语习语
                </Menu.Item>
                <Menu.Item key="exercise" icon={<FileTextOutlined />}>
                  练习中心
                </Menu.Item>
                <Menu.Item key="study-record" icon={<LineChartOutlined />}>
                  学习记录
                </Menu.Item>
                <Menu.Item key="study-report" icon={<BarChartOutlined />}>
                  学习报告
                </Menu.Item>
                <Menu.Item key="study-analysis" icon={<BarChartOutlined />}>
                  学习分析
                </Menu.Item>
                <Menu.Item key="profile" icon={<UserOutlined />}>
                  个人资料
                </Menu.Item>
                <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                  退出登录
                </Menu.Item>
              </>
            ) : (
              <Menu.Item key="login" icon={<LoginOutlined />}>
                登录
              </Menu.Item>

            )}
          </Menu>
        </Header>
        
        <Content className="content">
          <div className="container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/exercise" element={<Exercise />} />
              <Route path="/exercise-detail/:id" element={<ExerciseDetail />} />
              <Route path="/study-report" element={<StudyReport />} />
              <Route path="/report" element={<StudyReport />} />
              <Route path="/study-analysis" element={<StudyAnalysis />} />
              <Route path="/study-record" element={<StudyRecord />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/vocabulary" element={<Vocabulary />} />
              <Route path="/literature" element={<Literature />} />
              <Route path="/poetry" element={<Literature />} />
              <Route path="/pinyin" element={<Pinyin />} />
              <Route path="/correction" element={<Correction />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/idiom" element={<Idiom />} />
            </Routes>
          </div>
        </Content>

        <Footer className="footer">
          <div className="footer-content">
            <div className="contact-info">
              <p>联系我们：insistgang@163.com</p>
              <p>版本：v3.0.0</p>
            </div>
            <div className="copyright">
              © 2025 AI语文助手 - 体育生语文基础智能辅导系统
            </div>
          </div>
        </Footer>
      </Layout>
    </Router>
  )
}

export default App