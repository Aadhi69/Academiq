import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';

export const metadata: Metadata = {
  title: 'Academiq — Faculty Work Assignment & Progress Management Platform',
  description: 'Department of Electrical & Electronics Engineering — Kalasalingam Academy of Research and Education',
  icons: {
    icon: '/images/academiq-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#F8FAFC]">
      <body className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
