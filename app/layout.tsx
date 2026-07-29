import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GPM Youth Ministry Ledger',
  description: 'Weekly contribution ledger for the youth group',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
