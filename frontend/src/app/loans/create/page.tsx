'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  SyncOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Divider,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { DateInputDDMMYYYY } from '@/components/common/DateInputDDMMYYYY';
import {
  AutoGenderAndBirthYearFields,
  AutoIssuingAuthorityField,
} from '@/components/common/PersonAutoFields';
import {
  Borrower,
  CollateralAsset,
  CollateralOwnerType,
  CollateralValuationItem,
  Commune,
  FundLandCategory,
  Hamlet,
  LoanDurationType,
  LoanPlanItem,
  LoanStatus,
  LoanType,
  ValuationType,
} from '@/types/credit.types';
import { apiRequest } from '@/utils/api-client';
import {
  calculateAssetValuationClient,
  calculateDueDateDisplay,
  CERTIFICATE_TYPE_OPTIONS,
  COLLATERAL_ASSET_TYPE_OPTIONS,
  COLLATERAL_OWNER_TYPE_OPTIONS,
  formatVND,
  FUND_LAND_CATEGORY_OPTIONS,
  FUND_UNIT_PRICE_MAP,
  getHeirRelationshipLabel,
  getTodayDDMMYYYY,
  HEIR_RELATIONSHIP_OPTIONS,
  ID_TYPE_OPTIONS,
  LOAN_DURATION_OPTIONS,
  LOAN_STATUS_OPTIONS,
  LOAN_TYPE_OPTIONS,
  RELATED_PERSON_RELATIONSHIP_OPTIONS,
  VALUATION_TYPE_OPTIONS,
} from '@/utils/credit.helpers';

const { Title, Text } = Typography;

/**
 * Component con tính Ngày tới hạn trả độc lập (tránh re-render toàn form)
 */
const AutoDueDateField = React.memo(function AutoDueDateField({
  form,
}: {
  form: FormInstance;
}) {
  const disbursementDate = Form.useWatch<string>('disbursementDate', form);
  const durationType = Form.useWatch<LoanDurationType>('durationType', form);
  return (
    <Form.Item label="Ngày tới hạn trả (Tự tính khi có Ngày giải ngân)">
      <Input
        disabled
        value={calculateDueDateDisplay(disbursementDate, durationType)}
      />
    </Form.Item>
  );
});

/**
 * Component con hiển thị 1 Tài sản bảo đảm (Cô lập state của từng tài sản để gõ mượt không lag)
 * - Các trường hình thức sử dụng, mục đích sử dụng, nguồn gốc sử dụng, hạn chế sử dụng là tùy chọn
 * - Địa bàn hỗ trợ chọn cả Cấp Ấp ("Ấp ..., Xã ..., Tỉnh Vĩnh Long") và Cấp Xã ("Xã ..., Tỉnh Vĩnh Long")
 */
