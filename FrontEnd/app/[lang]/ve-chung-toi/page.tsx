import type { Metadata } from "next";
import { Container } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/content/navigation";
import { ProseBody } from "@/components/content/prose-body";
import { AboutEditor } from "@/components/about/about-editor";
import { getAbout } from "@/lib/api";
import { MAU_GIOI_THIEU } from "@/lib/about-template";
import { getDictionary, getLocale } from "@/lib/dictionary";
import { i18nAlternates } from "@/lib/seo";
import { toPlainText } from "@/lib/sanitize";

export const revalidate = 3600;

const HREF = "/ve-chung-toi";

export async function generateMetadata(): Promise<Metadata> {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const html = (await getAbout(locale)) || MAU_GIOI_THIEU;
  return {
    title: dict.nav.about,
    description: toPlainText(html, 160),
    alternates: await i18nAlternates(HREF),
  };
}

/**
 * Về chúng tôi: toàn bộ nội dung là HTML admin soạn (theo ngôn ngữ, thiếu thì
 * bản tiếng Việt, chưa soạn thì mẫu). Lọc lại ở server (ProseBody) trước khi hiện.
 */
export default async function AboutPage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const html = (await getAbout(locale)) || MAU_GIOI_THIEU;

  return (
    <Container className="flex flex-col gap-6 py-12">
      <Breadcrumbs
        trail={[
          { name: dict.nav.home, href: "/" },
          { name: dict.nav.about, href: HREF },
        ]}
      />
      <AboutEditor locale={locale} />
      <article className="mx-auto w-full max-w-4xl">
        <ProseBody html={html} className="gioi-thieu" />
      </article>
    </Container>
  );
}
