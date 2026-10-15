import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter : dessinée pour l'écran, reste nette en petite taille (y compris sous Windows).
const inter = Inter({
  variable: "--font-app",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pilotage Baromètre",
  description: "Suivi des projets internes du Baromètre",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
