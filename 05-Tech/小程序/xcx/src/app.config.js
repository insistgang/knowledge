/**
 * 全局页面配置
 */
export default {
  pages: [
    'pages/login/index',
    'pages/home/index',
    'pages/vocabulary/index',
    'pages/idiom/index',
    'pages/pinyin/index',
    'pages/correction/index',
    'pages/exercise/index',
    'pages/exercise-detail/index',
    'pages/mock-exam/index',
    'pages/exam-result/index',
    'pages/chat/index',
    'pages/study-record/index',
    'pages/study-report/index',
    'pages/study-analysis/index',
    'pages/wrong-practice/index',
    'pages/favorite-practice/index',
    'pages/profile/index',
    'pages/admin/index',
    'pages/admin/user-detail/index',
    'pages/admin-import/index',
    'pages/admin-manage/index'
  ],

  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#4A90E2',
    navigationBarTitleText: '语文助手',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F5F5F5'
  },

  tabBar: {
    color: '#999999',
    selectedColor: '#4A90E2',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'images/tabbar/home.png',
        selectedIconPath: 'images/tabbar/home-active.png'
      },
      {
        pagePath: 'pages/exercise/index',
        text: '练习',
        iconPath: 'images/tabbar/exercise.png',
        selectedIconPath: 'images/tabbar/exercise-active.png'
      },
      {
        pagePath: 'pages/chat/index',
        text: '答疑',
        iconPath: 'images/tabbar/chat.png',
        selectedIconPath: 'images/tabbar/chat-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'images/tabbar/profile.png',
        selectedIconPath: 'images/tabbar/profile-active.png'
      }
    ]
  },

  cloud: true,
  permission: {
    'scope.userLocation': {
      desc: '你的位置信息将用于小程序位置接口的效果展示'
    }
  }
}
