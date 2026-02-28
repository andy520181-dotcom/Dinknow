import { View, Text, ScrollView, Input, Button, Picker, Image } from '@tarojs/components'
import { useState, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { initCloud } from '../../services/cloud'
import { login, getProfile, updateProfile } from '../../services/user'
import { getUserActivities } from '../../services/activity'
import { User, Activity } from '../../types'
import './index.scss'

const GENDER_OPTIONS = ['保密', '男', '女']
const DUPR_LEVELS = ['1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.0+']

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [nickName, setNickName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [gender, setGender] = useState<0 | 1 | 2>(0)
  const [duprLevel, setDuprLevel] = useState('2.0')
  const [myCreated, setMyCreated] = useState<Activity[]>([])
  const [myJoined, setMyJoined] = useState<Activity[]>([])
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'created' | 'joined'>('created')
  
  const initializedRef = useRef(false)

  // 加载用户信息和活动
  const loadUserAndActivities = async () => {
    try {
      const loginRes = await login()
      const openid = loginRes?.openid
      
      if (openid) {
        const profile = await getProfile(openid)
        if (profile) {
          setUser(profile)
          setNickName(profile.nickName || '')
          setAvatarUrl(profile.avatarUrl || '')
          setGender(profile.gender ?? 0)
          setDuprLevel(profile.duprLevel || '2.0')
        } else {
          setUser(null)
          setNickName('')
          setAvatarUrl('')
          setGender(0)
          setDuprLevel('2.0')
        }
      }

      const activities = await getUserActivities()
      setMyCreated(Array.isArray(activities.created) ? activities.created : [])
      setMyJoined(Array.isArray(activities.joined) ? activities.joined : [])
    } catch (error) {
      console.error('加载用户信息失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  // 初始化
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    // 延迟初始化
    const timer = setTimeout(() => {
      initCloud()
      loadUserAndActivities().catch(console.error)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // 选择头像
  const handleChooseAvatar = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const path = res.tempFilePaths?.[0]
        if (!path) return
        
        try {
          const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
          const uploadRes = await Taro.cloud.uploadFile({
            cloudPath,
            filePath: path
          })
          setAvatarUrl(uploadRes.fileID)
        } catch (error) {
          console.error('上传头像失败:', error)
          Taro.showToast({ title: '上传失败', icon: 'none' })
        }
      },
      fail: (err) => {
        if (err.errMsg && !err.errMsg.includes('cancel')) {
          Taro.showToast({ title: '选择图片失败', icon: 'none' })
        }
      }
    })
  }

  // 保存
  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await updateProfile({
        nickName: nickName.trim() || '微信用户',
        avatarUrl: avatarUrl || user?.avatarUrl,
        gender,
        duprLevel
      })

      if (result?.success === false) {
        Taro.showToast({ title: result.message || '保存失败', icon: 'none' })
        return
      }

      Taro.showToast({ title: '保存成功', icon: 'success' })
      loadUserAndActivities()
    } catch (error: any) {
      Taro.showToast({ title: error.errMsg || error.message || '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  // 活动状态文本
  const getActivityStatus = (activity: Activity) => {
    if (!activity.startDate || !activity.startTime) return '待开始'
    const time = new Date(`${activity.startDate} ${activity.startTime}`).getTime()
    return time > Date.now() ? '待开始' : '已结束'
  }

  return (
    <View className='profile-page'>
      <View className='profile-card'>
        <View className='avatar-wrap' onTap={handleChooseAvatar}>
          {avatarUrl ? (
            <Image className='avatar' src={avatarUrl} mode='aspectFill' />
          ) : (
            <View className='avatar-placeholder'>
              <Text>点击上传头像</Text>
            </View>
          )}
        </View>

        <View className='form'>
          <View className='form-item'>
            <Text className='label'>昵称</Text>
            <Input
              className='input'
              placeholder='请输入昵称'
              value={nickName}
              onInput={(e) => setNickName(e.detail.value)}
            />
          </View>

          <View className='form-item'>
            <Text className='label'>性别</Text>
            <Picker
              mode='selector'
              range={GENDER_OPTIONS}
              value={gender}
              onChange={(e) => setGender(Number(e.detail.value) as 0 | 1 | 2)}
            >
              <View className='picker'>{GENDER_OPTIONS[gender]}</View>
            </Picker>
          </View>

          <View className='form-item'>
            <Text className='label'>DUPR 水平</Text>
            <Picker
              mode='selector'
              range={DUPR_LEVELS}
              value={DUPR_LEVELS.indexOf(duprLevel) >= 0 ? DUPR_LEVELS.indexOf(duprLevel) : 0}
              onChange={(e) => setDuprLevel(DUPR_LEVELS[Number(e.detail.value)] ?? '2.0')}
            >
              <View className='picker'>{duprLevel}</View>
            </Picker>
          </View>
        </View>

        <Button className='save-btn' disabled={saving} onTap={handleSave}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </View>

      <View className='section'>
        <View className='tabs'>
          <View
            className={'tab ' + (tab === 'created' ? 'active' : '')}
            onTap={() => setTab('created')}
          >
            <Text>我发起的</Text>
          </View>
          <View
            className={'tab ' + (tab === 'joined' ? 'active' : '')}
            onTap={() => setTab('joined')}
          >
            <Text>我参与的</Text>
          </View>
        </View>

        <ScrollView className='activity-list' scrollY enableFlex>
          {(tab === 'created' ? myCreated : myJoined).length === 0 ? (
            <View className='empty'><Text>暂无记录</Text></View>
          ) : (
            (tab === 'created' ? myCreated : myJoined).map((activity) => (
              <View key={activity._id} className='activity-item'>
                <Text className='item-title'>{activity.title}</Text>
                <Text className='item-meta'>
                  {activity.startDate} {activity.startTime} · {activity.address}
                </Text>
                <Text className='item-status'>{getActivityStatus(activity)}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  )
}
