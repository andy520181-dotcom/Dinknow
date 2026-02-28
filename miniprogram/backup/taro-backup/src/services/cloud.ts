import Taro from '@tarojs/taro'
import { CLOUD_ENV } from '../constants'

let cloudInitialized = false

/**
 * 初始化云开发（只初始化一次）
 */
export function initCloud() {
  if (cloudInitialized) return
  try {
    if (Taro.cloud) {
      Taro.cloud.init({ env: CLOUD_ENV, traceUser: true })
      cloudInitialized = true
    }
  } catch (error) {
    console.error('云开发初始化失败:', error)
  }
}

/**
 * 调用云函数（统一入口）
 */
export async function callCloudFunction(name: string, data?: any): Promise<any> {
  // 确保已初始化
  if (!cloudInitialized) {
    initCloud()
  }
  try {
    const res = await Taro.cloud.callFunction({ name, data })
    return res.result as any
  } catch (error) {
    console.error(`云函数 ${name} 调用失败:`, error)
    throw error
  }
}
