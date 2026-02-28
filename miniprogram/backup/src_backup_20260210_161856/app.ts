import { PropsWithChildren } from 'react'
import './app.scss'

/**
 * App 入口仅渲染子节点，不在此使用 Taro/useLaunch，
 * 避免真机环境下 Taro 运行时在 app.js 求值阶段触发栈溢出。
 * 云开发初始化改在首页 useLoad 中执行。
 */
function App({ children }: PropsWithChildren<any>) {
  return children
}

export default App
