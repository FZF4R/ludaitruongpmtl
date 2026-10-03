"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Pencil, RotateCcw, X } from "lucide-react";
import { docToken, layHoSo } from "@/lib/auth";
import { splitLocale } from "@/lib/i18n";
import { luuChuGiaoDien } from "@/lib/site-text-action";
import { cn } from "@/lib/utils";

/**
 * Sửa chữ giao diện ngay trên trang.
 *
 * Người có quyền `site.text.edit` thấy một nút nổi "Sửa giao diện" ở góc
 * dưới. Bật lên thì mỗi <EditableText> hiện viền đứt và nút bút chì; bấm vào
 * thành ô nhập với Lưu / Huỷ / Mặc định. Lưu xong gọi router.refresh() để
 * trang render lại từ server với chữ mới — không tự vá DOM, nên thứ admin
 * thấy đúng là thứ người đọc sẽ thấy.
 *
 * Với người đọc bình thường <EditableText> chỉ in ra chữ, không thêm thẻ nào,
 * nên HTML server render và bố cục trang không đổi.
 */

type TrangThaiSua = {
  /** Quyền của người đang xem (rỗng nếu chưa đăng nhập), đọc một lần từ hồ sơ. */
  quyen: string[];
  /** id người đang đăng nhập; null nếu chưa đăng nhập hoặc đang đọc hồ sơ. */
  nguoiDungId: string | null;
  /** Đã biết trạng thái đăng nhập chưa (tránh nháy nút "Đăng nhập" khi hồ sơ chưa về). */
  daBiet: boolean;
  /** Có quyền `site.text.edit`. */
  coQuyen: boolean;
  dangSua: boolean;
  doiCheDo: () => void;
};

const SuaContext = React.createContext<TrangThaiSua>({
  quyen: [],
  nguoiDungId: null,
  daBiet: false,
  coQuyen: false,
  dangSua: false,
  doiCheDo: () => {},
});

const KHOA_CHE_DO = "sv_che_do_sua";

export function InlineEditProvider({ children }: { children: React.ReactNode }) {
  const { locale } = splitLocale(usePathname());
  const [quyen, setQuyen] = React.useState<string[]>([]);
  const [nguoiDungId, setNguoiDungId] = React.useState<string | null>(null);
  const [daBiet, setDaBiet] = React.useState(false);
  const coQuyen = quyen.includes("site.text.edit");
  const [dangSua, setDangSua] = React.useState(false);

  React.useEffect(() => {
    // Người chưa đăng nhập: không gọi API nào, trang công khai giữ nguyên chi phí.
    if (!docToken()) {
      setDaBiet(true);
      return;
    }

    let conSong = true;
    layHoSo(locale)
      .then((hoSo) => {
        if (!conSong) return;
        setQuyen(hoSo.permissions ?? []);
        setNguoiDungId(hoSo.id || null);
        if (!hoSo.permissions?.includes("site.text.edit")) return;
        try {
          setDangSua(window.sessionStorage.getItem(KHOA_CHE_DO) === "1");
        } catch {
          // Không đọc được sessionStorage thì mặc định tắt.
        }
      })
      .catch(() => {})
      .finally(() => conSong && setDaBiet(true));

    return () => {
      conSong = false;
    };
    // Chỉ đọc quyền một lần mỗi lần tải trang; đổi ngôn ngữ không đổi quyền.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doiCheDo = React.useCallback(() => {
    setDangSua((cu) => {
      try {
        window.sessionStorage.setItem(KHOA_CHE_DO, cu ? "0" : "1");
      } catch {
        // Bỏ qua: chế độ chỉ sống trong tab này.
      }
      return !cu;
    });
  }, []);

  return (
    <SuaContext.Provider value={{ quyen, nguoiDungId, daBiet, coQuyen, dangSua, doiCheDo }}>
      {children}
      {coQuyen ? (
        <button
          type="button"
          onClick={doiCheDo}
          className={cn(
            "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-card-lift transition-colors",
            dangSua
              ? "border-accent bg-accent text-paper hover:opacity-90"
              : "border-line bg-surface text-ink hover:border-line-strong",
          )}
        >
          {dangSua ? <X className="size-4" aria-hidden /> : <Pencil className="size-4" aria-hidden />}
          {dangSua ? "Thoát chế độ sửa" : "Sửa giao diện"}
        </button>
      ) : null}
    </SuaContext.Provider>
  );
}

/**
 * Quyền và chế độ sửa của người đang xem, cho các nút quản trị đặt trên trang
 * công khai (thêm bài, đổi kiểu hiển thị...). Chỉ để ẩn/hiện — backend vẫn
 * kiểm tra lại quyền ở mọi API.
 */
export function useCheDoSua(): TrangThaiSua {
  return React.useContext(SuaContext);
}

