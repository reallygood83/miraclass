import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// 보호가 필요한 경로들 (대시보드는 클라이언트에서 인증 처리)
const protectedPaths = ['/profile', '/classes', '/settings'];
const authPaths = ['/auth/login', '/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // API 라우트는 자체적으로 인증 처리
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 정적 파일들은 건드리지 않음
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  // 보호된 페이지 접근 시도
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }
      
      jwt.verify(token, jwtSecret);
      return NextResponse.next();
    } catch (error) {
      // 유효하지 않은 토큰
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  // 인증 페이지에 이미 로그인된 사용자가 접근
  if (authPaths.includes(pathname) && token) {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }
      
      jwt.verify(token, jwtSecret);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      // 유효하지 않은 토큰은 그대로 진행
      const response = NextResponse.next();
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};