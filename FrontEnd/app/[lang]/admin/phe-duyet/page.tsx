import type { Metadata } from "next";
import { ApprovalPanel } from "@/components/admin/approval-panel";

export const metadata: Metadata = { title: "Phê duyệt" };

/** Bình luận / lời nguyện chứa từ cấm chờ duyệt - quyền `comment.moderate` (Kiểm duyệt viên trở lên). */
export default function AdminApprovalPage() {
  return <ApprovalPanel />;
}
