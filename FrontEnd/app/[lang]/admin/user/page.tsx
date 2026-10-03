import type { Metadata } from "next";
import { UserPanel } from "@/components/admin/user-panel";

export const metadata: Metadata = { title: "Người dùng" };

/**
 * Xem toàn bộ thông tin một tài khoản và sửa email, họ tên, vai trò.
 *
 * Chỉ vai trò Quản lý vào được (quyền `user.manage`): màn hình này mở ra email
 * và toàn bộ khảo sát cá nhân, khác hẳn danh sách điều hành thông thường.
 */
export default function AdminUserPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl font-bold tracking-tight">Người dùng</h1>
        <p className="text-sm text-muted">
          Mọi lần đổi vai trò đều được ghi vào nhật ký kèm người thao tác, lý do và địa chỉ IP.
        </p>
      </div>

      <UserPanel />
    </div>
  );
}
