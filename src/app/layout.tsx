import type { Metadata } from "next";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next"

// Define metadata for SEO and browser tab information
export const metadata: Metadata = {
  title: "Claude 3 Comparison",
  description: "Compare responses from Claude 3 Haiku and Sonnet models",
};

// Root layout component that wraps all pages for consistent structure
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {/* Add Vercel Speed Insights for performance monitoring */}
        <SpeedInsights />
      </body>
    </html>
  );
}
