import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const ProtectedRoute = ({ children, adminOnly = false, staffOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-brand-gold">Loading...</div>;
  if (!user) return <Navigate to={adminOnly ? "/admin/login" : staffOnly ? "/staff/login" : "/login"} replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;
  if (staffOnly && user.role !== "staff" && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
};
