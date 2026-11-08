'use client';

import React from 'react';
import { Col, Form, FormInstance, Input } from 'antd';
import { IdentityCardType } from '@/types/credit.types';
import {
  getIssuingAuthorityByIdType,
  parseTwelveDigitIdCard,
} from '@/utils/credit.helpers';

interface AutoIssuingAuthorityFieldProps {
  form: FormInstance;
  idTypePath: string | (string | number)[];
  label?: string;
}

/**
 * Component con cô lập re-render: Chỉ render lại đúng ô Nơi cấp khi Loại giấy tờ thay đổi
 */
export const AutoIssuingAuthorityField: React.FC<AutoIssuingAuthorityFieldProps> =
  React.memo(function AutoIssuingAuthorityField({
    form,
    idTypePath,
    label = 'Nơi cấp (Tự động)',
  }) {
    const idType = Form.useWatch<IdentityCardType>(idTypePath, form);
    return (
      <Form.Item label={label}>
        <Input disabled value={getIssuingAuthorityByIdType(idType)} />
      </Form.Item>
    );
  });

interface AutoGenderAndBirthYearFieldsProps {
  form: FormInstance;
  idNumberPath: string | (string | number)[];
  colSpan?: number;
}

/**
 * Component con cô lập re-render: Chỉ render lại đúng 2 ô Giới tính & Năm sinh khi 12 số giấy tờ thay đổi
 */
export const AutoGenderAndBirthYearFields: React.FC<AutoGenderAndBirthYearFieldsProps> =
  React.memo(function AutoGenderAndBirthYearFields({
    form,
    idNumberPath,
    colSpan = 6,
  }) {
    const idNumber = Form.useWatch<string>(idNumberPath, form);
    const parsed = parseTwelveDigitIdCard(idNumber);

    return (
      <>
        <Col xs={24} sm={colSpan}>
          <Form.Item label="Giới tính (Tự động)">
            <Input
              disabled
              value={parsed.isValid ? parsed.genderLabel : '—'}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={colSpan}>
          <Form.Item label="Năm sinh (Tự động)">
            <Input disabled value={parsed.isValid ? parsed.birthYear : '—'} />
          </Form.Item>
        </Col>
      </>
    );
  });
