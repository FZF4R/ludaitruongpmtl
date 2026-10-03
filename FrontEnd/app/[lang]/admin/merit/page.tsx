import type { Metadata } from "next";
import { MeritPanel } from "@/components/admin/merit-panel";

export const metadata: Metadata = { title: "Công đức" };

/** Bảng điểm công đức, bảng xếp hạng và thông tin ủng hộ (QR) - quyền `merit.manage`. */
export default function AdminMeritPage() {
  return <MeritPanel />;
}
