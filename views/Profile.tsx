import React, { useState } from 'react';
import { MY_ACTIVITIES, USER_PROFILE } from '../constants';
import ProfileActivityCard from '../components/ProfileActivityCard';
import ActivityCard from '../components/ActivityCard';
import { Activity } from '../types';

interface ProfileProps {
    activities?: Activity[];
    onActivityClick?: (activity: Activity) => void;
}

const Profile: React.FC<ProfileProps> = ({ activities = [], onActivityClick }) => {
    const [activeTab, setActiveTab] = useState<'joined' | 'created'>('joined');

    const createdActivities = activities.filter(activity => activity.isCreator);

    return (
        <div className="flex flex-col h-full bg-ios-bg relative overflow-hidden">
            {/* Top Bar - Fixed */}
            <div className="flex items-center bg-ios-blue px-4 py-3 justify-center shrink-0 pt-safe z-10">
                <h2 className="text-white text-[17px] font-semibold leading-tight tracking-tight text-center">个人中心</h2>
            </div>

            {/* Main Content Container - Flex Column */}
            <div className="flex-1 flex flex-col min-h-0 relative">
                
                {/* Blue Background Area with User Info - Shrinkable if needed but keeps structure */}
                <div className="profile-header-gradient px-4 pt-2 pb-12 text-white shrink-0">
                    <div className="flex gap-4 flex-row items-center w-full">
                        <div className="relative shrink-0">
                            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-16 w-16 border-2 border-white/40 shadow-lg" style={{backgroundImage: `url("${USER_PROFILE.avatar}")`}}></div>
                            {USER_PROFILE.isPro && (
                                <div className="absolute -bottom-1 -right-1 bg-neon-green text-ios-blue text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                                    PRO
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <p className="text-white text-xl font-bold leading-tight truncate">{USER_PROFILE.name}</p>
                            <div className="mt-1.5 flex flex-wrap gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-neon-green text-ios-blue text-[10px] font-black shrink-0">
                                    DUPR {USER_PROFILE.dupr}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-white/20 border border-white/10 text-white text-[10px] font-medium shrink-0">
                                    {USER_PROFILE.title}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button className="flex px-3 h-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-ios-blue font-bold text-xs active:bg-white/90 transition-colors shadow-sm">
                                <span className="material-symbols-outlined text-[16px] mr-1">edit</span>
                                编辑
                            </button>
                        </div>
                    </div>
                </div>

                {/* White Content Card - Fills remaining space */}
                <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10 flex flex-col overflow-hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    
                    {/* Tabs - Fixed at top of white card */}
                    <div className="flex border-b border-slate-100 px-6 shrink-0">
                        <button 
                            onClick={() => setActiveTab('joined')}
                            className={`flex flex-col items-center justify-center pb-3 pt-4 flex-1 outline-none ${activeTab === 'joined' ? 'border-b-[3px] border-ios-blue text-ios-blue' : 'border-b-[3px] border-transparent text-slate-400'}`}
                        >
                            <p className="text-[14px] font-bold leading-normal">我参加的</p>
                        </button>
                        <button 
                            onClick={() => setActiveTab('created')}
                            className={`flex flex-col items-center justify-center pb-3 pt-4 flex-1 outline-none ${activeTab === 'created' ? 'border-b-[3px] border-ios-blue text-ios-blue' : 'border-b-[3px] border-transparent text-slate-400'}`}
                        >
                            <p className="text-[14px] font-bold leading-normal">我发起的</p>
                        </button>
                    </div>

                    {/* Scrollable Activity List - Hidden Scrollbar */}
                    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-3">
                        {activeTab === 'joined' ? (
                            MY_ACTIVITIES.map(activity => (
                                <ProfileActivityCard key={activity.id} activity={activity} />
                            ))
                        ) : (
                            createdActivities.length > 0 ? (
                                createdActivities.map(activity => (
                                    <ActivityCard 
                                        key={activity.id} 
                                        activity={activity} 
                                        onJoinClick={onActivityClick ? () => onActivityClick(activity) : undefined} 
                                    />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                    <span className="material-symbols-outlined text-[48px] mb-2 opacity-20">assignment_add</span>
                                    <p className="text-sm">暂无发起的活动</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
