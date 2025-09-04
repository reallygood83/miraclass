'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Space,
  Table,
  Tag,
  Avatar,
  List,
  Progress,
  Tabs,
  message,
  Modal,
  Form,
  Input
} from 'antd';
import { 
  ArrowLeftOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import Layout from '@/components/common/Layout';

const { Title, Text } = Typography;

interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
}

interface Student {
  id: string;
  name: string;
  student_number: number;
  connections: number;
  risk_level: 'high' | 'medium' | 'low';
  last_survey: string;
  status: 'active' | 'inactive';
}

interface Class {
  id: string;
  name: string;
  grade: number;
  class_number: number;
  teacher_name: string;
  student_count: number;
  total_surveys: number;
  active_surveys: number;
  last_analysis: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export default function ClassDetailPage() {
  const [user, setUser] = useState<User | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAddStudentModalVisible, setIsAddStudentModalVisible] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) {
      return;
    }

    if (authChecked) {
      return;
    }

    const dummyUser: User = {
      id: '1',
      name: '김선생',
      email: 'teacher@test.com',
      role: 'teacher'
    };

    setUser(dummyUser);
    setAuthChecked(true);
    loadClassData();
  }, [isClient, authChecked, router, classId]);

  const loadClassData = async () => {
    setLoading(true);
    try {
      // 더미 학급 데이터
      const dummyClass: Class = {
        id: classId,
        name: '6학년 1반',
        grade: 6,
        class_number: 1,
        teacher_name: '김선생',
        student_count: 28,
        total_surveys: 3,
        active_surveys: 1,
        last_analysis: '2시간 전',
        status: 'active',
        created_at: '2025-01-15'
      };

      // 더미 학생 데이터
      const dummyStudents: Student[] = [
        {
          id: '1', name: '김민수', student_number: 1, connections: 8, 
          risk_level: 'low', last_survey: '1일 전', status: 'active'
        },
        {
          id: '2', name: '이서연', student_number: 2, connections: 6, 
          risk_level: 'medium', last_survey: '1일 전', status: 'active'
        },
        {
          id: '3', name: '박지원', student_number: 3, connections: 12, 
          risk_level: 'low', last_survey: '1일 전', status: 'active'
        },
        {
          id: '4', name: '정현우', student_number: 4, connections: 4, 
          risk_level: 'medium', last_survey: '2일 전', status: 'active'
        },
        {
          id: '5', name: '이채원', student_number: 5, connections: 1, 
          risk_level: 'high', last_survey: '3일 전', status: 'active'
        },
      ];

      setClassData(dummyClass);
      setStudents(dummyStudents);
    } catch (error) {
      console.error('Failed to load class data:', error);
      message.error('학급 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    try {
      const values = await form.validateFields();
      
      const newStudent: Student = {
        id: Date.now().toString(),
        name: values.name,
        student_number: values.student_number,
        connections: 0,
        risk_level: 'low',
        last_survey: '아직 없음',
        status: 'active'
      };

      setStudents([...students, newStudent]);
      setIsAddStudentModalVisible(false);
      form.resetFields();
      message.success('학생이 추가되었습니다.');
    } catch (error) {
      console.error('Failed to add student:', error);
    }
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

  const studentColumns = [
    {
      title: '학생명',
      key: 'student_info',
      render: (_: any, record: Student) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar icon={<UserOutlined />} style={{ marginRight: '8px' }} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.student_number}번
            </Text>
          </div>
        </div>
      )
    },
    {
      title: '연결 수',
      dataIndex: 'connections',
      key: 'connections',
      render: (connections: number) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{connections}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>개</Text>
        </div>
      )
    },
    {
      title: '위험도',
      dataIndex: 'risk_level',
      key: 'risk_level',
      render: (riskLevel: string) => getRiskLevelTag(riskLevel)
    },
    {
      title: '최근 설문',
      dataIndex: 'last_survey',
      key: 'last_survey',
      render: (text: string) => (
        <Text type={text === '아직 없음' ? 'secondary' : 'default'}>
          {text}
        </Text>
      )
    },
    {
      title: '작업',
      key: 'actions',
      render: (_: any, record: Student) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<ShareAltOutlined />}
            onClick={() => router.push(`/network?student=${record.id}`)}
          >
            네트워크
          </Button>
          <Button 
            type="text" 
            icon={<EditOutlined />}
            onClick={() => message.info('학생 편집 기능 준비 중입니다.')}
          />
          <Button 
            type="text" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => message.info('학생 삭제 기능 준비 중입니다.')}
          />
        </Space>
      )
    }
  ];

  if (!isClient || !authChecked || loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', color: '#666', marginBottom: '16px' }}>
            📚 학급 정보 로딩 중...
          </div>
        </div>
      </div>
    );
  }

  if (!user || !classData) {
    return null;
  }

  const riskStats = students.reduce(
    (acc, student) => {
      acc[student.risk_level]++;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );

  const tabItems = [
    {
      key: '1',
      label: '학생 목록',
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Text>총 {students.length}명의 학생</Text>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setIsAddStudentModalVisible(true)}
            >
              학생 추가
            </Button>
          </div>
          
          <Table
            columns={studentColumns}
            dataSource={students}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true
            }}
          />
        </div>
      )
    },
    {
      key: '2',
      label: '분석 결과',
      children: (
        <div>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card title="위험도별 분포">
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>높음</span>
                    <span style={{ color: '#f5222d', fontWeight: 'bold' }}>{riskStats.high}명</span>
                  </div>
                  <Progress 
                    percent={(riskStats.high / students.length) * 100} 
                    strokeColor="#f5222d"
                    showInfo={false}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>보통</span>
                    <span style={{ color: '#faad14', fontWeight: 'bold' }}>{riskStats.medium}명</span>
                  </div>
                  <Progress 
                    percent={(riskStats.medium / students.length) * 100} 
                    strokeColor="#faad14"
                    showInfo={false}
                  />
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>낮음</span>
                    <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{riskStats.low}명</span>
                  </div>
                  <Progress 
                    percent={(riskStats.low / students.length) * 100} 
                    strokeColor="#52c41a"
                    showInfo={false}
                  />
                </div>
              </Card>
            </Col>
            
            <Col span={16}>
              <Card title="주의 대상 학생">
                <List
                  dataSource={students.filter(s => s.risk_level === 'high' || s.risk_level === 'medium')}
                  renderItem={(student) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} />}
                        title={
                          <Space>
                            <span>{student.name}</span>
                            {getRiskLevelTag(student.risk_level)}
                          </Space>
                        }
                        description={`연결 수: ${student.connections}개 | 최근 설문: ${student.last_survey}`}
                      />
                      <Button 
                        type="link" 
                        onClick={() => router.push(`/network?student=${student.id}`)}
                      >
                        관계 분석
                      </Button>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </div>
      )
    }
  ];

  return (
    <Layout user={{ name: user.name, role: user.role }}>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/classes')}
              style={{ marginRight: '16px' }}
            >
              학급 목록으로
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              <TeamOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              {classData.name}
            </Title>
          </div>
          
          <Space>
            <Button 
              type="primary" 
              icon={<BookOutlined />}
              onClick={() => router.push(`/surveys?class=${classId}`)}
            >
              설문 만들기
            </Button>
            <Button 
              icon={<ShareAltOutlined />}
              onClick={() => router.push(`/network?class=${classId}`)}
            >
              관계 네트워크
            </Button>
            <Button 
              icon={<BarChartOutlined />}
              onClick={() => router.push(`/analytics?class=${classId}`)}
            >
              AI 분석
            </Button>
          </Space>
        </div>

        {/* 통계 카드 */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="총 학생 수"
                value={students.length}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
                suffix="명"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="소외 위험군"
                value={riskStats.high}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#f5222d' }}
                suffix="명"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="총 설문 수"
                value={classData.total_surveys}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#52c41a' }}
                suffix="회"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="진행중인 설문"
                value={classData.active_surveys}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#fa8c16' }}
                suffix="회"
              />
            </Card>
          </Col>
        </Row>

        {/* 탭 컨텐츠 */}
        <Card>
          <Tabs items={tabItems} />
        </Card>

        {/* 학생 추가 모달 */}
        <Modal
          title="학생 추가"
          open={isAddStudentModalVisible}
          onOk={handleAddStudent}
          onCancel={() => {
            setIsAddStudentModalVisible(false);
            form.resetFields();
          }}
          width={400}
        >
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="name"
              label="학생 이름"
              rules={[{ required: true, message: '학생 이름을 입력해주세요!' }]}
            >
              <Input placeholder="학생 이름" />
            </Form.Item>

            <Form.Item
              name="student_number"
              label="출석 번호"
              rules={[{ required: true, message: '출석 번호를 입력해주세요!' }]}
            >
              <Input type="number" placeholder="출석 번호" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
}