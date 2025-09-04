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
  Input,
  InputNumber,
  Spin
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
import { supabase } from '@/lib/supabase';

const { Title, Text } = Typography;

interface LocalUser {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  school_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface LocalStudent {
  id: string;
  name: string;
  student_number: number;
  class_id: string;
  connections: number;
  risk_level: 'high' | 'medium' | 'low';
  last_survey: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface LocalClass {
  id: string;
  name: string;
  grade: number;
  class_number: number;
  teacher_id: string;
  teacher_name: string;
  student_count: number;
  total_surveys: number;
  active_surveys: number;
  last_analysis: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export default function ClassDetailPage() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [classData, setClassData] = useState<LocalClass | null>(null);
  const [students, setStudents] = useState<LocalStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAddStudentModalVisible, setIsAddStudentModalVisible] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
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

    initializeUserAndClass();
  }, [isClient, authChecked, router, classId]);

  const initializeUserAndClass = async () => {
    try {
      // Supabase 연결 테스트
      const { data: testData, error: testError } = await supabase.from('users').select('count').limit(1);
      
      if (!testError) {
        setIsSupabaseConnected(true);
        // 실제 사용자 조회
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', 'teacher@test.com')
          .single();
        
        if (userData && !userError) {
          setUser(userData);
        } else {
          // 더미 사용자
          const dummyUser: LocalUser = {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: '김선생',
            email: 'teacher@test.com',
            role: 'teacher',
            school_name: '안양 박달초등학교',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setUser(dummyUser);
        }
        
        await loadClassData();
      } else {
        // Supabase 연결 실패 시 더미 모드
        console.warn('Supabase 연결 실패, 더미 데이터 모드:', testError);
        setIsSupabaseConnected(false);
        const dummyUser: LocalUser = {
          id: '1',
          name: '김선생',
          email: 'teacher@test.com',
          role: 'teacher',
          school_name: '안양 박달초등학교',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUser(dummyUser);
        loadDummyClassData();
      }
    } catch (error) {
      console.error('초기화 오류:', error);
      message.error('시스템 초기화 중 오류가 발생했습니다.');
    } finally {
      setAuthChecked(true);
      setLoading(false);
    }
  };

  const loadClassData = async () => {
    setLoading(true);
    try {
      if (isSupabaseConnected) {
        // Supabase에서 학급 데이터 로드
        const { data: classResult, error: classError } = await supabase
          .from('classes')
          .select('*')
          .eq('id', classId)
          .single();
        
        if (classError) {
          console.error('Supabase 학급 데이터 로드 오류:', classError);
          message.error('학급 정보를 불러오는데 실패했습니다.');
          loadDummyClassData();
        } else {
          setClassData(classResult);
          
          // 학생 데이터 로드
          const { data: studentsResult, error: studentsError } = await supabase
            .from('students')
            .select('*')
            .eq('class_id', classId)
            .order('student_number', { ascending: true });
          
          if (studentsError) {
            console.error('실제 학생 데이터 로드 오류:', studentsError);
            // 학급이 있으면 빈 학생 배열로 시작
            setStudents([]);
          } else {
            setStudents(studentsResult || []);
          }
          
          message.success('학급 데이터를 불러왔습니다.');
        }
      } else {
        loadDummyClassData();
      }
    } catch (error) {
      console.error('학급 데이터 로드 오류:', error);
      message.error('학급 정보를 불러오는데 실패했습니다.');
      loadDummyClassData();
    } finally {
      setLoading(false);
    }
  };

  const loadDummyClassData = () => {
    const dummyClass: LocalClass = {
      id: classId,
      name: '6학년 1반',
      grade: 6,
      class_number: 1,
      teacher_id: '1',
      teacher_name: '김선생',
      student_count: 5,
      total_surveys: 3,
      active_surveys: 1,
      last_analysis: '2시간 전',
      status: 'active',
      created_at: '2025-01-15T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z'
    };

    const dummyStudents: LocalStudent[] = [
      {
        id: '1', name: '김민수', student_number: 1, class_id: classId,
        connections: 8, risk_level: 'low', last_survey: '1일 전', 
        status: 'active', created_at: '2025-01-15T00:00:00Z', updated_at: '2025-01-15T00:00:00Z'
      },
      {
        id: '2', name: '이서연', student_number: 2, class_id: classId,
        connections: 6, risk_level: 'medium', last_survey: '1일 전',
        status: 'active', created_at: '2025-01-15T00:00:00Z', updated_at: '2025-01-15T00:00:00Z'
      },
      {
        id: '3', name: '박지원', student_number: 3, class_id: classId,
        connections: 12, risk_level: 'low', last_survey: '1일 전',
        status: 'active', created_at: '2025-01-15T00:00:00Z', updated_at: '2025-01-15T00:00:00Z'
      },
      {
        id: '4', name: '정현우', student_number: 4, class_id: classId,
        connections: 4, risk_level: 'medium', last_survey: '2일 전',
        status: 'active', created_at: '2025-01-15T00:00:00Z', updated_at: '2025-01-15T00:00:00Z'
      },
      {
        id: '5', name: '이채원', student_number: 5, class_id: classId,
        connections: 1, risk_level: 'high', last_survey: '3일 전',
        status: 'active', created_at: '2025-01-15T00:00:00Z', updated_at: '2025-01-15T00:00:00Z'
      }
    ];

    setClassData(dummyClass);
    setStudents(dummyStudents);
  };

  const handleAddStudent = async () => {
    try {
      const values = await form.validateFields();
      
      if (!classData) {
        message.error('학급 정보가 없습니다.');
        return;
      }
      
      const newStudentData = {
        name: values.name,
        student_number: values.student_number,
        class_id: classData.id,
        connections: 0,
        risk_level: 'low' as const,
        last_survey: null,
        status: 'active' as const
      };
      
      if (isSupabaseConnected) {
        const { data, error } = await supabase
          .from('students')
          .insert([newStudentData])
          .select()
          .single();
        
        if (error) {
          console.error('Supabase 학생 추가 오류:', error);
          message.error('학생 추가에 실패했습니다.');
          return;
        }
        
        // 학생 목록 새로고침
        const { data: updatedStudents } = await supabase
          .from('students')
          .select('*')
          .eq('class_id', classData.id)
          .order('student_number', { ascending: true });
        setStudents(updatedStudents || []);
        
        message.success('학생이 추가되었습니다.');
      } else {
        // 더미 모드
        const newStudent: LocalStudent = {
          id: Date.now().toString(),
          ...newStudentData,
          last_survey: '아직 없음',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        setStudents([...students, newStudent]);
        message.success('학생이 추가되었습니다.');
      }
      
      setIsAddStudentModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('학생 추가 오류:', error);
      message.error('학생 추가 중 오류가 발생했습니다.');
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
      render: (_: any, record: LocalStudent) => (
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
        <Text type={text === '아직 없음' ? 'secondary' : undefined}>
          {text}
        </Text>
      )
    },
    {
      title: '작업',
      key: 'actions',
      render: (_: any, record: LocalStudent) => (
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
    <Layout>
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
              {isSupabaseConnected ? (
                <Tag color="green" style={{ marginLeft: '8px', fontSize: '12px' }}>DB 연결됨</Tag>
              ) : (
                <Tag color="orange" style={{ marginLeft: '8px', fontSize: '12px' }}>더미 모드</Tag>
              )}
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