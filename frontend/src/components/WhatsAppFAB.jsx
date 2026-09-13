import React from "react";
import { MessageCircle } from "lucide-react";

export const WhatsAppFAB = () => (
  <a
    href="https://wa.me/918878356060?text=Hi%20Arman%20Hair%20Studio%2C%20I%20want%20to%20book%20an%20appointment."
    target="_blank"
    rel="noreferrer"
    data-testid="whatsapp-fab"
    className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
    aria-label="WhatsApp booking"
  >
    <MessageCircle className="w-7 h-7 text-white" />
  </a>
);
