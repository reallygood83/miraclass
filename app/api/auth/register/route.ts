import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email, name, password, role = 'student', school_name, grade, class_number } = await request.json();

    // 입력 검증
    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: '필수 필드를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 역할별 추가 검증
    if (role === 'teacher' && !school_name) {
      return NextResponse.json(
        { error: '교사 등록 시 학교명이 필요합니다.' },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1);

    if (checkError) {
      throw checkError;
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 400 }
      );
    }

    // 학교 찾기 또는 생성 (교사의 경우)
    let school_id = null;
    if (role === 'teacher' && school_name) {
      const { data: schools, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .eq('name', school_name)
        .limit(1);

      if (schoolError) throw schoolError;

      if (schools && schools.length > 0) {
        school_id = schools[0].id;
      } else {
        // 새 학교 생성
        const { data: newSchool, error: newSchoolError } = await supabase
          .from('schools')
          .insert({
            name: school_name,
            address: '',
            contact_info: {}
          })
          .select('id')
          .single();

        if (newSchoolError) throw newSchoolError;
        school_id = newSchool.id;
      }
    }

    // 비밀번호 해시화
    const password_hash = await bcrypt.hash(password, 12);

    // 사용자 계정 생성
    const userData: any = {
      email: email.toLowerCase(),
      name,
      password_hash,
      role,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    if (school_id) userData.school_id = school_id;
    if (grade) userData.grade = parseInt(grade);
    if (class_number) userData.class_number = parseInt(class_number);

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert(userData)
      .select('id, email, name, role, school_id, grade, class_number, created_at')
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      return NextResponse.json(
        { error: '회원가입 중 오류가 발생했습니다.' },
        { status: 500 }
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
        name: user.name,
        role: user.role,
        school_id: user.school_id
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // 가입 로그 기록
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        activity_type: 'register',
        details: { registration_time: new Date().toISOString(), role }
      });

    return NextResponse.json({
      message: '회원가입이 완료되었습니다.',
      token,
      user
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}