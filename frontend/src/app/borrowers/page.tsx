'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import { DateInputDDMMYYYY } from '@/components/common/DateInputDDMMYYYY';
import {
  AutoGenderAndBirthYearFields,
  AutoIssuingAuthorityField,
} from '@/components/common/PersonAutoFields';
import {
  Borrower,
  Hamlet,
  HeirRelationship,
  IdentityCardType,
  TerritoryGroup,
} from '@/types/credit.types';
import { apiRequest } from '@/utils/api-client';
import {
  formatDateDisplay,
  getHeirRelationshipLabel,
  HEIR_RELATIONSHIP_OPTIONS,
  ID_TYPE_OPTIONS,
} from '@/utils/credit.helpers';

const { Title, Text } = Typography;

export default function BorrowersPage() {
  const { message } = App.useApp();
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [hamlets, setHamlets] = useState<Hamlet[]>([]);
  const [groups, setGroups] = useState<TerritoryGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingBorrower, setEditingBorrower] = useState<Borrower | null>(null);
  const [hasHeir, setHasHeir] = useState<boolean>(false);
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);
  const [form] = Form.useForm();

  const watchedIdNumber = Form.useWatch<string>('idNumber', form);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (selectedGroupId) params.set('territoryGroupId', selectedGroupId);

      const [bRes, hRes, gRes] = await Promise.all([
        apiRequest<{ items: Borrower[] }>(`/borrowers?${params.toString()}`),
        apiRequest<Hamlet[]>('/territories/hamlets'),
        apiRequest<TerritoryGroup[]>('/territories/groups'),
      ]);

      setBorrowers(bRes?.items ?? []);
      setHamlets(hRes ?? []);
      setGroups(gRes ?? []);
    } catch (err) {
      message.error(
        err instanceof Error
          ? err.message
          : 'Không thể tải danh sách khách hàng',
      );
    } finally {
      setLoading(false);
    }
  }, [message, search, selectedGroupId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Kiểm tra trùng số giấy tờ 12 số (có debounce 300ms tránh lag khi gõ)
  useEffect(() => {
    if (!watchedIdNumber || !/^\d{12}$/.test(watchedIdNumber.trim())) {
      setDuplicateAlert(null);
      return;
    }
    if (
      editingBorrower &&
      editingBorrower.idNumber === watchedIdNumber.trim()
    ) {
      setDuplicateAlert(null);
      return;
    }

    const timer = setTimeout(() => {
      apiRequest<{
        exists: boolean;
        existingBorrower?: { fullName: string; idNumber: string };
      }>(`/borrowers/check-id/${watchedIdNumber.trim()}`)
        .then((res) => {
          if (res.exists && res.existingBorrower) {
            setDuplicateAlert(
              `Cảnh báo: Đã tồn tại khách hàng "${res.existingBorrower.fullName}" với số giấy tờ "${res.existingBorrower.idNumber}". Hệ thống không cho phép tạo trùng!`,
            );
          } else {
            setDuplicateAlert(null);
          }
        })
        .catch(() => setDuplicateAlert(null));
    }, 300);

    return () => clearTimeout(timer);
  }, [watchedIdNumber, editingBorrower]);

  const handleCopyBorrowerAddressToHeir = () => {
    const selectedHamletId = form.getFieldValue('hamletId') as
      | string
      | undefined;
    const foundHamlet = hamlets.find((h) => h.id === selectedHamletId);
    if (!foundHamlet) {
      message.warning(
        'Vui lòng chọn Địa chỉ (Ấp) của người vay trước khi sao chép sang người thừa kế',
      );
      return;
    }
    const borrowerAddress = foundHamlet.fullAddress ?? foundHamlet.name;
    form.setFieldValue(['heir', 'address'], borrowerAddress);
    message.success('Đã sao chép địa chỉ người vay sang người thừa kế');
  };

  const openCreate = () => {
    setEditingBorrower(null);
    setHasHeir(false);
    setDuplicateAlert(null);
    form.resetFields();
    form.setFieldsValue({
      idType: 'CAN_CUOC',
      heir: {
        idType: 'CAN_CUOC',
        relationship: 'VO',
      },
    });
    setModalOpen(true);
  };

  const openEdit = (record: Borrower) => {
    setEditingBorrower(record);
    setDuplicateAlert(null);
    const heirPresent = Boolean(record.heir);
    setHasHeir(heirPresent);

    form.setFieldsValue({
      fullName: record.fullName,
      idType: record.idType,
      idNumber: record.idNumber,
      issueDate: formatDateDisplay(record.issueDate),
      expiryDate: record.expiryDate
        ? formatDateDisplay(record.expiryDate)
        : '',
      hamletId: record.hamletId,
      memberCode: record.memberCode ?? '',
      phone: record.phone ?? '',
      heir: record.heir
        ? {
            fullName: record.heir.fullName,
            idType: record.heir.idType,
            idNumber: record.heir.idNumber,
            issueDate: formatDateDisplay(record.heir.issueDate),
            expiryDate: record.heir.expiryDate
              ? formatDateDisplay(record.heir.expiryDate)
              : '',
            address: record.heir.address,
            phone: record.heir.phone ?? '',
            relationship: record.heir.relationship,
          }
        : {
            idType: 'CAN_CUOC',
            relationship: 'VO',
          },
    });
    setModalOpen(true);
  };

  const handleSave = async (values: {
    fullName: string;
    idType: IdentityCardType;
    idNumber: string;
    issueDate: string;
    expiryDate?: string;
    hamletId: string;
    memberCode?: string;
    phone?: string;
    heir?: {
      fullName: string;
      idType: IdentityCardType;
      idNumber: string;
      issueDate: string;
      expiryDate?: string;
      address: string;
      phone?: string;
      relationship: HeirRelationship;
    };
  }) => {
    if (duplicateAlert) {
      message.error(duplicateAlert);
      return;
    }

    const payload = {
      fullName: values.fullName,
      idType: values.idType,
      idNumber: values.idNumber,
      issueDate: values.issueDate,
      expiryDate: values.expiryDate || undefined,
      hamletId: values.hamletId,
      memberCode: values.memberCode || undefined,
      phone: values.phone || undefined,
      heir: hasHeir && values.heir ? values.heir : null,
    };

    try {
      if (editingBorrower) {
        await apiRequest(`/borrowers/${editingBorrower.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        message.success('Đã cập nhật thông tin khách hàng');
      } else {
        await apiRequest('/borrowers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        message.success('Đã thêm khách hàng mới');
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : 'Lỗi lưu thông tin khách hàng',
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/borrowers/${id}`, { method: 'DELETE' });
      message.success('Đã xóa khách hàng');
      await loadData();
    } catch (err) {
      message.error(
        err instanceof Error
          ? err.message
          : 'Không thể xóa khách hàng đã có hồ sơ vay',
      );
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
            Quản lý Khách hàng (Người vay & Người thừa kế)
          </Title>
          <Text style={{ color: '#9CA3AF' }}>
            Tự động nhận diện Giới tính, Năm sinh, Nơi cấp từ 12 số giấy tờ và
            kiểm tra trùng lặp khách hàng
          </Text>
        </div>

        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm Khách hàng mới
        </Button>
      </div>

      <Card>
        <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
          <Col xs={24} md={12}>
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: '#6B7280' }} />}
              placeholder="Tìm theo Họ tên, Số giấy tờ (12 số), Mã thành viên, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Lọc theo Nhóm Địa bàn (Cấp Xã)"
              value={selectedGroupId}
              onChange={(v) => setSelectedGroupId(v)}
              options={groups.map((g) => ({ label: g.name, value: g.id }))}
            />
          </Col>
        </Row>

        <Table<Borrower>
          rowKey="id"
          loading={loading}
          dataSource={borrowers}
          columns={[
            {
              title: 'Họ tên & Mã TV',
              key: 'name',
              render: (_, r) => (
                <div>
                  <Text style={{ fontWeight: 600, color: '#F9FAFB' }}>
                    {r.fullName}
                  </Text>
                  <div>
                    <Tag color={r.memberCode ? 'cyan' : 'default'}>
                      {r.memberCode
                        ? `Mã TV: ${r.memberCode}`
                        : 'Thành viên mới'}
                    </Tag>
                  </div>
                </div>
              ),
            },
            {
              title: 'Giấy tờ định danh (12 số)',
              key: 'idCard',
              render: (_, r) => (
                <div>
                  <Tag color="blue" style={{ fontWeight: 600 }}>
                    {r.idNumber}
                  </Tag>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                    {r.idType === 'CAN_CUOC' ? 'Căn cước' : 'CCCD'} •{' '}
                    {r.issuingAuthority}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                    Cấp ngày: {formatDateDisplay(r.issueDate)}
                    {r.expiryDate
                      ? ` • Hạn: ${formatDateDisplay(r.expiryDate)}`
                      : ''}
                  </div>
                </div>
              ),
            },
            {
              title: 'Giới tính & Năm sinh',
              key: 'genderBirth',
              render: (_, r) => (
                <Space>
                  <Tag color={r.gender === 'NAM' ? 'geekblue' : 'magenta'}>
                    {r.gender === 'NAM' ? 'Nam' : 'Nữ'}
                  </Tag>
                  <Tag color="green">{r.birthYear}</Tag>
                </Space>
              ),
            },
            {
              title: 'Địa chỉ (Ấp – Xã – Tỉnh Vĩnh Long)',
              dataIndex: 'address',
              render: (v: string, r) => (
                <div>
                  <div style={{ color: '#D1D5DB' }}>{v}</div>
                  {r.phone && (
                    <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
                      SĐT: {r.phone}
                    </Text>
                  )}
                </div>
              ),
            },
            {
              title: 'Người thừa kế (Tối đa 1)',
              key: 'heir',
              render: (_, r) =>
                r.heir ? (
                  <div>
                    <Text style={{ fontWeight: 600, color: '#10B981' }}>
                      {r.heir.fullName}
                    </Text>{' '}
                    <Tag color="gold">
                      {getHeirRelationshipLabel(r.heir.relationship)}
                    </Tag>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                      Số GT: {r.heir.idNumber} ({r.heir.birthYear})
                    </div>
                  </div>
                ) : (
                  <Text type="secondary">Không có</Text>
                ),
            },
            {
              title: 'Thao tác',
              width: 100,
              align: 'right',
              render: (_, r) => (
                <Space>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(r)}
                  />
                  <Popconfirm
                    title="Xóa khách hàng này?"
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

      <Modal
        title={
          editingBorrower
            ? 'Cập nhật Thông tin Người vay & Người thừa kế'
            : 'Thêm mới Người vay & Người thừa kế'
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="Lưu khách hàng"
        width={840}
      >
        {duplicateAlert && (
          <Alert
            type="error"
            showIcon
            title={duplicateAlert}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Divider titlePlacement="left" style={{ marginTop: 0 }}>
            1. Thông tin Người vay
          </Divider>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Họ tên người vay"
                name="fullName"
                rules={[
                  { required: true, message: 'Vui lòng nhập họ tên người vay' },
                ]}
              >
                <Input placeholder="Nhập họ và tên người vay" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item
                label="Mã thành viên (Có thể bỏ trống)"
                name="memberCode"
              >
                <Input placeholder="Thành viên mới bỏ trống" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item label="Số điện thoại (Có thể bỏ trống)" name="phone">
                <Input placeholder="SĐT" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                label="Loại giấy tờ người vay"
                name="idType"
                rules={[{ required: true }]}
              >
                <Select options={ID_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Số giấy tờ (12 số - Unique)"
                name="idNumber"
                rules={[
                  { required: true, message: 'Vui lòng nhập 12 số giấy tờ' },
                  {
                    pattern: /^\d{12}$/,
                    message: 'Phải gồm đúng 12 chữ số',
                  },
                ]}
              >
                <Input maxLength={12} placeholder="VD: 084084123456" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <AutoIssuingAuthorityField form={form} idTypePath="idType" />
            </Col>

            <Col xs={24} sm={6}>
              <Form.Item
                label="Ngày cấp (dd/mm/yyyy)"
                name="issueDate"
                rules={[{ required: true, message: 'Chọn ngày cấp' }]}
              >
                <DateInputDDMMYYYY />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item
                label="Thời hạn giấy tờ (dd/mm/yyyy)"
                name="expiryDate"
              >
                <DateInputDDMMYYYY placeholder="Có thể bỏ trống" />
              </Form.Item>
            </Col>

            <AutoGenderAndBirthYearFields
              form={form}
              idNumberPath="idNumber"
              colSpan={6}
            />

            <Col xs={24}>
              <Form.Item
                label="Địa chỉ người vay (Chọn từ Bảng Địa bàn: Ấp – Xã – Tỉnh Vĩnh Long)"
                name="hamletId"
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng chọn địa bàn Ấp của người vay',
                  },
                ]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Chọn Ấp thuộc Xã – Tỉnh Vĩnh Long"
                  options={hamlets.map((h) => ({
                    label: h.fullAddress ?? h.name,
                    value: h.id,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="left">
            <Space>
              <span>2. Thông tin Người thừa kế (Tối đa 1 người)</span>
              <Switch
                checked={hasHeir}
                onChange={setHasHeir}
                checkedChildren="Có người thừa kế"
                unCheckedChildren="Không có"
              />
            </Space>
          </Divider>

          {hasHeir && (
            <Row gutter={16}>
              <Col xs={24} sm={10}>
                <Form.Item
                  label="Họ tên người thừa kế"
                  name={['heir', 'fullName']}
                  rules={[
                    {
                      required: true,
                      message: 'Nhập họ tên người thừa kế',
                    },
                  ]}
                >
                  <Input placeholder="Nhập họ và tên người thừa kế" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={7}>
                <Form.Item
                  label="Quan hệ với người vay"
                  name={['heir', 'relationship']}
                  rules={[{ required: true }]}
                >
                  <Select options={HEIR_RELATIONSHIP_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={7}>
                <Form.Item
                  label="SĐT người thừa kế (Tùy chọn)"
                  name={['heir', 'phone']}
                >
                  <Input placeholder="Có thể bỏ trống" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={8}>
                <Form.Item
                  label="Loại giấy tờ người thừa kế"
                  name={['heir', 'idType']}
                  rules={[{ required: true }]}
                >
                  <Select options={ID_TYPE_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Số giấy tờ (12 số)"
                  name={['heir', 'idNumber']}
                  rules={[
                    { required: true, message: 'Nhập 12 số giấy tờ' },
                    { pattern: /^\d{12}$/, message: 'Đúng 12 chữ số' },
                  ]}
                >
                  <Input maxLength={12} placeholder="VD: 084188123456" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <AutoIssuingAuthorityField
                  form={form}
                  idTypePath={['heir', 'idType']}
                />
              </Col>

              <Col xs={24} sm={6}>
                <Form.Item
                  label="Ngày cấp (dd/mm/yyyy)"
                  name={['heir', 'issueDate']}
                  rules={[{ required: true, message: 'Chọn ngày cấp' }]}
                >
                  <DateInputDDMMYYYY />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item
                  label="Thời hạn giấy tờ (dd/mm/yyyy)"
                  name={['heir', 'expiryDate']}
                >
                  <DateInputDDMMYYYY placeholder="Có thể bỏ trống" />
                </Form.Item>
              </Col>

              <AutoGenderAndBirthYearFields
                form={form}
                idNumberPath={['heir', 'idNumber']}
                colSpan={6}
              />

              <Col xs={24}>
                <Form.Item
                  label={
                    <Space size={10}>
                      <span>Địa chỉ người thừa kế</span>
                      <Button
                        type="primary"
                        ghost
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={handleCopyBorrowerAddressToHeir}
                      >
                        Lấy địa chỉ người vay
                      </Button>
                    </Space>
                  }
                  name={['heir', 'address']}
                  rules={[
                    {
                      required: true,
                      message: 'Nhập địa chỉ người thừa kế',
                    },
                  ]}
                >
                  <Input placeholder="Nhập địa chỉ hoặc bấm 'Lấy địa chỉ người vay'" />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Modal>
    </Space>
  );
}
