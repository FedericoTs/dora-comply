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
  title: {
    default: "DORA Comply | AI-Powered DORA Compliance Platform",
    template: "%s | DORA Comply",
  },
  description: "Automate vendor assessments, generate the Register of Information, and manage ICT incident reporting for EU financial institutions.",
  keywords: ["DORA", "compliance", "EU regulation", "financial services", "vendor risk", "ICT risk", "Register of Information", "incident reporting"],
  authors: [{ name: "DORA Comply" }],
  creator: "DORA Comply",
  metadataBase: new URL("https://doracomply.eu"),
  openGraph: {
    type: "website",
    locale: "en_EU",
    siteName: "DORA Comply",
    title: "DORA Comply | AI-Powered DORA Compliance Platform",
    description: "Automate vendor assessments, generate the Register of Information, and manage ICT incident reporting for EU financial institutions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DORA Comply | AI-Powered DORA Compliance Platform",
    description: "AI-powered DORA compliance for EU financial institutions. Deadline: January 17, 2026.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakarta.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
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
