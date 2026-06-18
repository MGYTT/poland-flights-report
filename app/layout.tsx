// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '✈️ Raport Lotniczy Polska',
  description: 'Dzienny raport lotów przylatujących i odlatujących z Polski',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-gray-950">{children}</body>
    </html>
  );
}