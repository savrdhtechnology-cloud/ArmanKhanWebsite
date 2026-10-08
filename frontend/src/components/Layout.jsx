import React from "react";
import { useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppFAB } from "@/components/WhatsAppFAB";
import { PageTransition, ScrollProgress } from "@/components/Motion";

export const Layout = ({ children }) => {
  const { pathname } = useLocation();
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#050505] text-white grain overflow-x-clip">
        <ScrollProgress />
        <Navbar />
        <main className="pt-20 lg:pt-24">
          <PageTransition routeKey={pathname}>{children}</PageTransition>
        </main>
        <Footer />
        <WhatsAppFAB />
      </div>
    </MotionConfig>
  );
};
