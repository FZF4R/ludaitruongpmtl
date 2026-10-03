/**
 * Đổi sự kiện âm lịch (LunarEvent) ra các ngày dương cụ thể trong một khoảng.
 *
 * Sự kiện lưu theo ngày âm và đa số lặp lại hằng năm (solarYear = null), nên
 * mỗi năm âm lịch rơi vào một ngày dương khác. Ta thử mọi năm âm có thể chạm
 * khoảng cần xem rồi lọc theo ngày dương.
 *
 * Thêm Mùng Một và Rằm của mỗi tháng âm (`tuDong: true`) - hai ngày sám hối,
 * ăn chay mà Phật tử theo dõi hằng tháng - trừ khi hôm đó đã có sự kiện thật.
 */
import { lunarToSolar, solarToLunar } from "@/lib/lunar";
import type { LunarEvent } from "@/lib/schema";

export type SuKienNgay = {
  /** Khoá ổn định cho React. */
  key: string;
  title: string;
  kind: LunarEvent["kind"];
  /** Ngày dương "YYYY-MM-DD". */
  ngay: string;
  lunarDay: number;
  lunarMonth: number;
  contentSlug?: string;
  /** Mùng Một / Rằm sinh tự động, không phải sự kiện admin nhập. */
  tuDong?: boolean;
};

const MOT_NGAY = 86_400_000;

/** Ngày dương (UTC 0h) -> "YYYY-MM-DD". */
export const sangChuoiNgay = (d: Date) => d.toISOString().slice(0, 10);

/** Hôm nay theo giờ Việt Nam, dạng Date ở UTC 0h - cùng hệ với lunarToSolar. */
export function homNayVN(now = new Date()): Date {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);

  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Ngày âm -> ngày dương, có kiểm tra ngược. Tháng âm thiếu chỉ có 29 ngày:
 * "ngày 30" (vía Địa Tạng 30/7, Dược Sư 30/9…) khi đó sẽ trượt sang mùng 1
 * tháng sau - theo lệ thường thì làm vào ngày 29, nên lùi về 29.
 */
function ngayDuong(ngay: number, thang: number, nam: number, nhuan: boolean): Date {
  const d = lunarToSolar(ngay, thang, nam, nhuan);
  if (isNaN(d.getTime())) return d;
  const nguoc = solarToLunar(d.getUTCDate(), d.getUTCMonth() + 1, d.getUTCFullYear());
  if (nguoc.day === ngay && nguoc.month === thang) return d;

  return ngay === 30 ? lunarToSolar(29, thang, nam, nhuan) : new Date(NaN);
}

/**
 * Mọi lần diễn ra trong [tu, den] (cả hai đầu, Date ở UTC 0h), sắp theo ngày.
 * `nhanTuDong` đặt tên cho Mùng Một / Rằm theo ngôn ngữ đang xem.
 */
export function suKienTrongKhoang(
  suKien: LunarEvent[],
  tu: Date,
  den: Date,
  nhanTuDong: { mungMot: (thang: number) => string; ram: (thang: number) => string } | null,
): SuKienNgay[] {
  const kq: SuKienNgay[] = [];
  const trong = (d: Date) => !isNaN(d.getTime()) && d >= tu && d <= den;
  // Năm âm của hai đầu khoảng, nới thêm một năm mỗi bên cho chắc (tháng Chạp
  // âm có thể rơi sang tháng 1-2 dương năm sau).
  const namTu = solarToLunar(tu.getUTCDate(), tu.getUTCMonth() + 1, tu.getUTCFullYear()).year - 1;
  const namDen = solarToLunar(den.getUTCDate(), den.getUTCMonth() + 1, den.getUTCFullYear()).year + 1;

  for (let nam = namTu; nam <= namDen; nam++) {
    for (const sk of suKien) {
      const d = ngayDuong(sk.lunarDay, sk.lunarMonth, nam, sk.isLeapMonth);
      if (!trong(d)) continue;
      if (sk.solarYear !== null && d.getUTCFullYear() !== sk.solarYear) continue;
      kq.push({
        key: `${sk.id}-${nam}`,
        title: sk.title,
        kind: sk.kind,
        ngay: sangChuoiNgay(d),
        lunarDay: sk.lunarDay,
        lunarMonth: sk.lunarMonth,
        ...(sk.contentSlug ? { contentSlug: sk.contentSlug } : {}),
      });
    }

    if (!nhanTuDong) continue;
    for (let thang = 1; thang <= 12; thang++) {
      for (const ngayAm of [1, 15]) {
        const d = ngayDuong(ngayAm, thang, nam, false);
        if (!trong(d)) continue;
        const chuoi = sangChuoiNgay(d);
        if (kq.some((x) => x.ngay === chuoi)) continue;
        kq.push({
          key: `auto-${nam}-${thang}-${ngayAm}`,
          title: ngayAm === 1 ? nhanTuDong.mungMot(thang) : nhanTuDong.ram(thang),
          kind: "le",
          ngay: chuoi,
          lunarDay: ngayAm,
          lunarMonth: thang,
          tuDong: true,
        });
      }
    }
  }

  // Sự kiện thật thắng Mùng Một / Rằm tự sinh nếu trùng ngày (có thể do thứ tự duyệt năm).
  const daCo = new Set(kq.filter((x) => !x.tuDong).map((x) => x.ngay));
  return kq
    .filter((x) => !x.tuDong || !daCo.has(x.ngay))
    .sort((a, b) => a.ngay.localeCompare(b.ngay) || (a.tuDong ? 1 : 0) - (b.tuDong ? 1 : 0));
}

