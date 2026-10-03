import Image from "next/image";
import { heroImages } from "@/lib/hero-images";
import { cn } from "@/lib/utils";

/**
 * Ảnh thumbnail của một bài: ảnh bìa nếu có, không thì một ảnh trong bộ sưu
 * tập lib/img.
 *
 * Ảnh mặc định chọn THEO SLUG chứ không ngẫu nhiên: mỗi bài luôn mang đúng một
 * ảnh qua mọi lần render, nên người đọc nhận ra bài quen bằng mắt, và hai lần
 * sinh lại trang (ISR) không làm cả lưới ảnh nhảy lung tung.
 */
function anhMacDinh(slug: string) {
  let bam = 0;
  for (let i = 0; i < slug.length; i++) bam = (bam * 31 + slug.charCodeAt(i)) >>> 0;

  return heroImages[bam % heroImages.length];
}

export function ContentThumb({
  slug,
  coverUrl,
  sizes,
  className,
}: {
  slug: string;
  coverUrl?: string;
  /** Gợi ý kích thước cho srcset, theo bề rộng ô chứa ảnh. */
  sizes: string;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-surface-2", className)}>
      {coverUrl ? (
        // Ảnh bìa có thể nằm ở bất kỳ tên miền nào admin dán vào, nên không
        // qua bộ tối ưu (vốn chỉ nhận domain khai trong next.config).
        <Image src={coverUrl} alt="" fill sizes={sizes} unoptimized className="object-cover" />
      ) : (
        <Image
          src={anhMacDinh(slug)}
          alt=""
          fill
          sizes={sizes}
          placeholder="blur"
          className="object-cover"
        />
      )}
    </div>
  );
}
