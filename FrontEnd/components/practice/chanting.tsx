"use client";

import * as React from "react";
import { Bell, Minus, Pause, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { useAmThanhNgan, useGiuManHinh, useLuaChonNho } from "@/components/practice/use-sound";
import {
  AmNen,
  ChonAmThanh,
  CongTac,
  DanhSachBaiNghe,
  NutLuuNhatKy,
  ThanhTruot,
  dien,
  useAmThanhDaChon,
  useDsAmThanh,
  useNhipTuDong,
  type NhanTuTap,
} from "@/components/practice/common";
import type { BanKinh } from "@/app/[lang]/tu-tap/tung-kinh-niem-phat/actions";
import { ChuoiHat, GoMo } from "@/components/practice/wooden-fish-mala";
import { cn } from "@/lib/utils";

type Am = ReturnType<typeof useAmThanhNgan>;
type Ds = ReturnType<typeof useDsAmThanh>["ds"];

/** Trang "Tụng kinh / Niệm Phật": bộ đếm niệm Phật + chế độ đọc kinh, chung bộ âm thanh mục tung-kinh. */
export function Chanting({
  nhan,
  kinh,
  docKinh,
}: {
  nhan: NhanTuTap;
  kinh: { slug: string; title: string }[];
  docKinh: (slug: string) => Promise<BanKinh | null>;
}) {
  const { ds } = useDsAmThanh("tung-kinh");
  const { ds: dsMo } = useDsAmThanh("go-mo");
  const am = useAmThanhNgan();
  // Ba tab dùng chung phím Cách để gõ/lần hạt: "niem-phat" dựng cả Mõ + Tràng hạt (một lần
  // bấm tính cả hai, như trang /tu-tap/go-mo-chuoi-hat), hai tab còn lại dựng một mình nó -
  // không bao giờ dựng cả ba cùng lúc, nếu không một lần bấm sẽ đếm nhảy vào cả ba nơi.
  const [boDem, setBoDem] = useLuaChonNho<"niem-phat" | "go-mo" | "chuoi-hat">("tung-kinh_bo-dem", "niem-phat");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div role="tablist" aria-label={nhan.counters} className="flex flex-wrap gap-1.5">
          {(
            [
              ["niem-phat", nhan.recitation.title],
              ["go-mo", nhan.woodenFish.title],
              ["chuoi-hat", nhan.mala.title],
            ] as const
          ).map(([k, ten]) => (
            <Button key={k} role="tab" aria-selected={boDem === k} size="sm" variant={boDem === k ? "solid" : "outline"} onClick={() => setBoDem(k)}>
              {ten}
            </Button>
          ))}
        </div>
        {boDem === "go-mo" ? (
          <GoMo nhan={nhan} ds={dsMo} am={am} />
        ) : boDem === "chuoi-hat" ? (
          <ChuoiHat nhan={nhan} ds={dsMo} am={am} />
        ) : (
          <NiemPhat nhan={nhan} dsTungKinh={ds} dsMo={dsMo} am={am} kinh={kinh} docKinh={docKinh} />
        )}
      </div>
    </div>
  );
}

/**
 * "Niệm Phật": mõ bên trái, tụng kinh ở giữa, tràng hạt bên phải - gõ mõ và
 * lần hạt cùng lúc (xem GoMo/ChuoiHat - cả hai cùng nghe phím Cách), kèm
 * nhạc niệm Phật phát nền.
 */