/* ------------------------------------------------------------------ */
/* Lịch tháng có ngày Trai (trang chủ)                                 */
/* ------------------------------------------------------------------ */

export type ONgay = {
  /** "YYYY-MM-DD" dương lịch. */
  iso: string;
  ngay: number;
  /** Ngày âm và tháng âm. */
  am: number;
  thangAm: number;
  thuocThang: boolean;
  /** Ngày Trai (thập trai). */
  trai: boolean;
  suKien: { title: string; kind: LunarEvent["kind"]; contentSlug?: string }[];
};

export type ThangLich = { nam: number; thang: number; o: ONgay[] };

/** Thập trai: 10 ngày chay mỗi tháng âm. Tháng thiếu (29 ngày) thì 28-29-30 thành 27-28-29. */
const THAP_TRAI_DU = [1, 8, 14, 15, 18, 23, 24, 28, 29, 30];
const THAP_TRAI_THIEU = [1, 8, 14, 15, 18, 23, 24, 27, 28, 29];

const doDaiThang = new Map<string, number>();
/** Tháng âm có 30 ngày không: đổi ngày 30 sang dương rồi đổi ngược, còn là ngày 30 thì có. */
function thangAmDu(namAm: number, thangAm: number, nhuan: boolean): boolean {
  const khoa = `${namAm}-${thangAm}-${nhuan ? 1 : 0}`;
  if (!doDaiThang.has(khoa)) {
    const d = lunarToSolar(30, thangAm, namAm, nhuan);
    const nguoc = isNaN(d.getTime())
      ? null
      : solarToLunar(d.getUTCDate(), d.getUTCMonth() + 1, d.getUTCFullYear());
    doDaiThang.set(khoa, nguoc?.day === 30 ? 30 : 29);
  }
  return doDaiThang.get(khoa) === 30;
}

/**
 * Lưới 6×7 của một tháng dương (tuần bắt đầu thứ Hai), mỗi ô kèm ngày âm,
 * cờ ngày Trai và sự kiện. Sự kiện lấy qua suKienTrongKhoang nên cũng được
 * lùi ngày 30 về 29 ở tháng thiếu như danh sách bên cạnh.
 */
export function dungThangLich(nam: number, thang: number, suKien: LunarEvent[]): ThangLich {
  const dauThang = new Date(Date.UTC(nam, thang - 1, 1));
  const lui = (dauThang.getUTCDay() + 6) % 7;
  const batDau = new Date(Date.UTC(nam, thang - 1, 1 - lui));
  const ketThuc = new Date(batDau.getTime() + 41 * MOT_NGAY);

  const theoNgay = new Map<string, ONgay["suKien"]>();
  for (const sk of suKienTrongKhoang(suKien, batDau, ketThuc, null)) {
    const ds = theoNgay.get(sk.ngay) ?? [];
    ds.push({ title: sk.title, kind: sk.kind, ...(sk.contentSlug ? { contentSlug: sk.contentSlug } : {}) });
    theoNgay.set(sk.ngay, ds);
  }

  const o: ONgay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(batDau.getTime() + i * MOT_NGAY);
    const am = solarToLunar(d.getUTCDate(), d.getUTCMonth() + 1, d.getUTCFullYear());
    const iso = sangChuoiNgay(d);
    const traiThang = thangAmDu(am.year, am.month, am.isLeapMonth) ? THAP_TRAI_DU : THAP_TRAI_THIEU;
    o.push({
      iso,
      ngay: d.getUTCDate(),
      am: am.day,
      thangAm: am.month,
      thuocThang: d.getUTCMonth() === thang - 1,
      trai: traiThang.includes(am.day),
      suKien: theoNgay.get(iso) ?? [],
    });
  }

  return { nam, thang, o };
}

/** `soThang` tháng liên tiếp tính từ tháng chứa `homNay`. */
export function cacThangToi(homNay: Date, soThang: number, suKien: LunarEvent[]): ThangLich[] {
  const kq: ThangLich[] = [];
  for (let i = 0; i < soThang; i++) {
    const d = new Date(Date.UTC(homNay.getUTCFullYear(), homNay.getUTCMonth() + i, 1));
    kq.push(dungThangLich(d.getUTCFullYear(), d.getUTCMonth() + 1, suKien));
  }
  return kq;
}

/** Ba khoảng cho mục Lịch Phật giáo ở trang chủ. */
export function baKhoang(homNay: Date) {
  const y = homNay.getUTCFullYear();
  const m = homNay.getUTCMonth();
  const cong3Thang = new Date(Date.UTC(y, m + 3, homNay.getUTCDate()));

  return {
    thangNay: { tu: new Date(Date.UTC(y, m, 1)), den: new Date(Date.UTC(y, m + 1, 0)) },
    baThangToi: { tu: homNay, den: new Date(cong3Thang.getTime() - MOT_NGAY) },
    namNay: { tu: new Date(Date.UTC(y, 0, 1)), den: new Date(Date.UTC(y, 11, 31)) },
  };
}
