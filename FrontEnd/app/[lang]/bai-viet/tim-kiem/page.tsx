import type { Metadata } from "next";
import { ContentSearchPage } from "@/components/content/content-list-page";
import { getDictionary } from "@/lib/dictionary";
import { getSiteSettings } from "@/lib/api";

/** Kết quả tìm kiếm - trang động (đọc ?q=), không lập chỉ mục. */
export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: `${dict.list.searchTitle} — ${dict.nav.articles}`, robots: { index: false, follow: true } };
}

export default async function Page(props: { searchParams: Promise<{ q?: string; trang?: string }> }) {
  const sp = await props.searchParams;
  const dict = await getDictionary();
  const settings = await getSiteSettings();
  const layout = settings?.articleLayout === "list" ? "list" : "card";
  return (
    <ContentSearchPage
      filter={{ type: ["article", "blog"] }}
      q={String(sp.q ?? "")}
      page={Math.max(1, Math.floor(Number(sp.trang) || 1))}
      listPath="/bai-viet"
      searchPath="/bai-viet/tim-kiem"
      title={dict.nav.articles}
      trail={[
        { name: dict.nav.home, href: "/" },
        { name: dict.nav.articles, href: "/bai-viet" },
      ]}
      layout={layout}
      thumbnail
    />
  );
}
