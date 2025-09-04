'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { authUtils } from '@/lib/utils/auth';

const { Title, Paragraph } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const onFinish = async (values: LoginForm) => {
    console.log('🔄 Login form submitted:', values);
    setLoading(true);
    setError('');

    try {
      console.log('📤 Making API request to /api/auth/login');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      console.log('📥 API Response status:', response.status, response.statusText);
      const data = await response.json();
      console.log('📄 API Response data:', data);

      if (response.ok) {
        console.log('✅ Login successful, token received:', data.token ? 'Yes' : 'No');
        
        // 토큰 저장
        authUtils.setToken(data.token);
        console.log('💾 Token stored in localStorage');
        
        // 토큰 확인
        const storedToken = authUtils.getToken();
        console.log('🔍 Token verification - stored:', storedToken ? 'Yes' : 'No');
        
        // 사용자 정보 확인
        const userInfo = authUtils.getUserFromToken();
        console.log('👤 User info from token:', userInfo);
        
        console.log('🔄 Redirecting to dashboard...');
        
        // 강제 새로고침으로 리다이렉트
        window.location.href = '/dashboard';
      } else {
        console.error('❌ Login failed:', data.error);
        setError(data.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('💥 Network/Parse error:', error);
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
      console.log('🏁 Login process completed');
    }
  };

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