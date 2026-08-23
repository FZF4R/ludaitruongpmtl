import type { Metadata } from "next";
import { Container, SectionHeading, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { LocaleLink } from "@/components/ui/locale-link";
import { Breadcrumbs } from "@/components/content/navigation";
import { getDictionary } from "@/lib/dictionary";
import { i18nAlternates } from "@/lib/seo";
import type { Dictionary } from "@/lib/dictionary";

type NavKey = keyof Dictionary["nav"];

/**
 * Trang giữ chỗ cho các mục đã có trên menu nhưng chưa có nội dung.
 *
 * Có mặt để menu không dẫn tới 404 — một liên kết chết trên thanh điều hướng
 * chính làm người dùng nghĩ cả site hỏng. Đặt noindex để Google không đưa
 * trang rỗng vào chỉ mục rồi phải gỡ ra sau.
 */
export async function ComingSoonPage({ navKey, href }: { navKey: NavKey; href: string }) {
  const dict = await getDictionary();
  const ten = dict.nav[navKey];

  return (
    <Container className="flex flex-col gap-8 py-12">
      <Breadcrumbs
        trail={[
          { name: dict.nav.home, href: "/" },
          { name: ten, href },
        ]}
      />

      <SectionHeading
        eyebrow={dict.comingSoon.title}
        title={ten}
        description={dict.nav[`${navKey}Hint` as NavKey] ?? ""}
      />

      <Card className="flex max-w-lg flex-col gap-4 p-6">
        <p className="text-sm text-muted">{dict.comingSoon.body}</p>
        <div>
          <Button variant="outline" asChild>
            <LocaleLink href="/">{dict.common.backHome}</LocaleLink>
          </Button>
        </div>
      </Card>
    </Container>
  );
}

/** Metadata dùng chung cho các trang giữ chỗ. */
export async function comingSoonMetadata(
  navKey: NavKey,
  href: string,
): Promise<Metadata> {
  const dict = await getDictionary();

  return {
    title: dict.nav[navKey],
    alternates: await i18nAlternates(href),
    // Trang chưa có nội dung: cho bot đi tiếp nhưng đừng lập chỉ mục.
    robots: { index: false, follow: true },
  };
}
