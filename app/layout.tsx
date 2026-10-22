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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=Public+Sans:wght@400;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
