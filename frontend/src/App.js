import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Gallery from "@/pages/Gallery";
import Reviews from "@/pages/Reviews";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";
import Staff from "@/pages/Staff";
import MobileApp from "@/pages/MobileApp";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/about" element={<Layout><About /></Layout>} />
          <Route path="/services" element={<Layout><Services /></Layout>} />
          <Route path="/gallery" element={<Layout><Gallery /></Layout>} />
          <Route path="/reviews" element={<Layout><Reviews /></Layout>} />
          <Route path="/contact" element={<Layout><Contact /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/register" element={<Layout><Register /></Layout>} />
          <Route path="/account" element={<Layout><ProtectedRoute><Account /></ProtectedRoute></Layout>} />
          <Route path="/admin/login" element={<Layout><Login adminMode /></Layout>} />
          <Route path="/admin" element={<Layout><ProtectedRoute adminOnly><Admin /></ProtectedRoute></Layout>} />
          <Route path="/staff/login" element={<Layout><Login staffMode /></Layout>} />
          <Route path="/staff" element={<Layout><ProtectedRoute staffOnly><Staff /></ProtectedRoute></Layout>} />
          <Route path="/app" element={<Layout><MobileApp /></Layout>} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: { background: "#111", border: "1px solid rgba(201,169,97,0.4)", color: "#fff" },
        }}
      />
    </AuthProvider>
  );
}

export default App;
