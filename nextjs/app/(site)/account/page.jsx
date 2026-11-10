import Account from "@/screens/Account";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const metadata = { title: "My account" };

export default function Page() {
  return <ProtectedRoute><Account /></ProtectedRoute>;
}
