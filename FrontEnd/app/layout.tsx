import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Literata } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { websiteJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui/primitives";
import { ThemeProvider } from "@/components/layout/theme";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

/**
 * next/font tự host font: không có request nào sang fonts.googleapis.com
 * lúc runtime, nên không có round-trip chặn render. Cả hai face đều có
 * bộ dấu tiếng Việt đầy đủ — đây là tiêu chí loại trừ đầu tiên khi chọn.
 */
const beVietnam = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const literata = Literata({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-literata",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/", types: { "application/rss+xml": "/rss.xml" } },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    url: site.url,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f5f1" },
    { media: "(prefers-color-scheme: dark)", color: "#101713" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${beVietnam.variable} ${literata.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider>
          <a
            href="#noi-dung"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-paper"
          >
            Bỏ qua phần đầu trang
          </a>
          <SiteHeader />
          <main id="noi-dung" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </ThemeProvider>
        <JsonLd data={websiteJsonLd()} />
      </body>
    </html>
  );
}
