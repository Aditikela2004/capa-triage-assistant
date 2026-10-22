import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CAPA Triage Assistant",
  description:
    "Concept project: triage a deviation report, check documentation gaps, draft a CAPA outline, and keep a human approval and audit trail.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
