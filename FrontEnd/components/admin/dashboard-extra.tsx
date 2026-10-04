"use client";

import * as React from "react";
import { Megaphone, Send } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { chuLoi, useLocale, useQuyen } from "@/components/admin/admin-shell";
import { MonthCalendar, type NhanLichThang } from "@/components/home/month-calendar";
import { cacThangToi, homNayVN, sangChuoiNgay } from "@/lib/buddhist-events";
import { guiThongBaoChung, layThongBaoChung, type ThongBaoChung } from "@/lib/admin-api";

/**
 * Hai khối thêm cho trang Tổng quan:
 *   - Gửi thông báo tới toàn bộ người dùng (quyền notify.manage);
 *   - Sự kiện trên lịch: lịch tháng, bấm một ngày để thêm sự kiện (calendar.manage).
 * Mỗi khối tự ẩn khi người xem không có quyền tương ứng.
 */

const TIEU_DE_TOI_DA = 120;
const NOI_DUNG_TOI_DA = 1000;

export function KhoiThongBaoChung() {
  const locale = useLocale();
  const quyen = useQuyen();
  const [ds, setDs] = React.useState<ThongBaoChung[]>([]);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [link, setLink] = React.useState("");
  const [dang, setDang] = React.useState(false);
  const [bao, setBao] = React.useState("");
  const duoc = quyen.includes("notify.manage");

  React.useEffect(() => {
    if (!duoc) return;
    layThongBaoChung(locale)
      .then(setDs)
      .catch(() => setDs([]));
  }, [duoc, locale]);

  if (!duoc) return null;

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setBao("Nhập tiêu đề thông báo.");
    if (!window.confirm(`Gửi thông báo “${title.trim()}” tới TOÀN BỘ người dùng?\n\nThông báo đã gửi không thu hồi được.`)) return;
    setDang(true);
    setBao("");
    try {
      const moi = await guiThongBaoChung({ title: title.trim(), body: body.trim(), link: link.trim() }, locale);
      setDs((cu) => [moi, ...cu]);
      setTitle("");
      setBody("");
      setLink("");
      setBao(`Đã gửi tới ${moi.recipients.toLocaleString("vi-VN")} tài khoản.`);
    } catch (err) {
      setBao(chuLoi(err));
    } finally {
      setDang(false);
    }
  }

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 font-serif text-xl font-bold">
          <Megaphone className="size-5 text-brass" aria-hidden /> Gửi thông báo tới toàn bộ người dùng
        </h2>
        <p className="text-sm text-muted">
          Thông báo hiện ở chuông của mọi tài khoản đang hoạt động (không gửi tới tài khoản bị khoá). Gửi rồi không thu hồi
          được.
        </p>
      </div>
      <form onSubmit={gui} className="flex flex-col gap-4">
        <Field id="bc-title" label="Tiêu đề" required hint={`${title.length}/${TIEU_DE_TOI_DA}`}>
          {(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TIEU_DE_TOI_DA} />}
        </Field>
        <Field id="bc-body" label="Nội dung" hint={`${body.length}/${NOI_DUNG_TOI_DA}`}>
          {(p) => (
            <textarea
              id={p.id}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={NOI_DUNG_TOI_DA}
              rows={4}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          )}
        </Field>
        <Field id="bc-link" label="Đường dẫn khi bấm" hint="Tuỳ chọn — vd. /phat-lich hoặc https://…">
          {(p) => <Input {...p} value={link} onChange={(e) => setLink(e.target.value)} maxLength={300} />}
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={dang || !title.trim()}>
            <Send aria-hidden /> {dang ? "Đang gửi…" : "Gửi tới mọi người"}
          </Button>
          {bao ? <span className="text-sm text-muted">{bao}</span> : null}
        </div>
      </form>

      {ds.length ? (
        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <h3 className="text-sm font-semibold text-ink">Đã gửi gần đây</h3>
          <ul className="flex flex-col divide-y divide-line text-sm">
            {ds.map((b) => (
              <li key={b.id} className="flex flex-col gap-0.5 py-2">
                <span className="font-medium text-ink">{b.title}</span>
                {b.body ? <span className="line-clamp-2 text-xs text-body">{b.body}</span> : null}
                <span className="text-xs text-muted">
                  {new Date(b.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })} ·{" "}
                  {b.recipients.toLocaleString("vi-VN")} người nhận · {b.createdByName || "—"}
                  {b.link ? ` · ${b.link}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}

const NHAN_LICH: NhanLichThang = {
  weekdays: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
  monthTitle: "Tháng {m}/{y}",
  prevMonth: "Tháng trước",
  nextMonth: "Tháng sau",
  traiLegend: "Ngày Trai",
  eventLegend: "Ngày vía / lễ",
  traiDay: "Ngày Trai (thập trai)",
  noEventDay: "Chưa có sự kiện nào.",
  lunarFull: "Âm lịch {d}/{m}",
  todayLabel: "Hôm nay",
  eventKind: { via: "Ngày vía", le: "Ngày lễ", "gio-to": "Giỗ tổ", "bat-quan-trai": "Bát quan trai" },
  dayEventLegend: "Sự kiện đã thêm",
  dayEventMore: "Bấm vào ngày để xem / sửa",
};

/** Lịch 12 tháng tới để thêm sự kiện: bấm một ngày, dùng nút "Thêm sự kiện cho ngày này" ở khung dưới lưới. */
export function KhoiSuKienLich() {
  const quyen = useQuyen();
  // Tính ở trình duyệt sau khi gắn (tránh lệch giờ server / client khi render).
  const [lich, setLich] = React.useState<{ thang: ReturnType<typeof cacThangToi>; homNay: string } | null>(null);
  React.useEffect(() => {
    const homNay = homNayVN();
    setLich({ thang: cacThangToi(homNay, 12, []), homNay: sangChuoiNgay(homNay) });
  }, []);

  if (!quyen.includes("calendar.manage")) return null;

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-xl font-bold">Sự kiện trên lịch</h2>
        <p className="text-sm text-muted">
          Bấm vào một ngày rồi chọn “Thêm sự kiện cho ngày này”: tiêu đề (tối đa 80 ký tự), ảnh, nội dung chính. Sự kiện hiện
          ở lịch trang chủ: chấm đỏ trên ô ngày, rê chuột hiện tooltip, bấm vào ngày hiện đầy đủ. Bạn cũng có thể thêm / sửa
          ngay trên lịch trang chủ khi đã đăng nhập.
        </p>
      </div>
      {lich ? <MonthCalendar thang={lich.thang} homNay={lich.homNay} nhan={NHAN_LICH} className="max-w-xl" /> : null}
    </Card>
  );
}
