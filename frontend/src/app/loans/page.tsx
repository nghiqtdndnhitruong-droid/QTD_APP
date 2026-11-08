'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileAddOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { DateInputDDMMYYYY } from '@/components/common/DateInputDDMMYYYY';
import {
  CollateralValuationItem,
  Loan,
  LoanDurationType,
  LoanStatus,
  LoanType,
  TerritoryGroup,
} from '@/types/credit.types';
import { apiRequest } from '@/utils/api-client';
import {
  calculateDueDateDisplay,
  formatDateDisplay,
  formatVND,
  getCertificateTypeLabel,
  getCollateralAssetTypeLabel,
  getCollateralOwnerTypeLabel,
  getFundLandCategoryLabel,
  getHeirRelationshipLabel,
  getIdTypeLabel,
  getLoanStatusMeta,
  getRelatedPersonRelationshipLabel,
  getTodayDDMMYYYY,
  getValuationTypeLabel,
  LOAN_DURATION_OPTIONS,
  LOAN_STATUS_OPTIONS,
  LOAN_TYPE_OPTIONS,
} from '@/utils/credit.helpers';

const { Title, Text } = Typography;

export default function LoansListPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [groups, setGroups] = useState<TerritoryGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [search, setSearch] = useState<string>('');
  const [loanType, setLoanType] = useState<LoanType | undefined>();
  const [durationType, setDurationType] = useState<
    LoanDurationType | undefined
  >();
  const [statusFilter, setStatusFilter] = useState<LoanStatus | undefined>();
  const [groupId, setGroupId] = useState<string | undefined>();

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const [editForm] = Form.useForm();

  const watchedEditStatus = Form.useWatch<LoanStatus>('status', editForm);
  const watchedEditDisbursementDate = Form.useWatch<string>(
    'disbursementDate',
    editForm,
  );
  const watchedEditDurationType = Form.useWatch<LoanDurationType>(
    'durationType',
    editForm,
  );

  // Khi cập nhật khoản vay cán bộ chọn "Đã giải ngân" thì tự lấy ngày hiện tại điền vào và cho phép chỉnh sửa ngày
  useEffect(() => {
    if (watchedEditStatus === 'DA_GIAI_NGAN' && editingLoan) {
      const currentVal = editForm.getFieldValue('disbursementDate') as
        | string
        | undefined;
      if (!currentVal?.trim()) {
        editForm.setFieldValue('disbursementDate', getTodayDDMMYYYY());
      }
    }
  }, [watchedEditStatus, editingLoan, editForm]);

  const loadLoans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (loanType) params.set('loanType', loanType);
      if (durationType) params.set('durationType', durationType);
      if (statusFilter) params.set('status', statusFilter);
      if (groupId) params.set('territoryGroupId', groupId);

      const [loanRes, groupRes] = await Promise.all([
        apiRequest<{ items: Loan[] }>(`/loans?${params.toString()}`),
        apiRequest<TerritoryGroup[]>('/territories/groups'),
      ]);
      setLoans(loanRes?.items ?? []);
      setGroups(groupRes ?? []);
    } catch (err) {
      message.error(
        err instanceof Error
          ? err.message
          : 'Không thể tải danh sách khoản vay',
      );
    } finally {
      setLoading(false);
    }
  }, [message, search, loanType, durationType, statusFilter, groupId]);

  useEffect(() => {
    void loadLoans();
  }, [loadLoans]);

  const openEditModal = (loan: Loan) => {
    setEditingLoan(loan);
    editForm.setFieldsValue({
      status: loan.status ?? 'DANG_CHUAN_BI_HO_SO',
      indentureNumber: loan.indentureNumber ?? '',
      loanDate: formatDateDisplay(loan.loanDate),
      disbursementDate: loan.disbursementDate
        ? formatDateDisplay(loan.disbursementDate)
        : '',
      loanAmount: Number(loan.loanAmount),
      durationType: loan.durationType,
      interestRate: Number(loan.interestRate),
      mortgageContractNumber: loan.mortgageContractNumber ?? '',
      committeeNotarizationDate: loan.committeeNotarizationDate
        ? formatDateDisplay(loan.committeeNotarizationDate)
        : '',
      mortgageContractTermDate: loan.mortgageContractTermDate
        ? formatDateDisplay(loan.mortgageContractTermDate)
        : '',
    });
  };

  const handleSaveEdit = async (values: {
    status: LoanStatus;
    indentureNumber?: string;
    loanDate: string;
    disbursementDate?: string;
    loanAmount: number;
    durationType: LoanDurationType;
    interestRate: number;
    mortgageContractNumber?: string;
    committeeNotarizationDate?: string;
    mortgageContractTermDate?: string;
  }) => {
    if (!editingLoan) return;
    setEditSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        status: values.status,
        indentureNumber: values.indentureNumber?.trim() || null,
        loanDate: values.loanDate,
        disbursementDate: values.disbursementDate?.trim() || null,
        loanAmount: Number(values.loanAmount),
        durationType: values.durationType,
        interestRate: Number(values.interestRate),
      };

      if (editingLoan.loanType === 'THE_CHAP') {
        payload.mortgageContractNumber =
          values.mortgageContractNumber?.trim() || null;
        payload.committeeNotarizationDate =
          values.committeeNotarizationDate?.trim() || null;
        payload.mortgageContractTermDate =
          values.mortgageContractTermDate?.trim() || null;
      }

      const updated = await apiRequest<Loan>(`/loans/${editingLoan.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      message.success('Đã cập nhật thông tin và trạng thái khoản vay!');
      setEditingLoan(null);
      if (selectedLoan && selectedLoan.id === updated.id) {
        setSelectedLoan(updated);
      }
      await loadLoans();
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : 'Lỗi khi cập nhật khoản vay',
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/loans/${id}`, { method: 'DELETE' });
      message.success('Đã xóa hồ sơ khoản vay');
      await loadLoans();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Không thể xóa');
    }
  };

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
            Quản lý Danh sách Khoản vay
          </Title>
          <Text style={{ color: '#9CA3AF' }}>
            Danh sách các hồ sơ vay vốn do cán bộ tín dụng trực tiếp quản lý •
            Hỗ trợ cập nhật trạng thái, ngày giải ngân, số khế ước & ngày chứng
            thực
          </Text>
        </div>

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
      </div>

      <Card>
        <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
          <Col xs={24} md={7}>
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: '#6B7280' }} />}
              placeholder="Tìm Số khế ước, Họ tên, CCCD, Số HĐTC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Loại vay"
              value={loanType}
              onChange={(v) => setLoanType(v)}
              options={LOAN_TYPE_OPTIONS}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Thời hạn vay"
              value={durationType}
              onChange={(v) => setDurationType(v)}
              options={LOAN_DURATION_OPTIONS}
            />
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Trạng thái khoản vay"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              options={LOAN_STATUS_OPTIONS}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Nhóm Địa bàn (Xã)"
              value={groupId}
              onChange={(v) => setGroupId(v)}
              options={groups.map((g) => ({ label: g.name, value: g.id }))}
            />
          </Col>
        </Row>

        <Table<Loan>
          rowKey="id"
          loading={loading}
          dataSource={loans}
          columns={[
            {
              title: 'Số khế ước / HĐTC',
              key: 'indenture',
              render: (_, r) => (
                <div>
                  {r.indentureNumber ? (
                    <Tag color="cyan" style={{ fontWeight: 700 }}>
                      KƯ: {r.indentureNumber}
                    </Tag>
                  ) : (
                    <Tag color="default">Chưa nhập số KƯ</Tag>
                  )}
                  {r.mortgageContractNumber && (
                    <div
                      style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}
                    >
                      HĐTC: {r.mortgageContractNumber}
                    </div>
                  )}
                </div>
              ),
            },
            {
              title: 'Người vay & Địa bàn',
              key: 'borrower',
              render: (_, r) => (
                <div>
                  <Text style={{ fontWeight: 600, color: '#F9FAFB' }}>
                    {r.borrower?.fullName}
                  </Text>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                    Số GT: {r.borrower?.idNumber} ({r.borrower?.birthYear})
                  </div>
                  <div style={{ fontSize: 12, color: '#38BDF8' }}>
                    {r.borrower?.address}
                  </div>
                </div>
              ),
            },
            {
              title: 'Loại & Thời hạn',
              key: 'type',
              render: (_, r) => (
                <Space orientation="vertical" size={4}>
                  <Tag color={r.loanType === 'THE_CHAP' ? 'green' : 'blue'}>
                    {r.loanType === 'THE_CHAP' ? 'Thế chấp' : 'Tín chấp'}
                  </Tag>
                  <Tag color="purple">
                    {r.durationType === 'NGAN_HAN'
                      ? 'Ngắn hạn (12 tháng)'
                      : 'Trung hạn (24 tháng)'}
                  </Tag>
                </Space>
              ),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              align: 'center',
              render: (v: LoanStatus) => {
                const meta = getLoanStatusMeta(v);
                return (
                  <Tag color={meta.color} style={{ fontWeight: 600 }}>
                    {meta.label}
                  </Tag>
                );
              },
            },
            {
              title: 'Số tiền vay & Định giá',
              key: 'amount',
              align: 'right',
              render: (_, r) => (
                <div>
                  <Text
                    style={{
                      color: '#10B981',
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                  >
                    {formatVND(r.loanAmount)}
                  </Text>
                  {r.loanType === 'THE_CHAP' && (
                    <div style={{ fontSize: 12, color: '#F59E0B' }}>
                      Định giá: {formatVND(r.totalCollateralValuation)}
                    </div>
                  )}
                </div>
              ),
            },
            {
              title: 'Lãi suất',
              dataIndex: 'interestRate',
              align: 'center',
              render: (v: number | string) => <Tag color="gold">{v}%</Tag>,
            },
            {
              title: 'Giải ngân → Tới hạn',
              key: 'dates',
              render: (_, r) => (
                <div style={{ fontSize: 13 }}>
                  <div>
                    GN:{' '}
                    {r.disbursementDate
                      ? formatDateDisplay(r.disbursementDate)
                      : 'Chưa giải ngân'}
                  </div>
                  <div style={{ color: '#F59E0B', fontWeight: 600 }}>
                    ĐH: {r.dueDate ? formatDateDisplay(r.dueDate) : '—'}
                  </div>
                </div>
              ),
            },
            {
              title: 'Thao tác',
              width: 130,
              align: 'right',
              render: (_, r) => (
                <Space>
                  <Button
                    type="text"
                    size="small"
                    title="Xem chi tiết"
                    icon={<EyeOutlined />}
                    onClick={() => setSelectedLoan(r)}
                  />
                  <Button
                    type="text"
                    size="small"
                    title="Cập nhật trạng thái / Giải ngân / Sửa"
                    icon={<EditOutlined style={{ color: '#38BDF8' }} />}
                    onClick={() => openEditModal(r)}
                  />
                  <Popconfirm
                    title="Xóa hồ sơ khoản vay này?"
                    onConfirm={() => handleDelete(r.id)}
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

      {/* MODAL CẬP NHẬT KHOẢN VAY & TRẠNG THÁI GIẢI NGÂN */}
      <Modal
        title={
          editingLoan
            ? `Cập nhật Khoản vay – Khách hàng: ${editingLoan.borrower?.fullName}`
            : 'Cập nhật Khoản vay'
        }
        open={Boolean(editingLoan)}
        onCancel={() => setEditingLoan(null)}
        onOk={() => editForm.submit()}
        confirmLoading={editSubmitting}
        okText="Lưu cập nhật"
        width={720}
      >
        {editingLoan && (
          <Form form={editForm} layout="vertical" onFinish={handleSaveEdit}>
            <div
              style={{
                background: '#161F30',
                border: '1px solid #283548',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div>
                <Text style={{ color: '#9CA3AF' }}>Loại khoản vay: </Text>
                <Tag
                  color={editingLoan.loanType === 'THE_CHAP' ? 'green' : 'blue'}
                >
                  {editingLoan.loanType === 'THE_CHAP'
                    ? 'Vay Thế chấp'
                    : 'Vay Tín chấp'}
                </Tag>
              </div>
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  editForm.setFieldsValue({
                    status: 'DA_GIAI_NGAN',
                    disbursementDate: getTodayDDMMYYYY(),
                  });
                  message.info(
                    'Đã chuyển trạng thái sang Đã giải ngân và điền ngày giải ngân hôm nay',
                  );
                }}
              >
                Chọn Giải ngân (Tự điền ngày hôm nay)
              </Button>
            </div>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Trạng thái khoản vay"
                  name="status"
                  rules={[{ required: true }]}
                >
                  <Select options={LOAN_STATUS_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={
                    editingLoan.loanType === 'THE_CHAP'
                      ? 'Số khế ước (Bắt buộc)'
                      : 'Số khế ước (Nhập khi giải ngân)'
                  }
                  name="indentureNumber"
                  rules={
                    editingLoan.loanType === 'THE_CHAP'
                      ? [{ required: true, message: 'Nhập số khế ước' }]
                      : []
                  }
                >
                  <Input placeholder="VD: KU-2026-001" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={8}>
                <Form.Item
                  label="Ngày vay (dd/mm/yyyy)"
                  name="loanDate"
                  rules={[{ required: true, message: 'Nhập ngày vay' }]}
                >
                  <DateInputDDMMYYYY />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Ngày giải ngân (dd/mm/yyyy)"
                  name="disbursementDate"
                >
                  <DateInputDDMMYYYY placeholder="Tự lấy hôm nay khi giải ngân" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="Ngày tới hạn trả (Tự tính)">
                  <Input
                    disabled
                    value={calculateDueDateDisplay(
                      watchedEditDisbursementDate,
                      watchedEditDurationType,
                    )}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={8}>
                <Form.Item
                  label="Số tiền vay (VNĐ)"
                  name="loanAmount"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={1_000_000}
                    step={5_000_000}
                    formatter={(v) =>
                      `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Thời hạn vay"
                  name="durationType"
                  rules={[{ required: true }]}
                >
                  <Select options={LOAN_DURATION_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Lãi suất (%)"
                  name="interestRate"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={0.05}
                    suffix="%"
                  />
                </Form.Item>
              </Col>

              {editingLoan.loanType === 'THE_CHAP' && (
                <>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      label="Số hợp đồng thế chấp"
                      name="mortgageContractNumber"
                      rules={[
                        {
                          required: true,
                          message: 'Nhập số hợp đồng thế chấp',
                        },
                      ]}
                    >
                      <Input placeholder="Số HĐ thế chấp" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      label="Ngày chứng thực Ủy ban (dd/mm/yyyy)"
                      name="committeeNotarizationDate"
                    >
                      <DateInputDDMMYYYY placeholder="Nhập ngày chứng thực UB" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      label="Thời hạn HĐ thế chấp (dd/mm/yyyy)"
                      name="mortgageContractTermDate"
                    >
                      <DateInputDDMMYYYY />
                    </Form.Item>
                  </Col>
                </>
              )}
            </Row>
          </Form>
        )}
      </Modal>

      {/* DRAWER XEM CHI TIẾT HỒ SƠ KHOẢN VAY */}
      <Drawer
        title={
          selectedLoan
            ? `Chi tiết Hồ sơ Khoản vay: ${selectedLoan.indentureNumber || 'Chưa cấp số KƯ'}`
            : 'Chi tiết Khoản vay'
        }
        size="large"
        open={Boolean(selectedLoan)}
        onClose={() => setSelectedLoan(null)}
        extra={
          selectedLoan && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => openEditModal(selectedLoan)}
            >
              Chỉnh sửa / Giải ngân
            </Button>
          )
        }
      >
        {selectedLoan && (
          <Space orientation="vertical" size={20} style={{ width: '100%' }}>
            <Descriptions
              title="1. Thông tin Người vay & Người thừa kế"
              bordered
              size="small"
              column={2}
            >
              <Descriptions.Item label="Họ tên người vay">
                <strong>{selectedLoan.borrower.fullName}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Mã thành viên">
                {selectedLoan.borrower.memberCode || 'Thành viên mới'}
              </Descriptions.Item>
              <Descriptions.Item label="Số giấy tờ (12 số)">
                {selectedLoan.borrower.idNumber} (
                {getIdTypeLabel(selectedLoan.borrower.idType)})
              </Descriptions.Item>
              <Descriptions.Item label="Nơi cấp & Ngày cấp">
                {selectedLoan.borrower.issuingAuthority} (
                {formatDateDisplay(selectedLoan.borrower.issueDate)})
              </Descriptions.Item>
              <Descriptions.Item label="Giới tính & Năm sinh">
                {selectedLoan.borrower.gender === 'NAM' ? 'Nam' : 'Nữ'} -{' '}
                {selectedLoan.borrower.birthYear}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ địa bàn">
                {selectedLoan.borrower.address}
              </Descriptions.Item>
              {selectedLoan.borrower.heir && (
                <Descriptions.Item label="Người thừa kế" span={2}>
                  <strong>{selectedLoan.borrower.heir.fullName}</strong> (Quan
                  hệ:{' '}
                  <Tag color="gold">
                    {getHeirRelationshipLabel(
                      selectedLoan.borrower.heir.relationship,
                    )}
                  </Tag>
                  ) • Số GT: {selectedLoan.borrower.heir.idNumber} • Địa chỉ:{' '}
                  {selectedLoan.borrower.heir.address}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Descriptions
              title="2. Thông tin Khoản vay & Trạng thái"
              bordered
              size="small"
              column={2}
            >
              <Descriptions.Item label="Số khế ước">
                {selectedLoan.indentureNumber ? (
                  <Tag color="cyan">{selectedLoan.indentureNumber}</Tag>
                ) : (
                  <Tag color="default">Chưa nhập số khế ước</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái khoản vay">
                <Tag color={getLoanStatusMeta(selectedLoan.status).color}>
                  {getLoanStatusMeta(selectedLoan.status).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Số tiền vay">
                <strong style={{ color: '#10B981' }}>
                  {formatVND(selectedLoan.loanAmount)}
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Lãi suất">
                <Tag color="gold">{selectedLoan.interestRate}%</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Loại vay & Thời hạn">
                {selectedLoan.loanType === 'THE_CHAP' ? 'Thế chấp' : 'Tín chấp'}{' '}
                -{' '}
                {selectedLoan.durationType === 'NGAN_HAN'
                  ? 'Ngắn hạn (12 tháng)'
                  : 'Trung hạn (24 tháng)'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày vay / Giải ngân">
                {formatDateDisplay(selectedLoan.loanDate)} /{' '}
                {selectedLoan.disbursementDate
                  ? formatDateDisplay(selectedLoan.disbursementDate)
                  : 'Chưa giải ngân'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tới hạn trả" span={2}>
                <strong style={{ color: '#F59E0B' }}>
                  {selectedLoan.dueDate
                    ? formatDateDisplay(selectedLoan.dueDate)
                    : 'Chưa xác định (Tính từ ngày giải ngân)'}
                </strong>
              </Descriptions.Item>
              {selectedLoan.loanType === 'THE_CHAP' && (
                <>
                  <Descriptions.Item label="Số HĐ Thế chấp">
                    {selectedLoan.mortgageContractNumber || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Chứng thực UB & Thời hạn HĐ">
                    {selectedLoan.committeeNotarizationDate
                      ? formatDateDisplay(
                          selectedLoan.committeeNotarizationDate,
                        )
                      : 'Chưa nhập'}{' '}
                    → {formatDateDisplay(selectedLoan.mortgageContractTermDate)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tổng định giá tài sản">
                    <strong style={{ color: '#F59E0B' }}>
                      {formatVND(selectedLoan.totalCollateralValuation)}
                    </strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="Hạn mức tối đa (70%)">
                    {formatVND(selectedLoan.maxAllowedLoanAmount)}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            {selectedLoan.collateralAssets &&
              selectedLoan.collateralAssets.length > 0 && (
                <>
                  <Divider titlePlacement="left" style={{ margin: '4px 0' }}>
                    3. Danh sách Tài sản Bảo đảm (
                    {selectedLoan.collateralAssets.length} tài sản)
                  </Divider>
                  {selectedLoan.collateralAssets.map((asset, idx) => (
                    <Card
                      key={asset.id ?? idx}
                      size="small"
                      title={`Tài sản #${idx + 1}: Mã ${asset.assetCode} – ${getCertificateTypeLabel(asset.certificateType)}: ${asset.certificateNumber}`}
                    >
                      <Row gutter={[12, 6]}>
                        <Col span={24}>
                          <Text type="secondary">Loại tài sản:</Text>{' '}
                          <strong>
                            {getCollateralAssetTypeLabel(asset.assetType)}
                          </strong>
                        </Col>
                        <Col span={12}>
                          <Text type="secondary">Thửa / Tờ:</Text>{' '}
                          {asset.plotNumber} / {asset.mapSheetNumber}
                        </Col>
                        <Col span={12}>
                          <Text type="secondary">Diện tích:</Text>{' '}
                          <strong>{Number(asset.area)} m²</strong>
                        </Col>
                        <Col span={24}>
                          <Text type="secondary">Địa chỉ thửa đất:</Text>{' '}
                          {asset.address}
                        </Col>
                        <Col span={12}>
                          <Text type="secondary">Chủ sở hữu:</Text>{' '}
                          <Tag color="blue">
                            {getCollateralOwnerTypeLabel(asset.ownerType)}
                          </Tag>
                        </Col>
                        <Col span={12}>
                          <Text type="secondary">Thời hạn sử dụng:</Text>{' '}
                          {asset.usageTerm}
                        </Col>
                        {asset.guarantor && (
                          <Col span={24}>
                            <Tag color="gold">
                              Người bảo lãnh: {asset.guarantor.fullName} (Số GT:{' '}
                              {asset.guarantor.idNumber} -{' '}
                              {asset.guarantor.address})
                            </Tag>
                          </Col>
                        )}
                      </Row>
                    </Card>
                  ))}
                </>
              )}

            {selectedLoan.loanType === 'THE_CHAP' &&
              selectedLoan.valuationItems &&
              selectedLoan.valuationItems.length > 0 && (
                <>
                  <Divider titlePlacement="left" style={{ margin: '4px 0' }}>
                    4. Bảng Định giá Tài sản Thế chấp (Ngày:{' '}
                    {formatDateDisplay(selectedLoan.valuationDate)} •{' '}
                    {getValuationTypeLabel(selectedLoan.valuationType)})
                  </Divider>
                  <Table<CollateralValuationItem>
                    rowKey={(r, i) => r.id ?? String(i)}
                    size="small"
                    pagination={false}
                    dataSource={selectedLoan.valuationItems}
                    columns={[
                      {
                        title: 'Thửa / Tờ',
                        key: 'plot',
                        render: (_, r) =>
                          `${r.plotNumber} / ${r.mapSheetNumber}`,
                      },
                      {
                        title: 'DT sổ (m²)',
                        dataIndex: 'area',
                        render: (v) => `${Number(v)} m²`,
                      },
                      {
                        title: 'DT thực tế',
                        dataIndex: 'actualArea',
                        render: (v) => (v ? `${Number(v)} m²` : 'Theo DT sổ'),
                      },
                      {
                        title: 'Mức giá / Đơn giá',
                        key: 'unitPrice',
                        render: (_, r) => (
                          <div>
                            <div>{formatVND(r.unitPrice)}/m²</div>
                            {r.fundLandCategory && (
                              <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
                                {getFundLandCategoryLabel(r.fundLandCategory)}
                              </Text>
                            )}
                          </div>
                        ),
                      },
                      {
                        title: 'Giá tiền (Làm tròn xuống)',
                        dataIndex: 'valuationAmount',
                        align: 'right',
                        render: (v) => (
                          <strong style={{ color: '#10B981' }}>
                            {formatVND(v)}
                          </strong>
                        ),
                      },
                      {
                        title: 'Ghi chú',
                        dataIndex: 'note',
                        render: (v) => v || '—',
                      },
                    ]}
                  />
                </>
              )}

            {selectedLoan.relatedPersons &&
              selectedLoan.relatedPersons.length > 0 && (
                <>
                  <Divider titlePlacement="left" style={{ margin: '4px 0' }}>
                    5. Danh sách Người liên quan (
                    {selectedLoan.relatedPersons.length} người)
                  </Divider>
                  {selectedLoan.relatedPersons.map((rp, idx) => (
                    <Card key={rp.id ?? idx} size="small">
                      <Space wrap>
                        <strong>{rp.fullName}</strong>
                        <Tag color="purple">
                          Quan hệ:{' '}
                          {getRelatedPersonRelationshipLabel(rp.relationship)}
                        </Tag>
                        <Tag color="blue">
                          {getIdTypeLabel(rp.idType)}: {rp.idNumber}
                        </Tag>
                        <Text type="secondary">Địa chỉ: {rp.address}</Text>
                      </Space>
                    </Card>
                  ))}
                </>
              )}

            {selectedLoan.loanPlan && (
              <Descriptions
                title="6. Phương án Vay vốn"
                bordered
                size="small"
                column={2}
              >
                <Descriptions.Item label="Mục đích vay vốn" span={2}>
                  {selectedLoan.loanPlan.loanPurpose}
                </Descriptions.Item>
                <Descriptions.Item label="Tổng nhu cầu vốn của phương án">
                  {formatVND(selectedLoan.loanPlan.totalCapitalNeed)}
                </Descriptions.Item>
                <Descriptions.Item label="Vốn vay Quỹ">
                  {formatVND(selectedLoan.loanPlan.fundLoanCapital)}
                </Descriptions.Item>
                <Descriptions.Item label="Vốn tự có">
                  {formatVND(selectedLoan.loanPlan.ownCapital)}
                </Descriptions.Item>
                <Descriptions.Item label="Tổng nguồn thu">
                  {formatVND(selectedLoan.loanPlan.totalRevenue)}
                </Descriptions.Item>
                <Descriptions.Item label="Lợi nhuận dự kiến" span={2}>
                  <strong style={{ color: '#10B981' }}>
                    {formatVND(selectedLoan.loanPlan.profit)}
                  </strong>
                </Descriptions.Item>
              </Descriptions>
            )}
          </Space>
        )}
      </Drawer>
    </Space>
  );
}
