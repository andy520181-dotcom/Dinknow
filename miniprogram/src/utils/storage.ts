import { STORAGE_AGREEMENT_AGREED } from '../constants'

/**
 * 检查用户是否已同意协议
 */
export function hasAgreedToTerms(): boolean {
  try {
    return !!uni.getStorageSync(STORAGE_AGREEMENT_AGREED)
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
      uni.setStorageSync(STORAGE_AGREEMENT_AGREED, true)
    } else {
      uni.removeStorageSync(STORAGE_AGREEMENT_AGREED)
    }
  } catch (error) {
    console.error('保存协议状态失败:', error)
  }
}
