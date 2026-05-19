import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DRAW_METHOD_OPTIONS } from "@/lib/draw-method-options";
import { getIO } from "@/lib/socket-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voterName, optionId, token } = body;

    // Validate token
    const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
    if (!settings || settings.votingToken !== token) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    // Check if draw voting is open
    if (!settings.drawVotingOpen) {
      return NextResponse.json({ error: "Draw method voting is currently closed." }, { status: 403 });
    }

    // Validate inputs
    if (!voterName || typeof voterName !== "string" || voterName.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const option = DRAW_METHOD_OPTIONS.find((o) => o.id === optionId);
    if (!option) {
      return NextResponse.json({ error: "Invalid option" }, { status: 400 });
    }

    // Get IP address
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

    // Create draw method vote
    await prisma.drawMethodVote.create({
      data: {
        voterName: voterName.trim(),
        optionId: option.id,
        optionName: option.name,
        ipAddress,
      },
    });

    // Emit real-time update
    const io = getIO();
    if (io) {
      const votes = await prisma.drawMethodVote.groupBy({
        by: ["optionId"],
        _count: { optionId: true },
      });

      const results = DRAW_METHOD_OPTIONS.map((opt) => ({
        ...opt,
        votes: votes.find((v) => v.optionId === opt.id)?._count.optionId || 0,
      }));

      const totalVotes = results.reduce((sum, r) => sum + r.votes, 0);
      io.emit("draw_vote_update", { results, totalVotes });
      io.emit("draw_vote_cast", { optionName: option.name });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Draw vote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
