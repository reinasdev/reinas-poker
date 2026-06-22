import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Planning Poker", description: "Estimativas colaborativas em tempo real" };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><main className="min-h-screen">{children}</main></body></html>}
