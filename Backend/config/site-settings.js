/**
 * Cấu hình hiển thị của site
 * (sails.config.siteSettings)
 *
 * Bản ghi `SystemSettings` id PUBLIC_ID quyết định tiêu đề, dải thông báo và
 * bảng màu của trang. Tệp này giữ giá trị mặc định cho lần chạy đầu, cộng vài
 * hàm thuần mà cả endpoint công khai lẫn trang quản trị đều dùng.
 *
 * Vì sao nằm ở config chứ không trong controller: hai controller cần chung
 * những thứ này (`System/Public/PublicController` để trả cho FrontEnd,
 * `System/Admin/SystemController` để sửa). Chép sang cả hai nơi là cách chắc
 * chắn nhất để chúng lệch nhau.
 */

/**
 * Thiền ngữ hiện trên dải thông báo đầu trang chủ.
 *
 * Đây chỉ là dữ liệu SEED - sau khi bản ghi cấu hình đã được tạo thì nguồn
 * thật là cột `notify` trong CSDL, quản trị viên sửa qua trang /admin/dashboard.
 * Sửa mảng dưới đây KHÔNG đổi được nội dung của một cài đặt đang chạy.
 */
const THIEN_NGU = [
    'Thấy vô thường để lòng thôi chấp niệm, hiểu nhân quả để tâm biết hướng thiện, học từ bi để đời bớt khổ đau.',
    'Giữa cõi nhân sinh vô thường, giữ một tâm thanh tịnh, gieo một niệm thiện lành và bước đi bằng lòng từ bi.',
    'Học Phật không phải để cầu đời hết khổ, mà để hiểu bản chất của khổ đau và tìm thấy con đường trở về với chính mình.',
    'Khi thấu hiểu nhân duyên, ta không còn oán trách; khi hiểu được vô thường, ta biết trân quý từng khoảnh khắc hiện tại.',
    'Một đời tu tâm, không cầu hơn người, chỉ nguyện thắng được tham sân si trong chính tâm mình.',
    'Buông không phải là mất đi, mà là học cách nhìn mọi sự đến rồi đi theo đúng nhân duyên của nó.',
    'Tâm sinh cảnh, cảnh tùy tâm; giữ lòng thanh tịnh giữa thế gian, tự nhiên có thể tìm thấy bình an giữa muôn vàn biến động.',
    'Gieo một hạt từ bi hôm nay, có thể chưa thấy quả lành ngày mai, nhưng tâm người gieo đã nhẹ đi một phần.',
    'Đời người như giấc mộng, vạn sự đều theo duyên mà đến; chỉ có tâm mình là nơi cần được trở về và soi sáng.',
    'Hiểu vô thường để không níu giữ, hiểu nhân quả để không oán trách, hiểu từ bi để biết tha thứ và bao dung.',
    'Khi lòng còn tham cầu, bình an vẫn ở rất xa; khi biết đủ và biết buông, một khoảng trời an nhiên tự nhiên hiện hữu.',
    'Tu hành không nằm ở hình thức bên ngoài, mà nằm trong từng ý nghĩ, từng lời nói và từng việc thiện ta làm mỗi ngày.',
    'Một niệm sân có thể thiêu đốt công đức, một niệm từ bi có thể hóa giải oán kết và mở ra con đường bình an.',
    'Đừng cầu cuộc đời thuận theo ý mình, hãy tu một tâm đủ vững để thuận duyên mà sống, nghịch cảnh mà không loạn.',
    'Người hiểu đạo không tìm cách thay đổi thế gian, mà trước hết quay về soi lại chính mình, sửa tâm và chuyển nghiệp.',
    'Có duyên thì gặp, hết duyên thì xa; có hợp thì thương, có tan thì học cách mỉm cười và trả mọi thứ về đúng nhân duyên.',
    'Tâm còn chấp thì một chiếc lá rơi cũng thành phiền muộn; tâm đã an thì giữa phong ba vẫn giữ được một khoảng trời tĩnh lặng.',
    'Phật pháp không đưa ta rời khỏi cuộc đời, mà dạy ta bước giữa cuộc đời với trí tuệ sáng suốt, lòng từ bi và tâm không vướng mắc.',
    'Mỗi khổ đau đều mang theo một bài học, mỗi nghịch duyên đều là cơ hội nhìn lại chính mình và trưởng dưỡng trí tuệ.',
    'Khi biết quay về với hơi thở, nhìn sâu vào tâm mình và buông xuống những điều không còn thuộc về mình, bình an sẽ hiện tiền.',
    'Đời là dòng nước chảy, người là kẻ qua sông; đừng vì một đoạn đường mà quên mất bản chất vô thường của kiếp nhân sinh.',
    'Không cầu người khác hiểu mình, không trách cuộc đời bạc bẽo, chỉ lặng lẽ tu tâm và sống sao cho không thẹn với chính mình.',
    'Từ bi với người, bao dung với lỗi lầm, tỉnh thức với từng ý niệm và thanh tịnh với chính tâm mình, ấy là con đường trở về.',
    'Một đời người, sau cùng không mang theo được tiền tài danh vọng, chỉ mang theo nghiệp đã tạo và tâm đã tu.',
    'Thấy người khổ mà khởi lòng thương, thấy mình khổ mà tìm nguyên nhân, thấy nhân quả mà biết sửa mình, ấy là bước đầu của tỉnh thức.',
    'Đừng sợ những ngày tháng vô thường, bởi chính vô thường nhắc ta biết yêu thương, biết trân trọng và biết sống trọn vẹn hơn.',
    'Khi tâm không còn chạy theo được mất, lời khen tiếng chê cũng trở nên nhẹ nhàng, và con người bắt đầu chạm đến sự tự tại.',
    'Nguyện giữ một tâm không tham, một lòng không sân, một trí không si và một đời biết gieo những nhân lành.',
    'Sống giữa thế gian mà không để thế gian cuốn đi, làm việc thiện mà không cầu báo đáp, đó cũng là một cách tu.',
    'Đi qua một đời người, điều đáng quý nhất không phải đã có bao nhiêu, mà là đã làm vơi đi bao nhiêu khổ đau cho người khác.'
]

