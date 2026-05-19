"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { getSocket } from "@/lib/socket-client";
import { VOTING_OPTIONS, type VotingOption } from "@/lib/voting-options";
import { DRAW_METHOD_OPTIONS, type DrawMethodOption } from "@/lib/draw-method-options";
import { Trophy, Zap, Users, Crown, TrendingUp, TrendingDown, Minus, Flame, CircleDot } from "lucide-react";

const TOTAL_VOTERS = 48;

interface OptionResult extends VotingOption {
  votes: number;
}

interface DrawMethodResult extends DrawMethodOption {
  votes: number;
}

interface TickerItem {
  id: number;
  optionName: string;
  timestamp: number;
}

interface FloatingVote {
  id: number;
  optionId: number;
}

/* ── Animated counter ── */
function AnimatedCounter({ value, className = "" }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    const duration = 800;
    const startValue = displayValue;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Smooth cubic bezier easing
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      setDisplayValue(Math.round(startValue + (value - startValue) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span className={className}>{displayValue.toLocaleString()}</span>;
}

/* ── Percentage ring SVG ── */
function PercentageRing({ percentage, size = 48, stroke = 3, color = "#FFD700" }: {
  percentage: number; size?: number; stroke?: number; color?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} stroke="rgba(255,255,255,0.05)" />
      <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circumference}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
    </svg>
  );
}

/* ── Countdown Ring ── */
function CountdownRing({ voted, total }: { voted: number; total: number }) {
  const remaining = Math.max(0, total - voted);
  const pct = total > 0 ? (voted / total) * 100 : 0;
  const color = remaining === 0 ? "#22c55e" : remaining <= 5 ? "#f59e0b" : "#FFD700";
  return (
    <div className="flex items-center gap-3 glass-panel rounded-2xl px-4 py-2">
      <div className="relative countdown-ring">
        <PercentageRing percentage={pct} size={40} stroke={3} color={color} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-black tabular-nums" style={{ color }}>{remaining}</span>
        </div>
      </div>
      <div>
        <p className="text-[9px] text-[#555] uppercase tracking-widest">Left</p>
        <p className="text-base font-black tabular-nums leading-none" style={{ color }}>
          {remaining}<span className="text-[10px] text-[#444] font-medium">/{total}</span>
        </p>
      </div>
    </div>
  );
}

/* ── Particles ── */
function ParticleField() {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i, left: `${Math.random() * 100}%`, size: Math.random() * 3 + 1.5,
      duration: Math.random() * 15 + 10, delay: Math.random() * 10,
      type: Math.random() > 0.5 ? "gold" : "white",
    })), []);
  return (
    <div className="particle-field">
      {particles.map((p) => (
        <div key={p.id} className={`particle ${p.type === "gold" ? "particle-gold" : "particle-white"}`}
          style={{ left: p.left, width: p.size, height: p.size,
            animation: `particleFloat${(p.id % 3) + 1} ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s` }} />
      ))}
    </div>
  );
}

/* ── Mesh orbs ── */
function MeshOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="mesh-orb mesh-orb-gold" style={{ top: "-10%", left: "-5%" }} />
      <div className="mesh-orb mesh-orb-purple" style={{ bottom: "10%", right: "-5%" }} />
    </div>
  );
}

/* ── Floating +1 animation ── */
function FloatingPlusOne() {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 0.5 }}
      animate={{ opacity: 0, y: -60, scale: 1.2 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      className="absolute top-1/3 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
    >
      <span className="text-2xl font-black text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.6)]">
        +1
      </span>
    </motion.div>
  );
}

