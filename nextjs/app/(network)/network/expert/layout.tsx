import { ExpertShell } from "@/network/views/expert";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ExpertShell>{children}</ExpertShell>;
}
