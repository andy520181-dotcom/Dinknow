import { View, Text, ScrollView, Input, Button } from '@tarojs/components'
import { useState, useRef, useEffect } from 'react'
import Taro from '@tarojs/taro'
import ActivityCard from '../../components/ActivityCard'
import { Activity } from '../../types'
import { LocationInfo } from '../../types'
import { CLOUD_ENV, STORAGE_AGREEMENT_AGREED, STORAGE_USER_LOCATION } from '../../constants'
import './index.scss'

// 全局标志，避免重复初始化云开发
let cloudInited = false

// 在首页加载时初始化云开发，避免在 app 入口调用 Taro 导致真机栈溢出
function initCloudOnce() {
  if (cloudInited) return
  if (typeof Taro === 'undefined' || !Taro.cloud) return
  try {
    Taro.cloud.init({ env: CLOUD_ENV, traceUser: true })
    cloudInited = true
  } catch (e) {
    console.error('initCloudOnce error', e)
  }
}

export default function Index() {
  const [location, setLocation] = useState<LocationInfo | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [agreed, setAgreed] = useState(false)
  // 初始为 true，在 useEffect 里再根据 storage 决定是否展示，避免在 useState 初始化时调用 Taro API 导致真机栈溢出
  const [showAgreement, setShowAgreement] = useState(true)
  const [agreeChecked, setAgreeChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // 使用 ref 存储最新值，避免闭包问题
  const locationRef = useRef<LocationInfo | null>(null)
  const searchKeywordRef = useRef('')
  const initFlagRef = useRef(false)
  
  // 同步 ref 值（延迟执行，避免在初始化阶段触发）
  useEffect(() => {
    locationRef.current = location
  }, [location])
  
  useEffect(() => {
    searchKeywordRef.current = searchKeyword
  }, [searchKeyword])

  // 移除 useCallback，改用普通函数，避免依赖循环导致栈溢出
  const loadActivities = async () => {
    setLoading(true)
    try {
      const res = await Taro.cloud.callFunction({
        name: 'getActivities',
        data: {
          keyword: searchKeywordRef.current || undefined,
          latitude: locationRef.current?.latitude,
          longitude: locationRef.current?.longitude
        }
      })
      const result = (res.result as any) || {}
      const data = result.list ?? []
      setActivities(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('getActivities fail', e)
      Taro.showToast({ title: '加载失败', icon: 'none' })
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  // 移除 useCallback，改用普通函数
  const requestLocationAndLoad = async () => {
    try {
      const setting = await Taro.getSetting()
      if (setting.authSetting['scope.userLocation'] === true) {
        const loc = await Taro.getLocation({ type: 'gcj02' })
        const info: LocationInfo = {
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`
        }
        setLocation(info)
        Taro.setStorageSync(STORAGE_USER_LOCATION, info)
        await loadActivities()
        return
      }
      try {
        await Taro.authorize({ scope: 'scope.userLocation' })
        const loc = await Taro.getLocation({ type: 'gcj02' })
        const info: LocationInfo = {
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`
        }
        setLocation(info)
        Taro.setStorageSync(STORAGE_USER_LOCATION, info)
        await loadActivities()
      } catch {
        const cached = Taro.getStorageSync(STORAGE_USER_LOCATION)
        if (cached) setLocation(cached)
        await loadActivities()
        Taro.showModal({
          title: '需要位置权限',
          content: '需要位置权限才能查看附近活动，可在设置中开启',
          confirmText: '去设置',
          success: (r) => r.confirm && Taro.openSetting()
        })
      }
    } catch (e) {
      console.error(e)
      const cached = Taro.getStorageSync(STORAGE_USER_LOCATION)
      if (cached) setLocation(cached)
      await loadActivities()
    }
  }

  const onConfirmAgreement = () => {
    if (!agreeChecked) {
      Taro.showToast({ title: '请先同意用户协议与隐私政策', icon: 'none' })
      return
    }
    Taro.setStorageSync(STORAGE_AGREEMENT_AGREED, true)
    Taro.removeStorageSync('dinknow_need_agreement')
    setAgreed(true)
    setShowAgreement(false)
    requestLocationAndLoad()
  }

  // 使用 useEffect 替代 useLoad，完全避免 Taro hooks 在 iOS 真机上的栈溢出问题
  useEffect(() => {
    // 确保只初始化一次
    if (initFlagRef.current) return
    initFlagRef.current = true
    
    // 分阶段初始化，避免一次性执行太多逻辑导致栈溢出
    // 第一阶段：延迟 1500ms 后初始化云开发（增加延迟时间）
    const timer1 = setTimeout(() => {
      initCloudOnce()
    }, 1500)
    
    // 第二阶段：延迟 2500ms 后检查协议状态（不立即调用位置 API）
    let timer3: NodeJS.Timeout | null = null
    const timer2 = setTimeout(() => {
      try {
        const stored = Taro.getStorageSync(STORAGE_AGREEMENT_AGREED)
        if (stored) {
          setAgreed(true)
          setShowAgreement(false)
          // 第三阶段：延迟 800ms 后再请求位置，避免在初始化阶段触发递归
          timer3 = setTimeout(() => {
            requestLocationAndLoad().catch(e => {
              console.error('requestLocationAndLoad error', e)
            })
          }, 800)
        } else {
          setShowAgreement(true)
        }
      } catch (e) {
        console.error('checkAgreement error', e)
        setShowAgreement(true)
      }
    }, 2500)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      if (timer3) clearTimeout(timer3)
    }
  }, []) // 空依赖数组，确保只执行一次

  const onSearchConfirm = () => {
    loadActivities()
  }

  const onJoin = async (activity: Activity) => {
    if (!activity._id) return
    try {
      const res = await Taro.cloud.callFunction({
        name: 'joinActivity',
        data: { activityId: activity._id }
      })
      const result = (res.result as any) || {}
      if (result.success === false) {
        Taro.showToast({ title: result.message || '加入失败', icon: 'none' })
        return
      }
      Taro.showToast({ title: '加入成功', icon: 'success' })
      loadActivities()
    } catch (e: any) {
      Taro.showToast({ title: e.errMsg || e.message || '加入失败', icon: 'none' })
    }
  }

  const displayList = activities

  return (
    <View className='index-page'>
      {/* 协议弹窗：未同意时展示 */}
      {showAgreement && (
        <View className='agreement-mask'>
          <View className='agreement-box'>
            <Text className='agreement-title'>用户协议与隐私政策</Text>
            <Text className='agreement-desc'>请阅读并同意《用户协议》和《隐私政策》后方可继续使用。我们会收集位置信息用于展示附近活动与计算距离，头像与昵称用于展示发起人信息，仅用于本小程序服务范围内使用与存储。</Text>
            <View className='agreement-check' onClick={() => setAgreeChecked(!agreeChecked)}>
              <Text className='check-icon'>{agreeChecked ? '✓' : ''}</Text>
              <Text className='check-label'>我已阅读并同意《用户协议》和《隐私政策》</Text>
            </View>
            <Button className='agreement-btn' onTap={onConfirmAgreement}>同意并继续</Button>
          </View>
        </View>
      )}

      <View className='header'>
        <View className='title-bar'>
          <Text className='page-title'>活动广场</Text>
        </View>
        <View className='top-row'>
          <View className='location-tag' onTap={requestLocationAndLoad}>
            <Text className='location-icon'>📍</Text>
            <Text className='location-text'>{location?.address || '点击获取位置'}</Text>
          </View>
        </View>
        <View className='search-row'>
          <Input
            className='search-input'
            placeholder='搜索活动关键词'
            value={searchKeyword}
            onInput={e => setSearchKeyword(e.detail.value)}
            onConfirm={onSearchConfirm}
          />
        </View>
      </View>

      <ScrollView
        className='activity-list'
        scrollY
        enableFlex
        refresherEnabled
        onRefresherRefresh={async () => {
          await loadActivities()
          Taro.stopPullDownRefresh()
        }}
      >
        {loading && activities.length === 0 ? (
          <View className='empty'><Text>加载中...</Text></View>
        ) : displayList.length === 0 ? (
          <View className='empty'><Text>暂无活动</Text></View>
        ) : (
          displayList.map((a, idx) => (
            <ActivityCard key={a._id || `act-${idx}`} activity={a} onJoin={() => onJoin(a)} />
          ))
        )}
      </ScrollView>

    </View>
  )
}
