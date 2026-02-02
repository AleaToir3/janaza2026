import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./main.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Janaza Tracker - Suivi des prières funéraires",
    description: "Application de suivi des janazas (prières funéraires) avec carte interactive et notifications",
    keywords: ["janaza", "prière funéraire", "mosquée", "islam", "communauté"],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" data-theme="light">
            <body className={inter.className}>
                {children}
            </body>
        </html>
    );
}
