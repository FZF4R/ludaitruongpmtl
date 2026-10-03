import type { Metadata } from "next";
import { RolesPanel } from "@/components/admin/roles-panel";

export const metadata: Metadata = { title: "Phân quyền" };

/**
 * Chỉnh quyền của từng vai trò (quyền `role.permissions.manage`).
 *
 * Quản lý luôn đủ quyền và không sửa được; mỗi người chỉ chỉnh được vai trò
 * thấp bậc hơn mình và chỉ cấp được quyền chính mình đang có.
 */
export default function AdminRolesPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl font-bold tracking-tight">Phân quyền</h1>
        <p className="max-w-3xl text-sm text-muted">
          Tick ô nào thì vai trò đó có quyền đó; mỗi vai trò độc lập, không tự kế thừa bậc dưới.
          Thay đổi có hiệu lực ngay với mọi tài khoản mang vai trò đó. Quyền gắn nhãn “chưa dùng”
          chưa có chức năng nào kiểm tra.
        </p>
      </div>

      <RolesPanel />
    </div>
  );
}
