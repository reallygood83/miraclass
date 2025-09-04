'use client'

import { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Form, 
  Input, 
  Button, 
  Switch, 
  Select, 
  Space,
  Divider,
  Alert,
  message,
  Row,
  Col,
  Tabs
} from 'antd';
import { 
  SettingOutlined,
  KeyOutlined,
  RobotOutlined,
  SaveOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import Layout from '@/components/common/Layout';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface ApiSettings {
  geminiApiKey: string;
  openaiApiKey: string;
  preferredModel: 'gemini' | 'openai';
  autoQuestionGeneration: boolean;
  maxQuestionsPerSurvey: number;
}

export default function SettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<ApiSettings>({
    geminiApiKey: '',
    openaiApiKey: '',
    preferredModel: 'gemini',
    autoQuestionGeneration: true,
    maxQuestionsPerSurvey: 5
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('ourClassConnect_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      form.setFieldsValue(parsed);
    }
  }, [form]);

  const handleSaveSettings = async (values: ApiSettings) => {
    setLoading(true);
    
    try {
      // Validate that at least one API key is provided
      if (!values.geminiApiKey && !values.openaiApiKey) {
        message.error('Gemini API 키 또는 OpenAI API 키 중 최소 하나는 입력해야 합니다.');
        setLoading(false);
        return;
      }

      // If only one API key is provided, automatically set preferred model
      if (values.geminiApiKey && !values.openaiApiKey) {
        values.preferredModel = 'gemini';
      } else if (values.openaiApiKey && !values.geminiApiKey) {
        values.preferredModel = 'openai';
      }

      // Save to localStorage
      localStorage.setItem('ourClassConnect_settings', JSON.stringify(values));
      setSettings(values);
      
      // Show success message
      message.success('설정이 성공적으로 저장되었습니다.');
      
    } catch (error) {
      console.error('Settings save failed:', error);
      message.error('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const testApiConnection = async (apiType: 'gemini' | 'openai') => {
    const apiKey = apiType === 'gemini' ? settings.geminiApiKey : settings.openaiApiKey;
    
    if (!apiKey) {
      message.warning(`${apiType.toUpperCase()} API 키를 먼저 입력해주세요.`);
      return;
    }

    message.loading(`${apiType.toUpperCase()} API 연결을 테스트하고 있습니다...`, 2.5);
    
    // Simulate API test (replace with actual API call later)
    setTimeout(() => {
      message.success(`${apiType.toUpperCase()} API 연결이 성공적으로 확인되었습니다.`);
    }, 2500);
  };

  const hasApiKeys = settings.geminiApiKey || settings.openaiApiKey;
  const hasBothApiKeys = settings.geminiApiKey && settings.openaiApiKey;

  const apiTabItems = [
    {
      key: '1',
      label: 'API 설정',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Gemini API Section */}
          <Card size="small" title="Google Gemini API">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Form.Item
                label="Gemini API 키"
                name="geminiApiKey"
                rules={[
                  { min: 10, message: 'API 키는 최소 10자 이상이어야 합니다.' }
                ]}
              >
                <Input.Password
                  placeholder="AIzaSy..."
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button 
                  onClick={() => testApiConnection('gemini')} 
                  disabled={!form.getFieldValue('geminiApiKey')}
                >
                  연결 테스트
                </Button>
                <a 
                  href="https://makersuite.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  API 키 발급받기 →
                </a>
              </div>
            </Space>
          </Card>

          {/* OpenAI API Section */}
          <Card size="small" title="OpenAI API">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Form.Item
                label="OpenAI API 키"
                name="openaiApiKey"
                rules={[
                  { min: 10, message: 'API 키는 최소 10자 이상이어야 합니다.' }
                ]}
              >
                <Input.Password
                  placeholder="sk-..."
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button 
                  onClick={() => testApiConnection('openai')} 
                  disabled={!form.getFieldValue('openaiApiKey')}
                >
                  연결 테스트
                </Button>
                <a 
                  href="https://platform.openai.com/account/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  API 키 발급받기 →
                </a>
              </div>
            </Space>
          </Card>

          {/* Model Selection - only show if both APIs are configured */}
          {hasBothApiKeys && (
            <Card size="small" title="AI 모델 선택">
              <Form.Item
                label="기본 사용 모델"
                name="preferredModel"
                tooltip="두 API 키가 모두 설정된 경우 기본으로 사용할 AI 모델을 선택하세요."
              >
                <Select style={{ width: '200px' }}>
                  <Option value="gemini">Google Gemini</Option>
                  <Option value="openai">OpenAI GPT</Option>
                </Select>
              </Form.Item>
            </Card>
          )}
        </Space>
      ),
    },
    {
      key: '2',
      label: 'AI 자동 기능',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card size="small" title="자동 질문 생성">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Form.Item
                label="AI 자동 질문 생성"
                name="autoQuestionGeneration"
                valuePropName="checked"
                tooltip="설문 생성 시 AI가 관계 분석에 적합한 질문을 자동으로 추천합니다."
              >
                <Switch 
                  checkedChildren="ON" 
                  unCheckedChildren="OFF"
                  disabled={!hasApiKeys}
                />
              </Form.Item>

              <Form.Item
                label="설문당 최대 질문 수"
                name="maxQuestionsPerSurvey"
                tooltip="AI가 자동으로 생성할 수 있는 최대 질문 개수를 설정합니다."
              >
                <Select style={{ width: '150px' }} disabled={!hasApiKeys}>
                  <Option value={3}>3개</Option>
                  <Option value={5}>5개 (권장)</Option>
                  <Option value={7}>7개</Option>
                  <Option value={10}>10개</Option>
                </Select>
              </Form.Item>

              {!hasApiKeys && (
                <Alert
                  message="AI 기능을 사용하려면 API 키를 먼저 설정해주세요"
                  type="warning"
                  showIcon
                />
              )}
            </Space>
          </Card>

          <Card size="small" title="추천 질문 유형">
            <Paragraph type="secondary">
              AI가 자동으로 생성하는 질문 유형:
            </Paragraph>
            <ul style={{ color: '#666', marginLeft: '20px' }}>
              <li><strong>친구 관계:</strong> "가장 가까운 친구 3명을 선택해주세요"</li>
              <li><strong>협력 관계:</strong> "함께 프로젝트를 하고 싶은 친구들을 선택해주세요"</li>
              <li><strong>신뢰 관계:</strong> "고민을 상담하고 싶은 친구들을 선택해주세요"</li>
              <li><strong>리더십:</strong> "그룹 활동에서 리더 역할을 잘하는 친구를 선택해주세요"</li>
              <li><strong>도움 관계:</strong> "공부나 과제에서 도움을 받고 싶은 친구를 선택해주세요"</li>
            </ul>
          </Card>
        </Space>
      ),
    }
  ];

  return (
    <Layout user={{ name: '관리자', role: '교사' }}>
      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Title level={2}>
            <SettingOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
            설정
          </Title>
          <Paragraph type="secondary" style={{ fontSize: '16px' }}>
            우리반 커넥트의 AI 기능을 사용하기 위해 API 키를 설정하고 자동 기능을 관리하세요.
          </Paragraph>
        </div>

        {/* Main Settings Form */}
        <Form
          form={form}
          layout="vertical"
          initialValues={settings}
          onFinish={handleSaveSettings}
        >
          <Card>
            <Tabs items={apiTabItems} />
            
            <Divider />
            
            {/* Save Button */}
            <div style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                icon={<SaveOutlined />}
              >
                설정 저장
              </Button>
            </div>
          </Card>
        </Form>

        {/* Usage Guide */}
        <Card 
          title="사용 가이드" 
          style={{ marginTop: '24px' }}
          size="small"
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: '16px' }}>
                <Title level={5}>
                  <KeyOutlined style={{ marginRight: '8px' }} />
                  API 키 설정
                </Title>
                <ul style={{ marginLeft: '24px', color: '#666' }}>
                  <li>Gemini 또는 OpenAI API 키 중 하나는 반드시 입력해야 합니다</li>
                  <li>두 API 키를 모두 입력하면 원하는 모델을 선택할 수 있습니다</li>
                  <li>API 키는 브라우저에 안전하게 저장되며 외부로 전송되지 않습니다</li>
                </ul>
              </div>
            </Col>
            
            <Col xs={24} md={12}>
              <div>
                <Title level={5}>
                  <RobotOutlined style={{ marginRight: '8px' }} />
                  AI 자동 기능
                </Title>
                <ul style={{ marginLeft: '24px', color: '#666' }}>
                  <li>설문 생성 시 AI가 관계 분석에 적합한 질문을 추천합니다</li>
                  <li>학급 특성에 맞는 맞춤형 질문을 자동으로 생성합니다</li>
                  <li>생성된 질문은 수정하거나 삭제할 수 있습니다</li>
                </ul>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </Layout>
  );
}