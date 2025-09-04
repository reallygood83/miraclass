import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin, dbHelpers } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // supabaseAdmin 확인
    if (!supabaseAdmin) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    }

    // 사용자 찾기 (모든 역할에서 검색)
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .limit(1);

    if (error || !users || users.length === 0) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    const user = users[0];

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // JWT 토큰 생성
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: Buffer.from(user.name, 'utf8').toString('utf8'), // 한국어 인코딩 수정
        role: user.role,
        school_id: user.school_id
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // 비밀번호 해시 제거 후 응답
    const { password_hash: _, ...userResponse } = user;

    // 로그인 성공 로그 기록
    await supabaseAdmin
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        activity_type: 'login',
        details: { login_time: new Date().toISOString() }
      });

    return NextResponse.json({
      message: '로그인 성공',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      details: (error as any)?.details
    });
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        debug: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}