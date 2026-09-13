import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Divider, SectionLabel } from "@/components/Divider";
import { formatError } from "@/lib/api";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(f);
      toast.success("Account created!");
      navigate("/account");
    } catch (e) {
      toast.error(formatError(e.response?.data?.detail));
    } finally { setLoading(false); }
  };

  return (
    <div data-testid="register-page" className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md bg-[#111111] border border-brand-gold/30 p-10">
        <SectionLabel>Join</SectionLabel>
        <h1 className="font-playfair text-4xl text-white mb-2">Create Account</h1>
        <Divider className="!justify-start" />
        <form onSubmit={submit} className="space-y-4">
          <input className="luxury-input" placeholder="Full Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} data-testid="reg-name" required />
          <input className="luxury-input" type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} data-testid="reg-email" required />
          <input className="luxury-input" placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} data-testid="reg-phone" />
          <input className="luxury-input" type="password" placeholder="Password (min 6 chars)" minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} data-testid="reg-password" required />
          <button className="btn-gold w-full" disabled={loading} data-testid="reg-submit">{loading ? "Creating..." : "Create Account"}</button>
        </form>
        <p className="text-white/50 text-sm text-center mt-6">
          Have an account? <Link to="/login" className="text-brand-gold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
