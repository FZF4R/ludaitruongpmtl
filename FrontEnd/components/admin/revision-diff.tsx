"use client";

import * as React from "react";
import { HopLoi, chuLoi, useLocale } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { layBanSua, type BanSuaBai, type ThayDoiTruong } from "@/lib/admin-api";
import { htmlSangDoan, soChu, soDoan, type PhepSo } from "@/lib/diff";
import { cn } from "@/lib/utils";

/**
 * Nội dung đã sửa ở một lần thao tác, để đối chiếu trước/sau.
 *
 * - Chữ ngắn (tiêu đề, tóm tắt, đường dẫn…): so từng chữ trên cùng một dòng.
 * - Thân bài: so theo đoạn chữ người đọc thấy (bỏ thẻ HTML), đoạn sửa thì so
 *   tiếp từng chữ; các đoạn không đổi được gom lại cho gọn. Có nút xem mã
 *   HTML gốc hai bên khi cần soát thẻ.
 * - Trường có cấu trúc (thẻ, chuyên mục, tác giả…): hiện dạng đọc được, trước
 *   rồi sau.
 * Lần tạo chỉ có "sau", lần xoá chỉ có "trước".
 */

/** Tên tiếng Việt của các trường nội dung. */
export const nhanTruong: Record<string, string> = {
  type: "Loại",
  title: "Tiêu đề",
  slug: "Đường dẫn",
  summary: "Tóm tắt",
  coverUrl: "Ảnh bìa",
  bodyHtml: "Nội dung",
  chapters: "Chương",
  media: "Media",
  author: "Tác giả",
  translator: "Dịch giả",
  source: "Nguồn",
  categories: "Chuyên mục",
  tags: "Thẻ",
  publishedAt: "Ngày đăng",
  readingMinutes: "Thời gian đọc",
  seo: "SEO",
};

const CHU_NGAN = ["type", "title", "slug", "summary", "coverUrl", "publishedAt"];

