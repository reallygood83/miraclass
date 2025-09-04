'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Typography, Row, Col, Space } from 'antd';
import { LoginOutlined, UserAddOutlined, UserOutlined, MessageOutlined, TeamOutlined } from '@ant-design/icons';
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
            우리반 커넥트
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
            AI 기반 학급 관계 분석 플랫폼
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
            AI 기술을 활용하여 우리 반 학생들의 관계를 시각화하고 분석합니다.
            친구 관계 네트워크를 통해 소외되는 학생이 없는 따뜻한 교실을 만들어가세요.
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
                <TeamOutlined 
                  style={{ 
                    fontSize: '48px', 
                    color: '#1890ff', 
                    marginBottom: '16px' 
                  }} 
                />
                <Title level={3}>관계 네트워크 시각화</Title>
                <Paragraph>
                  학생들의 친구 관계를 시각적 네트워크로 표현하여
                  소외 위험군 학생과 인기 학생을 한눈에 파악할 수 있습니다.
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
                <UserOutlined 
                  style={{ 
                    fontSize: '48px', 
                    color: '#52c41a', 
                    marginBottom: '16px' 
                  }} 
                />
                <Title level={3}>AI 관계 분석</Title>
                <Paragraph>
                  인공지능이 친구 설문 결과를 분석하여
                  학생들의 관계 패턴과 사회성 발달 상태를 제공합니다.
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
                    color: '#fa8c16', 
                    marginBottom: '16px' 
                  }} 
                />
                <Title level={3}>맞춤 상담 지원</Title>
                <Paragraph>
                  분석 결과를 바탕으로 각 학생에게 필요한
                  개별 상담과 관계 개선 방안을 제시합니다.
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
            © 2024 우리반 커넥트. 모든 권리 보유.
          </Paragraph>
        </div>
      </div>
    </div>
  );
}