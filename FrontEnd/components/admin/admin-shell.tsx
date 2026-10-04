"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { localePath, splitLocale, type Locale } from "@/lib/i18n";
import { docToken, layHoSo, LoiApi, type HoSo } from "@/lib/auth";
import { coQuyen, laySoViecCho, nhanVaiTro, tabQuanTri, tabQuanTriDau } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

/**
 * Khung chung của khu quản trị: kiểm tra quyền rồi mới dựng trang con.
 *
 * Chữ trong toàn bộ thư mục components/admin/ để TIẾNG VIỆT thẳng trong mã,
 * không qua lib/dictionaries. Đây là màn hình nội bộ cho ban biên tập, còn bốn
 * tệp từ điển là hợp đồng dịch cho phần công khai — nhét thêm vài trăm khoá
 * quản trị vào đó bắt ba bản dịch phải chạy theo mỗi lần đổi một cái nhãn nút,
 * và không ai đọc chúng.
 *
 * Chặn ở đây CHỈ để giao diện đỡ bày ra thứ bấm vào sẽ 403. Hàng rào thật nằm
 * ở Backend/config/permissions.js; mã chạy trên trình duyệt không bảo vệ được
 * gì, người dùng sửa biến trong devtools là qua.
 */

type TrangThai = "dangTai" | "chuaDangNhap" | "khongDuQuyen" | "san";

/**
 * Quyền của người đang đăng nhập, để panel con ẩn nút mà bấm vào sẽ 403
 * (ví dụ nút "Xem" ở danh sách người dùng cần thêm `user.manage`).
 */
const QuyenContext = React.createContext<string[]>([]);

export function useQuyen(): string[] {
  return React.useContext(QuyenContext);
}

/** Hồ sơ người đang đăng nhập (ví dụ: xem trước tên tác giả khi soạn bài). */
const HoSoContext = React.createContext<HoSo | null>(null);

export function useHoSoQuanTri(): HoSo | null {
  return React.useContext(HoSoContext);
}

/** Dùng chung cho mọi panel: hộp báo lỗi có nút thử lại. */
export function HopLoi({ loi, thuLai }: { loi: string; thuLai?: () => void }) {
  if (!loi) return null;

  return (
    <Card className="flex flex-wrap items-center gap-3 border-lacquer/40 p-4">
      <p role="alert" className="text-sm text-lacquer">
        {loi}
      </p>
      {thuLai ? (
        <Button variant="outline" size="sm" onClick={thuLai}>
          Thử lại
        </Button>
      ) : null}
    </Card>
  );
}

