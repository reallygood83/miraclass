'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  Typography, 
  Select, 
  Button, 
  Space,
  Row,
  Col,
  Statistic,
  Tag,
  message,
  Spin,
  Empty,
  Divider
} from 'antd';
import { 
  ShareAltOutlined,
  BarChartOutlined,
  TeamOutlined,
  UserOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import RelationshipNetwork from '@/components/network/RelationshipNetwork';
import Layout from '@/components/common/Layout';

const { Title, Text } = Typography;
const { Option } = Select;

interface NetworkAnalysisStats {
  totalConnections: number;
  averageConnections: number;
  networkDensity: number;
  isolatedStudents: number;
  popularStudents: number;
  bridgeStudents: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  school_id?: string;
  grade?: number;
  class_number?: number;
}

export default function NetworkAnalysisPage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedClass, setSelectedClass] = useState('6학년 1반');
  const [analysisStats, setAnalysisStats] = useState<NetworkAnalysisStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [networkKey, setNetworkKey] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  // 클라이언트 사이드임을 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) {
      return;
    }

    if (authChecked) {
      return;
    }

    // 테스트를 위한 더미 사용자 설정
    const dummyUser: User = {
      id: '1',
      name: '김선생',
      email: 'teacher@test.com',
      role: 'teacher'
    };

    setUser(dummyUser);
    setAuthChecked(true);
  }, [isClient, authChecked, router]);

  useEffect(() => {
    loadNetworkAnalysis();
  }, [selectedClass]);

  const loadNetworkAnalysis = async () => {
    setLoading(true);
    
    try {
      // 시뮬레이션 데이터 - 실제 구현에서는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const stats: NetworkAnalysisStats = {
        totalConnections: 84,
        averageConnections: 6.2,
        networkDensity: 0.31,
        isolatedStudents: 2,
        popularStudents: 4,
        bridgeStudents: 3
      };
      
      setAnalysisStats(stats);
      
    } catch (error) {
      console.error('Failed to load network analysis:', error);
      message.error('네트워크 분석 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setNetworkKey(prev => prev + 1);
    loadNetworkAnalysis();
    message.success('네트워크가 새로고침되었습니다.');
  };

  const handleExportNetwork = () => {
    // 네트워크 이미지 내보내기 기능
    message.info('네트워크 이미지 내보내기 기능이 준비 중입니다.');
  };

  const handleViewAnalytics = () => {
    router.push('/analytics');
  };

  // 서버사이드 렌더링 중이거나 인증 체크 중
  if (!isClient || !authChecked) {
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
             '📊 네트워크 로딩 중...'}
          </div>
        </div>
      </div>
    );
  }

  // 사용자 정보가 없으면 null 반환
  if (!user) {
    return null;
  }

  return (
    <Layout user={{ name: user.name, role: user.role }}>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
          <div>
            <Title level={2}>
              <ShareAltOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              관계 네트워크 분석
            </Title>
            <Text type="secondary">
              학생들의 관계를 시각적으로 분석하고 소외 위험군을 조기 발견할 수 있습니다.
            </Text>
          </div>
          
          <Space>
            <Select
              value={selectedClass}
              onChange={setSelectedClass}
              style={{ width: 150 }}
              size="large"
            >
              <Option value="6학년 1반">6학년 1반</Option>
              <Option value="6학년 2반">6학년 2반</Option>
              <Option value="6학년 3반">6학년 3반</Option>
            </Select>
            
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              size="large"
            >
              새로고침
            </Button>
            
            <Button
              icon={<ShareAltOutlined />}
              onClick={handleExportNetwork}
              size="large"
            >
              이미지 저장
            </Button>
            
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              onClick={handleViewAnalytics}
              size="large"
            >
              상세 분석
            </Button>
          </Space>
        </div>
      </div>

      {/* 네트워크 통계 */}
      {analysisStats && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic
                title="전체 연결"
                value={analysisStats.totalConnections}
                prefix={<ShareAltOutlined />}
                valueStyle={{ color: '#1890ff' }}
                suffix="개"
              />
            </Card>
          </Col>
          
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic
                title="평균 연결 수"
                value={analysisStats.averageConnections}
                precision={1}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#52c41a' }}
                suffix="명"
              />
            </Card>
          </Col>
          
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic
                title="네트워크 밀도"
                value={analysisStats.networkDensity * 100}
                precision={1}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#722ed1' }}
                suffix="%"
              />
            </Card>
          </Col>
          
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic
                title="소외 위험군"
                value={analysisStats.isolatedStudents}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#fa541c' }}
                suffix="명"
              />
            </Card>
          </Col>
          
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic
                title="인기 학생"
                value={analysisStats.popularStudents}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#faad14' }}
                suffix="명"
              />
            </Card>
          </Col>
          
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic
                title="브릿지 역할"
                value={analysisStats.bridgeStudents}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#13c2c2' }}
                suffix="명"
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 네트워크 시각화 */}
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>관계 네트워크 맵</span>
            <Space>
              <Tag color="green">친구 관계</Tag>
              <Tag color="blue">협력 관계</Tag>
              <Tag color="purple">신뢰 관계</Tag>
            </Space>
          </div>
        }
        style={{ minHeight: '600px' }}
        bodyStyle={{ padding: '0' }}
      >
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '500px' 
          }}>
            <Spin size="large" />
          </div>
        ) : (
          <div key={networkKey}>
            <RelationshipNetwork />
          </div>
        )}
      </Card>

      {/* 도움말 */}
      <Card 
        title="사용 가이드" 
        style={{ marginTop: '24px' }}
        size="small"
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: '16px' }}>
              <Title level={5}>
                <EyeOutlined style={{ marginRight: '8px' }} />
                네트워크 보기
              </Title>
              <ul style={{ marginLeft: '24px', color: '#666' }}>
                <li>학생 노드를 클릭하면 상세 정보를 볼 수 있습니다</li>
                <li>연결선은 관계의 종류에 따라 색상이 다릅니다</li>
                <li>노드 크기는 연결 수에 비례합니다</li>
              </ul>
            </div>
          </Col>
          
          <Col xs={24} md={12}>
            <div>
              <Title level={5}>
                <ShareAltOutlined style={{ marginRight: '8px' }} />
                상호작용
              </Title>
              <ul style={{ marginLeft: '24px', color: '#666' }}>
                <li>마우스로 드래그하여 네트워크를 이동할 수 있습니다</li>
                <li>스크롤하여 확대/축소가 가능합니다</li>
                <li>모바일에서는 터치 제스처를 사용하세요</li>
              </ul>
            </div>
          </Col>
        </Row>
        
        <Divider />
        
        <div style={{ textAlign: 'center' }}>
          <Space size="large">
            <div>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%', 
                background: '#fa541c', 
                display: 'inline-block',
                marginRight: '8px'
              }} />
              <Text>소외 위험군</Text>
            </div>
            
            <div>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%', 
                background: '#faad14', 
                display: 'inline-block',
                marginRight: '8px'
              }} />
              <Text>인기 학생</Text>
            </div>
            
            <div>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%', 
                background: '#13c2c2', 
                display: 'inline-block',
                marginRight: '8px'
              }} />
              <Text>브릿지 역할</Text>
            </div>
            
            <div>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%', 
                background: '#1890ff', 
                display: 'inline-block',
                marginRight: '8px'
              }} />
              <Text>일반 학생</Text>
            </div>
          </Space>
        </div>
      </Card>
      </div>
    </Layout>
  );
}