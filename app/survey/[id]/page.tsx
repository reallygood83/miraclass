'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  Typography, 
  Tag, 
  Progress, 
  Button, 
  Space, 
  Descriptions,
  List,
  Statistic,
  Row,
  Col,
  message,
  Spin,
  Empty,
  Divider
} from 'antd';
import { 
  ArrowLeftOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  BarChartOutlined,
  ShareAltOutlined,
  CopyOutlined
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
  questions: SurveyQuestion[];
}

interface SurveyQuestion {
  id: string;
  type: 'friend_selection' | 'collaboration' | 'trust' | 'conflict';
  title: string;
  description: string;
  maxSelections: number;
}

export default function SurveyDetailPage({ params }: { params: { id: string } }) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadSurvey();
  }, [params.id]);

  const loadSurvey = async () => {
    try {
      setLoading(true);
      
      // 더미 데이터 (실제 구현에서는 API 호출)
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
          autoAnalysis: true,
          questions: [
            {
              id: '1',
              type: 'friend_selection',
              title: '가장 친한 친구 3명을 선택해주세요',
              description: '현재 우리 반에서 가장 가까운 친구들을 선택해주세요.',
              maxSelections: 3
            },
            {
              id: '2',
              type: 'collaboration',
              title: '함께 프로젝트를 하고 싶은 친구들을 선택해주세요',
              description: '팀 프로젝트나 과제를 함께 할 때 협력하고 싶은 친구들입니다.',
              maxSelections: 5
            },
            {
              id: '3',
              type: 'trust',
              title: '고민을 상담하고 싶은 친구들을 선택해주세요',
              description: '개인적인 고민이나 어려움이 있을 때 도움을 구하고 싶은 친구들입니다.',
              maxSelections: 3
            }
          ]
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
          autoAnalysis: true,
          questions: [
            {
              id: '1',
              type: 'collaboration',
              title: '그룹 과제에서 함께 하고 싶은 친구들을 선택해주세요',
              description: '협업 능력이 뛰어나다고 생각하는 친구들을 골라주세요.',
              maxSelections: 4
            }
          ]
        }
      ];

      // 로컬스토리지에서 추가 설문 확인
      const storedSurveys = JSON.parse(localStorage.getItem('surveys') || '[]');
      const allSurveys = [...dummySurveys, ...storedSurveys];
      
      const foundSurvey = allSurveys.find(s => s.id === params.id);
      setSurvey(foundSurvey || null);

    } catch (error) {
      console.error('Failed to load survey:', error);
      message.error('설문을 불러오는데 실패했습니다.');
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

  const getQuestionTypeTag = (type: string) => {
    const typeMap = {
      friend_selection: { color: '#52c41a', text: '친구 선택' },
      collaboration: { color: '#1890ff', text: '협력 관계' },
      trust: { color: '#722ed1', text: '신뢰 관계' },
      conflict: { color: '#f5222d', text: '갈등 관계' }
    };
    
    const config = typeMap[type as keyof typeof typeMap] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleStatusChange = (newStatus: string) => {
    if (survey) {
      const updatedSurvey = { ...survey, status: newStatus };
      setSurvey(updatedSurvey as Survey);
      
      // 로컬스토리지 업데이트
      const storedSurveys = JSON.parse(localStorage.getItem('surveys') || '[]');
      const updatedSurveys = storedSurveys.map((s: any) => 
        s.id === params.id ? updatedSurvey : s
      );
      localStorage.setItem('surveys', JSON.stringify(updatedSurveys));
      
      message.success(`설문이 ${newStatus === 'active' ? '시작' : newStatus === 'paused' ? '일시정지' : '중지'}되었습니다.`);
    }
  };

  const copyShareLink = () => {
    const shareLink = `${window.location.origin}/survey/participate/${params.id}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      message.success('참여 링크가 복사되었습니다!');
    });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Empty
          description="설문을 찾을 수 없습니다."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
        <Button 
          type="primary" 
          onClick={() => router.push('/surveys')}
          style={{ marginTop: '16px' }}
        >
          설문 목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const responseRate = (survey.responses / survey.totalStudents) * 100;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <Button 
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/surveys')}
          style={{ marginBottom: '16px' }}
        >
          설문 목록으로 돌아가기
        </Button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <Title level={2}>{survey.title}</Title>
            <div style={{ marginBottom: '16px' }}>
              {getStatusTag(survey.status)}
              <Tag color="blue" style={{ marginLeft: '8px' }}>{survey.targetClass}</Tag>
              <Tag color={survey.anonymous ? 'green' : 'orange'}>
                {survey.anonymous ? '익명' : '실명'}
              </Tag>
            </div>
            <Text type="secondary">{survey.description}</Text>
          </div>
          
          <Space>
            {survey.status === 'draft' && (
              <Button 
                icon={<EditOutlined />}
                onClick={() => router.push(`/survey/${survey.id}/edit`)}
              >
                편집
              </Button>
            )}
            
            {survey.status === 'active' && (
              <>
                <Button 
                  icon={<PauseCircleOutlined />}
                  onClick={() => handleStatusChange('paused')}
                >
                  일시정지
                </Button>
                <Button 
                  type="primary"
                  icon={<ShareAltOutlined />}
                  onClick={copyShareLink}
                >
                  링크 공유
                </Button>
              </>
            )}
            
            {survey.status === 'paused' && (
              <Button 
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStatusChange('active')}
              >
                다시 시작
              </Button>
            )}
            
            {(survey.status === 'active' || survey.status === 'paused') && (
              <Button 
                danger
                icon={<StopOutlined />}
                onClick={() => handleStatusChange('completed')}
              >
                설문 종료
              </Button>
            )}
            
            {survey.status === 'completed' && survey.responses > 0 && (
              <Button 
                type="primary"
                icon={<BarChartOutlined />}
                onClick={() => router.push('/analytics')}
              >
                AI 분석 보기
              </Button>
            )}
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {/* 응답 현황 */}
        <Col xs={24} lg={8}>
          <Card title="응답 현황">
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Progress
                type="circle"
                percent={Math.round(responseRate)}
                format={() => `${survey.responses}/${survey.totalStudents}`}
                size={120}
                status={responseRate === 100 ? 'success' : 'active'}
              />
            </div>
            
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="전체 응답"
                  value={survey.responses}
                  suffix={`/ ${survey.totalStudents}명`}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="응답률"
                  value={responseRate}
                  precision={1}
                  suffix="%"
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 설문 정보 */}
        <Col xs={24} lg={16}>
          <Card title="설문 정보">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="생성일">
                {new Date(survey.createdAt).toLocaleDateString('ko-KR')}
              </Descriptions.Item>
              <Descriptions.Item label="설문 기간">
                {survey.duration}일
              </Descriptions.Item>
              <Descriptions.Item label="질문 수">
                {survey.totalQuestions}개
              </Descriptions.Item>
              <Descriptions.Item label="자동 분석">
                {survey.autoAnalysis ? '활성화' : '비활성화'}
              </Descriptions.Item>
              <Descriptions.Item label="대상 클래스" span={2}>
                {survey.targetClass}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* 설문 질문들 */}
      <Card 
        title="설문 질문" 
        style={{ marginTop: '16px' }}
      >
        <List
          itemLayout="vertical"
          dataSource={survey.questions}
          renderItem={(question, index) => (
            <List.Item key={question.id}>
              <List.Item.Meta
                title={
                  <div>
                    <Text strong>{`질문 ${index + 1}. ${question.title}`}</Text>
                    <div style={{ marginTop: '4px' }}>
                      {getQuestionTypeTag(question.type)}
                      <Tag color="default" style={{ marginLeft: '8px' }}>
                        최대 {question.maxSelections}명 선택
                      </Tag>
                    </div>
                  </div>
                }
                description={question.description}
              />
            </List.Item>
          )}
        />
      </Card>

      {/* 참여 링크 (활성화된 설문인 경우) */}
      {survey.status === 'active' && (
        <Card title="학생 참여 링크" style={{ marginTop: '16px' }}>
          <div style={{ 
            background: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text code style={{ fontSize: '14px' }}>
              {`${typeof window !== 'undefined' ? window.location.origin : ''}/survey/participate/${survey.id}`}
            </Text>
            <Button 
              type="primary" 
              icon={<CopyOutlined />} 
              onClick={copyShareLink}
              size="small"
            >
              복사
            </Button>
          </div>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
            이 링크를 학생들에게 공유하여 설문에 참여하게 할 수 있습니다.
          </Text>
        </Card>
      )}
    </div>
  );
}