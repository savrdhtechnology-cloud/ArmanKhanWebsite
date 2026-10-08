import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Divider, SectionLabel } from "@/components/Divider";
import { formatError } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Stagger, StaggerItem } from "@/components/Motion";

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
      <motion.div
        className="w-full max-w-md bg-[#111111] border border-brand-gold/30 p-10"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <SectionLabel>{subtitle}</SectionLabel>
        <h1 className="font-playfair text-4xl text-white mb-2">{title}</h1>
        <Divider className="!justify-start" />
        <Stagger as="form" onSubmit={submit} className="space-y-4" animateOnMount stagger={0.1} delay={0.35}>
          <StaggerItem as="input" distance={16} className="luxury-input" type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} data-testid="login-email" required />
          <StaggerItem as="input" distance={16} className="luxury-input" type="password" placeholder="Password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} data-testid="login-password" required />
          <StaggerItem as="button" distance={16} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn-gold w-full" disabled={loading} data-testid="login-submit">{loading ? "Signing in..." : "Sign In"}</StaggerItem>
        </Stagger>
        {!adminMode && !staffMode && (
          <p className="text-white/50 text-sm text-center mt-6">
            No account? <Link to="/register" className="text-brand-gold hover:underline" data-testid="link-register">Create one</Link>
          </p>
        )}
        {staffMode && (
          <p className="text-white/40 text-xs text-center mt-6">Ask your admin for staff credentials.</p>
        )}
      </motion.div>
    </div>
  );
}
