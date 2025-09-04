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
import { authUtils } from '@/lib/utils/auth';

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
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalClasses: 0,
    totalStudents: 0,
    totalPosts: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  // 클라이언트 사이드임을 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) {
      console.log('⏳ Waiting for client-side hydration...');
      return;
    }

    if (authChecked) {
      console.log('🔒 Authentication already checked');
      return;
    }

    console.log('🏠 Dashboard component mounted (client-side)');
    
    const checkAuth = async () => {
      try {
        // 다중 안전장치
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
          console.log('⚠️ Browser environment not ready, waiting...');
          setTimeout(checkAuth, 200);
          return;
        }

        // 토큰 확인
        const token = authUtils.getToken();
        console.log('🔍 Token check:', token ? 'Found' : 'Missing');
        
        if (!token) {
          console.log('❌ No token found, redirecting to login');
          setAuthChecked(true);
          window.location.replace('/auth/login');
          return;
        }

        // 토큰에서 사용자 정보 추출
        const userData = authUtils.getUserFromToken(token);
        console.log('👤 User data from token:', userData);
        
        if (!userData) {
          console.log('❌ Invalid token, clearing and redirecting');
          authUtils.removeToken();
          setAuthChecked(true);
          window.location.replace('/auth/login');
          return;
        }

        // 토큰 만료 체크
        if (!authUtils.isLoggedIn()) {
          console.log('❌ Token expired, clearing and redirecting');
          authUtils.removeToken();
          setAuthChecked(true);
          window.location.replace('/auth/login');
          return;
        }

        console.log('✅ Dashboard authenticated successfully for user:', userData.name);
        setUser(userData);
        setAuthChecked(true);
        setLoading(false);
        fetchDashboardData();
        
      } catch (error) {
        console.error('💥 Authentication error:', error);
        authUtils.removeToken();
        setAuthChecked(true);
        window.location.replace('/auth/login');
      }
    };

    // 더 안전한 지연 실행
    const timeoutId = setTimeout(() => {
      checkAuth();
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [isClient, authChecked, router]);

  const fetchDashboardData = async () => {
    try {
      // TODO: API 연동으로 실제 데이터 가져오기
      // 현재는 더미 데이터 사용
      setStats({
        totalClasses: 3,
        totalStudents: 25,
        totalPosts: 12,
        recentActivity: [
          {
            id: 1,
            type: 'post',
            title: '수학 숙제 공지',
            author: '김교사',
            time: '2시간 전',
            class: '3학년 1반'
          },
          {
            id: 2,
            type: 'comment',
            title: '과학 실험 보고서에 댓글',
            author: '이학생',
            time: '4시간 전',
            class: '3학년 1반'
          },
          {
            id: 3,
            type: 'join',
            title: '새로운 학생이 클래스에 참여',
            author: '박학생',
            time: '1일 전',
            class: '3학년 2반'
          }
        ]
      });
      setLoading(false);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setLoading(false);
    }
  };

  // 서버사이드 렌더링 중이거나 인증 체크 중이거나 로딩 중
  if (!isClient || !authChecked || loading) {
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
            {!isClient ? '🔄 시스템 초기화 중...' : 
             !authChecked ? '🔐 인증 확인 중...' : 
             '📊 대시보드 로딩 중...'}
          </div>
          {!isClient && (
            <div style={{ fontSize: '14px', color: '#999' }}>
              클라이언트 환경을 준비하고 있습니다
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
      case 'post':
        return <MessageOutlined style={{ color: '#1890ff' }} />;
      case 'comment':
        return <MessageOutlined style={{ color: '#52c41a' }} />;
      case 'join':
        return <UserOutlined style={{ color: '#faad14' }} />;
      default:
        return <MessageOutlined />;
    }
  };

  const getActivityTag = (type: string) => {
    switch (type) {
      case 'post':
        return <Tag color="blue">게시글</Tag>;
      case 'comment':
        return <Tag color="green">댓글</Tag>;
      case 'join':
        return <Tag color="orange">참여</Tag>;
      default:
        return <Tag>활동</Tag>;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 환영 메시지 */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2}>
          안녕하세요, {user.name}님! 👋
        </Title>
        <Paragraph type="secondary">
          {user.role === 'teacher' 
            ? '오늘도 학생들과 함께 즐거운 수업을 진행해보세요.'
            : '오늘도 새로운 것을 배워보고 친구들과 소통해보세요.'
          }
        </Paragraph>
      </div>

      {/* 통계 카드 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="참여 클래스"
              value={stats.totalClasses}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={user.role === 'teacher' ? '담당 학생' : '클래스 멤버'}
              value={stats.totalStudents}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="총 게시글"
              value={stats.totalPosts}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#fa8c16' }}
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
              onClick={() => router.push('/classes/create')}
            >
              {user.role === 'teacher' ? '새 클래스' : '클래스 참여'}
            </Button>
          </Card>
        </Col>
      </Row>

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

        {/* 빠른 액세스 */}
        <Col xs={24} lg={8}>
          <Card title="빠른 액세스">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="default" 
                block 
                icon={<BookOutlined />}
                onClick={() => router.push('/classes')}
              >
                내 클래스
              </Button>
              <Button 
                type="default" 
                block 
                icon={<MessageOutlined />}
                onClick={() => router.push('/posts')}
              >
                게시글 관리
              </Button>
              <Button 
                type="default" 
                block 
                icon={<UserOutlined />}
                onClick={() => router.push('/profile')}
              >
                프로필 설정
              </Button>
              {user.role === 'teacher' && (
                <Button 
                  type="default" 
                  block 
                  icon={<TeamOutlined />}
                  onClick={() => router.push('/students')}
                >
                  학생 관리
                </Button>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}