/**
 * Cấu hình mặc định, chỉ dùng khi CSDL chưa có bản ghi nào.
 *
 * Trả về object MỚI mỗi lần gọi: Waterline gắn thêm createdAt/updatedAt/id vào
 * chính object được truyền cho create(), nên dùng chung một hằng số thì lần
 * tạo sau mang theo rác của lần trước. `notify` cũng phải là bản sao mảng vì
 * lý do đó.
 *
 * theme và themeDark cố tình để RỖNG. Hai trường này ghi đè bảng màu mặc định
 * ở FrontEnd/lib/theme.ts; điền sẵn mã màu vào đây là đóng băng giao diện theo
 * thời điểm seed - đổi bảng màu trong mã nguồn sau này sẽ không có tác dụng mà
 * không ai hiểu tại sao.
 *
 * Chữ để tiếng Việt và KHÔNG kèm langLib: FrontEnd gọi /v1/public/settings từ
 * server mà không gửi header x-language, nên Ultils.resolveLang luôn rơi về
 * defaultLocale ('en' trong config/custom.js). Có mục langLib tiếng Anh thì
 * bản tiếng Việt của trang cũng hiện chữ tiếng Anh - tệ hơn là không có.
 */
const macDinh = () => ({
    title: 'Sen Việt',
    notify: THIEN_NGU.slice(),
    warning: '',
    note: 'Bản ghi cấu hình mặc định, tự tạo khi CSDL chưa có bản ghi nào.',
    supportphonenumber: '',
    pagefacebookinfo: '',
    supportfacebook: '',
    supporttelegram: '',
    isMaintaning: false,
    langLib: [],
    theme: {},
    themeDark: {}
})

/**
 * Đọc bản ghi cấu hình, tự tạo nếu CSDL chưa có.
 *
 * Trước đây thiếu bản ghi này là getSettings ném TypeError ngay ở dòng
 * `delete systemSettings.adminSystem` -> API trả 500 -> layout của FrontEnd
 * mất luôn phần tuỳ biến. Mà không có đường nào tạo được nó: trang quản trị
 * chỉ có updateSettings, và updateOne không khớp bản ghi nào thì im lặng
 * không làm gì.
 *
 * Ghi bằng đúng id PUBLIC_ID chứ không để Mongo tự sinh, vì mọi nơi khác đều
 * tìm theo id cố định đó.
 */
const docHoacTao = async () => {
    const dieuKien = { condition: { id: sails.PUBLIC_ID } }
    const daCo = await sails.dataProcess.findOne(SystemSettings, dieuKien)
    if (daCo) return daCo

    try {
        return await sails.dataProcess.createDocument(
            SystemSettings,
            Object.assign({ id: sails.PUBLIC_ID }, macDinh())
        )
    } catch (err) {
        // Hai request cùng vào lúc CSDL còn trống: một cái tạo được, cái kia
        // đụng khoá trùng. Đọc lại là thấy bản ghi vừa được tạo.
        const vuaTao = await sails.dataProcess.findOne(SystemSettings, dieuKien)
        if (vuaTao) return vuaTao

        throw err
    }
}

/**
 * Chọn nội dung cho dải thông báo.
 *
 * `notify` nhận cả hai dạng: một chuỗi (quản trị viên đặt cứng một câu) hoặc
 * một danh sách câu. Danh sách thì mỗi lượt gọi rút ngẫu nhiên một câu, nên
 * người đọc quay lại trang không gặp mãi cùng một dòng.
 *
 * LUÔN trả về chuỗi: FrontEnd đổ thẳng giá trị này vào JSX
 * (app/[lang]/page.tsx), lỡ trả về mảng thì cả ba mươi câu dính liền nhau
 * thành một dải chữ.
 *
 * Nhịp đổi câu trên trang chủ KHÔNG phải mỗi lượt xem: FrontEnd cache
 * /v1/public/settings 5 phút và trang chủ cũng là ISR 5 phút, nên câu chỉ đổi
 * mỗi lần trang được sinh lại.
 */
const chonThongBao = notify => {
    if (Array.isArray(notify)) {
        const sach = notify.filter(cau => typeof cau === 'string' && cau.trim())
        if (!sach.length) return ''

        return sach[Math.floor(Math.random() * sach.length)]
    }

    return typeof notify === 'string' ? notify : ''
}

/** `notify` hiện tại dưới dạng MẢNG, để trang quản trị sửa từng câu. */
const danhSachThongBao = notify => {
    if (Array.isArray(notify)) return notify.filter(cau => typeof cau === 'string')

    return typeof notify === 'string' && notify.trim() ? [notify] : []
}

module.exports.siteSettings = {
    THIEN_NGU,
    macDinh,
    docHoacTao,
    chonThongBao,
    danhSachThongBao
}
