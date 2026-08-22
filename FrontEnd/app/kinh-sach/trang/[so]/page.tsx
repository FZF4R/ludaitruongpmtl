import type { Metadata } from "next";
import {
  ContentListPage,
  pageParams,
  parsePageNumber,
} from "@/components/content/content-list-page";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  return pageParams({ type: "sutra" });
}

export async function generateMetadata(props: {
  params: Promise<{ so: string }>;
}): Promise<Metadata> {
  const { so } = await props.params;
  return {
    title: `Kinh sách — trang ${so}`,
    alternates: { canonical: absoluteUrl(`/kinh-sach/trang/${so}`) },
    robots: { index: false, follow: true },
  };
}

export default async function SutraListPagedPage(props: {
  params: Promise<{ so: string }>;
}) {
  const { so } = await props.params;
  const page = parsePageNumber(so);

  return (
    <ContentListPage
      filter={{ type: "sutra" }}
      page={page}
      basePath="/kinh-sach"
      eyebrow="Kinh, luật, luận"
      title="Kinh sách"
      description={`Trang ${page}`}
      trail={[
        { name: "Trang chủ", href: "/" },
        { name: "Kinh sách", href: "/kinh-sach" },
        { name: `Trang ${page}`, href: `/kinh-sach/trang/${page}` },
      ]}
    />
  );
}
