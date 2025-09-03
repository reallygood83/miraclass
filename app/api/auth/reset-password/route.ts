import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: '이메일을 입력해주세요.' },
        { status: 400 }
      );
    }

    // Supabase Auth를 사용한 비밀번호 재설정
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/update-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      return NextResponse.json(
        { error: '비밀번호 재설정 요청에 실패했습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: '비밀번호 재설정 링크를 이메일로 보내드렸습니다.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}