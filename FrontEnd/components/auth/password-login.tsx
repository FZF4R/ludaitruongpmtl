"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { splitLocale } from "@/lib/i18n";
import {
  LoiApi,
  dangKy,
  dangNhapMatKhau,
  soDienThoaiHopLe,
  type KetQuaDangNhap,
} from "@/lib/auth";
import { cn } from "@/lib/utils";

export type NhanMatKhau = {
  tabSignIn: string;
  tabRegister: string;
  username: string;
  usernameHint: string;
  password: string;
  passwordConfirm: string;
  phone: string;
  phoneHint: string;
  submitSignIn: string;
  submitRegister: string;
  working: string;
  errUsername: string;
  errPassword: string;
  errPasswordMatch: string;
  errPhone: string;
  failed: string;
  needTwoFactor: string;
};

/**
 * Đăng nhập / đăng ký bằng tên đăng nhập + mật khẩu.
 *
 * Đăng ký bắt buộc số điện thoại hợp lệ; tài khoản tạo ra được backend đánh
 * dấu `isNotVerified` (chưa xác minh danh tính). Đăng ký xong backend đăng nhập
 * luôn nên `onXong` dùng chung dạng với nút Google / Facebook.
 *
 * Luật kiểm ở đây khớp backend (UsersController.register) chỉ để báo lỗi sớm;
 * backend vẫn kiểm lại.
 */
export function PasswordLogin({
  nhan,
  onXong,
}: {
  nhan: NhanMatKhau;
  onXong: (ketQua: Extract<KetQuaDangNhap, { trangThai: "xong" }>) => void;
}) {
  const { locale } = splitLocale(usePathname());
  const [cheDo, setCheDo] = React.useState<"dangNhap" | "dangKy">("dangNhap");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [nhapLai, setNhapLai] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [dangGui, setDangGui] = React.useState(false);
  const [loi, setLoi] = React.useState("");

  const dangKyMoi = cheDo === "dangKy";

  function kiem(): string {
    const ten = username.trim();
    if (dangKyMoi) {
      if (!/^[a-zA-Z0-9]{6,25}$/.test(ten)) return nhan.errUsername;
      if (password.length < 6 || password.length > 100) return nhan.errPassword;
      if (password !== nhapLai) return nhan.errPasswordMatch;
      if (!soDienThoaiHopLe(phone)) return nhan.errPhone;
    } else if (!ten || !password) {
      return nhan.failed;
    }
    return "";
  }

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    const loiForm = kiem();
    setLoi(loiForm);
    if (loiForm) return;

    setDangGui(true);
    try {
      const ketQua = dangKyMoi
        ? await dangKy({ username, password, phone }, locale)
        : await dangNhapMatKhau(username, password, locale);
      if (ketQua.trangThai === "can2FA") {
        setLoi(nhan.needTwoFactor);
        setDangGui(false);
        return;
      }
      // Giữ trạng thái "đang gửi": onXong tải lại trang ngay sau đó.
      onXong(ketQua);
    } catch (err) {
      setLoi((err instanceof LoiApi && err.thongDiep) || nhan.failed);
      setDangGui(false);
    }
  }

  function doiCheDo(moi: typeof cheDo) {
    setCheDo(moi);
    setLoi("");
  }

  return (
    <form onSubmit={gui} className="flex flex-col gap-4" noValidate>
      <div
        role="tablist"
        className="grid grid-cols-2 rounded-lg border border-line p-1 text-sm"
      >
        {(["dangNhap", "dangKy"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={cheDo === k}
            onClick={() => doiCheDo(k)}
            className={cn(
              "rounded-md px-3 py-1.5 font-medium transition-colors",
              cheDo === k
                ? "bg-accent text-paper"
                : "text-muted hover:text-ink",
            )}
          >
            {k === "dangNhap" ? nhan.tabSignIn : nhan.tabRegister}
          </button>
        ))}
      </div>

      <Field
        id="dn-username"
        label={nhan.username}
        hint={dangKyMoi ? nhan.usernameHint : undefined}
        required={dangKyMoi}
      >
        {(p) => (
          <Input
            {...p}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={25}
          />
        )}
      </Field>

      {/* Tab Đăng ký: hai ô mật khẩu chung một hàng để form đủ thấp, nút gửi không trôi khỏi màn hình. */}
      <div className={cn("grid gap-4", dangKyMoi && "sm:grid-cols-2")}>
        <Field id="dn-password" label={nhan.password} required={dangKyMoi}>
          {(p) => (
            <Input
              {...p}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={dangKyMoi ? "new-password" : "current-password"}
              maxLength={100}
            />
          )}
        </Field>

        {dangKyMoi ? (
          <Field id="dn-password2" label={nhan.passwordConfirm} required>
            {(p) => (
              <Input
                {...p}
                type="password"
                value={nhapLai}
                onChange={(e) => setNhapLai(e.target.value)}
                autoComplete="new-password"
                maxLength={100}
              />
            )}
          </Field>
        ) : null}
      </div>

      {dangKyMoi ? (
        <>
          <Field
            id="dn-phone"
            label={nhan.phone}
            hint={nhan.phoneHint}
            required
          >
            {(p) => (
              <Input
                {...p}
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                maxLength={20}
              />
            )}
          </Field>
        </>
      ) : null}

      {loi ? (
        <p role="alert" className="text-sm text-lacquer">
          {loi}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={dangGui}>
        {dangGui
          ? nhan.working
          : dangKyMoi
            ? nhan.submitRegister
            : nhan.submitSignIn}
      </Button>
    </form>
  );
}
