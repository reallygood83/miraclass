'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Typography, Row, Col, Space } from 'antd';
import { LoginOutlined, UserAddOutlined, BookOutlined, MessageOutlined, TeamOutlined } from '@ant-design/icons';
import { authUtils } from '@/lib/utils/auth';

const { Title, Paragraph } = Typography;

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loggedIn = authUtils.isLoggedIn();
    setIsLoggedIn(loggedIn);
    setLoading(false);

    if (loggedIn) {
      // 이미 로그인된 사용자는 대시보드로 리다이렉트
      router.push('/dashboard');
    }
  }, [router]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        로딩 중...
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '0'
    }}>
      {/* 헤더 */}
      <div style={{ 
        padding: '20px 0',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Title level={2} style={{ color: 'white', margin: 0 }}>
            MiraClass
          </Title>
          {!isLoggedIn && (
            <Space>
              <Button 
                type="default" 
                icon={<LoginOutlined />}
                onClick={() => router.push('/auth/login')}
              >
                로그인
              </Button>
              <Button 
                type="primary" 
                icon={<UserAddOutlined />}
                onClick={() => router.push('/auth/register')}
              >
                회원가입
              </Button>
            </Space>
          )}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '60px 20px',
        textAlign: 'center' 
      }}>
        {/* 히어로 섹션 */}
        <div style={{ marginBottom: '80px' }}>
          <Title 
            level={1} 
            style={{ 
              color: 'white', 
              fontSize: '3.5rem', 
              marginBottom: '24px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            교육용 소셜 네트워크 플랫폼
          </Title>
          <Paragraph 
            style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: '1.25rem',
              marginBottom: '40px',
              maxWidth: '600px',
              margin: '0 auto 40px'
            }}
          >
            학생과 교사가 함께 학습하고 소통할 수 있는 혁신적인 교육 환경을 제공합니다.
            실시간 소통, 과제 관리, 학습 활동을 하나의 플랫폼에서 경험해보세요.
          </Paragraph>
          
          {!isLoggedIn && (
            <Space size="large">
              <Button 
                type="primary" 
                size="large"
                icon={<UserAddOutlined />}
                onClick={() => router.push('/auth/register')}
                style={{ 
                  height: '50px',
                  fontSize: '16px',
                  padding: '0 30px'
                }}
              >
                지금 시작하기
              </Button>
              <Button 
                type="default" 
                size="large"
                icon={<LoginOutlined />}
                onClick={() => router.push('/auth/login')}
                style={{ 
                  height: '50px',
                  fontSize: '16px',
                  padding: '0 30px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white'
                }}
              >
                로그인
              </Button>
            </Space>
          )}
        </div>

        {/* 기능 소개 */}
        <Row gutter={[32, 32]}>
          <Col xs={24} md={8}>
            <Card 
              style={{ 
                height: '100%',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <BookOutlined 
                  style={{ 
                    fontSize: '48px', 
                    color: '#1890ff', 
                    marginBottom: '16px' 
                  }} 
                />
                <Title level={3}>클래스 관리</Title>
                <Paragraph>
                  교사는 쉽게 클래스를 생성하고 관리할 수 있으며,
                  학생들은 간단하게 클래스에 참여할 수 있습니다.
                </Paragraph>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card 
              style={{ 
                height: '100%',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <MessageOutlined 
                  style={{ 
                    fontSize: '48px', 
                    color: '#52c41a', 
                    marginBottom: '16px' 
                  }} 
                />
                <Title level={3}>실시간 소통</Title>
                <Paragraph>
                  게시글, 댓글, 실시간 채팅을 통해
                  학생과 교사 간 원활한 소통을 지원합니다.
                </Paragraph>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card 
              style={{ 
                height: '100%',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <TeamOutlined 
                  style={{ 
                    fontSize: '48px', 
                    color: '#fa8c16', 
                    marginBottom: '16px' 
                  }} 
                />
                <Title level={3}>협업 학습</Title>
                <Paragraph>
                  그룹 프로젝트, 토론, 협업 활동을 통해
                  더욱 효과적인 학습 경험을 제공합니다.
                </Paragraph>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* 푸터 */}
      <div style={{ 
        background: 'rgba(0, 0, 0, 0.2)',
        padding: '40px 0',
        marginTop: '80px'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 20px',
          textAlign: 'center'
        }}>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
            © 2024 MiraClass. 모든 권리 보유.
          </Paragraph>
        </div>
      </div>
    </div>
  );
}