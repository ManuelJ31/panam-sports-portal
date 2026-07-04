import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "flag-icons/css/flag-icons.min.css";
import "./globals.css";
import Footer from "@/components/Footer";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Panam Sports Executive Monitoring Platform",
  description:
    "A weekly review of Methodologist reports for Panam Sports and Olympic organizations.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} flex min-h-screen flex-col bg-paper-off font-sans text-navy antialiased`}
      >
        {children}
        <Footer />
      </body>
    </html>
  );
}
