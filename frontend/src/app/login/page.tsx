'use client';

import React, { useState } from 'react';
import { BankOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Space,
  Typography,
} from 'antd';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const { Title, Text } = Typography;

export default function LoginPage() {
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFinish = async (values: {
    username: string;
    password: string;
  }) => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await login(values.username, values.password);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Đăng nhập không thành công',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 20% 20%, rgba(14, 165, 233, 0.12), transparent 45%), radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.1), transparent 45%), #0B0F19',
        padding: 20,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#111827',
          borderColor: '#1F2937',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        }}
        styles={{ body: { padding: '36px 32px' } }}
      >
        <Space
          orientation="vertical"
          size={6}
          style={{ width: '100%', textAlign: 'center', marginBottom: 28 }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              margin: '0 auto 10px',
              borderRadius: 14,
              background:
                'linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              color: '#0B0F19',
            }}
          >
            <BankOutlined />
          </div>
          <Title level={3} style={{ margin: 0, color: '#F9FAFB' }}>
            HỆ THỐNG TÍN DỤNG QTD
          </Title>
          <Text style={{ color: '#9CA3AF' }}>
            Đăng nhập dành cho Cán bộ Tín dụng
          </Text>
        </Space>

        {errorMsg && (
          <Alert
            type="error"
            showIcon
            title={errorMsg}
            style={{ marginBottom: 20 }}
          />
        )}

        <Form layout="vertical" size="large" onFinish={handleFinish}>
          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#6B7280' }} />}
              placeholder="Nhập tên đăng nhập cán bộ"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#6B7280' }} />}
              placeholder="Nhập mật khẩu"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            block
            style={{
              marginTop: 8,
              height: 44,
              fontWeight: 600,
              background:
                'linear-gradient(90deg, #0EA5E9 0%, #10B981 100%)',
              border: 'none',
              color: '#0B0F19',
            }}
          >
            Đăng nhập hệ thống
          </Button>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <Text style={{ color: '#9CA3AF' }}>
            Chưa có tài khoản cán bộ?{' '}
            <Link
              href="/register"
              style={{ color: '#38BDF8', fontWeight: 600 }}
            >
              Đăng ký tài khoản mới
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
