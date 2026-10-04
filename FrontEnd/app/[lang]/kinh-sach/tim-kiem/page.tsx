import type { Metadata } from "next";
import { ContentSearchPage } from "@/components/content/content-list-page";
import { getDictionary } from "@/lib/dictionary";


/** Kết quả tìm kiếm - trang động (đọc ?q=), không lập chỉ mục. */
export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: `${dict.list.searchTitle} — ${dict.nav.sutras}`, robots: { index: false, follow: true } };
}

export default async function Page(props: { searchParams: Promise<{ q?: string; trang?: string }> }) {
  const sp = await props.searchParams;
  const dict = await getDictionary();
  return (
    <ContentSearchPage
      filter={{ type: "sutra" }}
      q={String(sp.q ?? "")}
      page={Math.max(1, Math.floor(Number(sp.trang) || 1))}
      listPath="/kinh-sach"
      searchPath="/kinh-sach/tim-kiem"
      title={dict.nav.sutras}
      trail={[
        { name: dict.nav.home, href: "/" },
        { name: dict.nav.sutras, href: "/kinh-sach" },
      ]}
      
    />
  );
}