/* ── Full-size Option Card ── */
function OptionCard({ option, rank, totalVotes, isLeader, floatingVotes, rankChange, isHot, leaderVotes }: {
  option: OptionResult; rank: number; totalVotes: number; isLeader: boolean;
  floatingVotes: FloatingVote[]; rankChange: number; isHot: boolean; leaderVotes: number;
}) {
  const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
  const rankColors: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };
  const ringColor = rankColors[rank] || (rank <= 5 ? "#6366f1" : "#444");
  const rankEmoji: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
  const gap = leaderVotes - option.votes;

  const borderColor = isLeader
    ? "border-[#FFD700]/25"
    : rank <= 3 ? `border-[${rankColors[rank]}]/15` : "border-white/[0.06]";

  const myFloats = floatingVotes.filter((f) => f.optionId === option.id);

  return (
    <motion.div
      layout
      layoutId={`card-${option.id}`}
      transition={{ layout: { type: "spring", stiffness: 200, damping: 28 } }}
      className={`relative overflow-hidden rounded-2xl border ${borderColor} flex flex-col
        ${isLeader
          ? "bg-gradient-to-br from-[#FFD700]/[0.07] via-[#0e0e14]/80 to-[#0e0e14]/90 shadow-[0_0_40px_rgba(255,215,0,0.08)]"
          : "bg-[#0e0e14]/70 backdrop-blur-xl"
        }`}
      style={{ minHeight: 0 }}
    >
      {/* Floating +1 animations */}
      <AnimatePresence>
        {myFloats.map((f) => (
          <FloatingPlusOne key={f.id} />
        ))}
      </AnimatePresence>

      {/* Leader shimmer */}
      {isLeader && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={false}
          animate={{ opacity: [0, 0.04, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ background: "linear-gradient(135deg, transparent 30%, rgba(255,215,0,0.15) 50%, transparent 70%)" }}
        />
      )}

      {/* Top: rank + name + badges */}
      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm">{rankEmoji[rank] || ""}</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
            isLeader ? "bg-[#FFD700]/15 text-[#FFD700]" : "bg-white/[0.05] text-[#555]"
          }`}>#{rank}</span>
          <h3 className={`font-bold text-xs truncate ${isLeader ? "text-[#FFD700]" : "text-white/90"}`}>
            {option.name}
          </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* HOT badge */}
          {isHot && (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="flex items-center gap-0.5 bg-[#ef4444]/15 text-[#ef4444] px-1.5 py-0.5 rounded-full">
              <Flame className="w-2.5 h-2.5" />
              <span className="text-[8px] font-bold uppercase">Hot</span>
            </motion.div>
          )}
          {/* Rank change */}
          {rankChange !== 0 && (
            <motion.div
              initial={{ scale: 0, y: rankChange < 0 ? 10 : -10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={`flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[8px] font-bold ${
                rankChange < 0
                  ? "bg-[#22c55e]/15 text-[#22c55e]"
                  : "bg-[#ef4444]/15 text-[#ef4444]"
              }`}>
              {rankChange < 0
                ? <><TrendingUp className="w-2.5 h-2.5" />{Math.abs(rankChange)}</>
                : <><TrendingDown className="w-2.5 h-2.5" />{rankChange}</>
              }
            </motion.div>
          )}
        </div>
      </div>

      {/* Center: ring + vote count */}
      <div className="flex-1 flex items-center justify-center gap-3 px-3">
        <div className="relative">
          <PercentageRing percentage={percentage} size={52} stroke={3.5} color={ringColor} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-black tabular-nums" style={{ color: ringColor }}>
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>
        <div className="text-center">
          <motion.div
            key={option.votes}
            initial={{ scale: 1.3, color: "#FFD700" }}
            animate={{ scale: 1, color: isLeader ? "#FFD700" : "#ffffff" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`text-3xl font-black tabular-nums leading-none ${isLeader ? "neon-gold" : ""}`}
          >
            {option.votes}
          </motion.div>
          <p className="text-[8px] text-[#555] uppercase tracking-widest mt-0.5">votes</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-3 pb-1 flex items-center justify-center gap-2">
        {isLeader && option.votes > 0 ? (
          <span className="text-[8px] font-bold text-[#FFD700] bg-[#FFD700]/10 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
            <Crown className="w-2.5 h-2.5" /> Leading
          </span>
        ) : gap > 0 && option.votes > 0 ? (
          <span className="text-[8px] text-[#888] bg-white/[0.04] px-2 py-0.5 rounded-full">
            {gap} behind leader
          </span>
        ) : null}
        {rank === 2 && option.votes > 0 && gap <= 2 && gap > 0 && (
          <span className="text-[8px] font-bold text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded-full">
            Close race!
          </span>
        )}
      </div>

      {/* Bottom: payout pills */}
      <div className="px-2.5 pb-2 flex gap-1 justify-center">
        <span className="text-[7px] px-1.5 py-0.5 rounded-md bg-[#FFD700]/10 text-[#FFD700]/70 font-medium">
          1st ${option.first.toLocaleString()}
        </span>
        <span className="text-[7px] px-1.5 py-0.5 rounded-md bg-[#C0C0C0]/8 text-[#C0C0C0]/70 font-medium">
          2nd ${option.second.toLocaleString()}
        </span>
        <span className="text-[7px] px-1.5 py-0.5 rounded-md bg-[#CD7F32]/10 text-[#CD7F32]/60 font-medium">
          3rd ${option.third.toLocaleString()}
        </span>
        <span className="text-[7px] px-1.5 py-0.5 rounded-md bg-white/[0.03] text-[#444] font-medium">
          4th ${option.fourth.toLocaleString()}
        </span>
      </div>

      {/* Bottom glow bar for top 3 */}
      {rank <= 3 && (
        <div className="h-[2px] w-full" style={{
          background: `linear-gradient(90deg, transparent, ${ringColor}66, transparent)`
        }} />
      )}
    </motion.div>
  );
}

/* ── Live ticker ── */
function LiveTicker({ items }: { items: TickerItem[] }) {
  return (
    <div className="h-8 relative overflow-hidden">
      <AnimatePresence mode="popLayout">
        {items.slice(0, 1).map((item) => (
          <motion.div key={item.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -15, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center gap-2">
            <Zap className="w-3 h-3 text-[#FFD700]" />
            <span className="text-xs text-[#8a8a9a]">
              Someone voted for <span className="text-[#FFD700] font-semibold">{item.optionName}</span>
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ── Winner Celebration Overlay ── */
function WinnerCelebration({ winner }: { winner: OptionResult }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#060608]/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center space-y-5 glass-panel-strong rounded-3xl p-12 max-w-lg mx-4">
        <motion.div
          initial={{ rotateY: 90, scale: 0 }}
          animate={{ rotateY: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8, type: "spring", stiffness: 150 }}>
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#FFD700]/30 to-[#FFD700]/5 flex items-center justify-center mx-auto gold-glow-pulse">
            <Crown className="w-14 h-14 text-[#FFD700]" />
          </div>
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }}>
          <p className="text-[#888] text-sm uppercase tracking-[0.3em] mb-2">All {TOTAL_VOTERS} votes are in</p>
          <h2 className="text-4xl md:text-5xl font-black gold-shimmer">{winner.name}</h2>
          <p className="text-[#FFD700] text-2xl font-bold mt-3 neon-gold-strong">{winner.votes} votes</p>
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.1 }}
          className="flex justify-center gap-6 pt-3">
          {[
            { label: "1st", val: winner.first, col: "#FFD700" },
            { label: "2nd", val: winner.second, col: "#C0C0C0" },
            { label: "3rd", val: winner.third, col: "#CD7F32" },
            { label: "4th", val: winner.fourth, col: "#666" },
          ].map((p) => (
            <div key={p.label} className="text-center">
              <p className="text-[10px] text-[#555] uppercase tracking-wider">{p.label}</p>
              <p className="text-xl font-black" style={{ color: p.col }}>${p.val.toLocaleString()}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   MAIN LIVE PAGE — Fixed viewport
   ═══════════════════════════════════════ */
export default function LivePage() {
  const [results, setResults] = useState<OptionResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [floatingVotes, setFloatingVotes] = useState<FloatingVote[]>([]);
  const [hotOptions, setHotOptions] = useState<Set<number>>(new Set());
  const [rankChanges, setRankChanges] = useState<Record<number, number>>({});
  const [drawResults, setDrawResults] = useState<DrawMethodResult[]>([]);
  const [drawTotalVotes, setDrawTotalVotes] = useState(0);
  const tickerIdRef = useRef(0);
  const floatIdRef = useRef(0);
  const prevRanksRef = useRef<Record<number, number>>({});

  const fetchData = useCallback(async () => {
    try {
      const [resultsRes, settingsRes, drawRes] = await Promise.all([
        fetch("/api/results"), fetch("/api/settings/check"), fetch("/api/draw-results")
      ]);
      const resultsData = await resultsRes.json();
      setResults(resultsData.results || []);
      setTotalVotes(resultsData.totalVotes || 0);
      if (settingsRes.ok) { const sd = await settingsRes.json(); setIsActive(sd.liveDisplayActive); }
      if (drawRes.ok) { const dd = await drawRes.json(); setDrawResults(dd.results || []); setDrawTotalVotes(dd.totalVotes || 0); }
    } catch (error) { console.error("Failed to fetch data:", error); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const socket = getSocket();
    socket.on("vote_update", (data: { results: OptionResult[]; totalVotes: number }) => {
      // Compute rank changes before updating
      const newSorted = [...(data.results || [])].sort((a, b) => b.votes - a.votes);
      const newRanks: Record<number, number> = {};
      newSorted.forEach((o, i) => { newRanks[o.id] = i + 1; });
      const prev = prevRanksRef.current;
      if (Object.keys(prev).length > 0) {
        const changes: Record<number, number> = {};
        Object.keys(newRanks).forEach((idStr) => {
          const id = Number(idStr);
          if (prev[id] !== undefined && prev[id] !== newRanks[id]) {
            changes[id] = newRanks[id] - prev[id]; // positive = went down, negative = went up
          }
        });
        if (Object.keys(changes).length > 0) {
          setRankChanges(changes);
          setTimeout(() => setRankChanges({}), 4000);
        }
      }
      prevRanksRef.current = newRanks;
      setResults(data.results); setTotalVotes(data.totalVotes);
    });
    socket.on("vote_cast", (data: { optionName: string }) => {
      const id = ++tickerIdRef.current;
      setTickerItems((prev) => [{ id, optionName: data.optionName, timestamp: Date.now() }, ...prev].slice(0, 10));

      // Trigger floating +1 and HOT badge
      const option = VOTING_OPTIONS.find((o) => o.name === data.optionName);
      if (option) {
        const floatId = ++floatIdRef.current;
        setFloatingVotes((prev) => [...prev, { id: floatId, optionId: option.id }]);
        setTimeout(() => { setFloatingVotes((prev) => prev.filter((f) => f.id !== floatId)); }, 1800);
        // Mark as HOT for 5 seconds
        setHotOptions((prev) => new Set(prev).add(option.id));
        setTimeout(() => { setHotOptions((prev) => { const n = new Set(prev); n.delete(option.id); return n; }); }, 5000);
      }
    });
    socket.on("draw_vote_update", (data: { results: DrawMethodResult[]; totalVotes: number }) => {
      setDrawResults(data.results); setDrawTotalVotes(data.totalVotes);
    });
    socket.on("settings_update", (data: { liveDisplayActive: boolean }) => { setIsActive(data.liveDisplayActive); });
    return () => { socket.off("vote_update"); socket.off("vote_cast"); socket.off("draw_vote_update"); socket.off("settings_update"); };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center ambient-bg">
        <ParticleField /><MeshOrbs />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-[#FFD700] border-t-transparent rounded-full z-10" />
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="h-screen flex items-center justify-center ambient-bg">
        <ParticleField /><MeshOrbs />
        <div className="z-10 text-center space-y-4">
          <div className="w-24 h-24 rounded-full glass-panel flex items-center justify-center mx-auto">
            <Trophy className="w-12 h-12 text-[#FFD700]/30" />
          </div>
          <p className="text-[#444] text-lg">Live display is not active.</p>
        </div>
      </div>
    );
  }

  const sortedResults = [...results].sort((a, b) => b.votes - a.votes);
  const leaderId = sortedResults[0]?.votes > 0 ? sortedResults[0]?.id : null;
  const leaderVotes = sortedResults[0]?.votes || 0;
  const allVotesIn = totalVotes >= TOTAL_VOTERS;
  const winner = allVotesIn && sortedResults[0]?.votes > 0 ? sortedResults[0] : null;

  return (
    <div className="h-screen ambient-bg relative overflow-hidden flex flex-col">
      <ParticleField />
      <MeshOrbs />

      <AnimatePresence>
        {winner && <WinnerCelebration winner={winner} />}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col h-full p-3 md:px-6 md:py-3 max-w-[1800px] mx-auto w-full">
        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel rounded-2xl px-5 py-2.5 mb-3 flex items-center justify-between shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 flex items-center justify-center border border-[#FFD700]/10">
              <Trophy className="w-4 h-4 text-[#FFD700]" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black gold-shimmer tracking-wider leading-tight">
                2026 WORLD CUP DRAW
              </h1>
              <p className="text-[#555] text-[9px] tracking-[0.3em] uppercase">Payout Structure Vote</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#ef4444]/10 px-3 py-1.5 rounded-full border border-[#ef4444]/20">
              <div className="live-dot" style={{ width: 7, height: 7 }} />
              <span className="text-[#ef4444] text-[10px] font-bold tracking-wider uppercase">Live</span>
            </div>
            <div className="flex items-center gap-2 glass-panel rounded-2xl px-3 py-1.5">
              <Users className="w-3.5 h-3.5 text-[#FFD700]" />
              <div>
                <p className="text-[8px] text-[#555] uppercase tracking-widest">Votes</p>
                <p className="text-lg font-black text-[#FFD700] neon-gold tabular-nums leading-none">
                  <AnimatedCounter value={totalVotes} />
                </p>
              </div>
            </div>
            <CountdownRing voted={totalVotes} total={TOTAL_VOTERS} />
          </div>
        </motion.div>

        {/* ─── Card Grid — 5×2, fills viewport ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 min-h-0 mb-2"
        >
          <LayoutGroup>
            <div className="grid grid-cols-5 gap-2.5 h-full" style={{ gridTemplateRows: "1fr 1fr" }}>
              {sortedResults.map((option, index) => (
                <OptionCard
                  key={option.id}
                  option={option}
                  rank={index + 1}
                  totalVotes={totalVotes}
                  isLeader={option.id === leaderId}
                  floatingVotes={floatingVotes}
                  rankChange={rankChanges[option.id] || 0}
                  isHot={hotOptions.has(option.id)}
                  leaderVotes={leaderVotes}
                />
              ))}
            </div>
          </LayoutGroup>
        </motion.div>

        {/* ─── Draw Method Results ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-2 shrink-0"
        >
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <CircleDot className="w-3.5 h-3.5 text-[#ef4444]" />
            <span className="text-[10px] text-[#888] uppercase tracking-[0.2em] font-bold">Draw Method Vote</span>
            <span className="text-[10px] text-[#555]">— {drawTotalVotes} votes</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {drawResults.map((opt) => {
              const pct = drawTotalVotes > 0 ? (opt.votes / drawTotalVotes) * 100 : 0;
              const isLeading = drawTotalVotes > 0 && opt.votes === Math.max(...drawResults.map(r => r.votes)) && opt.votes > 0;
              const isTied = drawResults.filter(r => r.votes === opt.votes && r.votes > 0).length > 1;
              return (
                <div
                  key={opt.id}
                  className={`relative overflow-hidden rounded-2xl border flex items-center gap-4 px-5 py-3 ${
                    isLeading && !isTied
                      ? "bg-gradient-to-br from-[#ef4444]/[0.07] via-[#0e0e14]/80 to-[#0e0e14]/90 border-[#ef4444]/25 shadow-[0_0_30px_rgba(239,68,68,0.06)]"
                      : "bg-[#0e0e14]/70 backdrop-blur-xl border-white/[0.06]"
                  }`}
                >
                  {/* Leading shimmer */}
                  {isLeading && !isTied && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      animate={{ opacity: [0, 0.04, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      style={{ background: "linear-gradient(135deg, transparent 30%, rgba(239,68,68,0.15) 50%, transparent 70%)" }}
                    />
                  )}
                  <span className="text-3xl">{opt.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-sm truncate ${isLeading && !isTied ? "text-[#ef4444]" : "text-white/90"}`}>
                      {opt.name}
                    </h4>
                    <p className="text-[8px] text-[#555] truncate">{opt.description}</p>
                  </div>
                  <div className="text-center shrink-0">
                    <motion.div
                      key={opt.votes}
                      initial={{ scale: 1.3, color: "#ef4444" }}
                      animate={{ scale: 1, color: isLeading && !isTied ? "#ef4444" : "#ffffff" }}
                      transition={{ duration: 0.5 }}
                      className="text-2xl font-black tabular-nums leading-none"
                    >
                      {opt.votes}
                    </motion.div>
                    <p className="text-[8px] text-[#555] uppercase tracking-widest mt-0.5">votes</p>
                  </div>
                  <div className="text-center shrink-0 w-12">
                    <span className="text-sm font-bold tabular-nums" style={{ color: isLeading && !isTied ? "#ef4444" : "#888" }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  {isLeading && !isTied && (
                    <span className="text-[8px] font-bold text-[#ef4444] bg-[#ef4444]/10 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
                      <Crown className="w-2.5 h-2.5" /> Leading
                    </span>
                  )}
                  {isTied && opt.votes > 0 && (
                    <span className="text-[8px] font-bold text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      Tied
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ─── Ticker ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-panel rounded-xl px-4 shrink-0"
        >
          {tickerItems.length > 0 ? <LiveTicker items={tickerItems} /> : (
            <div className="h-8 flex items-center justify-center">
              <span className="text-[10px] text-[#444] uppercase tracking-widest">Waiting for votes…</span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
