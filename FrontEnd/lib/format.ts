import { canChiYear, solarToLunar, lunarMonthLabel } from "@/lib/lunar";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

const longDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return Number.isNaN(d.getTime()) ? "" : dateFormatter.format(d);
}

export function formatLongDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return Number.isNaN(d.getTime()) ? "" : longDateFormatter.format(d);
}

/** "12/08/2026 · 20 tháng Sáu năm Bính Ngọ" */
export function formatDualDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const lunar = solarToLunar(d.getUTCDate(), d.getUTCMonth() + 1, d.getUTCFullYear());
  return `${dateFormatter.format(d)} · ${lunar.day} tháng ${lunarMonthLabel(
    lunar.month,
  )}${lunar.isLeapMonth ? " nhuận" : ""} năm ${canChiYear(lunar.year)}`;
}

export function formatNumber(n: number): string {
  return numberFormatter.format(n);
}

/** 2880 -> "48 phút", 5400 -> "1 giờ 30 phút" */
export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "";
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} phút`;
  if (minutes === 0) return `${hours} giờ`;
  return `${hours} giờ ${minutes} phút`;
}

/** 125 -> "02:05" — dùng cho đồng hồ của trình phát. */
export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function readingTime(minutes?: number): string {
  return minutes ? `${minutes} phút đọc` : "";
}
