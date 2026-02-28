import Taro from '@tarojs/taro'
import { STORAGE_AGREEMENT_AGREED } from '../constants'

/**
 * 检查用户是否已同意协议
 */
export function hasAgreedToTerms(): boolean {
  try {
    return !!Taro.getStorageSync(STORAGE_AGREEMENT_AGREED)
  } catch {
    return false
  }
}

/**
 * 设置用户已同意协议
 */
export function setAgreedToTerms(agreed: boolean = true): void {
  try {
    if (agreed) {
      Taro.setStorageSync(STORAGE_AGREEMENT_AGREED, true)
    } else {
      Taro.removeStorageSync(STORAGE_AGREEMENT_AGREED)
    }
  } catch (error) {
    console.error('保存协议状态失败:', error)
  }
}