/** Giá trị có cấu trúc -> một dòng chữ đọc được. */
function docDuoc(field: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  if (field === "tags" && Array.isArray(v)) return v.join(", ");
  if (field === "categories" && Array.isArray(v)) {
    return v.map((c) => (c as { name?: string }).name ?? "").join(", ");
  }
  if (field === "author" && typeof v === "object") {
    const a = v as { name?: string; dharmaName?: string; title?: string; fromProfile?: boolean };
    return [
      [a.title, a.name].filter(Boolean).join(" "),
      a.dharmaName ? `Pháp danh: ${a.dharmaName}` : "",
      a.fromProfile ? "(theo hồ sơ)" : "",
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (field === "translator" && typeof v === "object") {
    const t = v as { name?: string; dharmaName?: string; userId?: string };
    return [t.name, t.dharmaName ? `Pháp danh: ${t.dharmaName}` : "", t.userId ? "(người dùng hệ thống)" : ""]
      .filter(Boolean)
      .join(" · ");
  }
  if (field === "source" && typeof v === "object") {
    const s = v as { name?: string; url?: string };
    return [s.name, s.url].filter(Boolean).join(" — ");
  }
  if (field === "chapters" && Array.isArray(v)) {
    return `${v.length} chương: ${v.map((c) => (c as { title?: string }).title ?? "").join("; ")}`;
  }
  if (field === "readingMinutes") return `${v} phút`;
  if (typeof v === "string") return v;

  return JSON.stringify(v, null, 1);
}

function DongChu({ phep }: { phep: PhepSo[] }) {
  return (
    <>
      {phep.map((p, i) =>
        p.loai === "giu" ? (
          <span key={i}>{p.giaTri}</span>
        ) : p.loai === "xoa" ? (
          <del key={i} className="rounded-sm bg-lacquer/15 text-lacquer decoration-lacquer/60">
            {p.giaTri}
          </del>
        ) : (
          <ins key={i} className="rounded-sm bg-accent-soft text-accent no-underline">
            {p.giaTri}
          </ins>
        ),
      )}
    </>
  );
}

function Nhan({ loai }: { loai: "truoc" | "sau" }) {
  return (
    <span
      className={cn(
        "mr-2 inline-block w-10 shrink-0 text-[11px] font-semibold uppercase tracking-wide",
        loai === "truoc" ? "text-lacquer" : "text-accent",
      )}
    >
      {loai === "truoc" ? "Trước" : "Sau"}
    </span>
  );
}

/** Thân bài: so theo đoạn, gom đoạn không đổi. */
function SoThanBai({ truoc, sau }: { truoc: string; sau: string }) {
  const [xemHtml, setXemHtml] = React.useState(false);
  const khoi = React.useMemo(() => soDoan(htmlSangDoan(truoc), htmlSangDoan(sau)), [truoc, sau]);

  // Gom các đoạn không đổi liền nhau, chỉ giữ 1 đoạn sát chỗ sửa làm ngữ cảnh.
  const hien: React.ReactNode[] = [];
  for (let i = 0; i < khoi.length; i++) {
    const k = khoi[i];
    if (k.loai !== "giu") {
      hien.push(
        <p
          key={i}
          className={cn(
            "rounded-md px-3 py-2",
            k.loai === "xoa" && "bg-lacquer/10 text-lacquer line-through decoration-lacquer/50",
            k.loai === "them" && "bg-accent-soft/70 text-ink",
            k.loai === "sua" && "bg-surface-2",
          )}
        >
          {k.loai === "sua" ? <DongChu phep={k.chu} /> : k.doan}
        </p>,
      );
      continue;
    }
    let j = i;
    while (j < khoi.length && khoi[j].loai === "giu") j++;
    const doan = khoi.slice(i, j) as { loai: "giu"; doan: string }[];
    const sauSua = i > 0;
    const truocSua = j < khoi.length;
    const giuDau = sauSua ? doan.slice(0, 1) : [];
    const giuCuoi = truocSua ? doan.slice(-1) : [];
    const an = doan.length - giuDau.length - giuCuoi.length;

    if (an <= 0) {
      doan.forEach((d, n) => hien.push(<p key={`${i}-${n}`} className="px-3 py-1 text-muted">{d.doan}</p>));
    } else {
      giuDau.forEach((d) => hien.push(<p key={`${i}-d`} className="px-3 py-1 text-muted">{d.doan}</p>));
      hien.push(
        <p key={`${i}-an`} className="px-3 text-xs italic text-muted">
          … {an} đoạn không đổi …
        </p>,
      );
      giuCuoi.forEach((d) => hien.push(<p key={`${i}-c`} className="px-3 py-1 text-muted">{d.doan}</p>));
    }
    i = j - 1;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex max-h-[28rem] flex-col gap-1.5 overflow-y-auto rounded-md border border-line p-2 text-sm leading-relaxed">
        {hien.length ? hien : <p className="px-3 py-1 text-muted">Chữ hiển thị không đổi (chỉ đổi thẻ HTML).</p>}
      </div>
      <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setXemHtml((x) => !x)}>
        {xemHtml ? "Ẩn mã HTML" : "Xem mã HTML hai bên"}
      </Button>
      {xemHtml ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { nhan: "Trước", ma: truoc },
            { nhan: "Sau", ma: sau },
          ].map((b) => (
            <div key={b.nhan} className="flex min-w-0 flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{b.nhan}</span>
              <pre className="max-h-80 overflow-auto rounded-md bg-surface-2 p-2 text-xs whitespace-pre-wrap break-words">
                {b.ma || "(trống)"}
              </pre>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MotTruong({ td }: { td: ThayDoiTruong }) {
  const { field, before, after } = td;
  const nhan = nhanTruong[field] ?? field;

  let than: React.ReactNode;
  if (field === "bodyHtml") {
    than = <SoThanBai truoc={String(before ?? "")} sau={String(after ?? "")} />;
  } else if (CHU_NGAN.includes(field) && before !== null && after !== null) {
    than = (
      <p className="rounded-md bg-surface-2 px-3 py-2 text-sm leading-relaxed">
        <DongChu phep={soChu(String(before ?? ""), String(after ?? ""))} />
      </p>
    );
  } else {
    const t = docDuoc(field, before);
    const s = docDuoc(field, after);
    than = (
      <div className="flex flex-col gap-1 rounded-md bg-surface-2 px-3 py-2 text-sm">
        {before !== null ? (
          <p className="flex">
            <Nhan loai="truoc" />
            <span className="min-w-0 break-words text-lacquer">{t || "(trống)"}</span>
          </p>
        ) : null}
        {after !== null ? (
          <p className="flex">
            <Nhan loai="sau" />
            <span className="min-w-0 break-words text-ink">{s || "(trống)"}</span>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-ink">{nhan}</span>
      {than}
    </div>
  );
}

/** Tải và hiện nội dung đã sửa của một dòng nhật ký. */
export function RevisionDiff({ logId }: { logId: string }) {
  const locale = useLocale();
  const [ban, setBan] = React.useState<BanSuaBai | null>(null);
  const [loi, setLoi] = React.useState("");

  React.useEffect(() => {
    let conSong = true;
    layBanSua(logId, locale)
      .then((kq) => conSong && setBan(kq))
      .catch((err) => conSong && setLoi(chuLoi(err, "Không tải được nội dung đã sửa.")));
    return () => {
      conSong = false;
    };
  }, [logId, locale]);

  if (loi) return <HopLoi loi={loi} />;
  if (!ban) return <p className="text-xs text-muted">Đang tải…</p>;

  return (
    <div className="flex flex-col gap-4 rounded-md border border-line bg-surface p-3">
      {ban.action !== "update" ? (
        <p className="text-xs text-muted">
          {ban.action === "create" ? "Nội dung lúc tạo bài." : "Toàn bộ nội dung lúc xoá bài."}
        </p>
      ) : (
        <p className="flex flex-wrap gap-3 text-xs text-muted">
          <span>
            <del className="rounded-sm bg-lacquer/15 px-1 text-lacquer">chữ bị bỏ</del>
          </span>
          <span>
            <ins className="rounded-sm bg-accent-soft px-1 text-accent no-underline">chữ thêm vào</ins>
          </span>
        </p>
      )}
      {ban.changes.map((td) => (
        <MotTruong key={td.field} td={td} />
      ))}
    </div>
  );
}
