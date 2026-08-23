"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Ô nhập liệu dùng chung cho form hồ sơ.
 *
 * Không kéo thêm thư viện form: cả dự án chỉ có đúng một biểu mẫu, và nó chỉ
 * cần state phẳng cộng một phép kiểm tra rỗng. Một thư viện validation ở đây
 * là mấy chục kilobyte gửi xuống trình duyệt cho một trang mà người dùng ghé
 * đúng một lần.
 */

const oNhap =
  "h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted disabled:opacity-60";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(oNhap, className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(oNhap, "pr-8", className)} {...props} />;
}

/**
 * Nhãn + gợi ý + ô nhập.
 *
 * `hint` nối vào ô bằng aria-describedby chứ không chỉ đặt cạnh cho đẹp: trình
 * đọc màn hình phải đọc được "Pháp danh — tên được đặt khi quy y" cùng lúc với
 * lúc con trỏ nhảy vào ô, không phải đi tìm dòng chữ nhỏ bên dưới.
 */
export function Field({
  id,
  label,
  hint,
  required,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: (props: { id: string; "aria-describedby"?: string }) => React.ReactNode;
  className?: string;
}) {
  const idGoiY = hint ? `${id}-goi-y` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="ml-0.5 text-lacquer" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children({ id, "aria-describedby": idGoiY })}
      {hint ? (
        <p id={idGoiY} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export type LuaChon = { id: string; nhan: string };

/**
 * Một câu hỏi trắc nghiệm, hiện dưới dạng các viên chip bấm được.
 *
 * Vẫn là <input type="radio"/"checkbox"> thật nằm trong <fieldset>, chỉ ẩn đi
 * bằng sr-only rồi vẽ lại bằng peer-checked. Nhờ vậy bàn phím, trình đọc màn
 * hình và cả việc gộp nhóm theo <legend> đều hoạt động như mặc định của trình
 * duyệt — thứ mà một đống <button> tự vẽ sẽ phải làm lại từ đầu và thường quên.
 *
 * Mọi câu đều được phép bỏ trống, nên bấm lại lựa chọn đang chọn thì bỏ chọn
 * nó. Với radio, hành vi đó không có sẵn: click vào ô đã chọn không kích hoạt
 * onChange, nên phải bắt ở onClick.
 */
export function ChoiceGroup({
  ten,
  cauHoi,
  moTa,
  luaChon,
  giaTri,
  onDoi,
  nhieu = false,
}: {
  ten: string;
  cauHoi: string;
  moTa?: string;
  luaChon: LuaChon[];
  giaTri: string | string[];
  onDoi: (giaTriMoi: string | string[]) => void;
  nhieu?: boolean;
}) {
  const daChonList = Array.isArray(giaTri) ? giaTri : [giaTri];

  const doi = (id: string, dangChon: boolean) => {
    if (!nhieu) {
      onDoi(dangChon ? "" : id);
      return;
    }

    onDoi(dangChon ? daChonList.filter((x) => x !== id) : [...daChonList, id]);
  };

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="text-sm font-medium text-ink">
        {cauHoi}
        {moTa ? <span className="ml-1.5 font-normal text-muted">({moTa})</span> : null}
      </legend>

      <div className="flex flex-wrap gap-2">
        {luaChon.map((item) => {
          const dangChon = daChonList.includes(item.id);

          return (
            <label key={item.id} className="cursor-pointer">
              <input
                type={nhieu ? "checkbox" : "radio"}
                name={ten}
                value={item.id}
                checked={dangChon}
                onChange={() => doi(item.id, false)}
                onClick={() => {
                  if (!nhieu && dangChon) doi(item.id, true);
                }}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "inline-flex items-center rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-body shadow-card transition-colors",
                  "hover:border-line-strong hover:text-ink",
                  "peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:font-medium peer-checked:text-accent",
                  "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                )}
              >
                {item.nhan}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
