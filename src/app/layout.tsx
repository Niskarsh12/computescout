import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ComputeScout — Infrastructure Intelligence",
  description: "Find the best place on Earth to run your workload.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col relative`}
      >
        <Header />
        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 py-12 md:py-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
