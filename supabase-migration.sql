-- MiraClass Database Migration Script
-- Supabase에서 기존 테이블 구조를 새 스키마에 맞게 업데이트

-- 1. 기존 테이블들 확인 및 수정
-- Schools 테이블에 누락된 컬럼들 추가
DO $$
BEGIN
    -- code 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'code'
    ) THEN
        ALTER TABLE schools ADD COLUMN code VARCHAR(50);
        -- 기존 데이터에 임시 코드 생성 (ROW_NUMBER 대신 sequence 사용)
        WITH numbered_schools AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn 
            FROM schools WHERE code IS NULL
        )
        UPDATE schools 
        SET code = 'SCH' || LPAD(numbered_schools.rn::TEXT, 3, '0')
        FROM numbered_schools 
        WHERE schools.id = numbered_schools.id;
        
        -- UNIQUE 제약조건 추가
        ALTER TABLE schools ADD CONSTRAINT schools_code_unique UNIQUE (code);
    END IF;

    -- type 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'type'
    ) THEN
        ALTER TABLE schools ADD COLUMN type VARCHAR(50) DEFAULT 'elementary' CHECK (type IN ('elementary', 'middle', 'high'));
    END IF;

    -- city 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'city'
    ) THEN
        ALTER TABLE schools ADD COLUMN city VARCHAR(100);
    END IF;

    -- state 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'state'
    ) THEN
        ALTER TABLE schools ADD COLUMN state VARCHAR(100);
    END IF;

    -- postal_code 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'postal_code'
    ) THEN
        ALTER TABLE schools ADD COLUMN postal_code VARCHAR(20);
    END IF;

    -- country 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'country'
    ) THEN
        ALTER TABLE schools ADD COLUMN country VARCHAR(2) DEFAULT 'KR';
    END IF;

    -- phone 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'phone'
    ) THEN
        ALTER TABLE schools ADD COLUMN phone VARCHAR(20);
    END IF;

    -- email 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'email'
    ) THEN
        ALTER TABLE schools ADD COLUMN email VARCHAR(255);
    END IF;

    -- description 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'description'
    ) THEN
        ALTER TABLE schools ADD COLUMN description TEXT;
    END IF;

    -- established_year 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'established_year'
    ) THEN
        ALTER TABLE schools ADD COLUMN established_year INTEGER;
    END IF;

    -- principal_name 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'principal_name'
    ) THEN
        ALTER TABLE schools ADD COLUMN principal_name VARCHAR(255);
    END IF;

    -- subscription_plan 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'subscription_plan'
    ) THEN
        ALTER TABLE schools ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'premium', 'enterprise'));
    END IF;

    -- contact_info 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'contact_info'
    ) THEN
        ALTER TABLE schools ADD COLUMN contact_info JSONB DEFAULT '{}';
    END IF;

    -- features 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'features'
    ) THEN
        ALTER TABLE schools ADD COLUMN features JSONB DEFAULT '{}';
    END IF;

    -- student_count 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'student_count'
    ) THEN
        ALTER TABLE schools ADD COLUMN student_count INTEGER DEFAULT 0;
    END IF;

    -- teacher_count 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'teacher_count'
    ) THEN
        ALTER TABLE schools ADD COLUMN teacher_count INTEGER DEFAULT 0;
    END IF;

    -- class_count 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'class_count'
    ) THEN
        ALTER TABLE schools ADD COLUMN class_count INTEGER DEFAULT 0;
    END IF;

    -- deleted_at 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE schools ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;

END $$;

-- 2. Users 테이블 누락된 컬럼들 추가
DO $$
BEGIN
    -- phone 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone'
    ) THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(20);
    END IF;

    -- profile_image 컬럼 추가 (없는 경우에만)  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'profile_image'
    ) THEN
        ALTER TABLE users ADD COLUMN profile_image TEXT;
    END IF;

    -- date_of_birth 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'date_of_birth'
    ) THEN
        ALTER TABLE users ADD COLUMN date_of_birth DATE;
    END IF;

    -- gender 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'gender'
    ) THEN
        ALTER TABLE users ADD COLUMN gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other'));
    END IF;

    -- address 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'address'
    ) THEN
        ALTER TABLE users ADD COLUMN address TEXT;
    END IF;

    -- emergency_contact 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'emergency_contact'
    ) THEN
        ALTER TABLE users ADD COLUMN emergency_contact JSONB DEFAULT '{}';
    END IF;

    -- preferences 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'preferences'
    ) THEN
        ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';
    END IF;

    -- last_login 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login'
    ) THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMPTZ;
    END IF;

    -- email_verified 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;

    -- email_verified_at 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_verified_at'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ;
    END IF;

    -- deleted_at 컬럼 추가 (없는 경우에만)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;

END $$;

-- 3. 기존 데이터에 기본값 설정
-- code 컬럼이 NULL인 경우 처리
WITH numbered_schools AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn 
    FROM schools WHERE code IS NULL
)
UPDATE schools 
SET code = 'SCH' || LPAD(numbered_schools.rn::TEXT, 3, '0')
FROM numbered_schools 
WHERE schools.id = numbered_schools.id;

-- 다른 기본값들 설정
UPDATE schools SET 
    type = 'elementary'
WHERE type IS NULL;

UPDATE schools SET 
    country = 'KR'
WHERE country IS NULL;

UPDATE schools SET 
    subscription_plan = 'basic'
WHERE subscription_plan IS NULL;

UPDATE schools SET 
    contact_info = '{}'
WHERE contact_info IS NULL;

UPDATE schools SET 
    features = '{}'
WHERE features IS NULL;

UPDATE schools SET 
    student_count = 0
WHERE student_count IS NULL;

UPDATE schools SET 
    teacher_count = 0
WHERE teacher_count IS NULL;

UPDATE schools SET 
    class_count = 0
WHERE class_count IS NULL;

-- 4. 제약조건은 이미 위에서 추가됨 (schools_code_unique)

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(code);
CREATE INDEX IF NOT EXISTS idx_schools_type ON schools(type);
CREATE INDEX IF NOT EXISTS idx_users_school_grade_class ON users(school_id, grade, class_number);

COMMENT ON TABLE schools IS 'MiraClass - 학교 정보 테이블 (확장 스키마)';
COMMENT ON TABLE users IS 'MiraClass - 사용자 정보 테이블 (확장 스키마)';

-- 완료 메시지
SELECT 'MiraClass 데이터베이스 마이그레이션 완료!' as migration_status;