import { createClient } from '@supabase/supabase-js';

// Supabase配置 - 需要在Supabase项目设置中获取
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库类型定义
export interface Database {
    public: {
        Tables: {
            activities: {
                Row: {
                    id: string;
                    title: string;
                    location: string;
                    time: string;
                    date: string;
                    current_participants: number;
                    max_participants: number;
                    price: string;
                    level: string;
                    level_color: string;
                    status: string;
                    type: string;
                    creator_id: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['activities']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['activities']['Insert']>;
            };
            users: {
                Row: {
                    id: string;
                    name: string;
                    avatar: string;
                    dupr: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['users']['Insert']>;
            };
        };
    };
}
