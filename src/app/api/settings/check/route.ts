import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — only returns whether the live display is active
export async function GET() {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: 1 },
      select: { liveDisplayActive: true },
    });

    return NextResponse.json({
      liveDisplayActive: settings?.liveDisplayActive ?? false,
    });
  } catch (error) {
    console.error("Settings check error:", error);
    return NextResponse.json({ liveDisplayActive: false });
  }
}
