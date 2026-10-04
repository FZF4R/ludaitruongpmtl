"use client";

import * as React from "react";
import Link from "next/link";
import { Ban, ShieldAlert, ShieldCheck, ShieldMinus, Trash2, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { HopLoi, chuLoi, useLocale } from "@/components/admin/admin-shell";
import {
  canhCao,
  giamCanhCao,
  khoaTaiKhoan,
  layKyLuat,
  moKhoaTaiKhoan,
  xoaHanBinhLuan,
  type KyLuatNguoiDung,
} from "@/lib/admin-api";
import { localePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Khối "Kỷ luật" trong chi tiết người dùng (/admin/user): số lần cảnh cáo,
 * trạng thái khoá, các bình luận bị giữ lại vì chứa từ cấm, nhật ký xử lý.
 *
 *   - Cảnh cáo: tối đa 5 lần, mỗi lần người đó nhận một thông báo kèm lý do.
 *   - Khoá: tài khoản không đăng nhập, không đăng ký lại được nữa, phiên đang
 *     mở bị đẩy ra trang "Tài khoản đã bị khoá" ngay ở lần gọi API kế tiếp.
 *   - Mở khoá: trả lại quyền đăng nhập; số lần cảnh cáo giữ nguyên.
 *
 * Chỉ hiện với người có `moderation.manage`; backend kiểm lại quyền và luật
 * "chỉ xử lý được người bậc thấp hơn mình".
 */

const nhanHanhDong: Record<KyLuatNguoiDung["log"][number]["action"], string> = {
  warn: "Cảnh cáo",
  unwarn: "Giảm cảnh cáo",
  approve: "Duyệt nội dung bị giữ",
  reject: "Từ chối nội dung bị giữ",
  ban: "Khoá tài khoản",
  unban: "Mở khoá",
  "delete-comment": "Xoá hẳn bình luận",
};

export function DisciplinePanel({ userId, binhLuanId }: { userId: string; binhLuanId?: string | null }) {
  const locale = useLocale();
  const [kl, setKl] = React.useState<KyLuatNguoiDung | null>(null);
  const [loi, setLoi] = React.useState("");
  const [lyDo, setLyDo] = React.useState("");
  const [ban, setBan] = React.useState(false);

  const nap = React.useCallback(() => {
    layKyLuat(userId, locale)
      .then(setKl)
      .catch((err) => setLoi(chuLoi(err, "Không tải được thông tin kỷ luật.")));
  }, [userId, locale]);

  React.useEffect(nap, [nap]);

  // Mở từ một bình luận vi phạm: cuộn tới đúng bình luận đó.
  React.useEffect(() => {
    if (!kl || !binhLuanId) return;
    document.getElementById(`vi-pham-${binhLuanId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [kl, binhLuanId]);

  const chay = async (viec: () => Promise<unknown>) => {
    setBan(true);
    setLoi("");
    try {
      await viec();
      setLyDo("");
      nap();
    } catch (err) {
      setLoi(chuLoi(err));
    } finally {
      setBan(false);
    }
  };

  if (!kl) {
    return loi ? <HopLoi loi={loi} /> : <p className="text-sm text-muted">Đang tải thông tin kỷ luật…</p>;
  }

  const hetCanhCao = kl.warningCount >= kl.maxWarnings;

  return (
    <div className="flex flex-col gap-4 border-t border-line pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <ShieldAlert className="size-4 text-lacquer" aria-hidden /> Kỷ luật
        </h3>
        {kl.banned ? (
          <Badge className="bg-lacquer/15 text-lacquer">Đã khoá</Badge>
        ) : (
          <Badge tone="accent">Đang hoạt động</Badge>
        )}
      </div>

      {/* Số lần cảnh cáo: 5 ô, tô đỏ số ô đã dùng. */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted">Cảnh cáo</span>
        <span className="flex gap-1" aria-label={`${kl.warningCount}/${kl.maxWarnings} lần cảnh cáo`}>
          {Array.from({ length: kl.maxWarnings }, (_, i) => (
            <span
              key={i}
              className={cn("h-2 w-6 rounded-full", i < kl.warningCount ? "bg-lacquer" : "bg-surface-2")}
            />
          ))}
        </span>
        <span className="tabular-nums text-ink">
          {kl.warningCount}/{kl.maxWarnings}
        </span>
      </div>

      {kl.banned ? (
        <p className="rounded-md bg-lacquer/10 p-3 text-sm text-lacquer">
          Khoá lúc {new Date(kl.bannedAt).toLocaleString("vi-VN")}
          {kl.bannedReason ? ` — ${kl.bannedReason}` : ""}
        </p>
      ) : null}

      <HopLoi loi={loi} />

      {kl.canAct ? (
        <div className="flex flex-col gap-2">
          <Input
            value={lyDo}
            onChange={(e) => setLyDo(e.target.value)}
            maxLength={300}
            placeholder="Lý do (người dùng sẽ thấy khi bị cảnh cáo)"
            aria-label="Lý do xử lý"
          />
          <div className="flex flex-wrap gap-2">
            {!kl.banned ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={ban || hetCanhCao}
                  title={hetCanhCao ? "Đã đủ 5 lần cảnh cáo" : undefined}
                  onClick={() => chay(() => canhCao(kl.id, lyDo, locale))}
                >
                  <TriangleAlert aria-hidden /> Cảnh cáo ({kl.warningCount + 1 > kl.maxWarnings ? kl.maxWarnings : kl.warningCount + 1}/{kl.maxWarnings})
                </Button>
                {kl.warningCount > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={ban}
                    title="Gỡ một lần cảnh cáo (cảnh cáo nhầm, người dùng đã sửa đổi)"
                    onClick={() => chay(() => giamCanhCao(kl.id, lyDo, locale))}
                  >
                    <ShieldMinus aria-hidden /> Giảm cảnh cáo ({kl.warningCount - 1}/{kl.maxWarnings})
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  className="bg-lacquer text-white hover:bg-lacquer/90"
                  disabled={ban}
                  onClick={() => {
                    if (
                      confirm(
                        `Khoá tài khoản ${kl.name || kl.username}?\n\nNgười này sẽ không đăng nhập, không đăng ký lại được bằng tài khoản / email này.`,
                      )
                    ) {
                      void chay(() => khoaTaiKhoan(kl.id, lyDo, locale));
                    }
                  }}
                >
                  <Ban aria-hidden /> Khoá tài khoản
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={ban}
                onClick={() => {
                  if (confirm(`Mở khoá tài khoản ${kl.name || kl.username}?`)) {
                    void chay(() => moKhoaTaiKhoan(kl.id, lyDo, locale));
                  }
                }}
              >
                <ShieldCheck aria-hidden /> Mở khoá
              </Button>
            )}
          </div>
          {hetCanhCao && !kl.banned ? (
            <p className="text-xs text-lacquer">Đã đủ 5 lần cảnh cáo — bước tiếp theo là khoá tài khoản.</p>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted">
          Bạn không xử lý được tài khoản này (chính mình, hoặc vai trò ngang / cao hơn bạn).
        </p>
      )}

      {kl.flaggedComments.length ? (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Bình luận bị giữ lại ({kl.flaggedComments.length})
          </h4>
          <ul className="flex flex-col gap-2">
            {kl.flaggedComments.map((bl) => (
              <li
                key={bl.id}
                id={`vi-pham-${bl.id}`}
                className={cn(
                  "flex flex-col gap-1 rounded-md border border-line p-2.5 text-sm",
                  bl.id === binhLuanId && "border-lacquer bg-lacquer/5",
                )}
              >
                <p className="whitespace-pre-line text-body">{bl.body}</p>
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  <span className="text-lacquer">Từ cấm: {bl.flaggedWords.join(", ")}</span>
                  {bl.content.slug ? (
                    <Link
                      href={`${localePath(locale, `/bai-viet/${bl.content.slug}`)}#binh-luan`}
                      target="_blank"
                      className="hover:text-accent hover:underline"
                    >
                      ở “{bl.content.title}”
                    </Link>
                  ) : null}
                  <span>{new Date(bl.createdAt).toLocaleString("vi-VN")}</span>
                  <button
                    type="button"
                    disabled={ban}
                    onClick={() => {
                      if (confirm("Xoá hẳn bình luận này khỏi hệ thống?")) {
                        void chay(() => xoaHanBinhLuan(bl.id, locale));
                      }
                    }}
                    className="ml-auto flex items-center gap-1 text-lacquer hover:underline"
                  >
                    <Trash2 className="size-3.5" aria-hidden /> Xoá hẳn
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {kl.log.length ? (
        <div className="flex flex-col gap-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Nhật ký xử lý</h4>
          <ol className="flex flex-col gap-1 text-xs">
            {kl.log.map((l) => (
              <li key={l.id} className="text-muted">
                <span className="font-medium text-ink">{nhanHanhDong[l.action] ?? l.action}</span>
                {" · "}
                {l.actorName}
                {" · "}
                {new Date(l.createdAt).toLocaleString("vi-VN")}
                {l.reason ? ` — ${l.reason}` : ""}
                {l.commentBody ? ` — “${l.commentBody.slice(0, 80)}”` : ""}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
