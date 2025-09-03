import { createClient } from '@supabase/supabase-js'

// Supabase 환경 변수 검증
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// 클라이언트 사이드 Supabase 클라이언트 (Row Level Security 적용)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    }
  }
})

// 서버 사이드 Supabase 클라이언트 (서비스 역할, RLS 우회 가능)
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// 인증 헬퍼 함수들
export const authHelpers = {
  // 현재 사용자 가져오기
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // 사용자 로그인
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  // 사용자 회원가입
  signUp: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    if (error) throw error
    return data
  },

  // 로그아웃
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // 비밀번호 재설정 이메일 발송
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw error
    return data
  },

  // 비밀번호 업데이트
  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
    return data
  }
}

// 데이터베이스 헬퍼 함수들
export const dbHelpers = {
  // 학교 관련
  schools: {
    getByCode: async (code) => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single()
      
      if (error) throw error
      return data
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    }
  },

  // 사용자 관련
  users: {
    getByEmail: async (email) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
      return data
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          school:schools(*)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },

    getStudentsByClass: async (schoolId, grade, classNumber) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('school_id', schoolId)
        .eq('grade', grade)
        .eq('class_number', classNumber)
        .eq('role', 'student')
        .eq('is_active', true)
        .order('student_number')
      
      if (error) throw error
      return data
    },

    create: async (userData) => {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  },

  // 클래스 관련
  classes: {
    getBySchool: async (schoolId) => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          teacher:users!teacher_id(*),
          enrollments:class_enrollments(
            *,
            student:users!student_id(*)
          )
        `)
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },

    getByEnrollmentCode: async (code) => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          school:schools(*),
          teacher:users!teacher_id(*)
        `)
        .eq('enrollment_code', code)
        .eq('is_active', true)
        .single()
      
      if (error) throw error
      return data
    },

    create: async (classData) => {
      const { data, error } = await supabase
        .from('classes')
        .insert([classData])
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  },

  // 학생 관계 관련
  relationships: {
    getByStudent: async (studentId) => {
      const { data, error } = await supabase
        .from('student_relationships')
        .select(`
          *,
          student_a:users!student_a_id(*),
          student_b:users!student_b_id(*)
        `)
        .or(`student_a_id.eq.${studentId},student_b_id.eq.${studentId}`)
        .order('relationship_score', { ascending: false })
      
      if (error) throw error
      return data
    },

    create: async (relationshipData) => {
      const { data, error } = await supabase
        .from('student_relationships')
        .insert([relationshipData])
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('student_relationships')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  }
}

// 실시간 구독 헬퍼
export const realtimeHelpers = {
  subscribeToClassUpdates: (classId, callback) => {
    return supabase
      .channel('class-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_enrollments',
          filter: `class_id=eq.${classId}`
        },
        callback
      )
      .subscribe()
  },

  subscribeToUserUpdates: (userId, callback) => {
    return supabase
      .channel('user-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}

export default supabase