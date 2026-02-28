import { Activity } from '../types';

export const MOCK_USER_ID = 'mock-user-12345';

export const MOCK_USER_PROFILE = {
    id: MOCK_USER_ID,
    name: '体验用户',
    phone: '+86 13800138000',
    gender: 'male',
    avatar: 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff',
    dupr: '3.5',
    location: '上海市',
    latitude: 31.2304,
    longitude: 121.4737
};

export const MOCK_ACTIVITIES: Activity[] = [
    {
        id: 'mock-1',
        title: '周五晚快乐匹克球',
        location: '静安体育中心',
        time: '19:00 - 21:00',
        currentParticipants: 4,
        maxParticipants: 8,
        price: '50',
        level: '3.0',
        levelColor: 'bg-yellow-100 text-yellow-800',
        status: 'open',
        type: 'social',
        isCreator: false
    },
    {
        id: 'mock-2',
        title: '新手入门教学',
        location: '源深体育中心',
        time: '10:00 - 12:00',
        currentParticipants: 2,
        maxParticipants: 10,
        price: '80',
        level: '2.0-2.5',
        levelColor: 'bg-green-100 text-green-800',
        status: 'open',
        type: 'training',
        isCreator: false
    },
    {
        id: 'mock-3',
        title: '高级进阶赛',
        location: '前滩体育公园',
        time: '14:00 - 17:00',
        currentParticipants: 8,
        maxParticipants: 8,
        price: '60',
        level: '4.0',
        levelColor: 'bg-red-100 text-red-800',
        status: 'full',
        type: 'match',
        isCreator: true
    }
];
