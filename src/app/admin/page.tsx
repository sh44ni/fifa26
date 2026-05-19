"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { getSocket } from "@/lib/socket-client";
import { VOTING_OPTIONS, type VotingOption } from "@/lib/voting-options";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Trophy, LogIn, BarChart3, FileText, Settings, Trash2, Download,
  ExternalLink, Search, ChevronLeft, ChevronRight, Shield, Users, DollarSign, Copy, Link2, Printer,
} from "lucide-react";

interface OptionResult extends VotingOption { votes: number; }
interface VoteRecord {
  id: number; voterName: string; optionId: number; optionName: string;
  ipAddress: string | null; createdAt: string;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [results, setResults] = useState<OptionResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [votesTotal, setVotesTotal] = useState(0);
  const [votesPage, setVotesPage] = useState(1);
  const [votesTotalPages, setVotesTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [liveDisplayActive, setLiveDisplayActive] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [votingToken, setVotingToken] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => { if (res.ok) setIsLoggedIn(true); })
      .catch(() => {});
  }, []);

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) { setIsLoggedIn(true); toast.success("Logged in successfully."); }
      else { toast.error("Invalid credentials."); }
    } catch { toast.error("Login failed."); }
    finally { setLoginLoading(false); }
  };

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch("/api/results");
      const data = await res.json();
      setResults(data.results || []); setTotalVotes(data.totalVotes || 0);
    } catch (error) { console.error("Fetch results error:", error); }
  }, []);

  const fetchVotes = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: votesPage.toString(), limit: "20" });
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/admin/votes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setVotes(data.votes || []); setVotesTotal(data.total || 0); setVotesTotalPages(data.totalPages || 1);
      }
    } catch (error) { console.error("Fetch votes error:", error); }
  }, [votesPage, searchQuery]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setLiveDisplayActive(data.liveDisplayActive);
        if (data.votingToken) setVotingToken(data.votingToken);
      }
    } catch (error) { console.error("Fetch settings error:", error); }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchResults(); fetchVotes(); fetchSettings();
      const socket = getSocket();
      socket.on("vote_update", (data: { results: OptionResult[]; totalVotes: number }) => {
        setResults(data.results); setTotalVotes(data.totalVotes); fetchVotes();
      });
      return () => { socket.off("vote_update"); };
    }
  }, [isLoggedIn, fetchResults, fetchVotes, fetchSettings]);

  useEffect(() => { if (isLoggedIn) fetchVotes(); }, [votesPage, searchQuery, isLoggedIn, fetchVotes]);

  const handleDeleteVote = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/votes/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Vote deleted."); fetchVotes(); fetchResults(); }
      else { toast.error("Failed to delete vote."); }
    } catch { toast.error("Error deleting vote."); }
  };

  const handleToggleLive = async (active: boolean) => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveDisplayActive: active }),
      });
      if (res.ok) { setLiveDisplayActive(active); toast.success(`Live display ${active ? "activated" : "deactivated"}.`); }
    } catch { toast.error("Failed to update settings."); }
    finally { setSettingsLoading(false); }
  };

  const handleResetVotes = async () => {
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      if (res.ok) {
        toast.success("All votes reset. New voting token generated.");
        fetchResults(); fetchVotes(); fetchSettings();
      }
      else { toast.error("Failed to reset votes."); }
    } catch { toast.error("Error resetting votes."); }
  };

  const handleDownloadQR = async () => {
    try {
      const res = await fetch("/api/admin/qr");
      if (res.ok) {
        const blob = await res.blob(); const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "voting-qr-code.png"; a.click(); URL.revokeObjectURL(url);
      }
    } catch { toast.error("Failed to download QR code."); }
  };

  const getVotingUrl = () => {
    if (!votingToken) return "";
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/vote?token=${votingToken}`;
  };

  const handleCopyLink = () => {
    const url = getVotingUrl();
    if (url) { navigator.clipboard.writeText(url); toast.success("Voting link copied!"); }
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 ambient-bg relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="mesh-orb mesh-orb-gold" style={{ top: "10%", left: "-10%" }} />
          <div className="mesh-orb mesh-orb-purple" style={{ bottom: "10%", right: "-10%" }} />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <Card className="w-full max-w-md bg-[#0e0e14]/90 border-[rgba(255,215,0,0.15)] backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center pb-2">
              <motion.div
                initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFD700]/15 to-transparent flex items-center justify-center mx-auto mb-4 border border-[#FFD700]/10"
              >
                <Shield className="w-8 h-8 text-[#FFD700]" />
              </motion.div>
              <CardTitle className="text-xl text-white">Admin Login</CardTitle>
              <p className="text-sm text-[#666]">2026 World Cup Draw — Payout Vote</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-username" className="text-[#666]">Username</Label>
                <Input id="admin-username" value={username} onChange={(e) => setUsername(e.target.value)}
                  className="bg-white/[0.03] border-[rgba(255,215,0,0.12)] text-white focus:border-[#FFD700]/50 rounded-xl"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-[#666]">Password</Label>
                <Input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/[0.03] border-[rgba(255,215,0,0.12)] text-white focus:border-[#FFD700]/50 rounded-xl"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
              </div>
              <Button onClick={handleLogin} disabled={loginLoading}
                className="w-full bg-[#FFD700] text-[#0a0a0a] hover:bg-[#FFE44D] font-bold h-12 rounded-xl text-base">
                <LogIn className="w-4 h-4 mr-2" />
                {loginLoading ? "Logging in..." : "Log In"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Admin Dashboard
  const sortedResults = [...results].sort((a, b) => b.votes - a.votes);
  const leader = sortedResults[0]?.votes > 0 ? sortedResults[0] : null;

  return (
    <div className="min-h-screen bg-[#060608] grid-bg p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-[#FFD700]" /> Admin Panel
            </h1>
            <p className="text-sm text-[#555]">2026 World Cup Draw — Payout Vote</p>
          </div>
          <Badge className="bg-[rgba(255,215,0,0.08)] text-[#FFD700] border-[rgba(255,215,0,0.2)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] mr-2 animate-pulse" /> Authenticated
          </Badge>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-[#0e0e14] border border-[rgba(255,215,0,0.08)] p-1 rounded-xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[rgba(255,215,0,0.12)] data-[state=active]:text-[#FFD700] rounded-lg">
              <BarChart3 className="w-4 h-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="votes" className="data-[state=active]:bg-[rgba(255,215,0,0.12)] data-[state=active]:text-[#FFD700] rounded-lg">
              <FileText className="w-4 h-4 mr-2" /> Vote Log
            </TabsTrigger>
            <TabsTrigger value="controls" className="data-[state=active]:bg-[rgba(255,215,0,0.12)] data-[state=active]:text-[#FFD700] rounded-lg">
              <Settings className="w-4 h-4 mr-2" /> Controls
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#0e0e14] border-[rgba(255,215,0,0.1)] relative overflow-hidden">
                <CardContent className="pt-6 text-center relative">
                  <Users className="w-16 h-16 stat-icon-bg" />
                  <p className="text-[#666] text-sm mb-1">Total Votes</p>
                  <p className="text-4xl font-black text-[#FFD700] neon-gold">{totalVotes}</p>
                  <p className="text-xs text-[#444] mt-1">{Math.max(0, 48 - totalVotes)} remaining</p>
                </CardContent>
              </Card>
              <Card className="bg-[#0e0e14] border-[rgba(255,215,0,0.1)] relative overflow-hidden">
                <CardContent className="pt-6 text-center relative">
                  <Trophy className="w-16 h-16 stat-icon-bg" />
                  <p className="text-[#666] text-sm mb-1">Leading Option</p>
                  <p className="text-lg font-bold text-white">{leader?.name || "—"}</p>
                  {leader && <p className="text-sm text-[#FFD700]">{leader.votes} votes</p>}
                </CardContent>
              </Card>
              <Card className="bg-[#0e0e14] border-[rgba(255,215,0,0.1)] relative overflow-hidden">
                <CardContent className="pt-6 text-center relative">
                  <DollarSign className="w-16 h-16 stat-icon-bg" />
                  <p className="text-[#666] text-sm mb-1">Pot Size</p>
                  <p className="text-4xl font-black text-[#22c55e]">$4,800</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[#0e0e14] border-[rgba(255,215,0,0.1)]">
              <CardHeader><CardTitle className="text-white text-lg">Votes Per Option</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[rgba(255,215,0,0.08)] hover:bg-transparent">
                      <TableHead className="text-[#666]">#</TableHead>
                      <TableHead className="text-[#666]">Option</TableHead>
                      <TableHead className="text-[#666] text-right">Votes</TableHead>
                      <TableHead className="text-[#666] text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedResults.map((option, idx) => {
                      const pct = totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(1) : "0.0";
                      const isLeader = option.id === leader?.id;
                      return (
                        <TableRow key={option.id}
                          className={`border-[rgba(255,215,0,0.04)] ${isLeader ? "bg-[rgba(255,215,0,0.04)]" : ""} hover:bg-white/[0.02]`}>
                          <TableCell className="text-[#444] font-mono">{idx + 1}</TableCell>
                          <TableCell className={`font-semibold ${isLeader ? "text-[#FFD700]" : "text-white"}`}>
                            {isLeader && <Trophy className="w-3 h-3 inline mr-1 mb-0.5" />}{option.name}
                          </TableCell>
                          <TableCell className="text-right text-white font-bold">{option.votes}</TableCell>
                          <TableCell className="text-right text-[#666]">{pct}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Vote Log */}
          <TabsContent value="votes" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                <Input placeholder="Search by name or option..." value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setVotesPage(1); }}
                  className="pl-10 bg-[#0e0e14] border-[rgba(255,215,0,0.1)] text-white rounded-xl" />
              </div>
              <Badge variant="outline" className="text-[#666] border-[rgba(255,215,0,0.15)]">{votesTotal} total</Badge>
            </div>

            <Card className="bg-[#0e0e14] border-[rgba(255,215,0,0.1)]">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[rgba(255,215,0,0.08)] hover:bg-transparent">
                      <TableHead className="text-[#666]">ID</TableHead>
                      <TableHead className="text-[#666]">Name</TableHead>
                      <TableHead className="text-[#666]">Option</TableHead>
                      <TableHead className="text-[#666]">IP</TableHead>
                      <TableHead className="text-[#666]">Time</TableHead>
                      <TableHead className="text-[#666] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {votes.map((vote) => (
                      <TableRow key={vote.id} className="border-[rgba(255,215,0,0.04)] hover:bg-white/[0.02]">
                        <TableCell className="text-[#444] font-mono text-sm">{vote.id}</TableCell>
                        <TableCell className="text-white font-medium">{vote.voterName}</TableCell>
                        <TableCell className="text-[#888]">{vote.optionName}</TableCell>
                        <TableCell className="text-[#444] text-xs font-mono">{vote.ipAddress || "—"}</TableCell>
                        <TableCell className="text-[#444] text-xs">{new Date(vote.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Popover>
                            <PopoverTrigger render={<Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 w-8 p-0" />}>
                              <Trash2 className="w-4 h-4" />
                            </PopoverTrigger>
                            <PopoverContent className="w-60 bg-[#111118] border-[rgba(255,215,0,0.15)]">
                              <p className="text-sm text-white mb-3">Delete vote by <strong>{vote.voterName}</strong>?</p>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteVote(vote.id)} className="w-full">Delete</Button>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                      </TableRow>
                    ))}
                    {votes.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-[#444] py-8">No votes found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {votesTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setVotesPage((p) => Math.max(1, p - 1))}
                  disabled={votesPage === 1} className="border-[rgba(255,215,0,0.15)] text-[#888]">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-[#666]">Page {votesPage} of {votesTotalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setVotesPage((p) => Math.min(votesTotalPages, p + 1))}
                  disabled={votesPage === votesTotalPages} className="border-[rgba(255,215,0,0.15)] text-[#888]">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Tab 3: Controls */}
          <TabsContent value="controls" className="space-y-6">
            {/* QR Code + Voting Link */}
            <Card className="bg-[#0e0e14] border-[rgba(255,215,0,0.1)]">
              <CardHeader><CardTitle className="text-white text-lg">Voting Access</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-[#060608] p-4 rounded-2xl border border-[rgba(255,215,0,0.08)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/api/admin/qr" alt="Voting QR Code" className="w-56 h-56" />
                    </div>
                    <Button onClick={handleDownloadQR} variant="outline" size="sm"
                      className="border-[rgba(255,215,0,0.2)] text-[#FFD700] hover:bg-[rgba(255,215,0,0.08)]">
                      <Download className="w-4 h-4 mr-2" /> Download QR
                    </Button>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-sm text-[#888] mb-1 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> Voting Link</p>
                      <div className="flex gap-2">
                        <Input value={getVotingUrl()} readOnly
                          className="bg-white/[0.03] border-[rgba(255,215,0,0.1)] text-[#888] text-xs font-mono rounded-xl flex-1" />
                        <Button onClick={handleCopyLink} variant="outline" size="sm"
                          className="border-[rgba(255,215,0,0.2)] text-[#FFD700] hover:bg-[rgba(255,215,0,0.08)] shrink-0">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button onClick={() => window.open(getVotingUrl(), "_blank")} variant="outline"
                      className="w-full border-[rgba(255,215,0,0.2)] text-[#FFD700] hover:bg-[rgba(255,215,0,0.08)] rounded-xl">
                      <ExternalLink className="w-4 h-4 mr-2" /> Open Voting Page
                    </Button>
                    <Button onClick={() => { const a = document.createElement("a"); a.href = "/api/admin/poster"; a.download = "wc2026-vote-invite.pdf"; a.click(); }} variant="outline"
                      className="w-full border-[rgba(255,215,0,0.2)] text-[#FFD700] hover:bg-[rgba(255,215,0,0.08)] rounded-xl">
                      <Printer className="w-4 h-4 mr-2" /> Download Invite PDF
                    </Button>
                    <p className="text-xs text-[#444]">Share this link or scan the QR code to vote. Use the poster for printing.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Display Toggle */}
            <Card className="bg-[#0e0e14] border-[rgba(255,215,0,0.1)]">
              <CardHeader><CardTitle className="text-white text-lg">Live Display</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Live Display Active</p>
                    <p className="text-sm text-[#666]">Toggle the live results display on or off.</p>
                  </div>
                  <Switch checked={liveDisplayActive} onCheckedChange={handleToggleLive}
                    disabled={settingsLoading} className="data-[state=checked]:bg-[#FFD700]" />
                </div>
                {liveDisplayActive && (
                  <Button variant="outline" onClick={() => window.open("/live", "_blank")}
                    className="border-[rgba(255,215,0,0.2)] text-[#FFD700] hover:bg-[rgba(255,215,0,0.08)] rounded-xl">
                    <ExternalLink className="w-4 h-4 mr-2" /> Open Live Display
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Reset */}
            <Card className="bg-[#0e0e14] border-red-900/20">
              <CardHeader><CardTitle className="text-red-400 text-lg">Danger Zone</CardTitle></CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="destructive" size="lg" className="w-full bg-red-600 hover:bg-red-700 rounded-xl" />}>
                    <Trash2 className="w-4 h-4 mr-2" /> Reset All Votes
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#0e0e14] border-red-900/30">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-[#888]">
                        This will permanently delete all <strong className="text-white">{totalVotes}</strong> votes and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-[#111118] text-white border-[rgba(255,255,255,0.08)] hover:bg-[#1a1a22]">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetVotes} className="bg-red-600 hover:bg-red-700 text-white">Yes, Reset Everything</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
