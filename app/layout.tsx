import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Otimizar carregamento de fontes com Next.js
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CoDEX - Avalie jogos com seus amigos",
  description: "Avalie e compartilhe suas opiniões sobre jogos com sua galera",
  keywords: ["games", "review", "avaliação", "jogos"],
  manifest: "/manifest.json",
  themeColor: "#22c55e",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
