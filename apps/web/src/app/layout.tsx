import "./globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { authEnabled } from "@/lib/flags";

export const metadata: Metadata = {
  title: "PromptGenius AI — Commercial Prompt Generator",
  description:
    "Generate high-performance, structured prompts for any industry. Bundle, price, and ship them as a product.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PromptGenius",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#534AB7",
    "msapplication-tap-highlight": "no",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tree = (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );

  // Only mount ClerkProvider when configured; otherwise run in mock mode.
  return authEnabled ? <ClerkProvider>{tree}</ClerkProvider> : tree;
}
