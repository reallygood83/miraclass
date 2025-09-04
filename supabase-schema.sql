-- MiraClass Database Schema for Supabase
-- 이 SQL 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. Schools 테이블 생성
CREATE TABLE IF NOT EXISTS schools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT DEFAULT '',
    contact_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    grade INTEGER,
    class_number INTEGER,
    student_number INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Classes 테이블 생성
CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    grade INTEGER,
    class_number INTEGER,
    enrollment_code VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Class Enrollments 테이블 생성
CREATE TABLE IF NOT EXISTS class_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, student_id)
);

-- 5. Student Relationships 테이블 생성
CREATE TABLE IF NOT EXISTS student_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_a_id UUID REFERENCES users(id) ON DELETE CASCADE,
    student_b_id UUID REFERENCES users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'friend',
    relationship_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_a_id, student_b_id)
);

-- 6. User Activity Logs 테이블 생성
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(name);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type ON user_activity_logs(activity_type);

-- Row Level Security (RLS) 정책 활성화
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (기본적인 보안 설정)

-- Schools 테이블: 모든 인증된 사용자가 읽기 가능
CREATE POLICY "Allow authenticated users to read schools" ON schools
    FOR SELECT TO authenticated USING (true);

-- Schools 테이블: 교사만 학교 생성 가능
CREATE POLICY "Allow teachers to insert schools" ON schools
    FOR INSERT TO authenticated WITH CHECK (true);

-- Users 테이블: 사용자는 자신의 정보만 조회 가능
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT TO authenticated USING (auth.uid()::text = id::text);

-- Users 테이블: 새 사용자 등록 허용
CREATE POLICY "Allow user registration" ON users
    FOR INSERT TO anon WITH CHECK (true);

-- Classes 테이블: 교사는 자신의 클래스 관리 가능
CREATE POLICY "Teachers can manage their classes" ON classes
    FOR ALL TO authenticated USING (auth.uid()::text = teacher_id::text);

-- Class Enrollments: 관련 사용자만 조회 가능
CREATE POLICY "Users can view relevant enrollments" ON class_enrollments
    FOR SELECT TO authenticated USING (
        auth.uid()::text = student_id::text OR 
        EXISTS (
            SELECT 1 FROM classes 
            WHERE classes.id = class_enrollments.class_id 
            AND classes.teacher_id::text = auth.uid()::text
        )
    );

-- User Activity Logs: 사용자는 자신의 로그만 조회 가능
CREATE POLICY "Users can view own activity logs" ON user_activity_logs
    FOR SELECT TO authenticated USING (auth.uid()::text = user_id::text);

-- User Activity Logs: 시스템에서 로그 생성 허용
CREATE POLICY "Allow system to insert activity logs" ON user_activity_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- Student Relationships: 관련 학생들만 조회 가능
CREATE POLICY "Students can view their relationships" ON student_relationships
    FOR SELECT TO authenticated USING (
        auth.uid()::text = student_a_id::text OR 
        auth.uid()::text = student_b_id::text
    );

COMMENT ON TABLE schools IS 'MiraClass - 학교 정보 테이블';
COMMENT ON TABLE users IS 'MiraClass - 사용자 정보 테이블 (학생, 교사, 관리자)';
COMMENT ON TABLE classes IS 'MiraClass - 클래스/반 정보 테이블';
COMMENT ON TABLE class_enrollments IS 'MiraClass - 클래스 등록 정보 테이블';
COMMENT ON TABLE student_relationships IS 'MiraClass - 학생 관계 정보 테이블';
COMMENT ON TABLE user_activity_logs IS 'MiraClass - 사용자 활동 로그 테이블';