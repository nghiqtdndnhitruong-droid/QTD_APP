import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Geist, Geist_Mono } from 'next/font/google';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Hệ thống Quản lý Tín dụng - QTD',
  description: 'Hệ thống quản lý nghiệp vụ tín dụng cho Quỹ Tín Dụng Nhân Dân',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AntdRegistry>
          <ThemeProvider>
            <AuthProvider>
              <AppShell>{children}</AppShell>
            </AuthProvider>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