function NiemPhat({
  nhan,
  dsTungKinh,
  dsMo,
  am,
  kinh,
  docKinh,
}: {
  nhan: NhanTuTap;
  dsTungKinh: Ds;
  dsMo: Ds;
  am: Am;
  kinh: { slug: string; title: string }[];
  docKinh: (slug: string) => Promise<BanKinh | null>;
}) {
  const n = nhan.recitation;
  const nhac = useAmThanhDaChon("tung-kinh", "am-nen", dsTungKinh);
  const [dangPhat, setDangPhat] = React.useState(false);
  const [amLuong, setAmLuong] = useLuaChonNho("niem-phat_am-luong", 0.5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4">
        <AmNen src={nhac.amThanh?.src ?? null} chay={dangPhat} amLuong={amLuong} />
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <ChonAmThanh nhan={nhan} label={n.music} cungLoai={nhac.cungLoai} value={nhac.id} onChange={nhac.chon} coTat={false} />
          <ThanhTruot
            label={nhan.meditation.volume}
            giaTri={Math.round(amLuong * 100)}
            hienThi={`${Math.round(amLuong * 100)}%`}
            min={0}
            max={100}
            onChange={(v) => setAmLuong(v / 100)}
          />
          <Button type="button" size="sm" variant="outline" disabled={!nhac.amThanh} onClick={() => setDangPhat(!dangPhat)}>
            {dangPhat ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
            {dangPhat ? nhan.pause : nhan.start}
          </Button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <GoMo nhan={nhan} ds={dsMo} am={am} />
        <DocKinh nhan={nhan} ds={dsTungKinh} am={am} kinh={kinh} docKinh={docKinh} />
        <ChuoiHat nhan={nhan} ds={dsMo} am={am} />
      </div>
    </div>
  );
}

const CO_CHU = [16, 18, 20, 23, 26, 30];

function DocKinh({
  nhan,
  ds,
  am,
  kinh,
  docKinh,
}: {
  nhan: NhanTuTap;
  ds: Ds;
  am: Am;
  kinh: { slug: string; title: string }[];
  docKinh: (slug: string) => Promise<BanKinh | null>;
}) {
  const r = nhan.reader;
  const [slug, setSlug] = useLuaChonNho("tung-kinh_slug", kinh[0]?.slug ?? "");
  const [ban, setBan] = React.useState<BanKinh | null>(null);
  const [dangTai, setDangTai] = React.useState(false);
  const [coChu, setCoChu] = useLuaChonNho("tung-kinh_co-chu", 2);
  const [tuCuon, setTuCuon] = React.useState(false);
  const [tocDo, setTocDo] = useLuaChonNho("tung-kinh_toc-do", 3);
  const [moNhip, setMoNhip] = React.useState(false);
  const [bpm, setBpm] = useLuaChonNho("tung-kinh_bpm", 72);
  const khung = React.useRef<HTMLDivElement>(null);
  const chuong = useAmThanhDaChon("tung-kinh", "chuong", ds);
  const mo = useAmThanhDaChon("tung-kinh", "mo", ds);
  const tungMau = ds.filter((a) => a.kind === "tung-mau");

  const slugHopLe = kinh.some((k) => k.slug === slug) ? slug : (kinh[0]?.slug ?? "");

  React.useEffect(() => {
    if (!slugHopLe) return;
    let huy = false;
    setDangTai(true);
    setTuCuon(false);
    docKinh(slugHopLe)
      .then((b) => {
        if (huy) return;
        setBan(b);
        khung.current?.scrollTo({ top: 0 });
      })
      .catch(() => !huy && setBan(null))
      .finally(() => !huy && setDangTai(false));
    return () => {
      huy = true;
    };
  }, [slugHopLe, docKinh]);

  // Tự cuộn: cộng dồn phần lẻ vì scrollTop chỉ nhận số nguyên điểm ảnh.
  React.useEffect(() => {
    if (!tuCuon) return;
    let khungHinh = 0;
    let truoc = performance.now();
    let du = 0;
    const buoc = (bay: number) => {
      const el = khung.current;
      if (el) {
        du += ((bay - truoc) / 1000) * tocDo * 9;
        const nguyen = Math.floor(du);
        if (nguyen > 0) {
          el.scrollTop += nguyen;
          du -= nguyen;
        }
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
          setTuCuon(false);
          return;
        }
      }
      truoc = bay;
      khungHinh = requestAnimationFrame(buoc);
    };
    khungHinh = requestAnimationFrame(buoc);
    return () => cancelAnimationFrame(khungHinh);
  }, [tuCuon, tocDo]);

  useNhipTuDong(moNhip, bpm, () => {
    if (mo.amThanh) void am.phat(mo.amThanh.src);
  });
  useGiuManHinh(tuCuon || moNhip);

  if (kinh.length === 0) {
    // Lưới ba cột đặt items-start; riêng thẻ rỗng tự kéo bằng chiều cao hàng
    // (= khung Mõ / Tràng hạt bên cạnh) để bố cục không bị hụt một cột.
    return (
      <Card className="flex flex-col gap-3 p-5 lg:self-stretch">
        <h2 className="font-serif text-xl font-bold text-ink">{r.title}</h2>
        <div className="flex min-h-40 flex-1 items-center justify-center rounded-md border border-dashed border-line px-4 text-center">
          <p className="text-sm text-muted">{r.noSutra}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-end gap-3">
        <h2 className="mr-auto font-serif text-xl font-bold text-ink">{r.title}</h2>
        <label className="flex min-w-[14rem] flex-1 flex-col gap-1.5 sm:max-w-sm">
          <span className="text-xs font-medium text-muted">{r.choose}</span>
          <select
            value={slugHopLe}
            onChange={(e) => setSlug(e.target.value)}
            className="h-9 rounded-md border border-line bg-surface px-2.5 text-sm text-ink focus:border-accent focus:outline-none"
          >
            {kinh.map((k) => (
              <option key={k.slug} value={k.slug}>
                {k.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Thanh công cụ */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-md bg-surface-2 p-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted">{r.fontSize}</span>
          <Button type="button" variant="outline" size="icon" className="size-8" aria-label={`${r.fontSize} -`} disabled={coChu <= 0} onClick={() => setCoChu(coChu - 1)}>
            <Minus className="size-3.5" aria-hidden />
          </Button>
          <Button type="button" variant="outline" size="icon" className="size-8" aria-label={`${r.fontSize} +`} disabled={coChu >= CO_CHU.length - 1} onClick={() => setCoChu(coChu + 1)}>
            <Plus className="size-3.5" aria-hidden />
          </Button>
        </div>
        <CongTac checked={tuCuon} onChange={setTuCuon}>
          {r.autoScroll}
        </CongTac>
        <div className="w-36">
          <ThanhTruot label={r.speed} giaTri={tocDo} min={1} max={10} onChange={setTocDo} />
        </div>
        <CongTac checked={moNhip} onChange={setMoNhip}>
          {nhan.woodenFish.auto}
        </CongTac>
        <div className="w-36">
          <ThanhTruot label={nhan.woodenFish.moSound} hienThi={dien(nhan.woodenFish.bpm, { n: bpm })} giaTri={bpm} min={30} max={150} onChange={setBpm} />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!chuong.amThanh}
          onClick={() => chuong.amThanh && void am.phat(chuong.amThanh.src)}
          className="ml-auto"
        >
          <Bell className="size-4" aria-hidden /> {r.openBell}
        </Button>
      </div>

      <div
        ref={khung}
        className="max-h-[70vh] min-h-64 overflow-y-auto rounded-md border border-line bg-surface px-5 py-6 [scrollbar-width:thin] sm:px-10"
        onWheel={() => tuCuon && setTuCuon(false)}
        onTouchStart={() => tuCuon && setTuCuon(false)}
      >
        {dangTai || !ban ? (
          <p className="text-sm text-muted">{dangTai ? r.loading : r.noSutra}</p>
        ) : (
          <article className="mx-auto max-w-2xl" style={{ fontSize: CO_CHU[coChu] ?? 20 }}>
            <h3 className="mb-6 text-center font-serif text-[1.4em] font-bold text-ink">{ban.title}</h3>
            {ban.phan.map((p, i) => (
              <section key={i} className="mb-8">
                {p.title ? <h4 className="mb-3 text-center font-serif text-[1.1em] font-semibold text-accent">{p.title}</h4> : null}
                <div
                  className={cn("prose prose-dharma max-w-none font-serif text-[1em] leading-[1.9]", "[&_p]:text-[1em]")}
                  dangerouslySetInnerHTML={{ __html: p.html }}
                />
              </section>
            ))}
            <div className="flex flex-col items-center gap-3 border-t border-line pt-6 font-sans text-base">
              <span className="text-sm font-medium text-ink">{r.finished}</span>
              <NutLuuNhatKy nhan={nhan} type="tung-kinh" amount={1} note={ban.title} />
            </div>
          </article>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-4">
        <h3 className="text-sm font-semibold text-ink">{r.sampleAudio}</h3>
        <DanhSachBaiNghe ds={tungMau} rong={r.noSample} />
      </div>
    </Card>
  );
}
