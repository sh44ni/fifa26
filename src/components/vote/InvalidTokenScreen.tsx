"use client";

import { motion } from "framer-motion";
import { QrCode } from "lucide-react";

export function InvalidTokenScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 ambient-bg relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="mesh-orb mesh-orb-gold" style={{ top: "20%", left: "-10%" }} />
        <div className="mesh-orb mesh-orb-purple" style={{ bottom: "10%", right: "-5%" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full glass-panel-strong rounded-3xl p-10 text-center space-y-6 relative z-10"
      >
        {/* Animated QR icon with scan line */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FFD700]/15 to-transparent flex items-center justify-center mx-auto border border-[#FFD700]/10 relative overflow-hidden"
        >
          <QrCode className="w-12 h-12 text-[#FFD700]" />
          <div className="scan-line" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">2026 World Cup Draw</h1>
          <p className="text-[#FFD700] font-bold text-lg gold-shimmer">PAYOUT VOTE</p>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-[rgba(255,215,0,0.2)] to-transparent" />

        <p className="text-[#888] text-sm leading-relaxed">
          Please scan the QR code to access the voting form.
          <br />
          Contact the organizer if you need assistance.
        </p>
      </motion.div>
    </div>
  );
}
