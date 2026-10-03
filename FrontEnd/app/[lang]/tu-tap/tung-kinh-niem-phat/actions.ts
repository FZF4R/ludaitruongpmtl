"use server";

import { getContent } from "@/lib/api";
import { sanitize } from "@/lib/sanitize";

export type BanKinh = { slug: string; title: string; phan: { title: string; html: string }[] };

/**
 * Nội dung một bộ kinh cho chế độ tụng: đọc qua cache của trang kinh sách
 * và làm sạch HTML ngay trên server - trình duyệt không nhận HTML thô.
 */
export async function docKinh(slug: string): Promise<BanKinh | null> {
  if (!/^[\w-]{1,200}$/.test(slug)) return null;
  const kinh = await getContent(slug).catch(() => null);
  if (!kinh || kinh.type !== "sutra") return null;

  const chuong = [...kinh.chapters].sort((a, b) => a.order - b.order);
  const phan = chuong.length
    ? chuong.map((c) => ({ title: c.title, html: sanitize(c.bodyHtml ?? "") }))
    : [{ title: "", html: sanitize(kinh.bodyHtml ?? "") }];

  return { slug: kinh.slug, title: kinh.title, phan };
}
