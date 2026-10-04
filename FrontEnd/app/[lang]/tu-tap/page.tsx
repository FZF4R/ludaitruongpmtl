import type { Metadata } from "next";
import { Container, SectionHeading, Card } from "@/components/ui/primitives";
import { LocaleLink } from "@/components/ui/locale-link";
import { Breadcrumbs } from "@/components/content/navigation";
import { getDictionary, getLocale } from "@/lib/dictionary";
import { i18nAlternates } from "@/lib/seo";
import { practiceNav } from "@/lib/site";
import Image from "next/image";
import { getSiteSettings } from "@/lib/api";
import { anhMucTuTap } from "@/lib/practice-images";
import { SettingImageEditor } from "@/components/library/library-image-editor";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();

  return {
    title: dict.nav.practice,
    description: dict.nav.practiceHint,
    alternates: await i18nAlternates("/tu-tap"),
  };
}

/**
 * Trang tổng quan "Tu tập".
 *
 * Bốn pháp tu ở đây trùng với menu thả xuống trên header — cùng đọc từ
 * `practiceNav` nên không thể lệch nhau. Người dùng cảm ứng không có hover
 * để thấy menu con, trang này là đường vào của họ.
 */
export default async function PracticePage() {
  const [dict, settings, locale] = await Promise.all([getDictionary(), getSiteSettings().catch(() => null), getLocale()]);

  return (
    <Container className="flex flex-col gap-8 py-12">
      <Breadcrumbs
        trail={[
          { name: dict.nav.home, href: "/" },
          { name: dict.nav.practice, href: "/tu-tap" },
        ]}
      />

      <SectionHeading
        eyebrow={dict.footer.categories}
        title={dict.nav.practice}
        description={dict.nav.practiceHint}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        {practiceNav.map((item) => (
          <Card key={item.href} className="group relative overflow-hidden p-5 pt-0 hover:border-line-strong hover:shadow-card-lift">
            <div className="relative -mx-5 mb-4 aspect-[16/7] overflow-hidden bg-surface-2">
              {(() => {
                const anh = anhMucTuTap(item.key, settings?.practiceImages);
                return (
                  <Image
                    src={anh}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    unoptimized={typeof anh === "string"}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                );
              })()}
            </div>
            {/* Chế độ sửa: đổi ảnh mục (nằm trên lớp link phủ thẻ). */}
            <SettingImageEditor
              truong="practiceImages"
              kind={item.key}
              ten={dict.nav[item.key]}
              daDat={settings?.practiceImages ?? {}}
              locale={locale}
            />
            <h2 className="font-serif text-lg font-bold leading-snug text-ink">
              <LocaleLink href={item.href} className="transition-colors hover:text-accent">
                <span className="absolute inset-0" aria-hidden />
                {dict.nav[item.key]}
              </LocaleLink>
            </h2>
            <p className="mt-1.5 text-sm text-muted">{dict.nav[`${item.key}Hint`]}</p>
          </Card>
        ))}
      </div>
    </Container>
  );
}
