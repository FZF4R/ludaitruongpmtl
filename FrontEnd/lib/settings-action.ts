"use server";

import { updateTag } from "next/cache";
import { tags } from "@/lib/api";

/**
 * Xoá cache cấu hình site sau khi admin lưu ở trang Tổng quan (hoặc đổi kiểu
 * hiển thị ngay trên trang Bài viết), để thay đổi hiện ra ngay thay vì chờ ISR.
 *
 * Không tin người gọi: trước khi xoá cache, hỏi lại Sails bằng chính token
 * của họ xem có quyền `system.settings` không (GET /v1/admin/settings). Nếu
 * không kiểm tra, ai cũng gọi được action này để liên tục xoá cache của site.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";

export async function lamMoiCauHinh(token: string): Promise<boolean> {
  try {
    const res = await fetch(new URL("/v1/admin/settings", API_URL), {
      headers: { Accept: "application/json", Authorization: token },
      cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as { data?: unknown } | null;
    if (!res.ok || !body || body.data === undefined) return false;
  } catch {
    return false;
  }

  updateTag(tags.settings);
  return true;
}
