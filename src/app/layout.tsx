import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CVisionAI — Smart HR Screening for ALAS Academy",
  description:
    "AI-powered CV screening dashboard for ALAS Academy recruiters (hackathon MVP demo).",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}