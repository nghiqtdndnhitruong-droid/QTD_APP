'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircleFilled,
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import { DateInputDDMMYYYY } from '@/components/common/DateInputDDMMYYYY';
import {
  InterestRateBatch,
  InterestRateTier,
  LoanDurationType,
  LoanType,
} from '@/types/credit.types';
import { apiRequest } from '@/utils/api-client';
import {
  formatDateDisplay,
  formatVND,
  getTodayDDMMYYYY,
} from '@/utils/credit.helpers';

const { Title, Text } = Typography;

interface SecuredBracketConfig {
  key: string;
  label: string;
  minAmount: number;
  maxAmount: number | null;
}

const SECURED_BRACKETS: SecuredBracketConfig[] = [
  {
    key: 'b1',
    label: 'Mốc 1: Từ 0 – 99 triệu đồng',
    minAmount: 0,
    maxAmount: 99_999_999,
  },
  {
    key: 'b2',
    label: 'Mốc 2: Từ 100 – 199 triệu đồng',
    minAmount: 100_000_000,
    maxAmount: 199_999_999,
  },
  {
    key: 'b3',
    label: 'Mốc 3: Từ 200 – 299 triệu đồng',
    minAmount: 200_000_000,
    maxAmount: 299_999_999,
  },
  {
    key: 'b4',
    label: 'Mốc 4: Từ 300 – 499 triệu đồng',
    minAmount: 300_000_000,
    maxAmount: 499_999_999,
  },
  {
    key: 'b5',
    label: 'Mốc 5: Từ 500 triệu → hơn 1 tỷ đồng',
    minAmount: 500_000_000,
    maxAmount: null,
  },
];

interface BatchFormValues {
  effectiveDate: string;
  documentNote?: string;
  isApplied?: boolean;
  unsecuredShortRate: number;
  unsecuredMediumRate: number;
  securedRates: Record<
    string,
    {
      shortRate: number;
      mediumRate: number;
    }
  >;
}

