import React, { useState } from 'react';

interface LoginProps {
    onComplete: (userData: { phone: string; countryCode: string; nickname: string; gender: string; dupr: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onComplete }) => {
    const [countryCode, setCountryCode] = useState('+86');
    const [phone, setPhone] = useState('');
    const [nickname, setNickname] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | ''>('');
    const [dupr, setDupr] = useState('');
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    const countryCodes = [
        { code: '+86', name: '中国' },
        { code: '+65', name: '新加坡' },
        { code: '+60', name: '马来西亚' },
        { code: '+84', name: '越南' },
        { code: '+66', name: '泰国' },
        { code: '+63', name: '菲律宾' },
        { code: '+62', name: '印度尼西亚' },
        { code: '+852', name: '香港' },
        { code: '+853', name: '澳门' },
        { code: '+886', name: '台湾' },
        { code: '+1', name: '美国/加拿大' },
        { code: '+44', name: '英国' },
        { code: '+81', name: '日本' },
        { code: '+82', name: '韩国' },
        { code: '+61', name: '澳大利亚' },
    ];

    const levels = ['2.0-2.5', '3.0', '3.5', '4.0', '4.5', '5.0+'];
    const levelNames: Record<string, string> = {
        '2.0-2.5': '初中级',
        '3.0': '中级',
        '3.5': '中高级',
        '4.0': '高级',
        '4.5': '专业级',
        '5.0+': '竞赛级'
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // 只保留数字
        // 根据不同国家码限制长度
        const maxLength = countryCode === '+86' ? 11 : 15;
        if (value.length <= maxLength) {
            setPhone(value);
        }
    };

    const isFormValid = phone && phone.length >= 6 && nickname && nickname.trim().length > 0 && gender !== '' && dupr !== '';

    const handleSubmit = () => {
        // 验证昵称
        if (!nickname || nickname.trim().length === 0) {
            alert('请输入昵称');
            return;
        }

        // 验证手机号
        if (countryCode === '+86' && phone.length !== 11) {
            alert('请输入11位手机号码');
            return;
        }
        if (!phone || phone.length < 6) {
            alert('请输入有效的手机号码');
            return;
        }

        // 验证性别和DUPR
        if (!gender) {
            alert('请选择性别');
            return;
        }
        if (!dupr) {
            alert('请选择DUPR水平');
            return;
        }

        console.log('[Login] 提交用户信息:', { countryCode, phone, nickname, gender, dupr });

        onComplete({
            phone: `${countryCode} ${phone}`,
            countryCode,
            nickname: nickname.trim(),
            gender: gender as string,
            dupr
        });
    };

    return (
        <div className="w-full h-full flex flex-col bg-white">
            {/* Main Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 pt-safe">
                {/* 欢迎语 */}
                <div className="mt-8 mb-12">
                    <h1 className="text-[28px] font-bold text-slate-900 mb-2">欢迎来到 Dinknow</h1>
                    <p className="text-[15px] text-slate-500">让我们一起匹克球</p>
                </div>

                {/* 手机号 */}
                <div className="mb-8 relative z-50">
                    <label className="text-slate-400 text-[13px] font-medium block mb-2">手机号码</label>
                    <div className="flex items-center border-b border-slate-200 pb-2 transition-colors focus-within:border-slate-900">
                        {/* 国家码选择器 */}
                        <div className="relative shrink-0">
                            <button
                                onClick={() => setShowCountryPicker(!showCountryPicker)}
                                className="flex items-center gap-1 pr-3 border-r border-slate-200 mr-3 shrink-0 py-1"
                            >
                                <span className="text-[17px] font-semibold text-slate-900">{countryCode}</span>
                                <span className={`text-slate-400 transition-transform duration-200 ${showCountryPicker ? 'rotate-180' : ''}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M7 10l5 5 5-5z" />
                                    </svg>
                                </span>
                            </button>

                            {/* 国家码列表 - 绝对定位 */}
                            {showCountryPicker && (
                                <div className="absolute top-full left-0 mt-2 w-[180px] max-h-60 overflow-y-auto bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-2 z-50">
                                    {countryCodes.map((country) => (
                                        <button
                                            key={country.code}
                                            onClick={() => {
                                                setCountryCode(country.code);
                                                setShowCountryPicker(false);
                                                setPhone('');
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${countryCode === country.code ? 'bg-slate-50 text-ios-blue' : 'text-slate-700'
                                                }`}
                                        >
                                            <span className="text-[15px] font-medium flex-1 text-left">{country.name}</span>
                                            <span className="text-[13px] opacity-60">{country.code}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <input
                            type="tel"
                            value={phone}
                            onChange={handlePhoneChange}
                            className="flex-1 bg-transparent border-none p-0 text-slate-900 text-[18px] focus:ring-0 font-medium placeholder:text-slate-300 placeholder:font-normal leading-normal"
                            placeholder="请输入手机号码"
                            inputMode="numeric"
                        />

                        {phone && (
                            <button onClick={() => setPhone('')} className="p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-slate-300">
                                    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* 昵称 */}
                <div className="mb-8">
                    <label className="text-slate-400 text-[13px] font-medium block mb-2">昵称</label>
                    <div className="flex items-center border-b border-slate-200 pb-2 transition-colors focus-within:border-slate-900">
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="flex-1 bg-transparent border-none p-0 text-slate-900 text-[18px] focus:ring-0 font-medium placeholder:text-slate-300 placeholder:font-normal leading-normal"
                            placeholder="请输入您的昵称"
                            maxLength={20}
                        />
                    </div>
                </div>

                {/* 性别 */}
                <div className="mb-8">
                    <label className="text-slate-400 text-[13px] font-medium block mb-3">性别</label>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setGender('male')}
                            className={`flex-1 py-3.5 rounded-full transition-all duration-300 border flex items-center justify-center gap-2 ${gender === 'male'
                                ? 'bg-ios-blue text-white border-ios-blue shadow-lg shadow-ios-blue/30'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z" />
                            </svg>
                            <span className="text-[15px] font-semibold">男</span>
                        </button>
                        <button
                            onClick={() => setGender('female')}
                            className={`flex-1 py-3.5 rounded-full transition-all duration-300 border flex items-center justify-center gap-2 ${gender === 'female'
                                ? 'bg-ios-blue text-white border-ios-blue shadow-lg shadow-ios-blue/30'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 7h-2v13H8v2h8v-2h-3v-1h.5c.83 0 1.5-.67 1.5-1.5V11c0-.83-.67-1.5-1.5-1.5H9c-.83 0-1.5.67-1.5 1.5v3.5A1.5 1.5 0 0 0 9 16h2V9h-3V7h11v2z" />
                            </svg>
                            <span className="text-[15px] font-semibold">女</span>
                        </button>
                    </div>
                </div>

                {/* DUPR 水平 */}
                <div className="mb-8">
                    <label className="text-slate-400 text-[13px] font-medium block mb-3">DUPR 等级</label>
                    <div className="grid grid-cols-3 gap-3">
                        {levels.map((lvl) => (
                            <button
                                key={lvl}
                                onClick={() => setDupr(lvl)}
                                className={`py-2.5 rounded-xl transition-all duration-200 flex flex-col items-center justify-center border ${dupr === lvl
                                    ? 'bg-ios-blue text-white border-ios-blue shadow-md shadow-ios-blue/20'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <span className="text-[12px] opacity-80 leading-tight mb-0.5">{levelNames[lvl]}</span>
                                <span className="text-[14px] font-bold leading-tight">{lvl}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Spacer for bottom button visibility */}
                <div className="h-4"></div>
            </div>

            {/* Submit Button - Raised position */}
            <div className="px-6 pb-safe pt-4 shrink-0 bg-white" style={{ marginBottom: '40px' }}>
                <button
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                    className={`w-full py-4 rounded-full font-bold text-[17px] transition-all duration-300 ${isFormValid
                        ? 'bg-ios-blue text-white shadow-[0_8px_25px_rgba(0,122,255,0.25)] active:scale-[0.98] hover:brightness-105'
                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        }`}
                >
                    开始使用
                </button>
            </div>
        </div>
    );
};

export default Login;
