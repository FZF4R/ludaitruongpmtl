"use client";

import * as React from "react";
import { Megaphone, Send } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { chuLoi, useLocale, useQuyen } from "@/components/admin/admin-shell";
import { FormSuKienNgay, MonthCalendar, SuKienNgayChiTiet, type NhanLichThang } from "@/components/home/month-calendar";
import { cacThangToi, homNayVN, sangChuoiNgay } from "@/lib/buddhist-events";
import { laySuKienNgay, type SuKienNgayDuong } from "@/lib/day-events";
import { anhMacDinhTuTap } from "@/lib/practice-images";
import { taiTep } from "@/lib/my-content";
import type { PracticeKey } from "@/lib/site";
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

/**
 * Lịch 12 tháng tới để thêm sự kiện: lịch tháng bên trái, khung nhập bên phải
 * cho ngày đang chọn (các sự kiện đã có của ngày đó + form thêm mới).
 */
export function KhoiSuKienLich() {
  const quyen = useQuyen();
  const locale = useLocale();
  // Tính ở trình duyệt sau khi gắn (tránh lệch giờ server / client khi render).
  const [lich, setLich] = React.useState<{ thang: ReturnType<typeof cacThangToi>; homNay: string } | null>(null);
  const [chon, setChon] = React.useState("");
  const [ds, setDs] = React.useState<SuKienNgayDuong[]>([]);
  // Đổi key sau mỗi lần thêm để form trống lại.
  const [lanThem, setLanThem] = React.useState(0);
  const duoc = quyen.includes("calendar.manage");

  React.useEffect(() => {
    const homNay = homNayVN();
    const thang = cacThangToi(homNay, 12, []);
    setLich({ thang, homNay: sangChuoiNgay(homNay) });
    setChon(sangChuoiNgay(homNay));
  }, []);

  React.useEffect(() => {
    if (!duoc || !lich) return;
    const tu = lich.thang[0]?.o[0]?.iso;
    const den = lich.thang.at(-1)?.o.at(-1)?.iso;
    if (!tu || !den) return;
    laySuKienNgay(tu, den, locale)
      .then(setDs)
      .catch(() => setDs([]));
  }, [duoc, lich, locale]);

  if (!duoc) return null;

  const cuaNgay = ds.filter((e) => e.date === chon);
  const ngayHien = chon ? chon.split("-").reverse().join("/") : "";

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-xl font-bold">Sự kiện trên lịch</h2>
        <p className="text-sm text-muted">
          Bấm vào một ngày trên lịch rồi nhập ở khung bên phải: tiêu đề (tối đa 80 ký tự), ảnh, nội dung chính. Sự kiện hiện
          ở lịch trang chủ: chấm đỏ trên ô ngày, rê chuột hiện tooltip, bấm vào ngày hiện đầy đủ. Bạn cũng có thể thêm / sửa
          ngay trên lịch trang chủ khi đã đăng nhập.
        </p>
      </div>
      {lich ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <MonthCalendar
            thang={lich.thang}
            homNay={lich.homNay}
            nhan={NHAN_LICH}
            chonNgay={chon}
            onChonNgay={setChon}
            suKien={ds}
            quanTriTaiCho={false}
          />

          {/*
            Khung nhập: bên phải lịch trên màn hình rộng, xuống dưới lịch trên điện thoại.
            Lịch quyết định chiều cao hàng; khung này nằm tuyệt đối trong ô của nó
            (lg:absolute inset-0) nên cao đúng bằng lịch, dài hơn thì cuộn.
          */}
          <div className="relative">
          <div className="flex flex-col gap-3 rounded-lg border border-line p-4 lg:absolute lg:inset-0 lg:overflow-y-auto lg:[scrollbar-width:thin]">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-serif text-lg font-bold text-ink">Ngày {ngayHien}</h3>
              <span className="text-xs text-muted">{cuaNgay.length}/10 sự kiện</span>
            </div>
            {cuaNgay.length ? (
              <div className="flex flex-col gap-2">
                {cuaNgay.map((e) => (
                  <SuKienNgayChiTiet
                    key={e.id}
                    e={e}
                    quanTri
                    locale={locale}
                    onDoi={(moi) => setDs((cu) => cu.map((x) => (x.id === moi.id ? moi : x)))}
                    onXoa={() => setDs((cu) => cu.filter((x) => x.id !== e.id))}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Ngày này chưa có sự kiện nào.</p>
            )}
            {chon && cuaNgay.length < 10 ? (
              <FormSuKienNgay
                key={`${chon}-${lanThem}`}
                date={chon}
                locale={locale}
                onXong={(moi) => {
                  setDs((cu) => [...cu, moi]);
                  setLanThem((n) => n + 1);
                }}
              />
            ) : null}
          </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

const MUC_TU_TAP: { key: PracticeKey; ten: string }[] = [
  { key: "chantingRecitation", ten: "Tụng kinh / Niệm Phật" },
  { key: "meditation", ten: "Thiền định" },
  { key: "woodenFishMala", ten: "Gõ mõ / Tràng hạt" },
  { key: "prayers", ten: "Cầu an / Cầu siêu" },
];

/**
 * Ảnh riêng từng mục Tu tập: hiện ở menu thả xuống "Tu tập" trên header, thẻ ở
 * trang /tu-tap và đầu trang chi tiết. Để trống = dùng ảnh có sẵn.
 */
export function KhoiAnhTuTap({
  giaTri,
  dangLuu,
  daLuu,
  onLuu,
}: {
  giaTri: Record<string, string>;
  dangLuu: boolean;
  daLuu: boolean;
  onLuu: (anh: Record<string, string>) => Promise<boolean>;
}) {
  const locale = useLocale();
  const [anh, setAnh] = React.useState<Record<string, string>>(giaTri);
  const [dangTai, setDangTai] = React.useState<string | null>(null);
  const [loi, setLoi] = React.useState("");
  const daDoi = JSON.stringify(anh) !== JSON.stringify(giaTri);

  async function taiLen(key: string, f: File | undefined) {
    if (!f) return;
    setDangTai(key);
    setLoi("");
    try {
      const kq = await taiTep(f, locale);
      setAnh((cu) => ({ ...cu, [key]: kq.url }));
    } catch (err) {
      setLoi(chuLoi(err, "Không tải được ảnh lên."));
    } finally {
      setDangTai(null);
    }
  }

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-xl font-bold">Ảnh các mục tu tập</h2>
        <p className="text-sm text-muted">
          Mỗi mục một ảnh riêng, hiện ở menu thả xuống “Tu tập” trên đầu trang, thẻ ở trang Tu tập và đầu trang chi tiết
          của mục. Để trống thì dùng ảnh có sẵn. Nên dùng ảnh ngang (tỉ lệ khoảng 16:9 hoặc rộng hơn).
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {MUC_TU_TAP.map(({ key, ten }) => {
          const u = anh[key] ?? "";
          const xem = u || anhMacDinhTuTap[key].src;
          return (
            <li key={key} className="flex flex-col gap-2 rounded-md border border-line p-3">
              <span className="text-sm font-semibold text-ink">{ten}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={xem} alt="" className="aspect-[16/7] w-full rounded object-cover" />
              <span className="text-xs text-muted">{u ? "Ảnh đã đặt" : "Đang dùng ảnh có sẵn"}</span>
              <div className="flex gap-2">
                <Input
                  value={u}
                  onChange={(e) => setAnh((cu) => ({ ...cu, [key]: e.target.value }))}
                  placeholder="https://…"
                  aria-label={`Đường dẫn ảnh ${ten}`}
                  className="min-w-0 flex-1"
                />
                <label className="inline-flex cursor-pointer items-center rounded-md border border-line px-3 text-sm hover:bg-surface-2">
                  {dangTai === key ? "Đang tải…" : "Tải ảnh"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => taiLen(key, e.target.files?.[0])} />
                </label>
              </div>
              {u ? (
                <button
                  type="button"
                  onClick={() => setAnh((cu) => ({ ...cu, [key]: "" }))}
                  className="w-fit text-xs text-muted hover:text-lacquer"
                >
                  Dùng ảnh có sẵn
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
      {loi ? (
        <p role="alert" className="text-sm text-lacquer">
          {loi}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <Button
          disabled={dangLuu || !daDoi}
          onClick={() => onLuu(Object.fromEntries(Object.entries(anh).filter(([, v]) => v.trim())))}
        >
          {dangLuu ? "Đang lưu…" : "Lưu ảnh"}
        </Button>
        {daLuu ? <span className="text-sm text-accent">Đã lưu.</span> : null}
      </div>
    </Card>
  );
}
