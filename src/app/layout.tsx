import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { RegionProvider } from "@/components/providers/region-provider";
import { CookieConsentBanner } from "@/components/cookie-consent";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "DORA Comply | AI-Powered DORA Compliance Platform",
  description: "Automate vendor assessments, generate the Register of Information, and manage ICT incident reporting for EU financial institutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakarta.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <RegionProvider>
            {children}
            <Toaster richColors position="top-right" />
            <CookieConsentBanner />
          </RegionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
