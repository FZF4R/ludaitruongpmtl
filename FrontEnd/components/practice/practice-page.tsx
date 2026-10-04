import type { Metadata } from "next";
import Image from "next/image";
import { getSiteSettings } from "@/lib/api";
import { anhMucTuTap } from "@/lib/practice-images";
import { Breadcrumbs } from "@/components/content/navigation";
import { getDictionary, getI18n, getLocale, type Dictionary } from "@/lib/dictionary";
import { ThemMucHuongDan, XoaMucHuongDan } from "@/components/practice/guide-editor";
import { EditableText } from "@/components/layout/inline-edit";
import { HuongDan } from "@/components/practice/common";
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
 * Đầu trang công cụ tu tập: breadcrumb + ảnh của mục làm nền toàn trang. Không còn
 * khối tiêu đề lớn (gọn giao diện) - tên mục đã có ở breadcrumb; vẫn giữ một
 * <h1> ẩn cho trình đọc màn hình và công cụ tìm kiếm.
 */
export async function PracticeHeader({ navKey, href }: { navKey: PracticeKey; href: string }) {
  const [dict, settings, locale] = await Promise.all([getDictionary(), getSiteSettings().catch(() => null), getLocale()]);
  const anh = anhMucTuTap(navKey, settings?.practiceImages);
  return (
    <>
      {/*
        Ảnh riêng của mục làm NỀN TOÀN TRANG: cố định theo màn hình (-z-10,
        nằm dưới mọi khối nội dung; nền body tràn ra canvas nên không che ảnh).
        Lớp phủ màu nền giấy giữ chữ dễ đọc ở cả giao diện sáng và tối; các thẻ
        công cụ có nền đặc riêng. Admin đổi ảnh ở Chế độ sửa (nút bên dưới).
      */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <Image src={anh} alt="" fill priority sizes="100vw" unoptimized={typeof anh === "string"} className="object-cover" />
        <span className="absolute inset-0 bg-gradient-to-b from-paper/70 via-paper/85 to-paper/95" />
      </div>
      <div className="relative flex min-h-9 items-center">
        <Breadcrumbs
          trail={[
            { name: dict.nav.home, href: "/" },
            { name: dict.nav.practice, href: "/tu-tap" },
            { name: dict.nav[navKey], href },
          ]}
        />
        <SettingImageEditor
          truong="practiceImages"
          kind={navKey}
          ten={dict.nav[navKey]}
          daDat={settings?.practiceImages ?? {}}
          locale={locale}
          className="right-0 top-0"
        />
      </div>
      <h1 className="sr-only">{dict.nav[navKey]}</h1>
    </>
  );
}

/**
 * Mục Hướng dẫn cuối trang công cụ tu tập, sửa được ở Chế độ sửa: tiêu đề và
 * từng thẻ (tiêu đề + nội dung) là chữ giao diện với khoá
 * `practiceTools.guides.<nhom>.<i>.title|body`, lưu theo từng ngôn ngữ.
 */
export async function HuongDanSuaDuoc({ nhom }: { nhom: keyof Dictionary["practiceTools"]["guides"] }) {
  const { dict, texts } = await getI18n();
  const ds = dict.practiceTools.guides[nhom];
  // Mục admin thêm ở Chế độ sửa: chỉ số sau các mục có sẵn, đọc thẳng từ chữ
  // giao diện đã lưu (từ điển không có các khoá này). Mục đã xoá để lại khoảng
  // trống chỉ số - quét tới 50 chỉ số sau mục cuối.
  const khoa = (i: number, t: "title" | "body") => `practiceTools.guides.${nhom}.${i}.${t}`;
  const them: { i: number; title: string; body: string }[] = [];
  for (let i = ds.length; i < ds.length + 50; i++) {
    const title = texts[khoa(i, "title")];
    if (title) them.push({ i, title, body: texts[khoa(i, "body")] ?? "" });
  }
  const chiSoMoi = Math.max(ds.length, ...them.map((m) => m.i + 1));
  return (
    <HuongDan
      tieuDe={<EditableText k="practiceTools.guideTitle" value={dict.practiceTools.guideTitle} />}
      muc={[
        ...ds.map((m, i) => ({
          title: <EditableText k={khoa(i, "title")} value={m.title} />,
          body: <EditableText k={khoa(i, "body")} value={m.body} multiline />,
        })),
        ...them.map((m) => ({
          title: <EditableText k={khoa(m.i, "title")} value={m.title} />,
          body: <EditableText k={khoa(m.i, "body")} value={m.body} multiline />,
          phu: <XoaMucHuongDan nhom={nhom} chiSo={m.i} />,
        })),
      ]}
      cuoi={<ThemMucHuongDan nhom={nhom} chiSoMoi={chiSoMoi} />}
    />
  );
}
