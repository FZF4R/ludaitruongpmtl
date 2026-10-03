/**
 * Tạo 5 lời cầu an / cầu siêu mẫu, đã được duyệt nổi bật (featured), để
 * slideshow lời nguyện ở trang chủ có nội dung ngay từ đầu.
 *
 *   node tools/seed-prayers.js          xem sẽ tạo gì, KHÔNG ghi
 *   node tools/seed-prayers.js --ghi    ghi thật
 *
 * Gán cho tài khoản Admin đầu tiên nhưng để ẨN DANH (hiện là "Một Phật tử"),
 * đặt ngày viết lùi vài ngày trước - để không chiếm lượt "mỗi ngày một lời"
 * của ai và không làm sai số "lời nguyện hôm nay".
 *
 * Chạy nhiều lần vô hại: lời nào trùng nội dung đã có thì bỏ qua. Xoá lời mẫu
 * thì ẩn / bỏ nổi bật ngay trên trang chủ như lời bình thường.
 */
const path = require('path')
const sails = require(path.resolve(__dirname, '..', 'node_modules', 'sails'))

const GHI = process.argv.includes('--ghi')
const MOT_NGAY = 86400000

const MAU = [
    { kind: 'cau-an', body: 'Nguyện cầu Chư Phật, Bồ Tát gia hộ cho gia đình con thân tâm an lạc, mạnh khoẻ, mọi việc hanh thông.' },
    { kind: 'cau-an', body: 'Con nguyện cầu cho cha mẹ được sức khoẻ dồi dào, phiền não tiêu trừ, phước thọ tăng trưởng.' },
    { kind: 'cau-sieu', body: 'Nguyện cầu hương linh người thân đã khuất sớm được siêu sinh tịnh độ, vãng sanh về cõi an lành.' },
    { kind: 'cau-an', body: 'Con nguyện mỗi ngày tinh tấn tu tập, giữ tâm thanh tịnh, sống từ bi và biết buông xả.' },
    { kind: 'cau-an', body: 'Nguyện cho tất cả chúng sinh thoát khỏi khổ đau, thế giới hoà bình, muôn loài an vui.' }
]

/** "YYYY-MM-DD" theo giờ Việt Nam - cùng quy ước với api/utils/loiNguyen.js. */
const ngayVN = ms => new Date(ms + 7 * 3600 * 1000).toISOString().slice(0, 10)

sails.load({ hooks: { sockets: false, pubsub: false, grunt: false }, log: { level: 'error' } }, async err => {
    if (err) {
        console.error('Không nạp được Sails:', err.message || err)
        process.exit(1)
    }

    try {
        let admin = (await Users.find({ where: { role: 'Admin' }, limit: 1 }))[0]
        if (!admin) throw new Error('Chưa có tài khoản Admin nào để gán lời nguyện mẫu.')

        console.log(GHI ? 'Chế độ GHI THẬT.' : 'Chạy thử - thêm --ghi để ghi thật.')
        let them = 0
        let boQua = 0

        for (let i = 0; i < MAU.length; i++) {
            let mau = MAU[i]
            // Trùng nội dung VÀ đã là lời nổi bật mới coi là "đã có" - người dùng có thể
            // tự viết đúng câu này (lời thật của họ thì không đụng tới).
            if (await Prayer.findOne({ body: mau.body, featured: true })) {
                boQua++
                continue
            }
            // Lùi 1..5 ngày, lời đầu danh sách là mới nhất.
            let luc = Date.now() - (i + 1) * MOT_NGAY

            if (GHI) {
                let moi = await Prayer.create({
                    userId: String(admin.id),
                    kind: mau.kind,
                    body: mau.body,
                    anonymous: true,
                    dayKey: ngayVN(luc),
                    featured: true,
                    featuredBy: String(admin.id)
                }).fetch()
                // Waterline tự đặt createdAt = bây giờ; chỉnh lại cho khớp ngày viết.
                await Prayer.updateOne({ id: moi.id }).set({ createdAt: luc, updatedAt: luc })
            }
            console.log(`  THÊM    [${mau.kind}] ${mau.body.slice(0, 60)}…`)
            them++
        }

        console.log(`Xong: thêm ${them} | bỏ qua ${boQua}`)
    } catch (e) {
        console.error('Lỗi:', e.message || e)
        process.exitCode = 1
    }

    sails.lower(() => process.exit())
})
