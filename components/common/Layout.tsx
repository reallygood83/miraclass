import { ReactNode } from 'react';
import { Layout as AntLayout, Menu, Button, Typography, Space } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { 
  HomeOutlined, 
  FormOutlined, 
  ShareAltOutlined, 
  BarChartOutlined,
  EyeOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuOutlined,
  TeamOutlined
} from '@ant-design/icons';
import Link from 'next/link';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const menuItems = [
    {
      key: '1',
      icon: <HomeOutlined />,
      label: <Link href="/dashboard">대시보드</Link>,
    },
    {
      key: '2',
      icon: <TeamOutlined />,
      label: <Link href="/classes">학급 관리</Link>,
    },
    {
      key: '3',
      icon: <FormOutlined />,
      label: <Link href="/surveys">설문 관리</Link>,
    },
    {
      key: '4',
      icon: <ShareAltOutlined />,
      label: <Link href="/network">관계 네트워크</Link>,
    },
    {
      key: '5',
      icon: <BarChartOutlined />,
      label: <Link href="/analytics">AI 분석</Link>,
    },
    {
      key: '6',
      icon: <EyeOutlined />,
      label: <Link href="/monitoring">실시간 모니터링</Link>,
    },
    {
      key: '7',
      icon: <SettingOutlined />,
      label: <Link href="/settings">설정</Link>,
    },
  ];

  const handleLogout = async () => {
    console.log('🚪 로그아웃 시도');
    await signOut();
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        boxShadow: '0 2px 8px #f0f1f2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            <Link href="/">우리반 커넥트</Link>
          </Title>
        </div>
        
        {user && (
          <Space>
            <span>안녕하세요, {user.name}님 ({user.role === 'teacher' ? '교사' : '학생'})</span>
            <Button 
              type="text" 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              로그아웃
            </Button>
          </Space>
        )}
      </Header>

      <AntLayout>
        {user && (
          <Sider 
            width={200} 
            style={{ background: '#fff' }}
            breakpoint="lg"
            collapsedWidth="0"
          >
            <Menu
              mode="inline"
              defaultSelectedKeys={['1']}
              items={menuItems}
              style={{ height: '100%', borderRight: 0 }}
            />
          </Sider>
        )}
        
        <Content style={{ 
          padding: '24px',
          background: '#f0f2f5',
          minHeight: 280 
        }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}