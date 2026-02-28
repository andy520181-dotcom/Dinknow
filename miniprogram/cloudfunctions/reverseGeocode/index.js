const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 逆地理编码：根据经纬度获取地址信息
 * 使用腾讯位置服务 WebService API
 * 需在云开发控制台配置环境变量 TENCENT_MAP_KEY（腾讯地图 key）
 * 申请地址：https://lbs.qq.com/console/mykey.html
 */
exports.main = async (event, context) => {
  const { latitude, longitude } = event || {}
  if (latitude == null || longitude == null) {
    return { ok: false, address: null, city: null, district: null }
  }

  const key = process.env.TENCENT_MAP_KEY || ''
  console.log('reverseGeocode: TENCENT_MAP_KEY exists:', !!key, 'key length:', key.length)
  if (!key) {
    console.warn('reverseGeocode: TENCENT_MAP_KEY not set, return null')
    return { ok: false, address: null, city: null, district: null }
  }

  const location = `${Number(latitude)},${Number(longitude)}`
  const url = `https://apis.map.qq.com/ws/geocoder/v1/?location=${encodeURIComponent(location)}&key=${key}`

  try {
    const res = await new Promise((resolve, reject) => {
      const https = require('https')
      https.get(url, (resp) => {
        // 检查 HTTP 状态码
        if (resp.statusCode !== 200) {
          reject(new Error(`HTTP ${resp.statusCode}: ${resp.statusMessage}`))
          return
        }
        
        let data = ''
        resp.on('data', (chunk) => { data += chunk })
        resp.on('end', () => {
          try {
            const parsed = JSON.parse(data)
            resolve(parsed)
          } catch (e) {
            reject(new Error(`JSON parse error: ${e.message}, data: ${data.substring(0, 200)}`))
          }
        })
      }).on('error', (err) => {
        reject(new Error(`Network error: ${err.message}`))
      })
    })

    // 检查腾讯地图 API 返回的业务状态码
    console.log('reverseGeocode: 腾讯地图API返回 status:', res.status, 'message:', res.message)
    if (res.status !== 0) {
      console.error('reverseGeocode API error:', res.status, res.message || 'Unknown error', 'full response:', JSON.stringify(res).substring(0, 500))
      return { ok: false, address: null, city: null, district: null, error: `API error ${res.status}: ${res.message || 'Unknown'}` }
    }
    
    if (!res.result) {
      console.warn('reverseGeocode: no result in response, full response:', JSON.stringify(res).substring(0, 500))
      return { ok: false, address: null, city: null, district: null }
    }
    
    console.log('reverseGeocode: API成功，result:', JSON.stringify(res.result).substring(0, 300))

    const r = res.result
    const addr = r.address || ''
    const component = r.address_component || {}
    const city = component.city || ''
    const district = component.district || ''
    const province = component.province || ''

    // 用于显示的短地址：优先 市+区，否则 省+市
    const shortAddress = city && district
      ? `${city}${district}`
      : province && city
        ? `${province}${city}`
        : addr || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`

    return {
      ok: true,
      address: addr,
      city: city || province || null,
      district: district || null,
      province: province || null,
      shortAddress
    }
  } catch (e) {
    console.error('reverseGeocode error:', e.message || e, 'Stack:', e.stack)
    // 返回错误信息，但确保不会导致云函数本身返回 500
    return { 
      ok: false, 
      address: null, 
      city: null, 
      district: null,
      error: e.message || 'Unknown error'
    }
  }
}
