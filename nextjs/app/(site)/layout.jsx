import "@/index.css";
import { SiteProviders } from "@/components/SiteProviders";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://armanhairstudio.com"),
  title: { default: "Arman Hair Studio — The Art of Hair · Bhopal", template: "%s · Arman Hair Studio" },
  description:
    "Arman Hair Studio — Premium Ladies & Gents Hair Specialist in Bhopal. Signature haircuts, hair colour, keratin, bridal styling. Book your chair today. Call 8878356060.",
  keywords: ["Arman Hair Studio", "Bhopal salon", "hair studio Bhopal", "unisex salon", "bridal hair", "keratin treatment", "hair colour", "Arman Khan"],
  manifest: "/manifest.json",
  icons: { icon: [{ url: "/assets/favicon.png", sizes: "64x64", type: "image/png" }], apple: [{ url: "/assets/app-icon-192.png" }, { url: "/assets/app-icon-512.png", sizes: "512x512" }] },
  appleWebApp: { capable: true, title: "Arman Studio", statusBarStyle: "black-translucent" },
  applicationName: "Arman Hair Studio",
};

export const viewport = { themeColor: "#050505", width: "device-width", initialScale: 1 };

export default function SiteLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SiteProviders>{children}</SiteProviders>
      </body>
    </html>
  );
}
