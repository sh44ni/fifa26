"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { VOTING_OPTIONS, TOTAL_POT } from "@/lib/voting-options";
import { Trophy, Check, Send, User, ChevronRight } from "lucide-react";

interface VotingFormProps {
  token: string;
}

/* ── Payout breakdown bar ── */
function PayoutBar({ first, second, third, fourth }: { first: number; second: number; third: number; fourth: number }) {
  const total = first + second + third + fourth;
  const segments = [
    { value: first, color: "bg-gradient-to-r from-[#FFD700] to-[#FFA500]", label: "1st" },
    { value: second, color: "bg-gradient-to-r from-[#C0C0C0] to-[#A0A0A0]", label: "2nd" },
    { value: third, color: "bg-gradient-to-r from-[#CD7F32] to-[#B87333]", label: "3rd" },
    { value: fourth, color: "bg-[#555]", label: "4th" },
  ];

  return (
    <div className="payout-bar mt-3">
      {segments.map((seg, i) => (
        <div
          key={i}
          className={`payout-bar-segment ${seg.color}`}
          style={{ width: `${(seg.value / total) * 100}%` }}
          title={`${seg.label}: $${seg.value.toLocaleString()}`}
        />
      ))}
    </div>
  );
}

/* ── Confetti burst component ── */
function ConfettiBurst() {
  return (
    <div className="confetti-container">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="confetti-piece" />
      ))}
    </div>
  );
}

/* ── Floating particles (lighter version for vote page) ── */
function VoteParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: Math.random() * 3 + 1.5,
        duration: Math.random() * 20 + 12,
        delay: Math.random() * 8,
      })),
    []
  );

  return (
    <div className="particle-field">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle particle-gold"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animation: `particleFloat${(p.id % 3) + 1} ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Mesh gradient orbs ── */
function MeshOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="mesh-orb mesh-orb-gold" style={{ top: "5%", right: "-10%" }} />
      <div className="mesh-orb mesh-orb-purple" style={{ bottom: "-5%", left: "-10%" }} />
    </div>
  );
}

