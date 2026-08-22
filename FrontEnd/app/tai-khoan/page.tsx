import type { Metadata } from "next";
import Link from "next/link";
import { Container, SectionHeading, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/content/navigation";

/**
 * Khu vực cá nhân.
 *
 * noindex và không cache: dữ liệu riêng của từng người, không có gì ở
 * đây đáng để bộ máy tìm kiếm nhìn thấy. Backend đã sẵn các endpoint
 * đăng nhập/đăng ký (POST /v1/user/login, /v1/user/register) — phần
 * kết nối làm ở bước sau.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tài khoản",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <Container className="flex flex-col gap-8 py-12">
      <Breadcrumbs
        trail={[
          { name: "Trang chủ", href: "/" },
          { name: "Tài khoản", href: "/tai-khoan" },
        ]}
      />

      <SectionHeading
        eyebrow="Khu vực cá nhân"
        title="Tài khoản"
        description="Đăng nhập để lưu bài, đánh dấu tiến độ nghe và đồng bộ giữa các thiết bị."
      />

      <Card className="flex max-w-lg flex-col gap-4 p-6">
        <p className="text-sm text-muted">
          Màn hình đăng nhập chưa được nối. Backend đã có sẵn{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">
            POST /v1/user/login
          </code>
          ,{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">
            /v1/user/register
          </code>{" "}
          và đăng nhập Google/Facebook.
        </p>
        <div className="flex gap-2">
          <Button disabled>Đăng nhập</Button>
          <Button variant="outline" asChild>
            <Link href="/">Về trang chủ</Link>
          </Button>
        </div>
      </Card>
    </Container>
  );
}
