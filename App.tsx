import React, { useState, useEffect } from 'react';
import ActivitySquare from './views/ActivitySquare';
import Profile from './views/Profile';
import CreateActivity from './views/CreateActivity';
import ActivityDetail from './views/ActivityDetail';
import Login from './views/Login';
import BottomNav from './components/BottomNav';
import EditActivityModal from './components/EditActivityModal';
import { Activity } from './types';
import { AuthService, UserProfile } from './services/authService';
import { ActivityService } from './services/activityService';

type NavTab = 'home' | 'square' | 'profile';

const App: React.FC = () => {
    const [currentTab, setCurrentTab] = useState<NavTab>('home');
    const [activities, setActivities] = useState<Activity[]>([]);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(false);

    // 初始化应用
    useEffect(() => {
        const initApp = async () => {
            try {
                console.log('[App] 开始初始化...');

                // 检查 Env Vars (调试用)
                const sbUrl = import.meta.env.VITE_SUPABASE_URL;
                if (!sbUrl) {
                    alert('配置错误: 缺少 VITE_SUPABASE_URL，请联系开发者');
                    setIsLoading(false);
                    setShowLogin(true);
                    return;
                }

                // 1. 匿名登录
                const { user, error } = await AuthService.signInAnonymously();
                if (!user) {
                    console.log('[App] 登录失败:', error);
                    // 不在这里弹窗，以免干扰启动体验，由于进入 showLogin=true，用户之后点击"开始使用"会再次触发重试
                    setIsLoading(false);
                    setShowLogin(true);
                    return;
                }

                setCurrentUserId(user.id);
                console.log('[App] 用户已登录:', user.id);

                // 2. 检查用户资料
                const profile = await AuthService.getUserProfile(user.id);
                console.log('[App] 用户资料:', profile);

                if (!profile || !profile.phone) {
                    console.log('[App] 需要完善用户信息');
                    setShowLogin(true);
                    setIsLoading(false);
                    return;
                }

                setUserProfile(profile);

                // 3. 加载活动列表
                const acts = await ActivityService.getActivities(user.id);
                setActivities(acts);

                // 4. 订阅实时变化
                const channel = ActivityService.subscribeToActivities(
                    (updatedActivities) => {
                        setActivities(updatedActivities);
                    },
                    user.id
                );

                setIsLoading(false);

                return () => {
                    channel.unsubscribe();
                };
            } catch (error) {
                console.error('[App] 初始化失败:', error);
                setIsLoading(false);
                setShowLogin(true);
            }
        };

        initApp();
    }, []);

    // 处理登录完成
    const handleLoginComplete = async (userData: { phone: string; countryCode: string; nickname: string; gender: string; dupr: string }) => {
        let userId = currentUserId;

        // 如果没有用户ID，尝试重新登录
        if (!userId) {
            console.log('[App] 未检测到用户ID，尝试重新匿名登录...');
            try {
                const { user, error } = await AuthService.signInAnonymously();
                if (user) {
                    userId = user.id;
                    setCurrentUserId(user.id);
                    console.log('[App] 重新登录成功:', userId);
                } else {
                    console.error('[App] 重新登录失败:', error);
                    const errorMsg = error?.message || JSON.stringify(error) || '未知错误';
                    alert(`连接服务器失败: ${errorMsg}\n请确保您的网络可以访问 Supabase (可能需要VPN)`);
                    return;
                }
            } catch (err: any) {
                console.error('[App] 重新登录异常:', err);
                alert(`登录异常: ${err.message || '网络连接错误'}`);
                return;
            }
        }

        if (!userId) {
            alert('登录失败: 无法获取用户标识');
            return;
        }

        console.log('[App] 开始保存用户信息:', userData);

        try {
            // 保存用户信息
            const success = await AuthService.createUserProfile(userId, userData);

            if (!success) {
                console.error('[App] 保存用户信息失败');
                alert('保存用户信息失败，请重试');
                return;
            }

            console.log('[App] 用户信息保存成功');

            // 获取用户资料确认
            const profile = await AuthService.getUserProfile(userId);
            // ... (rest of the logic remains mostly same but verify userId usage)

            if (!profile) {
                alert('获取用户资料失败');
                return;
            }

            setUserProfile(profile);
            setShowLogin(false);

            // 加载活动列表
            const acts = await ActivityService.getActivities(userId);
            setActivities(acts);

            // 订阅实时变化
            ActivityService.subscribeToActivities(
                (updatedActivities) => {
                    setActivities(updatedActivities);
                },
                userId
            );

            // 自动切换到广场页面
            setCurrentTab('square');
        } catch (error) {
            console.error('[App] 登录完成处理异常:', error);
            alert('登录过程出错：' + (error as Error).message);
        }
    };

    const handlePublish = async (newActivity: Activity) => {
        if (!currentUserId) {
            alert('请先登录');
            return;
        }

        const created = await ActivityService.createActivity(newActivity, currentUserId);
        if (created) {
            setCurrentTab('square');
        } else {
            alert('创建活动失败');
        }
    };

    const handleActivityClick = (activity: Activity) => {
        setSelectedActivity(activity);
    };

    const handleBackFromDetail = () => {
        setSelectedActivity(null);
    };

    const handleDeleteActivity = async (activityId: string) => {
        if (confirm('确定要删除这个活动吗？')) {
            const success = await ActivityService.deleteActivity(activityId);
            if (!success) {
                alert('删除失败');
            }
        }
    };

    const handleEditActivity = (activity: Activity) => {
        setEditingActivity(activity);
    };

    const handleSaveEdit = async (updatedActivity: Activity) => {
        const success = await ActivityService.updateActivity(updatedActivity.id, updatedActivity);
        if (success) {
            setEditingActivity(null);
        } else {
            alert('更新失败');
        }
    };

    const handleCancelEdit = () => {
        setEditingActivity(null);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-ios-blue"></div>
                        <p className="mt-4 text-gray-600">加载中...</p>
                    </div>
                </div>
            );
        }

        if (showLogin) {
            return <Login onComplete={handleLoginComplete} />;
        }

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
                    userLocation="最近"
                />;
            case 'profile':
                return <Profile
                    activities={activities}
                    onActivityClick={handleActivityClick}
                    onEditActivity={handleEditActivity}
                    onDeleteActivity={handleDeleteActivity}
                />;
            default:
                return <CreateActivity onPublish={handlePublish} />;
        }
    };

    return (
        <div className="w-full h-full flex flex-col relative max-w-md mx-auto bg-white shadow-2xl overflow-hidden">
            <div className="flex-1 overflow-hidden relative">
                {renderContent()}
            </div>

            {!selectedActivity && !isLoading && !showLogin && <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />}

            {editingActivity && (
                <EditActivityModal
                    activity={editingActivity}
                    onSave={handleSaveEdit}
                    onCancel={handleCancelEdit}
                />
            )}
        </div>
    );
};

export default App;
