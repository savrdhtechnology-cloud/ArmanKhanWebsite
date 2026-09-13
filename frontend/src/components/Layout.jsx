import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppFAB } from "@/components/WhatsAppFAB";

export const Layout = ({ children }) => (
  <div className="min-h-screen bg-[#050505] text-white grain">
    <Navbar />
    <main className="pt-20 lg:pt-24">{children}</main>
    <Footer />
    <WhatsAppFAB />
  </div>
);
