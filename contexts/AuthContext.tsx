'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, User } from '@/lib/supabase';
import { message } from 'antd';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string, role?: 'teacher' | 'student' | 'admin') => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 사용자 상태 확인
    checkUser();

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // 로그인됨
        const userProfile = await getCurrentUser();
        setUser(userProfile);
      } else {
        // 로그아웃됨
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getCurrentUser = async (): Promise<User | null> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!user) return null;

      // users 테이블에서 추가 정보 가져오기
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return null;
      }

      return userProfile || {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || '',
        role: user.user_metadata?.role || 'teacher',
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  };

  const checkUser = async () => {
    try {
      const userProfile = await getCurrentUser();
      setUser(userProfile);
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        message.error(error.message === 'Invalid login credentials' 
          ? '이메일 또는 비밀번호가 올바르지 않습니다.' 
          : error.message);
        return false;
      }

      if (data.user) {
        const userProfile = await getCurrentUser();
        setUser(userProfile);
        message.success('로그인되었습니다.');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Sign in error:', error);
      message.error('로그인 중 오류가 발생했습니다.');
      return false;
    }
  };

  const signUp = async (email: string, password: string, name: string, role: 'teacher' | 'student' | 'admin' = 'teacher'): Promise<boolean> => {
    try {
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

      if (error) {
        message.error(error.message);
        return false;
      }

      if (data.user) {
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

        message.success('회원가입이 완료되었습니다.');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Sign up error:', error);
      message.error('회원가입 중 오류가 발생했습니다.');
      return false;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        message.error('로그아웃 중 오류가 발생했습니다.');
      } else {
        setUser(null);
        message.success('로그아웃되었습니다.');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      message.error('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        message.error(error.message);
        return false;
      }

      message.success('비밀번호 재설정 링크가 이메일로 발송되었습니다.');
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      message.error('비밀번호 재설정 중 오류가 발생했습니다.');
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};