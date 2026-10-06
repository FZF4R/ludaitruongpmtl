"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";
import { SocialLogin, type NhanDangNhap } from "@/components/auth/social-login";
import { PasswordLogin } from "@/components/auth/password-login";
import { HoacNgang } from "@/components/auth/login-panel";
import { AvatarPicker } from "@/components/auth/avatar-picker";
import { localePath, splitLocale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import { LoiApi, dangXuat, docToken, layHoSo, type HoSo } from "@/lib/auth";
import { cauHoi } from "@/lib/survey";
import { tabQuanTriDau } from "@/lib/admin-api";

/**
 * Màn hình tài khoản: chưa đăng nhập thì hiện hai nút, đã đăng nhập thì hiện
 * hồ sơ đã khai.
 *
 * Toàn bộ chạy phía trình duyệt vì token nằm ở localStorage — server render
 * trang này ra HTML rỗng, nội dung thật hiện sau khi JavaScript chạy. Chấp
 * nhận được: trang đã `noindex` và `force-dynamic`, không ai vào đây từ kết
 * quả tìm kiếm.
 */

type TrangThai = "dangTai" | "chuaDangNhap" | "san";

/** Một dòng "nhãn — giá trị" trong bảng hồ sơ. */
function Dong({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line py-2.5 last:border-0 sm:flex-row sm:gap-4">
      <dt className="text-sm text-muted sm:w-48 sm:shrink-0">{nhan}</dt>
      <dd className="text-sm text-ink">{giaTri}</dd>
    </div>
  );
}

export function AccountPanel({
  nhanAuth,
  nhanHoSo,
  nhanTaiKhoan,
}: {
  nhanAuth: Dictionary["auth"];
  nhanHoSo: Dictionary["onboarding"];
  nhanTaiKhoan: Dictionary["account"];
}) {
  const { locale } = splitLocale(usePathname());
  const lp = (href: string) => localePath(locale, href);

  const [trangThai, setTrangThai] = React.useState<TrangThai>("dangTai");
  const [hoSo, setHoSo] = React.useState<HoSo | null>(null);

  const nap = React.useCallback(() => {
    if (!docToken()) {
      setTrangThai("chuaDangNhap");
      return;
    }

    layHoSo(locale)
      .then((kq) => {
        setHoSo(kq);
        setTrangThai("san");
      })
      .catch((err) => {
        // Token hết hạn thì dọn luôn, đừng để người dùng kẹt ở màn hình lỗi.
        if (err instanceof LoiApi && err.status === 401) dangXuat();
        setTrangThai("chuaDangNhap");
      });
  }, [locale]);

  React.useEffect(nap, [nap]);

  if (trangThai === "dangTai") {
    return <p className="text-sm text-muted">{nhanAuth.loading}</p>;
  }

  if (trangThai === "chuaDangNhap") {
    // Tải lại cả trang để header/quyền (InlineEditProvider) nhận người dùng ngay.
    const xong = (ketQua: { isNewUser: boolean }) =>
      ketQua.isNewUser ? window.location.replace(lp("/hoan-thien-ho-so")) : window.location.reload();

    const nhanNut: NhanDangNhap = {
      google: nhanAuth.google,
      facebook: nhanAuth.facebook,
      connecting: nhanAuth.connecting,
      notConfigured: nhanAuth.notConfigured,
      failed: nhanAuth.failed,
      cancelled: nhanAuth.cancelled,
      needTwoFactor: nhanAuth.needTwoFactor,
      privacy: nhanAuth.privacy,
    };

    return (
      <Card className="flex max-w-lg flex-col gap-4 p-6">
        <p className="text-sm text-muted">{nhanAuth.signInPrompt}</p>
        <SocialLogin nhan={nhanNut} onXong={xong} />
        <HoacNgang chu={nhanAuth.or} />
        <PasswordLogin
          nhan={{ ...nhanAuth.password, failed: nhanAuth.failed, needTwoFactor: nhanAuth.needTwoFactor }}
          onXong={xong}
        />
      </Card>
    );
  }

  if (!hoSo) return null;

  const tuyChon = nhanHoSo.options as unknown as Record<string, Record<string, string>>;
  const chuaKhai = nhanAuth.notFilled;

  const tabQuanTri = tabQuanTriDau(hoSo.permissions);

  const queQuan = [hoSo.hometown.detail, hoSo.hometown.province]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-wrap items-center gap-x-4 gap-y-2 p-6">
        <AvatarPicker
          src={hoSo.avatarUrl}
          name={hoSo.fullName || hoSo.username}
          locale={locale}
          nhan={nhanAuth}
          onDoi={(avatarUrl) => setHoSo((cu) => (cu ? { ...cu, avatarUrl } : cu))}
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs uppercase tracking-[0.12em] text-muted">
            {nhanAuth.signedInAs}
          </span>
          <span className="font-serif text-lg font-bold text-ink">
            {hoSo.fullName || hoSo.username}
          </span>
          {hoSo.email ? <span className="text-sm text-muted">{hoSo.email}</span> : null}
        </div>

        {hoSo.dharmaName ? (
          <Badge tone="brass" className="self-start">
            {hoSo.dharmaName}
          </Badge>
        ) : null}

        <div className="ml-auto flex flex-wrap gap-2">
          {/*
            Lối vào khu quản trị chỉ hiện khi vai trò có ít nhất một quyền quản
            trị, và dẫn thẳng tới tab đầu tiên mở được. Không đưa vào menu
            chính vì header là Client Component không biết vai trò của ai — mà
            trang tài khoản thì đã đọc hồ sơ rồi.
          */}
          {tabQuanTri ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={lp(tabQuanTri)}>Khu quản trị</Link>
            </Button>
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <Link href={lp("/tai-khoan/thong-ke")}>{nhanTaiKhoan.stats}</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={lp("/tai-khoan/bai-viet")}>{nhanTaiKhoan.myContent}</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={lp("/hoan-thien-ho-so")}>{nhanAuth.editProfile}</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              dangXuat();
              // Như lúc đăng nhập: tải lại để header và quyền quên người dùng ngay.
              window.location.reload();
            }}
          >
            {nhanAuth.signOut}
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-6">
        <h2 className="font-serif text-xl font-bold">{nhanAuth.profileTitle}</h2>

        <dl className="flex flex-col">
          <Dong nhan={nhanHoSo.fullName} giaTri={hoSo.fullName || chuaKhai} />
          <Dong nhan={nhanHoSo.dharmaName} giaTri={hoSo.dharmaName || chuaKhai} />
          <Dong nhan={nhanHoSo.nickname} giaTri={hoSo.nickname || chuaKhai} />
          <Dong nhan={nhanHoSo.hometown} giaTri={queQuan || chuaKhai} />

          {cauHoi.map((cau) => {
            const dapAn = hoSo.survey[cau.key];
            const chu = Array.isArray(dapAn)
              ? dapAn.map((id) => tuyChon[cau.key][id]).filter(Boolean).join(", ")
              : dapAn
                ? tuyChon[cau.key][dapAn]
                : "";

            return (
              <Dong
                key={cau.key}
                nhan={nhanHoSo.questions[cau.key]}
                giaTri={chu || chuaKhai}
              />
            );
          })}

          {hoSo.survey.vegDaysPerMonth ? (
            <Dong
              nhan={nhanHoSo.vegDays}
              giaTri={tuyChon.vegDays[String(hoSo.survey.vegDaysPerMonth)]}
            />
          ) : null}
        </dl>
      </Card>
    </div>
  );
}
