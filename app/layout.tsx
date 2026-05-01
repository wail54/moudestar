import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { CartDrawer } from '@/components/CartDrawer';
import { ToastProvider } from '@/components/Toast';
import { StoreHydration } from '@/components/StoreHydration';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Moudestar — Maison de Mode',
  description: 'Collection Moudestar. Mode premium, minimaliste et intemporel.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]`}>
        <ToastProvider>
          <StoreHydration />
          <Header />
          <CartDrawer />
          <main>{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
