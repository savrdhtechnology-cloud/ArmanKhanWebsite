import type { Metadata, Viewport } from 'next';
import { StoreSync } from '@/network/components/StoreSync';
import '@/network/network.css';

export const metadata: Metadata = {
  title: { default: 'Arman Partner Network', template: '%s · Arman Partner Network' },
  description: 'Book Arman Hair Studio experts at partner salons in Bhopal, and run partner salons, experts, bookings and settlements.',
  icons: { icon: '/assets/favicon.png', apple: '/assets/app-icon-192.png' },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: '#0b0a08', width: 'device-width', initialScale: 1 };

const themeScript = "try{var t=localStorage.getItem('arman-network-theme');if(t==='noir'||t==='ivory')document.documentElement.dataset.theme=t}catch(e){}";

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="ivory" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" />
      </head>
      <body>
        <StoreSync />
        {children}
      </body>
    </html>
  );
}
