'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  Typography, 
  Button, 
  Space, 
  Statistic, 
  Progress,
  Table,
  Tag,
  Modal,
  message,
  Row,
  Col,
  Input,
  Divider
} from 'antd';
import { 
  EyeOutlined,
  ShareAltOutlined,
  BarChartOutlined,
  ReloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  CopyOutlined
} from '@ant-design/icons';
import RelationshipNetwork from '@/components/network/RelationshipNetwork';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

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
  questions: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    maxSelections: number;
  }>;
}

interface SurveyResponse {
  id: string;
  surveyId: string;
  studentName?: string;
  submittedAt: string;
  responses: Array<{
    questionId: string;
    selectedStudents: string[];
  }>;
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  useEffect(() => {
    loadSession();
    loadResponses();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      // 로컬스토리지에서 설문 데이터 로드
      const storedSurveys = localStorage.getItem('surveys');
      const surveys = storedSurveys ? JSON.parse(storedSurveys) : [];
      
      // 더미 설문 데이터도 포함
      const dummySurveys = [
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
        }
      ];

      const allSurveys = [...dummySurveys, ...surveys];
      const currentSurvey = allSurveys.find(s => s.id === sessionId);
      
      if (currentSurvey) {
        setSurvey(currentSurvey);
      }
      
    } catch (error) {
      console.error('Failed to load session:', error);
      message.error('세션을 불러오는데 실패했습니다.');
    }
  };

  const loadResponses = async () => {
    try {
      // 로컬스토리지에서 응답 데이터 로드
      const storedResponses = localStorage.getItem('survey_responses');
      const allResponses = storedResponses ? JSON.parse(storedResponses) : [];
      
      // 현재 설문의 응답만 필터링
      const sessionResponses = allResponses.filter((r: SurveyResponse) => r.surveyId === sessionId);
      setResponses(sessionResponses);
      
    } catch (error) {
      console.error('Failed to load responses:', error);
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

  const handleShare = () => {
    setShareModalVisible(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('링크가 클립보드에 복사되었습니다!');
    } catch (err) {
      // 클립보드 API가 실패하면 fallback 방법 사용
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      message.success('링크가 클립보드에 복사되었습니다!');
    }
  };

  const surveyLink = `${window.location.origin}/survey/${sessionId}/respond`;

  const responseColumns = [
    {
      title: '응답자',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (name: string) => name || '익명',
    },
    {
      title: '응답시간',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: string) => new Date(date).toLocaleString('ko-KR'),
    },
    {
      title: '응답수',
      key: 'responseCount',
      render: (_: any, record: SurveyResponse) => (
        <Text>{record.responses?.length || 0}개 질문 응답</Text>
      ),
    },
    {
      title: '작업',
      key: 'actions',
      render: (_: any, record: SurveyResponse) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => console.log('View response:', record.id)}
        >
          상세보기
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Title level={3}>세션 로딩 중...</Title>
      </div>
    );
  }

  if (!survey) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Title level={3}>세션을 찾을 수 없습니다</Title>
        <Button onClick={() => router.push('/teacher/dashboard')}>
          대시보드로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <Title level={2}>{survey.title}</Title>
            <Space>
              {getStatusTag(survey.status)}
              <Text type="secondary">
                생성일: {new Date(survey.createdAt).toLocaleDateString('ko-KR')}
              </Text>
            </Space>
          </div>
          <Space>
            <Button 
              type="primary" 
              icon={<ShareAltOutlined />}
              onClick={handleShare}
            >
              설문 공유
            </Button>
            <Button 
              icon={<BarChartOutlined />}
              onClick={() => router.push(`/analytics?survey=${sessionId}`)}
            >
              분석 결과
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => {
                loadSession();
                loadResponses();
              }}
            >
              새로고침
            </Button>
          </Space>
        </div>
        
        <Paragraph type="secondary">
          {survey.description}
        </Paragraph>
      </div>

      {/* 통계 카드 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="전체 응답"
              value={responses.length}
              prefix={<UserOutlined />}
              suffix={`/ ${survey.totalStudents}명`}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="응답률"
              value={Math.round((responses.length / survey.totalStudents) * 100)}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ 
                color: responses.length === survey.totalStudents ? '#52c41a' : '#faad14' 
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="질문 수"
              value={survey.totalQuestions}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="남은 기간"
              value={survey.duration}
              suffix="일"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 관계 네트워크 시각화 */}
      {responses.length > 0 && (
        <Card title="학생 관계 네트워크" style={{ marginBottom: '24px' }}>
          <RelationshipNetwork 
            surveyId={sessionId} 
            enableAnalysis={true}
          />
        </Card>
      )}

      {/* 응답 진행률 */}
      <Card title="응답 진행률" style={{ marginBottom: '24px' }}>
        {getResponseProgress(responses.length, survey.totalStudents)}
      </Card>

      {/* 질문 목록 */}
      <Card title="설문 질문" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {survey.questions.map((question, index) => (
            <Card key={question.id} size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>질문 {index + 1}: {question.title}</Text>
                  <br />
                  <Text type="secondary">{question.description}</Text>
                  <br />
                  <Tag color="blue">최대 {question.maxSelections}명 선택</Tag>
                </div>
              </div>
            </Card>
          ))}
        </Space>
      </Card>

      {/* 응답 목록 */}
      <Card title="응답 목록">
        <Table
          columns={responseColumns}
          dataSource={responses}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} 응답`
          }}
        />
      </Card>

      {/* 설문 공유 모달 */}
      <Modal
        title="설문 공유"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={null}
        width={600}
      >
        <div>
          <Paragraph>
            학생들이 설문에 참여할 수 있는 링크입니다. 링크를 복사하여 학생들에게 공유해주세요.
          </Paragraph>
          
          <div style={{ marginBottom: '16px' }}>
            <Text strong>설문 참여 링크</Text>
          </div>
          
          <Input.Group compact style={{ marginBottom: '16px' }}>
            <Input
              style={{ width: 'calc(100% - 100px)' }}
              value={surveyLink}
              readOnly
            />
            <Button 
              type="primary"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(surveyLink)}
            >
              복사
            </Button>
          </Input.Group>

          <Divider />
          
          <div style={{ marginBottom: '16px' }}>
            <Text strong>공유용 안내 문구 (선택사항)</Text>
          </div>
          
          <TextArea
            rows={6}
            value={`📋 ${survey.title}

우리 반 관계 분석을 위한 설문에 참여해주세요!

🔗 참여 링크: ${surveyLink}

• 익명으로 진행됩니다
• 소요 시간: 약 5-10분
• 마감: ${survey.duration}일 후

여러분의 참여가 더 좋은 학급 분위기 만들기에 도움이 됩니다! ✨`}
            placeholder="학생들에게 보낼 안내 문구를 작성하세요"
            onChange={(e) => {/* 안내 문구 수정 기능은 향후 구현 */}}
          />
          
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <Button 
              type="primary"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(`📋 ${survey.title}

우리 반 관계 분석을 위한 설문에 참여해주세요!

🔗 참여 링크: ${surveyLink}

• 익명으로 진행됩니다
• 소요 시간: 약 5-10분
• 마감: ${survey.duration}일 후

여러분의 참여가 더 좋은 학급 분위기 만들기에 도움이 됩니다! ✨`)}
            >
              안내 문구 복사
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}