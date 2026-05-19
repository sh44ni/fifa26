import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VOTING_OPTIONS } from "@/lib/voting-options";

export async function GET() {
  try {
    const votes = await prisma.vote.groupBy({
      by: ["optionId"],
      _count: { optionId: true },
    });

    const results = VOTING_OPTIONS.map((opt) => ({
      ...opt,
      votes: votes.find((v) => v.optionId === opt.id)?._count.optionId || 0,
    }));

    const totalVotes = results.reduce((sum, r) => sum + r.votes, 0);

    return NextResponse.json({ results, totalVotes });
  } catch (error) {
    console.error("Results error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
