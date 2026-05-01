import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { CartDrawer } from '@/components/CartDrawer';
import { ToastProvider } from '@/components/Toast';
import { StoreHydration } from '@/components/StoreHydration';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Moudestar — Boutique Mode Premium',
  description: 'Découvrez la collection Moudestar. Mode premium, designs épurés et intemporels.',
  openGraph: {
    title: 'Moudestar — Boutique Mode Premium',
    description: 'Découvrez la collection Moudestar.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-dark min-h-screen">
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
