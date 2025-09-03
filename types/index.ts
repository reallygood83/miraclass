// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  school_id?: string;
  grade?: number;
  class_number?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface School {
  id: string;
  name: string;
  address: string;
  contact_info: {
    phone?: string;
    email?: string;
    website?: string;
  };
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  teacher_id: string;
  school_id: string;
  grade: number;
  class_number: number;
  academic_year: number;
  semester: number;
  is_active: boolean;
  created_at: string;
}

export interface ClassEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  enrolled_at: string;
  status: 'active' | 'inactive';
}

export interface StudentRelationship {
  id: string;
  student_a_id: string;
  student_b_id: string;
  relationship_type: 'friend' | 'peer' | 'study_partner';
  relationship_score: number;
  created_at: string;
  updated_at?: string;
}

// API 응답 타입
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
  token?: string;
  user?: User;
}

// 인증 관련 타입
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
  school_name?: string;
  grade?: number;
  class_number?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  school_id?: string;
}

// 프론트엔드 컴포넌트 props
export interface ButtonProps {
  children: React.ReactNode;
  type?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'select';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}