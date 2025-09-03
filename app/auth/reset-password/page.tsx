'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Paragraph } = Typography;

interface ResetPasswordForm {
  email: string;
}

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const onFinish = async (values: ResetPasswordForm) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || '비밀번호 재설정 요청에 실패했습니다.');
      }
    } catch (error) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
            <Title level={2}>이메일 전송 완료</Title>
            <Paragraph>
              비밀번호 재설정 링크를 이메일로 보내드렸습니다.<br />
              이메일을 확인해주세요.
            </Paragraph>
          </div>

          <Space direction="vertical" size="small" style={{ width: '100%', textAlign: 'center' }}>
            <Link href="/auth/login">
              <Button type="primary" block size="large">
                로그인으로 돌아가기
              </Button>
            </Link>
          </Space>
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
          <Title level={2}>비밀번호 재설정</Title>
          <Paragraph type="secondary">
            가입할 때 사용한 이메일 주소를 입력해주세요
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
          name="resetPassword"
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
              prefix={<MailOutlined />} 
              placeholder="이메일을 입력하세요"
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
              재설정 링크 보내기
            </Button>
          </Form.Item>
        </Form>

        <Space direction="vertical" size="small" style={{ width: '100%', textAlign: 'center' }}>
          <Link href="/auth/login">
            <Button type="link">로그인으로 돌아가기</Button>
          </Link>
          <Link href="/auth/register">
            <Button type="link">회원가입</Button>
          </Link>
        </Space>
      </Card>
    </div>
  );
}