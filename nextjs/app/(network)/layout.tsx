import type { Metadata, Viewport } from 'next';
import { Manrope, Playfair_Display } from 'next/font/google';
import { StoreSync } from '@/network/components/StoreSync';
import '@/network/network.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-playfair', display: 'swap' });

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
    <html lang="en" className={`${manrope.variable} ${playfair.variable}`} data-theme="ivory" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <StoreSync />
        {children}
      </body>
    </html>
  );
}
