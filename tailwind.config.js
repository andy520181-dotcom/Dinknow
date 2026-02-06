/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./App.tsx",
        "./index.tsx",
        "./components/**/*.{ts,tsx}",
        "./views/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            // 自定义颜色配置，扩展而不覆盖默认颜色
            colors: {
                // 保留所有Tailwind默认颜色，然后添加自定义颜色
                "court-blue": "#0056B3",
                "court-blue-dark": "#004494",
                "profile-blue": "#0052CC",
                "ios-blue": "#007AFF",
                "pickleball-neon": "#DFFF00",
                "neon-green": "#BFFF00",
                "ios-bg": "#F2F2F7",
                "card-grey": "#F2F2F7",
                "field-bg": "#F2F2F7",
                "field-border": "#E5E5EA",
                "text-main": "#000000",
                "text-secondary": "#8E8E93"
            },
            // 自定义字体配置
            fontFamily: {
                "ios": ["-apple-system", "BlinkMacSystemFont", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "sans-serif"]
            },
            // 自定义圆角配置
            borderRadius: {
                "xl": "0.75rem",
                "2xl": "1.25rem",
                "3xl": "1.75rem",
            },
        },
    },
    plugins: [
        // Forms插件
        require('@tailwindcss/forms'),
        // Container queries插件
        require('@tailwindcss/container-queries'),
    ],
}
