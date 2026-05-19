import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromCookies } from "@/lib/auth";
import { getIO } from "@/lib/socket-server";
import { VOTING_OPTIONS } from "@/lib/voting-options";

export async function POST() {
  const isAdmin = await getAdminFromCookies();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete all votes
    await prisma.vote.deleteMany();

    // Generate a new voting token so old links/QR codes are invalidated
    const newToken = crypto.randomBytes(24).toString("base64url").slice(0, 32);
    await prisma.appSettings.update({
      where: { id: 1 },
      data: { votingToken: newToken },
    });

    // Emit reset
    const io = getIO();
    if (io) {
      const results = VOTING_OPTIONS.map((opt) => ({
        ...opt,
        votes: 0,
      }));
      io.emit("vote_update", { results, totalVotes: 0 });
    }

    return NextResponse.json({ success: true, newToken });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
