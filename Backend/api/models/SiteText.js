/**
 * SiteText.js
 *
 * @description :: Chữ giao diện do admin sửa trực tiếp trên trang (chế độ sửa).
 *
 * Mỗi bản ghi GHI ĐÈ một chuỗi mặc định của FrontEnd, theo từng ngôn ngữ.
 * `key` là đường dẫn trong từ điển (ví dụ `home.latest`) hoặc một khoá riêng
 * cho chữ chưa nằm trong từ điển (ví dụ `home.heroQuote`). Không có bản ghi
 * = dùng chữ mặc định, nên xoá bản ghi là "khôi phục mặc định".
 */

module.exports = {

    tableName: 'SiteText',
    attributes: {
        lang: {
            type: 'string',
            required: true,
        },
        key: {
            type: 'string',
            required: true,
        },
        value: {
            type: 'string',
            defaultsTo: '',
        },
        updatedById: {
            type: 'string',
            defaultsTo: '',
        },
        updatedByUsername: {
            type: 'string',
            defaultsTo: '',
        }
    },

};
