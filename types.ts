export interface Activity {
    id: string;
    title: string;
    location: string;
    time: string;
    currentParticipants: number;
    maxParticipants: number;
    price: string;
    level: string;
    levelColor: string; // 'neon' | 'blue' | 'grey'
    status: 'open' | 'full' | 'waitlist' | 'finished';
    type: 'newbie' | 'advanced' | 'expert' | 'mixed';
    isCreator?: boolean;
    publishTime?: string; // 发布时间，显示于卡片左下角
}

export interface UserActivity {
    id: string;
    title: string;
    date: string;
    status: 'pending' | 'completed' | 'cancelled';
    location: string;
    participants: string[]; // Avatar URLs
    type: string;
}

export interface UserProfile {
    name: string;
    avatar: string;
    dupr: string;
    title: string;
    isPro: boolean;
}
