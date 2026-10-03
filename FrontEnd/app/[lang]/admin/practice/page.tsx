import type { Metadata } from "next";
import { SoundsPanel } from "@/components/admin/sounds-panel";

export const metadata: Metadata = { title: "Âm thanh tu tập" };

/** Chuông, mõ, âm nền... cho các công cụ ở /tu-tap/* (quyền `practice.manage`). */
export default function AdminPracticePage() {
  return <SoundsPanel />;
}
