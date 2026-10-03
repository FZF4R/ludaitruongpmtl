import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { tags } from "@/lib/api";

/**
 * Webhook để Sails gọi khi admin đăng hoặc sửa nội dung.
 *
 *   POST /api/revalidate
 *   x-revalidate-secret: <REVALIDATE_SECRET>
 *   { "slug": "kinh-phap-cu", "type": "sutra" }
 *
 * Đổi màu hoặc thông báo trong trang quản trị thì gọi:
 *   { "settings": true }
 *
 * Không có webhook này thì bài mới phải chờ hết hạn ISR (tới 1 giờ)
 * mới xuất hiện — admin sẽ tưởng là hệ thống hỏng.
 *
 * Dùng revalidateTag(tag, "max"): tag bị đánh dấu cũ, lượt truy cập kế
 * tiếp nhận nội dung cũ ngay lập tức rồi được làm mới ngầm phía sau.
 * Người đọc không phải chờ một lần render chậm.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Chưa cấu hình REVALIDATE_SECRET trên máy chủ." },
      { status: 500 },
    );
  }

  if (request.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ error: "Sai secret." }, { status: 401 });
  }

  let body: { slug?: string; type?: string; settings?: boolean; calendar?: boolean } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }

  const invalidated: string[] = [tags.content];
  revalidateTag(tags.content, "max");

  if (body.slug) {
    const tag = tags.contentBySlug(body.slug);
    revalidateTag(tag, "max");
    invalidated.push(tag);
  }

  if (body.type) {
    revalidateTag(`content-type:${body.type}`, "max");
    invalidated.push(`content-type:${body.type}`);
  }

  // Gọi với { "settings": true } sau khi admin đổi màu hoặc đổi thông báo.
  // Layout đọc cấu hình này nên nó ảnh hưởng MỌI trang, không riêng trang nào.
  if (body.settings) {
    revalidateTag(tags.settings, "max");
    invalidated.push(tags.settings);
  }

  // Gọi với { "calendar": true } sau khi thêm/sửa ngày vía, ngày lễ (LunarEvent).
  // Lịch cache tới 1 ngày; trang chủ và /phat-lich đều đọc nó.
  if (body.calendar) {
    revalidateTag(tags.calendar, "max");
    invalidated.push(tags.calendar);
  }

  return NextResponse.json({ revalidated: invalidated, at: Date.now() });
}
