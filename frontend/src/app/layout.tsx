import type { Metadata } from 'next';
import '@/styles/globals.css';
import { ConvexClientProvider } from '@/components/providers/ConvexProvider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: { default: 'AuroraMart', template: '%s — AuroraMart' },
  description: 'Premium goods, delivered. Electronics, fashion, food, home and more.',
  keywords: ['shopping', 'ecommerce', 'nigeria', 'online store', 'marketplace'],
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    siteName: 'AuroraMart',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ConvexClientProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                fontFamily: 'var(--font-sans)',
                background: '#1a1714',
                color: '#f7f4ef',
                border: '1px solid #3d3a37',
                borderRadius: '5px',
              },
            }}
          />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
