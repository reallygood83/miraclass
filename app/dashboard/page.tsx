'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Typography, Row, Col, Button, Statistic, List, Avatar, Tag, Space } from 'antd';
import { 
  UserOutlined, 
  BookOutlined, 
  MessageOutlined, 
  TeamOutlined,
  PlusOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import RelationshipNetwork from '@/components/network/RelationshipNetwork';
import Layout from '@/components/common/Layout';

const { Title, Paragraph } = Typography;

interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  school_id?: string;
  grade?: number;
  class_number?: number;
}

interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  totalPosts: number;
  recentActivity: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClasses: 0,
    totalStudents: 0,
    totalPosts: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // 인증 체크 및 대시보드 데이터 로딩
  useEffect(() => {
    if (authLoading) {
      console.log('⏳ Auth 상태 확인 중...');
      return;
    }

    if (!user) {
      console.log('🔒 사용자가 로그인되지 않음. 로그인 페이지로 이동');
      router.push('/auth/login');
      return;
    }

    console.log('🏠 Dashboard - 인증된 사용자:', user.name);
    fetchDashboardData();
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      // 우리반 커넥트 - 학생 관계 분석 더미 데이터
      setStats({
        totalClasses: 1, // 현재 분석 중인 클래스
        totalStudents: 28, // 설문 참여 학생 수
        totalPosts: 3, // 완료된 설문 수
        recentActivity: [
          {
            id: 1,
            type: 'survey',
            title: '친구 관계 설문조사 완료',
            author: '김민수',
            time: '1시간 전',
            class: '우리반 (6학년 1반)'
          },
          {
            id: 2,
            type: 'analysis',
            title: 'AI 관계 분석 결과 업데이트',
            author: 'AI 분석기',
            time: '3시간 전',
            class: '우리반 (6학년 1반)'
          },
          {
            id: 3,
            type: 'alert',
            title: '소외 위험군 학생 발견',
            author: 'AI 모니터링',
            time: '1일 전',
            class: '우리반 (6학년 1반)'
          }
        ]
      });
      setLoading(false);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setLoading(false);
    }
  };

  // 인증 로딩 중이거나 대시보드 데이터 로딩 중
  if (authLoading || loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', color: '#666', marginBottom: '16px' }}>
            {authLoading ? '🔐 인증 확인 중...' : '📊 대시보드 로딩 중...'}
          </div>
          {authLoading && (
            <div style={{ fontSize: '14px', color: '#999' }}>
              사용자 인증 상태를 확인하고 있습니다
            </div>
          )}
          {isClient && !authChecked && (
            <div style={{ fontSize: '14px', color: '#999' }}>
              로그인 상태를 확인하고 있습니다
            </div>
          )}
        </div>
      </div>
    );
  }

  // 사용자 정보가 없으면 null 반환 (인증 실패시 리다이렉트됨)
  if (!user) {
    return null;
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'survey':
        return <MessageOutlined style={{ color: '#1890ff' }} />;
      case 'analysis':
        return <BookOutlined style={{ color: '#52c41a' }} />;
      case 'alert':
        return <UserOutlined style={{ color: '#faad14' }} />;
      default:
        return <MessageOutlined />;
    }
  };

  const getActivityTag = (type: string) => {
    switch (type) {
      case 'survey':
        return <Tag color="blue">설문완료</Tag>;
      case 'analysis':
        return <Tag color="green">AI분석</Tag>;
      case 'alert':
        return <Tag color="orange">모니터링</Tag>;
      default:
        return <Tag>활동</Tag>;
    }
  };

  return (
    <Layout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 환영 메시지 */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2}>
          우리반 커넥트에 오신 것을 환영합니다, {user?.name}님! 🌐
        </Title>
        <Paragraph type="secondary">
          {user?.role === 'teacher' 
            ? 'AI 기반 학생 관계 분석을 통해 우리 반의 소통과 유대감을 강화해보세요.'
            : '친구들과의 관계를 더 깊이 이해하고 따뜻한 교실을 만들어가요.'
          }
        </Paragraph>
      </div>

      {/* 우리반 커넥트 통계 카드 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="분석 중인 클래스"
              value={stats.totalClasses}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix="개반"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="설문 참여 학생"
              value={stats.totalStudents}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix="명"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="완료된 설문"
              value={stats.totalPosts}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#fa8c16' }}
              suffix="회"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Button 
              type="primary" 
              size="large" 
              icon={<PlusOutlined />}
              block
              onClick={() => router.push('/survey/create')}
            >
              새 관계 설문
            </Button>
          </Card>
        </Col>
      </Row>

      {/* 네트워크 시각화 - 메인 컨텐츠 */}
      <div style={{ marginBottom: '32px' }}>
        <RelationshipNetwork />
      </div>

      <Row gutter={[16, 16]}>
        {/* 최근 활동 */}
        <Col xs={24} lg={16}>
          <Card 
            title="최근 활동" 
            extra={
              <Button 
                type="link" 
                icon={<EyeOutlined />}
                onClick={() => router.push('/activities')}
              >
                전체보기
              </Button>
            }
          >
            <List
              dataSource={stats.recentActivity}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={getActivityIcon(item.type)} />}
                    title={
                      <Space>
                        <span>{item.title}</span>
                        {getActivityTag(item.type)}
                      </Space>
                    }
                    description={
                      <Space>
                        <span>{item.author}</span>
                        <span>•</span>
                        <span>{item.class}</span>
                        <span>•</span>
                        <span>{item.time}</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 관계 분석 도구 */}
        <Col xs={24} lg={8}>
          <Card title="관계 분석 도구">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="default" 
                block 
                icon={<BookOutlined />}
                onClick={() => router.push('/network')}
              >
                관계 네트워크
              </Button>
              <Button 
                type="default" 
                block 
                icon={<MessageOutlined />}
                onClick={() => router.push('/surveys')}
              >
                설문 관리
              </Button>
              <Button 
                type="default" 
                block 
                icon={<UserOutlined />}
                onClick={() => router.push('/analytics')}
              >
                AI 분석 결과
              </Button>
              {user.role === 'teacher' && (
                <Button 
                  type="default" 
                  block 
                  icon={<TeamOutlined />}
                  onClick={() => router.push('/monitoring')}
                >
                  관계 모니터링
                </Button>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
      </div>
    </Layout>
  );
}