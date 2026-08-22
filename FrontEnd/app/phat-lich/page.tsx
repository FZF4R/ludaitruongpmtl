import { redirect } from "next/navigation";

/**
 * /phat-lich luôn chuyển sang tháng hiện tại theo giờ Việt Nam.
 *
 * force-dynamic vì "tháng hiện tại" thay đổi theo thời điểm truy cập —
 * nếu cache trang này thì sang tháng sau nó vẫn đẩy người dùng về
 * tháng cũ. Bản thân trang đích mới là trang được sinh tĩnh.
 */
export const dynamic = "force-dynamic";

export default function CalendarIndexPage() {
  const now = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .split("-");

  redirect(`/phat-lich/${now[0]}/${Number(now[1])}`);
}
