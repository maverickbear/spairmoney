import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import { BottomNav } from "@/components/bottom-nav";
import { KBarWrapper } from "@/components/kbar-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SmartCouple - Personal Finance",
  description: "Track expenses, budgets, and investments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex">
            <Nav />
            <main className="flex-1 md:ml-64 pb-16 md:pb-0">
              <div className="container mx-auto px-4 py-4 md:py-8">{children}</div>
            </main>
          </div>
          <BottomNav />
          <KBarWrapper />
        </ThemeProvider>
      </body>
    </html>
  );
}
