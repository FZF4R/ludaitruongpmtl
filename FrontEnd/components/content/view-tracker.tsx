"use client";

import * as React from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";
const KHOA = "sv_da_doc";

/**
 * Báo về backend một lượt đọc, để trang chủ xếp được "đọc nhiều nhất".
 *
 * Phải chạy ở trình duyệt: trang chi tiết là ISR, HTML lấy từ cache nên
 * backend không hề thấy lượt xem nào. Mỗi bài chỉ tính một lần mỗi phiên
 * (sessionStorage), để tải lại trang hay quay lại từ trang khác không cộng
 * dồn. Không in ra gì và không bao giờ làm hỏng trang nếu API lỗi.
 */
export function ViewTracker({ slug }: { slug: string }) {
  React.useEffect(() => {
    let daDoc: string[] = [];
    try {
      daDoc = JSON.parse(window.sessionStorage.getItem(KHOA) ?? "[]") as string[];
    } catch {
      daDoc = [];
    }
    if (daDoc.includes(slug)) return;

    // Đợi một nhịp: người mở nhầm rồi bấm Back ngay thì không tính.
    const hen = window.setTimeout(() => {
      fetch(new URL("/v1/public/content/view", API_URL), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
        keepalive: true,
      }).catch(() => {});

      try {
        window.sessionStorage.setItem(KHOA, JSON.stringify([...daDoc, slug].slice(-200)));
      } catch {
        // Không lưu được thì lần sau có thể tính thêm một lượt - chấp nhận được.
      }
    }, 3000);

    return () => window.clearTimeout(hen);
  }, [slug]);

  return null;
}
