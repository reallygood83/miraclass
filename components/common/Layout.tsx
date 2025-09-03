import { ReactNode } from 'react';
import { Layout as AntLayout, Menu, Button, Typography, Space } from 'antd';
import { 
  HomeOutlined, 
  UserOutlined, 
  TeamOutlined, 
  SettingOutlined,
  LogoutOutlined,
  MenuOutlined
} from '@ant-design/icons';
import Link from 'next/link';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: ReactNode;
  user?: {
    name: string;
    role: string;
  } | null;
}

export default function Layout({ children, user }: LayoutProps) {
  const menuItems = [
    {
      key: '1',
      icon: <HomeOutlined />,
      label: <Link href="/dashboard">대시보드</Link>,
    },
    {
      key: '2',
      icon: <UserOutlined />,
      label: <Link href="/profile">프로필</Link>,
    },
    {
      key: '3',
      icon: <TeamOutlined />,
      label: <Link href="/classes">수업</Link>,
    },
    {
      key: '4',
      icon: <SettingOutlined />,
      label: <Link href="/settings">설정</Link>,
    },
  ];

  const handleLogout = () => {
    // 로그아웃 로직
    localStorage.removeItem('token');
    window.location.href = '/auth/login';
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
            <Link href="/">MiraClass</Link>
          </Title>
        </div>
        
        {user && (
          <Space>
            <span>안녕하세요, {user.name}님 ({user.role})</span>
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