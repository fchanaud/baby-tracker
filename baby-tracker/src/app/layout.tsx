import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '👶 Baby Tracker',
  description: 'Mobile-first baby activity tracking for sleep-deprived parents',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#3b82f6',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
