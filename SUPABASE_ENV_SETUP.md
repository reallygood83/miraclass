# 🔧 Supabase 환경변수 설정 가이드

## 1단계: Supabase Dashboard에서 API 키 가져오기

1. **Supabase Dashboard 접속**
   - [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - 생성한 `miraclass` 프로젝트 클릭

2. **Settings → API로 이동**
   - 왼쪽 사이드바 → Settings → API

3. **3개 값 복사**:
   ```
   Project URL: https://xxxxxxxxxxxx.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 2단계: .env.local 파일 업데이트

`.env.local` 파일에서 다음 3줄을 실제 값으로 변경:

```bash
# ❌ 변경 전 (더미값):
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# ✅ 변경 후 (실제값):
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3단계: 개발 서버 재시작

```bash
# 기존 서버 중지 (Ctrl+C)
# 새로 시작
npm run dev
```

## 4단계: 회원가입 테스트

브라우저에서 http://localhost:3000/auth/register 접속하여 회원가입 테스트

---

**⚠️ 중요:** 실제 API 키를 입력해야 Supabase 연결이 가능합니다!