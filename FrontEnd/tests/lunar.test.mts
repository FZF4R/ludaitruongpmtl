/**
 * Kiểm thử thuật toán lịch âm Hồ Ngọc Đức.
 *
 * Chạy: npm test
 *
 * Lịch âm là thứ Phật tử soi kỹ nhất trên site này — sai một ngày rằm
 * là mất tin cậy. Bốn phép kiểm dưới đây bắt được gần hết lỗi thường gặp
 * khi cài lại thuật toán hoặc đổi múi giờ.
 */
import {
  solarToLunar,
  lunarToSolar,
  canChiYear,
  buddhistYear,
  vesakOfSolarYear,
} from "../lib/lunar";

let failures = 0;

function check(condition: boolean, message: string): void {
  if (!condition) {
    console.log("  FAIL:", message);
    failures += 1;
  }
}

// 1. Mốc đã biết: Tết Bính Ngọ rơi vào 17/02/2026 dương lịch.
const tet = solarToLunar(17, 2, 2026);
console.log("17/02/2026 ->", tet, canChiYear(tet.year));
check(tet.day === 1 && tet.month === 1, "17/02/2026 phải là mùng 1 tháng Giêng");
check(canChiYear(tet.year) === "Bính Ngọ", "năm âm lịch 2026 phải là Bính Ngọ");

// 2. Chuyển xuôi rồi ngược phải ra đúng ngày ban đầu.
let checked = 0;
for (let y = 2024; y <= 2027; y += 1) {
  for (let m = 1; m <= 12; m += 1) {
    for (let d = 1; d <= 28; d += 1) {
      const lunar = solarToLunar(d, m, y);
      const back = lunarToSolar(lunar.day, lunar.month, lunar.year, lunar.isLeapMonth);
      const same =
        back.getUTCFullYear() === y &&
        back.getUTCMonth() + 1 === m &&
        back.getUTCDate() === d;
      check(same, `round-trip ${d}/${m}/${y} -> ${JSON.stringify(lunar)}`);
      checked += 1;
    }
  }
}
console.log(`round-trip: ${checked} ngày`);

// 3. Tháng âm chỉ có thể dài 29 hoặc 30 ngày.
let previousNewMoon: number | null = null;
for (let i = 0; i < 400; i += 1) {
  const date = new Date(Date.UTC(2026, 0, 1 + i));
  const lunar = solarToLunar(
    date.getUTCDate(),
    date.getUTCMonth() + 1,
    date.getUTCFullYear(),
  );
  if (lunar.day !== 1) continue;

  if (previousNewMoon !== null) {
    const gap = Math.round((date.getTime() - previousNewMoon) / 86_400_000);
    check(gap === 29 || gap === 30, `độ dài tháng âm bất thường: ${gap} ngày`);
  }
  previousNewMoon = date.getTime();
}

// 4. Năm Phật lịch chuyển sau đại lễ Phật Đản, không phải mùng một tháng Giêng.
console.log("Phật Đản 2026:", vesakOfSolarYear(2026).toISOString().slice(0, 10));
check(
  buddhistYear(new Date(Date.UTC(2026, 7, 21))) === 2570,
  "21/08/2026 (sau Phật Đản) phải là PL 2570",
);
check(
  buddhistYear(new Date(Date.UTC(2026, 0, 5))) === 2569,
  "05/01/2026 (trước Phật Đản) phải là PL 2569",
);

console.log(failures === 0 ? "\nTẤT CẢ PASS" : `\n${failures} LỖI`);
process.exit(failures === 0 ? 0 : 1);
