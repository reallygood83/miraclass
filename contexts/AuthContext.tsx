'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, User } from '@/lib/supabase';
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
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // 로그인됨
        const { user: userProfile } = await auth.getCurrentUser();
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

  const checkUser = async () => {
    try {
      const { user: userProfile } = await auth.getCurrentUser();
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
      setLoading(true);
      const { data, error } = await auth.signIn(email, password);
      
      if (error) {
        message.error(error.message || '로그인에 실패했습니다.');
        return false;
      }

      if (data.user) {
        const { user: userProfile } = await auth.getCurrentUser();
        setUser(userProfile);
        message.success('로그인되었습니다.');
        return true;
      }

      return false;
    } catch (error: any) {
      message.error(error.message || '로그인 중 오류가 발생했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    role: 'teacher' | 'student' | 'admin' = 'teacher'
  ): Promise<boolean> => {
    try {
      setLoading(true);
      const { data, error } = await auth.signUp(email, password, name, role);
      
      if (error) {
        message.error(error.message || '회원가입에 실패했습니다.');
        return false;
      }

      if (data.user) {
        message.success('회원가입이 완료되었습니다. 이메일을 확인해주세요.');
        return true;
      }

      return false;
    } catch (error: any) {
      message.error(error.message || '회원가입 중 오류가 발생했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await auth.signOut();
      
      if (error) {
        message.error(error.message || '로그아웃에 실패했습니다.');
      } else {
        setUser(null);
        message.success('로그아웃되었습니다.');
      }
    } catch (error: any) {
      message.error(error.message || '로그아웃 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const { error } = await auth.resetPassword(email);
      
      if (error) {
        message.error(error.message || '비밀번호 재설정 요청에 실패했습니다.');
        return false;
      }

      message.success('비밀번호 재설정 이메일을 보냈습니다.');
      return true;
    } catch (error: any) {
      message.error(error.message || '비밀번호 재설정 요청 중 오류가 발생했습니다.');
      return false;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}