"use client";

import * as React from "react";

/**
 * Tô ô "hôm nay" trên lưới lịch.
 *
 * Trang lịch được sinh tĩnh và cache 24 giờ, nên không thể tô sẵn ở
 * server — sang ngày hôm sau nó sẽ chỉ sai. Component này tìm ô có
 * data-date khớp ngày hiện tại theo giờ Việt Nam rồi gắn data-today,
 * CSS lo phần còn lại. Không render gì ra DOM.
 */
export function TodayMarker() {
  React.useEffect(() => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()); // en-CA cho ra đúng dạng yyyy-mm-dd

    const cell = document.querySelector<HTMLElement>(`[data-date="${today}"]`);
    if (!cell) return;

    cell.dataset.today = "1";
    cell.setAttribute("aria-current", "date");
    return () => {
      delete cell.dataset.today;
      cell.removeAttribute("aria-current");
    };
  }, []);

  return null;
}

/** Thẻ hiện ngày âm hôm nay, dùng ở trang chủ. */
export function TodayLunarBadge() {
  const [label, setLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Import động: thuật toán lịch chỉ tải khi thật sự cần ở client.
    void import("@/lib/lunar").then(({ solarToLunar, lunarMonthLabel, canChiYear }) => {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .format(new Date())
        .split("-")
        .map(Number);

      const lunar = solarToLunar(parts[2], parts[1], parts[0]);
      setLabel(
        `${lunar.day} tháng ${lunarMonthLabel(lunar.month)}${
          lunar.isLeapMonth ? " nhuận" : ""
        } năm ${canChiYear(lunar.year)}`,
      );
    });
  }, []);

  if (!label) return null;
  return <span className="tabular-nums">{label}</span>;
}
