import { supabase } from '../supabase-client';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
    id: string;
    name: string;
    phone?: string;
    gender?: string;
    avatar?: string;
    dupr: string;
    location?: string;
    latitude?: number;
    longitude?: number;
}

export class AuthService {
    /**
     * 匿名登录
     * 如果已登录则返回当前用户
     */
    static async signInAnonymously(): Promise<{ user: User | null; error?: any }> {
        try {
            // 检查是否已有会话
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                console.log('[Auth] 已登录用户:', session.user.id);
                return { user: session.user };
            }

            // 匿名登录
            const { data, error } = await supabase.auth.signInAnonymously();

            if (error) {
                console.error('[Auth] 匿名登录失败:', error);

                // --- MOCK FALLBACK ---
                console.log('[Auth] 启用离线Mock模式');
                return {
                    user: {
                        id: 'mock-user-12345',
                        app_metadata: {},
                        user_metadata: {},
                        aud: 'authenticated',
                        created_at: new Date().toISOString()
                    } as User
                };
                // ---------------------
            }

            console.log('[Auth] 匿名登录成功:', data.user?.id);

            return { user: data.user };
        } catch (error) {
            console.error('[Auth] 登录异常:', error);
            // --- MOCK FALLBACK ---
            return {
                user: {
                    id: 'mock-user-12345',
                    app_metadata: {},
                    user_metadata: {},
                    aud: 'authenticated',
                    created_at: new Date().toISOString()
                } as User
            };
            // ---------------------
        }
    }

    /**
     * 创建用户资料（供登录后调用）
     */
    static async createUserProfile(userId: string, userData: { phone: string; countryCode?: string; nickname: string; gender: string; dupr: string }): Promise<boolean> {
        // --- MOCK CHECK ---
        if (userId === 'mock-user-12345') {
            console.log('[Auth] Mock用户资料创建成功');
            return true;
        }
        // ------------------

        try {
            const { error } = await supabase
                .from('users')
                .upsert({
                    id: userId,
                    name: userData.nickname,  // 使用用户输入的昵称
                    phone: userData.phone,
                    gender: userData.gender,
                    dupr: userData.dupr,
                    avatar: `/api/placeholder/100/100`
                }, { onConflict: 'id' });

            if (error) {
                console.error('[Auth] 创建用户资料失败:', error);
                return false;
            }

            console.log('[Auth] 用户资料已创建');
            return true;
        } catch (error) {
            console.error('[Auth] 创建用户资料异常:', error);
            return false;
        }
    }

    /**
     * 获取用户资料
     */
    static async getUserProfile(userId: string): Promise<UserProfile | null> {
        // --- MOCK CHECK ---
        if (userId === 'mock-user-12345') {
            const { MOCK_USER_PROFILE } = await import('./mockData');
            return MOCK_USER_PROFILE;
        }
        // ------------------

        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('[Auth] 获取用户资料失败:', error);
                return null;
            }

            return data as UserProfile;
        } catch (error) {
            console.error('[Auth] 获取用户资料异常:', error);
            return null;
        }
    }

    /**
     * 更新用户资料
     */
    static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
        // --- MOCK CHECK ---
        if (userId === 'mock-user-12345') {
            console.log('[Auth] Mock用户资料已更新(内存中)');
            return true;
        }
        // ------------------

        try {
            const { error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', userId);

            if (error) {
                console.error('[Auth] 更新用户资料失败:', error);
                return false;
            }

            console.log('[Auth] 用户资料已更新');
            return true;
        } catch (error) {
            console.error('[Auth] 更新用户资料异常:', error);
            return false;
        }
    }

    /**
     * 更新用户位置
     */
    static async updateUserLocation(userId: string, location: string, latitude: number, longitude: number): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    location,
                    latitude,
                    longitude
                })
                .eq('id', userId);

            if (error) {
                console.error('[Auth] 更新位置失败:', error);
                return false;
            }

            console.log('[Auth] 位置已更新:', location);
            return true;
        } catch (error) {
            console.error('[Auth] 更新位置异常:', error);
            return false;
        }
    }

    /**
     * 获取当前用户
     */
    static async getCurrentUser(): Promise<User | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            return user;
        } catch (error) {
            console.error('[Auth] 获取当前用户失败:', error);
            return null;
        }
    }

    /**
     * 登出
     */
    static async signOut(): Promise<void> {
        try {
            await supabase.auth.signOut();
            console.log('[Auth] 已登出');
        } catch (error) {
            console.error('[Auth] 登出失败:', error);
        }
    }

    /**
     * 监听认证状态变化
     */
    static onAuthStateChange(callback: (user: User | null) => void) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            callback(session?.user || null);
        });

        return subscription;
    }
}
