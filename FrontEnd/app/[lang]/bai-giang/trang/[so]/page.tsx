import type { Metadata } from "next";
import {
  ContentListPage,
  pageParams,
  parsePageNumber,
} from "@/components/content/content-list-page";
import { i18nAlternates } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  return pageParams({ type: ["audio", "video"] });
}

export async function generateMetadata(props: {
  params: Promise<{ so: string }>;
}): Promise<Metadata> {
  const { so } = await props.params;
  return {
    title: `Bài giảng — trang ${so}`,
    alternates: await i18nAlternates(`/bai-giang/trang/${so}`),
    robots: { index: false, follow: true },
  };
}

export default async function TalkListPagedPage(props: {
  params: Promise<{ so: string }>;
}) {
  const { so } = await props.params;
  const page = parsePageNumber(so);

  return (
    <ContentListPage
      filter={{ type: ["audio", "video"] }}
      page={page}
      basePath="/bai-giang"
      eyebrow="Nghe và xem"
      title="Bài giảng"
      description={`Trang ${page}`}
      trail={[
        { name: "Trang chủ", href: "/" },
        { name: "Bài giảng", href: "/bai-giang" },
        { name: `Trang ${page}`, href: `/bai-giang/trang/${page}` },
      ]}
      columns={2}
    />
  );
}
