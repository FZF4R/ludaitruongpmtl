import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/content/navigation";
import { MyContent } from "@/components/account/my-content";
import { listCategories } from "@/lib/api";
import { getDictionary } from "@/lib/dictionary";

/** Bài viết của tôi: dữ liệu riêng từng người, không lập chỉ mục. */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.myContent.title, robots: { index: false, follow: false } };
}

export default async function Page() {
  const dict = await getDictionary();
  // Chuyên mục cho bài viết (bỏ chuyên mục riêng của kinh / bài giảng).
  const chuyenMuc = await listCategories()
    .then((ds) => ds.filter((c) => c.kind === "all" || c.kind === "article").map((c) => ({ slug: c.slug, name: c.name })))
    .catch(() => []);

  return (
    <Container className="flex flex-col gap-8 py-12">
      <Breadcrumbs
        trail={[
          { name: dict.nav.home, href: "/" },
          { name: dict.account.title, href: "/tai-khoan" },
          { name: dict.myContent.title, href: "/tai-khoan/bai-viet" },
        ]}
      />
      <SectionHeading eyebrow={dict.account.eyebrow} title={dict.myContent.title} description={dict.myContent.description} />
      <Suspense>
        <MyContent nhan={dict.myContent} nhanTV={dict.library} chuyenMuc={chuyenMuc} />
      </Suspense>
    </Container>
  );
}
