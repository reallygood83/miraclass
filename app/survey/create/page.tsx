'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Switch, 
  Space, 
  Typography, 
  Steps,
  message,
  Divider,
  Tag
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  SaveOutlined,
  ArrowLeftOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface SurveyQuestion {
  id: string;
  type: 'friend_selection' | 'collaboration' | 'trust' | 'conflict';
  title: string;
  description: string;
  maxSelections: number;
}

const defaultQuestions: SurveyQuestion[] = [
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
];

export default function CreateSurveyPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [questions, setQuestions] = useState<SurveyQuestion[]>(defaultQuestions);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const steps = [
    {
      title: '기본 정보',
      description: '설문 제목과 설명'
    },
    {
      title: '질문 설정',
      description: '관계 분석 질문들'
    },
    {
      title: '발행 설정',
      description: '대상과 기간'
    }
  ];

  const questionTypes = [
    { value: 'friend_selection', label: '친구 선택', color: '#52c41a' },
    { value: 'collaboration', label: '협력 관계', color: '#1890ff' },
    { value: 'trust', label: '신뢰 관계', color: '#722ed1' },
    { value: 'conflict', label: '갈등 관계', color: '#f5222d' }
  ];

  const addQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: Date.now().toString(),
      type: 'friend_selection',
      title: '',
      description: '',
      maxSelections: 3
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) {
      message.warning('최소 1개의 질문이 필요합니다.');
      return;
    }
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof SurveyQuestion, value: any) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const handleNext = async () => {
    try {
      const values = await form.validateFields();
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        await handleSubmit(values);
      }
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    
    try {
      const surveyData = {
        ...values,
        questions: questions,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      console.log('📝 Creating survey:', surveyData);

      // API 호출 (현재는 로컬 스토리지에 저장)
      const existingSurveys = JSON.parse(localStorage.getItem('surveys') || '[]');
      const newSurvey = {
        id: Date.now().toString(),
        ...surveyData
      };
      
      localStorage.setItem('surveys', JSON.stringify([...existingSurveys, newSurvey]));

      message.success('설문이 성공적으로 생성되었습니다!');
      
      setTimeout(() => {
        router.push('/surveys');
      }, 1000);
      
    } catch (error) {
      console.error('Survey creation failed:', error);
      message.error('설문 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInfo = () => (
    <Card title="설문 기본 정보">
      <Form.Item
        name="title"
        label="설문 제목"
        rules={[{ required: true, message: '설문 제목을 입력해주세요!' }]}
      >
        <Input placeholder="예: 6학년 1반 친구 관계 조사" size="large" />
      </Form.Item>

      <Form.Item
        name="description"
        label="설문 설명"
        rules={[{ required: true, message: '설문 설명을 입력해주세요!' }]}
      >
        <TextArea 
          rows={4} 
          placeholder="학생들에게 보여질 설문 목적과 참여 방법을 설명해주세요."
        />
      </Form.Item>

      <Form.Item
        name="anonymous"
        label="익명 설문 여부"
        valuePropName="checked"
        initialValue={true}
      >
        <Switch checkedChildren="익명" unCheckedChildren="실명" />
      </Form.Item>
    </Card>
  );

  const renderQuestions = () => (
    <Card 
      title="관계 분석 질문들"
      extra={
        <Button 
          type="dashed" 
          icon={<PlusOutlined />}
          onClick={addQuestion}
        >
          질문 추가
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {questions.map((question, index) => (
          <Card 
            key={question.id}
            size="small"
            title={`질문 ${index + 1}`}
            extra={
              questions.length > 1 && (
                <Button 
                  type="text" 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeQuestion(question.id)}
                />
              )
            }
          >
            <Form.Item label="질문 유형">
              <Select
                value={question.type}
                onChange={(value) => updateQuestion(question.id, 'type', value)}
                style={{ width: '100%' }}
              >
                {questionTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    <Tag color={type.color}>{type.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="질문 제목">
              <Input
                value={question.title}
                onChange={(e) => updateQuestion(question.id, 'title', e.target.value)}
                placeholder="예: 가장 친한 친구 3명을 선택해주세요"
              />
            </Form.Item>

            <Form.Item label="질문 설명">
              <TextArea
                rows={2}
                value={question.description}
                onChange={(e) => updateQuestion(question.id, 'description', e.target.value)}
                placeholder="학생들이 이해할 수 있도록 질문에 대한 설명을 작성해주세요"
              />
            </Form.Item>

            <Form.Item label="최대 선택 가능 수">
              <Select
                value={question.maxSelections}
                onChange={(value) => updateQuestion(question.id, 'maxSelections', value)}
                style={{ width: 200 }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <Option key={num} value={num}>{num}명</Option>
                ))}
              </Select>
            </Form.Item>
          </Card>
        ))}
      </Space>
    </Card>
  );

  const renderPublishSettings = () => (
    <Card title="발행 설정">
      <Form.Item
        name="targetClass"
        label="대상 클래스"
        rules={[{ required: true, message: '대상 클래스를 선택해주세요!' }]}
        initialValue="6학년 1반"
      >
        <Select placeholder="클래스를 선택해주세요">
          <Option value="6학년 1반">6학년 1반</Option>
          <Option value="6학년 2반">6학년 2반</Option>
          <Option value="6학년 3반">6학년 3반</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="duration"
        label="설문 기간"
        rules={[{ required: true, message: '설문 기간을 선택해주세요!' }]}
        initialValue={7}
      >
        <Select placeholder="설문 진행 기간">
          <Option value={1}>1일</Option>
          <Option value={3}>3일</Option>
          <Option value={7}>1주일</Option>
          <Option value={14}>2주일</Option>
          <Option value={30}>1개월</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="autoAnalysis"
        label="자동 분석 실행"
        valuePropName="checked"
        initialValue={true}
      >
        <Switch checkedChildren="ON" unCheckedChildren="OFF" />
      </Form.Item>

      <Form.Item
        name="notifyResults"
        label="결과 알림"
        valuePropName="checked"
        initialValue={true}
      >
        <Switch checkedChildren="ON" unCheckedChildren="OFF" />
      </Form.Item>
    </Card>
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Button 
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/dashboard')}
          style={{ marginBottom: '16px' }}
        >
          대시보드로 돌아가기
        </Button>
        
        <Title level={2}>새 관계 설문 만들기</Title>
        <Text type="secondary">
          학생들의 관계를 분석하기 위한 설문을 생성합니다. 
          생성된 설문은 학생들이 익명으로 응답할 수 있습니다.
        </Text>
      </div>

      <Steps 
        current={currentStep}
        items={steps}
        style={{ marginBottom: '32px' }}
      />

      <Form
        form={form}
        layout="vertical"
        size="large"
      >
        {currentStep === 0 && renderBasicInfo()}
        {currentStep === 1 && renderQuestions()}
        {currentStep === 2 && renderPublishSettings()}
      </Form>

      <Divider />

      <div style={{ textAlign: 'center' }}>
        <Space size="middle">
          {currentStep > 0 && (
            <Button 
              size="large"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              이전
            </Button>
          )}
          
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleNext}
            icon={currentStep === steps.length - 1 ? <SaveOutlined /> : undefined}
          >
            {currentStep === steps.length - 1 ? '설문 생성하기' : '다음'}
          </Button>
        </Space>
      </div>
    </div>
  );
}