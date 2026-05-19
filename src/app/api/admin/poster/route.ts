import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromCookies } from "@/lib/auth";
import QRCode from "qrcode";
import { VOTING_OPTIONS, TOTAL_POT } from "@/lib/voting-options";

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

    // Generate QR as data URI
    const qrDataUri = await QRCode.toDataURL(voteUrl, {
      width: 400,
      margin: 2,
      color: { dark: "#FFD700", light: "#0a0a0a" },
    });

    // Build option rows
    const optionRows = VOTING_OPTIONS.map(
      (opt) => `
      <tr>
        <td style="padding:6px 10px;color:#ccc;font-weight:600;font-size:11px;border-bottom:1px solid #1a1a22;">${opt.name}</td>
        <td style="padding:6px 10px;color:#FFD700;font-weight:700;text-align:center;font-size:11px;border-bottom:1px solid #1a1a22;">$${opt.first.toLocaleString()}</td>
        <td style="padding:6px 10px;color:#C0C0C0;font-weight:600;text-align:center;font-size:11px;border-bottom:1px solid #1a1a22;">$${opt.second.toLocaleString()}</td>
        <td style="padding:6px 10px;color:#CD7F32;font-weight:600;text-align:center;font-size:11px;border-bottom:1px solid #1a1a22;">$${opt.third.toLocaleString()}</td>
        <td style="padding:6px 10px;color:#666;font-weight:600;text-align:center;font-size:11px;border-bottom:1px solid #1a1a22;">$${opt.fourth.toLocaleString()}</td>
      </tr>`
    ).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>2026 World Cup Draw — Vote Poster</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', sans-serif;
    background: #060608;
    color: #fff;
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 30px 35px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    background:
      radial-gradient(ellipse at 20% 10%, rgba(255,215,0,0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 90%, rgba(100,60,200,0.04) 0%, transparent 50%),
      #060608;
  }
  /* Decorative border */
  .page::before {
    content: '';
    position: absolute;
    inset: 12px;
    border: 1px solid rgba(255,215,0,0.12);
    border-radius: 20px;
    pointer-events: none;
  }
  .page::after {
    content: '';
    position: absolute;
    inset: 15px;
    border: 1px solid rgba(255,215,0,0.06);
    border-radius: 18px;
    pointer-events: none;
  }
  .header {
    text-align: center;
    margin-bottom: 10px;
    margin-top: 15px;
  }
  .trophy { font-size: 40px; margin-bottom: 6px; }
  .title {
    font-size: 34px;
    font-weight: 900;
    letter-spacing: 4px;
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.1;
  }
  .subtitle {
    font-size: 13px;
    color: #888;
    letter-spacing: 6px;
    text-transform: uppercase;
    margin-top: 4px;
  }
  .divider {
    width: 120px;
    height: 2px;
    background: linear-gradient(90deg, transparent, #FFD700, transparent);
    margin: 14px auto;
  }
  .pot-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,215,0,0.08);
    border: 1px solid rgba(255,215,0,0.15);
    border-radius: 50px;
    padding: 8px 22px;
    margin-bottom: 14px;
  }
  .pot-dot {
    width: 8px; height: 8px;
    background: #FFD700;
    border-radius: 50%;
  }
  .pot-amount {
    font-size: 22px;
    font-weight: 900;
    color: #FFD700;
  }
  .pot-label {
    font-size: 11px;
    color: #888;
  }
  /* QR section */
  .qr-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 8px 0 12px;
  }
  .qr-frame {
    padding: 14px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,215,0,0.15);
    border-radius: 20px;
    position: relative;
  }
  .qr-frame img {
    width: 180px;
    height: 180px;
    display: block;
    border-radius: 8px;
  }
  /* Corner accents */
  .qr-frame::before, .qr-frame::after {
    content: '';
    position: absolute;
    width: 20px; height: 20px;
    border-color: #FFD700;
    border-style: solid;
  }
  .qr-frame::before {
    top: -2px; left: -2px;
    border-width: 3px 0 0 3px;
    border-radius: 8px 0 0 0;
  }
  .qr-frame::after {
    bottom: -2px; right: -2px;
    border-width: 0 3px 3px 0;
    border-radius: 0 0 8px 0;
  }
  .scan-text {
    font-size: 15px;
    font-weight: 700;
    color: #FFD700;
    margin-top: 12px;
    letter-spacing: 3px;
    text-transform: uppercase;
  }
  .scan-sub {
    font-size: 10px;
    color: #666;
    margin-top: 3px;
    letter-spacing: 1px;
  }
  .url-display {
    font-size: 9px;
    color: #444;
    margin-top: 6px;
    font-family: monospace;
    letter-spacing: 0.5px;
  }
  /* Table */
  .options-section {
    width: 100%;
    max-width: 520px;
    margin-top: 10px;
  }
  .section-title {
    font-size: 11px;
    font-weight: 700;
    color: #888;
    letter-spacing: 4px;
    text-transform: uppercase;
    text-align: center;
    margin-bottom: 8px;
  }
  .options-table {
    width: 100%;
    border-collapse: collapse;
    background: rgba(255,255,255,0.015);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255,215,0,0.08);
  }
  .options-table th {
    padding: 8px 10px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-bottom: 1px solid rgba(255,215,0,0.12);
  }
  /* Info boxes */
  .info-row {
    display: flex;
    gap: 12px;
    width: 100%;
    max-width: 520px;
    margin-top: 14px;
  }
  .info-box {
    flex: 1;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,215,0,0.08);
    border-radius: 12px;
    padding: 12px 14px;
    text-align: center;
  }
  .info-box-icon { font-size: 18px; margin-bottom: 3px; }
  .info-box-value {
    font-size: 20px;
    font-weight: 900;
    color: #FFD700;
  }
  .info-box-label {
    font-size: 8px;
    color: #666;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 2px;
  }
  .footer {
    margin-top: auto;
    text-align: center;
    padding-top: 14px;
    padding-bottom: 8px;
  }
  .footer-line {
    width: 80px; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,215,0,0.2), transparent);
    margin: 0 auto 8px;
  }
  .footer p {
    font-size: 8px;
    color: #333;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  @media print {
    body { background: #060608; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="trophy">🏆</div>
    <div class="title">2026 WORLD CUP</div>
    <div class="title" style="font-size:28px;">DRAW</div>
    <div class="subtitle">Payout Structure Vote</div>
  </div>

  <div class="divider"></div>

  <div class="pot-badge">
    <div class="pot-dot"></div>
    <span class="pot-amount">$${TOTAL_POT.toLocaleString()}</span>
    <span class="pot-label">Total Pot</span>
  </div>

  <div class="qr-section">
    <div class="qr-frame">
      <img src="${qrDataUri}" alt="Voting QR Code" />
    </div>
    <div class="scan-text">Scan to Cast Your Vote</div>
    <div class="scan-sub">Use your phone's camera to scan the QR code above</div>
    <div class="url-display">${voteUrl}</div>
  </div>

  <div class="info-row">
    <div class="info-box">
      <div class="info-box-icon">👥</div>
      <div class="info-box-value">48</div>
      <div class="info-box-label">Total Voters</div>
    </div>
    <div class="info-box">
      <div class="info-box-icon">🥇</div>
      <div class="info-box-value">$3,600</div>
      <div class="info-box-label">Max 1st Prize</div>
    </div>
    <div class="info-box">
      <div class="info-box-icon">📊</div>
      <div class="info-box-value">10</div>
      <div class="info-box-label">Options</div>
    </div>
    <div class="info-box">
      <div class="info-box-icon">⚡</div>
      <div class="info-box-value">LIVE</div>
      <div class="info-box-label">Real-Time Results</div>
    </div>
  </div>

  <div class="options-section">
    <div class="section-title">Payout Options</div>
    <table class="options-table">
      <thead>
        <tr>
          <th style="text-align:left;color:#888;">Option</th>
          <th style="color:#FFD700;">🥇 1st</th>
          <th style="color:#C0C0C0;">🥈 2nd</th>
          <th style="color:#CD7F32;">🥉 3rd</th>
          <th style="color:#666;">4th</th>
        </tr>
      </thead>
      <tbody>
        ${optionRows}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <div class="footer-line"></div>
    <p>fifa26.glitzandglamours.com • One Vote Per Person • Results Shown Live</p>
  </div>
</div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Poster error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
