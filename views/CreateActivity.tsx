import React, { useState } from 'react';
import { Activity } from '../types';
import { Geolocation } from '@capacitor/geolocation';


interface CreateActivityProps {
    onPublish: (activity: Activity) => void;
}

const CreateActivity: React.FC<CreateActivityProps> = ({ onPublish }) => {
    // Form State
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState(''); // 日期
    const [time, setTime] = useState(''); // 时间
    const [level, setLevel] = useState('2.0-2.5'); // Default to 2.0-2.5
    const [participants, setParticipants] = useState(''); // 初始为空，不显示数字
    const [price, setPrice] = useState('');

    // Updated levels list - 合并2.0和2.5
    const levels = ['2.0-2.5', '3.0', '3.5', '4.0', '4.5', '5.0+'];

    // 等级名称映射
    const levelNames: Record<string, string> = {
        '2.0-2.5': '初中级',
        '3.0': '中级',
        '3.5': '中高级',
        '4.0': '高级',
        '4.5': '专业级',
        '5.0+': '竞赛级'
    };





    // 组件挂载时获取用户位置
    React.useEffect(() => {
        const getCurrentPosition = async () => {
            try {
                // Check permissions first
                const permissionStatus = await Geolocation.checkPermissions();

                if (permissionStatus.location !== 'granted') {
                    const requestStatus = await Geolocation.requestPermissions();
                    if (requestStatus.location !== 'granted') {
                        console.log('Location permission denied');
                        return;
                    }
                }

                const coordinates = await Geolocation.getCurrentPosition();
                console.log('Current position:', coordinates);

                // TODO: Here you would typically use a reverse geocoding service to get the address
                // For now, we just have the coordinates: coordinates.coords.latitude, coordinates.coords.longitude
                // Since our UI expects a string location name, we can't fully auto-fill it without an external API.
                // We could potentially set a placeholder or just log it for now as requested.

            } catch (error) {
                console.error('Error getting location', error);
            }
        };

        getCurrentPosition();
    }, []);

    const handlePublish = () => {
        if (!title || !location || !date || !time) {
            alert('请填写完整信息');
            return;
        }

        // 合并日期和时间
        const dateTimeString = `${date}T${time}`;
        const dateObj = new Date(dateTimeString);
        const formattedTime = dateObj.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        const weekDay = dateObj.toLocaleDateString('zh-CN', { weekday: 'short' });

        // Determine label and type based on level string
        let levelLabel = '进阶';
        let activityType: Activity['type'] = 'advanced';
        let levelColor = 'neon';

        const numLevel = parseFloat(level);
        if (level === '5.0+' || numLevel >= 4.5) {
            levelLabel = '职业';
            activityType = 'expert';
            levelColor = 'grey';
        } else if (numLevel >= 4.0) {
            levelLabel = '专家';
            activityType = 'expert';
            levelColor = 'grey';
        } else if (numLevel >= 3.0) {
            levelLabel = '进阶';
            activityType = 'advanced';
            levelColor = 'neon';
        } else {
            levelLabel = '新手';
            activityType = 'newbie';
            levelColor = 'neon';
        }

        const newActivity: Activity = {
            id: Date.now().toString(),
            title: title,
            location: location,
            time: `${weekDay} ${formattedTime}`,
            currentParticipants: 0,  // 创建者不自动加入
            maxParticipants: Number(participants) || 4,
            price: price || '0',
            level: `${level} ${levelLabel}`,
            levelColor: levelColor,
            status: 'open',
            type: activityType,
            isCreator: true
        };

        onPublish(newActivity);

        // Reset form (optional, since we switch tabs)
        setTitle('');
        setLocation('');
        setDate('');
        setTime('');
        setPrice('');
        // Keep previous level or reset to default could be debated, resetting to default 2.0 here
        setLevel('2.0');
    };



    // Format display date
    const getDisplayDate = () => {
        if (!date) return '请选择日期';
        const d = new Date(date);
        return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' });
    };

    // Format display time
    const getDisplayTime = () => {
        if (!time) return '请选择时间';
        return time; // time已经是HH:MM格式
    };

    const handleParticipantsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // 允许空值或有效数字
        if (val === '') {
            setParticipants('');
        } else {
            const num = parseInt(val);
            if (!isNaN(num) && num > 0) {
                setParticipants(num.toString());
            }
        }
    };

    const handleReset = () => {
        setTitle('');
        setLocation('');
        setDate('');
        setTime('');
        setLevel('2.0');
        setParticipants(''); // 重置为空
        setPrice('');
    };

    return (
        <div className="flex flex-col h-full bg-white relative overflow-hidden">
            {/* Header */}
            {/* Header */}
            <div className="bg-white flex flex-col shrink-0 z-20 pt-safe">
                <div className="flex items-center px-4 justify-between" style={{ height: '40px', minHeight: '40px' }}>
                    <div className="flex w-16 items-center"></div>
                    <h2 className="text-text-main text-[17px] font-bold leading-tight flex-1 text-center">发起活动</h2>
                    <div className="flex w-16 items-center justify-end">
                        <button onClick={handleReset} className="text-ios-blue text-[15px] font-normal cursor-pointer active:opacity-50">重置</button>
                    </div>
                </div>
            </div>

            {/* Main Content - Flex Layout to fit screen */}
            <div className="flex-1 flex flex-col px-5 pt-2 pb-[45px] gap-2.5 overflow-hidden">

                {/* Section 1: Basic Info */}
                <div className="shrink-0 space-y-3">
                    {/* 标题 */}
                    <div className="bg-field-bg border border-transparent transition-all rounded-xl px-4 py-3" style={{ minHeight: '140px' }}>
                        <p className="text-text-main text-[16px] font-medium mb-1">标题</p>
                        <div className="flex items-start gap-2 mt-0.5">
                            <span className="material-symbols-outlined text-ios-blue text-[20px] mt-0.5">title</span>
                            <textarea
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="flex-1 bg-transparent border-none p-0 text-text-main placeholder:text-gray-400 placeholder:text-[12px] placeholder:font-light text-[16px] focus:ring-0 font-medium resize-none"
                                placeholder="例如：高德置地广场下班后匹克球开心局"
                                rows={3}
                                wrap="soft"
                                maxLength={60}
                            />
                        </div>
                    </div>

                    {/* 地点 - 独立模块 */}
                    <div className="bg-field-bg border border-transparent transition-all rounded-xl px-4 py-3">
                        <p className="text-text-main text-[16px] font-medium mb-1">球馆</p>
                        <div className="flex items-start gap-2 mt-0.5">
                            <span className="material-symbols-outlined text-ios-blue text-[20px] mt-0.5">location_on</span>
                            <textarea
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="flex-1 bg-transparent border-none p-0 text-text-main placeholder:text-gray-400 placeholder:text-[12px] placeholder:font-light text-[16px] focus:ring-0 font-medium resize-none"
                                placeholder="输入球馆名称"
                                rows={2}
                                wrap="soft"
                                maxLength={30}
                            />
                        </div>
                    </div>

                    {/* 日期和时间 - 两个独立输入框 */}
                    <div className="bg-field-bg border border-transparent rounded-xl overflow-hidden divide-y divide-[#E5E5EA]/60">
                        {/* 日期选择 */}
                        <div className="flex items-center gap-3 px-4 py-3.5 active:bg-[#E5E5EA] transition-colors relative">
                            <span className="material-symbols-outlined text-ios-blue text-[22px]">calendar_today</span>
                            <p className="text-text-main text-[16px] font-medium flex-1">日期</p>

                            {/* Visual Display */}
                            <div className="shrink-0 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#E5E5EA]/50 shadow-sm pointer-events-none">
                                <p className={`text-[14px] font-semibold ${date ? 'text-ios-blue' : 'text-slate-400'}`}>
                                    {getDisplayDate()}
                                </p>
                            </div>

                            {/* Invisible Overlay Input to trigger system picker */}
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                            />
                        </div>

                        {/* 时间选择 */}
                        <div className="flex items-center gap-3 px-4 py-3.5 active:bg-[#E5E5EA] transition-colors relative">
                            <span className="material-symbols-outlined text-ios-blue text-[22px]">schedule</span>
                            <p className="text-text-main text-[16px] font-medium flex-1">时间</p>

                            {/* Visual Display */}
                            <div className="shrink-0 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#E5E5EA]/50 shadow-sm pointer-events-none">
                                <p className={`text-[14px] font-semibold ${time ? 'text-ios-blue' : 'text-slate-400'}`}>
                                    {getDisplayTime()}
                                </p>
                            </div>

                            {/* Invisible Overlay Input to trigger system picker */}
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Requirements */}
                <div className="shrink-0 space-y-3">
                    <div className="bg-field-bg border border-transparent p-2.5 rounded-xl" style={{ minHeight: '100px' }}>
                        <p className="text-text-main text-[16px] font-medium mb-2">DUPR 水平</p>
                        {/* 所有级别在一行显示 */}
                        <div className="flex bg-white/70 p-1.5 rounded-lg border border-[#E5E5EA]/30 gap-0.5">
                            {levels.map((lvl) => (
                                <button
                                    key={lvl}
                                    onClick={() => setLevel(lvl)}
                                    className={`flex-1 min-w-[50px] py-2 rounded-md transition-all duration-200 flex flex-col items-center justify-center gap-0.5
                                        ${level === lvl
                                            ? 'bg-ios-blue text-white shadow-sm scale-100'
                                            : 'text-text-secondary hover:bg-black/5 active:scale-95'
                                        }`}
                                >
                                    <span className="text-[14px] font-medium leading-tight">{levelNames[lvl]}</span>
                                    <span className="text-[14px] font-bold leading-tight">{lvl}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex flex-col flex-1 bg-field-bg border border-transparent transition-all rounded-xl px-4 py-3">
                            <p className="text-text-main text-[16px] font-medium mb-1">人数</p>
                            <textarea
                                value={participants}
                                onChange={handleParticipantsChange}
                                className="w-full bg-transparent border-none p-0 text-text-main text-[16px] focus:ring-0 font-medium leading-normal mt-0.5 placeholder:text-gray-400 placeholder:text-[12px] placeholder:font-light resize-none"
                                inputMode="numeric"
                                placeholder="输入人数"
                                rows={1}
                                wrap="soft"
                                maxLength={3}
                            />
                        </div>
                        <div className="flex flex-col flex-[2] bg-field-bg border border-transparent transition-all rounded-xl px-4 py-3">
                            <p className="text-text-main text-[16px] font-medium mb-1">费用</p>
                            <textarea
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full bg-transparent border-none p-0 text-text-main text-[16px] focus:ring-0 font-medium leading-normal mt-0.5 placeholder:text-gray-400 placeholder:text-[12px] placeholder:font-light resize-none"
                                placeholder="免费或AA制"
                                rows={1}
                                wrap="soft"
                                maxLength={15}
                            />
                        </div>
                    </div>
                </div>



                {/* Footer Button - Pushed to bottom */}
                <div className="mt-auto shrink-0 pt-1">
                    <button
                        onClick={handlePublish}
                        className="w-full bg-ios-blue hover:brightness-105 active:scale-[0.98] transition-all text-white font-bold py-3.5 rounded-2xl text-[17px] shadow-lg shadow-ios-blue/30"
                    >
                        发布活动
                    </button>
                </div>
            </div>

        </div>
    );
};

export default CreateActivity;
