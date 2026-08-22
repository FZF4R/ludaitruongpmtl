/**
 * Lịch âm Việt Nam — thuật toán Hồ Ngọc Đức.
 *
 * QUAN TRỌNG: lịch âm Việt Nam KHÁC lịch âm Trung Quốc. Điểm sóc và
 * trung khí tính theo múi giờ UTC+7 thay vì +8, nên mỗi năm có vài
 * ngày hai lịch lệch nhau đúng một ngày. Đừng thay bằng thư viện lịch
 * âm Trung Quốc — Phật tử sẽ phát hiện ngay ở ngày rằm.
 */

export const VN_TIMEZONE = 7;

/** Số ngày Julian từ ngày dương lịch. */
function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd =
    dd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

/** Ngược lại: từ số ngày Julian ra [ngày, tháng, năm] dương lịch. */
function jdToDate(jd: number): [number, number, number] {
  let a: number, b: number, c: number;
  if (jd > 2299160) {
    a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = b * 100 + d - 4800 + Math.floor(m / 10);
  return [day, month, year];
}

/** Thời điểm sóc thứ k tính từ 1/1/1900, theo ngày Julian. */
function newMoon(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;

  let C1 =
    (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));

  const deltat =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;

  return Jd1 + C1 - deltat;
}

/** Kinh độ mặt trời, chia thành 12 cung 30 độ. */
function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return L;
}

function getSunLongitude(dayNumber: number, tz: number): number {
  return Math.floor((sunLongitude(dayNumber - 0.5 - tz / 24) / Math.PI) * 6);
}

function getNewMoonDay(k: number, tz: number): number {
  return Math.floor(newMoon(k) + 0.5 + tz / 24);
}

/** Ngày bắt đầu tháng 11 âm lịch của năm dương lịch yy. */
function getLunarMonth11(yy: number, tz: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, tz);
  if (getSunLongitude(nm, tz) >= 9) {
    nm = getNewMoonDay(k - 1, tz);
  }
  return nm;
}

/** Xác định tháng nhuận trong năm âm lịch bắt đầu từ a11. */
function getLeapMonthOffset(a11: number, tz: number): number {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last: number;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
  do {
    last = arc;
    i += 1;
    arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
  } while (arc !== last && i < 14);
  return i - 1;
}

export type LunarDate = {
  day: number;
  month: number;
  year: number;
  isLeapMonth: boolean;
};

export function solarToLunar(
  dd: number,
  mm: number,
  yy: number,
  tz: number = VN_TIMEZONE,
): LunarDate {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, tz);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, tz);
  }

  let a11 = getLunarMonth11(yy, tz);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, tz);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, tz);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let isLeapMonth = false;
  let lunarMonth = diff + 11;

  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, tz);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) isLeapMonth = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;

  return { day: lunarDay, month: lunarMonth, year: lunarYear, isLeapMonth };
}

export function lunarToSolar(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  isLeapMonth: boolean,
  tz: number = VN_TIMEZONE,
): Date {
  let a11: number;
  let b11: number;
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1, tz);
    b11 = getLunarMonth11(lunarYear, tz);
  } else {
    a11 = getLunarMonth11(lunarYear, tz);
    b11 = getLunarMonth11(lunarYear + 1, tz);
  }

  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lunarMonth - 11;
  if (off < 0) off += 12;

  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, tz);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (isLeapMonth && lunarMonth !== leapMonth) {
      // Tháng yêu cầu không phải tháng nhuận của năm đó.
      return new Date(NaN);
    }
    if (isLeapMonth || off >= leapOff) off += 1;
  }

  const monthStart = getNewMoonDay(k + off, tz);
  const [d, m, y] = jdToDate(monthStart + lunarDay - 1);
  return new Date(Date.UTC(y, m - 1, d));
}

/* ------------------------------------------------------------------ */
/* Can chi                                                             */
/* ------------------------------------------------------------------ */

const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const CHI = [
  "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ",
  "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi",
];

export function canChiYear(lunarYear: number): string {
  return `${CAN[(lunarYear + 6) % 10]} ${CHI[(lunarYear + 8) % 12]}`;
}

export function canChiDay(dd: number, mm: number, yy: number): string {
  const jd = jdFromDate(dd, mm, yy);
  return `${CAN[(jd + 9) % 10]} ${CHI[(jd + 1) % 12]}`;
}

/* ------------------------------------------------------------------ */
/* Phật lịch                                                           */
/* ------------------------------------------------------------------ */

/**
 * Năm Phật lịch = năm dương lịch + 544.
 *
 * Theo truyền thống Nam tông, năm Phật lịch chuyển sang năm mới sau
 * đại lễ Phật Đản (rằm tháng Tư âm lịch) chứ không phải mùng một tháng
 * Giêng. Hàm này áp dụng đúng quy ước đó.
 */
export function buddhistYear(date: Date): number {
  const y = date.getUTCFullYear();
  const vesak = vesakOfSolarYear(y);
  return date >= vesak ? y + 544 : y + 543;
}

/** Ngày dương lịch của rằm tháng Tư âm lịch rơi vào năm dương lịch yy. */
export function vesakOfSolarYear(yy: number): Date {
  // Rằm tháng Tư âm của năm âm lịch yy luôn rơi vào tháng 4-6 dương lịch yy.
  return lunarToSolar(15, 4, yy, false);
}

/* ------------------------------------------------------------------ */
/* Dựng lưới tháng                                                     */
/* ------------------------------------------------------------------ */

export type CalendarCell = {
  /** Ngày dương lịch, dạng ISO yyyy-mm-dd theo giờ VN. */
  iso: string;
  solarDay: number;
  solarMonth: number;
  lunar: LunarDate;
  /** Ô thuộc tháng đang xem hay là ngày đệm của tháng liền kề. */
  isCurrentMonth: boolean;
  isFullMoon: boolean;
  isNewMoon: boolean;
};

function isoOf(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Lưới 6 hàng × 7 cột cho một tháng dương lịch, mỗi ô kèm ngày âm.
 * Tuần bắt đầu từ thứ Hai theo thói quen Việt Nam.
 */
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  // getUTCDay: 0 = Chủ nhật. Đổi sang 0 = thứ Hai.
  const leading = (first.getUTCDay() + 6) % 7;
  const start = new Date(Date.UTC(year, month - 1, 1 - leading));

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const dd = d.getUTCDate();
    const mm = d.getUTCMonth() + 1;
    const yy = d.getUTCFullYear();
    const lunar = solarToLunar(dd, mm, yy);
    cells.push({
      iso: isoOf(yy, mm, dd),
      solarDay: dd,
      solarMonth: mm,
      lunar,
      isCurrentMonth: mm === month && yy === year,
      isFullMoon: lunar.day === 15,
      isNewMoon: lunar.day === 1,
    });
  }
  return cells;
}

export const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export const LUNAR_MONTH_LABELS = [
  "Giêng", "Hai", "Ba", "Tư", "Năm", "Sáu",
  "Bảy", "Tám", "Chín", "Mười", "Mười một", "Chạp",
];

export function lunarMonthLabel(month: number): string {
  return LUNAR_MONTH_LABELS[month - 1] ?? String(month);
}
