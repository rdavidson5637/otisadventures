import type { Metadata } from "next";
import { Caveat, Nunito } from "next/font/google";
import "./globals.css";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-caveat",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Otis' Adventures",
  description: "A private family scrapbook — Otis' adventures around the world.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${caveat.variable} ${nunito.variable} font-nunito antialiased`}>
        {children}
      </body>
    </html>
  );
}
