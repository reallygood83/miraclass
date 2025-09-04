'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  Typography, 
  Button, 
  Steps,
  Form,
  Checkbox,
  message,
  Space,
  Tag,
  Divider,
  Result,
  Empty,
  Spin
} from 'antd';
import { 
  UserOutlined,
  CheckCircleOutlined,
  TeamOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface Survey {
  id: string;
  title: string;
  description: string;
  targetClass: string;
  status: 'draft' | 'active' | 'completed' | 'paused';
  anonymous: boolean;
  totalQuestions: number;
  questions: SurveyQuestion[];
}

interface SurveyQuestion {
  id: string;
  type: 'friend_selection' | 'collaboration' | 'trust' | 'conflict';
  title: string;
  description: string;
  maxSelections: number;
}

// 더미 학생 데이터
const dummyStudents = [
  { id: '1', name: '김민수', number: 1 },
  { id: '2', name: '이지은', number: 2 },
  { id: '3', name: '박준호', number: 3 },
  { id: '4', name: '최서연', number: 4 },
  { id: '5', name: '정다빈', number: 5 },
  { id: '6', name: '김태현', number: 6 },
  { id: '7', name: '이예린', number: 7 },
  { id: '8', name: '박시우', number: 8 },
  { id: '9', name: '최하늘', number: 9 },
  { id: '10', name: '정우진', number: 10 },
  { id: '11', name: '김소영', number: 11 },
  { id: '12', name: '이동현', number: 12 },
  { id: '13', name: '박지민', number: 13 },
  { id: '14', name: '최은비', number: 14 },
  { id: '15', name: '정현수', number: 15 },
  { id: '16', name: '김나영', number: 16 },
  { id: '17', name: '이준석', number: 17 },
  { id: '18', name: '박미소', number: 18 },
  { id: '19', name: '최민준', number: 19 },
  { id: '20', name: '정수빈', number: 20 },
  { id: '21', name: '김호영', number: 21 },
  { id: '22', name: '이채원', number: 22 },
  { id: '23', name: '박성민', number: 23 },
  { id: '24', name: '최예나', number: 24 },
  { id: '25', name: '정도훈', number: 25 },
  { id: '26', name: '김유진', number: 26 },
  { id: '27', name: '이한별', number: 27 },
  { id: '28', name: '박승현', number: 28 }
];

export default function SurveyParticipationPage({ params }: { params: { id: string } }) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<{[key: string]: string[]}>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadSurvey();
  }, [params.id]);

  const loadSurvey = async () => {
    try {
      setLoading(true);
      
      // 더미 데이터
      const dummySurveys: Survey[] = [
        {
          id: '1',
          title: '6학년 1반 친구 관계 조사',
          description: '우리 반 친구들과의 관계를 알아보는 설문입니다. 솔직하게 답변해주세요!',
          targetClass: '6학년 1반',
          status: 'active',
          anonymous: true,
          totalQuestions: 3,
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

      const foundSurvey = dummySurveys.find(s => s.id === params.id);
      setSurvey(foundSurvey || null);

      // 초기 응답 객체 생성
      if (foundSurvey) {
        const initialResponses: {[key: string]: string[]} = {};
        foundSurvey.questions.forEach(q => {
          initialResponses[q.id] = [];
        });
        setResponses(initialResponses);
      }

    } catch (error) {
      console.error('Failed to load survey:', error);
      message.error('설문을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
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

  const handleStudentSelection = (questionId: string, studentId: string, checked: boolean) => {
    const currentSelections = responses[questionId] || [];
    const question = survey?.questions.find(q => q.id === questionId);
    
    if (checked) {
      if (currentSelections.length >= (question?.maxSelections || 1)) {
        message.warning(`최대 ${question?.maxSelections}명까지만 선택할 수 있습니다.`);
        return;
      }
      setResponses(prev => ({
        ...prev,
        [questionId]: [...currentSelections, studentId]
      }));
    } else {
      setResponses(prev => ({
        ...prev,
        [questionId]: currentSelections.filter(id => id !== studentId)
      }));
    }
  };

  const handleNext = () => {
    const currentQuestion = survey?.questions[currentStep];
    const currentSelections = responses[currentQuestion?.id || ''] || [];
    
    if (currentSelections.length === 0) {
      message.warning('적어도 1명은 선택해주세요.');
      return;
    }

    if (currentStep < (survey?.questions.length || 0) - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      // 실제 구현에서는 API로 전송
      console.log('📝 Survey responses:', {
        surveyId: params.id,
        responses: responses,
        timestamp: new Date().toISOString()
      });

      // 로컬 스토리지에 응답 저장 (시뮬레이션)
      const existingResponses = JSON.parse(localStorage.getItem(`survey_${params.id}_responses`) || '[]');
      const newResponse = {
        id: Date.now().toString(),
        responses: responses,
        submittedAt: new Date().toISOString()
      };
      
      localStorage.setItem(
        `survey_${params.id}_responses`, 
        JSON.stringify([...existingResponses, newResponse])
      );

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsComplete(true);
      message.success('설문 응답이 완료되었습니다!');
      
    } catch (error) {
      console.error('Survey submission failed:', error);
      message.error('설문 제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
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
      <div style={{ padding: '24px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <Empty
          description="설문을 찾을 수 없습니다."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  if (survey.status !== 'active') {
    return (
      <div style={{ padding: '24px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <Result
          status="warning"
          title="설문이 현재 진행중이 아닙니다"
          subTitle="설문이 아직 시작되지 않았거나 이미 종료되었습니다."
        />
      </div>
    );
  }

  if (isComplete) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <Result
          status="success"
          title="설문 완료!"
          subTitle="소중한 의견을 주셔서 감사합니다. 분석 결과는 선생님을 통해 공유될 예정입니다."
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        />
      </div>
    );
  }

  const currentQuestion = survey.questions[currentStep];
  const currentSelections = responses[currentQuestion?.id] || [];
  const stepItems = survey.questions.map((q, index) => ({
    title: `질문 ${index + 1}`,
    icon: index <= currentStep ? <CheckCircleOutlined /> : <UserOutlined />
  }));

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* 설문 소개 */}
      <Card style={{ marginBottom: '24px', textAlign: 'center' }}>
        <TeamOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
        <Title level={2}>{survey.title}</Title>
        <Paragraph type="secondary" style={{ fontSize: '16px' }}>
          {survey.description}
        </Paragraph>
        
        {survey.anonymous && (
          <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>
            🔒 익명 설문
          </Tag>
        )}
      </Card>

      {/* 진행 단계 */}
      <Steps 
        current={currentStep}
        items={stepItems}
        style={{ marginBottom: '32px' }}
        size="small"
      />

      {/* 현재 질문 */}
      <Card 
        title={
          <div>
            <div style={{ marginBottom: '8px' }}>
              {getQuestionTypeTag(currentQuestion.type)}
              <Text strong style={{ marginLeft: '8px', fontSize: '18px' }}>
                질문 {currentStep + 1}
              </Text>
            </div>
            <Title level={3} style={{ margin: 0 }}>
              {currentQuestion.title}
            </Title>
          </div>
        }
      >
        <Paragraph style={{ fontSize: '16px', marginBottom: '24px' }}>
          {currentQuestion.description}
        </Paragraph>
        
        <div style={{ 
          background: '#f8f9fa', 
          padding: '12px', 
          borderRadius: '6px', 
          marginBottom: '24px' 
        }}>
          <Text strong>선택 현황: </Text>
          <Text>{currentSelections.length} / {currentQuestion.maxSelections}명 선택됨</Text>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          {dummyStudents.map(student => (
            <Card
              key={student.id}
              size="small"
              hoverable
              style={{ 
                cursor: 'pointer',
                border: currentSelections.includes(student.id) 
                  ? '2px solid #1890ff' 
                  : '1px solid #d9d9d9',
                background: currentSelections.includes(student.id) 
                  ? '#e6f7ff' 
                  : 'white'
              }}
              onClick={() => handleStudentSelection(
                currentQuestion.id, 
                student.id, 
                !currentSelections.includes(student.id)
              )}
            >
              <div style={{ textAlign: 'center' }}>
                <Checkbox 
                  checked={currentSelections.includes(student.id)}
                  style={{ marginRight: '8px' }}
                />
                <Text strong>{student.number}번</Text>
                <div style={{ marginTop: '4px' }}>
                  <Text>{student.name}</Text>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Space size="middle">
            {currentStep > 0 && (
              <Button size="large" onClick={handleBack}>
                이전
              </Button>
            )}
            
            <Button
              type="primary"
              size="large"
              onClick={handleNext}
              loading={submitting}
              disabled={currentSelections.length === 0}
            >
              {currentStep === survey.questions.length - 1 ? '설문 완료' : '다음'}
            </Button>
          </Space>
        </div>
      </Card>

      {/* 진행률 표시 */}
      <div style={{ 
        marginTop: '16px', 
        textAlign: 'center',
        color: '#666'
      }}>
        <Text type="secondary">
          진행률: {currentStep + 1} / {survey.questions.length} 
          ({Math.round(((currentStep + 1) / survey.questions.length) * 100)}%)
        </Text>
      </div>
    </div>
  );
}