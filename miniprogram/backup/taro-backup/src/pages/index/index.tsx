import { View, Text, ScrollView, Input, Button } from '@tarojs/components'
import { useState, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import ActivityCard from '../../components/ActivityCard'
import { Activity } from '../../types'
import { LocationInfo } from '../../types'
import { initCloud } from '../../services/cloud'
import { getActivities, joinActivity } from '../../services/activity'
import { getUserLocation } from '../../utils/location'
import { hasAgreedToTerms, setAgreedToTerms } from '../../utils/storage'
import './index.scss'

export default function Index() {
  const [location, setLocation] = useState<LocationInfo | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showAgreement, setShowAgreement] = useState(false)
  const [agreeChecked, setAgreeChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const initializedRef = useRef(false)
  const locationRef = useRef<LocationInfo | null>(null)
  const searchKeywordRef = useRef('')

  // 同步 ref 值
  useEffect(() => {
    locationRef.current = location
  }, [location])

  useEffect(() => {
    searchKeywordRef.current = searchKeyword
  }, [searchKeyword])

  // 加载活动列表
  const loadActivities = async () => {
    setLoading(true)
    try {
      const list = await getActivities({
        keyword: searchKeywordRef.current || undefined,
        latitude: locationRef.current?.latitude,
        longitude: locationRef.current?.longitude
      })
      setActivities(Array.isArray(list) ? list : [])
    } catch (error) {
      console.error('加载活动失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  // 请求位置并加载活动
  const requestLocationAndLoad = async () => {
    try {
      const loc = await getUserLocation()
      if (loc) {
        setLocation(loc)
        await loadActivities()
      } else {
        // 没有位置信息，仍然加载活动（不按位置筛选）
        await loadActivities()
        Taro.showModal({
          title: '需要位置权限',
          content: '需要位置权限才能查看附近活动，可在设置中开启',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              Taro.openSetting()
            }
          }
        })
      }
    } catch (error) {
      console.error('请求位置失败:', error)
      await loadActivities()
    }
  }

  // 初始化
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    // 延迟初始化，避免在模块求值阶段执行
    const timer = setTimeout(() => {
      // 初始化云开发
      initCloud()

      // 检查协议状态
      if (!hasAgreedToTerms()) {
        setShowAgreement(true)
      } else {
        // 已同意协议，请求位置并加载活动
        setTimeout(() => {
          requestLocationAndLoad().catch(console.error)
        }, 500)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // 确认协议
  const handleAgree = () => {
    if (!agreeChecked) {
      Taro.showToast({ title: '请先同意用户协议与隐私政策', icon: 'none' })
      return
    }
    setAgreedToTerms(true)
    setShowAgreement(false)
    requestLocationAndLoad().catch(console.error)
  }

  // 搜索
  const handleSearch = () => {
    loadActivities()
  }

  // 加入活动
  const handleJoin = async (activity: Activity) => {
    if (!activity._id) return
    
    try {
      const result = await joinActivity(activity._id)
      if (result?.success === false) {
        Taro.showToast({ title: result.message || '加入失败', icon: 'none' })
        return
      }
      Taro.showToast({ title: '加入成功', icon: 'success' })
      loadActivities()
    } catch (error: any) {
      Taro.showToast({ title: error.errMsg || error.message || '加入失败', icon: 'none' })
    }
  }

  // 下拉刷新
  const handleRefresh = async () => {
    await loadActivities()
    Taro.stopPullDownRefresh()
  }

  return (
    <View className='index-page'>
      {/* 协议弹窗 */}
      {showAgreement && (
        <View className='agreement-mask'>
          <View className='agreement-box'>
            <Text className='agreement-title'>用户协议与隐私政策</Text>
            <Text className='agreement-desc'>
              请阅读并同意《用户协议》和《隐私政策》后方可继续使用。
              我们会收集位置信息用于展示附近活动与计算距离，头像与昵称用于展示发起人信息，
              仅用于本小程序服务范围内使用与存储。
            </Text>
            <View className='agreement-check' onClick={() => setAgreeChecked(!agreeChecked)}>
              <Text className='check-icon'>{agreeChecked ? '✓' : ''}</Text>
              <Text className='check-label'>我已阅读并同意《用户协议》和《隐私政策》</Text>
            </View>
            <Button className='agreement-btn' onTap={handleAgree}>同意并继续</Button>
          </View>
        </View>
      )}

      {/* 页面内容 */}
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
            onInput={(e) => setSearchKeyword(e.detail.value)}
            onConfirm={handleSearch}
          />
        </View>
      </View>

      <ScrollView
        className='activity-list'
        scrollY
        enableFlex
        refresherEnabled
        onRefresherRefresh={handleRefresh}
      >
        {loading && activities.length === 0 ? (
          <View className='empty'><Text>加载中...</Text></View>
        ) : activities.length === 0 ? (
          <View className='empty'><Text>暂无活动</Text></View>
        ) : (
          activities.map((activity, idx) => (
            <ActivityCard
              key={activity._id || `act-${idx}`}
              activity={activity}
              onJoin={() => handleJoin(activity)}
            />
          ))
        )}
      </ScrollView>
    </View>
  )
}
