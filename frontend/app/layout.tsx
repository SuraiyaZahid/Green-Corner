import type { Metadata } from 'next';
import './globals.css';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';

export const metadata: Metadata = {
  title: {
    default: 'Green Corner — Plants & Gardening Supplies in Bangladesh',
    template: '%s | Green Corner',
  },
  description:
    'Buy indoor and outdoor plants, Joibo Sar compost and fertiliser, gardening tools, seed packets and pots online. Cash on Delivery, bKash and Nagad across Bangladesh.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <AuthProvider>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
