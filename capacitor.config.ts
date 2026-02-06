import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.dinknow.app',
    appName: 'dinknow',
    webDir: 'dist',
    ios: {
        contentInset: 'automatic',
    },
    server: {
        // 开发时使用本地服务器
        // url: 'http://localhost:5173',
        // cleartext: true
    }
};

export default config;
