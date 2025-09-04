'use client'

import { Card, Alert, Progress, Tag, Divider, Space, Typography, Row, Col, Statistic } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  WarningOutlined, 
  BulbOutlined, 
  HeartOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { AnalysisInsight, Recommendation, ClassNetworkSummary } from '@/lib/types/relationships';

const { Title, Text, Paragraph } = Typography;

interface InsightsDisplayProps {
  insights: AnalysisInsight[];
  recommendations: Recommendation[];
  classSummary: ClassNetworkSummary;
}

export default function InsightsDisplay({ insights, recommendations, classSummary }: InsightsDisplayProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'warning': return 'orange';
      case 'info': return 'blue';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning': return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'info': return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      default: return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'social_structure': return <TeamOutlined />;
      case 'isolation_risk': return <UserOutlined />;
      case 'group_dynamics': return <TeamOutlined />;
      case 'relationship_patterns': return <HeartOutlined />;
      case 'intervention': return <WarningOutlined />;
      case 'grouping': return <TeamOutlined />;
      case 'monitoring': return <InfoCircleOutlined />;
      case 'support': return <HeartOutlined />;
      default: return <BulbOutlined />;
    }
  };

  return (
    <div style={{ marginTop: '24px' }}>
      {/* 전체 네트워크 요약 - 모바일 최적화 */}
      <Card 
        title={
          <Space>
            <TeamOutlined />
            <span style={{ fontSize: window.innerWidth < 768 ? '14px' : '16px' }}>
              학급 네트워크 요약
            </span>
          </Space>
        }
        style={{ marginBottom: window.innerWidth < 768 ? '16px' : '24px' }}
        size={window.innerWidth < 768 ? 'small' : 'default'}
      >
        <Row gutter={[12, 12]}>
          <Col xs={12} sm={12} md={6}>
            <Statistic 
              title="전체 학생 수" 
              value={classSummary.totalStudents} 
              suffix="명"
              prefix={<UserOutlined />}
              valueStyle={{ fontSize: window.innerWidth < 768 ? '20px' : '24px' }}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic 
              title="전체 관계 수" 
              value={classSummary.totalRelationships} 
              suffix="개"
              prefix={<HeartOutlined />}
              valueStyle={{ fontSize: window.innerWidth < 768 ? '20px' : '24px' }}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic 
              title="네트워크 밀도" 
              value={Math.round(classSummary.networkDensity * 100)} 
              suffix="%"
              prefix={<TeamOutlined />}
              valueStyle={{ fontSize: window.innerWidth < 768 ? '20px' : '24px' }}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic 
              title="군집 계수" 
              value={classSummary.clusteringCoefficient} 
              precision={2}
              prefix={<TeamOutlined />}
              valueStyle={{ fontSize: window.innerWidth < 768 ? '20px' : '24px' }}
            />
          </Col>
        </Row>

        <Divider />

        <Row gutter={[12, 12]}>
          <Col xs={24} sm={24} md={8}>
            <Card 
              size="small" 
              title="인기 학생" 
              bodyStyle={{ padding: window.innerWidth < 768 ? '8px' : '12px' }}
            >
              {classSummary.popularStudents.length > 0 ? (
                <Space wrap>
                  {classSummary.popularStudents.slice(0, 5).map((studentId, index) => (
                    <Tag key={index} color="gold" icon={<UserOutlined />}>
                      {studentId}
                    </Tag>
                  ))}
                  {classSummary.popularStudents.length > 5 && (
                    <Tag>+{classSummary.popularStudents.length - 5}명 더</Tag>
                  )}
                </Space>
              ) : (
                <Text type="secondary">없음</Text>
              )}
            </Card>
          </Col>
          
          <Col xs={24} sm={24} md={8}>
            <Card 
              size="small" 
              title="고립 위험 학생" 
              bodyStyle={{ padding: window.innerWidth < 768 ? '8px' : '12px' }}
            >
              {classSummary.isolatedStudents.length > 0 ? (
                <Space wrap>
                  {classSummary.isolatedStudents.slice(0, 5).map((studentId, index) => (
                    <Tag key={index} color="red" icon={<WarningOutlined />}>
                      {studentId}
                    </Tag>
                  ))}
                  {classSummary.isolatedStudents.length > 5 && (
                    <Tag>+{classSummary.isolatedStudents.length - 5}명 더</Tag>
                  )}
                </Space>
              ) : (
                <Text type="secondary">없음</Text>
              )}
            </Card>
          </Col>

          <Col xs={24} sm={24} md={8}>
            <Card 
              size="small" 
              title="연결고리 학생" 
              bodyStyle={{ padding: window.innerWidth < 768 ? '8px' : '12px' }}
            >
              {classSummary.bridgeStudents.length > 0 ? (
                <Space wrap>
                  {classSummary.bridgeStudents.slice(0, 5).map((studentId, index) => (
                    <Tag key={index} color="blue" icon={<TeamOutlined />}>
                      {studentId}
                    </Tag>
                  ))}
                  {classSummary.bridgeStudents.length > 5 && (
                    <Tag>+{classSummary.bridgeStudents.length - 5}명 더</Tag>
                  )}
                </Space>
              ) : (
                <Text type="secondary">없음</Text>
              )}
            </Card>
          </Col>
        </Row>

        <Divider />

        <div>
          <Title level={5}>식별된 그룹</Title>
          {classSummary.identifiedGroups.length > 0 ? (
            <Row gutter={[16, 16]}>
              {classSummary.identifiedGroups.map((group, index) => (
                <Col key={index} xs={24} sm={12} md={8}>
                  <Card size="small" style={{ height: '100%' }}>
                    <Title level={5} style={{ margin: 0, marginBottom: '8px' }}>
                      {group.name || `그룹 ${index + 1}`}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {group.groupType} • 응집력 {Math.round(group.cohesionScore * 100)}%
                    </Text>
                    <div style={{ marginTop: '8px' }}>
                      <Space wrap size={4}>
                        {group.studentIds.slice(0, 6).map((studentId, idx) => (
                          <Tag key={idx} size="small">{studentId}</Tag>
                        ))}
                        {group.studentIds.length > 6 && (
                          <Tag size="small">+{group.studentIds.length - 6}명</Tag>
                        )}
                      </Space>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Text type="secondary">명확한 그룹이 식별되지 않았습니다.</Text>
          )}
        </div>
      </Card>

      {/* AI 인사이트 - 모바일 최적화 */}
      <Card 
        title={
          <Space>
            <BulbOutlined />
            <span style={{ fontSize: window.innerWidth < 768 ? '14px' : '16px' }}>
              AI 분석 인사이트
            </span>
          </Space>
        } 
        style={{ marginBottom: window.innerWidth < 768 ? '16px' : '24px' }}
        size={window.innerWidth < 768 ? 'small' : 'default'}
      >
        {insights.length > 0 ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {insights.map((insight, index) => (
              <Alert
                key={index}
                message={
                  <Space>
                    {getSeverityIcon(insight.severity)}
                    <Text strong>{insight.title}</Text>
                    <Tag color={getSeverityColor(insight.severity)}>
                      {insight.severity === 'critical' ? '위험' : 
                       insight.severity === 'warning' ? '주의' : '정보'}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <Paragraph style={{ marginBottom: '8px' }}>
                      {insight.description}
                    </Paragraph>
                    {insight.affectedStudents && insight.affectedStudents.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <Text type="secondary">관련 학생: </Text>
                        <Space wrap>
                          {insight.affectedStudents.map((studentId, idx) => (
                            <Tag key={idx} size="small" color="blue">
                              {studentId}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    )}
                    {insight.recommendation && (
                      <Alert 
                        type="info" 
                        showIcon 
                        message="권장사항" 
                        description={insight.recommendation}
                        style={{ marginTop: '8px' }}
                      />
                    )}
                  </div>
                }
                type={
                  insight.severity === 'critical' ? 'error' :
                  insight.severity === 'warning' ? 'warning' : 'info'
                }
                style={{ width: '100%' }}
              />
            ))}
          </Space>
        ) : (
          <Text type="secondary">분석된 인사이트가 없습니다.</Text>
        )}
      </Card>

      {/* 권장사항 - 모바일 최적화 */}
      <Card 
        title={
          <Space>
            <HeartOutlined />
            <span style={{ fontSize: window.innerWidth < 768 ? '14px' : '16px' }}>
              맞춤형 권장사항
            </span>
          </Space>
        }
        size={window.innerWidth < 768 ? 'small' : 'default'}
      >
        {recommendations.length > 0 ? (
          <Space direction="vertical" size={window.innerWidth < 768 ? 'middle' : 'large'} style={{ width: '100%' }}>
            {recommendations.map((rec, index) => (
              <Card 
                key={index}
                size="small" 
                style={{ width: '100%' }}
                bodyStyle={{ padding: window.innerWidth < 768 ? '12px' : '16px' }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <Space>
                    {getTypeIcon(rec.type)}
                    <Title level={5} style={{ 
                      margin: 0,
                      fontSize: window.innerWidth < 768 ? '14px' : '16px'
                    }}>
                      {rec.title}
                    </Title>
                    <Tag color={getPriorityColor(rec.priority)}>
                      {rec.priority === 'high' ? '높음' : 
                       rec.priority === 'medium' ? '중간' : '낮음'}
                    </Tag>
                    <Tag color="blue">
                      {rec.type === 'intervention' ? '개입' :
                       rec.type === 'grouping' ? '그룹활동' :
                       rec.type === 'monitoring' ? '모니터링' : '지원'}
                    </Tag>
                  </Space>
                </div>

                <Paragraph style={{ marginBottom: '12px' }}>
                  {rec.description}
                </Paragraph>

                {rec.targetStudents.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong>대상 학생: </Text>
                    <Space wrap>
                      {rec.targetStudents.map((studentId, idx) => (
                        <Tag key={idx} color="green">
                          {studentId}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}

                {rec.actionSteps.length > 0 && (
                  <div>
                    <Text strong>실행 단계:</Text>
                    <ul style={{ marginTop: '8px', marginBottom: 0 }}>
                      {rec.actionSteps.map((step, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>
                          <Text>{step}</Text>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </Space>
        ) : (
          <Text type="secondary">권장사항이 생성되지 않았습니다.</Text>
        )}
      </Card>

      {/* AI 인사이트 추가 정보 - 모바일 최적화 */}
      {classSummary.aiInsights && (
        <Card 
          title={
            <Space>
              <BulbOutlined />
              <span style={{ fontSize: window.innerWidth < 768 ? '14px' : '16px' }}>
                AI 종합 분석
              </span>
            </Space>
          }
          style={{ marginTop: window.innerWidth < 768 ? '16px' : '24px' }}
          size={window.innerWidth < 768 ? 'small' : 'default'}
        >
          <Alert
            message="AI 분석 결과"
            description={classSummary.aiInsights}
            type="info"
            showIcon
          />
        </Card>
      )}
    </div>
  );
}