/**
 * CommentController (công khai)
 *
 * Đọc bình luận đang hiện của một bài đã đăng. Phân trang theo BÌNH LUẬN GỐC
 * (mới nhất trước); mỗi bình luận gốc kèm toàn bộ câu trả lời của nó (cũ
 * trước, đọc như một mạch hội thoại). Trả lời chỉ có một cấp.
 */
const { ganTacGia } = require('../../../utils/binhLuan')

/** Mongo trực tiếp: bình luận cũ không có trường parentId, Waterline không lọc "thiếu trường" được. */
const bangBinhLuan = () => Comment.getDatastore().manager.collection(Comment.tableName)
const LA_GOC = { $or: [{ parentId: '' }, { parentId: { $exists: false } }] }
const TRA_LOI_TOI_DA = 100

module.exports = {

    listComments: ({
        inputs: sails.config.inputs.Public.Comment.listComments,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let bai = await Content.findOne({ slug: inputs.slug, status: 'published' })
                if (!bai) {
                    return exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'success',
                        data: { data: [], total: 0, totalAll: 0, page: 1, limit: inputs.limit }
                    });
                }

                let cuaBai = { contentId: String(bai.id), status: 'visible' }
                let dieuKienGoc = Object.assign({}, cuaBai, LA_GOC)

                let [goc, total, totalAll] = await Promise.all([
                    bangBinhLuan().find(dieuKienGoc)
                        .sort({ createdAt: -1 })
                        .skip(inputs.limit * (inputs.page - 1))
                        .limit(inputs.limit)
                        .toArray(),
                    bangBinhLuan().countDocuments(dieuKienGoc),
                    bangBinhLuan().countDocuments(cuaBai)
                ])

                let idGoc = goc.map(b => String(b._id))
                let traLoi = idGoc.length
                    ? await bangBinhLuan().find(Object.assign({}, cuaBai, { parentId: { $in: idGoc } }))
                        .sort({ createdAt: 1 })
                        .limit(TRA_LOI_TOI_DA * idGoc.length)
                        .toArray()
                    : []

                let daDinhDang = await ganTacGia([...goc, ...traLoi])
                let theoId = {}
                daDinhDang.forEach(b => { theoId[b.id] = b })

                let data = idGoc.map(id => Object.assign({}, theoId[id], {
                    replies: daDinhDang.filter(b => b.parentId === id)
                }))

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { data: data, total: total, totalAll: totalAll, page: inputs.page, limit: inputs.limit }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
