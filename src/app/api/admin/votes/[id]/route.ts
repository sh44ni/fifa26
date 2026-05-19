import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromCookies } from "@/lib/auth";
import { getIO } from "@/lib/socket-server";
import { VOTING_OPTIONS } from "@/lib/voting-options";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await getAdminFromCookies();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const voteId = parseInt(id);

    await prisma.vote.delete({ where: { id: voteId } });

    // Emit updated results
    const io = getIO();
    if (io) {
      const votes = await prisma.vote.groupBy({
        by: ["optionId"],
        _count: { optionId: true },
      });

      const results = VOTING_OPTIONS.map((opt) => ({
        ...opt,
        votes: votes.find((v) => v.optionId === opt.id)?._count.optionId || 0,
      }));

      const totalVotes = results.reduce((sum, r) => sum + r.votes, 0);
      io.emit("vote_update", { results, totalVotes });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete vote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
