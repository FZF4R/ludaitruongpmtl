/**
 * So sánh văn bản cho màn hình lịch sử sửa bài.
 *
 * Thuật toán LCS (dãy con chung dài nhất) trên mảng token. Đủ cho bài pháp
 * thoại vài nghìn chữ vì ta so theo HAI TẦNG: so từng đoạn trước (vài chục
 * đến vài trăm đoạn), rồi chỉ so từng chữ bên trong những đoạn bị sửa. So cả
 * bài theo từng chữ một lượt là bảng vài triệu ô - chậm và tốn bộ nhớ vô ích.
 */

export type PhepSo = { loai: "giu" | "xoa" | "them"; giaTri: string };

/** Quá ngưỡng này thì không so chi tiết nữa, coi như thay cả khối. */
const TRAN_O = 2_500_000;

export function soMang(cu: string[], moi: string[]): PhepSo[] {
  // Cắt phần đầu/cuối giống nhau trước: phần lớn lần sửa chỉ chạm vài chỗ,
  // bảng LCS nhờ vậy nhỏ đi rất nhiều.
  let dau = 0;
  while (dau < cu.length && dau < moi.length && cu[dau] === moi[dau]) dau++;
  let cuoi = 0;
  while (
    cuoi < cu.length - dau &&
    cuoi < moi.length - dau &&
    cu[cu.length - 1 - cuoi] === moi[moi.length - 1 - cuoi]
  ) {
    cuoi++;
  }

  const a = cu.slice(dau, cu.length - cuoi);
  const b = moi.slice(dau, moi.length - cuoi);
  const giua: PhepSo[] = [];

  if (a.length * b.length > TRAN_O) {
    a.forEach((giaTri) => giua.push({ loai: "xoa", giaTri }));
    b.forEach((giaTri) => giua.push({ loai: "them", giaTri }));
  } else {
    // bang[i][j] = độ dài LCS của a[i..] và b[j..], trải phẳng một chiều.
    const n = a.length;
    const m = b.length;
    const bang = new Uint32Array((n + 1) * (m + 1));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        bang[i * (m + 1) + j] =
          a[i] === b[j]
            ? bang[(i + 1) * (m + 1) + j + 1] + 1
            : Math.max(bang[(i + 1) * (m + 1) + j], bang[i * (m + 1) + j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) {
        giua.push({ loai: "giu", giaTri: a[i] });
        i++;
        j++;
      } else if (bang[(i + 1) * (m + 1) + j] >= bang[i * (m + 1) + j + 1]) {
        giua.push({ loai: "xoa", giaTri: a[i++] });
      } else {
        giua.push({ loai: "them", giaTri: b[j++] });
      }
    }
    while (i < n) giua.push({ loai: "xoa", giaTri: a[i++] });
    while (j < m) giua.push({ loai: "them", giaTri: b[j++] });
  }

  return [
    ...cu.slice(0, dau).map((giaTri) => ({ loai: "giu" as const, giaTri })),
    ...giua,
    ...cu.slice(cu.length - cuoi).map((giaTri) => ({ loai: "giu" as const, giaTri })),
  ];
}

/** Tách chữ, GIỮ khoảng trắng làm token riêng để ghép lại đúng như gốc. */
export const tachChu = (s: string) => s.split(/(\s+)/).filter(Boolean);

/** So hai chuỗi theo từng chữ. */
export const soChu = (cu: string, moi: string) => soMang(tachChu(cu), tachChu(moi));

/**
 * HTML thân bài -> danh sách đoạn chữ thuần, để so phần người đọc thấy chứ
 * không phải thẻ. Chạy ở trình duyệt (DOMParser) nên không chạy script nào.
 */
export function htmlSangDoan(html: string): string[] {
  if (!html) return [];
  const coDong = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|h[1-6]|li|blockquote|tr|pre)\s*>/gi, "\n");
  const text = new DOMParser().parseFromString(coDong, "text/html").body.textContent ?? "";

  return text
    .split("\n")
    .map((d) => d.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * Một khối trong bản so theo đoạn. Đoạn sửa (một đoạn bị xoá đứng ngay trước
 * một đoạn được thêm) được ghép thành "sua" và so tiếp theo từng chữ.
 */
export type KhoiDoan =
  | { loai: "giu"; doan: string }
  | { loai: "xoa"; doan: string }
  | { loai: "them"; doan: string }
  | { loai: "sua"; chu: PhepSo[] };

export function soDoan(cu: string[], moi: string[]): KhoiDoan[] {
  const phep = soMang(cu, moi);
  const kq: KhoiDoan[] = [];

  for (let i = 0; i < phep.length; i++) {
    const p = phep[i];
    if (p.loai === "giu") {
      kq.push({ loai: "giu", doan: p.giaTri });
      continue;
    }
    // Gom một cụm xoá liền nhau và cụm thêm liền sau nó, rồi ghép cặp từng đoạn.
    const xoa: string[] = [];
    const them: string[] = [];
    while (i < phep.length && phep[i].loai === "xoa") xoa.push(phep[i++].giaTri);
    while (i < phep.length && phep[i].loai === "them") them.push(phep[i++].giaTri);
    i--;

    const cap = Math.min(xoa.length, them.length);
    for (let k = 0; k < cap; k++) kq.push({ loai: "sua", chu: soChu(xoa[k], them[k]) });
    xoa.slice(cap).forEach((doan) => kq.push({ loai: "xoa", doan }));
    them.slice(cap).forEach((doan) => kq.push({ loai: "them", doan }));
  }

  return kq;
}
