import { supabase } from '../supabase-client';
import { Activity } from '../types';

export class ActivityService {
    /**
     * 创建活动
     */
    static async createActivity(activityData: Omit<Activity, 'id' | 'isCreator'>, creatorId: string): Promise<Activity | null> {
        try {
            const { data, error } = await supabase
                .from('activities')
                .insert({
                    title: activityData.title,
                    location: activityData.location,
                    time: activityData.time,
                    date: new Date().toISOString(),
                    current_participants: activityData.currentParticipants,
                    max_participants: activityData.maxParticipants,
                    price: activityData.price,
                    level: activityData.level,
                    level_color: activityData.levelColor,
                    status: activityData.status,
                    type: activityData.type,
                    creator_id: creatorId
                })
                .select()
                .single();

            if (error) {
                console.error('[Activity] 创建活动失败:', error);
                return null;
            }

            console.log('[Activity] 活动创建成功:', data.id);
            return this.mapToActivity(data, creatorId);
        } catch (error) {
            console.error('[Activity] 创建活动异常:', error);
            return null;
        }
    }

    /**
     * 更新活动
     */
    static async updateActivity(activityId: string, updates: Partial<Activity>): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('activities')
                .update({
                    title: updates.title,
                    location: updates.location,
                    time: updates.time,
                    max_participants: updates.maxParticipants,
                    price: updates.price,
                    level: updates.level,
                    level_color: updates.levelColor,
                    type: updates.type,
                    status: updates.status
                })
                .eq('id', activityId);

            if (error) {
                console.error('[Activity] 更新活动失败:', error);
                return false;
            }

            console.log('[Activity] 活动更新成功:', activityId);
            return true;
        } catch (error) {
            console.error('[Activity] 更新活动异常:', error);
            return false;
        }
    }

    /**
     * 删除活动
     */
    static async deleteActivity(activityId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('activities')
                .delete()
                .eq('id', activityId);

            if (error) {
                console.error('[Activity] 删除活动失败:', error);
                return false;
            }

            console.log('[Activity] 活动删除成功:', activityId);
            return true;
        } catch (error) {
            console.error('[Activity] 删除活动异常:', error);
            return false;
        }
    }

    /**
     * 获取所有活动
     */
    static async getActivities(currentUserId?: string): Promise<Activity[]> {
        // --- MOCK CHECK ---
        if (currentUserId === 'mock-user-12345') {
            const { MOCK_ACTIVITIES } = await import('./mockData');
            return MOCK_ACTIVITIES;
        }
        // ------------------

        try {
            const { data, error } = await supabase
                .from('activities')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[Activity] 获取活动列表失败:', error);
                // Fallback on error too
                const { MOCK_ACTIVITIES } = await import('./mockData');
                return MOCK_ACTIVITIES;
            }

            return data.map(item => this.mapToActivity(item, currentUserId));
        } catch (error) {
            console.error('[Activity] 获取活动列表异常:', error);
            const { MOCK_ACTIVITIES } = await import('./mockData');
            return MOCK_ACTIVITIES;
        }
    }

    /**
     * 实时订阅活动变化
     */
    static subscribeToActivities(callback: (activities: Activity[]) => void, currentUserId?: string) {
        const channel = supabase
            .channel('activities-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'activities' },
                async () => {
                    // 重新获取所有活动
                    const activities = await this.getActivities(currentUserId);
                    callback(activities);
                }
            )
            .subscribe();

        return channel;
    }

    /**
     * 加入活动
     */
    static async joinActivity(activityId: string, userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('activity_participants')
                .insert({
                    activity_id: activityId,
                    user_id: userId
                });

            if (error) {
                console.error('[Activity] 加入活动失败:', error);
                return false;
            }

            console.log('[Activity] 加入活动成功:', activityId);
            return true;
        } catch (error) {
            console.error('[Activity] 加入活动异常:', error);
            return false;
        }
    }

    /**
     * 退出活动
     */
    static async leaveActivity(activityId: string, userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('activity_participants')
                .delete()
                .eq('activity_id', activityId)
                .eq('user_id', userId);

            if (error) {
                console.error('[Activity] 退出活动失败:', error);
                return false;
            }

            console.log('[Activity] 退出活动成功:', activityId);
            return true;
        } catch (error) {
            console.error('[Activity] 退出活动异常:', error);
            return false;
        }
    }

    /**
     * 将数据库记录映射为Activity类型
     */
    private static mapToActivity(dbRecord: any, currentUserId?: string): Activity {
        return {
            id: dbRecord.id,
            title: dbRecord.title,
            location: dbRecord.location,
            time: dbRecord.time,
            currentParticipants: dbRecord.current_participants,
            maxParticipants: dbRecord.max_participants,
            price: dbRecord.price,
            level: dbRecord.level,
            levelColor: dbRecord.level_color,
            status: dbRecord.status,
            type: dbRecord.type,
            isCreator: currentUserId === dbRecord.creator_id,
            // NOTE: 将 created_at 转为相对时间，展示活动的时效性
            publishTime: dbRecord.created_at
                ? ActivityService.formatRelativeTime(dbRecord.created_at)
                : undefined
        };
    }

    /**
     * 将 ISO 时间字符串格式化为相对时间（如"刚刚"、"3分钟前"、"2小时前"）
     */
    private static formatRelativeTime(isoString: string): string {
        const diffMin = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
        if (diffMin < 1) return '刚刚';
        if (diffMin < 60) return `${diffMin}分钟前`;
        const diffHour = Math.floor(diffMin / 60);
        if (diffHour < 24) return `${diffHour}小时前`;
        const diffDay = Math.floor(diffHour / 24);
        if (diffDay < 30) return `${diffDay}天前`;
        return `${Math.floor(diffDay / 30)}个月前`;
    }
}
