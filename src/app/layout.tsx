import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "OpenRechnung - Angebote und Rechnungen fuer Handwerker",
  description: "Kostenlos Angebote und Rechnungen schreiben - einfach fuer Handwerker."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
