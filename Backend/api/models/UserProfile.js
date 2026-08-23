/**
 * UserProfile.js
 *
 * @description :: Hồ sơ Phật tử + khảo sát tu tập, điền một lần ngay sau lần
 *                 đăng nhập đầu tiên (FrontEnd: /hoan-thien-ho-so).
 *
 * Vì sao tách bảng chứ không nhồi thêm cột vào Users: mọi request có token đều
 * đọc Users một lần (jwtProcess.verifyPasswordFromDB), nên bảng đó càng gọn
 * càng tốt. Hồ sơ này chỉ đọc ở đúng hai màn hình.
 *
 * Users.profileCompleted mới là cờ quyết định có đẩy người dùng vào form hay
 * không - nó nằm sẵn trong bản ghi Users mà policy vừa đọc, nên không tốn thêm
 * một truy vấn nào cho việc kiểm tra.
 *
 * Các id trong `survey` do config/survey.js lọc; đừng ghi thẳng dữ liệu client.
 */

module.exports = {

    tableName: 'UserProfile',
    attributes: {
        userId: {
            type: 'string',
            required: true,
            unique: true
        },
        fullName: {
            type: 'string',
            defaultsTo: '',
            description: 'Họ tên đầy đủ, cũng được chép sang Users.fullName'
        },
        dharmaName: {
            type: 'string',
            defaultsTo: '',
            description: 'Pháp danh - chỉ có khi đã quy y'
        },
        nickname: {
            type: 'string',
            defaultsTo: '',
            description: 'Biệt danh, tên muốn được gọi trên trang'
        },
        hometown: {
            type: 'json',
            defaultsTo: {},
            description: '{ province, detail } - tỉnh/thành chọn từ danh sách, detail là chữ tự do'
        },
        survey: {
            type: 'json',
            defaultsTo: {},
            description: 'Đáp án khảo sát, chỉ chứa id đã qua config/survey.js'
        },
        completedAt: {
            type: 'number',
            defaultsTo: 0,
            description: 'Mốc điền xong lần đầu (ms). Sửa hồ sơ sau này không đổi giá trị này.'
        }
    },

};
