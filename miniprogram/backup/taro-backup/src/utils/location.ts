import Taro from '@tarojs/taro'
import { LocationInfo } from '../types'
import { STORAGE_USER_LOCATION } from '../constants'

/**
 * 获取用户位置
 */
export async function getUserLocation(): Promise<LocationInfo | null> {
  try {
    // 先检查是否已授权
    const setting = await Taro.getSetting()
    if (setting.authSetting['scope.userLocation'] === true) {
      const loc = await Taro.getLocation({ type: 'gcj02' })
      const info: LocationInfo = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        address: `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`
      }
      // 缓存位置信息
      Taro.setStorageSync(STORAGE_USER_LOCATION, info)
      return info
    }

    // 尝试请求授权
    try {
      await Taro.authorize({ scope: 'scope.userLocation' })
      const loc = await Taro.getLocation({ type: 'gcj02' })
      const info: LocationInfo = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        address: `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`
      }
      Taro.setStorageSync(STORAGE_USER_LOCATION, info)
      return info
    } catch {
      // 用户拒绝授权，返回缓存的位置或 null
      const cached = Taro.getStorageSync(STORAGE_USER_LOCATION) as LocationInfo | null
      return cached
    }
  } catch (error) {
    console.error('获取位置失败:', error)
    const cached = Taro.getStorageSync(STORAGE_USER_LOCATION) as LocationInfo | null
    return cached
  }
}

/**
 * 选择位置（用于创建活动时选择球场地址）
 */
export async function chooseLocation(): Promise<LocationInfo | null> {
  return new Promise((resolve) => {
    Taro.chooseLocation({
      success: (res) => {
        const info: LocationInfo = {
          name: res.name,
          address: res.address,
          latitude: res.latitude,
          longitude: res.longitude
        }
        resolve(info)
      },
      fail: (err) => {
        if (err.errMsg && !err.errMsg.includes('cancel')) {
          Taro.showToast({ title: '选择地址失败', icon: 'none' })
        }
        resolve(null)
      }
    })
  })
}
