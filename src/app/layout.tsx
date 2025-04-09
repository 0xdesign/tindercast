import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tindercast - Find Your DeFi Match",
  description: "A Tinder-like swiping interface for matching with Farcaster users based on wallet holdings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <main className="min-h-screen bg-white">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
