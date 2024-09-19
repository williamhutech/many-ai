import type { Metadata } from "next";
import "./globals.css";

// Define metadata for the application
export const metadata: Metadata = {
  title: "Claude 3 Comparison",
  description: "Compare responses from Claude 3 Haiku and Sonnet models",
};

// Root layout component for the application
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
