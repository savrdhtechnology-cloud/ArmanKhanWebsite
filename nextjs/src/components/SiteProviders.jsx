"use client";
import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { Layout } from "@/components/Layout";

export function SiteProviders({ children }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } }));

  // PWA service worker (same behaviour as the CRA build)
  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.protocol === "https:") {
      navigator.serviceWorker.register("/sw.js").catch((e) => console.warn("SW register failed", e));
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Layout>{children}</Layout>
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{ style: { background: "#111", border: "1px solid rgba(201,169,97,0.4)", color: "#fff" } }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
