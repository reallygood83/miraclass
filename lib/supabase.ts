import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Connection check
export const isSupabaseConnected = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Database Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'teacher' | 'student' | 'admin';
  school_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  grade: number;
  class_number: number;
  teacher_id: string;
  teacher_name: string;
  student_count: number;
  total_surveys: number;
  active_surveys: number;
  last_analysis: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  name: string;
  student_number: number;
  class_id: string;
  connections: number;
  risk_level: 'high' | 'medium' | 'low';
  last_survey: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  class_id: string;
  teacher_id: string;
  status: 'draft' | 'active' | 'completed';
  questions: any; // JSON field
  responses_count: number;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  student_id: string;
  responses: any; // JSON field
  completed_at: string;
  created_at: string;
}

export interface MonitoringAlert {
  id: string;
  class_id: string;
  student_id: string | null;
  type: 'isolation_risk' | 'network_change' | 'conflict_detected' | 'positive_change';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  // Additional UI properties
  studentName?: string;
  timestamp?: string;
  isRead?: boolean;
}

// Auth helper functions
const authHelpers = {
  // 회원가입
  async signUp(email: string, password: string, name: string, role: 'teacher' | 'student' | 'admin' = 'teacher') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        }
      }
    });

    if (!error && data.user) {
      // users 테이블에도 정보 저장
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: data.user.id,
          email: data.user.email!,
          name,
          role,
        }]);

      if (insertError) {
        console.error('Failed to insert user data:', insertError);
      }
    }

    return { data, error };
  },

  // 로그인
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  // 로그아웃
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // 현재 사용자 정보 가져오기
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user) return { user: null, error };

    // users 테이블에서 추가 정보 가져오기
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return { 
      user: userProfile || {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || '',
        role: user.user_metadata?.role || 'teacher',
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at
      }, 
      error: profileError 
    };
  },

  // 인증 상태 변경 감지
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // 비밀번호 재설정 요청
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    return { data, error };
  },

  // 비밀번호 업데이트
  async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({ password });
    return { data, error };
  }
};

// Database helper functions
const dbHelpers = {
  // Users
  async getUser(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    return { data, error };
  },

  // Classes
  async getClasses(teacherId: string) {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getClass(id: string) {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async createClass(classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('classes')
      .insert([classData])
      .select()
      .single();
    return { data, error };
  },

  async updateClass(id: string, updates: Partial<Class>) {
    const { data, error } = await supabase
      .from('classes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async deleteClass(id: string) {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);
    return { error };
  },

  // Students
  async getStudents(classId: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .order('student_number', { ascending: true });
    return { data, error };
  },

  async createStudent(studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('students')
      .insert([studentData])
      .select()
      .single();
    return { data, error };
  },

  async updateStudent(id: string, updates: Partial<Student>) {
    const { data, error } = await supabase
      .from('students')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async deleteStudent(id: string) {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    return { error };
  },

  // Surveys
  async getSurveys(classId: string) {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async createSurvey(surveyData: Omit<Survey, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('surveys')
      .insert([surveyData])
      .select()
      .single();
    return { data, error };
  },

  // Monitoring Alerts
  async getAlerts(classId: string) {
    const { data, error } = await supabase
      .from('monitoring_alerts')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async createAlert(alertData: Omit<MonitoringAlert, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('monitoring_alerts')
      .insert([alertData])
      .select()
      .single();
    return { data, error };
  },

  async markAlertAsRead(id: string) {
    const { data, error } = await supabase
      .from('monitoring_alerts')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  }
};

// Export auth and db objects
export const auth = authHelpers;
export const db = dbHelpers;

// Export default
export default supabase;