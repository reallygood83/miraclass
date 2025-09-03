import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

// 인증 미들웨어 함수
function authenticateToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    return jwt.verify(token, jwtSecret) as any;
  } catch (error) {
    return null;
  }
}

// GET /api/users - 사용자 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = authenticateToken(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관리자나 교사만 사용자 목록 조회 가능
    if (user.role !== 'admin' && user.role !== 'teacher') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const school_id = searchParams.get('school_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        school_id,
        grade,
        class_number,
        is_active,
        created_at,
        schools(name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 필터 적용
    if (role) {
      query = query.eq('role', role);
    }

    if (school_id) {
      query = query.eq('school_id', school_id);
    } else if (user.role === 'teacher' && user.school_id) {
      // 교사는 자신의 학교 사용자만 조회 가능
      query = query.eq('school_id', user.school_id);
    }

    const { data: users, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: '사용자 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}