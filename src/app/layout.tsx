import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "2026 World Cup Draw — Payout Vote",
  description: "Vote on the payout structure for the 2026 World Cup Draw. $4,800 pot distributed across the top 4 finishers.",
  icons: { icon: "🏆" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#141414",
              border: "1px solid rgba(255, 215, 0, 0.3)",
              color: "#fafafa",
            },
          }}
        />
      </body>
    </html>
  );
}
