import { View, Text, Button } from '@tarojs/components'
import { Activity } from '../../types'
import './index.scss'

interface Props {
  activity: Activity
  onJoin: () => void
}

export default function ActivityCard({ activity, onJoin }: Props) {
  const current = activity.currentCount ?? 0
  const max = activity.maxParticipants
  const feeText = activity.fee === 0 ? '免费' : `¥${activity.fee}`
  const dateTime = `${activity.startDate} ${activity.startTime}`

  return (
    <View className='activity-card'>
      <Text className='activity-title'>{activity.title}</Text>
      
      <View className='activity-row'>
        <Text className='icon'>📍</Text>
        <Text className='activity-address'>{activity.address}</Text>
      </View>
      
      <View className='activity-row'>
        <Text className='icon'>🕐</Text>
        <Text className='activity-datetime'>{dateTime}</Text>
      </View>
      
      <View className='activity-row'>
        <Text className='icon'>👥</Text>
        <Text className='activity-count'>已报名 {current}/{max}</Text>
      </View>
      
      <View className='activity-row activity-fee'>
        <Text className='icon'>¥</Text>
        <Text className='activity-fee-text'>{feeText}</Text>
      </View>
      
      {activity.hostName && (
        <View className='activity-host'>
          <Text className='host-label'>发起人：</Text>
          <Text className='host-name'>{activity.hostName}</Text>
        </View>
      )}
      
      {activity.description && (
        <View className='activity-description'>
          <Text>{activity.description}</Text>
        </View>
      )}
      
      <Button className='join-btn' onTap={onJoin}>
        加入
      </Button>
    </View>
  )
}
