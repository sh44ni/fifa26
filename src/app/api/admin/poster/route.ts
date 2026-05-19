import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromCookies } from "@/lib/auth";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import { TOTAL_POT } from "@/lib/voting-options";

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

    // QR code as PNG buffer — black on white for clean print
    const qrBuffer = await QRCode.toBuffer(voteUrl, {
      type: "png",
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });

    // Build PDF in memory
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 0 });

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", resolve);
      doc.on("error", reject);

      const W = doc.page.width;   // 595
      const H = doc.page.height;  // 842

      // ── Background ──────────────────────────────────────────────
      doc.rect(0, 0, W, H).fill("#080810");

      // ── Thin gold border ────────────────────────────────────────
      doc
        .rect(20, 20, W - 40, H - 40)
        .lineWidth(0.8)
        .strokeColor("#FFD700")
        .stroke();

      // ── Trophy emoji via text ────────────────────────────────────
      doc
        .font("Helvetica-Bold")
        .fontSize(36)
        .fillColor("#FFD700")
        .text("🏆", 0, 68, { align: "center" });

      // ── Title ────────────────────────────────────────────────────
      doc
        .font("Helvetica-Bold")
        .fontSize(28)
        .fillColor("#FFD700")
        .text("2026 WORLD CUP DRAW", 0, 120, { align: "center", characterSpacing: 3 });

      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#888888")
        .text("PAYOUT STRUCTURE VOTE", 0, 158, { align: "center", characterSpacing: 5 });

      // ── Gold divider ─────────────────────────────────────────────
      doc
        .moveTo(W / 2 - 60, 182)
        .lineTo(W / 2 + 60, 182)
        .lineWidth(1)
        .strokeColor("#FFD700")
        .stroke();

      // ── Total Pot ────────────────────────────────────────────────
      doc
        .font("Helvetica-Bold")
        .fontSize(22)
        .fillColor("#FFD700")
        .text(`$${TOTAL_POT.toLocaleString()} Total Pot`, 0, 198, { align: "center" });

      // ── Instruction text ─────────────────────────────────────────
      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor("#cccccc")
        .text("Scan the QR code below to cast your vote", 0, 236, { align: "center" });

      // ── QR Code ──────────────────────────────────────────────────
      const qrSize = 220;
      const qrX = (W - qrSize) / 2;
      const qrY = 270;

      // White background box so QR prints cleanly
      doc.rect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24).fill("#ffffff");

      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

      // Gold corner accents
      const accentSize = 18;
      const accentW = 2.5;
      doc.strokeColor("#FFD700").lineWidth(accentW);
      // top-left
      doc.moveTo(qrX - 14, qrY - 14 + accentSize).lineTo(qrX - 14, qrY - 14).lineTo(qrX - 14 + accentSize, qrY - 14).stroke();
      // top-right
      doc.moveTo(qrX + qrSize + 14 - accentSize, qrY - 14).lineTo(qrX + qrSize + 14, qrY - 14).lineTo(qrX + qrSize + 14, qrY - 14 + accentSize).stroke();
      // bottom-left
      doc.moveTo(qrX - 14, qrY + qrSize + 14 - accentSize).lineTo(qrX - 14, qrY + qrSize + 14).lineTo(qrX - 14 + accentSize, qrY + qrSize + 14).stroke();
      // bottom-right
      doc.moveTo(qrX + qrSize + 14 - accentSize, qrY + qrSize + 14).lineTo(qrX + qrSize + 14, qrY + qrSize + 14).lineTo(qrX + qrSize + 14, qrY + qrSize + 14 - accentSize).stroke();

      // ── SCAN TO VOTE label ────────────────────────────────────────
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#FFD700")
        .text("SCAN TO VOTE", 0, qrY + qrSize + 28, { align: "center", characterSpacing: 4 });

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#666666")
        .text("Open your phone camera and point it at the code", 0, qrY + qrSize + 50, { align: "center" });

      // ── Footer divider ────────────────────────────────────────────
      doc
        .moveTo(W / 2 - 40, H - 58)
        .lineTo(W / 2 + 40, H - 58)
        .lineWidth(0.5)
        .strokeColor("#333333")
        .stroke();

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#444444")
        .text("One vote per person  •  Results shown live", 0, H - 48, { align: "center", characterSpacing: 1 });

      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=wc2026-vote-invite.pdf",
      },
    });
  } catch (error) {
    console.error("Poster error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
