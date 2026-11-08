'use client';

import React, { useEffect, useState } from 'react';
import { CalendarOutlined } from '@ant-design/icons';
import { DatePicker, Input } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const DISPLAY_FORMAT = 'DD/MM/YYYY';

interface DateInputDDMMYYYYProps {
  value?: string | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Chuẩn hóa chuỗi ngày (ISO hoặc dd/mm/yyyy) sang dd/mm/yyyy
 */
function normalizeToDDMMYYYY(val?: string | null): string {
  if (!val) return '';
  const trimmed = String(val).trim();
  if (!trimmed) return '';

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // Nếu đang gõ dở (VD: "02/" hoặc "02/03/") thì giữ nguyên
  if (/^\d{1,2}\/?(\d{1,2}\/?(\d{0,4})?)?$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = dayjs(trimmed);
  if (parsed.isValid()) {
    return parsed.format(DISPLAY_FORMAT);
  }
  return trimmed;
}

/**
 * Tự động thêm dấu "/" khi gõ đủ số:
 * - Gõ "02" -> tự thêm "/" thành "02/"
 * - Gõ tiếp "03" -> tự thêm "/" thành "02/03/"
 * - Gõ tiếp "2026" -> thành "02/03/2026"
 * - Hỗ trợ xóa lùi (Backspace) mượt mà không bị kẹt ở dấu "/"
 */
function formatAutoSlashDateInput(raw: string, prev: string): string {
  const isDeleting = raw.length < prev.length;
  const digits = raw.replace(/\D/g, '').slice(0, 8);

  if (digits.length === 0) return '';

  if (isDeleting) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }

  if (digits.length < 2) return digits;
  if (digits.length === 2) return `${digits}/`;
  if (digits.length < 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  if (digits.length === 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

export const DateInputDDMMYYYY: React.FC<DateInputDDMMYYYYProps> = React.memo(
  function DateInputDDMMYYYY({
    value,
    onChange,
    placeholder = 'dd/mm/yyyy (VD: 02/03/2026)',
    disabled = false,
  }) {
    const [text, setText] = useState<string>(() => normalizeToDDMMYYYY(value));

    useEffect(() => {
      const normalized = normalizeToDDMMYYYY(value);
      setText(normalized);
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatAutoSlashDateInput(e.target.value, text);
      setText(formatted);
      onChange?.(formatted);
    };

    const handleCalendarChange = (date: Dayjs | null) => {
      const formatted =
        date && date.isValid() ? date.format(DISPLAY_FORMAT) : '';
      setText(formatted);
      onChange?.(formatted);
    };

    const parsedDayjs =
      /^\d{2}\/\d{2}\/\d{4}$/.test(text) &&
      dayjs(text, DISPLAY_FORMAT, true).isValid()
        ? dayjs(text, DISPLAY_FORMAT, true)
        : null;

    return (
      <Input
        value={text}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={10}
        allowClear={!disabled}
        suffix={
          !disabled ? (
            <DatePicker
              value={parsedDayjs}
              onChange={handleCalendarChange}
              format={DISPLAY_FORMAT}
              allowClear={false}
              variant="borderless"
              suffixIcon={
                <CalendarOutlined
                  style={{ color: '#38BDF8', cursor: 'pointer' }}
                />
              }
              style={{
                width: 26,
                padding: 0,
                height: 22,
              }}
              styles={{
                root: {
                  cursor: 'pointer',
                },
              }}
            />
          ) : (
            <CalendarOutlined style={{ color: '#6B7280' }} />
          )
        }
      />
    );
  },
);
