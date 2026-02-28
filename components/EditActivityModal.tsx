import React, { useState, useEffect } from 'react';
import { Activity } from '../types';

interface EditActivityModalProps {
    activity: Activity;
    onSave: (activity: Activity) => void;
    onCancel: () => void;
}

const EditActivityModal: React.FC<EditActivityModalProps> = ({ activity, onSave, onCancel }) => {
    // 从活动中解析初始数据
    const [title, setTitle] = useState(activity.title);
    const [location, setLocation] = useState(activity.location);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [level, setLevel] = useState('2.0-2.5');
    const [participants, setParticipants] = useState(activity.maxParticipants.toString());
    const [price, setPrice] = useState(activity.price);

    const levels = ['2.0-2.5', '3.0', '3.5', '4.0', '4.5', '5.0+'];
    const levelNames: Record<string, string> = {
        '2.0-2.5': '初中级',
        '3.0': '中级',
        '3.5': '中高级',
        '4.0': '高级',
        '4.5': '专业级',
        '5.0+': '竞赛级'
    };

    // 从activity.level中提取level值（格式: "2.0-2.5 初中级"）
    useEffect(() => {
        const levelMatch = activity.level.match(/^[\d\.\-\+]+/);
        if (levelMatch) {
            setLevel(levelMatch[0]);
        }
    }, [activity.level]);

    const handleParticipantsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value === '' || /^\d+$/.test(value)) {
            setParticipants(value);
        }
    };

    const getDisplayDate = () => {
        if (!date) return '选择日期';
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getDisplayTime = () => {
        if (!time) return '选择时间';
        const [hours, minutes] = time.split(':');
        return `${hours}:${minutes}`;
    };

    const handleSave = () => {
        if (!title || !location || !date || !time) {
            alert('请填写完整信息');
            return;
        }

        const dateTimeString = `${date}T${time}`;
        const dateObj = new Date(dateTimeString);
        const formattedTime = dateObj.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        const weekDay = dateObj.toLocaleDateString('zh-CN', { weekday: 'short' });

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

        const updatedActivity: Activity = {
            ...activity,
            title,
            location,
            time: `${weekDay} ${formattedTime}`,
            maxParticipants: Number(participants) || activity.maxParticipants,
            price: price || '0',
            level: `${level} ${levelLabel}`,
            levelColor,
            type: activityType
        };

        onSave(updatedActivity);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 pt-safe pb-safe">
            <div className="bg-white rounded-3xl w-[90%] max-w-md max-h-[85vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
                    <button onClick={onCancel} className="text-ios-blue text-[16px] font-normal">取消</button>
                    <h2 className="text-[17px] font-bold text-text-main">编辑活动</h2>
                    <button onClick={handleSave} className="text-ios-blue text-[16px] font-semibold">保存</button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {/* 标题 */}
                    <div className="bg-field-bg rounded-xl px-4 py-3">
                        <p className="text-text-main text-[16px] font-medium mb-1">标题</p>
                        <div className="flex items-start gap-2 mt-0.5">
                            <span className="material-symbols-outlined text-ios-blue text-[20px] mt-0.5">title</span>
                            <textarea
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="flex-1 bg-transparent border-none p-0 text-text-main placeholder:text-gray-400 placeholder:text-[12px] text-[16px] focus:ring-0 font-medium resize-none"
                                placeholder="例如：高德置地广场下班后匹克球开心局"
                                rows={3}
                                maxLength={60}
                            />
                        </div>
                    </div>

                    {/* 球馆 */}
                    <div className="bg-field-bg rounded-xl px-4 py-3">
                        <p className="text-text-main text-[16px] font-medium mb-1">球馆</p>
                        <div className="flex items-start gap-2 mt-0.5">
                            <span className="material-symbols-outlined text-ios-blue text-[20px] mt-0.5">location_on</span>
                            <textarea
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="flex-1 bg-transparent border-none p-0 text-text-main placeholder:text-gray-400 placeholder:text-[12px] text-[16px] focus:ring-0 font-medium resize-none"
                                placeholder="输入球馆名称"
                                rows={2}
                                maxLength={30}
                            />
                        </div>
                    </div>

                    {/* 日期和时间 */}
                    <div className="bg-field-bg rounded-xl overflow-hidden divide-y divide-[#E5E5EA]/60">
                        <div className="flex items-center gap-3 px-4 py-3.5 relative">
                            <span className="material-symbols-outlined text-ios-blue text-[22px]">calendar_today</span>
                            <p className="text-text-main text-[16px] font-medium flex-1">日期</p>
                            <div className="shrink-0 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#E5E5EA]/50 shadow-sm pointer-events-none">
                                <p className={`text-[14px] font-semibold ${date ? 'text-ios-blue' : 'text-slate-400'}`}>
                                    {getDisplayDate()}
                                </p>
                            </div>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                            />
                        </div>
                        <div className="flex items-center gap-3 px-4 py-3.5 relative">
                            <span className="material-symbols-outlined text-ios-blue text-[22px]">schedule</span>
                            <p className="text-text-main text-[16px] font-medium flex-1">时间</p>
                            <div className="shrink-0 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#E5E5EA]/50 shadow-sm pointer-events-none">
                                <p className={`text-[14px] font-semibold ${time ? 'text-ios-blue' : 'text-slate-400'}`}>
                                    {getDisplayTime()}
                                </p>
                            </div>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                            />
                        </div>
                    </div>

                    {/* DUPR 水平 */}
                    <div className="bg-field-bg p-2.5 rounded-xl">
                        <p className="text-text-main text-[16px] font-medium mb-2">DUPR 水平</p>
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

                    {/* 人数和费用 */}
                    <div className="flex gap-3">
                        <div className="flex flex-col flex-1 bg-field-bg rounded-xl px-4 py-3">
                            <p className="text-text-main text-[16px] font-medium mb-1">人数</p>
                            <textarea
                                value={participants}
                                onChange={handleParticipantsChange}
                                className="w-full bg-transparent border-none p-0 text-text-main text-[16px] focus:ring-0 font-medium leading-normal mt-0.5 placeholder:text-gray-400 placeholder:text-[12px] resize-none"
                                inputMode="numeric"
                                placeholder="输入人数"
                                rows={1}
                                maxLength={3}
                            />
                        </div>
                        <div className="flex flex-col flex-[2] bg-field-bg rounded-xl px-4 py-3">
                            <p className="text-text-main text-[16px] font-medium mb-1">费用</p>
                            <textarea
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full bg-transparent border-none p-0 text-text-main text-[16px] focus:ring-0 font-medium leading-normal mt-0.5 placeholder:text-gray-400 placeholder:text-[12px] resize-none"
                                placeholder="免费或AA制"
                                rows={1}
                                maxLength={15}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditActivityModal;
