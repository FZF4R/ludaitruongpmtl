"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { ChoiceGroup, Field, Input, Select } from "@/components/ui/form";
import { localePath, splitLocale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import { LoiApi, docToken, layHoSo, luuHoSo } from "@/lib/auth";
import { cauHoi, ngayChay, type KhaoSat, type KhoaCauHoi } from "@/lib/survey";
import { QUE_QUAN_KHAC, nhomTinhThanh } from "@/lib/vietnam-address";

/**
 * Form khai hồ sơ Phật tử, hiện ngay sau lần đăng nhập đầu tiên.
 *
 * Cũng chính là form sửa hồ sơ về sau: nạp dữ liệu đang có rồi ghi đè toàn bộ
 * khi lưu. Không tách hai màn hình "tạo" và "sửa" cho một biểu mẫu chín câu —
 * hai bản sao của cùng một danh sách câu hỏi chắc chắn sẽ lệch nhau.
 *
 * Trang này không chặn được ở tầng server: token nằm trong localStorage của
 * trình duyệt (xem lib/auth.ts), nên server không biết ai đang xem. Vì vậy
 * kiểm tra ngay lúc gắn component, và trong lúc chờ thì hiện khung tải chứ
 * không hiện form rỗng rồi giật.
 */

type TrangThai = "dangTai" | "chuaDangNhap" | "san";

export function OnboardingForm({
  nhan,
  nhanAuth,
}: {
  nhan: Dictionary["onboarding"];
  nhanAuth: Pick<Dictionary["auth"], "loading" | "title">;
}) {
  const router = useRouter();
  const { locale } = splitLocale(usePathname());
  const lp = (href: string) => localePath(locale, href);

  const [trangThai, setTrangThai] = React.useState<TrangThai>("dangTai");
  const [dangLuu, setDangLuu] = React.useState(false);
  const [loi, setLoi] = React.useState("");

  const [hoTen, setHoTen] = React.useState("");
  const [phapDanh, setPhapDanh] = React.useState("");
  const [bietDanh, setBietDanh] = React.useState("");
  const [tinhThanh, setTinhThanh] = React.useState("");
  const [chiTiet, setChiTiet] = React.useState("");
  const [khaoSat, setKhaoSat] = React.useState<KhaoSat>({});

  React.useEffect(() => {
    if (!docToken()) {
      setTrangThai("chuaDangNhap");
      return;
    }

    let conSong = true;
    layHoSo(locale)
      .then((hoSo) => {
        if (!conSong) return;

        // Lần đầu thì các trường rỗng; lần sửa sau thì đây là dữ liệu đang có.
        setHoTen(hoSo.fullName);
        setPhapDanh(hoSo.dharmaName);
        setBietDanh(hoSo.nickname);
        setTinhThanh(hoSo.hometown.province ?? "");
        setChiTiet(hoSo.hometown.detail ?? "");
        setKhaoSat(hoSo.survey ?? {});
        setTrangThai("san");
      })
      .catch((err) => {
        if (!conSong) return;
        // 401 nghĩa là token hết hạn hoặc bị thu hồi -> coi như chưa đăng nhập.
        setTrangThai(err instanceof LoiApi && err.status === 401 ? "chuaDangNhap" : "san");
      });

    return () => {
      conSong = false;
    };
  }, [locale]);

  function datDapAn(khoa: KhoaCauHoi, giaTri: string | string[]) {
    setKhaoSat((cu) => {
      const moi = { ...cu, [khoa]: giaTri } as KhaoSat;
      // Bỏ "ăn chay kỳ" thì số ngày chay không còn nghĩa gì.
      if (khoa === "diet" && giaTri !== "periodic") delete moi.vegDaysPerMonth;
      return moi;
    });
  }

  async function guiForm(e: React.FormEvent) {
    e.preventDefault();

    const ten = hoTen.trim();
    if (!ten) {
      setLoi(nhan.nameRequired);
      return;
    }

    setLoi("");
    setDangLuu(true);

    try {
      await luuHoSo(
        {
          fullName: ten,
          dharmaName: phapDanh.trim(),
          nickname: bietDanh.trim(),
          hometown: {
            province: tinhThanh,
            detail: chiTiet.trim(),
          },
          survey: khaoSat,
        },
        locale,
      );

      router.replace(lp("/tai-khoan"));
    } catch (err) {
      setLoi((err instanceof LoiApi && err.thongDiep) || nhan.error);
      setDangLuu(false);
    }
  }

  if (trangThai === "dangTai") {
    return <p className="text-sm text-muted">{nhanAuth.loading}</p>;
  }

  if (trangThai === "chuaDangNhap") {
    return (
      <Card className="flex max-w-lg flex-col items-start gap-4 p-6">
        <p className="text-sm text-muted">{nhan.signInFirst}</p>
        <Button asChild>
          <Link href={lp("/dang-nhap")}>{nhanAuth.title}</Link>
        </Button>
      </Card>
    );
  }

  // Nhãn lựa chọn tra theo id nên phải nới kiểu: mỗi câu hỏi có một bộ khoá
  // riêng, TypeScript không thu hẹp được `options[key][id]` về một chuỗi.
  const tuyChon = nhan.options as unknown as Record<string, Record<string, string>>;

  return (
    <form onSubmit={guiForm} className="flex flex-col gap-8">
      <Card className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-xl font-bold">{nhan.sectionProfile}</h2>
          <p className="text-sm text-muted">{nhan.sectionProfileDesc}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="ho-ten" label={nhan.fullName} required className="sm:col-span-2">
            {(p) => (
              <Input
                {...p}
                value={hoTen}
                onChange={(e) => setHoTen(e.target.value)}
                autoComplete="name"
                maxLength={80}
                required
              />
            )}
          </Field>

          <Field id="phap-danh" label={nhan.dharmaName} hint={nhan.dharmaNameHint}>
            {(p) => (
              <Input
                {...p}
                value={phapDanh}
                onChange={(e) => setPhapDanh(e.target.value)}
                maxLength={80}
              />
            )}
          </Field>

          <Field id="biet-danh" label={nhan.nickname} hint={nhan.nicknameHint}>
            {(p) => (
              <Input
                {...p}
                value={bietDanh}
                onChange={(e) => setBietDanh(e.target.value)}
                autoComplete="nickname"
                maxLength={40}
              />
            )}
          </Field>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-ink">{nhan.hometown}</h3>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="tinh-thanh" label={nhan.province}>
              {(p) => (
                <Select
                  {...p}
                  value={tinhThanh}
                  onChange={(e) => setTinhThanh(e.target.value)}
                >
                  <option value="">{nhan.choose}</option>
                  {nhomTinhThanh.map((nhom) => (
                    <optgroup key={nhom.key} label={nhan[nhom.key]}>
                      {nhom.items.map((ten) => (
                        <option key={ten} value={ten}>
                          {ten}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value={QUE_QUAN_KHAC}>{QUE_QUAN_KHAC}</option>
                </Select>
              )}
            </Field>

            <Field
              id="chi-tiet"
              label={nhan.addressDetail}
              hint={nhan.addressDetailHint}
            >
              {(p) => (
                <Input
                  {...p}
                  value={chiTiet}
                  onChange={(e) => setChiTiet(e.target.value)}
                  maxLength={160}
                />
              )}
            </Field>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-xl font-bold">{nhan.sectionSurvey}</h2>
          <p className="text-sm text-muted">{nhan.sectionSurveyDesc}</p>
        </div>

        {cauHoi.map((cau) => {
          const dapAn = khaoSat[cau.key];

          return (
            <React.Fragment key={cau.key}>
              <ChoiceGroup
                ten={cau.key}
                cauHoi={nhan.questions[cau.key]}
                moTa={cau.nhieu ? nhan.multiHint : undefined}
                nhieu={cau.nhieu}
                giaTri={
                  cau.nhieu
                    ? ((dapAn as string[] | undefined) ?? [])
                    : ((dapAn as string | undefined) ?? "")
                }
                onDoi={(giaTri) => datDapAn(cau.key, giaTri)}
                luaChon={cau.options.map((id) => ({
                  id,
                  nhan: tuyChon[cau.key][id],
                }))}
              />

              {/* Số ngày chay chỉ hỏi khi đã chọn "ăn chay kỳ". */}
              {cau.key === "diet" && khaoSat.diet === "periodic" ? (
                <ChoiceGroup
                  ten="vegDaysPerMonth"
                  cauHoi={nhan.vegDays}
                  giaTri={
                    khaoSat.vegDaysPerMonth ? String(khaoSat.vegDaysPerMonth) : ""
                  }
                  onDoi={(giaTri) =>
                    setKhaoSat((cu) => ({
                      ...cu,
                      vegDaysPerMonth: giaTri ? Number(giaTri) : undefined,
                    }))
                  }
                  luaChon={ngayChay.map((so) => ({
                    id: String(so),
                    nhan: tuyChon.vegDays[String(so)],
                  }))}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </Card>

      {loi ? (
        <p role="alert" className="text-sm text-lacquer">
          {loi}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={dangLuu}>
          {dangLuu ? nhan.saving : nhan.submit}
        </Button>
        <Button type="button" variant="ghost" asChild>
          <Link href={lp("/tai-khoan")}>{nhan.skip}</Link>
        </Button>
      </div>
    </form>
  );
}
