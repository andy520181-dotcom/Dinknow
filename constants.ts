import { Activity, UserActivity, UserProfile } from './types';

export const ACTIVITIES: Activity[] = [
    {
        id: '1',
        title: '周四晚徐汇新手欢乐局',
        location: '徐汇区 · 上海中心球馆',
        time: '今天, 19:00 - 21:00',
        currentParticipants: 6,
        maxParticipants: 8,
        price: '105',
        level: '2.0 新手',
        levelColor: 'neon',
        status: 'open',
        type: 'newbie',
        isCreator: true
    },
    {
        id: '2',
        title: '周末静安混合双打赛',
        location: '静安体育中心 2号场',
        time: '周六, 10:00 - 12:00',
        currentParticipants: 3,
        maxParticipants: 4,
        price: '140',
        level: '3.5 进阶',
        levelColor: 'neon',
        status: 'open',
        type: 'advanced'
    },
    {
        id: '3',
        title: '浦东进阶高手切磋局',
        location: '浦东嘉里城顶层球场',
        time: '周日, 14:00 - 16:00',
        currentParticipants: 8,
        maxParticipants: 8,
        price: '180',
        level: '4.5+ 专家',
        levelColor: 'grey',
        status: 'waitlist',
        type: 'expert'
    }
];

export const MY_ACTIVITIES: UserActivity[] = [
    {
        id: '101',
        title: '上海滨江匹克球周六友谊赛',
        date: '本周六 14:00 - 17:00',
        location: '徐汇区 • 滨江运动公园',
        status: 'pending',
        type: '待参加',
        participants: [
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAIPHirMIYlv9_wGbxw-V5BtQfZg2Z90gklP3OVcgT6J_7Iyq6DYycIxdG143TmA_Rz7DrXrkUngYU_UVW_IMQkq8YRq04r88SmbvYde_jYpRu2pAOfa1PzFYWhA--cUnQPJQuqFzp2M_z94bRA2XoC2V6eISWTzJ1PXKN3N9oaJI0g0vb2ySiG2dqXsMsGoiKW6BTOXcE7ULVL18IQDUZ-4i8botqI8AdlnN6IkxBxyGIodGkezpIX3NzqsDHQ0c07zUd0FaIANS4",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDUgAuNdpE9Dm4H7kEKcOGwbPH_iBUtmICrpI6QBnMMHVhShauqdIAKVhHpQxHxAHjZ-iCkWrgcX0L3Re0xaE2TScQ4UW2jTy6bsH2qR1rt5zbua__rprShyQeFIdh0A1AJV07bCC7QRyNWVh6nsCVTtAIqRwtu3SvRz_Z12mB6iIuZFXwKvXfqmVg9p01XPcuaaKj0uTsYlRYCxjX9xPtO679AGWy91MYXaFJjkJ0Udsm8I96LTwRUHmTwNM3i9BPgLx6XdS_KgDU",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDuEPvDtjLVaLishw3mkKe1qpwZMqhoVJ21n_7y2tG--BMkq__aadpLy5WmttfT-L1FaJbsC6UDrm7d3qki7vefEPPkiNfxqHRBc43IA8J_Cuvv8e9zdDYn-17YUq_bjh7sjcCc4DWmGkxjfNKKcdAnG7OyfPoXsTWH-E3AOEqWnnqYl0h5CTyZpwl9oPN27AmLNWkQu0QlIZq-Bwq83utjk8FRahl90SaBxpSMV4zOHsKRpLTN8tIhrPLaqHnse09LuCWyUf250bg"
        ]
    },
    {
        id: '102',
        title: '中级水准 2v2 训练赛',
        date: '3月15日 (已结束)',
        location: '',
        status: 'completed',
        type: '已完成',
        participants: []
    },
    {
        id: '103',
        title: '晚间俱乐部开放日',
        date: '3月28日 19:00',
        location: '',
        status: 'pending',
        type: '待参加',
        participants: []
    }
];

export const USER_PROFILE: UserProfile = {
    name: '亚历克斯',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCA7VUa54qN55z7OBtxyJ8wpnHxW8zVs5IdkNc8qNKWK0RnZrqTr_jcVOIO6FIGe7tEvya_WEEJqlKxHJLNPzH8HK0YAFeiMzOAM0i-vOW-JstqXvktOS0DLRmJvw4GSfq_wHiET5JnuoT6HEgOGqOJCApeL2MGaAP7HlEXs6WgvpLFGIRe6V1IYfDDWiNMLS4Va2ZmbSHYXr-qQw_tqBzY2KJZzxvagD5fZ_gK2jvjXveMpssgbuf_1RuzypezuP9E2L4xqS05SPU',
    dupr: '3.5',
    title: '进阶玩家',
    isPro: true
};
