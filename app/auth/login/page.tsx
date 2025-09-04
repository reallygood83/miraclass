'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, Alert, Space, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Paragraph } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const router = useRouter();
  const { signIn, user } = useAuth();

  // 이미 로그인된 사용자 체크
  useEffect(() => {
    if (user) {
      console.log('🔄 User already logged in, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [user, router]);

  const onFinish = async (values: LoginForm) => {
    console.log('🔄 Supabase login form submitted:', values);
    setLoading(true);
    setError('');

    try {
      console.log('📤 Using Supabase Auth for login');
      const success = await signIn(values.email, values.password);
      
      if (success) {
        console.log('✅ Supabase login successful');
        setLoginSuccess(true);
        
        // Supabase Auth를 사용하므로 토큰 관리는 자동으로 처리됨
        console.log('🚀 Redirecting to dashboard');
        
        // 간단한 리다이렉트 (Supabase Auth 상태 변경 후)
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
        
      } else {
        console.error('❌ Supabase login failed');
        // 에러 메시지는 AuthContext에서 이미 처리됨 (Ant Design message)
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      console.log('🏁 Supabase login process completed');
    }
  };

  // 로그인 성공 시 로딩 화면 표시
  if (loginSuccess) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', textAlign: 'center' }}>
          <div style={{ padding: '40px 20px' }}>
            <Title level={3}>🎉 로그인 성공!</Title>
            <Paragraph>대시보드로 이동 중입니다...</Paragraph>
            <div style={{ marginTop: 20 }}>
              <Button type="primary" loading>
                잠시만 기다려주세요
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>MiraClass</Title>
          <Paragraph type="secondary">
            교육용 소셜 네트워크 플랫폼에 로그인하세요
          </Paragraph>
        </div>

        {error && (
          <Alert 
            message={error} 
            type="error" 
            showIcon 
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            label="이메일"
            name="email"
            rules={[
              { required: true, message: '이메일을 입력해주세요!' },
              { type: 'email', message: '올바른 이메일 형식이 아닙니다!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="이메일을 입력하세요"
            />
          </Form.Item>

          <Form.Item
            label="비밀번호"
            name="password"
            rules={[
              { required: true, message: '비밀번호를 입력해주세요!' },
              { min: 6, message: '비밀번호는 최소 6자 이상이어야 합니다!' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="비밀번호를 입력하세요"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              size="large"
            >
              로그인
            </Button>
          </Form.Item>
        </Form>

        <Space direction="vertical" size="small" style={{ width: '100%', textAlign: 'center' }}>
          <Link href="/auth/register">
            <Button type="link">계정이 없나요? 회원가입</Button>
          </Link>
          <Link href="/">
            <Button type="link">← 홈으로 돌아가기</Button>
          </Link>
        </Space>
      </Card>
    </div>
  );
}