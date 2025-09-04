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
  DownloadOutlined
} from '@ant-design/icons';

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

export default function AnalyticsPage() {
  const [selectedClass, setSelectedClass] = useState('6학년 1반');
  const [analysisData, setAnalysisData] = useState<ClassAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    loadAnalysisData();
  }, [selectedClass]);

  const loadAnalysisData = async () => {
    setLoading(true);
    
    try {
      // 시뮬레이션 데이터 - 실제 구현에서는 관계 분석 API 호출
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
      console.error('Failed to load analysis data:', error);
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
    loadAnalysisData();
    message.success('분석 데이터가 새로고침되었습니다.');
  };

  const handleExportReport = () => {
    message.info('분석 보고서 내보내기 기능이 준비 중입니다.');
  };

  if (loading && !analysisData) {
    return (
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
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
          <div>
            <Title level={2}>
              <BulbOutlined style={{ marginRight: '8px', color: '#faad14' }} />
              AI 관계 분석 결과
            </Title>
            <Text type="secondary">
              인공지능이 분석한 학급 관계 패턴과 개선 방안을 확인하세요.
            </Text>
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
  );
}