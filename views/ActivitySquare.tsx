import React from 'react';
import ActivityCard from '../components/ActivityCard';
import { Activity } from '../types';

interface ActivitySquareProps {
    onCreateClick: () => void;
    activities: Activity[];
    onActivityClick: (activity: Activity) => void;
}

const ActivitySquare: React.FC<ActivitySquareProps> = ({ onCreateClick, activities, onActivityClick }) => {
    return (
        <div className="flex flex-col h-full bg-white relative overflow-hidden">
            {/* Header - Fixed */}
            <header className="flex-none bg-white/95 backdrop-blur-xl border-b border-slate-100 pt-safe z-10">
                <div className="flex items-center px-4 justify-center" style={{ height: '40px', minHeight: '40px' }}>
                    <h1 className="text-[16px] font-bold tracking-tight text-center text-slate-900">活动广场</h1>
                </div>
                {/* Filter Tags - Scrollable horizontally if needed but fits usually */}
                <div className="flex gap-2.5 px-4 pb-2.5 overflow-x-auto scrollbar-hide">
                    <button className="flex h-7 shrink-0 items-center justify-center gap-x-1 rounded-full bg-ios-blue px-3.5 shadow-sm">
                        <span className="material-symbols-outlined text-[14px] text-white mr-1">location_on</span>
                        <p className="text-white text-[11px] font-bold">最近</p>
                    </button>
                    <button className="flex h-7 shrink-0 items-center justify-center rounded-full bg-card-grey px-3 border border-transparent">
                        <p className="text-[11px] font-semibold text-slate-600">2.0-2.5 新手</p>
                    </button>
                    <button className="flex h-7 shrink-0 items-center justify-center rounded-full bg-card-grey px-3 border border-transparent">
                        <p className="text-[11px] font-semibold text-slate-600">3.0-3.5 进阶</p>
                    </button>
                    <button className="flex h-7 shrink-0 items-center justify-center rounded-full bg-card-grey px-3 border border-transparent">
                        <p className="text-[11px] font-semibold text-slate-600">4.0+ 专业</p>
                    </button>
                </div>
            </header>

            {/* Main Content - Flex to fill remaining height */}
            <main className="flex-1 overflow-y-auto w-full px-4 pt-4 pb-4 space-y-3">
                {activities.map(activity => (
                    <ActivityCard
                        key={activity.id}
                        activity={activity}
                        onJoinClick={() => onActivityClick(activity)}
                    />
                ))}
            </main>
        </div>
    );
};

export default ActivitySquare;
