'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, Alert, Space, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, BankOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Paragraph } = Typography;
const { Option } = Select;

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'teacher' | 'student';
  school_name?: string;
  grade?: number;
  class_number?: number;
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form] = Form.useForm();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student'>('student');
  const { signUp, user } = useAuth();

  // 이미 로그인된 사용자 체크
  useEffect(() => {
    if (user) {
      console.log('🔄 User already logged in, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [user, router]);

  const onFinish = async (values: RegisterForm) => {
    console.log('🔄 Supabase registration form submitted:', values);
    setLoading(true);
    setError('');

    try {
      console.log('📤 Using Supabase Auth for registration');
      const success = await signUp(
        values.email, 
        values.password, 
        values.name, 
        values.role || 'teacher'
      );
      
      if (success) {
        console.log('✅ Supabase registration successful');
        // 회원가입 성공 메시지는 AuthContext에서 처리됨
        // 로그인 페이지로 이동
        router.push('/auth/login');
      } else {
        console.error('❌ Supabase registration failed');
        // 에러 메시지는 AuthContext에서 이미 처리됨 (Ant Design message)
      }
    } catch (error) {
      console.error('💥 Registration error:', error);
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      console.log('🏁 Supabase registration process completed');
    }
  };

  const handleRoleChange = (value: 'teacher' | 'student') => {
    setSelectedRole(value);
    // 역할 변경 시 관련 필드 초기화
    form.resetFields(['school_name', 'grade', 'class_number']);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card style={{ 
        width: '100%', 
        maxWidth: 480, 
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>MiraClass 회원가입</Title>
          <Paragraph type="secondary">
            교육용 소셜 네트워크 플랫폼에 가입하세요
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
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            label="이름"
            name="name"
            rules={[
              { required: true, message: '이름을 입력해주세요!' },
              { min: 2, message: '이름은 최소 2자 이상이어야 합니다!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="이름을 입력하세요"
            />
          </Form.Item>

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

          <Form.Item
            label="역할"
            name="role"
            rules={[{ required: true, message: '역할을 선택해주세요!' }]}
          >
            <Select
              placeholder="역할을 선택하세요"
              onChange={handleRoleChange}
            >
              <Option value="student">학생</Option>
              <Option value="teacher">교사</Option>
            </Select>
          </Form.Item>

          {selectedRole === 'teacher' && (
            <Form.Item
              label="학교명"
              name="school_name"
              rules={[
                { required: true, message: '학교명을 입력해주세요!' },
                { min: 2, message: '학교명은 최소 2자 이상이어야 합니다!' }
              ]}
            >
              <Input 
                prefix={<BankOutlined />} 
                placeholder="학교명을 입력하세요"
              />
            </Form.Item>
          )}

          {selectedRole === 'student' && (
            <>
              <Form.Item
                label="학년"
                name="grade"
                rules={[{ required: true, message: '학년을 선택해주세요!' }]}
              >
                <Select placeholder="학년을 선택하세요">
                  {[1, 2, 3, 4, 5, 6].map(grade => (
                    <Option key={grade} value={grade}>{grade}학년</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="반"
                name="class_number"
                rules={[{ required: true, message: '반을 선택해주세요!' }]}
              >
                <Select placeholder="반을 선택하세요">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(classNum => (
                    <Option key={classNum} value={classNum}>{classNum}반</Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}

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

          <Form.Item
            label="비밀번호 확인"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '비밀번호를 다시 입력해주세요!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('비밀번호가 일치하지 않습니다!'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="비밀번호를 다시 입력하세요"
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
              회원가입
            </Button>
          </Form.Item>
        </Form>

        <Space direction="vertical" size="small" style={{ width: '100%', textAlign: 'center' }}>
          <Link href="/auth/login">
            <Button type="link">이미 계정이 있나요? 로그인</Button>
          </Link>
          <Link href="/">
            <Button type="link">← 홈으로 돌아가기</Button>
          </Link>
        </Space>
      </Card>
    </div>
  );
}