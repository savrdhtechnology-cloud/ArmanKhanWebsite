import React from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

export const WhatsAppFAB = () => (
  <motion.a
    href="https://wa.me/918878356060?text=Hi%20Arman%20Hair%20Studio%2C%20I%20want%20to%20book%20an%20appointment."
    target="_blank"
    rel="noreferrer"
    data-testid="whatsapp-fab"
    className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg"
    aria-label="WhatsApp booking"
    initial={{ scale: 0, opacity: 0, rotate: -90 }}
    animate={{ scale: 1, opacity: 1, rotate: 0 }}
    transition={{ type: "spring", stiffness: 260, damping: 18, delay: 1.2 }}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.92 }}
  >
    {/* Soft pulsing ring */}
    <motion.span
      aria-hidden="true"
      className="absolute inset-0 rounded-full bg-[#25D366]"
      animate={{ scale: [1, 1.6], opacity: [0.45, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeOut", repeatDelay: 0.6 }}
    />
    <motion.span
      className="relative"
      animate={{ rotate: [0, -12, 12, -8, 0] }}
      transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 4, delay: 2 }}
    >
      <MessageCircle className="w-7 h-7 text-white" />
    </motion.span>
  </motion.a>
);
