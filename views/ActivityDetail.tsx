import React, { useState } from 'react';
import { Activity } from '../types';
import { USER_PROFILE } from '../constants';

interface ActivityDetailProps {
    activity: Activity;
    onBack: () => void;
}

const ActivityDetail: React.FC<ActivityDetailProps> = ({ activity, onBack }) => {
    const [currentParticipants, setCurrentParticipants] = useState(activity.currentParticipants);
    const showCurrencySymbol = !isNaN(parseFloat(activity.price));

    const handleAdd = () => {
        if (currentParticipants < activity.maxParticipants) {
            setCurrentParticipants(prev => prev + 1);
        }
    };

    const handleRemove = () => {
        if (currentParticipants > 1) {
            setCurrentParticipants(prev => prev - 1);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative z-50 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center px-2 shrink-0 border-b border-slate-100 bg-white/95 backdrop-blur-xl pt-safe sticky top-0 z-10" style={{ height: '40px', minHeight: '40px' }}>
                <button onClick={onBack} className="flex items-center justify-center w-10 h-10 text-ios-blue active:opacity-50">
                    <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                </button>
                <h1 className="flex-1 text-[17px] font-semibold text-center text-slate-900 pr-10">活动详情</h1>
            </div>

            <div className="flex-1 overflow-y-auto pb-32">
                {/* Hero / Title Section */}
                <div className="px-5 pt-6 pb-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wide ${activity.levelColor === 'neon'
                            ? 'bg-pickleball-neon text-ios-blue'
                            : 'bg-slate-100 text-slate-500'
                            }`}>
                            {activity.level}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
                            {activity.type === 'newbie' ? '娱乐局' : activity.type === 'expert' ? '竞技局' : '混合局'}
                        </span>
                    </div>
                    <h2 className="text-[24px] font-bold leading-tight text-slate-900 mb-6">{activity.title}</h2>

                    {/* Key Info Cards */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-field-bg rounded-xl p-3 flex flex-col items-center justify-center gap-1">
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">费用 / 人</p>
                            <div className="flex items-baseline text-slate-900">
                                {showCurrencySymbol && <span className="text-[14px] font-bold mr-0.5">¥</span>}
                                <span className="text-[24px] font-black tracking-tight">{activity.price}</span>
                            </div>
                        </div>
                        <div className="bg-field-bg rounded-xl p-3 flex flex-col items-center justify-center gap-1">
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">当前人数</p>
                            <div className="flex items-baseline text-slate-900">
                                <span className="text-[24px] font-black tracking-tight">{currentParticipants}</span>
                                <span className="text-[14px] font-bold text-slate-400 mx-1">/</span>
                                <span className="text-[16px] font-bold text-slate-400">{activity.maxParticipants}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-2 bg-slate-50 border-y border-slate-100/50"></div>

                {/* Details List */}
                <div className="px-5 py-6 space-y-8">
                    {/* Time */}
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-ios-blue shrink-0">
                            <span className="material-symbols-outlined">calendar_month</span>
                        </div>
                        <div>
                            <p className="text-[15px] font-bold text-slate-900 mb-1">活动时间</p>
                            <p className="text-[15px] text-slate-600 leading-relaxed">{activity.time}</p>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-ios-blue shrink-0">
                            <span className="material-symbols-outlined">location_on</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-[15px] font-bold text-slate-900 mb-1">活动地点</p>
                            <p className="text-[15px] text-slate-600">{activity.location}</p>
                        </div>
                    </div>

                    {/* Participants */}
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-ios-blue shrink-0">
                            <span className="material-symbols-outlined">group</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-[15px] font-bold text-slate-900">已报名球友 ({currentParticipants})</p>
                            </div>
                            <div className="grid grid-cols-5 gap-3">
                                {/* Render Participants */}
                                {Array.from({ length: currentParticipants }).map((_, i) => (
                                    <div key={i} className="aspect-square rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm relative">
                                        <img
                                            src={i === 0 ? USER_PROFILE.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.id}-${i}&backgroundColor=e5e5ea`}
                                            className="w-full h-full object-cover"
                                            alt={i === 0 ? "host" : "user"}
                                        />
                                        {i === 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-ios-blue/90 h-3 flex items-center justify-center">
                                                <span className="text-[8px] text-white font-bold leading-none">房主</span>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Add Button */}
                                {currentParticipants < activity.maxParticipants && (
                                    <button
                                        onClick={handleAdd}
                                        className="aspect-square rounded-full bg-slate-50 border-2 border-slate-300 border-dashed flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-slate-400 active:scale-95 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">add</span>
                                    </button>
                                )}

                                {/* Remove Button */}
                                {currentParticipants > 1 && (
                                    <button
                                        onClick={handleRemove}
                                        className="aspect-square rounded-full bg-slate-50 border-2 border-slate-300 border-dashed flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-slate-400 active:scale-95 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">remove</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Action - Fixed */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-5 pt-3 pb-8 safe-area-bottom z-20">
                <button className="w-full bg-ios-blue hover:bg-ios-blue-dark active:scale-[0.98] transition-all text-white font-bold text-[17px] h-[54px] rounded-2xl shadow-lg shadow-ios-blue/20 flex items-center justify-center gap-2">
                    立即支付 {showCurrencySymbol && '¥'}{activity.price} 加入
                </button>
            </div>
        </div>
    );
};

export default ActivityDetail;