/**
 * Một đoạn chữ sửa được.
 *
 * `k` là khoá lưu trong CSDL: đường dẫn từ điển (`home.latest`) thì bản sửa
 * được gộp thẳng vào từ điển; khoá riêng (`home.heroQuote`) thì trang tự đọc
 * từ `texts` của getI18n. `value` là chữ đang hiện (đã gộp bản sửa nếu có).
 */
export function EditableText({
  k,
  value,
  multiline,
}: {
  k: string;
  value: string;
  /** Mặc định tự đoán: có xuống dòng hoặc dài hơn 80 ký tự thì dùng ô nhiều dòng. */
  multiline?: boolean;
}) {
  const { dangSua } = React.useContext(SuaContext);
  const router = useRouter();
  const { locale } = splitLocale(usePathname());

  const [moO, setMoO] = React.useState(false);
  const [nhap, setNhap] = React.useState(value);
  const [dangLuu, startLuu] = React.useTransition();
  const [loi, setLoi] = React.useState("");

  if (!dangSua) return <>{value}</>;

  const nhieuDong = multiline ?? (value.includes("\n") || value.length > 80);

  // Chữ có thể nằm trong <a> hoặc <button>: chặn để bấm nút sửa không điều hướng.
  const chan = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  function luu(giaTri: string) {
    const token = docToken();
    if (!token) {
      setLoi("Phiên đăng nhập đã hết, hãy đăng nhập lại.");
      return;
    }
    setLoi("");
    startLuu(async () => {
      const kq = await luuChuGiaoDien({ token, lang: locale, key: k, value: giaTri });
      if (!kq.ok) {
        setLoi(kq.message || "Không lưu được, vui lòng thử lại.");
        return;
      }
      setMoO(false);
      router.refresh();
    });
  }

  if (!moO) {
    return (
      <span className="relative rounded-sm outline-1 outline-offset-2 outline-accent/60 outline-dashed">
        {value}
        <button
          type="button"
          onClick={(e) => {
            chan(e);
            setNhap(value);
            setLoi("");
            setMoO(true);
          }}
          title={`Sửa “${k}”`}
          aria-label={`Sửa đoạn chữ ${k}`}
          className="ml-1.5 inline-flex size-6 translate-y-[-0.1em] items-center justify-center rounded-full bg-accent align-middle text-paper shadow-card hover:opacity-90"
        >
          <Pencil className="size-3" aria-hidden />
        </button>
      </span>
    );
  }

  // Ô nhập luôn dùng màu bề mặt: chữ gốc có thể đang trắng trên ảnh nền.
  const oNhap =
    "w-full min-w-[16rem] rounded-md border border-accent bg-surface px-2.5 py-1.5 font-sans text-sm leading-relaxed text-ink shadow-card focus:outline-none";

  return (
    <span
      className="inline-flex w-full max-w-2xl flex-col gap-1.5 align-top"
      onClick={(e) => e.stopPropagation()}
    >
      {nhieuDong ? (
        <textarea
          value={nhap}
          onChange={(e) => setNhap(e.target.value)}
          rows={Math.min(8, Math.max(3, nhap.split("\n").length + 1))}
          maxLength={2000}
          autoFocus
          className={oNhap}
        />
      ) : (
        <input
          value={nhap}
          onChange={(e) => setNhap(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              chan(e);
              luu(nhap);
            }
            if (e.key === "Escape") setMoO(false);
          }}
          maxLength={2000}
          autoFocus
          className={oNhap}
        />
      )}

      <span className="flex flex-wrap items-center gap-1.5 font-sans text-xs">
        <NutNho onClick={(e) => (chan(e), luu(nhap))} disabled={dangLuu || !nhap.trim()} chinh>
          <Check className="size-3.5" aria-hidden /> {dangLuu ? "Đang lưu…" : "Lưu"}
        </NutNho>
        <NutNho onClick={(e) => (chan(e), setMoO(false))} disabled={dangLuu}>
          <X className="size-3.5" aria-hidden /> Huỷ
        </NutNho>
        <NutNho
          onClick={(e) => (chan(e), luu(""))}
          disabled={dangLuu}
          title="Xoá bản sửa, dùng lại chữ mặc định"
        >
          <RotateCcw className="size-3.5" aria-hidden /> Mặc định
        </NutNho>
        {loi ? (
          <span role="alert" className="rounded bg-surface px-1.5 py-0.5 text-lacquer">
            {loi}
          </span>
        ) : null}
      </span>
    </span>
  );
}

function NutNho({
  chinh,
  className,
  ...props
}: React.ComponentProps<"button"> & { chinh?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 font-medium shadow-card disabled:opacity-50",
        chinh
          ? "border-accent bg-accent text-paper hover:opacity-90"
          : "border-line bg-surface text-ink hover:border-line-strong",
        className,
      )}
      {...props}
    />
  );
}
