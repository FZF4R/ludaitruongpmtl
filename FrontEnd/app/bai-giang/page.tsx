import type { Metadata } from "next";
import { ContentListPage } from "@/components/content/content-list-page";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Bài giảng",
  description:
    "Bài giảng audio và video, mỗi bài kèm toàn văn để tiện đối chiếu và tra cứu.",
  alternates: { canonical: "/bai-giang" },
};

export default function TalkListPage() {
  return (
    <ContentListPage
      filter={{ type: ["audio", "video"] }}
      page={1}
      basePath="/bai-giang"
      eyebrow="Nghe và xem"
      title="Bài giảng"
      description="Mỗi bài đều có toàn văn — vừa để bộ máy tìm kiếm đọc được, vừa để bạn tra lại một đoạn đã nghe."
      trail={[
        { name: "Trang chủ", href: "/" },
        { name: "Bài giảng", href: "/bai-giang" },
      ]}
      columns={2}
      emptyTitle="Chưa có bài giảng nào"
    />
  );
}
