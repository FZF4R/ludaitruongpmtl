import type { StaticImageData } from "next/image";
import { heroImages } from "@/lib/hero-images";
import type { PracticeKey } from "@/lib/site";

/**
 * Ảnh của từng mục Tu tập (menu thả xuống ở header, thẻ ở trang /tu-tap, ảnh
 * đầu trang chi tiết). Admin đổi ở /admin/dashboard ("Ảnh các mục tu tập"),
 * lưu ở SystemSettings.practiceImages; chưa đặt thì dùng ảnh có sẵn dưới đây.
 */
const MAC_DINH: Record<PracticeKey, StaticImageData> = {
  chantingRecitation: heroImages[2],
  meditation: heroImages[0],
  woodenFishMala: heroImages[4],
  prayers: heroImages[1],
};

export type AnhTuTap = Partial<Record<PracticeKey, string>>;

/** Ảnh admin đặt (URL) hoặc ảnh mặc định (ảnh tĩnh qua bộ tối ưu của Next). */
export function anhMucTuTap(key: PracticeKey, daDat?: AnhTuTap | null): string | StaticImageData {
  const u = daDat?.[key];
  return u && /^https?:\/\//i.test(u) ? u : MAC_DINH[key];
}

export const anhMacDinhTuTap = MAC_DINH;
