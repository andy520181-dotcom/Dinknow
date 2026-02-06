import React, { useState } from 'react';
import ActivitySquare from './views/ActivitySquare';
import Profile from './views/Profile';
import CreateActivity from './views/CreateActivity';
import ActivityDetail from './views/ActivityDetail';
import BottomNav from './components/BottomNav';
import { ACTIVITIES } from './constants';
import { Activity } from './types';

type NavTab = 'home' | 'square' | 'profile';

const App: React.FC = () => {
    // Default to 'home' as requested ("Home is Create Activity page")
    const [currentTab, setCurrentTab] = useState<NavTab>('home');
    const [activities, setActivities] = useState<Activity[]>(ACTIVITIES);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

    const handlePublish = (newActivity: Activity) => {
        setActivities([newActivity, ...activities]);
        setCurrentTab('square');
    };

    const handleActivityClick = (activity: Activity) => {
        setSelectedActivity(activity);
    };

    const handleBackFromDetail = () => {
        setSelectedActivity(null);
    };

    const renderContent = () => {
        if (selectedActivity) {
            return <ActivityDetail activity={selectedActivity} onBack={handleBackFromDetail} />;
        }

        switch (currentTab) {
            case 'home':
                return <CreateActivity onPublish={handlePublish} />;
            case 'square':
                return <ActivitySquare
                    activities={activities}
                    onCreateClick={() => setCurrentTab('home')}
                    onActivityClick={handleActivityClick}
                />;
            case 'profile':
                return <Profile activities={activities} onActivityClick={handleActivityClick} />;
            default:
                return <CreateActivity onPublish={handlePublish} />;
        }
    };

    return (
        <div className="w-full h-full flex flex-col relative max-w-md mx-auto bg-white shadow-2xl overflow-hidden">
            <div className="flex-1 overflow-hidden relative">
                {renderContent()}
            </div>

            {!selectedActivity && <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />}
        </div>
    );
};

export default App;
