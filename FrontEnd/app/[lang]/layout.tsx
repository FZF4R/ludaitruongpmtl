import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Literata } from "next/font/google";
import "../globals.css";
import { site } from "@/lib/site";
import { websiteJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui/primitives";
import { ThemeProvider } from "@/components/layout/theme";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { InlineEditProvider } from "@/components/layout/inline-edit";
import { getI18n } from "@/lib/dictionary";
import { defaultLocale, isLocale, localeTags, locales, type Locale } from "@/lib/i18n";
import { getSiteSettings } from "@/lib/api";
import {
  buildThemeCss,
  darkPalette,
  lightPalette,
  mergePalette,
} from "@/lib/theme";

/**
 * next/font tự host font: không có request nào sang fonts.googleapis.com
 * lúc runtime, nên không có round-trip chặn render. Cả hai face đều có
 * bộ dấu tiếng Việt đầy đủ — đây là tiêu chí loại trừ đầu tiên khi chọn.
 *
 * Bộ ký tự Trung và Hàn KHÔNG nằm trong hai face này. Chúng rơi về font hệ
 * thống của máy người xem (Microsoft YaHei, Malgun Gothic…), điều này chấp
 * nhận được vì phần chữ Trung/Hàn chỉ là giao diện; nhúng thêm hai bộ CJK
 * đầy đủ sẽ làm nặng trang lên vài megabyte.
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

/** Sinh sẵn cả bốn ngôn ngữ lúc build. */
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getI18n();

  // hreflang: nói cho Google biết bốn bản này là cùng một trang khác ngôn ngữ,
  // để nó không coi đây là nội dung trùng lặp.
  const languages: Record<string, string> = {};
  for (const item of locales) {
    languages[localeTags[item]] = item === defaultLocale ? "/" : `/${item}`;
  }
  languages["x-default"] = "/";

  return {
    metadataBase: new URL(site.url),
    title: {
      default: `${site.name} — ${dict.site.tagline}`,
      template: `%s · ${site.name}`,
    },
    description: dict.site.description,
    applicationName: site.name,
    alternates: {
      canonical: locale === defaultLocale ? "/" : `/${locale}`,
      languages,
      types: { "application/rss+xml": "/rss.xml" },
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: localeTags[locale].replace("-", "_"),
      url: locale === defaultLocale ? site.url : `${site.url}/${locale}`,
      title: `${site.name} — ${dict.site.tagline}`,
      description: dict.site.description,
    },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false },
  };
}

/**
 * Màu thanh địa chỉ trên di động. Phải khớp `paper` của lib/theme.ts, nếu
 * không thì đỉnh màn hình là một vệt màu khác hẳn phần trang ngay bên dưới.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: lightPalette.paper },
    { media: "(prefers-color-scheme: dark)", color: darkPalette.paper },
  ],
};

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  // LayoutProps khai lang là string; thu hẹp về Locale rồi mới tra bảng.
  const { lang } = await params;
  const ma = (isLocale(lang) ? lang : defaultLocale) satisfies Locale;
  const { dict } = await getI18n();

  /*
   * Màu: mặc định lấy từ lib/theme.ts, quản trị viên ghi đè qua
   * /v1/public/settings (trường `theme` / `themeDark`). getSiteSettings đã tự
   * nuốt lỗi và trả null khi API hỏng, nên sự cố backend chỉ làm mất phần
   * tuỳ biến chứ không làm trang mất màu.
   */
  const settings = await getSiteSettings();
  const themeCss = buildThemeCss(
    mergePalette(lightPalette, settings?.theme),
    mergePalette(darkPalette, settings?.themeDark),
  );

  return (
    <html
      lang={localeTags[ma]}
      suppressHydrationWarning
      className={`${beVietnam.variable} ${literata.variable}`}
    >
      <head>
        {/* Giá trị đã lọc qua bộ kiểm hex trong lib/theme.ts trước khi tới đây. */}
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider>
          <a
            href="#noi-dung"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-paper"
          >
            {dict.nav.skipToContent}
          </a>
          <InlineEditProvider>
            <SiteHeader dict={dict.nav} language={dict.language} />
            <main id="noi-dung" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </InlineEditProvider>
        </ThemeProvider>
        <JsonLd data={websiteJsonLd()} />
      </body>
    </html>
  );
}
