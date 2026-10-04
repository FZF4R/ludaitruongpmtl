"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Pause, Play, Save, Timer, Trash2, Upload, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { useAmThanhNgan, useLuaChonNho } from "@/components/practice/use-sound";
import { AmNen, dien, useDsAmThanh, useLocaleHienTai, type NhanTuTap } from "@/components/practice/common";
import { LoiApi } from "@/lib/auth";
import { localePath } from "@/lib/i18n";
import {
  layBoCauHinh,
  layNhacRieng,
  luuBoCauHinh,
  taiNhacRieng,
  xoaBoCauHinh,
  xoaNhacRieng,
  type BoCauHinh,
  type NhacRieng,
} from "@/lib/practice";
import { cn } from "@/lib/utils";

const THOI_GIAN = [1, 3, 5, 10];

/** Cấu hình cầu nguyện lưu theo tài khoản (PracticePreset kind = cau-an). */
type CauHinhCauNguyen = { nguon: string; phut: number; amLuong: number };

const dongHo = (giay: number) => {
  const g = Math.max(0, Math.ceil(giay));
  return `${String(Math.floor(g / 60)).padStart(2, "0")}:${String(g % 60).padStart(2, "0")}`;
};

/**
 * Âm nền khi đọc / viết lời nguyện (trang Cầu an / Cầu siêu) - khung cột phải,
 * sát bên form viết lời nguyện (xem app/.../cau-an-cau-sieu/page.tsx).
 *
 * - Nguồn nhạc: âm nền có sẵn (admin quản lý, mục cau-an) hoặc NHẠC RIÊNG của
 *   tài khoản (tải lên máy chủ, tối đa 10 tệp).
 * - Hẹn giờ 1 / 3 / 5 / 10 phút: nhạc phát lặp; hết giờ thì dừng, ngân chuông,
 *   nhắc phát tâm cầu nguyện và cuộn tới ô viết lời nguyện.
 * - Lưu cấu hình (nguồn nhạc, thời gian, âm lượng) để lần sau chọn lại.
 * Giá trị nguồn: "s:<id>" âm nền có sẵn, "u:<id>" nhạc riêng, "" = không nhạc.
 */
