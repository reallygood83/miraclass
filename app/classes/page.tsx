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
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  SettingOutlined,
  EyeOutlined
} from '@ant-design/icons';
import Layout from '@/components/common/Layout';

const { Title, Text } = Typography;

interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  school_id?: string;
  grade?: number;
  class_number?: number;
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

export default function ClassesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [form] = Form.useForm();
  const router = useRouter();

  // 클라이언트 사이드임을 확인
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

    // 테스트를 위한 더미 사용자 설정
    const dummyUser: User = {
      id: '1',
      name: '김선생',
      email: 'teacher@test.com',
      role: 'teacher'
    };

    setUser(dummyUser);
    setAuthChecked(true);
    setLoading(false);
    loadClasses();
  }, [isClient, authChecked, router]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      // 실제 API 호출 대신 로컬스토리지에서 데이터 로드
      const storedClasses = localStorage.getItem('classes');
      const parsedClasses = storedClasses ? JSON.parse(storedClasses) : [];
      
      // 더미 데이터 추가 (실제 구현에서는 제거)
      const dummyClasses: Class[] = [
        {
          id: '1',
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
        },
        {
          id: '2',
          name: '6학년 2반',
          grade: 6,
          class_number: 2,
          teacher_name: '김선생',
          student_count: 30,
          total_surveys: 2,
          active_surveys: 0,
          last_analysis: '1일 전',
          status: 'active',
          created_at: '2025-01-10'
        },
        {
          id: '3',
          name: '5학년 1반',
          grade: 5,
          class_number: 1,
          teacher_name: '김선생',
          student_count: 25,
          total_surveys: 1,
          active_surveys: 0,
          last_analysis: '3일 전',
          status: 'inactive',
          created_at: '2025-01-05'
        }
      ];

      const combinedClasses = [...dummyClasses, ...parsedClasses];
      setClasses(combinedClasses);
      
    } catch (error) {
      console.error('Failed to load classes:', error);
      message.error('학급 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = () => {
    setEditingClass(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    form.setFieldsValue(classItem);
    setIsModalVisible(true);
  };

  const handleDeleteClass = (classId: string) => {
    const updatedClasses = classes.filter(c => c.id !== classId);
    setClasses(updatedClasses);
    
    // 로컬스토리지에서도 삭제
    const storedClasses = JSON.parse(localStorage.getItem('classes') || '[]');
    const filteredClasses = storedClasses.filter((c: any) => c.id !== classId);
    localStorage.setItem('classes', JSON.stringify(filteredClasses));
    
    message.success('학급이 삭제되었습니다.');
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingClass) {
        // 수정
        const updatedClasses = classes.map(c => 
          c.id === editingClass.id 
            ? { ...c, ...values, name: `${values.grade}학년 ${values.class_number}반` }
            : c
        );
        setClasses(updatedClasses);
        message.success('학급 정보가 수정되었습니다.');
      } else {
        // 생성
        const newClass: Class = {
          id: Date.now().toString(),
          name: `${values.grade}학년 ${values.class_number}반`,
          grade: values.grade,
          class_number: values.class_number,
          teacher_name: user?.name || '교사',
          student_count: values.student_count || 0,
          total_surveys: 0,
          active_surveys: 0,
          last_analysis: '아직 없음',
          status: 'active',
          created_at: new Date().toISOString().split('T')[0]
        };
        
        const updatedClasses = [...classes, newClass];
        setClasses(updatedClasses);
        
        // 로컬스토리지에 저장
        const storedClasses = JSON.parse(localStorage.getItem('classes') || '[]');
        storedClasses.push(newClass);
        localStorage.setItem('classes', JSON.stringify(storedClasses));
        
        message.success('새 학급이 생성되었습니다.');
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Failed to save class:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const getStatusTag = (status: string) => {
    const statusMap = {
      active: { color: 'green', text: '활성' },
      inactive: { color: 'default', text: '비활성' }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.active;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '학급명',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text: string, record: Class) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{text}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            담임: {record.teacher_name}
          </Text>
        </div>
      )
    },
    {
      title: '학생 수',
      dataIndex: 'student_count',
      key: 'student_count',
      width: 100,
      render: (count: number) => (
        <div style={{ textAlign: 'center' }}>
          <UserOutlined style={{ marginRight: '4px' }} />
          {count}명
        </div>
      )
    },
    {
      title: '설문 현황',
      key: 'surveys',
      width: 120,
      render: (_: any, record: Class) => (
        <div>
          <div>전체: {record.total_surveys}회</div>
          <div style={{ fontSize: '12px', color: '#52c41a' }}>
            진행중: {record.active_surveys}회
          </div>
        </div>
      )
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '최근 분석',
      dataIndex: 'last_analysis',
      key: 'last_analysis',
      width: 120,
      render: (text: string) => (
        <Text type={text === '아직 없음' ? 'secondary' : 'default'}>
          {text}
        </Text>
      )
    },
    {
      title: '생성일',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR')
    },
    {
      title: '작업',
      key: 'actions',
      width: 180,
      render: (_: any, record: Class) => (
        <Space size="small">
          <Tooltip title="학급 상세">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
              onClick={() => router.push(`/classes/${record.id}`)}
            />
          </Tooltip>
          
          <Tooltip title="편집">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => handleEditClass(record)}
            />
          </Tooltip>
          
          <Tooltip title="설정">
            <Button 
              type="text" 
              icon={<SettingOutlined />}
              onClick={() => router.push(`/classes/${record.id}/settings`)}
            />
          </Tooltip>
          
          <Popconfirm
            title="학급을 삭제하시겠습니까?"
            description="이 작업은 되돌릴 수 없습니다."
            onConfirm={() => handleDeleteClass(record.id)}
            okText="삭제"
            cancelText="취소"
          >
            <Tooltip title="삭제">
              <Button 
                type="text" 
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 서버사이드 렌더링 중이거나 인증 체크 중이거나 로딩 중
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
            {!isClient ? '🔄 시스템 초기화 중...' : 
             !authChecked ? '🔐 인증 확인 중...' : 
             '📚 학급 목록 로딩 중...'}
          </div>
        </div>
      </div>
    );
  }

  // 사용자 정보가 없으면 null 반환
  if (!user) {
    return null;
  }

  // 통계 계산
  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => c.status === 'active').length;
  const totalStudents = classes.reduce((sum, c) => sum + c.student_count, 0);
  const totalSurveys = classes.reduce((sum, c) => sum + c.total_surveys, 0);

  return (
    <Layout user={{ name: user.name, role: user.role }}>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Title level={2}>
              <TeamOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              학급 관리
            </Title>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              size="large"
              onClick={handleCreateClass}
            >
              새 학급 생성
            </Button>
          </div>
          
          <Text type="secondary">
            학급을 생성하고 관리하며, 학생 관계 분석을 위한 설문을 진행할 수 있습니다.
          </Text>
        </div>

        {/* 통계 카드 */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="전체 학급"
                value={totalClasses}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
                suffix="개"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="활성 학급"
                value={activeClasses}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#52c41a' }}
                suffix="개"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="총 학생 수"
                value={totalStudents}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
                suffix="명"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="총 설문 수"
                value={totalSurveys}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#fa8c16' }}
                suffix="회"
              />
            </Card>
          </Col>
        </Row>

        {/* 학급 목록 테이블 */}
        <Card>
          <Table
            columns={columns}
            dataSource={classes}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} 학급`
            }}
          />
        </Card>

        {/* 학급 생성/수정 모달 */}
        <Modal
          title={editingClass ? '학급 수정' : '새 학급 생성'}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={500}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              grade: 6,
              class_number: 1,
              student_count: 25
            }}
          >
            <Form.Item
              name="grade"
              label="학년"
              rules={[{ required: true, message: '학년을 선택해주세요!' }]}
            >
              <Select placeholder="학년 선택">
                <Select.Option value={1}>1학년</Select.Option>
                <Select.Option value={2}>2학년</Select.Option>
                <Select.Option value={3}>3학년</Select.Option>
                <Select.Option value={4}>4학년</Select.Option>
                <Select.Option value={5}>5학년</Select.Option>
                <Select.Option value={6}>6학년</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="class_number"
              label="반"
              rules={[{ required: true, message: '반을 입력해주세요!' }]}
            >
              <InputNumber 
                min={1} 
                max={20} 
                placeholder="반 번호"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="student_count"
              label="학생 수"
              rules={[{ required: true, message: '학생 수를 입력해주세요!' }]}
            >
              <InputNumber 
                min={1} 
                max={40} 
                placeholder="학생 수"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
}