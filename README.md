# MiraClass - Educational Social Network Platform

## 📖 프로젝트 소개

MiraClass는 교육용 소셜 네트워크 플랫폼으로, 학생과 교사가 함께 학습하고 소통할 수 있는 환경을 제공합니다. Vercel에 배포되어 누구나 쉽게 접근할 수 있습니다.

### 🎯 주요 기능

- **교육 중심 소셜 네트워크**: 학생과 교사를 위한 전용 플랫폼
- **반응형 웹 인터페이스**: 모든 기기에서 최적화된 사용자 경험
- **실시간 상호작용**: 실시간 메시지 및 알림 시스템
- **학습 관리**: 수업, 과제, 성적 관리 기능
- **안전한 환경**: JWT 기반 인증 및 데이터 보안

## 🏗️ Vercel 배포 아키텍처

```
┌─────────────────────┐
│    Next.js 14       │
│   (App Router)      │
│                     │
│  ┌───────────────┐  │
│  │   Frontend    │  │    ┌─────────────────┐
│  │   Pages       │◄─┼────┤    Vercel       │
│  └───────────────┘  │    │   Hosting       │
│                     │    └─────────────────┘
│  ┌───────────────┐  │
│  │  API Routes   │  │    ┌─────────────────┐
│  │  (Serverless) │◄─┼────┤   Supabase      │
│  └───────────────┘  │    │   Database      │
└─────────────────────┘    └─────────────────┘
```

## 🚀 Vercel 배포 가이드

### 1. Supabase 설정

