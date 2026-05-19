import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromCookies } from "@/lib/auth";
import { getIO } from "@/lib/socket-server";

export async function GET() {
  const isAdmin = await getAdminFromCookies();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const isAdmin = await getAdminFromCookies();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { liveDisplayActive, payoutVotingOpen, drawVotingOpen } = body;

    // Build update data — only include fields that were provided
    const updateData: Record<string, boolean> = {};
    if (typeof liveDisplayActive === "boolean") updateData.liveDisplayActive = liveDisplayActive;
    if (typeof payoutVotingOpen === "boolean") updateData.payoutVotingOpen = payoutVotingOpen;
    if (typeof drawVotingOpen === "boolean") updateData.drawVotingOpen = drawVotingOpen;

    const settings = await prisma.appSettings.update({
      where: { id: 1 },
      data: updateData,
    });

    // Emit settings update with all fields
    const io = getIO();
    if (io) {
      io.emit("settings_update", {
        liveDisplayActive: settings.liveDisplayActive,
        payoutVotingOpen: settings.payoutVotingOpen,
        drawVotingOpen: settings.drawVotingOpen,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
