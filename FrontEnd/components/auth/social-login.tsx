"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { splitLocale } from "@/lib/i18n";
import { LoiApi, dangNhapMangXaHoi, type KetQuaDangNhap } from "@/lib/auth";

/**
 * Hai nút đăng nhập mạng xã hội.
 *
 * Luồng: SDK của Google/Facebook mở popup và trả về ACCESS token của họ ->
 * gửi token đó sang backend (/v1/user/login/google|facebook) -> backend tự đi
 * hỏi Google/Facebook xem token có thật không rồi mới phát token của site.
 * Trình duyệt không bao giờ tự nhận là ai; nó chỉ chuyển tiếp một thứ mà bên
 * thứ ba xác nhận được.
 *
 * Vì sao nạp SDK ngay lúc mở trang chứ không đợi tới lúc bấm: cả hai đều mở
 * popup, mà popup chỉ được phép mở trong cùng một nhịp xử lý với cú bấm của
 * người dùng. Nếu đợi tải xong script rồi mới gọi thì đã qua nhịp đó và trình
 * duyệt chặn cửa sổ.
 */

type GoogleTokenResponse = { access_token?: string; error?: string };
type GoogleTokenClient = { requestAccessToken: () => void };
type FbAuthResponse = { authResponse?: { accessToken?: string } | null };

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (res: GoogleTokenResponse) => void;
            error_callback?: (err: { type?: string }) => void;
          }): GoogleTokenClient;
        };
      };
    };
    FB?: {
      init(config: {
        appId: string;
        version: string;
        cookie?: boolean;
        xfbml?: boolean;
      }): void;
      login(
        callback: (res: FbAuthResponse) => void,
        options?: { scope?: string },
      ): void;
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? "";

/** Nạp một script ngoài đúng một lần, kể cả khi component gắn lại nhiều lần. */
function taiScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const daCo = document.querySelector<HTMLScriptElement>(`script[data-sv="${src}"]`);

    if (daCo) {
      if (daCo.dataset.xong === "1") return resolve();
      daCo.addEventListener("load", () => resolve());
      daCo.addEventListener("error", () => reject(new Error(src)));
      return;
    }

    const the = document.createElement("script");
    the.src = src;
    the.async = true;
    the.defer = true;
    the.dataset.sv = src;
    the.addEventListener("load", () => {
      the.dataset.xong = "1";
      resolve();
    });
    the.addEventListener("error", () => reject(new Error(src)));
    document.head.appendChild(the);
  });
}

function BieuTuongGoogle() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

function BieuTuongFacebook() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07Z"
      />
    </svg>
  );
}

export type NhanDangNhap = {
  google: string;
  facebook: string;
  connecting: string;
  notConfigured: string;
  failed: string;
  cancelled: string;
  needTwoFactor: string;
  privacy: string;
};

export function SocialLogin({
  nhan,
  onXong,
}: {
  nhan: NhanDangNhap;
  onXong: (ketQua: Extract<KetQuaDangNhap, { trangThai: "xong" }>) => void;
}) {
  const { locale } = splitLocale(usePathname());

  const [dangChay, setDangChay] = React.useState<"google" | "facebook" | null>(null);
  const [loi, setLoi] = React.useState("");
  const [googleSan, setGoogleSan] = React.useState(false);
  const [fbSan, setFbSan] = React.useState(false);

  const clientGoogle = React.useRef<GoogleTokenClient | null>(null);
  // Callback của Google gắn một lần lúc init, nên phải có chỗ để mỗi cú bấm
  // đặt hàm resolve của riêng nó vào.
  const choGoogle = React.useRef<((token: string | null) => void) | null>(null);

  React.useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let conSong = true;
    taiScript("https://accounts.google.com/gsi/client")
      .then(() => {
        if (!conSong || !window.google) return;

        clientGoogle.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "openid email profile",
          callback: (res) => {
            choGoogle.current?.(res.access_token ?? null);
            choGoogle.current = null;
          },
          error_callback: () => {
            choGoogle.current?.(null);
            choGoogle.current = null;
          },
        });
        setGoogleSan(true);
      })
      .catch(() => {
        // Script bị chặn (chặn quảng cáo, mạng nội bộ): nút cứ mờ đi, còn hơn
        // để người dùng bấm vào một thứ không bao giờ phản hồi.
      });

    return () => {
      conSong = false;
    };
  }, []);

  React.useEffect(() => {
    if (!FACEBOOK_APP_ID) return;

    let conSong = true;
    taiScript("https://connect.facebook.net/en_US/sdk.js")
      .then(() => {
        if (!conSong || !window.FB) return;

        window.FB.init({
          appId: FACEBOOK_APP_ID,
          version: "v19.0",
          cookie: false,
          xfbml: false,
        });
        setFbSan(true);
      })
      .catch(() => {
        // Như trên.
      });

    return () => {
      conSong = false;
    };
  }, []);

  /** Đổi access token của bên thứ ba lấy token của site. */
  async function doiLayPhien(
    nhaCungCap: "google" | "facebook",
    token: string | null,
  ) {
    if (!token) {
      setLoi(nhan.cancelled);
      setDangChay(null);
      return;
    }

    try {
      const ketQua = await dangNhapMangXaHoi(nhaCungCap, token, locale);

      if (ketQua.trangThai === "can2FA") {
        setLoi(nhan.needTwoFactor);
        setDangChay(null);
        return;
      }

      onXong(ketQua);
    } catch (err) {
      // LoiApi mang sẵn câu chữ đã dịch từ backend; rơi về câu chung khi rỗng.
      setLoi((err instanceof LoiApi && err.thongDiep) || nhan.failed);
      setDangChay(null);
    }
  }

  function bamGoogle() {
    if (!clientGoogle.current) return;

    setLoi("");
    setDangChay("google");

    new Promise<string | null>((resolve) => {
      choGoogle.current = resolve;
      clientGoogle.current?.requestAccessToken();
    }).then((token) => doiLayPhien("google", token));
  }

  function bamFacebook() {
    if (!window.FB) return;

    setLoi("");
    setDangChay("facebook");

    window.FB.login(
      (res) => {
        void doiLayPhien("facebook", res.authResponse?.accessToken ?? null);
      },
      { scope: "public_profile,email" },
    );
  }

  if (!GOOGLE_CLIENT_ID && !FACEBOOK_APP_ID) {
    return <p className="text-sm text-muted">{nhan.notConfigured}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {GOOGLE_CLIENT_ID ? (
        <Button
          variant="outline"
          size="lg"
          onClick={bamGoogle}
          disabled={!googleSan || dangChay !== null}
        >
          <BieuTuongGoogle />
          {dangChay === "google" ? nhan.connecting : nhan.google}
        </Button>
      ) : null}

      {FACEBOOK_APP_ID ? (
        <Button
          variant="outline"
          size="lg"
          onClick={bamFacebook}
          disabled={!fbSan || dangChay !== null}
        >
          <BieuTuongFacebook />
          {dangChay === "facebook" ? nhan.connecting : nhan.facebook}
        </Button>
      ) : null}

      {loi ? (
        <p role="alert" className="text-sm text-lacquer">
          {loi}
        </p>
      ) : null}

      <p className="text-xs text-muted">{nhan.privacy}</p>
    </div>
  );
}
