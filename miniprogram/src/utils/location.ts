import type { LocationInfo } from '../types'
import { STORAGE_USER_LOCATION } from '../constants'
import { callCloudFunction } from '../services/cloud'

/** 逆地理编码结果（云函数 reverseGeocode 返回） */
interface ReverseGeocodeResult {
  ok: boolean
  address: string | null
  city: string | null
  district?: string | null
  shortAddress?: string | null
}

/**
 * 通过云函数逆地理编码：坐标转地址（不弹出选择位置界面）
 */
async function getAddressFromCoords(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
  try {
    const result = await callCloudFunction('reverseGeocode', { latitude, longitude }) as ReverseGeocodeResult
    console.log('[getAddressFromCoords] 云函数返回:', result)
    if (result?.ok) {
      console.log('[getAddressFromCoords] 成功获取地址:', result.address, '城市:', result.city)
      return result
    } else {
      console.warn('[getAddressFromCoords] 云函数返回 ok: false', result)
      return null
    }
  } catch (error) {
    console.error('[getAddressFromCoords] 云函数调用失败:', error)
    return null
  }
}

/**
 * 从地址字符串中提取城市名称
 */
function extractCityFromAddress(address: string): string | null {
  if (!address) return null
  const cityPattern = /([^省自治区]+?[市县区])/
  const match = address.match(cityPattern)
  if (match && match[1]) return match[1]
  if (address.length > 2) return address.substring(0, 3)
  return null
}

/**
 * 获取用户位置（仅 getLocation + 逆地理编码，不弹出选择位置界面）
 * 用户允许位置授权后，自动获取实时地址并写入 city/address，同步显示在广场左上角。
 */
export async function getUserLocation(): Promise<LocationInfo | null> {
  try {
    const loc = await uni.getLocation({ type: 'gcj02' })
    let address: string = `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`
    let city: string | undefined

    const geo = await getAddressFromCoords(loc.latitude, loc.longitude)
    console.log('[getUserLocation] 逆地理编码结果:', geo)
    if (geo) {
      if (geo.address) {
        address = geo.address
        console.log('[getUserLocation] 设置地址:', address)
      }
      if (geo.city) {
        city = geo.city
        console.log('[getUserLocation] 设置城市:', city)
      } else if (geo.shortAddress) {
        city = geo.shortAddress
        console.log('[getUserLocation] 设置短地址为城市:', city)
      }
    } else {
      console.warn('[getUserLocation] 逆地理编码失败，使用坐标作为地址')
    }

    const info: LocationInfo = {
      latitude: loc.latitude,
      longitude: loc.longitude,
      address,
      city,
    }
    uni.setStorageSync(STORAGE_USER_LOCATION, info)
    return info
  } catch (error: any) {
    // 错误处理：显示具体错误信息，帮助排查"隐私协议"问题
    console.error('获取位置失败:', error?.message || 'Unknown error')

    // 检查是否是隐私权限问题 (errno 104 = 隐私未授权, 101/105 = 拒绝地理位置)
    const errStr = JSON.stringify(error || {})
    if (errStr.includes('errno') && (errStr.includes('104') || errStr.includes('privacy'))) {
      uni.showModal({
        title: '需要隐私授权',
        content: '请在小程序右上角"..."设置中开启位置权限，或确保后台已配置《用户隐私保护指引》',
        showCancel: false
      })
    } else if (error?.errMsg?.includes('auth deny') || error?.errMsg?.includes('authorize:fail')) {
      uni.showToast({ title: '已拒绝位置授权', icon: 'none' })
    } else {
      // 其他错误，显示部分信息方便调试
      uni.showToast({ title: '定位失败: ' + (error?.errMsg || '未知错误'), icon: 'none' })
    }

    return uni.getStorageSync(STORAGE_USER_LOCATION) as LocationInfo | null
  }
}

/**
 * 获取用户位置并提取城市名称（通过选择位置）
 */
export async function getUserLocationWithCity(): Promise<LocationInfo | null> {
  try {
    // 先获取位置坐标
    const loc = await uni.getLocation({ type: 'gcj02' })

    // 使用 chooseLocation 获取详细地址（包含城市信息）
    // 注意：这会弹出位置选择界面，用户可以选择或确认
    return new Promise((resolve) => {
      uni.chooseLocation({
        success: (res) => {
          // 从地址中提取城市名称
          const cityName = extractCityFromAddress(res.address) ||
            extractCityFromAddress(res.name) ||
            null

          const info: LocationInfo = {
            name: res.name,
            address: res.address,
            city: cityName || undefined,
            latitude: res.latitude,
            longitude: res.longitude,
          }
          uni.setStorageSync(STORAGE_USER_LOCATION, info)
          resolve(info)
        },
        fail: () => {
          // 如果用户取消选择，使用 getLocation 的结果
          const info: LocationInfo = {
            latitude: loc.latitude,
            longitude: loc.longitude,
            address: `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`,
          }
          uni.setStorageSync(STORAGE_USER_LOCATION, info)
          resolve(info)
        }
      })
    })
  } catch (error: any) {
    console.error('选择位置失败:', error?.message || 'Unknown error')
    return uni.getStorageSync(STORAGE_USER_LOCATION) as LocationInfo | null
  }
}

/**
 * 选择位置（用于创建活动时选择球场地址）
 */
export function chooseLocation(): Promise<LocationInfo | null> {
  return new Promise((resolve) => {
    uni.chooseLocation({
      success: (res) => {
        resolve({
          name: res.name,
          address: res.address,
          latitude: res.latitude,
          longitude: res.longitude,
        })
      },
      fail: (err: any) => {
        if (err.errMsg && !err.errMsg.includes('cancel')) {
          uni.showToast({ title: '选择地址失败', icon: 'none' })
        }
        resolve(null)
      },
    })
  })
}
