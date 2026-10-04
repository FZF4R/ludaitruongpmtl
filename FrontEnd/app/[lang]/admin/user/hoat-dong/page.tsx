import type { Metadata } from "next";
import { Suspense } from "react";
import { UserActivity } from "@/components/admin/user-activity";

export const metadata: Metadata = { title: "Hoạt động người dùng" };

/** Toàn bộ hoạt động một tài khoản (?id=) - quyền `user.list`; mở ở tab mới từ danh sách người dùng. */
export default function AdminUserActivityPage() {
  return (
    <Suspense>
      <UserActivity />
    </Suspense>
  );
}
