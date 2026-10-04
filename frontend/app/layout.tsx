import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth';
import { ToastProvider } from '../components/Toast';
import LayoutWrapper from '../components/LayoutWrapper';

export const metadata: Metadata = {
  title: 'CampusHub - Student & Academic Portal',
  description: 'CampusHub Academic Management and Student Laboratory Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <AuthProvider>
          <ToastProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
