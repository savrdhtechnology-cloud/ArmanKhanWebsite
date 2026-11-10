import { PartnerShell } from "@/network/views/partner";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PartnerShell>{children}</PartnerShell>;
}
