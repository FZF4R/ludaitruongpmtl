import type { StaticImageData } from "next/image";

import anh1 from "@/lib/img/08f74aaa10832cef52ebc449db83de27.jpg";
import anh2 from "@/lib/img/61e3e61c806b542d54c2112750e127ff.jpg";
import anh3 from "@/lib/img/8109e9cbe366ef5d702f950908dbf9e1.jpg";
import anh4 from "@/lib/img/ad2a26006fc8e94c379f2f3a9a937432.jpg";
import anh5 from "@/lib/img/d556bd176c70d7bc17a0c78b7bf97c83.jpg";
import anh6 from "@/lib/img/f2e0a8061973b1d64dfd46a201a8995f.jpg";

/**
 * Bộ ảnh có sẵn: ảnh xoay vòng trang chủ khi admin chưa tải ảnh nào lên
 * (/admin/dashboard), và ảnh thumbnail mặc định cho bài không có ảnh bìa.
 *
 * Ảnh nằm trong lib/img chứ không phải public/, nên chúng KHÔNG được phục vụ
 * thẳng qua URL — phải import để Next đưa qua bộ tối ưu ảnh. Đổi lại được
 * next/image tự chuyển sang AVIF/WebP, tự sinh srcset và biết sẵn kích thước
 * nên trang không bị giật khi ảnh tải xong.
 *
 * THÊM ẢNH MỚI: thả tệp vào lib/img rồi thêm một dòng import ở trên và một
 * dòng vào mảng dưới. Không tự quét thư mục được vì bundler cần biết danh
 * sách lúc build.
 */
export const heroImages: StaticImageData[] = [
  anh1,
  anh2,
  anh3,
  anh4,
  anh5,
  anh6,
];
