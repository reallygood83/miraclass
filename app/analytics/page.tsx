'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Progress,
  Tag,
  List,
  Avatar,
  Button,
  Space,
  Alert,
  Divider,
  Statistic,
  Select,
  Spin,
  Timeline,
  message
} from 'antd';
import { 
  BulbOutlined,
  WarningOutlined,
  TeamOutlined,
  TrophyOutlined,
  HeartOutlined,
  ShareAltOutlined,
  UserOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  DownloadOutlined,
  DatabaseOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import Layout from '@/components/common/Layout';
import { supabase, db } from '@/lib/supabase';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface StudentInsight {
  id: string;
  name: string;
  category: 'isolated' | 'popular' | 'bridge' | 'normal';
  riskLevel: 'high' | 'medium' | 'low';
  connections: number;
  insights: string[];
  recommendations: string[];
}

interface ClassAnalysis {
  networkHealth: number;
  cohesionScore: number;
  totalConnections: number;
  averageConnections: number;
  networkDensity: number;
  insights: string[];
  recommendations: string[];
  studentAnalyses: StudentInsight[];
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

export default function AnalyticsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedClass, setSelectedClass] = useState('6학년 1반');
  const [analysisData, setAnalysisData] = useState<ClassAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
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
        await loadAnalysisDataFromSupabase();
      } else {
        console.warn('Supabase 연결 실패, 더미 모드로 전환:', testError.message);
        setIsSupabaseConnected(false);
        loadDummyAnalysisData();
      }
    } catch (error) {
      console.warn('Supabase 연결 중 오류:', error);
      setIsSupabaseConnected(false);
      loadDummyAnalysisData();
    } finally {
      setConnectionLoading(false);
    }
  };

  const loadAnalysisDataFromSupabase = async () => {
    setLoading(true);
    
    try {
      // 선택된 클래스 정보 가져오기
      const { data: classesData } = await db.getClasses('550e8400-e29b-41d4-a716-446655440000');
      const selectedClassData = classesData?.find(c => c.name === selectedClass);
      
      if (selectedClassData) {
        // 네트워크 분석 데이터 조회
        const { data: networkData, error: networkError } = await supabase
          .from('network_analysis')
          .select('*')
          .eq('class_id', selectedClassData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // 학생 데이터 조회
        const { data: studentsData } = await db.getStudents(selectedClassData.id);
        
        // 관계 데이터 조회
        const { data: relationshipsData, error: relationshipsError } = await supabase
          .from('student_relationships')
          .select('student_id, friend_id, relationship_type, strength')
          .eq('survey_id', 'latest'); // 최신 설문 결과

        if (networkData && !networkError && studentsData) {
          // Supabase 데이터를 분석 결과 형태로 변환
          const analysisData: ClassAnalysis = {
            networkHealth: Math.round((networkData.network_density || 0) * 100),
            cohesionScore: Math.round((networkData.average_connections || 0) * 10),
            totalConnections: networkData.total_connections || 0,
            averageConnections: parseFloat(networkData.average_connections) || 0,
            networkDensity: parseFloat(networkData.network_density) || 0,
            insights: [
              `전반적으로 ${networkData.network_density > 0.5 ? '건강한' : '개선이 필요한'} 관계 네트워크를 형성하고 있습니다.`,
              `네트워크 밀도가 ${Math.round((networkData.network_density || 0) * 100)}%로 ${networkData.network_density > 0.3 ? '양호한' : '낮은'} 수준입니다.`,
              `${networkData.isolated_students}명의 학생이 소외 위험군으로 분류되어 특별한 관심이 필요합니다.`,
              `${networkData.popular_students}명의 인기 학생과 ${networkData.bridge_students}명의 브릿지 학생이 있습니다.`
            ],
            recommendations: [
              '소외 위험군 학생들을 위한 소그룹 활동을 구성해주세요.',
              '다양한 학생들과의 협력 기회를 제공하는 프로젝트를 진행해주세요.',
              '브릿지 역할을 하는 학생들을 활용하여 네트워크 연결성을 강화해주세요.',
              '정기적인 관계 분석을 통해 변화를 모니터링해주세요.'
            ],
            studentAnalyses: studentsData?.map(student => ({
              id: student.id,
              name: student.name,
              category: student.risk_level === 'high' ? 'isolated' : 
                       student.connections > 8 ? 'popular' : 
                       student.connections > 5 ? 'bridge' : 'normal',
              riskLevel: student.risk_level,
              connections: student.connections,
              insights: [
                student.risk_level === 'high' ? '소외될 위험이 높습니다' :
                student.connections > 8 ? '반에서 가장 많은 친구들과 연결되어 있습니다' :
                '건강한 관계를 유지하고 있습니다'
              ],
              recommendations: [
                student.risk_level === 'high' ? '개별 상담을 통해 관심사를 파악해주세요' :
                student.connections > 8 ? '다른 학생들을 포용하는 리더십을 발휘할 수 있도록 지도해주세요' :
                '현재의 긍정적인 관계를 유지하도록 지원해주세요'
              ]
            })) || []
          };
          
          setAnalysisData(analysisData);
          setLastUpdated(new Date().toLocaleString('ko-KR'));
        } else {
          // 분석 데이터가 없으면 더미 데이터 사용
          loadDummyAnalysisData();
        }
      } else {
        loadDummyAnalysisData();
      }
      
    } catch (error) {
      console.error('Supabase에서 분석 데이터 로드 실패:', error);
      message.error('분석 데이터를 불러오는데 실패했습니다.');
      loadDummyAnalysisData();
    } finally {
      setLoading(false);
    }
  };

  const loadDummyAnalysisData = async () => {
    setLoading(true);
    
    try {
      // 시뮬레이션 로딩 시간
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const dummyData: ClassAnalysis = {
        networkHealth: 78,
        cohesionScore: 82,
        totalConnections: 84,
        averageConnections: 6.2,
        networkDensity: 0.31,
        insights: [
          '전반적으로 건강한 관계 네트워크를 형성하고 있습니다.',
          '소수의 인기 학생들 중심으로 관계가 형성되어 있어 다양성 증진이 필요합니다.',
          '2명의 학생이 소외 위험군으로 분류되어 특별한 관심이 필요합니다.',
          '협력 관계와 친구 관계 간의 상관성이 높아 긍정적인 학급 분위기를 보여줍니다.'
        ],
        recommendations: [
          '소외 위험군 학생들을 위한 소그룹 활동을 구성해주세요.',
          '다양한 학생들과의 협력 기회를 제공하는 프로젝트를 진행해주세요.',
          '브릿지 역할을 하는 학생들을 활용하여 네트워크 연결성을 강화해주세요.',
          '정기적인 관계 분석을 통해 변화를 모니터링해주세요.'
        ],
        studentAnalyses: [
          {
            id: '1',
            name: '김민수',
            category: 'popular',
            riskLevel: 'low',
            connections: 12,
            insights: ['반에서 가장 많은 친구들과 연결되어 있습니다', '리더십 역할을 수행하고 있습니다'],
            recommendations: ['다른 학생들을 포용하는 리더십을 발휘할 수 있도록 지도해주세요']
          },
          {
            id: '2',
            name: '이지은',
            category: 'bridge',
            riskLevel: 'low',
            connections: 8,
            insights: ['다양한 그룹을 연결하는 중요한 역할을 합니다', '사회성이 뛰어납니다'],
            recommendations: ['갈등 조정 역할을 맡겨보세요', '다양한 활동에 참여시켜주세요']
          },
          {
            id: '22',
            name: '이채원',
            category: 'isolated',
            riskLevel: 'high',
            connections: 1,
            insights: ['매우 적은 연결을 가지고 있습니다', '소외될 위험이 높습니다'],
            recommendations: ['개별 상담을 통해 관심사를 파악해주세요', '소그룹 활동에 참여시켜주세요']
          },
          {
            id: '15',
            name: '정현수',
            category: 'isolated',
            riskLevel: 'medium',
            connections: 2,
            insights: ['제한적인 친구 관계를 가지고 있습니다', '사회적 참여 기회가 필요합니다'],
            recommendations: ['관심사가 비슷한 친구들과 연결해주세요', '자신감 향상 프로그램에 참여시켜주세요']
          }
        ]
      };
      
      setAnalysisData(dummyData);
      setLastUpdated(new Date().toLocaleString('ko-KR'));
      
    } catch (error) {
      console.error('더미 데이터 로드 실패:', error);
      message.error('분석 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryMap = {
      popular: <TrophyOutlined style={{ color: '#faad14' }} />,
      bridge: <ShareAltOutlined style={{ color: '#13c2c2' }} />,
      isolated: <AlertOutlined style={{ color: '#fa541c' }} />,
      normal: <UserOutlined style={{ color: '#1890ff' }} />
    };
    
    return categoryMap[category as keyof typeof categoryMap] || <UserOutlined />;
  };

  const getCategoryTag = (category: string) => {
    const categoryMap = {
      popular: { color: '#faad14', text: '인기 학생' },
      bridge: { color: '#13c2c2', text: '브릿지 역할' },
      isolated: { color: '#fa541c', text: '소외 위험군' },
      normal: { color: '#1890ff', text: '일반 학생' }
    };
    
    const config = categoryMap[category as keyof typeof categoryMap] || { color: 'default', text: category };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getRiskLevelTag = (riskLevel: string) => {
    const riskMap = {
      high: { color: 'error', text: '높음' },
      medium: { color: 'warning', text: '보통' },
      low: { color: 'success', text: '낮음' }
    };
    
    const config = riskMap[riskLevel as keyof typeof riskMap] || { color: 'default', text: riskLevel };
    return <Tag color={config.color}>위험도: {config.text}</Tag>;
  };

  const handleRefresh = () => {
    if (isSupabaseConnected) {
      loadAnalysisDataFromSupabase();
    } else {
      loadDummyAnalysisData();
    }
    message.success('분석 데이터가 새로고침되었습니다.');
  };

  const handleExportReport = () => {
    message.info('분석 보고서 내보내기 기능이 준비 중입니다.');
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
             '📊 분석 로딩 중...'}
          </div>
        </div>
      </div>
    );
  }

  // 사용자 정보가 없으면 null 반환
  if (!user) {
    return null;
  }

  if (loading && !analysisData) {
    return (
      <Layout user={{ name: user.name, role: user.role }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px' 
        }}>
          <Spin size="large" />
          <Text style={{ marginTop: '16px', color: '#666' }}>
            AI가 관계 데이터를 분석하고 있습니다...
          </Text>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={{ name: user.name, role: user.role }}>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
            <div>
              <Title level={2}>
                <BulbOutlined style={{ marginRight: '8px', color: '#faad14' }} />
                AI 관계 분석 결과
              </Title>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">
                  인공지능이 분석한 학급 관계 패턴과 개선 방안을 확인하세요.
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
              {lastUpdated && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    마지막 업데이트: {lastUpdated}
                  </Text>
                </div>
              )}
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
              loading={loading}
              size="large"
            >
              새로고침
            </Button>
            
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportReport}
              size="large"
            >
              보고서 내보내기
            </Button>
          </Space>
        </div>
      </div>

      {analysisData && (
        <>
          {/* 전체 분석 지표 */}
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="네트워크 건강도"
                  value={analysisData.networkHealth}
                  suffix="/100"
                  valueStyle={{ 
                    color: analysisData.networkHealth >= 80 ? '#52c41a' : 
                           analysisData.networkHealth >= 60 ? '#faad14' : '#f5222d' 
                  }}
                  prefix={<HeartOutlined />}
                />
                <Progress 
                  percent={analysisData.networkHealth} 
                  showInfo={false}
                  strokeColor={
                    analysisData.networkHealth >= 80 ? '#52c41a' : 
                    analysisData.networkHealth >= 60 ? '#faad14' : '#f5222d'
                  }
                />
              </Card>
            </Col>
            
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="결속력 지수"
                  value={analysisData.cohesionScore}
                  suffix="/100"
                  valueStyle={{ 
                    color: analysisData.cohesionScore >= 80 ? '#52c41a' : 
                           analysisData.cohesionScore >= 60 ? '#faad14' : '#f5222d' 
                  }}
                  prefix={<TeamOutlined />}
                />
                <Progress 
                  percent={analysisData.cohesionScore} 
                  showInfo={false}
                  strokeColor={
                    analysisData.cohesionScore >= 80 ? '#52c41a' : 
                    analysisData.cohesionScore >= 60 ? '#faad14' : '#f5222d'
                  }
                />
              </Card>
            </Col>
            
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="전체 연결 수"
                  value={analysisData.totalConnections}
                  prefix={<ShareAltOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="평균 연결 수"
                  value={analysisData.averageConnections}
                  precision={1}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* AI 인사이트 */}
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <span>
                    <BulbOutlined style={{ marginRight: '8px', color: '#faad14' }} />
                    AI 분석 인사이트
                  </span>
                }
                style={{ height: '100%' }}
              >
                <List
                  dataSource={analysisData.insights}
                  renderItem={(item, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                          {index + 1}
                        </Avatar>}
                        description={item}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            {/* 개선 권장사항 */}
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <span>
                    <CheckCircleOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                    개선 권장사항
                  </span>
                }
                style={{ height: '100%' }}
              >
                <Timeline
                  items={analysisData.recommendations.map((recommendation, index) => ({
                    color: '#52c41a',
                    children: (
                      <div key={index}>
                        <Text>{recommendation}</Text>
                      </div>
                    )
                  }))}
                />
              </Card>
            </Col>
          </Row>

          {/* 주의가 필요한 학생들 */}
          <Card 
            title={
              <span>
                <WarningOutlined style={{ marginRight: '8px', color: '#fa541c' }} />
                주의가 필요한 학생들
              </span>
            }
            style={{ marginTop: '16px' }}
          >
            {analysisData.studentAnalyses.filter(s => s.category === 'isolated').length > 0 ? (
              <List
                grid={{ 
                  gutter: 16, 
                  xs: 1, 
                  sm: 1, 
                  md: 2, 
                  lg: 2, 
                  xl: 2 
                }}
                dataSource={analysisData.studentAnalyses.filter(s => s.category === 'isolated')}
                renderItem={student => (
                  <List.Item>
                    <Card size="small">
                      <Card.Meta
                        avatar={getCategoryIcon(student.category)}
                        title={
                          <Space>
                            <Text strong>{student.name}</Text>
                            {getCategoryTag(student.category)}
                            {getRiskLevelTag(student.riskLevel)}
                          </Space>
                        }
                        description={
                          <div>
                            <Paragraph style={{ margin: 0, fontSize: '12px' }}>
                              연결 수: {student.connections}개
                            </Paragraph>
                            <div style={{ marginTop: '8px' }}>
                              {student.insights.map((insight, idx) => (
                                <Tag key={idx} color="orange" style={{ marginBottom: '4px', fontSize: '11px' }}>
                                  {insight}
                                </Tag>
                              ))}
                            </div>
                            <div style={{ marginTop: '8px' }}>
                              <Text strong style={{ fontSize: '12px' }}>권장사항:</Text>
                              {student.recommendations.map((rec, idx) => (
                                <div key={idx} style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                  • {rec}
                                </div>
                              ))}
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <Alert
                message="소외 위험군 학생이 없습니다"
                description="현재 모든 학생들이 건강한 관계를 형성하고 있습니다."
                type="success"
                showIcon
              />
            )}
          </Card>

          {/* 핵심 역할 학생들 */}
          <Card 
            title={
              <span>
                <TrophyOutlined style={{ marginRight: '8px', color: '#faad14' }} />
                핵심 역할 학생들
              </span>
            }
            style={{ marginTop: '16px' }}
          >
            <List
              grid={{ 
                gutter: 16, 
                xs: 1, 
                sm: 2, 
                md: 3, 
                lg: 4, 
                xl: 4 
              }}
              dataSource={analysisData.studentAnalyses.filter(s => s.category === 'popular' || s.category === 'bridge')}
              renderItem={student => (
                <List.Item>
                  <Card size="small">
                    <Card.Meta
                      avatar={getCategoryIcon(student.category)}
                      title={
                        <Space>
                          <Text strong>{student.name}</Text>
                          {getCategoryTag(student.category)}
                        </Space>
                      }
                      description={
                        <div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            연결 수: {student.connections}개
                          </Text>
                          <div style={{ marginTop: '8px' }}>
                            {student.insights.slice(0, 1).map((insight, idx) => (
                              <Text key={idx} style={{ fontSize: '11px', color: '#666' }}>
                                {insight}
                              </Text>
                            ))}
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          </Card>
        </>
      )}
      </div>
    </Layout>
  );
}