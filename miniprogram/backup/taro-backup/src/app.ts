import { PropsWithChildren } from 'react'
import './app.scss'

/**
 * App 入口组件
 * 保持最简实现，避免在模块求值阶段执行任何逻辑
 */
function App({ children }: PropsWithChildren<any>) {
  return children
}

export default App
