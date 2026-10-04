"use client";

import * as React from "react";
import Link from "next/link";
import { Pause, Play, Save, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { useAmThanhNgan, useGiuManHinh, useLuaChonNho } from "@/components/practice/use-sound";
import {
  AmNen,
  ChonAmThanh,
  CongTac,
  DanhSachBaiNghe,
  NutLuuNhatKy,
  ThanhTruot,
  VongLan,
  dien,
  rung,
  useDsAmThanh,
  useLocaleHienTai,
  useNhipToiThieu,
  useNhipTuDong,
  usePhien,
  type NhanTuTap,
} from "@/components/practice/common";
import { HAT_TOI_THIEU_MS, MO_TOI_THIEU_MS } from "@/components/practice/wooden-fish-mala";
import { localePath } from "@/lib/i18n";
import { layBoCauHinh, luuBoCauHinh, xoaBoCauHinh, type AmThanh, type BoCauHinh, type LoaiAmThanh } from "@/lib/practice";
import { cn } from "@/lib/utils";

const THOI_LUONG = [5, 15, 30, 60];
const NHAC_GIUA = [0, 5, 10, 15];
const LOAI_CHUOI = [108, 54, 27, 21];
const BPM_TOI_DA = 60000 / MO_TOI_THIEU_MS;

type TrangThai = "cho" | "chay" | "dung" | "xong";

/**
 * Cấu hình một buổi thiền - đúng thứ được lưu thành "bộ cấu hình" của người dùng.
 * Âm thanh lưu theo id: "auto" = âm thanh đầu tiên cùng loại, "" = tắt.
 */
type CauHinhThien = {
  phut: number;
  nhacGiua: number;
  chuongId: string;
  nenId: string;
  amLuong: number;
  moBat: boolean;
  moId: string;
  moBpm: number;
  chuoiBat: boolean;
  soHat: number;
  hatId: string;
  kinhId: string;
};

const MAC_DINH: CauHinhThien = {
  phut: 15,
  nhacGiua: 0,
  chuongId: "auto",
  nenId: "auto",
  amLuong: 0.6,
  moBat: false,
  moId: "auto",
  moBpm: 40,
  chuoiBat: false,
  soHat: 108,
  hatId: "auto",
  kinhId: "",
};

/** Ghép cấu hình đã lưu (có thể thiếu trường, sai kiểu) với mặc định. */
function chuanHoa(c: Partial<CauHinhThien> | Record<string, unknown> | undefined): CauHinhThien {
  const kq = { ...MAC_DINH };
  for (const k of Object.keys(MAC_DINH) as (keyof CauHinhThien)[]) {
    const v = (c as Record<string, unknown> | undefined)?.[k];
    if (typeof v === typeof MAC_DINH[k]) (kq as Record<string, unknown>)[k] = v;
  }
  kq.phut = Math.min(720, Math.max(1, Math.round(kq.phut)));
  kq.moBpm = Math.min(BPM_TOI_DA, Math.max(20, kq.moBpm));
  return kq;
}

/** id -> âm thanh trong danh sách cùng loại ("auto" = đầu tiên, "" = tắt). */
function chon(ds: AmThanh[], loai: LoaiAmThanh, id: string) {
  const cungLoai = ds.filter((a) => a.kind === loai);
  const amThanh = id === "" ? null : (cungLoai.find((a) => a.id === id) ?? (id === "auto" ? cungLoai[0] : cungLoai[0]) ?? null);
  return { cungLoai, amThanh, id: amThanh?.id ?? "" };
}

function dongHo(giay: number) {
  const g = Math.max(0, Math.ceil(giay));
  const h = Math.floor(g / 3600);
  const m = Math.floor((g % 3600) / 60);
  const s = g % 60;
  const hai = (x: number) => String(x).padStart(2, "0");
  return h ? `${h}:${hai(m)}:${hai(s)}` : `${hai(m)}:${hai(s)}`;
}

/**
 * Đồng hồ thiền: chuông, nhạc thiền / âm nền, mõ tự gõ theo nhịp, lần chuỗi
 * hạt, kinh phát âm thanh; cấu hình lưu thành bộ để mỗi ngày chọn lại.
 * Đếm theo mốc giờ kết thúc (không cộng dồn từng tick) nên tab chạy nền bị
 * hãm nhịp vẫn kết thúc đúng giờ. Số phút thiền và số hạt lưu kèm phiên do
 * máy chủ mở - không vượt được thời gian thật.
 */
export function MeditationTimer({ nhan }: { nhan: NhanTuTap }) {
  const m = nhan.meditation;
  const { ds } = useDsAmThanh("thien-dinh");
  const { ds: dsMo } = useDsAmThanh("go-mo");
  const { ds: dsKinh } = useDsAmThanh("tung-kinh");
  const am = useAmThanhNgan();

  const [cfgLuu, setCfgLuu] = useLuaChonNho<Partial<CauHinhThien>>("thien_cau-hinh", MAC_DINH);
  const cfg = chuanHoa(cfgLuu);
  const doi = (thay: Partial<CauHinhThien>) => setCfgLuu({ ...cfg, ...thay });

  const chuong = chon(ds, "chuong", cfg.chuongId);
  const nen = chon(ds, "am-nen", cfg.nenId);
  const mo = chon(dsMo, "mo", cfg.moId);
  const tiengHat = chon(dsMo, "hat", cfg.hatId);
  const chuongVong = chon(dsMo, "chuong", "auto");
  const kinh = chon(dsKinh, "tung-mau", cfg.kinhId);
  const huongDan = ds.filter((a) => a.kind === "huong-dan");

  const [trangThai, setTrangThai] = React.useState<TrangThai>("cho");
  const [tong, setTong] = React.useState(cfg.phut * 60);
  const [con, setCon] = React.useState(cfg.phut * 60);
  const ketThuc = React.useRef(0);
  const mocNhac = React.useRef(0);
  const phienThien = usePhien("thien");
  const phienHat = usePhien("chuoi-hat");

  // Chuỗi hạt trong lúc thiền
  const [hat, setHat] = React.useState(0);
  const [vong, setVong] = React.useState(0);
  const [lan, setLan] = React.useState(0);
  const nhipHat = useNhipToiThieu(HAT_TOI_THIEU_MS);
  const tongHat = vong * cfg.soHat + hat;

  const chay = trangThai === "chay";
  useGiuManHinh(chay);

  const daThien = Math.round(tong - con);
  const phat = (a: AmThanh | null) => a && void am.phat(a.src);

  React.useEffect(() => {
    for (const a of [mo.amThanh, tiengHat.amThanh, chuong.amThanh]) if (a) void am.nap(a.src);
  }, [mo.amThanh, tiengHat.amThanh, chuong.amThanh, am]);

  function batDau() {
    const giay = cfg.phut * 60;
    setTong(giay);
    setCon(giay);
    setHat(0);
    setVong(0);
    mocNhac.current = 0;
    ketThuc.current = Date.now() + giay * 1000;
    phienThien.xong();
    phienHat.xong();
    phienThien.batDau();
    setTrangThai("chay");
    phat(chuong.amThanh);
  }

  function tamDung() {
    setCon(Math.max(0, (ketThuc.current - Date.now()) / 1000));
    setTrangThai("dung");
  }

  function tiepTuc() {
    ketThuc.current = Date.now() + con * 1000;
    setTrangThai("chay");
  }

  function ketThucSom() {
    if (trangThai === "chay") setCon(Math.max(0, (ketThuc.current - Date.now()) / 1000));
    setTrangThai("xong");
    phat(chuong.amThanh);
  }

  function lanHat(e?: { nativeEvent?: Event }) {
    if (!nhipHat.cho(e)) return;
    phienHat.batDau();
    setLan((n) => n + 1);
    if (hat + 1 >= cfg.soHat) {
      setHat(0);
      setVong((v) => v + 1);
      phat(chuongVong.amThanh);
      rung([30, 60, 30]);
    } else {
      setHat(hat + 1);
      phat(tiengHat.amThanh);
      rung(8);
    }
  }

  // Mõ tự gõ theo nhịp trong lúc thiền.
  useNhipTuDong(chay && cfg.moBat && !!mo.amThanh, cfg.moBpm, () => phat(mo.amThanh));

  // Nhịp đồng hồ + chuông nhắc giữa giờ + chuông kết thúc.
  const refChuong = React.useRef(() => {});
  React.useEffect(() => {
    refChuong.current = () => phat(chuong.amThanh);
  });
  React.useEffect(() => {
    if (!chay) return;
    const t = window.setInterval(() => {
      const conLai = (ketThuc.current - Date.now()) / 1000;
      if (conLai <= 0) {
        setCon(0);
        setTrangThai("xong");
        refChuong.current();
        // Kết thúc ngân ba tiếng như trong thiền đường.
        window.setTimeout(() => refChuong.current(), 3500);
        window.setTimeout(() => refChuong.current(), 7000);
        return;
      }
      setCon(conLai);
      if (cfg.nhacGiua > 0) {
        const moc = Math.floor((tong - conLai) / (cfg.nhacGiua * 60));
        if (moc > mocNhac.current) {
          mocNhac.current = moc;
          refChuong.current();
        }
      }
    }, 250);
    return () => window.clearInterval(t);
  }, [chay, cfg.nhacGiua, tong]);

  // Esc trong chế độ tập trung = tạm dừng; phím Cách = lần hạt (nếu bật chuỗi).
  React.useEffect(() => {
    if (!chay) return;
    const nghe = (e: KeyboardEvent) => {
      if (e.key === "Escape") tamDung();
      if (e.code === "Space" && cfg.chuoiBat && !e.repeat && e.isTrusted) {
        e.preventDefault();
        lanHat();
      }
    };
    window.addEventListener("keydown", nghe);
    return () => window.removeEventListener("keydown", nghe);
  });

  const chuVi = 2 * Math.PI * 140;
  const tiLe = tong > 0 ? 1 - con / tong : 0;
  const khoaChon = trangThai !== "cho" && trangThai !== "xong";

  return (
    <div className="flex flex-col gap-6">
      <AmNen src={nen.amThanh?.src ?? null} chay={chay} amLuong={cfg.amLuong} />
      <AmNen src={kinh.amThanh?.src ?? null} chay={chay} amLuong={cfg.amLuong} lap={false} />

      <KhoiCauHinh
        nhan={nhan}
        cfg={cfg}
        onApDung={(c) => setCfgLuu(chuanHoa(c))}
        khoa={khoaChon}
        tomTat={[
          [m.duration, dien(m.minutes, { n: cfg.phut })],
          [m.bell, chuong.amThanh?.title ?? nhan.soundOff],
          [m.interval, cfg.nhacGiua ? dien(m.intervalEvery, { n: cfg.nhacGiua }) : m.intervalNone],
          [nhan.medExtra.music, nen.amThanh?.title ?? nhan.soundOff],
          [nhan.medExtra.sutra, kinh.amThanh?.title ?? nhan.medExtra.none],
          [m.volume, `${Math.round(cfg.amLuong * 100)}%`],
          [
            nhan.medExtra.mo,
            cfg.moBat ? `${mo.amThanh?.title ?? "—"} · ${dien(nhan.woodenFish.bpm, { n: cfg.moBpm })}` : nhan.presets.off,
          ],
          [
            nhan.medExtra.mala,
            cfg.chuoiBat ? `${dien(nhan.mala.beadsOf, { n: cfg.soHat })} · ${tiengHat.amThanh?.title ?? nhan.soundOff}` : nhan.presets.off,
          ],
        ]}
      />

      <Card className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="flex flex-col items-center justify-center gap-5 py-4">
          <div className="relative grid aspect-square w-full max-w-[16rem] place-items-center">
            <svg viewBox="0 0 300 300" className="absolute inset-0 size-full -rotate-90" aria-hidden>
              <circle cx="150" cy="150" r="140" fill="none" strokeWidth="6" className="stroke-line" />
              <circle
                cx="150"
                cy="150"
                r="140"
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={chuVi}
                strokeDashoffset={chuVi * (1 - tiLe)}
                className="stroke-accent"
              />
            </svg>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs uppercase tracking-wider text-muted">{m.remaining}</span>
              <span className="font-serif text-5xl font-bold tabular-nums text-ink" role="timer" aria-live="off">
                {dongHo(trangThai === "cho" ? cfg.phut * 60 : con)}
              </span>
            </div>
          </div>

          {trangThai === "xong" ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="font-medium text-accent">{dien(m.done, { n: Math.max(1, Math.round(daThien / 60)) })}</p>
              <NutLuuNhatKy nhan={nhan} type="thien" amount={daThien} phien={phienThien} />
              {tongHat > 0 ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm text-muted">
                    {nhan.mala.title}: {dien(nhan.medExtra.beads, { n: tongHat })}
                  </span>
                  <NutLuuNhatKy
                    nhan={nhan}
                    type="chuoi-hat"
                    amount={tongHat}
                    note={dien(nhan.mala.beadsOf, { n: cfg.soHat })}
                    phien={phienHat}
                  />
                </div>
              ) : null}
              <Button variant="outline" size="sm" onClick={() => setTrangThai("cho")}>
                {nhan.reset}
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              {trangThai === "cho" ? (
                <Button size="lg" onClick={batDau}>
                  <Play className="size-4" aria-hidden /> {nhan.start}
                </Button>
              ) : (
                <>
                  <Button size="lg" onClick={tiepTuc}>
                    <Play className="size-4" aria-hidden /> {nhan.resume}
                  </Button>
                  <Button size="lg" variant="outline" onClick={ketThucSom}>
                    <Square className="size-4" aria-hidden /> {nhan.stop}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        <fieldset disabled={khoaChon} className="flex flex-col gap-4 disabled:opacity-70">
          <h2 className="font-serif text-xl font-bold text-ink">{m.title}</h2>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">{m.duration}</span>
            <div className="flex flex-wrap gap-1.5">
              {THOI_LUONG.map((p) => (
                <Button key={p} type="button" size="sm" variant={cfg.phut === p ? "solid" : "outline"} onClick={() => doi({ phut: p })}>
                  {dien(m.minutes, { n: p })}
                </Button>
              ))}
            </div>
            <label className="mt-1 flex items-center gap-2 text-sm text-muted">
              {m.custom}
              <input
                type="number"
                min={1}
                max={720}
                value={cfg.phut}
                onChange={(e) => doi({ phut: Math.min(720, Math.max(1, Number(e.target.value) || 1)) })}
                className="h-8 w-20 rounded-md border border-line bg-surface px-2 text-sm tabular-nums text-ink focus:border-accent focus:outline-none"
              />
            </label>
          </div>

          <ChonAmThanh
            nhan={nhan}
            label={m.bell}
            cungLoai={chuong.cungLoai}
            value={chuong.id}
            onChange={(id) => doi({ chuongId: id })}
            onNghe={chuong.amThanh ? () => phat(chuong.amThanh) : undefined}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">{m.interval}</span>
            <select
              value={cfg.nhacGiua}
              onChange={(e) => doi({ nhacGiua: Number(e.target.value) })}
              className="h-9 rounded-md border border-line bg-surface px-2.5 text-sm text-ink focus:border-accent focus:outline-none"
            >
              {NHAC_GIUA.map((k) => (
                <option key={k} value={k}>
                  {k === 0 ? m.intervalNone : dien(m.intervalEvery, { n: k })}
                </option>
              ))}
            </select>
          </label>
          <ChonAmThanh nhan={nhan} label={nhan.medExtra.music} cungLoai={nen.cungLoai} value={nen.id} onChange={(id) => doi({ nenId: id })} />
          <ChonAmThanh nhan={nhan} label={nhan.medExtra.sutra} cungLoai={kinh.cungLoai} value={kinh.id} onChange={(id) => doi({ kinhId: id })} />
          <ThanhTruot
            label={m.volume}
            giaTri={Math.round(cfg.amLuong * 100)}
            hienThi={`${Math.round(cfg.amLuong * 100)}%`}
            min={0}
            max={100}
            onChange={(v) => doi({ amLuong: v / 100 })}
          />

          <div className="flex flex-col gap-3 rounded-md border border-line p-3">
            <CongTac checked={cfg.moBat} onChange={(v) => doi({ moBat: v })}>
              {nhan.medExtra.mo}
            </CongTac>
            {cfg.moBat ? (
              <>
                <ChonAmThanh
                  nhan={nhan}
                  label={nhan.woodenFish.moSound}
                  cungLoai={mo.cungLoai}
                  value={mo.id}
                  coTat={false}
                  onChange={(id) => doi({ moId: id })}
                  onNghe={mo.amThanh ? () => phat(mo.amThanh) : undefined}
                />
                <ThanhTruot
                  label={nhan.woodenFish.auto}
                  hienThi={dien(nhan.woodenFish.bpm, { n: cfg.moBpm })}
                  giaTri={cfg.moBpm}
                  min={20}
                  max={BPM_TOI_DA}
                  onChange={(v) => doi({ moBpm: v })}
                />
              </>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 rounded-md border border-line p-3">
            <CongTac checked={cfg.chuoiBat} onChange={(v) => doi({ chuoiBat: v })}>
              {nhan.medExtra.mala}
            </CongTac>
            {cfg.chuoiBat ? (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {LOAI_CHUOI.map((n) => (
                    <Button key={n} type="button" size="sm" variant={cfg.soHat === n ? "solid" : "outline"} onClick={() => doi({ soHat: n })}>
                      {n}
                    </Button>
                  ))}
                </div>
                <ChonAmThanh
                  nhan={nhan}
                  label={nhan.beadSound}
                  cungLoai={tiengHat.cungLoai}
                  value={tiengHat.id}
                  onChange={(id) => doi({ hatId: id })}
                  onNghe={tiengHat.amThanh ? () => phat(tiengHat.amThanh) : undefined}
                />
              </>
            ) : null}
          </div>
        </fieldset>
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="font-serif text-lg font-bold text-ink">{m.guided}</h2>
        <DanhSachBaiNghe ds={huongDan} rong={m.noGuided} />
      </Card>

      {/* Chế độ tập trung: phủ tối toàn màn hình khi đang thiền. */}
      {chay ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-[#14100c] px-6 text-[#efe4d2]"
          role="dialog"
          aria-modal
          aria-label={m.title}
        >
          <div className="relative grid size-64 place-items-center sm:size-80">
            <span aria-hidden className="absolute inset-0 rounded-full bg-[#c58b4a]/15" style={{ animation: "tt-tho 10s ease-in-out infinite" }} />
            <svg viewBox="0 0 300 300" className="absolute inset-0 size-full -rotate-90" aria-hidden>
              <circle cx="150" cy="150" r="140" fill="none" strokeWidth="3" stroke="#efe4d2" strokeOpacity="0.12" />
              <circle
                cx="150"
                cy="150"
                r="140"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                stroke="#d9a35f"
                strokeDasharray={chuVi}
                strokeDashoffset={chuVi * (1 - tiLe)}
              />
            </svg>
            <span className="relative font-serif text-6xl tabular-nums" role="timer">
              {dongHo(con)}
            </span>
          </div>

          {cfg.chuoiBat ? (
            <button
              type="button"
              onClick={(e) => lanHat(e)}
              aria-label={nhan.medExtra.tapBead}
              className="relative flex size-28 touch-manipulation select-none flex-col items-center justify-center rounded-full border border-[#efe4d2]/25 bg-white/5 hover:bg-white/10"
            >
              <VongLan lan={lan} className="border-[#d9a35f]" />
              <span className="text-3xl font-bold tabular-nums">{hat}</span>
              <span className="text-[11px] text-[#efe4d2]/60">
                / {cfg.soHat}
                {vong ? ` · ${dien(nhan.mala.rounds, { n: vong })}` : ""}
              </span>
            </button>
          ) : (
            <p className="text-sm tracking-wide text-[#efe4d2]/60">{m.breathe}</p>
          )}
          <p className={cn("h-4 text-xs text-[#e89a8a] transition-opacity", nhipHat.nhanh ? "opacity-100" : "opacity-0")}>
            {nhipHat.nhanh ? nhan.tooFast : ""}
          </p>

          <div className="flex gap-3">
            <Button variant="outline" onClick={tamDung} className="border-[#efe4d2]/30 bg-transparent text-[#efe4d2] hover:bg-white/10">
              <Pause className="size-4" aria-hidden /> {nhan.pause}
            </Button>
            <Button variant="ghost" onClick={ketThucSom} className="text-[#efe4d2]/70 hover:bg-white/10 hover:text-[#efe4d2]">
              <Square className="size-4" aria-hidden /> {nhan.stop}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Bộ cấu hình của người dùng (lưu ở máy chủ): bấm một bộ là áp toàn bộ thời
 * gian, âm thanh, mõ, chuỗi hạt. Bộ dùng gần nhất được nhớ để chọn sẵn.
 */
function KhoiCauHinh({
  nhan,
  cfg,
  onApDung,
  khoa,
  tomTat,
}: {
  nhan: NhanTuTap;
  cfg: CauHinhThien;
  onApDung: (c: Record<string, unknown>) => void;
  khoa: boolean;
  /** Các dòng [nhãn, giá trị] tóm tắt cấu hình hiện tại - hiện trong popup lưu. */
  tomTat: [string, string][];
}) {
  const p = nhan.presets;
  const locale = useLocaleHienTai();
  const { nguoiDungId, daBiet } = useCheDoSua();
  const [ds, setDs] = React.useState<BoCauHinh[]>([]);
  const [dangDung, setDangDung] = useLuaChonNho<string>("thien_bo-dang-dung", "");
  const [loi, setLoi] = React.useState("");

  React.useEffect(() => {
    if (!daBiet || !nguoiDungId) return;
    layBoCauHinh(locale)
      .then(setDs)
      .catch(() => setDs([]));
  }, [daBiet, nguoiDungId, locale]);

  if (!daBiet) return null;
  if (!nguoiDungId) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <span className="text-sm text-muted">{p.hint}</span>
        <Button size="sm" variant="outline" asChild>
          <Link href={localePath(locale, "/dang-nhap")}>{p.signIn}</Link>
        </Button>
      </Card>
    );
  }

  const boHienTai = ds.find((b) => b.id === dangDung);

  async function apDung(b: BoCauHinh) {
    onApDung(b.config);
    setDangDung(b.id);
    luuBoCauHinh({ id: b.id, used: true }, locale).catch(() => {});
  }

  // Popup "Lưu cấu hình": lưu thành bộ mới (đặt tên) hoặc ghi đè bộ đang dùng.
  const [moPopup, setMoPopup] = React.useState(false);

  async function luuMoi(ten: string) {
    try {
      const moi = await luuBoCauHinh({ name: ten.trim(), config: cfg }, locale);
      setDs((cu) => [...cu, moi]);
      setDangDung(moi.id);
      setLoi("");
      return true;
    } catch (err) {
      setLoi(err instanceof Error && "thongDiep" in err ? String((err as { thongDiep: string }).thongDiep) : nhan.saveError);
      return false;
    }
  }

  async function capNhat(b: BoCauHinh) {
    try {
      const moi = await luuBoCauHinh({ id: b.id, name: b.name, config: cfg }, locale);
      setDs((cu) => cu.map((x) => (x.id === b.id ? moi : x)));
      setLoi("");
      return true;
    } catch {
      setLoi(nhan.saveError);
      return false;
    }
  }

  async function xoa(b: BoCauHinh) {
    if (!window.confirm(dien(p.confirmDelete, { name: b.name }))) return;
    try {
      await xoaBoCauHinh(b.id, locale);
      setDs((cu) => cu.filter((x) => x.id !== b.id));
      if (dangDung === b.id) setDangDung("");
    } catch {
      setLoi(nhan.saveError);
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-lg font-bold text-ink">{p.title}</h2>
          <p className="text-xs text-muted">{p.hint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={khoa} onClick={() => setMoPopup(true)}>
            <Save aria-hidden /> {p.save}
          </Button>
        </div>
      </div>
      {ds.length === 0 ? (
        <p className="text-sm text-muted">{p.empty}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {ds.map((b) => (
            <li key={b.id} className="flex items-center">
              <button
                type="button"
                disabled={khoa}
                onClick={() => apDung(b)}
                aria-pressed={dangDung === b.id}
                className={cn(
                  "rounded-l-full border px-3.5 py-1.5 text-sm transition-colors disabled:opacity-60",
                  dangDung === b.id ? "border-accent bg-accent-soft font-medium text-accent" : "border-line text-body hover:border-line-strong",
                )}
              >
                {b.name}
              </button>
              <button
                type="button"
                disabled={khoa}
                onClick={() => xoa(b)}
                aria-label={`${p.delete}: ${b.name}`}
                className="rounded-r-full border border-l-0 border-line px-2 py-1.5 text-muted hover:text-lacquer disabled:opacity-60"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {boHienTai ? <p className="text-xs text-accent">{dien(p.using, { name: boHienTai.name })}</p> : null}
      {moPopup ? (
        <PopupLuuCauHinh
          nhan={nhan}
          tomTat={tomTat}
          boHienTai={boHienTai ?? null}
          onDong={() => setMoPopup(false)}
          onLuuMoi={luuMoi}
          onCapNhat={() => (boHienTai ? capNhat(boHienTai) : Promise.resolve(false))}
        />
      ) : null}
      {loi ? (
        <p role="alert" className="text-sm text-lacquer">
          {loi}
        </p>
      ) : null}
    </Card>
  );
}

/**
 * Popup lưu cấu hình thiền: tóm tắt cấu hình hiện tại; chọn "Lưu thành bộ
 * mới" (đặt tên) hoặc "Cập nhật “bộ đang dùng”". Esc / bấm nền để đóng.
 */
function PopupLuuCauHinh({
  nhan,
  tomTat,
  boHienTai,
  onDong,
  onLuuMoi,
  onCapNhat,
}: {
  nhan: NhanTuTap;
  tomTat: [string, string][];
  boHienTai: BoCauHinh | null;
  onDong: () => void;
  onLuuMoi: (ten: string) => Promise<boolean>;
  onCapNhat: () => Promise<boolean>;
}) {
  const p = nhan.presets;
  const [cach, setCach] = React.useState<"moi" | "capNhat">(boHienTai ? "capNhat" : "moi");
  const [ten, setTen] = React.useState("");
  const [dang, setDang] = React.useState(false);
  const oTen = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const nghe = (e: KeyboardEvent) => e.key === "Escape" && onDong();
    window.addEventListener("keydown", nghe);
    return () => window.removeEventListener("keydown", nghe);
  }, [onDong]);
  React.useEffect(() => {
    if (cach === "moi") oTen.current?.focus();
  }, [cach]);

  async function luu(e: React.FormEvent) {
    e.preventDefault();
    if (cach === "moi" && !ten.trim()) return oTen.current?.focus();
    setDang(true);
    const ok = cach === "moi" ? await onLuuMoi(ten) : await onCapNhat();
    setDang(false);
    if (ok) onDong();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onDong}>
      <form
        role="dialog"
        aria-modal
        aria-label={p.popupTitle}
        onSubmit={luu}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-card border border-line bg-surface p-5 shadow-card-lift"
      >
        <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-ink">
          <Save className="size-4 text-accent" aria-hidden /> {p.popupTitle}
        </h3>

        <div className="flex flex-col gap-1.5 rounded-md bg-surface-2 p-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">{p.summary}</span>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
            {tomTat.map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="text-muted">{k}</dt>
                <dd className="truncate font-medium text-ink" title={v}>
                  {v}
                </dd>
              </React.Fragment>
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-2">
          {boHienTai ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="cach-luu" checked={cach === "capNhat"} onChange={() => setCach("capNhat")} className="accent-accent" />
              {dien(p.update, { name: boHienTai.name })}
            </label>
          ) : null}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="cach-luu" checked={cach === "moi"} onChange={() => setCach("moi")} className="accent-accent" />
            {p.saveNew}
          </label>
          {cach === "moi" ? (
            <input
              ref={oTen}
              value={ten}
              onChange={(e) => setTen(e.target.value)}
              maxLength={60}
              placeholder={p.namePrompt}
              aria-label={p.name}
              className="ml-6 h-9 rounded-md border border-line bg-surface px-2.5 text-sm text-ink focus:border-accent focus:outline-none"
            />
          ) : null}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onDong}>
            {p.cancel}
          </Button>
          <Button type="submit" size="sm" disabled={dang || (cach === "moi" && !ten.trim())}>
            <Save aria-hidden /> {p.confirm}
          </Button>
        </div>
      </form>
    </div>
  );
}
