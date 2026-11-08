'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  DeleteOutlined,
  EnvironmentOutlined,
  FolderAddOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { Commune, Hamlet, TerritoryGroup } from '@/types/credit.types';
import { apiRequest } from '@/utils/api-client';

const { Title, Text } = Typography;

export default function TerritoriesPage() {
  const { message } = App.useApp();
  const [groups, setGroups] = useState<TerritoryGroup[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [hamlets, setHamlets] = useState<Hamlet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [communeModalOpen, setCommuneModalOpen] = useState(false);
  const [hamletModalOpen, setHamletModalOpen] = useState(false);

  const [groupForm] = Form.useForm();
  const [communeForm] = Form.useForm();
  const [hamletForm] = Form.useForm();

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [gData, cData, hData] = await Promise.all([
        apiRequest<TerritoryGroup[]>('/territories/groups'),
        apiRequest<Commune[]>('/territories/communes'),
        apiRequest<Hamlet[]>('/territories/hamlets'),
      ]);
      setGroups(gData ?? []);
      setCommunes(cData ?? []);
      setHamlets(hData ?? []);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : 'Không thể tải dữ liệu địa bàn',
      );
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleCreateGroup = async (values: {
    name: string;
    communeIds?: string[];
  }) => {
    try {
      await apiRequest('/territories/groups', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      message.success('Đã tạo nhóm địa bàn thành công');
      setGroupModalOpen(false);
      groupForm.resetFields();
      await loadAll();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Lỗi tạo nhóm');
    }
  };

  const handleCreateCommune = async (values: {
    name: string;
    territoryGroupId?: string;
    hamletNamesRaw?: string;
  }) => {
    try {
      const hamletNames = values.hamletNamesRaw
        ? values.hamletNamesRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      await apiRequest('/territories/communes', {
        method: 'POST',
        body: JSON.stringify({
          name: values.name,
          territoryGroupId: values.territoryGroupId || null,
          hamletNames,
        }),
      });
      message.success('Đã thêm Xã mới thành công');
      setCommuneModalOpen(false);
      communeForm.resetFields();
      await loadAll();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Lỗi thêm Xã');
    }
  };

  const handleCreateHamlet = async (values: {
    communeId: string;
    name: string;
  }) => {
    try {
      await apiRequest('/territories/hamlets', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      message.success('Đã thêm Ấp mới thành công');
      setHamletModalOpen(false);
      hamletForm.resetFields();
      await loadAll();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Lỗi thêm Ấp');
    }
  };

  const handleDelete = async (
    endpoint: string,
    successText: string,
  ): Promise<void> => {
    try {
      await apiRequest(endpoint, { method: 'DELETE' });
      message.success(successText);
      await loadAll();
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
            Quản lý Địa bàn & Nhóm Địa bàn
          </Title>
          <Text style={{ color: '#9CA3AF' }}>
            Cấu trúc Ấp – Xã – Tỉnh Vĩnh Long và phân nhóm kiểm soát cấp Xã của
            cán bộ tín dụng
          </Text>
        </div>

        <Space wrap>
          <Button
            icon={<FolderAddOutlined />}
            onClick={() => setGroupModalOpen(true)}
          >
            Tạo Nhóm Xã
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() => setCommuneModalOpen(true)}
          >
            Thêm Xã mới
          </Button>
          <Button
            type="primary"
            icon={<EnvironmentOutlined />}
            onClick={() => setHamletModalOpen(true)}
          >
            Thêm Ấp mới
          </Button>
        </Space>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={10}>
          <Space orientation="vertical" size={20} style={{ width: '100%' }}>
            <Card
              title="1. Phân nhóm Địa bàn (Cấp Xã)"
              extra={<Tag color="purple">{groups.length} nhóm</Tag>}
            >
              <Table<TerritoryGroup>
                rowKey="id"
                size="small"
                loading={loading}
                dataSource={groups}
                pagination={false}
                columns={[
                  {
                    title: 'Tên nhóm',
                    dataIndex: 'name',
                    render: (v: string) => (
                      <Text style={{ fontWeight: 600, color: '#38BDF8' }}>
                        {v}
                      </Text>
                    ),
                  },
                  {
                    title: 'Các Xã trong nhóm',
                    key: 'communes',
                    render: (_, record) =>
                      record.communes && record.communes.length > 0 ? (
                        <Space wrap size={[4, 4]}>
                          {record.communes.map((c) => (
                            <Tag key={c.id} color="cyan">
                              {c.name}
                            </Tag>
                          ))}
                        </Space>
                      ) : (
                        <Text type="secondary">Chưa gán xã</Text>
                      ),
                  },
                  {
                    title: '',
                    width: 50,
                    render: (_, record) => (
                      <Popconfirm
                        title="Xóa nhóm địa bàn này?"
                        onConfirm={() =>
                          handleDelete(
                            `/territories/groups/${record.id}`,
                            'Đã xóa nhóm địa bàn',
                          )
                        }
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    ),
                  },
                ]}
              />
            </Card>

            <Card
              title="2. Danh sách Xã (Tỉnh Vĩnh Long)"
              extra={<Tag color="cyan">{communes.length} xã</Tag>}
            >
              <Table<Commune>
                rowKey="id"
                size="small"
                loading={loading}
                dataSource={communes}
                pagination={false}
                columns={[
                  {
                    title: 'Xã',
                    dataIndex: 'name',
                    render: (v: string) => (
                      <Text style={{ fontWeight: 600, color: '#F9FAFB' }}>
                        {v}
                      </Text>
                    ),
                  },
                  {
                    title: 'Nhóm',
                    key: 'group',
                    render: (_, record) =>
                      record.territoryGroup ? (
                        <Tag color="purple">{record.territoryGroup.name}</Tag>
                      ) : (
                        <Text type="secondary">—</Text>
                      ),
                  },
                  {
                    title: 'Số Ấp',
                    key: 'hamletCount',
                    align: 'center',
                    render: (_, record) => (
                      <Tag color="blue">{record.hamlets?.length ?? 0} ấp</Tag>
                    ),
                  },
                  {
                    title: '',
                    width: 50,
                    render: (_, record) => (
                      <Popconfirm
                        title="Xóa Xã này?"
                        onConfirm={() =>
                          handleDelete(
                            `/territories/communes/${record.id}`,
                            'Đã xóa Xã',
                          )
                        }
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    ),
                  },
                ]}
              />
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title="3. Bảng Địa bàn Quản lý (Ấp – Xã – Tỉnh Vĩnh Long)"
            extra={<Tag color="green">{hamlets.length} ấp</Tag>}
          >
            <Table<Hamlet>
              rowKey="id"
              loading={loading}
              dataSource={hamlets}
              pagination={{ pageSize: 10 }}
              columns={[
                {
                  title: 'Ấp',
                  dataIndex: 'name',
                  render: (v: string) => (
                    <Text style={{ fontWeight: 600, color: '#10B981' }}>
                      {v}
                    </Text>
                  ),
                },
                {
                  title: 'Xã',
                  key: 'commune',
                  render: (_, r) => r.commune?.name ?? '—',
                },
                {
                  title: 'Tỉnh',
                  key: 'province',
                  render: (_, r) => r.commune?.province ?? 'Tỉnh Vĩnh Long',
                },
                {
                  title: 'Địa chỉ tự động ghép (Người vay / Thửa đất)',
                  dataIndex: 'fullAddress',
                  render: (v: string) => (
                    <Tag color="cyan" style={{ fontSize: 13 }}>
                      {v}
                    </Tag>
                  ),
                },
                {
                  title: '',
                  width: 50,
                  render: (_, record) => (
                    <Popconfirm
                      title="Xóa Ấp này?"
                      onConfirm={() =>
                        handleDelete(
                          `/territories/hamlets/${record.id}`,
                          'Đã xóa Ấp',
                        )
                      }
                    >
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* Modal tạo Nhóm địa bàn */}
      <Modal
        title="Tạo Nhóm Địa bàn (Phân nhóm cấp Xã)"
        open={groupModalOpen}
        onCancel={() => setGroupModalOpen(false)}
        onOk={() => groupForm.submit()}
        okText="Lưu Nhóm"
      >
        <Form form={groupForm} layout="vertical" onFinish={handleCreateGroup}>
          <Form.Item
            label="Tên nhóm địa bàn (do cán bộ tự đặt)"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên nhóm' }]}
          >
            <Input placeholder="VD: Nhóm 1, Nhóm 2, Cụm Bắc..." />
          </Form.Item>
          <Form.Item label="Chọn các Xã thuộc nhóm (tùy chọn)" name="communeIds">
            <Select
              mode="multiple"
              placeholder="Chọn các xã thuộc nhóm này"
              options={communes.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal tạo Xã */}
      <Modal
        title="Thêm Xã mới (Tỉnh Vĩnh Long)"
        open={communeModalOpen}
        onCancel={() => setCommuneModalOpen(false)}
        onOk={() => communeForm.submit()}
        okText="Lưu Xã"
      >
        <Form
          form={communeForm}
          layout="vertical"
          onFinish={handleCreateCommune}
        >
          <Form.Item label="Tỉnh (Cố định)">
            <Input value="Tỉnh Vĩnh Long" disabled />
          </Form.Item>
          <Form.Item
            label="Tên Xã"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên Xã' }]}
          >
            <Input placeholder="VD: Xã Nhị Trường" />
          </Form.Item>
          <Form.Item
            label="Thuộc Nhóm Địa bàn (nếu có)"
            name="territoryGroupId"
          >
            <Select
              allowClear
              placeholder="Chọn nhóm địa bàn"
              options={groups.map((g) => ({ label: g.name, value: g.id }))}
            />
          </Form.Item>
          <Form.Item
            label="Danh sách các Ấp thuộc Xã (ngăn cách bằng dấu phẩy, tùy chọn)"
            name="hamletNamesRaw"
          >
            <Input.TextArea
              rows={3}
              placeholder="VD: Ấp Nô Lựa, Ấp Giồng Chanh, Ấp Bến Có"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal tạo Ấp */}
      <Modal
        title="Thêm Ấp mới vào Xã"
        open={hamletModalOpen}
        onCancel={() => setHamletModalOpen(false)}
        onOk={() => hamletForm.submit()}
        okText="Lưu Ấp"
      >
        <Form form={hamletForm} layout="vertical" onFinish={handleCreateHamlet}>
          <Form.Item
            label="Chọn Xã (Thuộc Tỉnh Vĩnh Long)"
            name="communeId"
            rules={[{ required: true, message: 'Vui lòng chọn Xã' }]}
          >
            <Select
              placeholder="Chọn Xã"
              options={communes.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>
          <Form.Item
            label="Tên Ấp"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên Ấp' }]}
          >
            <Input placeholder="VD: Ấp Nô Lựa" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
