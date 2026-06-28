import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { AppFooter } from "@/components/layout/app-footer";
import "./globals.css";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Planning Poker",
  description: "Estimativas colaborativas em tempo real",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeScript = `try{var t=localStorage.getItem("theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;
  return (
    <html
      lang="pt-BR"
      className={jetBrainsMono.variable}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <link
          rel="icon"
          href="/favicon-light.svg"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          href="/favicon-dark.svg"
          media="(prefers-color-scheme: dark)"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <main className="flex-1">{children}</main>
        <AppFooter />
      </body>
    </html>
  );
}
