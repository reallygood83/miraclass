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
  Divider,
  Alert
} from 'antd';
import { 
  ShareAltOutlined,
  BarChartOutlined,
  TeamOutlined,
  UserOutlined,
  EyeOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import RelationshipNetwork from '@/components/network/RelationshipNetwork';
import Layout from '@/components/common/Layout';
import { supabase, db } from '@/lib/supabase';

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
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [connectionLoading, setConnectionLoading] = useState(true);
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
    if (authChecked) {
      initializeConnection();
    }
  }, [selectedClass, authChecked]);

  const initializeConnection = async () => {
    setConnectionLoading(true);
    try {
      // Supabase 연결 테스트
      const { data: testData, error: testError } = await supabase
        .from('network_analysis')
        .select('count')
        .limit(1);
      
      if (!testError) {
        setIsSupabaseConnected(true);
        await loadNetworkAnalysisFromSupabase();
      } else {
        console.warn('Supabase 연결 실패, 더미 모드로 전환:', testError.message);
        setIsSupabaseConnected(false);
        loadDummyNetworkAnalysis();
      }
    } catch (error) {
      console.warn('Supabase 연결 중 오류:', error);
      setIsSupabaseConnected(false);
      loadDummyNetworkAnalysis();
    } finally {
      setConnectionLoading(false);
    }
  };

  const loadNetworkAnalysisFromSupabase = async () => {
    setLoading(true);
    
    try {
      // 선택된 클래스 정보 가져오기
      const { data: classesData } = await db.getClasses('550e8400-e29b-41d4-a716-446655440000');
      const selectedClassData = classesData?.find(c => c.name === selectedClass);
      
      if (selectedClassData) {
        // 네트워크 분석 데이터 조회
        const { data: networkData, error } = await supabase
          .from('network_analysis')
          .select('*')
          .eq('class_id', selectedClassData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (networkData && !error) {
          const stats: NetworkAnalysisStats = {
            totalConnections: networkData.total_connections || 0,
            averageConnections: parseFloat(networkData.average_connections) || 0,
            networkDensity: parseFloat(networkData.network_density) || 0,
            isolatedStudents: networkData.isolated_students || 0,
            popularStudents: networkData.popular_students || 0,
            bridgeStudents: networkData.bridge_students || 0
          };
          
          setAnalysisStats(stats);
        } else {
          // 분석 데이터가 없으면 더미 데이터 사용
          loadDummyNetworkAnalysis();
        }
      } else {
        loadDummyNetworkAnalysis();
      }
      
    } catch (error) {
      console.error('Supabase에서 네트워크 분석 데이터 로드 실패:', error);
      message.error('네트워크 분석 데이터를 불러오는데 실패했습니다.');
      loadDummyNetworkAnalysis();
    } finally {
      setLoading(false);
    }
  };

  const loadDummyNetworkAnalysis = () => {
    setLoading(true);
    
    try {
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
      console.error('더미 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setNetworkKey(prev => prev + 1);
    if (isSupabaseConnected) {
      loadNetworkAnalysisFromSupabase();
    } else {
      loadDummyNetworkAnalysis();
    }
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">
                학생들의 관계를 시각적으로 분석하고 소외 위험군을 조기 발견할 수 있습니다.
              </Text>
              
              {!connectionLoading && (
                <Alert
                  message={
                    isSupabaseConnected ? (
                      <span>
                        <DatabaseOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
                        DB 연결됨
                      </span>
                    ) : (
                      <span>
                        <DisconnectOutlined style={{ color: '#faad14', marginRight: '4px' }} />
                        더미 모드
                      </span>
                    )
                  }
                  type={isSupabaseConnected ? 'success' : 'warning'}
                  showIcon={false}
                  style={{ minWidth: '120px' }}
                />
              )}
            </div>
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