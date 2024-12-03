import type { Metadata } from "next";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next"

// Define metadata for SEO and browser tab information
export const metadata: Metadata = {
  title: "ManyAI",
  description: "Providing true multi-model AI experiences.",
};

// Root layout component that wraps all pages for consistent structure
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <link rel="preload" as="image" href="/avatars/claude.png" />
        <link rel="preload" as="image" href="/avatars/chatgpt.png" />
        <link rel="preload" as="image" href="/avatars/gemini.png" />
        <link rel="preload" as="image" href="/avatars/llama.png" />
      </head>
      <body className="antialiased">
        {children}
        {/* Add Vercel Speed Insights for performance monitoring */}
        <SpeedInsights />
      </body>
    </html>
  );
}
