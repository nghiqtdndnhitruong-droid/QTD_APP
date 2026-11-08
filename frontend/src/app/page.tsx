'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  BankOutlined,
  DollarCircleOutlined,
  EnvironmentOutlined,
  FileAddOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DashboardSummary, Loan } from '@/types/credit.types';
import { apiRequest } from '@/utils/api-client';
import { formatDateDisplay, formatVND } from '@/utils/credit.helpers';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { officer } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<DashboardSummary>(
        '/loans/dashboard-summary',
      );
      setSummary(data);
    } catch {
      // ignore initial error if DB not migrated yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (officer) {
      void fetchSummary();
    }
  }, [officer, fetchSummary]);

  const unsecuredStat = summary?.byLoanType.find(
    (x) => x.loanType === 'TIN_CHAP',
  );
  const securedStat = summary?.byLoanType.find(
    (x) => x.loanType === 'THE_CHAP',
  );

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          background:
            'linear-gradient(135deg, rgba(14, 165, 233, 0.14) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1px solid #1F2937',
          borderRadius: 12,
          padding: '20px 24px',
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: '#F9FAFB' }}>
            Tổng quan Nghiệp vụ Tín dụng
          </Title>
          <Text style={{ color: '#9CA3AF' }}>
            Cán bộ phụ trách:{' '}
            <strong style={{ color: '#38BDF8' }}>{officer?.fullName}</strong> •
            Số giấy tờ: {officer?.idNumber} ({officer?.issuingAuthority})
          </Text>
        </div>

        <Space wrap>
          <Button
            icon={<EnvironmentOutlined />}
            onClick={() => router.push('/territories')}
          >
            Quản lý Địa bàn
          </Button>
          <Button
            type="primary"
            icon={<FileAddOutlined />}
            onClick={() => router.push('/loans/create')}
            style={{
              background: 'linear-gradient(90deg, #0EA5E9 0%, #10B981 100%)',
              border: 'none',
              color: '#0B0F19',
              fontWeight: 600,
            }}
          >
            Tạo lập Khoản vay mới
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title={
                <Text style={{ color: '#9CA3AF' }}>Tổng số Khoản vay</Text>
              }
              value={summary?.totalLoans ?? 0}
              prefix={<BankOutlined style={{ color: '#0EA5E9' }} />}
              suffix="hồ sơ"
              styles={{ content: { color: '#F9FAFB', fontWeight: 700 } }}
            />
            <div style={{ marginTop: 10 }}>
              <Tag color="blue">Tín chấp: {unsecuredStat?.count ?? 0}</Tag>
              <Tag color="emerald" style={{ color: '#10B981' }}>
                Thế chấp: {securedStat?.count ?? 0}
              </Tag>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title={
                <Text style={{ color: '#9CA3AF' }}>Tổng Dư nợ Cho vay</Text>
              }
              value={formatVND(summary?.totalLoanAmount ?? 0)}
              prefix={<DollarCircleOutlined style={{ color: '#10B981' }} />}
              styles={{ content: { color: '#10B981', fontWeight: 700 } }}
            />
            <div style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
                Thế chấp: {formatVND(securedStat?.amount ?? 0)}
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title={
                <Text style={{ color: '#9CA3AF' }}>
                  Tổng Định giá Tài sản Thế chấp
                </Text>
              }
              value={formatVND(summary?.totalCollateralValuation ?? 0)}
              prefix={
                <SafetyCertificateOutlined style={{ color: '#F59E0B' }} />
              }
              styles={{ content: { color: '#F59E0B', fontWeight: 700 } }}
            />
            <div style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
                Hạn mức tối đa 70%:{' '}
                {formatVND(
                  Math.floor((summary?.totalCollateralValuation ?? 0) * 0.7),
                )}
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title={
                <Text style={{ color: '#9CA3AF' }}>
                  Khách hàng & Địa bàn Quản lý
                </Text>
              }
              value={summary?.totalBorrowers ?? 0}
              prefix={<TeamOutlined style={{ color: '#38BDF8' }} />}
              suffix="khách hàng"
              styles={{ content: { color: '#F9FAFB', fontWeight: 700 } }}
            />
            <div style={{ marginTop: 10 }}>
              <Tag color="purple">Nhóm xã: {summary?.totalGroups ?? 0}</Tag>
              <Tag color="cyan">Xã: {summary?.totalCommunes ?? 0}</Tag>
              <Tag color="geekblue">Ấp: {summary?.totalHamlets ?? 0}</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title="Danh sách Khoản vay Gần đây thuộc Địa bàn Quản lý"
        extra={
          <Button type="link" onClick={() => router.push('/loans')}>
            Xem toàn bộ danh sách →
          </Button>
        }
      >
        <Table<Loan>
          rowKey="id"
          loading={loading}
          dataSource={summary?.recentLoans ?? []}
          pagination={false}
          locale={{
            emptyText: (
              <Empty description="Chưa có khoản vay nào được tạo trong địa bàn của bạn" />
            ),
          }}
          columns={[
            {
              title: 'Số khế ước',
              dataIndex: 'indentureNumber',
              render: (v: string) => (
                <Tag color="cyan" style={{ fontWeight: 600 }}>
                  {v}
                </Tag>
              ),
            },
            {
              title: 'Người vay',
              key: 'borrower',
              render: (_, record) => (
                <div>
                  <div style={{ fontWeight: 600, color: '#F9FAFB' }}>
                    {record.borrower?.fullName}
                  </div>
                  <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
                    CCCD: {record.borrower?.idNumber} •{' '}
                    {record.borrower?.address}
                  </Text>
                </div>
              ),
            },
            {
              title: 'Loại vay & Thời hạn',
              key: 'loanType',
              render: (_, record) => (
                <Space size={6}>
                  <Tag
                    color={
                      record.loanType === 'THE_CHAP' ? 'success' : 'processing'
                    }
                  >
                    {record.loanType === 'THE_CHAP' ? 'Thế chấp' : 'Tín chấp'}
                  </Tag>
                  <Tag color="default">
                    {record.durationType === 'NGAN_HAN'
                      ? 'Ngắn hạn (12T)'
                      : 'Trung hạn (24T)'}
                  </Tag>
                </Space>
              ),
            },
            {
              title: 'Số tiền vay',
              dataIndex: 'loanAmount',
              align: 'right',
              render: (v: number | string) => (
                <Text style={{ color: '#10B981', fontWeight: 700 }}>
                  {formatVND(v)}
                </Text>
              ),
            },
            {
              title: 'Lãi suất',
              dataIndex: 'interestRate',
              align: 'center',
              render: (v: number | string) => <Tag color="gold">{v}%</Tag>,
            },
            {
              title: 'Ngày giải ngân → Đáo hạn',
              key: 'dates',
              render: (_, record) => (
                <Text style={{ fontSize: 13, color: '#D1D5DB' }}>
                  {formatDateDisplay(record.disbursementDate)} →{' '}
                  <strong style={{ color: '#F59E0B' }}>
                    {formatDateDisplay(record.dueDate)}
                  </strong>
                </Text>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
}
