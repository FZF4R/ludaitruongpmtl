import type { Metadata } from "next";
import { DashboardPanel } from "@/components/admin/dashboard-panel";

export const metadata: Metadata = { title: "Tổng quan" };

/**
 * Sửa những gì hiện ra trên giao diện công khai: tiêu đề, thông tin liên hệ,
 * dải thiền ngữ đầu trang chủ và bảng màu.
 *
 * Chỉ vai trò Quản lý vào được — quyền `system.settings` trong
 * Backend/config/roles.js. AdminShell giấu mục này khỏi thanh điều hướng của
 * vai trò thấp hơn, còn backend mới là chỗ thật sự chặn.
 */
export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl font-bold tracking-tight">Tổng quan</h1>
        <p className="text-sm text-muted">
          Những thay đổi ở đây hiện ra trên trang công khai sau tối đa 5 phút, do trang chủ được
          sinh lại theo chu kỳ đó.
        </p>
      </div>

      <DashboardPanel />
    </div>
  );
}