export function VotingForm({ token }: VotingFormProps) {
  const [name, setName] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const hasVoted = localStorage.getItem(`wc2026_voted_${token}`);
    if (hasVoted) {
      setIsSubmitted(true);
    }
  }, [token]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!selectedOption) {
      toast.error("Please select a payout option.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterName: name.trim(),
          optionId: selectedOption,
          token,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong.");
        setIsSubmitting(false);
        return;
      }

      localStorage.setItem(`wc2026_voted_${token}`, "true");
      setIsSubmitted(true);
    } catch {
      toast.error("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  /* ── Success state ── */
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 ambient-bg relative overflow-hidden">
        <VoteParticles />
        <MeshOrbs />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center space-y-6 z-10 relative"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative"
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FFD700]/20 via-[#FFD700]/10 to-transparent flex items-center justify-center mx-auto glass-panel-strong">
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                <Check className="w-16 h-16 text-[#FFD700]" />
              </motion.div>
            </div>
            <ConfettiBurst />
          </motion.div>
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl md:text-5xl font-black text-white"
          >
            Vote Submitted!
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-[#FFD700] text-xl neon-gold-strong"
          >
            Good luck. 🏆
          </motion.p>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-[#555] text-sm"
          >
            Results will be shown on the live board
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4 ambient-bg relative overflow-hidden">
      <VoteParticles />
      <MeshOrbs />

      <div className="max-w-2xl mx-auto space-y-6 relative z-10">
        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3 py-8"
        >
          <motion.div
            className="flex items-center justify-center gap-2 mb-4"
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFD700]/20 via-[#FFD700]/10 to-transparent flex items-center justify-center glass-panel border border-[#FFD700]/10">
              <Trophy className="w-8 h-8 text-[#FFD700]" />
            </div>
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-black gold-shimmer tracking-wide">
            2026 WORLD CUP DRAW
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#FFD700]/30" />
            <p className="text-[#666] text-sm tracking-[0.3em] uppercase">
              Payout Vote
            </p>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#FFD700]/30" />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 glass-panel rounded-full px-5 py-2 mt-2"
          >
            <div className="w-2 h-2 rounded-full bg-[#FFD700] animate-pulse" />
            <span className="text-[#FFD700] font-bold text-lg neon-gold">${TOTAL_POT.toLocaleString()}</span>
            <span className="text-[#555] text-sm">total pot</span>
          </motion.div>
        </motion.div>

        {/* ─── Name Input ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="glass-panel rounded-2xl p-5"
        >
          <label htmlFor="voter-name" className="text-[#666] text-xs uppercase tracking-widest flex items-center gap-2 mb-3">
            <User className="w-3.5 h-3.5" />
            Your Name
          </label>
          <div className="relative">
            <input
              id="voter-name"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/[0.03] border border-[rgba(255,215,0,0.12)] text-white placeholder:text-[#333] focus:border-[#FFD700]/50 focus:bg-white/[0.05] h-13 text-lg rounded-xl px-4 transition-all duration-300 outline-none focus:ring-1 focus:ring-[#FFD700]/20"
            />
            <AnimatePresence>
              {name.trim() && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Check className="w-5 h-5 text-[#22c55e]" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ─── Options ─── */}
        <div className="space-y-2">
          <label className="text-[#666] text-xs uppercase tracking-widest px-1 flex items-center gap-2">
            <ChevronRight className="w-3 h-3" />
            Select Payout Structure
          </label>
          <AnimatePresence>
            {VOTING_OPTIONS.map((option, index) => {
              const isSelected = selectedOption === option.id;

              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.04, duration: 0.3 }}
                >
                  <div
                    onClick={() => setSelectedOption(option.id)}
                    className={`tilt-card cursor-pointer rounded-2xl p-4 transition-all duration-300 ${
                      isSelected
                        ? "glass-panel-strong ring-1 ring-[#FFD700]/50 gold-glow-pulse"
                        : "glass-panel hover:border-[rgba(255,215,0,0.2)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Radio / Check indicator */}
                      <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isSelected
                          ? "border-[#FFD700] bg-[#FFD700] scale-110"
                          : "border-[#333] hover:border-[#555]"
                      }`}>
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            >
                              <Check className="w-3.5 h-3.5 text-[#0a0a0a]" strokeWidth={3} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isSelected
                              ? "bg-[#FFD700]/20 text-[#FFD700]"
                              : "bg-white/[0.04] text-[#444]"
                          }`}>
                            {option.id}
                          </span>
                          <h3 className={`font-bold text-base md:text-lg transition-colors ${
                            isSelected ? "text-[#FFD700]" : "text-white"
                          }`}>
                            {option.name}
                          </h3>
                        </div>

                        {/* Payout amounts */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/15 font-medium">
                            🥇 ${option.first.toLocaleString()}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#C0C0C0]/10 text-[#C0C0C0] border border-[#C0C0C0]/15 font-medium">
                            🥈 ${option.second.toLocaleString()}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#CD7F32]/10 text-[#CD7F32] border border-[#CD7F32]/15 font-medium">
                            🥉 ${option.third.toLocaleString()}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white/[0.04] text-[#666] border border-white/[0.06] font-medium">
                            4th ${option.fourth.toLocaleString()}
                          </span>
                        </div>

                        {/* Visual payout bar */}
                        <PayoutBar first={option.first} second={option.second} third={option.third} fourth={option.fourth} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* ─── Submit ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="pt-2"
        >
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim() || !selectedOption}
            className="w-full h-14 text-lg font-black gradient-sweep-btn text-[#0a0a0a] disabled:opacity-20 disabled:cursor-not-allowed rounded-2xl shadow-lg shadow-[#FFD700]/10 hover:shadow-[#FFD700]/20 transition-shadow"
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-[#0a0a0a] border-t-transparent rounded-full"
              />
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Submit Vote
              </span>
            )}
          </Button>
        </motion.div>

        <p className="text-center text-xs text-[#333] pb-8">
          One vote per person. Your vote cannot be changed after submission.
        </p>
      </div>
    </div>
  );
}
