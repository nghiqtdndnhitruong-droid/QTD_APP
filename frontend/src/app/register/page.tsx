'use client';

import React, { useState } from 'react';
import { BankOutlined, IdcardOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import Link from 'next/link';
import { DateInputDDMMYYYY } from '@/components/common/DateInputDDMMYYYY';
import { useAuth } from '@/context/AuthContext';
import { IdentityCardType } from '@/types/credit.types';
import {
  getIssuingAuthorityByIdType,
  ID_TYPE_OPTIONS,
  parseTwelveDigitIdCard,
} from '@/utils/credit.helpers';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const { register } = useAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const watchedIdType = Form.useWatch<IdentityCardType>('idType', form);
  const watchedIdNumber = Form.useWatch<string>('idNumber', form);

  const parsedId = parseTwelveDigitIdCard(watchedIdNumber);
  const issuingAuthority = getIssuingAuthorityByIdType(watchedIdType);

  const handleFinish = async (values: {
    username: string;
    password: string;
    fullName: string;
    idType: IdentityCardType;
    idNumber: string;
    issueDate: string;
  }) => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await register(values);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Đăng ký tài khoản thất bại',
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
          maxWidth: 620,
          background: '#111827',
          borderColor: '#1F2937',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        }}
        styles={{ body: { padding: '32px 32px' } }}
      >
        <Space
          orientation="vertical"
          size={4}
          style={{ width: '100%', textAlign: 'center', marginBottom: 24 }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              margin: '0 auto 8px',
              borderRadius: 12,
              background:
                'linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              color: '#0B0F19',
            }}
          >
            <BankOutlined />
          </div>
          <Title level={3} style={{ margin: 0, color: '#F9FAFB' }}>
            ĐĂNG KÝ CÁN BỘ TÍN DỤNG
          </Title>
          <Text style={{ color: '#9CA3AF' }}>
            Khởi tạo tài khoản cán bộ quản lý địa bàn và hồ sơ tín dụng
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

        <Form
          form={form}
          layout="vertical"
          initialValues={{ idType: 'CAN_CUOC' }}
          onFinish={handleFinish}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Tên đăng nhập (Unique)"
                name="username"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên đăng nhập' },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#6B7280' }} />}
                  placeholder="VD: cbtd_nhitruong"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu' },
                  { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#6B7280' }} />}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="Họ và tên cán bộ"
                name="fullName"
                rules={[
                  { required: true, message: 'Vui lòng nhập họ tên cán bộ' },
                ]}
              >
                <Input placeholder="VD: Nguyễn Văn A" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Loại giấy tờ cán bộ"
                name="idType"
                rules={[{ required: true }]}
              >
                <Select options={ID_TYPE_OPTIONS} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Số giấy tờ cán bộ (12 số - Unique)"
                name="idNumber"
                rules={[
                  { required: true, message: 'Vui lòng nhập 12 số giấy tờ' },
                  {
                    pattern: /^\d{12}$/,
                    message: 'Số giấy tờ phải gồm đúng 12 chữ số',
                  },
                ]}
              >
                <Input
                  maxLength={12}
                  prefix={<IdcardOutlined style={{ color: '#6B7280' }} />}
                  placeholder="VD: 084084123456"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Ngày cấp giấy tờ (dd/mm/yyyy)"
                name="issueDate"
                rules={[
                  { required: true, message: 'Vui lòng chọn ngày cấp' },
                ]}
              >
                <DateInputDDMMYYYY placeholder="dd/mm/yyyy" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item label="Nơi cấp (Tự động theo loại giấy tờ)">
                <Input value={issuingAuthority} disabled />
              </Form.Item>
            </Col>
          </Row>

          <div
            style={{
              background: '#161F30',
              border: '1px solid #1F2937',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
              Tự động trích xuất từ 12 số giấy tờ:
            </Text>
            {parsedId.isValid ? (
              <Space size={8}>
                <Tag color="cyan">Giới tính: {parsedId.genderLabel}</Tag>
                <Tag color="green">Năm sinh: {parsedId.birthYear}</Tag>
                <Tag color="gold">Nơi cấp: {issuingAuthority}</Tag>
              </Space>
            ) : (
              <Text style={{ color: '#F59E0B', fontSize: 13 }}>
                {watchedIdNumber
                  ? parsedId.error
                  : 'Nhập đủ 12 số giấy tờ để tự động lấy Giới tính & Năm sinh'}
              </Text>
            )}
          </div>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={submitting}
            block
            style={{
              height: 44,
              fontWeight: 600,
              background:
                'linear-gradient(90deg, #0EA5E9 0%, #10B981 100%)',
              border: 'none',
              color: '#0B0F19',
            }}
          >
            Hoàn tất đăng ký tài khoản
          </Button>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <Text style={{ color: '#9CA3AF' }}>
            Đã có tài khoản?{' '}
            <Link href="/login" style={{ color: '#38BDF8', fontWeight: 600 }}>
              Quay lại đăng nhập
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
