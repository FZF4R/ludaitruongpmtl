import type { Metadata } from "next";
import { Container, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/content/navigation";
import { ContentGrid } from "@/components/content/content-card";
import { listContent } from "@/lib/api";
import { getDictionary } from "@/lib/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.list.translatedSutras, robots: { index: false, follow: true } };
}

/**
 * Kinh sách đã dịch của một người (?nguoi=<userId>): các bộ kinh đã đăng có
 * dịch giả là tài khoản đó (dịch giả chọn từ người dùng khi soạn kinh). Nút
 * "Kinh sách đã dịch" ở tab Kinh sách dẫn tới đây với id của người đang xem.
 */
export default async function TranslatedSutrasPage(props: { searchParams: Promise<{ nguoi?: string; trang?: string }> }) {
  const sp = await props.searchParams;
  const dict = await getDictionary();
  const nguoi = /^[a-f0-9]{24}$/i.test(String(sp.nguoi ?? "")) ? String(sp.nguoi) : "";
  const kq = nguoi ? await listContent({ type: "sutra", translatorId: nguoi, limit: 48 }).catch(() => null) : null;
  const ds = kq?.data ?? [];
  const tenDichGia = ds[0]?.translator?.name;

  return (
    <Container className="flex flex-col gap-8 py-12">
      <Breadcrumbs
        trail={[
          { name: dict.nav.home, href: "/" },
          { name: dict.nav.sutras, href: "/kinh-sach" },
          { name: dict.list.translatedSutras, href: "/kinh-sach/da-dich" },
        ]}
      />
      <SectionHeading
        title={dict.list.translatedSutras}
        description={tenDichGia ? `${tenDichGia}${ds[0]?.translator?.dharmaName ? ` · ${ds[0].translator.dharmaName}` : ""} · ${ds.length}` : undefined}
      />
      {ds.length === 0 ? (
        <EmptyState title={dict.list.translatedSutras} description={dict.list.translatedEmpty} />
      ) : (
        <ContentGrid items={ds} columns={3} />
      )}
    </Container>
  );
}
