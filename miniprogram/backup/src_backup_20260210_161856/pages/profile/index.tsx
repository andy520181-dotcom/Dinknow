import { View, Text, ScrollView, Input, Button, Picker, Image } from '@tarojs/components'
import { useState, useCallback, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
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
  const initFlagRef = useRef(false)

  const loadUserAndActivities = useCallback(async () => {
    try {
      const [loginRes, activitiesRes] = await Promise.all([
        Taro.cloud.callFunction({ name: 'login' }),
        Taro.cloud.callFunction({ name: 'getUserActivities' })
      ])
      const loginResult = (loginRes.result as any) || {}
      const openid = loginResult.openid
      const profileRes = openid ? await Taro.cloud.callFunction({ name: 'getProfile', data: { openid } }) : null
      const profile = (profileRes?.result as any)?.profile ?? null
      if (profile) {
        setUser(profile)
        setNickName(profile.nickName || '')
        setAvatarUrl(profile.avatarUrl || '')
        setGender(Number(profile.gender) as 0 | 1 | 2)
        setDuprLevel(profile.duprLevel || '2.0')
      } else {
        setUser(null)
        setNickName('')
        setAvatarUrl('')
        setGender(0)
        setDuprLevel('2.0')
      }
      const data = (activitiesRes.result as any) ?? {}
      setMyCreated(Array.isArray(data.created) ? data.created : [])
      setMyJoined(Array.isArray(data.joined) ? data.joined : [])
    } catch (e) {
      console.error(e)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }, [])

  // 使用 useEffect 替代 useLoad，避免 Taro hooks 在 iOS 真机上的栈溢出问题
  useEffect(() => {
    if (initFlagRef.current) return
    initFlagRef.current = true
    
    // 延迟执行，避免在模块求值阶段调用 Taro API
    const timer = setTimeout(() => {
      loadUserAndActivities().catch(e => {
        console.error('loadUserAndActivities error', e)
      })
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [loadUserAndActivities])

  const onChooseAvatar = () => {
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
        } catch (e) {
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

  const onSave = async () => {
    setSaving(true)
    try {
      const res = await Taro.cloud.callFunction({
        name: 'updateProfile',
        data: {
          nickName: nickName.trim() || '微信用户',
          avatarUrl: avatarUrl || user?.avatarUrl,
          gender,
          duprLevel
        }
      })
      const result = (res.result as any) || {}
      if (result.success === false) {
        Taro.showToast({ title: result.message || '保存失败', icon: 'none' })
        return
      }
      Taro.showToast({ title: '保存成功', icon: 'success' })
      loadUserAndActivities()
    } catch (e: any) {
      Taro.showToast({ title: e.errMsg || e.message || '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const statusText = (a: Activity) => {
    if (!a.startDate || !a.startTime) return '待开始'
    const t = new Date(`${a.startDate} ${a.startTime}`).getTime()
    return t > Date.now() ? '待开始' : '已结束'
  }

  return (
    <View className='profile-page'>
      <View className='profile-card'>
        <View className='avatar-wrap' onTap={onChooseAvatar}>
          {avatarUrl ? (
            <Image className='avatar' src={avatarUrl} mode='aspectFill' />
          ) : (
            <View className='avatar-placeholder'><Text>点击上传头像</Text></View>
          )}
        </View>
        <View className='form'>
          <View className='form-item'>
            <Text className='label'>昵称</Text>
            <Input
              className='input'
              placeholder='请输入昵称'
              value={nickName}
              onInput={e => setNickName(e.detail.value)}
            />
          </View>
          <View className='form-item'>
            <Text className='label'>性别</Text>
            <Picker
              mode='selector'
              range={GENDER_OPTIONS}
              value={gender}
              onChange={e => setGender(Number(e.detail.value) as 0 | 1 | 2)}
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
              onChange={e => setDuprLevel(DUPR_LEVELS[Number(e.detail.value)] ?? '2.0')}
            >
              <View className='picker'>{duprLevel}</View>
            </Picker>
          </View>
        </View>
        <Button className='save-btn' disabled={saving} onTap={onSave}>{saving ? '保存中...' : '保存'}</Button>
      </View>

      <View className='section'>
        <View className='tabs'>
          <View className={'tab ' + (tab === 'created' ? 'active' : '')} onTap={() => setTab('created')}>
            <Text>我发起的</Text>
          </View>
          <View className={'tab ' + (tab === 'joined' ? 'active' : '')} onTap={() => setTab('joined')}>
            <Text>我参与的</Text>
          </View>
        </View>
        <ScrollView className='activity-list' scrollY enableFlex>
          {(tab === 'created' ? myCreated : myJoined).length === 0 ? (
            <View className='empty'><Text>暂无记录</Text></View>
          ) : (
            (tab === 'created' ? myCreated : myJoined).map(a => (
              <View key={a._id} className='activity-item'>
                <Text className='item-title'>{a.title}</Text>
                <Text className='item-meta'>{a.startDate} {a.startTime} · {a.address}</Text>
                <Text className='item-status'>{statusText(a)}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>

    </View>
  )
}
