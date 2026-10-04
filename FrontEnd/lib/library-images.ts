import type { StaticImageData } from "next/image";
import { heroImages } from "@/lib/hero-images";
import type { LibraryKind } from "@/lib/schema";

/**
 * Ảnh đại diện từng danh mục Thư viện (thẻ danh mục ở /thu-vien). Admin đổi
 * ngay trên trang ở Chế độ sửa, lưu ở SystemSettings.libraryImages; chưa đặt
 * thì dùng ảnh có sẵn dưới đây.
 */
const MAC_DINH: Record<LibraryKind, StaticImageData> = {
  anh: heroImages[3],
  review: heroImages[5],
  "bo-tat": heroImages[1],
  "nhac-thien": heroImages[0],
  "audio-kinh": heroImages[2],
};

export type AnhThuVien = Partial<Record<LibraryKind, string>>;

export function anhDanhMucThuVien(kind: LibraryKind, daDat?: AnhThuVien | null): string | StaticImageData {
  const u = daDat?.[kind];
  return u && /^https?:\/\//i.test(u) ? u : MAC_DINH[kind];
}
