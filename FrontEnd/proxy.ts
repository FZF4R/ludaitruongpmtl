/**
 * Định tuyến ngôn ngữ.
 *
 * Ở bản Next này quy ước tệp `middleware` đã đổi tên thành `proxy`, và hàm
 * xuất ra phải tên là `proxy` (hoặc default export).
 *
 * Tiếng Việt là mặc định và KHÔNG mang tiền tố trên URL. Để vừa giữ được
 * /bai-viet như cũ vừa cho mọi route nằm dưới app/[lang], proxy VIẾT LẠI
 * (rewrite) chứ không chuyển hướng: trình duyệt vẫn thấy /bai-viet, còn
 * Next render app/[lang] với lang = "vi".
 *
 *   /bai-viet      -> rewrite -> /vi/bai-viet     (URL trên thanh địa chỉ không đổi)
 *   /en/bai-viet   -> giữ nguyên
 *   /vi/bai-viet   -> redirect 308 -> /bai-viet   (một dạng chuẩn duy nhất cho SEO)
 *
 * Cố tình KHÔNG tự đoán ngôn ngữ từ Accept-Language rồi chuyển hướng: một
 * người Việt mở link /en/... mà bị đá về tiếng Việt sẽ không hiểu chuyện gì
 * xảy ra, và Googlebot cũng bị đá lung tung. Ngôn ngữ do URL quyết định; lựa
 * chọn của người dùng lưu ở cookie chỉ dùng cho lần vào trang gốc.
 */
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, locales } from "@/lib/i18n";

export const COOKIE_NGON_NGU = "sv_ngon_ngu";

function doanDau(pathname: string): string {
  return pathname.split("/").filter(Boolean)[0] ?? "";
}

/** Ngôn ngữ ưu tiên cho khách vào thẳng "/": cookie trước, rồi Accept-Language. */
function ngonNguUaThich(request: NextRequest): string {
  const luu = request.cookies.get(COOKIE_NGON_NGU)?.value;
  if (luu && isLocale(luu)) return luu;

  const header = request.headers.get("accept-language");
  if (!header) return defaultLocale;

  // "ko-KR,ko;q=0.9,en;q=0.8" -> ["ko-kr", "ko", "en"] theo thứ tự q giảm dần.
  const uaThich = header
    .split(",")
    .map((phan) => {
      const [ma, q] = phan.trim().split(";q=");
      return { ma: ma.trim().toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { ma } of uaThich) {
    const goc = ma.split("-")[0];
    if (isLocale(goc)) return goc;
  }

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const dau = doanDau(pathname);

  // /vi/... -> /... Giữ đúng một URL chuẩn cho mỗi trang tiếng Việt, nếu không
  // cùng một nội dung tồn tại ở hai địa chỉ và Google phải tự đoán bản nào chính.
  if (dau === defaultLocale) {
    const conLai = pathname.slice(`/${defaultLocale}`.length) || "/";
    return NextResponse.redirect(new URL(`${conLai}${search}`, request.url), 308);
  }

  // Đã có tiền tố ngôn ngữ khác tiếng Việt: để Next xử lý như bình thường.
  if (isLocale(dau)) return NextResponse.next();

  // Vào thẳng trang gốc thì tôn trọng lựa chọn đã lưu / ngôn ngữ trình duyệt.
  if (pathname === "/") {
    const uaThich = ngonNguUaThich(request);
    if (uaThich !== defaultLocale) {
      return NextResponse.redirect(new URL(`/${uaThich}${search}`, request.url));
    }
  }

  // Còn lại là đường dẫn tiếng Việt không tiền tố -> viết lại vào app/[lang].
  return NextResponse.rewrite(
    new URL(`/${defaultLocale}${pathname}${search}`, request.url),
  );
}

export const config = {
  matcher: [
    // Bỏ qua tài nguyên nội bộ, API route và tệp tĩnh trong public/.
    // Thiếu bộ lọc này thì proxy chạy cả trên CSS, JS và ảnh.
    "/((?!_next|api|.*\\.[\\w]+$).*)",
  ],
};

// Dùng ở nơi khác để khỏi lặp lại danh sách.
export { locales };
