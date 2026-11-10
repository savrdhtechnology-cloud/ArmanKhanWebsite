import Staff from "@/pages/Staff";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const metadata = { title: "Staff" };

export default function Page() {
  return <ProtectedRoute staffOnly><Staff /></ProtectedRoute>;
}
