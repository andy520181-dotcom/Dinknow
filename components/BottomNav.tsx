import React from 'react';

type NavTab = 'home' | 'square' | 'profile';

interface BottomNavProps {
    currentTab: NavTab;
    onTabChange: (tab: NavTab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {

    const activeColorClass = currentTab === 'profile' ? 'text-ios-blue' : 'text-ios-blue';

    return (
        <nav className="flex-none bg-white/95 backdrop-blur-xl border-t border-slate-100 safe-area-bottom z-40 sticky bottom-0">
            <div className="max-w-md mx-auto flex justify-around items-center h-[30px] pt-5">
                <button
                    onClick={() => onTabChange('home')}
                    className={`flex flex-col items-center gap-0 active:scale-95 transition-transform w-1/3 ${currentTab === 'home' ? activeColorClass : 'text-slate-400'}`}
                >
                    <span className={`material-symbols-outlined text-[30px] ${currentTab === 'home' ? 'filled-icon' : ''}`}>home</span>
                    <span className={`text-[12px] ${currentTab === 'home' ? 'font-bold' : 'font-semibold'}`}>主页</span>
                </button>

                <button
                    onClick={() => onTabChange('square')}
                    className={`flex flex-col items-center gap-0 active:scale-95 transition-transform w-1/3 ${currentTab === 'square' ? activeColorClass : 'text-slate-400'}`}
                >
                    <span className={`material-symbols-outlined text-[30px] ${currentTab === 'square' ? 'filled-icon' : ''}`}>explore</span>
                    <span className={`text-[12px] ${currentTab === 'square' ? 'font-bold' : 'font-semibold'}`}>广场</span>
                </button>

                <button
                    onClick={() => onTabChange('profile')}
                    className={`flex flex-col items-center gap-0 active:scale-95 transition-transform w-1/3 ${currentTab === 'profile' ? activeColorClass : 'text-slate-400'}`}
                >
                    <span className={`material-symbols-outlined text-[30px] ${currentTab === 'profile' ? 'filled-icon' : ''}`}>person</span>
                    <span className={`text-[12px] ${currentTab === 'profile' ? 'font-bold' : 'font-semibold'}`}>我</span>
                </button>
            </div>
        </nav>
    );
};

export default BottomNav;
