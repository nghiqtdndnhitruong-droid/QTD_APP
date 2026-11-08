'use client';

import React, { useState } from 'react';
import {
  BankOutlined,
  DashboardOutlined,
  DollarCircleOutlined,
  EnvironmentOutlined,
  FileAddOutlined,
  LogoutOutlined,
  PercentageOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Badge,
  Button,
  Layout,
  Menu,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { officer, loading, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isPublicPage = pathname === '/login' || pathname === '/register';

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (loading || !officer) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B0F19',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  const selectedKey = pathname.startsWith('/loans/create')
    ? '/loans/create'
    : pathname.startsWith('/loans')
      ? '/loans'
      : pathname.startsWith('/borrowers')
        ? '/borrowers'
        : pathname.startsWith('/territories')
          ? '/territories'
          : pathname.startsWith('/interest-rates')
            ? '/interest-rates'
            : '/';

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
    },
    {
      key: '/loans',
      icon: <DollarCircleOutlined />,
      label: 'Quản lý Khoản vay',
    },
    {
      key: '/loans/create',
      icon: <FileAddOutlined />,
      label: 'Tạo lập Khoản vay',
    },
    {
      key: '/borrowers',
      icon: <TeamOutlined />,
      label: 'Khách hàng & Thừa kế',
    },
    {
      key: '/territories',
      icon: <EnvironmentOutlined />,
      label: 'Địa bàn (Tỉnh Vĩnh Long)',
    },
    {
      key: '/interest-rates',
      icon: <PercentageOutlined />,
      label: 'Cấu hình Lãi suất',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#0B0F19' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={255}
        style={{
          background: '#0E1422',
          borderRight: '1px solid #1F2937',
          position: 'sticky',
          top: 0,
          height: '100vh',
          left: 0,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            padding: collapsed ? '18px 12px' : '20px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: '1px solid #1F2937',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background:
                'linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0B0F19',
              fontSize: 20,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            <BankOutlined />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <Title
                level={5}
                style={{
                  margin: 0,
                  color: '#F9FAFB',
                  letterSpacing: 0.3,
                  whiteSpace: 'nowrap',
                }}
              >
                QTD TÍN DỤNG
              </Title>
              <Text
                style={{ fontSize: 12, color: '#10B981', display: 'block' }}
              >
                Hệ thống Nghiệp vụ
              </Text>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{
            marginTop: 12,
            padding: '0 8px',
            background: 'transparent',
            borderRight: 'none',
          }}
        />
      </Sider>

      <Layout style={{ background: '#0B0F19' }}>
        <Header
          style={{
            background: 'rgba(17, 24, 39, 0.88)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #1F2937',
            padding: '0 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 20,
            height: 64,
          }}
        >
          <Space size={12}>
            <Badge status="processing" color="#10B981" />
            <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
              Địa bàn hoạt động:{' '}
              <strong style={{ color: '#F3F4F6' }}>Tỉnh Vĩnh Long</strong>
            </Text>
          </Space>

          <Space size={16}>
            <Tag
              color="cyan"
              style={{
                margin: 0,
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(14, 165, 233, 0.12)',
                borderColor: 'rgba(14, 165, 233, 0.3)',
              }}
            >
              CBTD: {officer.fullName} ({officer.username})
            </Tag>
            <Avatar
              style={{
                backgroundColor: '#10B981',
                color: '#0B0F19',
                fontWeight: 700,
              }}
              icon={<UserOutlined />}
            />
            <Button
              type="text"
              danger
              icon={<LogoutOutlined />}
              onClick={logout}
            >
              Đăng xuất
            </Button>
          </Space>
        </Header>

        <Content style={{ padding: '24px 28px', maxWidth: 1600, width: '100%', margin: '0 auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