1. **Supabase 프로젝트 생성**
   - [Supabase](https://supabase.com)에 접속하여 새 프로젝트 생성
   - 데이터베이스 비밀번호 설정 및 지역 선택

2. **데이터베이스 스키마 설정**
   ```sql
   -- supabase/schema.sql 파일의 내용을 SQL 에디터에서 실행
   -- 모든 테이블, 인덱스, RLS 정책이 자동으로 생성됩니다
   ```

### 2. Vercel 배포

1. **GitHub 저장소 연결**
   ```bash
   # 저장소 클론
   git clone https://github.com/your-username/miraclass.git
   cd miraclass
   ```

2. **Vercel 계정에서 프로젝트 임포트**
   - [Vercel Dashboard](https://vercel.com/dashboard)에서 "Add New" → "Project"
   - GitHub 저장소 선택하여 임포트

3. **환경 변수 설정 (Vercel)**
   다음 환경 변수들을 Vercel 프로젝트 설정에서 추가:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-jwt-secret
   DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
   ```

### 3. 로컬 개발 환경

1. **저장소 클론**
   ```bash
   git clone https://github.com/your-username/miraclass.git
   cd miraclass
   ```

2. **패키지 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   ```bash
   cp .env.local.example .env.local
   # .env.local 파일을 편집하여 Supabase 정보 입력
   ```

4. **개발 서버 실행**
   ```bash
   npm run dev
   ```

5. **서비스 접속**
   - 웹사이트: http://localhost:3000

## ⚙️ 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Ant Design, CSS Modules
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT, bcryptjs
- **Deployment**: Vercel
- **Analytics**: Vercel Analytics
- **State Management**: SWR
- **Charts**: D3.js, Recharts
- **Animations**: Framer Motion

## 🧪 테스트

### 단위 테스트
```bash
npm run test
```

### 통합 테스트
```bash
npm run test:integration
```

### E2E 테스트
```bash
npm run test:e2e
```

### 성능 테스트
```bash
npm run test:performance
```

## 🔧 개발 가이드

### 프로젝트 구조 (Vercel 최적화)

```
miraclass/
├── app/                    # Next.js 14 App Router
│   ├── globals.css         # 전역 스타일
│   ├── layout.tsx          # 루트 레이아웃
│   ├── page.tsx           # 홈페이지
│   ├── api/               # API Routes (Serverless)
│   │   ├── auth/          # 인증 관련 API
│   │   ├── users/         # 사용자 관련 API
│   │   └── classes/       # 수업 관련 API
│   ├── dashboard/         # 대시보드 페이지
│   └── profile/           # 프로필 페이지
├── components/            # 재사용 컴포넌트
│   ├── common/           # 공통 컴포넌트
│   ├── forms/            # 폼 컴포넌트
│   └── layout/           # 레이아웃 컴포넌트
├── lib/                  # 유틸리티 라이브러리
│   ├── supabase.js       # Supabase 클라이언트
│   ├── auth.ts           # 인증 헬퍼
│   └── utils.ts          # 공통 유틸리티
├── supabase/             # Supabase 설정
│   └── schema.sql        # 데이터베이스 스키마
├── public/               # 정적 파일
├── styles/               # 스타일 파일
└── types/                # TypeScript 타입 정의
```

### API 개발 (Next.js API Routes)

1. **새 API 엔드포인트 추가**
   ```javascript
   // app/api/example/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { supabase } from '@/lib/supabase';
   
   export async function GET(request: NextRequest) {
     try {
       const { data, error } = await supabase
         .from('users')
         .select('*');
       
       if (error) throw error;
       
       return NextResponse.json({ data });
     } catch (error) {
       return NextResponse.json(
         { error: 'Internal Server Error' },
         { status: 500 }
       );
     }
   }
   
   export async function POST(request: NextRequest) {
     // POST 로직 구현
   }
   ```

2. **데이터베이스 작업 (Supabase)**
   ```javascript
   // lib/database.ts
   import { supabase } from './supabase';
   
   export const userService = {
     async getUsers() {
       const { data, error } = await supabase
         .from('users')
         .select('*');
       return { data, error };
     },
     
     async createUser(userData: any) {
       const { data, error } = await supabase
         .from('users')
         .insert([userData]);
       return { data, error };
     }
   };
   ```

## 🚀 배포 관리

### Vercel 자동 배포
- **main 브랜치**: 프로덕션 환경 자동 배포
- **develop 브랜치**: 프리뷰 환경 자동 배포
- **Pull Request**: 프리뷰 URL 자동 생성

### 수동 배포
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

### 환경별 설정
```bash
# 프로덕션 환경 변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL production

# 프리뷰 환경 변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
```

## 📊 모니터링 및 분석

### Vercel Analytics
- 실시간 페이지 뷰 및 사용자 분석
- Core Web Vitals 모니터링
- 사용자 지역별 성능 분석

### Supabase 모니터링
- 데이터베이스 성능 모니터링
- API 사용량 추적
- 사용자 인증 로그

## 🔐 보안

### 환경 변수 관리
- **Vercel**: 프로덕션 환경 변수는 Vercel 대시보드에서 관리
- **로컬**: `.env.local` 파일 사용 (Git 제외)
- **Supabase**: Row Level Security (RLS) 정책으로 데이터 보호

### 인증 및 권한
- **JWT 기반 인증**: Supabase Auth 사용
- **Row Level Security**: 테이블별 접근 권한 제어
- **API 보호**: 미들웨어를 통한 인증 확인

### 보안 헤더
```javascript
// next.config.js에 설정된 보안 헤더
{
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin'
}
```

## 📚 환경별 설정

### 개발 환경 (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

### 프로덕션 환경 (Vercel)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

## 🚨 문제 해결 (Troubleshooting)

### 일반적인 문제

1. **빌드 실패**
   ```bash
   # 의존성 재설치
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Supabase 연결 오류**
   - 환경 변수 확인 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Supabase 프로젝트 상태 확인
   - 네트워크 연결 확인

3. **타입스크립트 오류**
   ```bash
   # 타입 체크
   npm run type-check
   ```

4. **Vercel 배포 실패**
   - 환경 변수 설정 확인
   - 빌드 로그 확인
   - `vercel.json` 설정 검증

### 성능 최적화

1. **번들 크기 분석**
   ```bash
   npm run analyze
   ```

2. **이미지 최적화**
   - Next.js Image 컴포넌트 사용
   - WebP 형식 사용 권장

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 개발 환경 설정
- Node.js 18+ 필수
- TypeScript 지식 권장
- Supabase 기본 이해

## 📄 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 지원 및 연락처

### 이슈 보고
- [GitHub Issues](https://github.com/your-username/miraclass/issues)

### 기술 스택 참조
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Ant Design Documentation](https://ant.design/)

---

**MiraClass** - 교육용 소셜 네트워크 플랫폼으로 더 나은 학습 환경을 제공합니다. 🚀