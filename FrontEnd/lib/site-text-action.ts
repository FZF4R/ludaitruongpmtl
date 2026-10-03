"use server";

import { updateTag } from "next/cache";
import { tags } from "@/lib/api";

/**
 * Lưu một chuỗi giao diện admin vừa sửa ngay trên trang.
 *
 * Vì sao đi qua Server Action chứ không để trình duyệt gọi thẳng Sails: sau
 * khi lưu phải xoá cache `site-texts` của Next, và `updateTag` (hết hạn NGAY,
 * để chính admin thấy chữ mới ở lần render kế) chỉ gọi được trong Server Action.
 *
 * Token của admin được chuyển nguyên sang Sails — Sails mới là nơi kiểm tra
 * quyền `site.text.edit`. Action này không tự quyết định ai được sửa; người
 * không có quyền gọi vào chỉ nhận lại câu lỗi 403 của backend.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";

export async function luuChuGiaoDien(input: {
  token: string;
  lang: string;
  key: string;
  value: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  let res: Response;
  try {
    res = await fetch(new URL("/v1/admin/texts/update", API_URL), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: input.token,
        "x-language": input.lang,
      },
      body: JSON.stringify({ lang: input.lang, key: input.key, value: input.value }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, message: "" };
  }

  const body = (await res.json().catch(() => null)) as {
    data?: unknown;
    message?: { text?: string };
  } | null;

  // Cùng quy ước với lib/auth.ts goiApi: có `data` mới là thành công.
  if (!res.ok || !body || body.data === undefined) {
    return { ok: false, message: body?.message?.text ?? "" };
  }

  updateTag(tags.siteTexts);
  return { ok: true };
}
