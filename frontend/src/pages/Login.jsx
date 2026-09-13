import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Divider, SectionLabel } from "@/components/Divider";
import { formatError } from "@/lib/api";
import { toast } from "sonner";

export default function Login({ adminMode = false, staffMode = false }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(f.email, f.password);
      if (adminMode && u.role !== "admin") {
        toast.error("Not an admin account");
        return;
      }
      if (staffMode && u.role !== "staff" && u.role !== "admin") {
        toast.error("Not a staff account");
        return;
      }
      toast.success("Welcome back!");
      if (u.role === "admin") navigate("/admin");
      else if (u.role === "staff") navigate("/staff");
      else navigate("/account");
    } catch (e) {
      toast.error(formatError(e.response?.data?.detail));
    } finally { setLoading(false); }
  };

  const title = adminMode ? "Admin Login" : staffMode ? "Staff Login" : "Sign In";
  const subtitle = adminMode ? "Admin Access" : staffMode ? "Employee Portal" : "Welcome Back";

  return (
    <div data-testid="login-page" className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md bg-[#111111] border border-brand-gold/30 p-10">
        <SectionLabel>{subtitle}</SectionLabel>
        <h1 className="font-playfair text-4xl text-white mb-2">{title}</h1>
        <Divider className="!justify-start" />
        <form onSubmit={submit} className="space-y-4">
          <input className="luxury-input" type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} data-testid="login-email" required />
          <input className="luxury-input" type="password" placeholder="Password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} data-testid="login-password" required />
          <button className="btn-gold w-full" disabled={loading} data-testid="login-submit">{loading ? "Signing in..." : "Sign In"}</button>
        </form>
        {!adminMode && !staffMode && (
          <p className="text-white/50 text-sm text-center mt-6">
            No account? <Link to="/register" className="text-brand-gold hover:underline" data-testid="link-register">Create one</Link>
          </p>
        )}
        {staffMode && (
          <p className="text-white/40 text-xs text-center mt-6">Ask your admin for staff credentials.</p>
        )}
      </div>
    </div>
  );
}
