-- Supabase 数据库表结构
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    avatar TEXT,
    dupr TEXT DEFAULT '2.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建活动表
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    time TEXT NOT NULL,
    date TEXT NOT NULL,
    current_participants INTEGER DEFAULT 0,
    max_participants INTEGER NOT NULL,
    price TEXT DEFAULT '0',
    level TEXT NOT NULL,
    level_color TEXT DEFAULT 'neon',
    status TEXT DEFAULT 'open',
    type TEXT DEFAULT 'mixed',
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建活动参与者关联表
CREATE TABLE IF NOT EXISTS activity_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(activity_id, user_id)
);

-- 4. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_activities_creator_id ON activities(creator_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_participants_activity_id ON activity_participants(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_user_id ON activity_participants(user_id);

-- 5. 启用行级安全性 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;

-- 6. 创建 RLS 策略
-- 用户表：所有人可读，只能更新自己的数据
CREATE POLICY "Users are viewable by everyone" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 活动表：所有人可读，创建者可编辑删除
CREATE POLICY "Activities are viewable by everyone" ON activities
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create activities" ON activities
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their activities" ON activities
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their activities" ON activities
    FOR DELETE USING (auth.uid() = creator_id);

-- 参与者表：所有人可读，可以加入和退出
CREATE POLICY "Participants are viewable by everyone" ON activity_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can join activities" ON activity_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave activities" ON activity_participants
    FOR DELETE USING (auth.uid() = user_id);

-- 7. 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. 创建函数：同步参与者数量
CREATE OR REPLACE FUNCTION sync_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE activities 
        SET current_participants = current_participants + 1
        WHERE id = NEW.activity_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE activities 
        SET current_participants = current_participants - 1
        WHERE id = OLD.activity_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_activity_participant_count
AFTER INSERT OR DELETE ON activity_participants
FOR EACH ROW EXECUTE FUNCTION sync_participant_count();