const CollateralAssetRowCard = React.memo(function CollateralAssetRowCard({
  form,
  fieldName,
  index,
  canRemove,
  onRemove,
  territoryOptions,
}: {
  form: FormInstance;
  fieldName: number;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  territoryOptions: Array<{
    label: string;
    options: Array<{ label: string; value: string }>;
  }>;
}) {
  const ownerType = Form.useWatch<CollateralOwnerType>(
    ['collateralAssets', fieldName, 'ownerType'],
    form,
  );

  return (
    <Card
      size="small"
      style={{
        background: '#161F30',
        borderColor: '#283548',
      }}
      title={
        <Space wrap>
          <Tag color="cyan">Tài sản #{index + 1}</Tag>
        </Space>
      }
      extra={
        canRemove && (
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={onRemove}
          >
            Xóa tài sản
          </Button>
        )
      }
    >
      <Row gutter={12}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Tên loại tài sản"
            name={[fieldName, 'assetType']}
            rules={[{ required: true, message: 'Chọn loại tài sản' }]}
          >
            <Select options={COLLATERAL_ASSET_TYPE_OPTIONS} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            label="Mã số tài sản"
            name={[fieldName, 'assetCode']}
            rules={[{ required: true, message: 'Nhập mã tài sản' }]}
          >
            <Input placeholder="VD: TS-01" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            label="Chủ sở hữu tài sản"
            name={[fieldName, 'ownerType']}
            rules={[{ required: true }]}
          >
            <Select options={COLLATERAL_OWNER_TYPE_OPTIONS} />
          </Form.Item>
        </Col>

        <Col xs={24} md={10}>
          <Form.Item
            label="Loại giấy chứng nhận"
            name={[fieldName, 'certificateType']}
            rules={[{ required: true }]}
          >
            <Select options={CERTIFICATE_TYPE_OPTIONS} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Form.Item
            label="Số giấy chứng nhận"
            name={[fieldName, 'certificateNumber']}
            rules={[{ required: true, message: 'Nhập số GCN' }]}
          >
            <Input placeholder="Số GCN" />
          </Form.Item>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Form.Item
            label="Số thửa"
            name={[fieldName, 'plotNumber']}
            rules={[{ required: true, message: 'Nhập số thửa' }]}
          >
            <Input placeholder="Thửa" />
          </Form.Item>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Form.Item
            label="Số tờ"
            name={[fieldName, 'mapSheetNumber']}
            rules={[{ required: true, message: 'Nhập số tờ' }]}
          >
            <Input placeholder="Tờ" />
          </Form.Item>
        </Col>

        <Col xs={24} md={16}>
          <Form.Item
            label="Địa bàn thửa đất (Chọn Cấp Ấp hoặc Cấp Xã – Tỉnh Vĩnh Long)"
            name={[fieldName, 'territorySelection']}
            rules={[
              {
                required: true,
                message: 'Vui lòng chọn địa bàn (Ấp hoặc Xã) của thửa đất',
              },
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn Cấp Ấp hoặc Cấp Xã (VD: Xã Nhị Trường, Tỉnh Vĩnh Long)"
              options={territoryOptions}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            label="Diện tích (m²)"
            name={[fieldName, 'area']}
            rules={[{ required: true, message: 'Nhập diện tích' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.1}
              step={10}
              suffix="m²"
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Form.Item
            label="Thời hạn sử dụng"
            name={[fieldName, 'usageTerm']}
            rules={[{ required: true, message: 'Nhập thời hạn sử dụng' }]}
          >
            <Input placeholder="VD: Lâu dài" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item
            label="Hình thức sử dụng (Tùy chọn)"
            name={[fieldName, 'usageForm']}
          >
            <Input placeholder="Có thể bỏ trống (VD: Sử dụng riêng)" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item
            label="Mục đích sử dụng (Tùy chọn)"
            name={[fieldName, 'usagePurpose']}
          >
            <Input placeholder="Có thể bỏ trống (VD: Đất trồng lúa)" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="Nguồn gốc sử dụng (Tùy chọn)"
            name={[fieldName, 'usageOrigin']}
          >
            <Input placeholder="Có thể bỏ trống" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Hạn chế sử dụng (Tùy chọn)"
            name={[fieldName, 'usageRestriction']}
          >
            <Input placeholder="Có thể bỏ trống" />
          </Form.Item>
        </Col>
      </Row>

      {/* NẾU CHỦ SỞ HỮU LÀ BẢO LÃNH -> SHOW KHỐI NHẬP 1 NGƯỜI BẢO LÃNH */}
      {ownerType === 'BAO_LANH' && (
        <div
          style={{
            marginTop: 8,
            padding: 14,
            background: '#111827',
            borderRadius: 8,
            border: '1px dashed #F59E0B',
          }}
        >
          <Text
            style={{
              color: '#F59E0B',
              fontWeight: 600,
              display: 'block',
              marginBottom: 12,
            }}
          >
            Thông tin Người bảo lãnh của Tài sản #{index + 1} (Chỉ 1 người bảo
            lãnh)
          </Text>
          <Row gutter={12}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Họ tên người bảo lãnh"
                name={[fieldName, 'guarantor', 'fullName']}
                rules={[
                  {
                    required: true,
                    message: 'Nhập họ tên người bảo lãnh',
                  },
                ]}
              >
                <Input placeholder="Họ và tên người bảo lãnh" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Loại giấy tờ người bảo lãnh"
                name={[fieldName, 'guarantor', 'idType']}
                initialValue="CAN_CUOC"
                rules={[{ required: true }]}
              >
                <Select options={ID_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Số giấy tờ (12 số)"
                name={[fieldName, 'guarantor', 'idNumber']}
                rules={[
                  { required: true, message: 'Nhập 12 số giấy tờ' },
                  { pattern: /^\d{12}$/, message: 'Đúng 12 chữ số' },
                ]}
              >
                <Input maxLength={12} placeholder="084080123456" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <AutoIssuingAuthorityField
                form={form}
                idTypePath={[
                  'collateralAssets',
                  fieldName,
                  'guarantor',
                  'idType',
                ]}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Ngày cấp (dd/mm/yyyy)"
                name={[fieldName, 'guarantor', 'issueDate']}
                rules={[{ required: true, message: 'Chọn ngày cấp' }]}
              >
                <DateInputDDMMYYYY />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Thời hạn giấy tờ (dd/mm/yyyy)"
                name={[fieldName, 'guarantor', 'expiryDate']}
              >
                <DateInputDDMMYYYY placeholder="Nếu có" />
              </Form.Item>
            </Col>

            <AutoGenderAndBirthYearFields
              form={form}
              idNumberPath={[
                'collateralAssets',
                fieldName,
                'guarantor',
                'idNumber',
              ]}
              colSpan={6}
            />

            <Col xs={24} sm={12}>
              <Form.Item
                label="Địa chỉ người bảo lãnh (Nhập tự do)"
                name={[fieldName, 'guarantor', 'address']}
                rules={[
                  { required: true, message: 'Nhập địa chỉ người bảo lãnh' },
                ]}
              >
                <Input placeholder="Nhập địa chỉ người bảo lãnh" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      )}
    </Card>
  );
});

/**
 * Một dòng trong Bảng Định giá Tài sản Thế chấp (Section riêng)
 */
const ValuationTableRow = React.memo(function ValuationTableRow({
  form,
  fieldName,
  valuationType,
  canRemove,
  onRemove,
}: {
  form: FormInstance;
  fieldName: number;
  valuationType: ValuationType;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const area = Form.useWatch<number>(
    ['valuationItems', fieldName, 'area'],
    form,
  );
  const actualArea = Form.useWatch<number | null>(
    ['valuationItems', fieldName, 'actualArea'],
    form,
  );
  const fundLandCategory = Form.useWatch<FundLandCategory>(
    ['valuationItems', fieldName, 'fundLandCategory'],
    form,
  );
  const unitPrice = Form.useWatch<number>(
    ['valuationItems', fieldName, 'unitPrice'],
    form,
  );

  const calc = useMemo(
    () =>
      calculateAssetValuationClient({
        area,
        actualArea,
        valuationType,
        fundLandCategory,
        unitPrice,
      }),
    [area, actualArea, valuationType, fundLandCategory, unitPrice],
  );

  return (
    <div
      style={{
        background: '#161F30',
        border: '1px solid #283548',
        borderRadius: 8,
        padding: '12px 12px 4px',
        marginBottom: 10,
      }}
    >
      <Row gutter={10} align="middle">
        <Col xs={12} sm={3}>
          <Form.Item
            label="Số thửa"
            name={[fieldName, 'plotNumber']}
            rules={[{ required: true, message: 'Nhập thửa' }]}
            style={{ marginBottom: 8 }}
          >
            <Input placeholder="Số thửa" />
          </Form.Item>
        </Col>
        <Col xs={12} sm={2}>
          <Form.Item
            label="Số tờ"
            name={[fieldName, 'mapSheetNumber']}
            rules={[{ required: true, message: 'Nhập tờ' }]}
            style={{ marginBottom: 8 }}
          >
            <Input placeholder="Số tờ" />
          </Form.Item>
        </Col>
        <Col xs={12} sm={3}>
          <Form.Item
            label="Diện tích (m²)"
            name={[fieldName, 'area']}
            rules={[{ required: true, message: 'Nhập DT' }]}
            style={{ marginBottom: 8 }}
          >
            <InputNumber style={{ width: '100%' }} min={0.1} step={10} />
          </Form.Item>
        </Col>
        <Col xs={12} sm={4}>
          <Form.Item
            label="DT thực tế (Tùy chọn)"
            name={[fieldName, 'actualArea']}
            style={{ marginBottom: 8 }}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.1}
              step={10}
              placeholder="Trống = lấy DT"
            />
          </Form.Item>
        </Col>

        {valuationType === 'QUY_DINH_QUY' ? (
          <>
            <Col xs={24} sm={5}>
              <Form.Item
                label="Loại đất quy định Quỹ"
                name={[fieldName, 'fundLandCategory']}
                rules={[{ required: true, message: 'Chọn mức giá Quỹ' }]}
                style={{ marginBottom: 8 }}
              >
                <Select options={FUND_LAND_CATEGORY_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={3}>
              <Form.Item label="Đơn giá (VNĐ/m²)" style={{ marginBottom: 8 }}>
                <Input
                  disabled
                  value={
                    fundLandCategory
                      ? formatVND(FUND_UNIT_PRICE_MAP[fundLandCategory])
                      : '—'
                  }
                />
              </Form.Item>
            </Col>
          </>
        ) : (
          <Col xs={24} sm={8}>
            <Form.Item
              label="Đơn giá thị trường (VNĐ/m²)"
              name={[fieldName, 'unitPrice']}
              rules={[{ required: true, message: 'Nhập đơn giá thị trường' }]}
              style={{ marginBottom: 8 }}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1000}
                step={10_000}
                formatter={(v) =>
                  `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
              />
            </Form.Item>
          </Col>
        )}

        <Col xs={12} sm={4}>
          <Form.Item
            label="Giá tiền (Làm tròn xuống)"
            style={{ marginBottom: 8 }}
          >
            <Input
              disabled
              style={{
                color: '#10B981',
                fontWeight: 700,
              }}
              value={formatVND(calc.valuationAmount)}
            />
          </Form.Item>
        </Col>

        <Col xs={20} sm={canRemove ? 22 : 24}>
          <Form.Item
            label="Ghi chú dòng định giá (Tùy chọn)"
            name={[fieldName, 'note']}
            style={{ marginBottom: 8 }}
          >
            <Input placeholder="Ghi chú thêm cho dòng định giá (nếu có)" />
          </Form.Item>
        </Col>
        {canRemove && (
          <Col xs={4} sm={2} style={{ textAlign: 'right', paddingTop: 18 }}>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={onRemove}
            />
          </Col>
        )}
      </Row>
    </div>
  );
});

/**
 * SECTION RIÊNG: ĐỊNH GIÁ TÀI SẢN THẾ CHẤP (Chỉ hiển thị khi loại vay là Thế chấp)
 * - Có Ngày định giá, Loại định giá
 * - Bảng các dòng định giá (Số thửa, Số tờ, Diện tích, Diện tích thực tế định giá (tùy chọn), Đơn giá, Giá tiền làm tròn xuống, Ghi chú)
 * - Có nút lấy từ danh sách tài sản và nút thêm dòng định giá mới để tăng tổng giá trị định giá
 */
const CollateralValuationSection = React.memo(
  function CollateralValuationSection({ form }: { form: FormInstance }) {
    const { message } = App.useApp();
    const loanType = Form.useWatch<LoanType>('loanType', form);
    const valuationType =
      Form.useWatch<ValuationType>('valuationType', form) ?? 'QUY_DINH_QUY';

    const handleSyncFromAssets = () => {
      const assets =
        (form.getFieldValue('collateralAssets') as CollateralAsset[]) ?? [];
      if (assets.length === 0) {
        message.warning('Danh sách tài sản thế chấp đang trống');
        return;
      }

      const currentItems =
        (form.getFieldValue('valuationItems') as CollateralValuationItem[]) ??
        [];

      const synced: CollateralValuationItem[] = assets.map((asset, idx) => {
        const existingRow = currentItems[idx];
        return {
          plotNumber: asset?.plotNumber || existingRow?.plotNumber || '',
          mapSheetNumber:
            asset?.mapSheetNumber || existingRow?.mapSheetNumber || '',
          area: Number(asset?.area ?? existingRow?.area ?? 0),
          actualArea: existingRow?.actualArea ?? null,
          fundLandCategory:
            existingRow?.fundLandCategory ?? 'DAT_BINH_THUONG',
          unitPrice: existingRow?.unitPrice ?? undefined,
          note: existingRow?.note ?? '',
        };
      });

      form.setFieldValue('valuationItems', synced);
      message.success(
        'Đã đồng bộ Số thửa, Số tờ và Diện tích từ Danh sách Tài sản sang Bảng Định giá',
      );
    };

    if (loanType !== 'THE_CHAP') {
      return null;
    }

    return (
      <Card
        title={
          <Space wrap>
            <span>IV. Định giá Tài sản Thế chấp</span>
            <Tag color="green">
              Làm tròn xuống hàng triệu • Tự tính theo DT hoặc DT thực tế
            </Tag>
          </Space>
        }
        extra={
          <Button
            size="small"
            type="primary"
            ghost
            icon={<SyncOutlined />}
            onClick={handleSyncFromAssets}
          >
            Lấy Số thửa, Số tờ & Diện tích từ Danh sách Tài sản
          </Button>
        }
      >
        <Row gutter={16} style={{ marginBottom: 8 }}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              label="Ngày định giá (dd/mm/yyyy)"
              name="valuationDate"
              rules={[{ required: true, message: 'Nhập ngày định giá' }]}
            >
              <DateInputDDMMYYYY />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              label="Loại định giá tài sản"
              name="valuationType"
              rules={[{ required: true }]}
            >
              <Select options={VALUATION_TYPE_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>

        <Form.List name="valuationItems">
          {(fields, { add, remove }) => (
            <div>
              {fields.map(({ key, name }) => (
                <ValuationTableRow
                  key={key}
                  form={form}
                  fieldName={name}
                  valuationType={valuationType}
                  canRemove={fields.length > 1}
                  onRemove={() => remove(name)}
                />
              ))}

              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={() =>
                  add({
                    plotNumber: '',
                    mapSheetNumber: '',
                    area: 500,
                    actualArea: null,
                    fundLandCategory: 'DAT_BINH_THUONG',
                    note: '',
                  })
                }
              >
                Thêm dòng định giá mới (Tăng tổng giá trị định giá)
              </Button>
            </div>
          )}
        </Form.List>
      </Card>
    );
  },
);

/**
 * CHỈ HIỂN THỊ Khối Người liên quan khi:
 * Loại vay là Thế chấp (THE_CHAP) VÀ Số tiền vay >= 140.000.000đ (theo mục 1.2 & 2.1)
 */
const ConditionalRelatedPersonsSection = React.memo(
  function ConditionalRelatedPersonsSection({ form }: { form: FormInstance }) {
    const loanType = Form.useWatch<LoanType>('loanType', form);
    const loanAmount = Form.useWatch<number>('loanAmount', form);

    const shouldShow =
      loanType === 'THE_CHAP' && Number(loanAmount ?? 0) >= 140_000_000;

    if (!shouldShow) {
      return null;
    }

    return (
      <Card
        title={
          <Space>
            <span>V. Thông tin Người liên quan</span>
            <Tag color="error">
              Bắt buộc (Khoản vay Thế chấp ≥ 140.000.000đ)
            </Tag>
          </Space>
        }
      >
        <Form.List name="relatedPersons">
          {(fields, { add, remove }) => (
            <Space orientation="vertical" size={12} style={{ width: '100%' }}>
              {fields.length === 0 && (
                <Alert
                  type="warning"
                  showIcon
                  title="Khoản vay Thế chấp từ 140.000.000đ trở lên bắt buộc phải có ít nhất 1 Người liên quan. Vui lòng bấm nút bên dưới để thêm."
                />
              )}
              {fields.map(({ key, name }) => (
                <Card
                  key={key}
                  size="small"
                  style={{ background: '#161F30', borderColor: '#283548' }}
                  title={`Người liên quan #${name + 1}`}
                  extra={
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  }
                >
                  <Row gutter={12}>
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Họ tên người liên quan"
                        name={[name, 'fullName']}
                        rules={[
                          {
                            required: true,
                            message: 'Nhập họ tên người liên quan',
                          },
                        ]}
                      >
                        <Input placeholder="Nhập họ tên" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Quan hệ với người vay"
                        name={[name, 'relationship']}
                        initialValue="CON"
                        rules={[{ required: true }]}
                      >
                        <Select options={RELATED_PERSON_RELATIONSHIP_OPTIONS} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Vốn vay ở Quỹ (Để trống nếu Không)"
                        name={[name, 'existingLoanAtFund']}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          step={5_000_000}
                          placeholder="Không hoặc nhập số tiền vay"
                          formatter={(v) =>
                            v
                              ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                              : ''
                          }
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Loại giấy tờ người liên quan"
                        name={[name, 'idType']}
                        initialValue="CAN_CUOC"
                        rules={[{ required: true }]}
                      >
                        <Select options={ID_TYPE_OPTIONS} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Số giấy tờ (12 số)"
                        name={[name, 'idNumber']}
                        rules={[
                          { required: true, message: 'Nhập 12 số giấy tờ' },
                          { pattern: /^\d{12}$/, message: 'Đúng 12 chữ số' },
                        ]}
                      >
                        <Input maxLength={12} placeholder="084090123456" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <AutoIssuingAuthorityField
                        form={form}
                        idTypePath={['relatedPersons', name, 'idType']}
                      />
                    </Col>

                    <Col xs={24} sm={6}>
                      <Form.Item
                        label="Ngày cấp (dd/mm/yyyy)"
                        name={[name, 'issueDate']}
                        rules={[{ required: true, message: 'Chọn ngày cấp' }]}
                      >
                        <DateInputDDMMYYYY />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Form.Item
                        label="Thời hạn giấy tờ (dd/mm/yyyy)"
                        name={[name, 'expiryDate']}
                      >
                        <DateInputDDMMYYYY placeholder="Có thể bỏ trống" />
                      </Form.Item>
                    </Col>

                    <AutoGenderAndBirthYearFields
                      form={form}
                      idNumberPath={['relatedPersons', name, 'idNumber']}
                      colSpan={6}
                    />

                    <Col xs={24} sm={16}>
                      <Form.Item
                        label="Địa chỉ người liên quan (Nhập tự do)"
                        name={[name, 'address']}
                        rules={[{ required: true, message: 'Nhập địa chỉ' }]}
                      >
                        <Input placeholder="Nhập địa chỉ người liên quan" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Số điện thoại (Có thể bỏ trống)"
                        name={[name, 'phone']}
                      >
                        <Input placeholder="Có thể bỏ trống" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}
              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={() =>
                  add({ idType: 'CAN_CUOC', relationship: 'CON' })
                }
              >
                Thêm Người liên quan
              </Button>
            </Space>
          )}
        </Form.List>
      </Card>
    );
  },
);

/**
 * CHỈ HIỂN THỊ Khối Người trong hộ khi:
 * Loại vay là Thế chấp (THE_CHAP) VÀ trong danh sách tài sản có ít nhất 1 tài sản là Đất hộ
 * (NGUOI_VAY_HO hoặc NGUOI_THUA_KE_HO) (theo mục 1.2 & 2.1)
 */
const ConditionalHouseholdMembersSection = React.memo(
  function ConditionalHouseholdMembersSection({
    form,
  }: {
    form: FormInstance;
  }) {
    const loanType = Form.useWatch<LoanType>('loanType', form);
    const collateralAssets = Form.useWatch<CollateralAsset[]>(
      'collateralAssets',
      form,
    );

    const hasHouseholdLand = useMemo(
      () =>
        loanType === 'THE_CHAP' &&
        (collateralAssets ?? []).some(
          (a) =>
            a?.ownerType === 'NGUOI_VAY_HO' ||
            a?.ownerType === 'NGUOI_THUA_KE_HO',
        ),
      [loanType, collateralAssets],
    );

    if (!hasHouseholdLand) {
      return null;
    }

    return (
      <Card
        title={
          <Space>
            <span>VI. Thông tin Người trong hộ (Tài sản Đất hộ)</span>
            <Tag color="gold">
              Hiển thị khi có tài sản Đất hộ (Có thể bỏ trống nếu không có thành
              viên hộ)
            </Tag>
          </Space>
        }
      >
        <Form.List name="householdMembers">
          {(fields, { add, remove }) => (
            <Space orientation="vertical" size={12} style={{ width: '100%' }}>
              {fields.map(({ key, name }) => (
                <Card
                  key={key}
                  size="small"
                  style={{ background: '#161F30', borderColor: '#283548' }}
                  title={`Người trong hộ #${name + 1}`}
                  extra={
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  }
                >
                  <Row gutter={12}>
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Họ tên người trong hộ"
                        name={[name, 'fullName']}
                        rules={[
                          {
                            required: true,
                            message: 'Nhập họ tên người trong hộ',
                          },
                        ]}
                      >
                        <Input placeholder="Nhập họ tên" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Loại giấy tờ người trong hộ"
                        name={[name, 'idType']}
                        initialValue="CAN_CUOC"
                        rules={[{ required: true }]}
                      >
                        <Select options={ID_TYPE_OPTIONS} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Số giấy tờ (12 số)"
                        name={[name, 'idNumber']}
                        rules={[
                          { required: true, message: 'Nhập 12 số giấy tờ' },
                          { pattern: /^\d{12}$/, message: 'Đúng 12 chữ số' },
                        ]}
                      >
                        <Input maxLength={12} placeholder="084095123456" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={8}>
                      <AutoIssuingAuthorityField
                        form={form}
                        idTypePath={['householdMembers', name, 'idType']}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Ngày cấp (dd/mm/yyyy)"
                        name={[name, 'issueDate']}
                        rules={[{ required: true, message: 'Chọn ngày cấp' }]}
                      >
                        <DateInputDDMMYYYY />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Thời hạn giấy tờ (dd/mm/yyyy)"
                        name={[name, 'expiryDate']}
                      >
                        <DateInputDDMMYYYY placeholder="Có thể bỏ trống" />
                      </Form.Item>
                    </Col>

                    <AutoGenderAndBirthYearFields
                      form={form}
                      idNumberPath={['householdMembers', name, 'idNumber']}
                      colSpan={6}
                    />

                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Địa chỉ người trong hộ (Nhập tự do)"
                        name={[name, 'address']}
                        rules={[{ required: true, message: 'Nhập địa chỉ' }]}
                      >
                        <Input placeholder="Nhập địa chỉ" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={4}>
                      <Form.Item
                        label="SĐT (Tùy chọn)"
                        name={[name, 'phone']}
                      >
                        <Input placeholder="SĐT" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}
              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={() => add({ idType: 'CAN_CUOC' })}
              >
                Thêm Người trong hộ
              </Button>
            </Space>
          )}
        </Form.List>
      </Card>
    );
  },
);

/**
 * Cột bên phải (Sticky Summary) được cô lập thành component riêng:
 * Khi tính toán lại số tiền/định giá chỉ re-render cột phải, không làm giật/lag các ô input bên trái!
 */
const StickyLoanSummaryCard = React.memo(function StickyLoanSummaryCard({
  form,
  submitting,
}: {
  form: FormInstance;
  submitting: boolean;
}) {
  const loanType = Form.useWatch<LoanType>('loanType', form);
  const loanAmount = Form.useWatch<number>('loanAmount', form);
  const valuationType =
    Form.useWatch<ValuationType>('valuationType', form) ?? 'QUY_DINH_QUY';
  const valuationItems = Form.useWatch<CollateralValuationItem[]>(
    'valuationItems',
    form,
  );
  const manualTotalCapitalNeed = Form.useWatch<number>(
    ['loanPlan', 'totalCapitalNeed'],
    form,
  );
  const expenses = Form.useWatch<LoanPlanItem[]>(
    ['loanPlan', 'expenses'],
    form,
  );
  const revenues = Form.useWatch<LoanPlanItem[]>(
    ['loanPlan', 'revenues'],
    form,
  );

  const totalCollateralValuation = useMemo(() => {
    if (loanType !== 'THE_CHAP') return 0;
    return (valuationItems ?? []).reduce((sum, item) => {
      const v = calculateAssetValuationClient({
        area: item?.area,
        actualArea: item?.actualArea,
        valuationType,
        fundLandCategory: item?.fundLandCategory,
        unitPrice: item?.unitPrice,
      });
      return sum + v.valuationAmount;
    }, 0);
  }, [loanType, valuationType, valuationItems]);

  const maxAllowedLoanAmount = useMemo(() => {
    if (loanType === 'TIN_CHAP') return 100_000_000;
    return Math.floor(totalCollateralValuation * 0.7);
  }, [loanType, totalCollateralValuation]);

  const isOverLimit =
    Number(loanAmount ?? 0) > 0 &&
    Number(loanAmount ?? 0) > maxAllowedLoanAmount;

  const requiresRelatedPersons =
    loanType === 'THE_CHAP' && Number(loanAmount ?? 0) >= 140_000_000;

  const totalExpenses = useMemo(
    () =>
      (expenses ?? []).reduce(
        (sum, item) => sum + Number(item?.amount ?? 0),
        0,
      ),
    [expenses],
  );

  const totalRevenue = useMemo(
    () =>
      (revenues ?? []).reduce(
        (sum, item) => sum + Number(item?.amount ?? 0),
        0,
      ),
    [revenues],
  );

  const totalCapitalNeed = Number(manualTotalCapitalNeed ?? 0);
  const ownCapital = Math.max(0, totalCapitalNeed - Number(loanAmount ?? 0));
  const expectedProfit = totalRevenue - totalExpenses;

  return (
    <Card
      title="Tổng hợp & Kiểm tra Điều kiện Hồ sơ"
      style={{
        background: '#111827',
        borderColor: isOverLimit ? '#EF4444' : '#1F2937',
      }}
    >
      <Space orientation="vertical" size={14} style={{ width: '100%' }}>
        <div
          style={{
            background: '#161F30',
            padding: 14,
            borderRadius: 8,
            border: '1px solid #1F2937',
          }}
        >
          <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
            SỐ TIỀN VAY YÊU CẦU
          </Text>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: isOverLimit ? '#EF4444' : '#10B981',
            }}
          >
            {formatVND(loanAmount)}
          </div>
          <div style={{ marginTop: 6, fontSize: 13 }}>
            <Text style={{ color: '#9CA3AF' }}>
              Hạn mức tối đa (
              {loanType === 'TIN_CHAP'
                ? 'Tín chấp ≤ 100tr'
                : '70% tổng định giá'}
              ):{' '}
            </Text>
            <strong style={{ color: '#F59E0B' }}>
              {formatVND(maxAllowedLoanAmount)}
            </strong>
          </div>
        </div>

        {isOverLimit ? (
          <Alert
            type="error"
            showIcon
            icon={<WarningOutlined />}
            title={`Số tiền vay vượt quá hạn mức tối đa cho phép (${formatVND(maxAllowedLoanAmount)})!`}
          />
        ) : (
          <Alert
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            title="Số tiền vay nằm trong hạn mức hợp lệ"
          />
        )}

        {loanType === 'THE_CHAP' && (
          <div
            style={{
              background: '#161F30',
              padding: 12,
              borderRadius: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Text type="secondary">Tổng định giá TS thế chấp:</Text>
              <strong style={{ color: '#F59E0B' }}>
                {formatVND(totalCollateralValuation)}
              </strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 6,
              }}
            >
              <Text type="secondary">Yêu cầu Người liên quan:</Text>
              <Tag color={requiresRelatedPersons ? 'red' : 'default'}>
                {requiresRelatedPersons
                  ? 'Bắt buộc (≥ 140tr)'
                  : 'Không bắt buộc'}
              </Tag>
            </div>
          </div>
        )}

        <Divider style={{ margin: '4px 0' }} />

        <div
          style={{
            background: '#161F30',
            padding: 12,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              color: '#38BDF8',
              fontWeight: 600,
              display: 'block',
              marginBottom: 8,
            }}
          >
            Tóm tắt Phương án Vay vốn
          </Text>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <Text type="secondary">Tổng nhu cầu vốn (Nhập):</Text>
            <strong>{formatVND(totalCapitalNeed)}</strong>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <Text type="secondary">Vốn vay Quỹ:</Text>
            <strong style={{ color: '#0EA5E9' }}>
              {formatVND(loanAmount)}
            </strong>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <Text type="secondary">Vốn tự có:</Text>
            <strong>{formatVND(ownCapital)}</strong>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <Text type="secondary">Tổng chi phí (Danh sách):</Text>
            <strong>{formatVND(totalExpenses)}</strong>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <Text type="secondary">Tổng nguồn thu:</Text>
            <strong>{formatVND(totalRevenue)}</strong>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid #1F2937',
              paddingTop: 6,
              marginTop: 6,
            }}
          >
            <Text style={{ color: '#F9FAFB', fontWeight: 600 }}>
              Lợi nhuận phương án:
            </Text>
            <strong
              style={{
                color: expectedProfit >= 0 ? '#10B981' : '#EF4444',
                fontSize: 15,
              }}
            >
              {formatVND(expectedProfit)}
            </strong>
          </div>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          icon={<SaveOutlined />}
          loading={submitting}
          disabled={isOverLimit}
          style={{
            height: 46,
            fontWeight: 700,
            background: isOverLimit
              ? undefined
              : 'linear-gradient(90deg, #0EA5E9 0%, #10B981 100%)',
            border: 'none',
            color: isOverLimit ? undefined : '#0B0F19',
          }}
        >
          Lưu Hồ sơ Khoản vay
        </Button>
      </Space>
    </Card>
  );
});

export default function CreateLoanPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm();

  const [borrowerMode, setBorrowerMode] = useState<'EXISTING' | 'NEW'>('NEW');
  const [hasHeir, setHasHeir] = useState<boolean>(false);
  const [existingBorrowers, setExistingBorrowers] = useState<Borrower[]>([]);
  const [hamlets, setHamlets] = useState<Hamlet[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [duplicateBorrowerError, setDuplicateBorrowerError] = useState<
    string | null
  >(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const watchedBorrowerId = Form.useWatch<string>('borrowerId', form);
  const newBorrowerIdNumber = Form.useWatch<string>(
    ['borrower', 'idNumber'],
    form,
  );
  const watchedLoanType = Form.useWatch<LoanType>('loanType', form);
  const watchedDurationType = Form.useWatch<LoanDurationType>(
    'durationType',
    form,
  );
  const watchedLoanAmount = Form.useWatch<number>('loanAmount', form);
  const watchedStatus = Form.useWatch<LoanStatus>('status', form);

  const loadInitialOptions = useCallback(async () => {
    try {
      const [bRes, hRes, cRes] = await Promise.all([
        apiRequest<{ items: Borrower[] }>('/borrowers?limit=100'),
        apiRequest<Hamlet[]>('/territories/hamlets'),
        apiRequest<Commune[]>('/territories/communes'),
      ]);
      setExistingBorrowers(bRes?.items ?? []);
      setHamlets(hRes ?? []);
      setCommunes(cRes ?? []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadInitialOptions();
  }, [loadInitialOptions]);

  // Khi cán bộ chọn trạng thái "Đã giải ngân", tự lấy ngày hiện tại điền vào Ngày giải ngân (nếu đang trống)
  useEffect(() => {
    if (watchedStatus === 'DA_GIAI_NGAN') {
      const currentDisbursement = form.getFieldValue('disbursementDate') as
        | string
        | undefined;
      if (!currentDisbursement?.trim()) {
        form.setFieldValue('disbursementDate', getTodayDDMMYYYY());
      }
    }
  }, [watchedStatus, form]);

  // Kiểm tra trùng 12 số giấy tờ của người vay mới (debounce 350ms tránh giật lag)
  useEffect(() => {
    if (
      borrowerMode !== 'NEW' ||
      !newBorrowerIdNumber ||
      !/^\d{12}$/.test(newBorrowerIdNumber.trim())
    ) {
      setDuplicateBorrowerError(null);
      return;
    }

    const timer = setTimeout(() => {
      apiRequest<{
        exists: boolean;
        existingBorrower?: { fullName: string; idNumber: string };
      }>(`/borrowers/check-id/${newBorrowerIdNumber.trim()}`)
        .then((res) => {
          if (res.exists && res.existingBorrower) {
            setDuplicateBorrowerError(
              `Số giấy tờ "${res.existingBorrower.idNumber}" đã tồn tại (${res.existingBorrower.fullName}). Hệ thống không cho phép tạo trùng!`,
            );
          } else {
            setDuplicateBorrowerError(null);
          }
        })
        .catch(() => setDuplicateBorrowerError(null));
    }, 350);

    return () => clearTimeout(timer);
  }, [borrowerMode, newBorrowerIdNumber]);

  // Tự động tra cứu mức lãi suất theo mốc số tiền vay (debounce 350ms tránh lag khi gõ số tiền)
  useEffect(() => {
    if (
      !watchedLoanType ||
      !watchedDurationType ||
      !watchedLoanAmount ||
      watchedLoanAmount <= 0
    ) {
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        loanType: watchedLoanType,
        durationType: watchedDurationType,
        loanAmount: String(watchedLoanAmount),
      });

      apiRequest<{ interestRate?: string | number } | null>(
        `/interest-rates/lookup?${params.toString()}`,
      )
        .then((tier) => {
          if (tier?.interestRate !== undefined && tier?.interestRate !== null) {
            form.setFieldValue('interestRate', Number(tier.interestRate));
          }
        })
        .catch(() => {
          // ignore
        });
    }, 350);

    return () => clearTimeout(timer);
  }, [watchedLoanType, watchedDurationType, watchedLoanAmount, form]);

  // Nút "Lấy địa chỉ người vay" copy y chang địa chỉ người vay sang người thừa kế
  const handleCopyBorrowerAddressToHeir = () => {
    const selectedHamletId = form.getFieldValue([
      'borrower',
      'hamletId',
    ]) as string | undefined;
    const foundHamlet = hamlets.find((h) => h.id === selectedHamletId);
    if (!foundHamlet) {
      message.warning(
        'Vui lòng chọn Địa chỉ (Ấp) của người vay trước khi bấm Lấy địa chỉ người vay!',
      );
      return;
    }
    const borrowerAddress = foundHamlet.fullAddress ?? foundHamlet.name;
    form.setFieldValue(['borrower', 'heir', 'address'], borrowerAddress);
    message.success('Đã sao chép y chang địa chỉ người vay sang người thừa kế');
  };

  const selectedExistingBorrower = useMemo(
    () => existingBorrowers.find((b) => b.id === watchedBorrowerId),
    [existingBorrowers, watchedBorrowerId],
  );

  const hamletSelectOptions = useMemo(
    () =>
      hamlets.map((h) => ({
        label: h.fullAddress ?? h.name,
        value: h.id,
      })),
    [hamlets],
  );

  // Địa bàn tài sản thế chấp: Hỗ trợ chọn Cấp Xã ("Xã ..., Tỉnh Vĩnh Long") hoặc Cấp Ấp ("Ấp ..., Xã ..., Tỉnh Vĩnh Long")
  const collateralTerritoryOptions = useMemo(
    () => [
      {
        label: 'Địa bàn Cấp Xã (Xã ..., Tỉnh Vĩnh Long)',
        options: communes.map((c) => ({
          label:
            c.fullAddress ??
            `${c.name.toLowerCase().startsWith('xã') ? c.name : `Xã ${c.name}`}, ${c.province || 'Tỉnh Vĩnh Long'}`,
          value: `commune:${c.id}`,
        })),
      },
      {
        label: 'Địa bàn Cấp Ấp (Ấp ..., Xã ..., Tỉnh Vĩnh Long)',
        options: hamlets.map((h) => ({
          label: h.fullAddress ?? h.name,
          value: `hamlet:${h.id}`,
        })),
      },
    ],
    [communes, hamlets],
  );

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (borrowerMode === 'NEW' && duplicateBorrowerError) {
      message.error(duplicateBorrowerError);
      return;
    }

    setSubmitting(true);
    try {
      const borrowerInput = values.borrower as Record<string, unknown>;
      const rawAssets = (values.collateralAssets as CollateralAsset[]) ?? [];
      const mappedAssets = rawAssets.map((asset) => {
        const selection = asset.territorySelection ?? '';
        let hamletId: string | null = asset.hamletId ?? null;
        let communeId: string | null = asset.communeId ?? null;

        if (selection.startsWith('hamlet:')) {
          hamletId = selection.replace('hamlet:', '');
          communeId = null;
        } else if (selection.startsWith('commune:')) {
          communeId = selection.replace('commune:', '');
          hamletId = null;
        }

        return {
          assetType: asset.assetType,
          assetCode: asset.assetCode,
          certificateType: asset.certificateType,
          certificateNumber: asset.certificateNumber,
          plotNumber: asset.plotNumber,
          mapSheetNumber: asset.mapSheetNumber,
          hamletId,
          communeId,
          area: Number(asset.area),
          usageForm: asset.usageForm || undefined,
          usagePurpose: asset.usagePurpose || undefined,
          usageTerm: asset.usageTerm,
          usageOrigin: asset.usageOrigin || undefined,
          usageRestriction: asset.usageRestriction || undefined,
          ownerType: asset.ownerType,
          guarantor: asset.ownerType === 'BAO_LANH' ? asset.guarantor : undefined,
        };
      });

      const payload: Record<string, unknown> = {
        loanDate: values.loanDate,
        disbursementDate: (values.disbursementDate as string)?.trim() || null,
        loanAmount: Number(values.loanAmount),
        indentureNumber: (values.indentureNumber as string)?.trim() || null,
        loanType: values.loanType,
        durationType: values.durationType,
        status: values.status ?? 'DANG_CHUAN_BI_HO_SO',
        interestRate:
          values.interestRate !== undefined && values.interestRate !== null
            ? Number(values.interestRate)
            : undefined,
        mortgageContractNumber:
          values.loanType === 'THE_CHAP'
            ? (values.mortgageContractNumber as string)?.trim() || undefined
            : undefined,
        committeeNotarizationDate:
          values.loanType === 'THE_CHAP'
            ? (values.committeeNotarizationDate as string)?.trim() || null
            : undefined,
        mortgageContractTermDate:
          values.loanType === 'THE_CHAP'
            ? (values.mortgageContractTermDate as string)?.trim() || null
            : undefined,
        valuationDate:
          values.loanType === 'THE_CHAP'
            ? (values.valuationDate as string)?.trim() || undefined
            : undefined,
        valuationType:
          values.loanType === 'THE_CHAP' ? values.valuationType : undefined,
        collateralAssets: mappedAssets,
        valuationItems:
          values.loanType === 'THE_CHAP' ? (values.valuationItems ?? []) : [],
        relatedPersons:
          values.loanType === 'THE_CHAP' ? (values.relatedPersons ?? []) : [],
        householdMembers:
          values.loanType === 'THE_CHAP' ? (values.householdMembers ?? []) : [],
        loanPlan: {
          ...(values.loanPlan as Record<string, unknown>),
          totalCapitalNeed: Number(
            (values.loanPlan as Record<string, unknown>)?.totalCapitalNeed ?? 0,
          ),
          fundLoanCapital: Number(values.loanAmount),
        },
      };

      if (borrowerMode === 'EXISTING') {
        payload.borrowerId = values.borrowerId;
      } else {
        payload.borrower = {
          ...borrowerInput,
          heir: hasHeir ? borrowerInput.heir : null,
        };
      }

      await apiRequest('/loans', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      message.success('Đã tạo lập hồ sơ khoản vay thành công!');
      router.push('/loans');
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : 'Lỗi khi tạo lập khoản vay',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Space orientation="vertical" size={20} style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Space size={12}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/loans')}
          />
          <div>
            <Title level={3} style={{ margin: 0, color: '#F9FAFB' }}>
              Tạo lập Hồ sơ Khoản vay
            </Title>
            <Text style={{ color: '#9CA3AF' }}>
              Nhập liền mạch từ trên xuống • Không delay/lag • Tự động trích
              xuất CCCD, định giá & phương án vay vốn
            </Text>
          </div>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          loanType: 'THE_CHAP',
          durationType: 'NGAN_HAN',
          status: 'DANG_CHUAN_BI_HO_SO',
          loanDate: getTodayDDMMYYYY(),
          disbursementDate: '',
          valuationDate: getTodayDDMMYYYY(),
          valuationType: 'QUY_DINH_QUY',
          loanAmount: 100_000_000,
          borrower: {
            idType: 'CAN_CUOC',
            heir: {
              idType: 'CAN_CUOC',
              relationship: 'VO',
            },
          },
          collateralAssets: [
            {
              assetType: 'QSDD',
              certificateType: 'GCN',
              ownerType: 'NGUOI_VAY_CA_NHAN',
              area: 1000,
              usageForm: '',
              usagePurpose: '',
              usageTerm: 'Lâu dài',
              usageOrigin: '',
              usageRestriction: '',
            },
          ],
          valuationItems: [
            {
              plotNumber: '',
              mapSheetNumber: '',
              area: 1000,
              actualArea: null,
              fundLandCategory: 'DAT_BINH_THUONG',
              note: '',
            },
          ],
          loanPlan: {
            loanPurpose: 'Chăm sóc và cải tạo đất sản xuất nông nghiệp',
            totalCapitalNeed: 120_000_000,
            expenses: [
              {
                itemName: 'Chi phí vật tư, phân bón, giống',
                amount: 110_000_000,
              },
              { itemName: 'Tiền lãi vay dự kiến', amount: 10_000_000 },
            ],
            revenues: [
              { itemName: 'Thu từ bán nông sản thu hoạch', amount: 180_000_000 },
            ],
          },
        }}
        onFinish={handleSubmit}
      >
        <Row gutter={[20, 20]} align="top">
          {/* CỘT TRÁI: FORM LIỀN MẠCH TỪ TRÊN XUỐNG */}
          <Col xs={24} xl={17}>
            <Space orientation="vertical" size={20} style={{ width: '100%' }}>
              {/* KHỐI I: NGƯỜI VAY & NGƯỜI THỪA KẾ */}
              <Card
                title="I. Thông tin Người vay & Người thừa kế"
                extra={
                  <Radio.Group
                    value={borrowerMode}
                    onChange={(e) => setBorrowerMode(e.target.value)}
                    optionType="button"
                    buttonStyle="solid"
                    size="small"
                  >
                    <Radio.Button value="NEW">
                      Tạo người vay mới
                    </Radio.Button>
                    <Radio.Button value="EXISTING">
                      Chọn người vay đã có
                    </Radio.Button>
                  </Radio.Group>
                }
              >
                {borrowerMode === 'EXISTING' ? (
                  <>
                    <Form.Item
                      label="Chọn người vay đã có trong địa bàn quản lý"
                      name="borrowerId"
                      rules={[
                        {
                          required: true,
                          message: 'Vui lòng chọn người vay',
                        },
                      ]}
                    >
                      <Select
                        showSearch
                        optionFilterProp="label"
                        placeholder="Tìm theo Họ tên hoặc 12 số giấy tờ..."
                        options={existingBorrowers.map((b) => ({
                          label: `${b.fullName} — Số GT: ${b.idNumber} (${b.address})`,
                          value: b.id,
                        }))}
                      />
                    </Form.Item>

                    {selectedExistingBorrower && (
                      <div
                        style={{
                          background: '#161F30',
                          border: '1px solid #1F2937',
                          borderRadius: 8,
                          padding: 14,
                        }}
                      >
                        <Space wrap size={12}>
                          <Tag color="cyan">
                            Họ tên: {selectedExistingBorrower.fullName}
                          </Tag>
                          <Tag color="blue">
                            Số GT: {selectedExistingBorrower.idNumber} (
                            {selectedExistingBorrower.issuingAuthority})
                          </Tag>
                          <Tag color="green">
                            {selectedExistingBorrower.gender === 'NAM'
                              ? 'Nam'
                              : 'Nữ'}{' '}
                            - Sinh năm {selectedExistingBorrower.birthYear}
                          </Tag>
                          <Tag color="gold">
                            Địa chỉ: {selectedExistingBorrower.address}
                          </Tag>
                          {selectedExistingBorrower.heir && (
                            <Tag color="purple">
                              Người thừa kế:{' '}
                              {selectedExistingBorrower.heir.fullName} (
                              {getHeirRelationshipLabel(
                                selectedExistingBorrower.heir.relationship,
                              )}
                              )
                            </Tag>
                          )}
                        </Space>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {duplicateBorrowerError && (
                      <Alert
                        type="error"
                        showIcon
                        title={duplicateBorrowerError}
                        style={{ marginBottom: 16 }}
                      />
                    )}
                    <Row gutter={14}>
                      <Col xs={24} md={10}>
                        <Form.Item
                          label="Họ tên người vay"
                          name={['borrower', 'fullName']}
                          rules={[
                            {
                              required: true,
                              message: 'Nhập họ tên người vay',
                            },
                          ]}
                        >
                          <Input placeholder="VD: Nguyễn Văn B" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={7}>
                        <Form.Item
                          label="Mã thành viên (Có thể bỏ trống)"
                          name={['borrower', 'memberCode']}
                        >
                          <Input placeholder="Thành viên mới để trống" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={7}>
                        <Form.Item
                          label="Số điện thoại (Có thể bỏ trống)"
                          name={['borrower', 'phone']}
                        >
                          <Input placeholder="SĐT người vay" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={8}>
                        <Form.Item
                          label="Loại giấy tờ người vay"
                          name={['borrower', 'idType']}
                          rules={[{ required: true }]}
                        >
                          <Select options={ID_TYPE_OPTIONS} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item
                          label="Số giấy tờ (12 số - Unique)"
                          name={['borrower', 'idNumber']}
                          rules={[
                            {
                              required: true,
                              message: 'Nhập 12 số giấy tờ',
                            },
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
                        <AutoIssuingAuthorityField
                          form={form}
                          idTypePath={['borrower', 'idType']}
                        />
                      </Col>

                      <Col xs={24} sm={6}>
                        <Form.Item
                          label="Ngày cấp (dd/mm/yyyy)"
                          name={['borrower', 'issueDate']}
                          rules={[{ required: true, message: 'Chọn ngày cấp' }]}
                        >
                          <DateInputDDMMYYYY />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={6}>
                        <Form.Item
                          label="Thời hạn giấy tờ (dd/mm/yyyy)"
                          name={['borrower', 'expiryDate']}
                        >
                          <DateInputDDMMYYYY placeholder="Có thể bỏ trống" />
                        </Form.Item>
                      </Col>

                      <AutoGenderAndBirthYearFields
                        form={form}
                        idNumberPath={['borrower', 'idNumber']}
                        colSpan={6}
                      />

                      <Col xs={24}>
                        <Form.Item
                          label="Địa chỉ người vay (Chọn từ Bảng Địa bàn: Ấp – Xã – Tỉnh Vĩnh Long)"
                          name={['borrower', 'hamletId']}
                          rules={[
                            {
                              required: true,
                              message: 'Vui lòng chọn Ấp của người vay',
                            },
                          ]}
                        >
                          <Select
                            showSearch
                            optionFilterProp="label"
                            placeholder="Chọn Ấp thuộc Xã – Tỉnh Vĩnh Long"
                            options={hamletSelectOptions}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider titlePlacement="left">
                      <Space>
                        <span>Thông tin Người thừa kế (Tối đa 1 người)</span>
                        <Switch
                          checked={hasHeir}
                          onChange={setHasHeir}
                          checkedChildren="Có người thừa kế"
                          unCheckedChildren="Không có"
                        />
                      </Space>
                    </Divider>

                    {hasHeir && (
                      <Row gutter={14}>
                        <Col xs={24} md={10}>
                          <Form.Item
                            label="Họ tên người thừa kế"
                            name={['borrower', 'heir', 'fullName']}
                            rules={[
                              {
                                required: true,
                                message: 'Nhập họ tên người thừa kế',
                              },
                            ]}
                          >
                            <Input placeholder="Họ và tên người thừa kế" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={7}>
                          <Form.Item
                            label="Quan hệ với người vay"
                            name={['borrower', 'heir', 'relationship']}
                            rules={[{ required: true }]}
                          >
                            <Select options={HEIR_RELATIONSHIP_OPTIONS} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={7}>
                          <Form.Item
                            label="SĐT người thừa kế (Có thể trống)"
                            name={['borrower', 'heir', 'phone']}
                          >
                            <Input placeholder="Có thể bỏ trống" />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={8}>
                          <Form.Item
                            label="Loại giấy tờ người thừa kế"
                            name={['borrower', 'heir', 'idType']}
                            rules={[{ required: true }]}
                          >
                            <Select options={ID_TYPE_OPTIONS} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                          <Form.Item
                            label="Số giấy tờ (12 số)"
                            name={['borrower', 'heir', 'idNumber']}
                            rules={[
                              { required: true, message: 'Nhập 12 số giấy tờ' },
                              { pattern: /^\d{12}$/, message: 'Đúng 12 chữ số' },
                            ]}
                          >
                            <Input maxLength={12} placeholder="084186123456" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                          <AutoIssuingAuthorityField
                            form={form}
                            idTypePath={['borrower', 'heir', 'idType']}
                          />
                        </Col>

                        <Col xs={24} sm={6}>
                          <Form.Item
                            label="Ngày cấp (dd/mm/yyyy)"
                            name={['borrower', 'heir', 'issueDate']}
                            rules={[
                              { required: true, message: 'Chọn ngày cấp' },
                            ]}
                          >
                            <DateInputDDMMYYYY />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={6}>
                          <Form.Item
                            label="Thời hạn giấy tờ (dd/mm/yyyy)"
                            name={['borrower', 'heir', 'expiryDate']}
                          >
                            <DateInputDDMMYYYY placeholder="Có thể bỏ trống" />
                          </Form.Item>
                        </Col>

                        <AutoGenderAndBirthYearFields
                          form={form}
                          idNumberPath={['borrower', 'heir', 'idNumber']}
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
                            name={['borrower', 'heir', 'address']}
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
                  </>
                )}
              </Card>

              {/* KHỐI II: THÔNG TIN KHOẢN VAY & LÃI SUẤT */}
              <Card title="II. Thông tin Khoản vay, Lãi suất & Trạng thái">
                <Row gutter={14}>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item
                      label="Loại vay"
                      name="loanType"
                      rules={[{ required: true }]}
                    >
                      <Select options={LOAN_TYPE_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item
                      label="Thời hạn vay"
                      name="durationType"
                      rules={[{ required: true }]}
                    >
                      <Select options={LOAN_DURATION_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item
                      label="Trạng thái khoản vay"
                      name="status"
                      rules={[{ required: true }]}
                    >
                      <Select options={LOAN_STATUS_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item
                      label={
                        watchedLoanType === 'THE_CHAP'
                          ? 'Số khế ước (Bắt buộc)'
                          : 'Số khế ước (Tùy chọn)'
                      }
                      name="indentureNumber"
                      rules={
                        watchedLoanType === 'THE_CHAP'
                          ? [
                              {
                                required: true,
                                message:
                                  'Vay Thế chấp bắt buộc nhập Số khế ước',
                              },
                            ]
                          : []
                      }
                    >
                      <Input
                        placeholder={
                          watchedLoanType === 'THE_CHAP'
                            ? 'VD: KU-2026-001'
                            : 'Tùy chọn (Nhập sau khi giải ngân)'
                        }
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12} md={8}>
                    <Form.Item
                      label="Số tiền vay (VNĐ)"
                      name="loanAmount"
                      rules={[{ required: true, message: 'Nhập số tiền vay' }]}
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
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item
                      label="Lãi suất (% - Tự động theo mốc / Cán bộ nhập)"
                      name="interestRate"
                      rules={[
                        {
                          required: true,
                          message: 'Nhập hoặc cấu hình mức lãi suất',
                        },
                      ]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        step={0.05}
                        suffix="%"
                        placeholder="Tự lấy từ đợt lãi suất đang áp dụng"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <AutoDueDateField form={form} />
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Ngày vay (Mặc định hôm nay – dd/mm/yyyy)"
                      name="loanDate"
                      rules={[{ required: true, message: 'Chọn ngày vay' }]}
                    >
                      <DateInputDDMMYYYY />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Ngày giải ngân (Tùy chọn khi lập hồ sơ – dd/mm/yyyy)"
                      name="disbursementDate"
                    >
                      <DateInputDDMMYYYY placeholder="Tùy chọn (Tự điền hôm nay khi chọn Đã giải ngân)" />
                    </Form.Item>
                  </Col>

                  {/* CHỈ KHI LÀ THẾ CHẤP MỚI SHOW 3 TRƯỜNG HỢP ĐỒNG THẾ CHẤP */}
                  {watchedLoanType === 'THE_CHAP' && (
                    <>
                      <Col xs={24} sm={8}>
                        <Form.Item
                          label="Số hợp đồng thế chấp (Bắt buộc)"
                          name="mortgageContractNumber"
                          rules={[
                            {
                              required: true,
                              message: 'Nhập số hợp đồng thế chấp',
                            },
                          ]}
                        >
                          <Input placeholder="VD: HDTC-2026-001" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item
                          label="Ngày chứng thực Ủy ban (Tùy chọn)"
                          name="committeeNotarizationDate"
                        >
                          <DateInputDDMMYYYY placeholder="Tùy chọn (Nhập sau trong Edit)" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item
                          label="Thời hạn HĐ thế chấp (dd/mm/yyyy)"
                          name="mortgageContractTermDate"
                          rules={[
                            {
                              required: true,
                              message: 'Chọn thời hạn hợp đồng thế chấp',
                            },
                          ]}
                        >
                          <DateInputDDMMYYYY />
                        </Form.Item>
                      </Col>
                    </>
                  )}
                </Row>
              </Card>

              {/* KHỐI III: DANH SÁCH TÀI SẢN THẾ CHẤP / BẢO ĐẢM */}
              <Card
                title={
                  watchedLoanType === 'THE_CHAP'
                    ? 'III. Danh sách Tài sản Thế chấp (Quyền sử dụng đất)'
                    : 'III. Danh sách Tài sản Bảo đảm (Quyền sử dụng đất)'
                }
              >
                <Form.List name="collateralAssets">
                  {(fields, { add, remove }) => (
                    <Space
                      orientation="vertical"
                      size={16}
                      style={{ width: '100%' }}
                    >
                      {fields.map(({ key, name }, index) => (
                        <CollateralAssetRowCard
                          key={key}
                          form={form}
                          fieldName={name}
                          index={index}
                          canRemove={fields.length > 1}
                          onRemove={() => remove(name)}
                          territoryOptions={collateralTerritoryOptions}
                        />
                      ))}

                      <Button
                        type="dashed"
                        block
                        icon={<PlusOutlined />}
                        onClick={() =>
                          add({
                            assetType: 'QSDD',
                            certificateType: 'GCN',
                            ownerType: 'NGUOI_VAY_CA_NHAN',
                            area: 500,
                            usageForm: '',
                            usagePurpose: '',
                            usageTerm: 'Lâu dài',
                            usageOrigin: '',
                            usageRestriction: '',
                          })
                        }
                      >
                        Thêm Tài sản Bảo đảm khác
                      </Button>
                    </Space>
                  )}
                </Form.List>
              </Card>

              {/* KHỐI IV: SECTION RIÊNG ĐỊNH GIÁ TÀI SẢN THẾ CHẤP (CHỈ HIỂN THỊ KHI THẾ CHẤP) */}
              <CollateralValuationSection form={form} />

              {/* KHỐI V: CHỈ HIỂN THỊ KHI THẾ CHẤP VÀ SỐ TIỀN VAY >= 140.000.000Đ */}
              <ConditionalRelatedPersonsSection form={form} />

              {/* KHỐI VI: CHỈ HIỂN THỊ KHI THẾ CHẤP VÀ CÓ TÀI SẢN ĐẤT HỘ */}
              <ConditionalHouseholdMembersSection form={form} />

              {/* KHỐI VII: PHƯƠNG ÁN VAY VỐN */}
              <Card title="VII. Phương án Vay vốn (Tổng nhu cầu vốn, Chi phí, Nguồn thu & Lợi nhuận)">
                <Row gutter={16}>
                  <Col xs={24} md={15}>
                    <Form.Item
                      label="Mục đích vay vốn"
                      name={['loanPlan', 'loanPurpose']}
                      rules={[
                        {
                          required: true,
                          message: 'Vui lòng nhập mục đích vay vốn',
                        },
                      ]}
                    >
                      <Input placeholder="VD: Đầu tư chi phí sản xuất nông nghiệp, mua phân bón..." />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={9}>
                    <Form.Item
                      label="Tổng nhu cầu vốn của phương án (VNĐ)"
                      name={['loanPlan', 'totalCapitalNeed']}
                      rules={[
                        {
                          required: true,
                          message: 'Nhập tổng nhu cầu vốn của phương án',
                        },
                      ]}
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
                </Row>

                <Row gutter={20}>
                  <Col xs={24} md={12}>
                    <Divider titlePlacement="left" style={{ marginTop: 0 }}>
                      1. Danh sách Chi phí (Do cán bộ tự nhập)
                    </Divider>
                    <Form.List name={['loanPlan', 'expenses']}>
                      {(fields, { add, remove }) => (
                        <Space
                          orientation="vertical"
                          size={8}
                          style={{ width: '100%' }}
                        >
                          {fields.map(({ key, name, ...restField }) => (
                            <Space
                              key={key}
                              style={{ display: 'flex', width: '100%' }}
                              align="baseline"
                            >
                              <Form.Item
                                {...restField}
                                name={[name, 'itemName']}
                                rules={[
                                  {
                                    required: true,
                                    message: 'Nhập tên khoản chi',
                                  },
                                ]}
                                style={{ flex: 1, marginBottom: 4 }}
                              >
                                <Input placeholder="Tên khoản mục chi phí" />
                              </Form.Item>
                              <Form.Item
                                {...restField}
                                name={[name, 'amount']}
                                rules={[
                                  { required: true, message: 'Nhập số tiền' },
                                ]}
                                style={{ width: 165, marginBottom: 4 }}
                              >
                                <InputNumber
                                  style={{ width: '100%' }}
                                  min={0}
                                  step={1_000_000}
                                  formatter={(v) =>
                                    `${v}`.replace(
                                      /\B(?=(\d{3})+(?!\d))/g,
                                      ',',
                                    )
                                  }
                                />
                              </Form.Item>
                              {fields.length > 1 && (
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => remove(name)}
                                />
                              )}
                            </Space>
                          ))}
                          <Button
                            type="dashed"
                            size="small"
                            block
                            icon={<PlusOutlined />}
                            onClick={() => add({ itemName: '', amount: 0 })}
                          >
                            Thêm khoản Chi phí
                          </Button>
                        </Space>
                      )}
                    </Form.List>
                  </Col>

                  <Col xs={24} md={12}>
                    <Divider titlePlacement="left" style={{ marginTop: 0 }}>
                      2. Danh sách Nguồn thu
                    </Divider>
                    <Form.List name={['loanPlan', 'revenues']}>
                      {(fields, { add, remove }) => (
                        <Space
                          orientation="vertical"
                          size={8}
                          style={{ width: '100%' }}
                        >
                          {fields.map(({ key, name, ...restField }) => (
                            <Space
                              key={key}
                              style={{ display: 'flex', width: '100%' }}
                              align="baseline"
                            >
                              <Form.Item
                                {...restField}
                                name={[name, 'itemName']}
                                rules={[
                                  {
                                    required: true,
                                    message: 'Nhập tên nguồn thu',
                                  },
                                ]}
                                style={{ flex: 1, marginBottom: 4 }}
                              >
                                <Input placeholder="Tên khoản mục nguồn thu" />
                              </Form.Item>
                              <Form.Item
                                {...restField}
                                name={[name, 'amount']}
                                rules={[
                                  { required: true, message: 'Nhập số tiền' },
                                ]}
                                style={{ width: 165, marginBottom: 4 }}
                              >
                                <InputNumber
                                  style={{ width: '100%' }}
                                  min={0}
                                  step={1_000_000}
                                  formatter={(v) =>
                                    `${v}`.replace(
                                      /\B(?=(\d{3})+(?!\d))/g,
                                      ',',
                                    )
                                  }
                                />
                              </Form.Item>
                              {fields.length > 1 && (
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => remove(name)}
                                />
                              )}
                            </Space>
                          ))}
                          <Button
                            type="dashed"
                            size="small"
                            block
                            icon={<PlusOutlined />}
                            onClick={() => add({ itemName: '', amount: 0 })}
                          >
                            Thêm khoản Nguồn thu
                          </Button>
                        </Space>
                      )}
                    </Form.List>
                  </Col>
                </Row>
              </Card>
            </Space>
          </Col>

          {/* CỘT PHẢI (STICKY): CÔ LẬP RE-RENDER ĐỂ NHẬP FORM MƯỢT */}
          <Col xs={24} xl={7} style={{ position: 'sticky', top: 84 }}>
            <StickyLoanSummaryCard form={form} submitting={submitting} />
          </Col>
        </Row>
      </Form>
    </Space>
  );
}
