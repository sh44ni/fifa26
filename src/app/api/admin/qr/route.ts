import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromCookies } from "@/lib/auth";
import QRCode from "qrcode";

export async function GET() {
  const isAdmin = await getAdminFromCookies();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const voteUrl = `${appUrl}/vote?token=${settings.votingToken}`;

    const qrBuffer = await QRCode.toBuffer(voteUrl, {
      type: "png",
      width: 512,
      margin: 2,
      color: {
        dark: "#FFD700",
        light: "#0a0a0a",
      },
    });

    return new NextResponse(new Uint8Array(qrBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=voting-qr-code.png",
      },
    });
  } catch (error) {
    console.error("QR error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
