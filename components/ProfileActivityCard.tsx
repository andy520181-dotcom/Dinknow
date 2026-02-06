import React from 'react';
import { UserActivity } from '../types';

interface ProfileActivityCardProps {
    activity: UserActivity;
}

const ProfileActivityCard: React.FC<ProfileActivityCardProps> = ({ activity }) => {
    const isCompleted = activity.status === 'completed';

    return (
        <div className={`flex flex-col gap-3 rounded-2xl p-4 transition-all ${isCompleted ? 'bg-ios-bg opacity-70' : 'bg-ios-bg active:opacity-90'}`}>
            <div className="flex items-center gap-4">
                <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${isCompleted ? 'bg-white text-slate-400' : 'bg-white text-ios-blue'}`}>
                    <span className="material-symbols-outlined text-2xl">
                        {activity.title.includes('比赛') || activity.title.includes('赛') ? 'emoji_events' : 'event'}
                    </span>
                </div>
                <div className="flex flex-1 flex-col min-w-0">
                    <p className="text-slate-900 text-[16px] font-bold truncate">{activity.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="material-symbols-outlined text-[14px] text-slate-400">calendar_today</span>
                        <p className="text-slate-500 text-[12px]">{activity.date}</p>
                    </div>
                </div>
                <div className="shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isCompleted 
                        ? 'bg-slate-200 text-slate-500' 
                        : 'bg-ios-blue/10 text-ios-blue'
                    }`}>
                        {isCompleted ? '已完成' : '待参加'}
                    </span>
                </div>
            </div>
            
            {!isCompleted && activity.participants.length > 0 && (
                <>
                    <div className="h-px bg-slate-200/50 w-full"></div>
                    <div className="flex justify-between items-center">
                        <div className="flex -space-x-2">
                            {activity.participants.map((url, idx) => (
                                <div key={idx} className="size-6 rounded-full border-2 border-ios-bg bg-slate-200 overflow-hidden">
                                    <img alt="avatar" src={url} className="w-full h-full object-cover"/>
                                </div>
                            ))}
                            <div className="size-6 rounded-full border-2 border-ios-bg bg-slate-100 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-slate-500">+8</span>
                            </div>
                        </div>
                        <p className="text-slate-400 text-[12px]">{activity.location}</p>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProfileActivityCard;
