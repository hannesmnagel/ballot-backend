import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ballot",
  description: "Better polls with modern voting systems"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
