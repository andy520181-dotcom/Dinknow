export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/create-activity/index',
    'pages/profile/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'Dinknow',
    navigationBarTextStyle: 'black'
  },
  permission: {
    'scope.userLocation': {
      desc: '你的位置信息将用于显示附近的匹克球活动'
    }
  },
  tabBar: {
    color: '#666666',
    selectedColor: '#07c160',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/index/index', text: '广场', iconPath: 'assets/tabbar/square.png', selectedIconPath: 'assets/tabbar/square-active.png' },
      { pagePath: 'pages/create-activity/index', text: '发起活动', iconPath: 'assets/tabbar/create.png', selectedIconPath: 'assets/tabbar/create-active.png' },
      { pagePath: 'pages/profile/index', text: '我', iconPath: 'assets/tabbar/profile.png', selectedIconPath: 'assets/tabbar/profile-active.png' }
    ]
  }
})
