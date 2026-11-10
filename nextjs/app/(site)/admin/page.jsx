import Admin from "@/pages/Admin";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const metadata = { title: "Admin" };

export default function Page() {
  return <ProtectedRoute adminOnly><Admin /></ProtectedRoute>;
}
