import { CLOUD_ENV } from '../constants'

let cloudInitialized = false
let initPromise: Promise<void> | null = null

/**
 * 初始化云开发（只初始化一次，避免重复调用）
 */
export function initCloud() {
  // 如果已经初始化，直接返回
  if (cloudInitialized) {
    return Promise.resolve()
  }

  // 如果正在初始化，返回同一个 Promise
  if (initPromise) {
    return initPromise
  }

  // 创建初始化 Promise
  initPromise = new Promise<void>((resolve, reject) => {
    try {
      // #ifdef MP-WEIXIN
      if (typeof wx === 'undefined') {
        const error = new Error('wx 对象不存在')
        console.error('云开发初始化失败:', error)
        cloudInitialized = true
        reject(error)
        return
      }
      
      if (!wx.cloud) {
        const error = new Error('wx.cloud 不存在')
        console.error('云开发初始化失败:', error)
        cloudInitialized = true
        reject(error)
        return
      }
      
      // 初始化云开发
      wx.cloud.init({
        env: CLOUD_ENV,
        traceUser: true
      })
      
      // 验证初始化是否成功
      if (wx.cloud && wx.cloud.uploadFile) {
        cloudInitialized = true
        console.log('云开发初始化成功')
        resolve()
      } else {
        const error = new Error('云开发初始化后，uploadFile 方法不存在')
        console.error('云开发初始化失败:', error)
        cloudInitialized = true
        reject(error)
      }
      // #endif

      // #ifndef MP-WEIXIN
      cloudInitialized = true
      resolve()
      // #endif
    } catch (error: any) {
      console.error('云开发初始化失败:', error?.message || 'Unknown error', error)
      cloudInitialized = true // 即使失败也标记为已初始化，避免重复尝试
      reject(error)
    }
  })

  return initPromise
}

/**
 * 调用云函数（统一入口）
 */
export async function callCloudFunction(name: string, data?: any): Promise<any> {
  // 确保云开发已初始化
  await initCloud()

  try {
    // #ifdef MP-WEIXIN
    if (typeof wx !== 'undefined' && wx.cloud) {
      const res = await wx.cloud.callFunction({ name, data })
      const result = (res as any).result
      // 部分环境下云函数报错时仍返回 200，result 内带 errCode
      if (result && typeof result.errCode === 'number' && result.errCode !== 0) {
        const errMsg = result.errMsg || result.message || `错误码: ${result.errCode}`
        console.error(`云函数 ${name} 返回错误:`, result.errCode, errMsg)
        const e = new Error(errMsg) as Error & { errCode?: number }
        e.errCode = result.errCode
        throw e
      }
      return result
    }
    throw new Error('云开发未初始化')
    // #endif

    // #ifndef MP-WEIXIN
    throw new Error('云开发仅在微信小程序中可用')
    // #endif
  } catch (error: any) {
    console.error(`云函数 ${name} 调用失败:`, error?.errCode, error?.errMsg || error?.message, error)
    throw error
  }
}

/**
 * 将云存储 fileID 转换为可用的图片 URL
 * 如果已经是 http/https URL，直接返回
 * 如果是 cloud:// 格式，返回原值（微信小程序支持直接使用）
 * 如果需要临时 URL，可以使用 getTempFileURL
 */
export function getCloudImageUrl(fileID: string | null | undefined): string {
  if (!fileID) return ''
  
  // 如果已经是 http/https URL，直接返回
  if (fileID.startsWith('http://') || fileID.startsWith('https://')) {
    return fileID
  }
  
  // 如果是 cloud:// 格式，直接返回（微信小程序支持）
  if (fileID.startsWith('cloud://')) {
    return fileID
  }
  
  // 其他情况，返回原值
  return fileID
}

/**
 * 批量获取云存储文件的临时下载 URL
 * 用于需要临时访问权限的场景
 */
export async function getTempFileURLs(fileIDs: string[]): Promise<Record<string, string>> {
  await initCloud()
  
  if (!fileIDs || fileIDs.length === 0) {
    return {}
  }
  
  try {
    // #ifdef MP-WEIXIN
    if (typeof wx !== 'undefined' && wx.cloud && wx.cloud.getTempFileURL) {
      const res = await wx.cloud.getTempFileURL({
        fileList: fileIDs
      })
      
      const urlMap: Record<string, string> = {}
      if (res.fileList) {
        res.fileList.forEach((item: any) => {
          if (item.tempFileURL) {
            urlMap[item.fileID] = item.tempFileURL
          } else {
            // 如果获取失败，使用原 fileID
            urlMap[item.fileID] = item.fileID
          }
        })
      }
      return urlMap
    }
    // #endif
    
    // 如果不可用，返回原 fileID 映射
    const urlMap: Record<string, string> = {}
    fileIDs.forEach(fileID => {
      urlMap[fileID] = fileID
    })
    return urlMap
  } catch (error: any) {
    console.error('获取临时文件 URL 失败:', error)
    // 失败时返回原 fileID 映射
    const urlMap: Record<string, string> = {}
    fileIDs.forEach(fileID => {
      urlMap[fileID] = fileID
    })
    return urlMap
  }
}