/** Câu chữ từ backend nếu có, không thì câu chung của màn hình. */
export function chuLoi(err: unknown, mac = "Không thực hiện được, vui lòng thử lại."): string {
  return (err instanceof LoiApi && err.thongDiep) || mac;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, path } = splitLocale(pathname);
  const lp = (href: string) => localePath(locale, href);

  const [trangThai, setTrangThai] = React.useState<TrangThai>("dangTai");
  /** Số việc chờ theo tab (bài chờ duyệt, bình luận / lời nguyện bị giữ, báo cáo). */
  const [soViec, setSoViec] = React.useState<Record<string, number>>({});
  const [hoSo, setHoSo] = React.useState<HoSo | null>(null);

  React.useEffect(() => {
    if (!docToken()) {
      setTrangThai("chuaDangNhap");
      return;
    }

    let conSong = true;
    layHoSo(locale)
      .then((kq) => {
        if (!conSong) return;
        setHoSo(kq);
        setTrangThai(tabQuanTriDau(kq.permissions) ? "san" : "khongDuQuyen");
      })
      .catch((err) => {
        if (!conSong) return;
        setTrangThai(err instanceof LoiApi && err.status === 401 ? "chuaDangNhap" : "khongDuQuyen");
      });

    return () => {
      conSong = false;
    };
  }, [locale]);

  // Số việc chờ trên thanh tab: tải khi vào khu quản trị, khi chuyển tab, và mỗi 60 giây.
  React.useEffect(() => {
    if (trangThai !== "san") return;
    let song = true;
    const nap = () =>
      laySoViecCho(locale)
        .then((kq) => song && setSoViec(kq))
        .catch(() => {});
    nap();
    const t = window.setInterval(nap, 60_000);
    return () => {
      song = false;
      window.clearInterval(t);
    };
  }, [trangThai, locale, path]);

  if (trangThai === "dangTai") {
    return <p className="py-12 text-sm text-muted">Đang tải…</p>;
  }

  if (trangThai === "chuaDangNhap") {
    return (
      <Card className="my-12 flex max-w-lg flex-col items-start gap-4 p-6">
        <h1 className="font-serif text-xl font-bold">Khu quản trị</h1>
        <p className="text-sm text-muted">Bạn cần đăng nhập để vào khu vực này.</p>
        <Button asChild>
          <Link href={lp("/dang-nhap")}>Đăng nhập</Link>
        </Button>
      </Card>
    );
  }

  if (trangThai === "khongDuQuyen") {
    return (
      <Card className="my-12 flex max-w-lg flex-col items-start gap-4 p-6">
        <h1 className="font-serif text-xl font-bold">Không có quyền truy cập</h1>
        <p className="text-sm text-muted">
          Vai trò của bạn chưa được cấp quyền nào trong khu quản trị.
          {hoSo ? ` Tài khoản của bạn đang là ${nhanVaiTro[hoSo.role] ?? hoSo.role}.` : ""}
        </p>
        <Button variant="outline" asChild>
          <Link href={lp("/tai-khoan")}>Về trang tài khoản</Link>
        </Button>
      </Card>
    );
  }

  const quyen = hoSo?.permissions ?? [];
  const mucHienRa = tabQuanTri.filter((tab) => coQuyen(quyen, tab.quyen));
  // Gõ thẳng URL một tab không được phép: báo ngay thay vì để panel gọi API rồi nhận 403.
  const tabDangXem = tabQuanTri.find((tab) => path === tab.href || path.startsWith(`${tab.href}/`));
  const chanTab = tabDangXem && !coQuyen(quyen, tabDangXem.quyen);

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            Khu quản trị
          </span>
          <span className="text-sm text-muted">
            {hoSo?.fullName || hoSo?.username} · {nhanVaiTro[hoSo?.role ?? ""] ?? hoSo?.role}
          </span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={lp("/")}>Xem trang công khai</Link>
        </Button>
      </div>

      <nav aria-label="Khu quản trị" className="flex flex-wrap gap-1 border-b border-line pb-px">
        {mucHienRa.map((muc) => {
          const dangXem = path === muc.href || path.startsWith(`${muc.href}/`);

          return (
            <Link
              key={muc.href}
              href={lp(muc.href)}
              aria-current={dangXem ? "page" : undefined}
              className={cn(
                "-mb-px rounded-t-md border-b-2 px-3.5 py-2 text-sm font-medium transition-colors",
                dangXem
                  ? "border-accent text-accent"
                  : "border-transparent text-body hover:border-line-strong hover:text-ink",
              )}
            >
              {muc.nhan}
              {soViec[muc.href.split("/").pop() ?? ""] ? (
                <span
                  className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-lacquer px-1.5 text-[11px] font-bold leading-5 text-white"
                  aria-label={`${soViec[muc.href.split("/").pop() ?? ""]} việc đang chờ`}
                >
                  {soViec[muc.href.split("/").pop() ?? ""]}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <QuyenContext.Provider value={quyen}>
        <HoSoContext.Provider value={hoSo}>
        {chanTab ? (
          <Card className="flex max-w-lg flex-col gap-2 p-6">
            <h1 className="font-serif text-xl font-bold">Không có quyền truy cập</h1>
            <p className="text-sm text-muted">
              Vai trò của bạn chưa được cấp quyền vào mục “{tabDangXem.nhan}”.
            </p>
          </Card>
        ) : (
          children
        )}
        </HoSoContext.Provider>
      </QuyenContext.Provider>
    </div>
  );
}

/** Ngôn ngữ hiện tại, để các panel gọi API kèm header x-language. */
export function useLocale(): Locale {
  return splitLocale(usePathname()).locale;
}
