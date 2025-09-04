# MiraClass Supabase 설정 가이드

## 1단계: Supabase 프로젝트 생성

1. [https://supabase.com](https://supabase.com)에 로그인
2. "New project" 클릭
3. Organization 선택
4. Project name: `miraclass`
5. Database password: 강력한 비밀번호 설정 (기록해두세요!)
6. Region: `Northeast Asia (Seoul)` 선택
7. "Create new project" 클릭

## 2단계: 데이터베이스 스키마 생성

1. Supabase Dashboard → SQL Editor로 이동
2. "New query" 클릭
3. `supabase-schema.sql` 파일의 모든 내용을 복사해서 붙여넣기
4. "Run" 버튼 클릭하여 실행
5. 실행 완료 후 "Table Editor"에서 6개 테이블 생성 확인:
   - schools
   - users  
   - classes
   - class_enrollments
   - student_relationships
   - user_activity_logs

## 3단계: API 키 확인

1. Supabase Dashboard → Settings → API로 이동
2. 다음 정보들을 복사해두세요:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon public**: `eyJ...` (공개용 키)
   - **Service_role**: `eyJ...` (관리자용 키, 비밀!)

## 4단계: 환경변수 업데이트

### 로컬 개발용 (`.env.local` 파일 수정):
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Vercel 배포용:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. 다음 3개 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key

## 5단계: 연결 테스트

```bash
# 개발 서버 시작
npm run dev

# 새 터미널에서 회원가입 테스트
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트교사",
    "email": "test@teacher.com",
    "password": "123456",
    "role": "teacher",
    "school_name": "테스트초등학교"
  }'
```

## 6단계: RLS (Row Level Security) 확인

1. Table Editor → users 테이블 → "RLS enabled" 확인
2. Authentication → Policies에서 정책 목록 확인
3. 필요시 정책 수정/추가

## 문제 해결

### 연결 오류시:
1. Project URL이 정확한지 확인 (https:// 포함)
2. API 키에 공백이나 줄바꿈이 없는지 확인
3. Supabase 프로젝트가 활성 상태인지 확인

### RLS 정책 문제시:
- 처음에는 모든 정책을 비활성화하고 기본 CRUD 작동 확인
- 이후 점진적으로 보안 정책 적용

### 데이터베이스 초기화가 필요한 경우:
```sql
-- 모든 테이블 삭제 (주의!)
DROP TABLE IF EXISTS user_activity_logs CASCADE;
DROP TABLE IF EXISTS student_relationships CASCADE;
DROP TABLE IF EXISTS class_enrollments CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
```

## 완료 확인 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] SQL 스키마 실행으로 6개 테이블 생성
- [ ] API 키 3개 확보 (URL, ANON_KEY, SERVICE_ROLE_KEY)
- [ ] 로컬 환경변수 업데이트
- [ ] Vercel 환경변수 설정  
- [ ] `npm run dev`로 개발서버 시작 성공
- [ ] 회원가입 API 테스트 성공
- [ ] RLS 정책 활성화 상태 확인

모든 단계 완료 후 MiraClass 애플리케이션이 정상 작동합니다! 🎉