export default function InterestRatesPage() {
  const { message } = App.useApp();
  const [batches, setBatches] = useState<InterestRateBatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [editingBatch, setEditingBatch] = useState<InterestRateBatch | null>(
    null,
  );
  const [form] = Form.useForm<BatchFormValues>();

  const loadBatches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<InterestRateBatch[]>(
        '/interest-rates/batches',
      );
      setBatches(data ?? []);
    } catch (err) {
      message.error(
        err instanceof Error
          ? err.message
          : 'Không thể tải danh sách biểu lãi suất',
      );
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  const openCreateModal = () => {
    setEditingBatch(null);
    form.resetFields();
    form.setFieldsValue({
      effectiveDate: getTodayDDMMYYYY(),
      documentNote: '',
      isApplied: true,
      unsecuredShortRate: 1.0,
      unsecuredMediumRate: 1.1,
      securedRates: {
        b1: { shortRate: 0.9, mediumRate: 1.0 },
        b2: { shortRate: 0.85, mediumRate: 0.95 },
        b3: { shortRate: 0.8, mediumRate: 0.9 },
        b4: { shortRate: 0.78, mediumRate: 0.88 },
        b5: { shortRate: 0.75, mediumRate: 0.85 },
      },
    });
    setModalOpen(true);
  };

  const openEditModal = (batch: InterestRateBatch) => {
    setEditingBatch(batch);

    const findRate = (
      loanType: LoanType,
      durationType: LoanDurationType,
      minAmount: number,
    ): number => {
      const found = batch.tiers.find(
        (t) =>
          t.loanType === loanType &&
          t.durationType === durationType &&
          Number(t.minAmount) === minAmount,
      );
      return found ? Number(found.interestRate) : 0;
    };

    const securedRates: BatchFormValues['securedRates'] = {};
    for (const bracket of SECURED_BRACKETS) {
      securedRates[bracket.key] = {
        shortRate: findRate('THE_CHAP', 'NGAN_HAN', bracket.minAmount),
        mediumRate: findRate('THE_CHAP', 'TRUNG_HAN', bracket.minAmount),
      };
    }

    form.setFieldsValue({
      effectiveDate: formatDateDisplay(batch.effectiveDate),
      documentNote: batch.documentNote ?? '',
      isApplied: batch.isApplied,
      unsecuredShortRate: findRate('TIN_CHAP', 'NGAN_HAN', 0),
      unsecuredMediumRate: findRate('TIN_CHAP', 'TRUNG_HAN', 0),
      securedRates,
    });
    setModalOpen(true);
  };

  const buildTiersPayloadFromForm = (values: BatchFormValues) => {
    const tiers: Array<{
      loanType: LoanType;
      durationType: LoanDurationType;
      minAmount: number;
      maxAmount: number | null;
      interestRate: number;
      description: string;
    }> = [
      {
        loanType: 'TIN_CHAP',
        durationType: 'NGAN_HAN',
        minAmount: 0,
        maxAmount: 100_000_000,
        interestRate: Number(values.unsecuredShortRate),
        description: 'Tín chấp Ngắn hạn (≤ 100 triệu đồng)',
      },
      {
        loanType: 'TIN_CHAP',
        durationType: 'TRUNG_HAN',
        minAmount: 0,
        maxAmount: 100_000_000,
        interestRate: Number(values.unsecuredMediumRate),
        description: 'Tín chấp Trung hạn (≤ 100 triệu đồng)',
      },
    ];

    for (const bracket of SECURED_BRACKETS) {
      const ratePair = values.securedRates?.[bracket.key];
      tiers.push({
        loanType: 'THE_CHAP',
        durationType: 'NGAN_HAN',
        minAmount: bracket.minAmount,
        maxAmount: bracket.maxAmount,
        interestRate: Number(ratePair?.shortRate ?? 0),
        description: `Thế chấp Ngắn hạn (${bracket.label})`,
      });
      tiers.push({
        loanType: 'THE_CHAP',
        durationType: 'TRUNG_HAN',
        minAmount: bracket.minAmount,
        maxAmount: bracket.maxAmount,
        interestRate: Number(ratePair?.mediumRate ?? 0),
        description: `Thế chấp Trung hạn (${bracket.label})`,
      });
    }

    return tiers;
  };

  const handleSaveBatch = async (values: BatchFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        effectiveDate: values.effectiveDate,
        documentNote: values.documentNote?.trim() || undefined,
        isApplied: values.isApplied ?? true,
        tiers: buildTiersPayloadFromForm(values),
      };

      if (editingBatch) {
        await apiRequest(`/interest-rates/batches/${editingBatch.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        message.success('Đã cập nhật đợt ban hành lãi suất');
      } else {
        await apiRequest('/interest-rates/batches', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        message.success('Đã ban hành mốc lãi suất mới');
      }

      setModalOpen(false);
      await loadBatches();
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : 'Lỗi lưu đợt ban hành lãi suất',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyBatch = async (id: string) => {
    try {
      await apiRequest(`/interest-rates/batches/${id}/apply`, {
        method: 'PATCH',
      });
      message.success(
        'Đã áp dụng đợt lãi suất này làm căn cứ tính lãi tự động cho hệ thống!',
      );
      await loadBatches();
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : 'Không thể áp dụng đợt lãi suất',
      );
    }
  };

  const handleDeleteBatch = async (id: string) => {
    try {
      await apiRequest(`/interest-rates/batches/${id}`, { method: 'DELETE' });
      message.success('Đã xóa đợt ban hành lãi suất');
      await loadBatches();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Không thể xóa');
    }
  };

  const appliedBatch = batches.find((b) => b.isApplied) ?? batches[0] ?? null;

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: '#F9FAFB' }}>
            Quản lý Biểu Lãi suất Ban hành
          </Title>
          <Text style={{ color: '#9CA3AF' }}>
            Ban hành biểu lãi suất theo Thời gian & Số thông tư • Chọn Áp dụng
            mốc nào hệ thống sẽ căn cứ mốc đó để tự động áp lãi cho khoản vay
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
          style={{
            background: 'linear-gradient(90deg, #0EA5E9 0%, #10B981 100%)',
            border: 'none',
            color: '#0B0F19',
            fontWeight: 600,
          }}
        >
          Ban hành Mốc Lãi suất mới
        </Button>
      </div>

      {/* DANH SÁCH CÁC ĐỢT LÃI SUẤT ĐÃ BAN HÀNH */}
      <Card title="1. Danh sách các Đợt Lãi suất đã ban hành">
        <Table<InterestRateBatch>
          rowKey="id"
          loading={loading}
          dataSource={batches}
          pagination={false}
          locale={{
            emptyText: (
              <Empty description="Chưa có đợt ban hành lãi suất nào. Vui lòng bấm 'Ban hành Mốc Lãi suất mới'." />
            ),
          }}
          columns={[
            {
              title: 'Thời gian ban hành',
              dataIndex: 'effectiveDate',
              width: 170,
              render: (v: string) => (
                <Tag
                  color="cyan"
                  style={{ fontSize: 13, fontWeight: 600, padding: '2px 10px' }}
                >
                  {formatDateDisplay(v)}
                </Tag>
              ),
            },
            {
              title: 'Ghi chú (Số thông tư ban hành)',
              dataIndex: 'documentNote',
              render: (v?: string | null) => (
                <Text style={{ color: '#F9FAFB', fontWeight: 600 }}>
                  {v || '—'}
                </Text>
              ),
            },
            {
              title: 'Lãi suất Tín chấp (≤ 100tr)',
              key: 'unsecuredSummary',
              render: (_, batch) => {
                const shortTier = batch.tiers.find(
                  (t) =>
                    t.loanType === 'TIN_CHAP' && t.durationType === 'NGAN_HAN',
                );
                const medTier = batch.tiers.find(
                  (t) =>
                    t.loanType === 'TIN_CHAP' && t.durationType === 'TRUNG_HAN',
                );
                return (
                  <Space size={8} wrap>
                    <Tag color="blue">
                      Ngắn hạn: <strong>{shortTier?.interestRate ?? '—'}%</strong>
                    </Tag>
                    <Tag color="geekblue">
                      Trung hạn: <strong>{medTier?.interestRate ?? '—'}%</strong>
                    </Tag>
                  </Space>
                );
              },
            },
            {
              title: 'Trạng thái áp dụng',
              dataIndex: 'isApplied',
              width: 170,
              align: 'center',
              render: (isApplied: boolean) =>
                isApplied ? (
                  <Tag
                    icon={<CheckCircleFilled />}
                    color="success"
                    style={{ fontWeight: 700, padding: '3px 10px' }}
                  >
                    Đang áp dụng
                  </Tag>
                ) : (
                  <Tag color="default">Chưa áp dụng</Tag>
                ),
            },
            {
              title: 'Thao tác',
              width: 220,
              align: 'right',
              render: (_, record) => (
                <Space>
                  {!record.isApplied && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => handleApplyBatch(record.id)}
                    >
                      Áp dụng
                    </Button>
                  )}
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEditModal(record)}
                  >
                    Chi tiết / Sửa
                  </Button>
                  <Popconfirm
                    title="Xóa đợt ban hành lãi suất này?"
                    onConfirm={() => handleDeleteBatch(record.id)}
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {/* CHI TIẾT BIỂU LÃI SUẤT ĐANG ÁP DỤNG */}
      {appliedBatch && (
        <Card
          title={
            <Space wrap>
              <span>
                2. Chi tiết Biểu lãi suất đang áp dụng (Ban hành ngày:{' '}
                {formatDateDisplay(appliedBatch.effectiveDate)})
              </span>
              {appliedBatch.documentNote && (
                <Tag color="gold">{appliedBatch.documentNote}</Tag>
              )}
            </Space>
          }
        >
          <Table<InterestRateTier>
            rowKey="id"
            dataSource={appliedBatch.tiers}
            pagination={false}
            size="small"
            columns={[
              {
                title: 'Loại vay',
                dataIndex: 'loanType',
                render: (v: LoanType) => (
                  <Tag color={v === 'THE_CHAP' ? 'green' : 'blue'}>
                    {v === 'THE_CHAP' ? 'Vay Thế chấp' : 'Vay Tín chấp'}
                  </Tag>
                ),
              },
              {
                title: 'Thời hạn vay',
                dataIndex: 'durationType',
                render: (v: LoanDurationType) => (
                  <Tag color={v === 'NGAN_HAN' ? 'cyan' : 'purple'}>
                    {v === 'NGAN_HAN'
                      ? 'Ngắn hạn (12 tháng)'
                      : 'Trung hạn (24 tháng)'}
                  </Tag>
                ),
              },
              {
                title: 'Khoảng số tiền vay (Mốc)',
                key: 'range',
                render: (_, record) => (
                  <Text style={{ color: '#F3F4F6', fontWeight: 600 }}>
                    {formatVND(record.minAmount)} →{' '}
                    {record.maxAmount !== null && record.maxAmount !== undefined
                      ? formatVND(record.maxAmount)
                      : 'Từ 500 triệu trở lên'}
                  </Text>
                ),
              },
              {
                title: 'Mức lãi suất (%)',
                dataIndex: 'interestRate',
                align: 'center',
                render: (v: number | string) => (
                  <Tag
                    color="gold"
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      padding: '2px 10px',
                    }}
                  >
                    {v}%
                  </Tag>
                ),
              },
              {
                title: 'Mô tả mốc',
                dataIndex: 'description',
                render: (v?: string | null) => (
                  <Text style={{ color: '#D1D5DB' }}>{v || '—'}</Text>
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* MODAL BAN HÀNH / CẬP NHẬT ĐỢT LÃI SUẤT */}
      <Modal
        title={
          editingBatch
            ? 'Cập nhật Đợt Ban hành Lãi suất'
            : 'Ban hành Mốc Lãi suất mới'
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Lưu Biểu Lãi suất"
        width={820}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveBatch}>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Thời gian ban hành (dd/mm/yyyy)"
                name="effectiveDate"
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng nhập thời gian ban hành',
                  },
                ]}
              >
                <DateInputDDMMYYYY />
              </Form.Item>
            </Col>
            <Col xs={24} sm={11}>
              <Form.Item
                label="Ghi chú (Số thông tư / Quyết định ban hành)"
                name="documentNote"
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng nhập số thông tư hoặc ghi chú ban hành',
                  },
                ]}
              >
                <Input placeholder="VD: Thông tư số 01/2026/TB-QTD" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={5}>
              <Form.Item
                label="Áp dụng ngay"
                name="isApplied"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Đang áp dụng"
                  unCheckedChildren="Lưu nháp"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="left" style={{ margin: '8px 0 16px' }}>
            <Tag color="blue" style={{ fontSize: 13 }}>
              I. Lãi suất Vay Tín chấp (Mốc duy nhất ≤ 100.000.000đ)
            </Tag>
          </Divider>

          <div
            style={{
              background: '#161F30',
              border: '1px solid #283548',
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Tín chấp – Ngắn hạn (12 tháng) (%)"
                  name="unsecuredShortRate"
                  rules={[
                    {
                      required: true,
                      message: 'Nhập lãi suất tín chấp ngắn hạn',
                    },
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={0.05}
                    suffix="%"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Tín chấp – Trung hạn (24 tháng) (%)"
                  name="unsecuredMediumRate"
                  rules={[
                    {
                      required: true,
                      message: 'Nhập lãi suất tín chấp trung hạn',
                    },
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={0.05}
                    suffix="%"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider titlePlacement="left" style={{ margin: '8px 0 16px' }}>
            <Tag color="green" style={{ fontSize: 13 }}>
              II. Lãi suất Vay Thế chấp (5 mốc số tiền cho Ngắn hạn & Trung hạn)
            </Tag>
          </Divider>

          <div
            style={{
              background: '#161F30',
              border: '1px solid #283548',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <Row
              gutter={12}
              style={{
                marginBottom: 10,
                paddingBottom: 8,
                borderBottom: '1px solid #283548',
                fontWeight: 600,
                color: '#9CA3AF',
              }}
            >
              <Col xs={24} sm={10}>
                Mốc số tiền vay Thế chấp
              </Col>
              <Col xs={12} sm={7}>
                Ngắn hạn (12 tháng) (%)
              </Col>
              <Col xs={12} sm={7}>
                Trung hạn (24 tháng) (%)
              </Col>
            </Row>

            {SECURED_BRACKETS.map((bracket) => (
              <Row
                key={bracket.key}
                gutter={12}
                align="middle"
                style={{ marginBottom: 10 }}
              >
                <Col xs={24} sm={10}>
                  <Text style={{ color: '#F9FAFB', fontWeight: 600 }}>
                    {bracket.label}
                  </Text>
                </Col>
                <Col xs={12} sm={7}>
                  <Form.Item
                    name={['securedRates', bracket.key, 'shortRate']}
                    rules={[{ required: true, message: 'Nhập %' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.05}
                      suffix="%"
                      placeholder="Ngắn hạn %"
                    />
                  </Form.Item>
                </Col>
                <Col xs={12} sm={7}>
                  <Form.Item
                    name={['securedRates', bracket.key, 'mediumRate']}
                    rules={[{ required: true, message: 'Nhập %' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.05}
                      suffix="%"
                      placeholder="Trung hạn %"
                    />
                  </Form.Item>
                </Col>
              </Row>
            ))}
          </div>
        </Form>
      </Modal>
    </Space>
  );
}
