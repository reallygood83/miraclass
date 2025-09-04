'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  Form, 
  Button, 
  Typography, 
  Progress,
  message,
  Steps,
  Select,
  Space,
  Tag,
  Modal
} from 'antd';
import { 
  UserOutlined,
  HeartOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface Student {
  id: string;
  name: string;
  number: number;
  gender: 'M' | 'F';
}

interface SurveyQuestion {
  id: string;
  type: 'friend_selection' | 'collaboration' | 'trust' | 'conflict';
  title: string;
  description: string;
  maxSelections: number;
}

interface Survey {
  id: string;
  title: string;
  description: string;
  targetClass: string;
  questions: SurveyQuestion[];
  status: string;
  anonymous: boolean;
}

interface QuestionResponse {
  questionId: string;
  selectedStudents: string[];
}

export default function SurveyResponsePage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.surveyId as string;
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentInfo, setStudentInfo] = useState<{ name: string; number: number } | null>(null);
  const [form] = Form.useForm();

  // 더미 학생 데이터 생성
  const generateDummyStudents = (): Student[] => {
    const maleNames = ['김민수', '이준호', '박대현', '최태민', '정현우', '장민재', '윤성호', '임도현', '한지훈', '강민석'];
    const femaleNames = ['이지은', '박수영', '최서연', '정하늘', '김소희', '윤예린', '한유진', '장서영', '임채원', '강지민'];
    
    const students: Student[] = [];
    
    // 남학생 14명
    for (let i = 0; i < 14; i++) {
      students.push({
        id: `male_${i + 1}`,
        name: maleNames[i % maleNames.length] + (Math.floor(i / maleNames.length) > 0 ? (Math.floor(i / maleNames.length) + 1) : ''),
        number: i + 1,
        gender: 'M'
      });
    }
    
    // 여학생 14명
    for (let i = 0; i < 14; i++) {
      students.push({
        id: `female_${i + 1}`,
        name: femaleNames[i % femaleNames.length] + (Math.floor(i / femaleNames.length) > 0 ? (Math.floor(i / femaleNames.length) + 1) : ''),
        number: i + 15,
        gender: 'F'
      });
    }
    
    return students.sort((a, b) => a.number - b.number);
  };

  useEffect(() => {
    loadSurvey();
    setStudents(generateDummyStudents());
  }, [surveyId]);

  const loadSurvey = async () => {
    setLoading(true);
    try {
      // 실제 API 호출 대신 로컬스토리지에서 데이터 로드
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
          anonymous: true,
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
      const currentSurvey = allSurveys.find(s => s.id === surveyId);
      
      if (!currentSurvey) {
        message.error('설문을 찾을 수 없습니다.');
        router.push('/');
        return;
      }

      if (currentSurvey.status !== 'active') {
        message.error('현재 진행중이지 않은 설문입니다.');
        router.push('/');
        return;
      }

      setSurvey(currentSurvey);
      
      // 응답 배열 초기화
      const initialResponses: QuestionResponse[] = currentSurvey.questions.map((q: SurveyQuestion) => ({
        questionId: q.id,
        selectedStudents: []
      }));
      setResponses(initialResponses);

    } catch (error) {
      console.error('Failed to load survey:', error);
      message.error('설문을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getQuestionTypeInfo = (type: string) => {
    const typeMap = {
      friend_selection: { color: '#52c41a', text: '친구 관계', icon: <HeartOutlined /> },
      collaboration: { color: '#1890ff', text: '협력 관계', icon: <TeamOutlined /> },
      trust: { color: '#722ed1', text: '신뢰 관계', icon: <UserOutlined /> },
      conflict: { color: '#f5222d', text: '갈등 관계', icon: <UserOutlined /> }
    };
    
    return typeMap[type as keyof typeof typeMap] || typeMap.friend_selection;
  };

  const handleStudentInfoSubmit = (values: { name: string; number: number }) => {
    setStudentInfo(values);
    setCurrentStep(1);
  };

  const handleResponseChange = (questionId: string, selectedValues: string[]) => {
    const updatedResponses = responses.map(response => 
      response.questionId === questionId 
        ? { ...response, selectedStudents: selectedValues }
        : response
    );
    setResponses(updatedResponses);
  };

  const validateCurrentQuestion = () => {
    if (currentStep === 0) return true;
    
    const currentQuestion = survey?.questions[currentStep - 1];
    if (!currentQuestion) return false;
    
    const currentResponse = responses.find(r => r.questionId === currentQuestion.id);
    return currentResponse && currentResponse.selectedStudents.length > 0;
  };

  const handleNext = () => {
    if (!validateCurrentQuestion()) {
      message.warning('질문에 답변해주세요.');
      return;
    }
    
    if (currentStep < (survey?.questions.length || 0)) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!survey || !studentInfo) return;
    
    setSubmitting(true);
    try {
      // 응답 데이터 준비
      const responseData = {
        surveyId: survey.id,
        studentInfo: survey.anonymous ? null : studentInfo,
        responses: responses,
        submittedAt: new Date().toISOString()
      };

      console.log('📋 Submitting survey response:', responseData);

      // 로컬스토리지에 응답 저장
      const existingResponses = JSON.parse(localStorage.getItem('survey_responses') || '[]');
      const newResponse = {
        id: Date.now().toString(),
        ...responseData
      };
      
      localStorage.setItem('survey_responses', JSON.stringify([...existingResponses, newResponse]));

      message.success('설문 응답이 완료되었습니다!');
      
      // 완료 단계로 이동
      setCurrentStep((survey.questions.length || 0) + 1);
      
    } catch (error) {
      console.error('Survey submission failed:', error);
      message.error('응답 제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStudentInfo = () => (
    <Card title="참여자 정보">
      <Paragraph>
        설문에 참여하기 위해 본인의 정보를 입력해주세요.
        {survey?.anonymous && " (응답은 익명으로 처리됩니다)"}
      </Paragraph>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleStudentInfoSubmit}
        size="large"
      >
        <Form.Item
          name="name"
          label="이름"
          rules={[{ required: true, message: '이름을 입력해주세요!' }]}
        >
          <Select
            placeholder="이름을 선택하거나 입력하세요"
            showSearch
            optionFilterProp="children"
          >
            {students.map(student => (
              <Option key={student.id} value={student.name}>
                {student.number}번 {student.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="number"
          label="번호"
          rules={[{ required: true, message: '번호를 선택해주세요!' }]}
        >
          <Select placeholder="번호를 선택하세요">
            {students.map(student => (
              <Option key={student.id} value={student.number}>
                {student.number}번
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" size="large" block>
            설문 시작하기
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const renderQuestion = (questionIndex: number) => {
    if (!survey) return null;
    
    const question = survey.questions[questionIndex];
    const typeInfo = getQuestionTypeInfo(question.type);
    const currentResponse = responses.find(r => r.questionId === question.id);
    
    // 본인 제외한 학생 목록
    const availableStudents = students.filter(s => 
      !studentInfo || s.name !== studentInfo.name
    );

    return (
      <Card 
        title={
          <Space>
            {typeInfo.icon}
            <Tag color={typeInfo.color}>{typeInfo.text}</Tag>
            질문 {questionIndex + 1}/{survey.questions.length}
          </Space>
        }
      >
        <div style={{ marginBottom: '24px' }}>
          <Title level={4}>{question.title}</Title>
          <Paragraph type="secondary">
            {question.description}
          </Paragraph>
          <Text strong>
            최대 {question.maxSelections}명까지 선택 가능합니다.
          </Text>
        </div>

        <Select
          mode="multiple"
          placeholder="친구들을 선택해주세요"
          style={{ width: '100%', minHeight: '120px' }}
          value={currentResponse?.selectedStudents || []}
          onChange={(values) => handleResponseChange(question.id, values)}
          maxCount={question.maxSelections}
          showSearch
          optionFilterProp="children"
          size="large"
        >
          {availableStudents.map(student => (
            <Option key={student.id} value={student.id}>
              <Space>
                <Tag color={student.gender === 'M' ? 'blue' : 'pink'}>
                  {student.number}번
                </Tag>
                {student.name}
              </Space>
            </Option>
          ))}
        </Select>

        <div style={{ marginTop: '16px' }}>
          <Text type="secondary">
            선택된 친구: {currentResponse?.selectedStudents.length || 0}/{question.maxSelections}명
          </Text>
        </div>
      </Card>
    );
  };

  const renderComplete = () => (
    <Card>
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <CheckCircleOutlined 
          style={{ fontSize: '64px', color: '#52c41a', marginBottom: '24px' }} 
        />
        <Title level={2}>응답 완료!</Title>
        <Paragraph>
          설문에 참여해주셔서 감사합니다.<br/>
          여러분의 응답은 우리 반의 관계를 더 잘 이해하는데 도움이 될 것입니다.
        </Paragraph>
        <Button 
          type="primary" 
          size="large"
          onClick={() => router.push('/dashboard')}
        >
          메인으로 돌아가기
        </Button>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Title level={3}>설문 로딩 중...</Title>
      </div>
    );
  }

  if (!survey) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Title level={3}>설문을 찾을 수 없습니다</Title>
        <Button onClick={() => router.push('/')}>홈으로 돌아가기</Button>
      </div>
    );
  }

  const totalSteps = survey.questions.length + 2; // 정보입력 + 질문들 + 완료
  const progress = Math.round((currentStep / totalSteps) * 100);

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <Button 
          icon={<ArrowLeftOutlined />}
          onClick={() => window.history.back()}
          style={{ marginBottom: '16px' }}
        >
          뒤로가기
        </Button>
        
        <Title level={2}>{survey.title}</Title>
        <Paragraph type="secondary">
          {survey.description}
        </Paragraph>
        
        <div style={{ marginTop: '16px' }}>
          <Text>진행률: {progress}%</Text>
          <Progress percent={progress} showInfo={false} style={{ marginTop: '8px' }} />
        </div>
      </div>

      {/* 단계별 내용 */}
      {currentStep === 0 && renderStudentInfo()}
      {currentStep > 0 && currentStep <= survey.questions.length && renderQuestion(currentStep - 1)}
      {currentStep > survey.questions.length && renderComplete()}

      {/* 네비게이션 버튼 */}
      {currentStep > 0 && currentStep <= survey.questions.length && (
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Space size="middle">
            {currentStep > 1 && (
              <Button 
                size="large"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                <ArrowLeftOutlined /> 이전
              </Button>
            )}
            
            <Button
              type="primary"
              size="large"
              loading={submitting}
              onClick={handleNext}
            >
              {currentStep === survey.questions.length ? '응답 완료' : '다음'}
              {currentStep < survey.questions.length && <ArrowRightOutlined />}
            </Button>
          </Space>
        </div>
      )}
    </div>
  );
}