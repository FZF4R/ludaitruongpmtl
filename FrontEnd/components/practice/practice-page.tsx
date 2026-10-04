import type { Metadata } from "next";
import Image from "next/image";
import { getSiteSettings } from "@/lib/api";
import { anhMucTuTap } from "@/lib/practice-images";
import { Breadcrumbs } from "@/components/content/navigation";
import { getDictionary, getLocale } from "@/lib/dictionary";
import { SettingImageEditor } from "@/components/library/library-image-editor";
import { i18nAlternates } from "@/lib/seo";
import type { PracticeKey } from "@/lib/site";

/** Metadata chung cho bốn trang công cụ tu tập. */
export async function practiceMetadata(key: PracticeKey, href: string): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: dict.nav[key],
    description: dict.nav[`${key}Hint`],
    alternates: await i18nAlternates(href),
  };
}

/**
 * Đầu trang công cụ tu tập: breadcrumb rồi tới ảnh đại diện của mục. Không còn
 * khối tiêu đề lớn (gọn giao diện) - tên mục đã có ở breadcrumb; vẫn giữ một
 * <h1> ẩn cho trình đọc màn hình và công cụ tìm kiếm.
 */
export async function PracticeHeader({ navKey, href }: { navKey: PracticeKey; href: string }) {
  const [dict, settings, locale] = await Promise.all([getDictionary(), getSiteSettings().catch(() => null), getLocale()]);
  const anh = anhMucTuTap(navKey, settings?.practiceImages);
  return (
    <>
      <Breadcrumbs
        trail={[
          { name: dict.nav.home, href: "/" },
          { name: dict.nav.practice, href: "/tu-tap" },
          { name: dict.nav[navKey], href },
        ]}
      />
      <h1 className="sr-only">{dict.nav[navKey]}</h1>
      {/* Ảnh riêng của mục (admin đổi ở Tổng quan → Ảnh các mục tu tập). */}
      {/* Không overflow-hidden ở khung ngoài: khung "Đổi ảnh" (Chế độ sửa) cao hơn ảnh trên điện thoại. */}
      <div className="relative -mt-2 aspect-[21/6] min-h-32 rounded-card bg-surface-2">
        <Image
          src={anh}
          alt=""
          fill
          priority
          sizes="(min-width: 1280px) 76rem, 100vw"
          unoptimized={typeof anh === "string"}
          className="rounded-card object-cover"
        />
        <span className="absolute inset-0 rounded-card bg-gradient-to-t from-black/35 to-transparent" aria-hidden />
        <SettingImageEditor
          truong="practiceImages"
          kind={navKey}
          ten={dict.nav[navKey]}
          daDat={settings?.practiceImages ?? {}}
          locale={locale}
          className="right-3 top-3"
        />
      </div>
    </>
  );
}
