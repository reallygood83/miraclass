'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Alert,
  List,
  Avatar,
  Tag,
  Button,
  Space,
  Select,
  DatePicker,
  Timeline,
  Progress,
  Statistic,
  Badge,
  message,
  Spin,
  Divider,
  Modal
} from 'antd';
import { 
  EyeOutlined,
  WarningOutlined,
  BellOutlined,
  UserOutlined,
  TeamOutlined,
  RiseOutlined,
  FallOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface MonitoringAlert {
  id: string;
  type: 'isolation_risk' | 'network_change' | 'conflict_detected' | 'positive_change';
  severity: 'high' | 'medium' | 'low';
  studentName: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface NetworkTrend {
  date: string;
  networkHealth: number;
  activeConnections: number;
  isolatedCount: number;
}

interface StudentMonitoring {
  id: string;
  name: string;
  riskLevel: 'high' | 'medium' | 'low';
  connectionCount: number;
  recentChange: 'up' | 'down' | 'stable';
  lastAnalysis: string;
  alerts: MonitoringAlert[];
}

export default function MonitoringPage() {
  const [selectedClass, setSelectedClass] = useState('6학년 1반');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [networkTrends, setNetworkTrends] = useState<NetworkTrend[]>([]);
  const [studentMonitoring, setStudentMonitoring] = useState<StudentMonitoring[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadMonitoringData();
  }, [selectedClass, dateRange]);

  const loadMonitoringData = async () => {
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 더미 알림 데이터
      const dummyAlerts: MonitoringAlert[] = [
        {
          id: '1',
          type: 'isolation_risk',
          severity: 'high',
          studentName: '이채원',
          message: '지난 주 대비 연결 수가 50% 감소했습니다. 개별 상담이 필요할 수 있습니다.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isRead: false
        },
        {
          id: '2',
          type: 'positive_change',
          severity: 'low',
          studentName: '정현수',
          message: '새로운 친구 관계를 형성하며 연결 수가 증가했습니다.',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          isRead: false
        },
        {
          id: '3',
          type: 'network_change',
          severity: 'medium',
          studentName: '김민수',
          message: '네트워크 중심 역할이 강화되어 과도한 부담이 있을 수 있습니다.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          isRead: true
        }
      ];
      
      // 더미 트렌드 데이터
      const dummyTrends: NetworkTrend[] = [
        { date: '2025-01-18', networkHealth: 75, activeConnections: 80, isolatedCount: 3 },
        { date: '2025-01-19', networkHealth: 77, activeConnections: 82, isolatedCount: 3 },
        { date: '2025-01-20', networkHealth: 78, activeConnections: 84, isolatedCount: 2 },
        { date: '2025-01-21', networkHealth: 76, activeConnections: 81, isolatedCount: 3 },
        { date: '2025-01-22', networkHealth: 78, activeConnections: 84, isolatedCount: 2 },
        { date: '2025-01-23', networkHealth: 79, activeConnections: 86, isolatedCount: 2 },
        { date: '2025-01-24', networkHealth: 78, activeConnections: 84, isolatedCount: 2 }
      ];
      
      // 더미 학생 모니터링 데이터
      const dummyStudentMonitoring: StudentMonitoring[] = [
        {
          id: '22',
          name: '이채원',
          riskLevel: 'high',
          connectionCount: 1,
          recentChange: 'down',
          lastAnalysis: '2시간 전',
          alerts: dummyAlerts.filter(a => a.studentName === '이채원')
        },
        {
          id: '15',
          name: '정현수',
          riskLevel: 'medium',
          connectionCount: 3,
          recentChange: 'up',
          lastAnalysis: '4시간 전',
          alerts: dummyAlerts.filter(a => a.studentName === '정현수')
        },
        {
          id: '1',
          name: '김민수',
          riskLevel: 'low',
          connectionCount: 12,
          recentChange: 'stable',
          lastAnalysis: '1일 전',
          alerts: dummyAlerts.filter(a => a.studentName === '김민수')
        }
      ];
      
      setAlerts(dummyAlerts);
      setNetworkTrends(dummyTrends);
      setStudentMonitoring(dummyStudentMonitoring);
      
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      message.error('모니터링 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    const iconMap = {
      isolation_risk: <WarningOutlined style={{ color: '#fa541c' }} />,
      network_change: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      conflict_detected: <AlertOutlined style={{ color: '#f5222d' }} />,
      positive_change: <CheckCircleOutlined style={{ color: '#52c41a' }} />
    };
    
    return iconMap[type as keyof typeof iconMap] || <InfoCircleOutlined />;
  };

  const getAlertColor = (severity: string) => {
    const colorMap = {
      high: '#fa541c',
      medium: '#faad14',
      low: '#52c41a'
    };
    
    return colorMap[severity as keyof typeof colorMap] || '#1890ff';
  };

  const getRiskLevelTag = (riskLevel: string) => {
    const riskMap = {
      high: { color: 'error', text: '높음' },
      medium: { color: 'warning', text: '보통' },
      low: { color: 'success', text: '낮음' }
    };
    
    const config = riskMap[riskLevel as keyof typeof riskMap] || { color: 'default', text: riskLevel };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getTrendIcon = (change: string) => {
    const trendMap = {
      up: <RiseOutlined style={{ color: '#52c41a' }} />,
      down: <FallOutlined style={{ color: '#fa541c' }} />,
      stable: <UserOutlined style={{ color: '#1890ff' }} />
    };
    
    return trendMap[change as keyof typeof trendMap] || <UserOutlined />;
  };

  const markAlertAsRead = (alertId: string) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    );
  };

  const unreadAlertsCount = alerts.filter(alert => !alert.isRead).length;
  const currentTrend = networkTrends[networkTrends.length - 1];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
          <div>
            <Title level={2}>
              <EyeOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              관계 모니터링
              {unreadAlertsCount > 0 && (
                <Badge count={unreadAlertsCount} style={{ marginLeft: '8px' }}>
                  <BellOutlined style={{ fontSize: '20px' }} />
                </Badge>
              )}
            </Title>
            <Text type="secondary">
              학생들의 관계 변화를 실시간으로 모니터링하고 조기 개입 신호를 포착합니다.
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
            
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates || [null, null])}
              format="YYYY-MM-DD"
              size="large"
            />
            
            <Button
              icon={<SettingOutlined />}
              onClick={() => setShowSettings(true)}
              size="large"
            >
              알림 설정
            </Button>
          </Space>
        </div>
      </div>

      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px' 
        }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* 현재 상태 요약 */}
          {currentTrend && (
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="네트워크 건강도"
                    value={currentTrend.networkHealth}
                    suffix="/100"
                    valueStyle={{ 
                      color: currentTrend.networkHealth >= 75 ? '#52c41a' : 
                             currentTrend.networkHealth >= 60 ? '#faad14' : '#fa541c' 
                    }}
                    prefix={<TeamOutlined />}
                  />
                </Card>
              </Col>
              
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="활성 연결 수"
                    value={currentTrend.activeConnections}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
              
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="소외 위험군"
                    value={currentTrend.isolatedCount}
                    suffix="명"
                    valueStyle={{ 
                      color: currentTrend.isolatedCount === 0 ? '#52c41a' : 
                             currentTrend.isolatedCount <= 2 ? '#faad14' : '#fa541c' 
                    }}
                    prefix={<WarningOutlined />}
                  />
                </Card>
              </Col>
              
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="미읽음 알림"
                    value={unreadAlertsCount}
                    suffix="건"
                    valueStyle={{ color: unreadAlertsCount > 0 ? '#fa541c' : '#52c41a' }}
                    prefix={<BellOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          )}

          <Row gutter={[16, 16]}>
            {/* 최근 알림 */}
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <span>
                    <BellOutlined style={{ marginRight: '8px' }} />
                    최근 알림
                  </span>
                }
                extra={
                  <Button 
                    size="small" 
                    onClick={() => setAlerts(alerts.map(a => ({ ...a, isRead: true })))}
                  >
                    모두 읽음 표시
                  </Button>
                }
                style={{ height: '100%' }}
              >
                <List
                  dataSource={alerts.slice(0, 5)}
                  renderItem={alert => (
                    <List.Item
                      style={{ 
                        backgroundColor: alert.isRead ? 'transparent' : '#f6ffed',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        cursor: 'pointer'
                      }}
                      onClick={() => markAlertAsRead(alert.id)}
                    >
                      <List.Item.Meta
                        avatar={getAlertIcon(alert.type)}
                        title={
                          <Space>
                            <Text strong>{alert.studentName}</Text>
                            <Tag 
                              color={getAlertColor(alert.severity)}
                                                          >
                              {alert.severity}
                            </Tag>
                            {!alert.isRead && (
                              <Badge status="processing" />
                            )}
                          </Space>
                        }
                        description={
                          <div>
                            <Text style={{ fontSize: '12px' }}>{alert.message}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              {new Date(alert.timestamp).toLocaleString('ko-KR')}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
                
                {alerts.length > 5 && (
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <Button type="link">모든 알림 보기</Button>
                  </div>
                )}
              </Card>
            </Col>

            {/* 주의 대상 학생 */}
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <span>
                    <WarningOutlined style={{ marginRight: '8px', color: '#fa541c' }} />
                    주의 대상 학생
                  </span>
                }
                style={{ height: '100%' }}
              >
                <List
                  dataSource={studentMonitoring}
                  renderItem={student => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            icon={getTrendIcon(student.recentChange)}
                            style={{
                              backgroundColor: 
                                student.riskLevel === 'high' ? '#fa541c' :
                                student.riskLevel === 'medium' ? '#faad14' : '#52c41a'
                            }}
                          />
                        }
                        title={
                          <Space>
                            <Text strong>{student.name}</Text>
                            {getRiskLevelTag(student.riskLevel)}
                          </Space>
                        }
                        description={
                          <div>
                            <Text style={{ fontSize: '12px' }}>
                              연결 수: {student.connectionCount}개 | 
                              최근 분석: {student.lastAnalysis}
                            </Text>
                            {student.alerts.length > 0 && (
                              <div style={{ marginTop: '4px' }}>
                                <Badge count={student.alerts.length} size="small">
                                  <Text type="secondary" style={{ fontSize: '11px' }}>
                                    새 알림
                                  </Text>
                                </Badge>
                              </div>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>

          {/* 네트워크 트렌드 */}
          <Card 
            title="네트워크 건강도 추이"
            style={{ marginTop: '16px' }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px' 
            }}>
              <Text>지난 7일간 네트워크 건강도 변화</Text>
              <Space>
                {networkTrends.slice(-2).map((trend, index, arr) => {
                  if (index === 0) return null;
                  const change = trend.networkHealth - arr[index - 1].networkHealth;
                  return (
                    <Tag 
                      key={trend.date}
                      color={change > 0 ? 'green' : change < 0 ? 'red' : 'blue'}
                    >
                      {change > 0 ? '+' : ''}{change}점
                    </Tag>
                  );
                })}
              </Space>
            </div>
            
            <Timeline
              items={networkTrends.slice(-5).map(trend => ({
                color: trend.networkHealth >= 75 ? 'green' : trend.networkHealth >= 60 ? 'blue' : 'red',
                children: (
                  <div>
                    <Text strong>{trend.date}</Text>
                    <div style={{ marginTop: '4px' }}>
                      <Text>네트워크 건강도: {trend.networkHealth}점</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        활성 연결: {trend.activeConnections}개 | 
                        소외 위험군: {trend.isolatedCount}명
                      </Text>
                    </div>
                  </div>
                )
              }))}
            />
          </Card>

          {/* 알림 설정 모달 */}
          <Modal
            title="알림 설정"
            open={showSettings}
            onCancel={() => setShowSettings(false)}
            footer={[
              <Button key="cancel" onClick={() => setShowSettings(false)}>
                취소
              </Button>,
              <Button key="save" type="primary" onClick={() => {
                setShowSettings(false);
                message.success('알림 설정이 저장되었습니다.');
              }}>
                저장
              </Button>
            ]}
          >
            <div style={{ marginBottom: '16px' }}>
              <Text strong>소외 위험 감지</Text>
              <div style={{ marginTop: '8px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text>연결 수 감소율</Text>
                    <Select defaultValue="30" style={{ width: '100px', marginLeft: '8px' }}>
                      <Option value="20">20%</Option>
                      <Option value="30">30%</Option>
                      <Option value="50">50%</Option>
                    </Select>
                    <Text style={{ marginLeft: '8px' }}>이상 감소 시 알림</Text>
                  </div>
                  
                  <div>
                    <Text>최소 연결 수</Text>
                    <Select defaultValue="2" style={{ width: '100px', marginLeft: '8px' }}>
                      <Option value="1">1개</Option>
                      <Option value="2">2개</Option>
                      <Option value="3">3개</Option>
                    </Select>
                    <Text style={{ marginLeft: '8px' }}>이하 시 알림</Text>
                  </div>
                </Space>
              </div>
            </div>
            
            <Divider />
            
            <div>
              <Text strong>알림 빈도</Text>
              <div style={{ marginTop: '8px' }}>
                <Select defaultValue="daily" style={{ width: '100%' }}>
                  <Option value="realtime">실시간</Option>
                  <Option value="hourly">매시간</Option>
                  <Option value="daily">매일</Option>
                  <Option value="weekly">매주</Option>
                </Select>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}