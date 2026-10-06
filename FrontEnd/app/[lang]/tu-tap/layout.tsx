import { RequireLogin } from "@/components/practice/require-login";

/** Các công cụ tu tập cần đăng nhập; trang tổng quan /tu-tap thì không (xem RequireLogin). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <RequireLogin>{children}</RequireLogin>;
}