export function PrayerSounds({ nhan }: { nhan: NhanTuTap }) {
  const n = nhan.prayerPrep;
  const locale = useLocaleHienTai();
  const { nguoiDungId, daBiet } = useCheDoSua();
  const { ds } = useDsAmThanh("cau-an");
  const am = useAmThanhNgan();
  const nenCoSan = ds.filter((a) => a.kind === "am-nen");
  const chuong = ds.find((a) => a.kind === "chuong") ?? null;

  const [nguon, setNguon] = useLuaChonNho("cau-an_nguon", "s:auto");
  const [phut, setPhut] = useLuaChonNho("cau-an_phut", 3);
  const [amLuong, setAmLuong] = useLuaChonNho("cau-an_am-luong", 0.5);

  // Nhạc riêng + cấu hình đã lưu (cần đăng nhập)
  const [nhacRieng, setNhacRieng] = React.useState<NhacRieng[]>([]);
  const [boCauHinh, setBoCauHinh] = React.useState<BoCauHinh[]>([]);
  React.useEffect(() => {
    if (!daBiet || !nguoiDungId) return;
    layNhacRieng(locale).then(setNhacRieng).catch(() => {});
    layBoCauHinh(locale, "cau-an").then(setBoCauHinh).catch(() => {});
  }, [daBiet, nguoiDungId, locale]);

  const src = React.useMemo(() => {
    if (nguon.startsWith("u:")) return nhacRieng.find((x) => `u:${x.id}` === nguon)?.url ?? null;
    if (nguon === "") return null;
    const id = nguon.slice(2);
    return (nenCoSan.find((a) => a.id === id) ?? nenCoSan[0])?.src ?? null;
  }, [nguon, nhacRieng, nenCoSan]);
  const giaTriChon = nguon.startsWith("s:") && !nenCoSan.some((a) => `s:${a.id}` === nguon) && nenCoSan[0] ? `s:${nenCoSan[0].id}` : nguon;

  // Hẹn giờ
  const [chay, setChay] = React.useState(false);
  const [con, setCon] = React.useState(0);
  const [xong, setXong] = React.useState(false);
  const ketThuc = React.useRef(0);

  function batDau() {
    ketThuc.current = Date.now() + phut * 60 * 1000;
    setCon(phut * 60);
    setXong(false);
    setChay(true);
  }
  function dung() {
    setChay(false);
    setCon(0);
  }
  React.useEffect(() => {
    if (!chay) return;
    const t = window.setInterval(() => {
      const c = (ketThuc.current - Date.now()) / 1000;
      if (c <= 0) {
        setChay(false);
        setCon(0);
        setXong(true);
        if (chuong) void am.phat(chuong.src);
        // Đưa người dùng tới ô viết lời nguyện.
        const o = document.getElementById("o-viet-loi-nguyen");
        o?.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => (o as HTMLTextAreaElement | null)?.focus({ preventScroll: true }), 600);
        return;
      }
      setCon(c);
    }, 500);
    return () => window.clearInterval(t);
  }, [chay, chuong, am]);

  // Tải nhạc riêng
  const tep = React.useRef<HTMLInputElement>(null);
  const [dangTai, setDangTai] = React.useState(false);
  const [loi, setLoi] = React.useState("");
  async function taiLen(f: File | undefined) {
    if (!f) return;
    setDangTai(true);
    setLoi("");
    try {
      const moi = await taiNhacRieng(f, locale);
      setNhacRieng((cu) => [...cu, moi]);
      setNguon(`u:${moi.id}`);
    } catch (err) {
      setLoi((err instanceof LoiApi && err.thongDiep) || n.uploadHint);
    } finally {
      setDangTai(false);
      if (tep.current) tep.current.value = "";
    }
  }
  async function xoaNhac(x: NhacRieng) {
    if (!window.confirm(n.deleteMusic)) return;
    try {
      await xoaNhacRieng(x.id, locale);
      setNhacRieng((cu) => cu.filter((y) => y.id !== x.id));
      if (nguon === `u:${x.id}`) setNguon("s:auto");
    } catch (err) {
      setLoi((err instanceof LoiApi && err.thongDiep) || nhan.saveError);
    }
  }

  // Lưu cấu hình
  const [moLuu, setMoLuu] = React.useState(false);
  const [ten, setTen] = React.useState("");
  const [bao, setBao] = React.useState("");
  async function luuCauHinh(e: React.FormEvent) {
    e.preventDefault();
    if (!ten.trim()) return;
    try {
      const cfg: CauHinhCauNguyen = { nguon: giaTriChon, phut, amLuong };
      const moi = await luuBoCauHinh({ name: ten.trim(), config: cfg, kind: "cau-an" }, locale);
      setBoCauHinh((cu) => [...cu, moi]);
      setTen("");
      setMoLuu(false);
      setBao(n.saved);
      window.setTimeout(() => setBao(""), 2500);
    } catch (err) {
      setLoi((err instanceof LoiApi && err.thongDiep) || nhan.saveError);
    }
  }
  function apDung(b: BoCauHinh) {
    const c = b.config as Partial<CauHinhCauNguyen>;
    if (typeof c.nguon === "string") setNguon(c.nguon);
    if (typeof c.phut === "number") setPhut(c.phut);
    if (typeof c.amLuong === "number") setAmLuong(c.amLuong);
    luuBoCauHinh({ id: b.id, used: true }, locale).catch(() => {});
  }
  async function xoaCauHinh(b: BoCauHinh) {
    if (!window.confirm(dien(nhan.presets.confirmDelete, { name: b.name }))) return;
    await xoaBoCauHinh(b.id, locale).catch(() => {});
    setBoCauHinh((cu) => cu.filter((x) => x.id !== b.id));
  }

  const idAmLuong = React.useId();
  const daDangNhap = daBiet && !!nguoiDungId;

  return (
    <div className="flex w-full gap-4 rounded-lg border border-line bg-surface p-4 shadow-card">
      <AmNen src={src} chay={chay} amLuong={amLuong} />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Timer className="size-4 text-accent" aria-hidden /> {n.prepTitle}
        </span>

        {/* Nguồn nhạc */}
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
            <span className="text-xs font-medium text-muted">{nhan.prayersPage.ambient}</span>
            <select
              value={giaTriChon}
              onChange={(e) => setNguon(e.target.value)}
              disabled={chay}
              className="h-9 rounded-md border border-line bg-surface px-2.5 text-sm text-ink focus:border-accent focus:outline-none disabled:opacity-60"
            >
              <option value="">{nhan.soundOff}</option>
              {nenCoSan.length ? (
                <optgroup label={n.systemMusic}>
                  {nenCoSan.map((a) => (
                    <option key={a.id} value={`s:${a.id}`}>
                      {a.title}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {nhacRieng.length ? (
                <optgroup label={n.myMusic}>
                  {nhacRieng.map((x) => (
                    <option key={x.id} value={`u:${x.id}`}>
                      {x.name}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
          </label>
          {daDangNhap ? (
            <>
              <input ref={tep} type="file" accept="audio/*" className="hidden" onChange={(e) => taiLen(e.target.files?.[0])} />
              <Button type="button" size="sm" variant="outline" disabled={dangTai || chay} onClick={() => tep.current?.click()} title={n.uploadHint}>
                <Upload aria-hidden /> {dangTai ? n.uploading : n.upload}
              </Button>
            </>
          ) : null}
        </div>
        {nhacRieng.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {nhacRieng.map((x) => (
              <li key={x.id} className="flex items-center gap-1 rounded-full bg-surface-2 py-0.5 pl-2.5 pr-1 text-xs text-body">
                {x.name}
                <button type="button" onClick={() => xoaNhac(x)} aria-label={`${n.deleteMusic} ${x.name}`} className="rounded-full p-0.5 text-muted hover:text-lacquer">
                  <Trash2 className="size-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {/* Thời gian + điều khiển */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted">{n.prepTime}</span>
          {THOI_GIAN.map((p) => (
            <Button key={p} type="button" size="sm" variant={phut === p ? "solid" : "outline"} disabled={chay} onClick={() => setPhut(p)}>
              {dien(nhan.meditation.minutes, { n: p })}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {chay ? (
            <Button type="button" size="sm" variant="outline" onClick={dung}>
              <Pause aria-hidden /> {n.stop}
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={batDau} disabled={!src}>
              <Play aria-hidden /> {n.start}
            </Button>
          )}
          {chay ? (
            <span className="font-serif text-lg font-bold tabular-nums text-accent" role="timer">
              {dien(n.remaining, { t: dongHo(con) })}
            </span>
          ) : null}
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="ml-auto size-9"
            disabled={!chuong}
            aria-label={chuong?.title ?? nhan.sound}
            title={chuong?.title}
            onClick={() => chuong && void am.phat(chuong.src)}
          >
            <Bell className="size-4" aria-hidden />
          </Button>
        </div>
        {xong ? (
          <p className="rounded-md bg-accent-soft px-3 py-2 text-sm text-accent">
            <span className="font-semibold">{n.done}</span> {n.doneHint}
          </p>
        ) : null}

        {/* Cấu hình đã lưu */}
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          {daDangNhap ? (
            <>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs font-medium text-muted">{n.presets}</span>
                {boCauHinh.length ? (
                  boCauHinh.map((b) => (
                    <span key={b.id} className="flex items-center">
                      <button
                        type="button"
                        disabled={chay}
                        onClick={() => apDung(b)}
                        className="rounded-l-full border border-line px-2.5 py-1 text-xs text-body hover:border-accent hover:text-accent disabled:opacity-60"
                      >
                        {b.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => xoaCauHinh(b)}
                        aria-label={`${nhan.presets.delete}: ${b.name}`}
                        className="rounded-r-full border border-l-0 border-line px-1.5 py-1 text-muted hover:text-lacquer"
                      >
                        <X className="size-3" aria-hidden />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted">{n.noPresets}</span>
                )}
                <Button type="button" size="sm" variant="ghost" className="ml-auto" onClick={() => setMoLuu((v) => !v)}>
                  <Save aria-hidden /> {n.savePreset}
                </Button>
              </div>
              {moLuu ? (
                <form onSubmit={luuCauHinh} className="flex gap-2">
                  <input
                    autoFocus
                    value={ten}
                    onChange={(e) => setTen(e.target.value)}
                    maxLength={60}
                    placeholder={n.presetName}
                    aria-label={n.presetName}
                    className="h-9 min-w-0 flex-1 rounded-md border border-line bg-surface px-2.5 text-sm focus:border-accent focus:outline-none"
                  />
                  <Button type="submit" size="sm" disabled={!ten.trim()}>
                    {nhan.presets.confirm}
                  </Button>
                </form>
              ) : null}
            </>
          ) : daBiet ? (
            <Link href={localePath(locale, "/dang-nhap")} className="text-xs text-accent hover:underline">
              {n.signIn}
            </Link>
          ) : null}
          {bao ? <span className="text-xs text-accent">{bao}</span> : null}
          {loi ? (
            <span role="alert" className="text-xs text-lacquer">
              {loi}
            </span>
          ) : null}
        </div>
      </div>

      {/* Thanh âm lượng dọc: kéo lên = to hơn. */}
      <div className={cn("flex flex-col items-center gap-1 border-l border-line pl-3")}>
        <span className="text-[11px] tabular-nums text-muted">{Math.round(amLuong * 100)}%</span>
        <input
          id={idAmLuong}
          type="range"
          min={0}
          max={100}
          value={Math.round(amLuong * 100)}
          onChange={(e) => setAmLuong(Number(e.target.value) / 100)}
          aria-label={nhan.meditation.volume}
          aria-orientation="vertical"
          className="w-5 flex-1 cursor-pointer accent-accent"
          style={{ writingMode: "vertical-lr", direction: "rtl", minHeight: "6rem" }}
        />
        <label htmlFor={idAmLuong} title={nhan.meditation.volume}>
          <Volume2 className="size-3.5 text-muted" aria-hidden />
          <span className="sr-only">{nhan.meditation.volume}</span>
        </label>
      </div>
    </div>
  );
}
