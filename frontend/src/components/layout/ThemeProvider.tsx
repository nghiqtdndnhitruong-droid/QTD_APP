'use client';

import React from 'react';
import { App as AntdApp, ConfigProvider, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#0EA5E9',
          colorSuccess: '#10B981',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          colorInfo: '#0EA5E9',
          colorBgBase: '#0B0F19',
          colorBgContainer: '#111827',
          colorBgElevated: '#161F30',
          colorBgLayout: '#0B0F19',
          colorBgContainerDisabled: '#161F30',
          colorTextDisabled: '#D1D5DB',
          colorBorder: '#1F2937',
          colorBorderSecondary: '#1E293B',
          colorText: '#F3F4F6',
          colorTextSecondary: '#9CA3AF',
          colorTextPlaceholder: '#6B7280',
          borderRadius: 10,
          fontSize: 14,
          fontFamily:
            'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        components: {
          Layout: {
            headerBg: '#111827',
            siderBg: '#0E1422',
            bodyBg: '#0B0F19',
          },
          Card: {
            colorBgContainer: '#111827',
            colorBorderSecondary: '#1F2937',
          },
          Table: {
            headerBg: '#161F30',
            rowHoverBg: '#1A2438',
            borderColor: '#1F2937',
          },
          Input: {
            colorBgContainer: '#0D1322',
            colorBgContainerDisabled: '#161F30',
            colorTextDisabled: '#D1D5DB',
            activeBorderColor: '#0EA5E9',
          },
          Select: {
            colorBgContainer: '#0D1322',
            colorBgContainerDisabled: '#161F30',
            colorTextDisabled: '#D1D5DB',
            optionSelectedBg: 'rgba(14, 165, 233, 0.22)',
          },
          InputNumber: {
            colorBgContainer: '#0D1322',
            colorBgContainerDisabled: '#161F30',
            colorTextDisabled: '#D1D5DB',
          },
          DatePicker: {
            colorBgContainer: '#0D1322',
            colorBgElevated: '#161F30',
            colorBgContainerDisabled: '#161F30',
            colorTextDisabled: '#D1D5DB',
          },
          Radio: {
            buttonBg: '#0D1322',
            buttonCheckedBg: '#0EA5E9',
            colorText: '#F3F4F6',
          },
          Descriptions: {
            labelBg: '#161F30',
            colorTextSecondary: '#9CA3AF',
            colorText: '#F3F4F6',
          },
          Menu: {
            darkItemBg: '#0E1422',
            darkItemSelectedBg: 'rgba(14, 165, 233, 0.16)',
            darkItemSelectedColor: '#38BDF8',
          },
        },
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
