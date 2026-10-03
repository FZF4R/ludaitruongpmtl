/**
 * Sự kiện theo ngày dương (DayEvent): kiểm tra dữ liệu vào và định dạng trả ra.
 */
const NGAY = /^\d{4}-\d{2}-\d{2}$/
const TIEU_DE_TOI_DA = 80
const NOI_DUNG_TOI_DA = 3000

const linkAnhHopLe = u => !u || /^(https?:\/\/|\/v1\/public\/media\/)/i.test(u)

/** Trả { ban } hoặc { loi }. */
const chuanHoaSuKienNgay = inputs => {
    let date = String(inputs.date || '').trim()
    let d = new Date(`${date}T00:00:00Z`)
    if (!NGAY.test(date) || isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== date) return { loi: true }
    let title = String(inputs.title || '').trim().slice(0, TIEU_DE_TOI_DA)
    if (!title) return { loi: true }
    let imageUrl = String(inputs.imageUrl || '').trim().slice(0, 500)
    if (!linkAnhHopLe(imageUrl)) return { loi: true }
    let body = String(inputs.body || '').replace(/\r/g, '').trim().slice(0, NOI_DUNG_TOI_DA)

    return { ban: { date, title, imageUrl, body } }
}

const dinhDangSuKienNgay = e => ({
    id: String(e.id || e._id),
    date: e.date,
    title: e.title,
    imageUrl: e.imageUrl || '',
    body: e.body || ''
})

module.exports = { chuanHoaSuKienNgay, dinhDangSuKienNgay, TIEU_DE_TOI_DA, NOI_DUNG_TOI_DA }
