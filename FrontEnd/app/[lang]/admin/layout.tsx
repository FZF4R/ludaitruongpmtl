import type { Metadata } from "next";
import { Container } from "@/components/ui/primitives";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Khu quản trị.
 *
 * `noindex, nofollow` cho cả nhánh: mọi trang con thừa kế metadata này, nên
 * không phải nhớ khai lại ở từng trang — quên một lần là một màn hình quản trị
 * lọt vào kết quả tìm kiếm.
 *
 * Khung rộng hơn phần công khai vì ở đây có bảng nhiều cột.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Quản trị", template: "%s · Quản trị" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container className="max-w-7xl">
      <AdminShell>{children}</AdminShell>
    </Container>
  );
}
