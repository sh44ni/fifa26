import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DRAW_METHOD_OPTIONS } from "@/lib/draw-method-options";

export async function GET() {
  try {
    const votes = await prisma.drawMethodVote.groupBy({
      by: ["optionId"],
      _count: { optionId: true },
    });

    const results = DRAW_METHOD_OPTIONS.map((opt) => ({
      ...opt,
      votes: votes.find((v) => v.optionId === opt.id)?._count.optionId || 0,
    }));

    const totalVotes = results.reduce((sum, r) => sum + r.votes, 0);

    return NextResponse.json({ results, totalVotes });
  } catch (error) {
    console.error("Draw results error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
