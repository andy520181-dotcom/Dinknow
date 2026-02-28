import React from 'react';
import { Activity } from '../types';

interface ActivityCardProps {
    activity: Activity;
    onJoinClick?: () => void;
    isCreatorView?: boolean;  // 是否为创建者视图
    onEdit?: () => void;       // 编辑回调
    onDelete?: () => void;     // 删除回调
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onJoinClick, isCreatorView, onEdit, onDelete }) => {
    // Check if price starts with a number to determine if we should show the Yen symbol
    const showCurrencySymbol = !isNaN(parseFloat(activity.price));

    return (
        <div className="flex flex-col overflow-hidden rounded-[20px] bg-card-grey ios-shadow p-4 active:scale-[0.98] transition-transform duration-200">
            <div className="flex justify-between items-start mb-3">
                <h2 className="text-[16px] font-bold leading-tight text-slate-900 tracking-tight flex-1">{activity.title}</h2>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm ml-3 shrink-0 uppercase tracking-tighter ${activity.levelColor === 'neon'
                    ? 'bg-pickleball-neon text-ios-blue'
                    : 'bg-slate-200 text-slate-500'
                    }`}>
                    {activity.level}
                </span>
            </div>
            <div className="space-y-1.5 mb-3.5">
                <div className="flex items-center gap-2 text-slate-500">
                    <span className="material-symbols-outlined text-[18px] text-ios-blue">location_on</span>
                    <p className="text-[13px] font-medium text-slate-600">{activity.location}</p>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                    <span className="material-symbols-outlined text-[18px] text-ios-blue">schedule</span>
                    <p className="text-[13px] font-medium text-slate-600">{activity.time}</p>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                    <span className="material-symbols-outlined text-[18px] text-ios-blue">group</span>
                    <p className="text-[13px] font-medium text-slate-600">
                        {activity.status === 'full'
                            ? `已报名 ${activity.currentParticipants}/${activity.maxParticipants} (满员)`
                            : `已报名 ${activity.currentParticipants}/${activity.maxParticipants}`
                        }
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
                <div className="flex items-baseline gap-0.5">
                    {showCurrencySymbol && <span className="text-[11px] text-slate-400 font-bold uppercase">¥</span>}
                    <span className="text-[20px] font-black text-ios-blue">{activity.price}</span>
                </div>
                {isCreatorView ? (
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onEdit) onEdit();
                            }}
                            className="flex items-center justify-center h-[34px] px-4 rounded-full bg-white border-2 border-ios-blue text-ios-blue font-bold text-xs shadow-sm active:scale-95 transition-transform"
                        >
                            <span className="material-symbols-outlined text-[16px] mr-1">edit</span>
                            编辑
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onDelete) onDelete();
                            }}
                            className="flex items-center justify-center h-[34px] px-4 rounded-full bg-red-500 text-white font-bold text-xs shadow-sm active:scale-95 transition-transform"
                        >
                            <span className="material-symbols-outlined text-[16px] mr-1">delete</span>
                            删除
                        </button>
                    </div>
                ) : activity.status === 'waitlist' ? (
                    <button className="flex items-center justify-center h-[34px] px-6 rounded-full bg-ios-blue text-white font-bold text-xs shadow-sm active:bg-ios-blue-dark transition-colors">
                        候补中
                    </button>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onJoinClick) onJoinClick();
                        }}
                        className="flex items-center justify-center h-[34px] px-6 rounded-full bg-ios-blue text-white font-bold text-xs shadow-sm active:scale-95 transition-transform"
                    >
                        立即加入
                    </button>
                )}
            </div>
        </div>
    );
};

export default ActivityCard;
