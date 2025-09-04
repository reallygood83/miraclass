'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Typography, 
  Progress,
  Modal,
  message,
  Tooltip,
  Statistic,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface Survey {
  id: string;
  title: string;
  description: string;
  targetClass: string;
  status: 'draft' | 'active' | 'completed' | 'paused';
  createdAt: string;
  duration: number;
  anonymous: boolean;
  totalQuestions: number;
  responses: number;
  totalStudents: number;
  autoAnalysis: boolean;
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    setLoading(true);
    try {
      // 실제 API 호출 대신 로컬스토리지에서 데이터 로드
      const storedSurveys = localStorage.getItem('surveys');
      const parsedSurveys = storedSurveys ? JSON.parse(storedSurveys) : [];
      
      // 더미 데이터 추가 (실제 구현에서는 제거)
      const dummySurveys: Survey[] = [
        {
          id: '1',
          title: '6학년 1반 친구 관계 조사',
          description: '우리 반 친구들과의 관계를 알아보는 설문입니다.',
          targetClass: '6학년 1반',
          status: 'active',
          createdAt: '2025-01-15',
          duration: 7,
          anonymous: true,
          totalQuestions: 3,
          responses: 22,
          totalStudents: 28,
          autoAnalysis: true
        },
        {
          id: '2',
          title: '협력 관계 분석 설문',
          description: '팀 프로젝트와 협력 관계를 분석하는 설문입니다.',
          targetClass: '6학년 1반',
          status: 'completed',
          createdAt: '2025-01-01',
          duration: 14,
          anonymous: true,
          totalQuestions: 4,
          responses: 28,
          totalStudents: 28,
          autoAnalysis: true
        },
        {
          id: '3',
          title: '신뢰 관계 설문',
          description: '친구들 간의 신뢰와 소통에 대한 설문입니다.',
          targetClass: '6학년 1반',
          status: 'draft',
          createdAt: '2025-01-20',
          duration: 7,
          anonymous: true,
          totalQuestions: 2,
          responses: 0,
          totalStudents: 28,
          autoAnalysis: false
        }
      ];

      const combinedSurveys = [...dummySurveys, ...parsedSurveys];
      setSurveys(combinedSurveys);
      
    } catch (error) {
      console.error('Failed to load surveys:', error);
      message.error('설문 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap = {
      draft: { color: 'default', text: '초안' },
      active: { color: 'processing', text: '진행중' },
      completed: { color: 'success', text: '완료' },
      paused: { color: 'warning', text: '일시정지' }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getResponseProgress = (responses: number, total: number) => {
    const percentage = Math.round((responses / total) * 100);
    return (
      <div>
        <Progress 
          percent={percentage} 
          size="small" 
          status={percentage === 100 ? 'success' : 'active'}
        />
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {responses}/{total}명 응답
        </Text>
      </div>
    );
  };

  const handleDeleteSurvey = (surveyId: string) => {
    Modal.confirm({
      title: '설문 삭제',
      content: '정말로 이 설문을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      okText: '삭제',
      cancelText: '취소',
      okType: 'danger',
      onOk: () => {
        const updatedSurveys = surveys.filter(s => s.id !== surveyId);
        setSurveys(updatedSurveys);
        
        // 로컬스토리지에서도 삭제
        const storedSurveys = JSON.parse(localStorage.getItem('surveys') || '[]');
        const filteredSurveys = storedSurveys.filter((s: any) => s.id !== surveyId);
        localStorage.setItem('surveys', JSON.stringify(filteredSurveys));
        
        message.success('설문이 삭제되었습니다.');
      }
    });
  };

  const handleAnalyzeSurvey = (surveyId: string) => {
    message.success('AI 분석이 시작되었습니다. 잠시 후 결과를 확인하실 수 있습니다.');
    router.push('/analytics');
  };

  const columns = [
    {
      title: '설문 제목',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      render: (text: string, record: Survey) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{text}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </div>
      )
    },
    {
      title: '대상',
      dataIndex: 'targetClass',
      key: 'targetClass',
      width: 120,
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '응답률',
      key: 'progress',
      width: 150,
      render: (_: any, record: Survey) => 
        getResponseProgress(record.responses, record.totalStudents)
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR')
    },
    {
      title: '작업',
      key: 'actions',
      width: 200,
      render: (_: any, record: Survey) => (
        <Space size="small">
          <Tooltip title="자세히 보기">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
              onClick={() => router.push(`/survey/${record.id}`)}
            />
          </Tooltip>
          
          {record.status === 'active' && record.responses > 0 && (
            <Tooltip title="AI 분석">
              <Button 
                type="text" 
                icon={<BarChartOutlined />}
                onClick={() => handleAnalyzeSurvey(record.id)}
              />
            </Tooltip>
          )}
          
          {record.status === 'draft' && (
            <Tooltip title="편집">
              <Button 
                type="text" 
                icon={<EditOutlined />}
                onClick={() => router.push(`/survey/${record.id}/edit`)}
              />
            </Tooltip>
          )}
          
          <Tooltip title="삭제">
            <Button 
              type="text" 
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteSurvey(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // 통계 계산
  const totalSurveys = surveys.length;
  const activeSurveys = surveys.filter(s => s.status === 'active').length;
  const completedSurveys = surveys.filter(s => s.status === 'completed').length;
  const totalResponses = surveys.reduce((sum, s) => sum + s.responses, 0);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={2}>설문 관리</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            size="large"
            onClick={() => router.push('/survey/create')}
          >
            새 설문 만들기
          </Button>
        </div>
        
        <Text type="secondary">
          학생 관계 분석을 위한 설문을 생성하고 관리합니다.
        </Text>
      </div>

      {/* 통계 카드 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="전체 설문"
              value={totalSurveys}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="진행 중"
              value={activeSurveys}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="완료됨"
              value={completedSurveys}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="총 응답"
              value={totalResponses}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 설문 목록 테이블 */}
      <Card>
        <Table
          columns={columns}
          dataSource={surveys}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} 설문`
          }}
        />
      </Card>
    </div>
  );
}