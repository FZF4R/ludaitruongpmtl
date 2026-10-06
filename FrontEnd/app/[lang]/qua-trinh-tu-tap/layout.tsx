import { RequireLogin } from "@/components/practice/require-login";

/** Nhật ký tu tập là của riêng từng người: bắt đăng nhập trước (xem RequireLogin). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <RequireLogin>{children}</RequireLogin>;
}
