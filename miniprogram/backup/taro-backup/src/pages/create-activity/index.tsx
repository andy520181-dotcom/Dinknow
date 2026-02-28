import { View, Text, Input, Picker, Button, Textarea } from '@tarojs/components'
import { useState, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { initCloud } from '../../services/cloud'
import { createActivity } from '../../services/activity'
import { chooseLocation } from '../../utils/location'
import { LocationInfo } from '../../types'
import { STORAGE_USER_LOCATION } from '../../constants'
import './index.scss'

const MAX_PARTICIPANTS = Array.from({ length: 19 }, (_, i) => i + 2) // 2-20

export default function CreateActivity() {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState<number | undefined>()
  const [longitude, setLongitude] = useState<number | undefined>()
  const [maxParticipants, setMaxParticipants] = useState(8)
  const [isFree, setIsFree] = useState(true)
  const [fee, setFee] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const initializedRef = useRef(false)

  // 初始化
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    // 延迟初始化云开发
    const timer = setTimeout(() => {
      initCloud()

      // 加载缓存的位置信息
      try {
        const cached = Taro.getStorageSync(STORAGE_USER_LOCATION) as LocationInfo | undefined
        if (cached?.address) {
          setAddress(cached.address)
          setLatitude(cached.latitude)
          setLongitude(cached.longitude)
        }
      } catch (error) {
        console.error('加载缓存位置失败:', error)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // 选择位置
  const handleChooseLocation = async () => {
    const loc = await chooseLocation()
    if (loc) {
      setAddress(loc.address || loc.name || '')
      setLatitude(loc.latitude)
      setLongitude(loc.longitude)
    }
  }

  // 提交
  const handleSubmit = async () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入活动主题', icon: 'none' })
      return
    }
    if (!startDate || !startTime) {
      Taro.showToast({ title: '请选择日期和时间', icon: 'none' })
      return
    }
    if (!address.trim()) {
      Taro.showToast({ title: '请选择球场地址', icon: 'none' })
      return
    }
    
    const feeNum = isFree ? 0 : (parseFloat(fee) || 0)
    if (!isFree && (isNaN(feeNum) || feeNum < 0)) {
      Taro.showToast({ title: '请输入正确金额', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      const result = await createActivity({
        title: title.trim(),
        startDate,
        startTime,
        address: address.trim(),
        latitude,
        longitude,
        maxParticipants,
        fee: feeNum,
        description: description.trim() || undefined
      })

      if (result?.success === false) {
        Taro.showToast({ title: result.message || '发布失败', icon: 'none' })
        return
      }

      Taro.showToast({ title: '发布成功', icon: 'success' })
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' })
      }, 1500)
    } catch (error: any) {
      Taro.showToast({ title: error.errMsg || error.message || '发布失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className='create-page'>
      <View className='form'>
        <View className='form-item'>
          <Text className='label'>活动主题 *</Text>
          <Input
            className='input'
            placeholder='请输入活动主题'
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
          />
        </View>

        <View className='form-item'>
          <Text className='label'>活动日期 *</Text>
          <Picker mode='date' value={startDate} onChange={(e) => setStartDate(e.detail.value)}>
            <View className='picker'>{startDate || '请选择日期'}</View>
          </Picker>
        </View>

        <View className='form-item'>
          <Text className='label'>活动时间 *</Text>
          <Picker mode='time' value={startTime} onChange={(e) => setStartTime(e.detail.value)}>
            <View className='picker'>{startTime || '请选择时间'}</View>
          </Picker>
        </View>

        <View className='form-item'>
          <Text className='label'>球场地址 *</Text>
          <View className='picker address-picker' onTap={handleChooseLocation}>
            <Text className={address ? 'value' : 'placeholder'}>
              {address || '点击选择/搜索地址'}
            </Text>
          </View>
        </View>

        <View className='form-item'>
          <Text className='label'>最大参与人数</Text>
          <Picker
            mode='selector'
            range={MAX_PARTICIPANTS}
            value={MAX_PARTICIPANTS.indexOf(maxParticipants) >= 0 ? MAX_PARTICIPANTS.indexOf(maxParticipants) : 6}
            onChange={(e) => setMaxParticipants(MAX_PARTICIPANTS[Number(e.detail.value)] ?? 8)}
          >
            <View className='picker'>{maxParticipants} 人</View>
          </Picker>
        </View>

        <View className='form-item'>
          <Text className='label'>费用</Text>
          <View className='fee-row'>
            <View
              className={'fee-opt ' + (isFree ? 'active' : '')}
              onTap={() => setIsFree(true)}
            >
              <Text>免费</Text>
            </View>
            <View
              className={'fee-opt ' + (!isFree ? 'active' : '')}
              onTap={() => setIsFree(false)}
            >
              <Text>付费</Text>
            </View>
            {!isFree && (
              <Input
                className='fee-input'
                type='digit'
                placeholder='金额(元)'
                value={fee}
                onInput={(e) => setFee(e.detail.value)}
              />
            )}
          </View>
        </View>

        <View className='form-item'>
          <Text className='label'>补充说明</Text>
          <Textarea
            className='textarea'
            placeholder='选填'
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
          />
        </View>
      </View>

      <Button className='submit-btn' disabled={submitting} onTap={handleSubmit}>
        {submitting ? '发布中...' : '发布'}
      </Button>
    </View>
  )
}
