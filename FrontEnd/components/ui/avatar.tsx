import { urlApi } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * Ảnh đại diện tròn. Không có ảnh thì hiện chữ cái đầu của tên trên nền màu
 * nhấn nhạt - người chưa tải avatar vẫn có một dấu nhận diện.
 *
 * `src` là đường dẫn backend trả về (/v1/public/avatar/...?v=...); URL đã kèm
 * phiên bản nên trình duyệt cache được lâu. Dùng <img> thường chứ không qua
 * next/image: ảnh chỉ vài chục pixel, đã được thu nhỏ sẵn lúc tải lên.
 */
export function Avatar({
  src,
  name,
  size = 32,
  className,
}: {
  src?: string;
  name?: string;
  size?: number;
  className?: string;
}) {
  const chuDau =
    (name ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((t) => t[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft font-semibold text-accent",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) }}
      aria-hidden
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlApi(src)} alt="" width={size} height={size} loading="lazy" className="size-full object-cover" />
      ) : (
        chuDau
      )}
    </span>
  );
}
