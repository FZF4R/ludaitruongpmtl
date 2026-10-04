/**
 * SystemController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const fs = require('fs');
const path = require('path');

/**
 * Các trường của SystemSettings mà trang /admin/dashboard được đọc và sửa.
 *
 * Danh sách TRẮNG chứ không phải danh sách đen: bản ghi này là di sản của sàn
 * clone và còn mang theo loginUser/loginPass/serviceToken. Lọc theo danh sách
 * đen thì thêm một cột bí mật mới là nó rò ra ngay, còn lọc theo danh sách
 * trắng thì trường mới mặc định không ai thấy.
 */
const TRUONG_QUAN_TRI = [
    'title', 'warning', 'note',
    'supportphonenumber', 'pagefacebookinfo', 'supportfacebook', 'supporttelegram',
    'zalosupportinfo', 'zaloadminsupportinfo', 'supporttiktok', 'supportemail',
    'isMaintaning', 'langLib', 'theme', 'themeDark', 'articleLayout', 'bannedWords',
    'practiceImages', 'libraryImages', 'libraryOrder', 'aboutHtml'
]

/** Bản ghi cấu hình -> đúng những gì trang quản trị cần, không thừa một cột. */
const dinhDangCauHinh = row => {
    let kq = { id: String(row.id) }
    TRUONG_QUAN_TRI.forEach(ten => { kq[ten] = row[ten] === undefined ? null : row[ten] })

    // notify luôn trả về dạng MẢNG cho trang quản trị, kể cả khi CSDL đang giữ
    // một chuỗi - giao diện chỉ phải xử lý một hình dạng.
    kq.notify = sails.config.siteSettings.danhSachThongBao(row.notify)

    return kq
}

/** Đọc cấu hình rồi chạy `doiDanhSach` trên mảng thiền ngữ và ghi lại. */
const suaDanhSachThongBao = async (doiDanhSach, exits) => {
    const banGhi = await sails.config.siteSettings.docHoacTao()
    const danhSach = sails.config.siteSettings.danhSachThongBao(banGhi.notify)
    const moi = doiDanhSach(danhSach)

    if (moi === null) {
        sails.checkErrorOutput({ messageNode: 'Settings', message: 'notifyIndexInvalid' }, exits)
        return
    }

    await sails.dataProcess.updateDocument(SystemSettings, {
        condition: { id: banGhi.id },
        updateObject: { notify: moi }
    })

    exits.successRequest({
        messageNode: 'GlobalNotifications',
        message: 'success',
        data: { notify: moi }
    })
}

module.exports = {

    /**
     * Cấu hình hiển thị của site cho trang /admin/dashboard.
     * Tự tạo bản ghi nếu CSDL chưa có, nên trang quản trị không bao giờ gặp
     * màn hình trống trên một cài đặt mới.
     */
    getSettings: ({
        inputs: sails.config.inputs.Admin.System.getSettings,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                const banGhi = await sails.config.siteSettings.docHoacTao()

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: dinhDangCauHinh(banGhi)
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** Thêm một câu vào dải thông báo. */
    addSettingNotify: ({
        inputs: sails.config.inputs.Admin.System.addSettingNotify,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                const cau = sails.config.survey.chuoiNgan(inputs.text, 500)
                if (!cau) {
                    sails.checkErrorOutput({ messageNode: 'Settings', message: 'notifyTextRequired' }, exits)
                    return
                }

                await suaDanhSachThongBao(danhSach => danhSach.concat([cau]), exits)
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** Sửa câu thứ `index` (đếm từ 0). */
    updateSettingNotify: ({
        inputs: sails.config.inputs.Admin.System.updateSettingNotify,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                const cau = sails.config.survey.chuoiNgan(inputs.text, 500)
                if (!cau) {
                    sails.checkErrorOutput({ messageNode: 'Settings', message: 'notifyTextRequired' }, exits)
                    return
                }

                await suaDanhSachThongBao(danhSach => {
                    // Trả null để suaDanhSachThongBao báo lỗi chỉ số: giao diện
                    // và CSDL lệch nhau (hai người sửa cùng lúc) thì phải nói ra,
                    // chứ ghi bừa vào vị trí khác là sửa nhầm câu của người kia.
                    if (inputs.index < 0 || inputs.index >= danhSach.length) return null

                    const moi = danhSach.slice()
                    moi[inputs.index] = cau

                    return moi
                }, exits)
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** Xoá câu thứ `index`. */
    deleteSettingNotify: ({
        inputs: sails.config.inputs.Admin.System.deleteSettingNotify,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                // `indexes` xoá nhiều câu một lần (chọn nhiều ở trang Tổng quan);
                // `index` giữ cho lời gọi cũ. Chỉ số nào ngoài danh sách thì cả lượt bị từ chối.
                let canXoa = Array.isArray(inputs.indexes) ? inputs.indexes : [inputs.index]
                canXoa = Array.from(new Set(canXoa.map(Number)))
                await suaDanhSachThongBao(danhSach => {
                    if (!canXoa.length || canXoa.some(i => !Number.isInteger(i) || i < 0 || i >= danhSach.length)) return null

                    return danhSach.filter((_, i) => !canXoa.includes(i))
                }, exits)
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),



    addNotify: ({
        inputs: sails.config.inputs.Admin.System.addNotify,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let notifyData = Object.assign({}, inputs, {
                langLib: sails.Ultils.normalizeLangLib(inputs.langLib, sails.Ultils.langLibFields('notify'))
            });
            sails.dataProcess.createDocument(Notify, notifyData).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success'
                });
            }).catch((err) => {
                console.log(err)
                sails.checkErrorOutput(err, exits);
            });
        }
    }),
    getListNotify: ({
        inputs: sails.config.inputs.Admin.System.getListNotify,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { filter, limit, page } = inputs
            let filterObject = {
                condition: {

                },
                orderBy: [
                    { createdAt: 'DESC' }
                ],
                limit: limit,
                page: page
            }
            if (filter) {
                filterObject.condition = filter
            }
            sails.dataProcess.getListDataFromModel(Notify, filterObject).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: result
                });
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),
    deleteNotify: ({
        inputs: sails.config.inputs.Admin.System.deleteNotify,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let filterObject = {
                condition: {
                    id: inputs.id
                }
            }
            sails.dataProcess.findOne(Notify, filterObject).then((result) => {
                if (result) {
                    sails.dataProcess.removeDocument(Notify, {
                        id: inputs.id
                    }).then((result) => {
                        exits.successRequest({
                            messageNode: 'GlobalNotifications',
                            message: 'success'
                        });
                    }).catch((err) => {
                        console.log(err)
                        sails.checkErrorOutput(err, exits);
                    });
                } else {
                    exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'error'
                    });
                }
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    updateNotify: ({
        inputs: sails.config.inputs.Admin.System.updateNotify,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { id, title, text, type, isShow, langLib } = inputs
            let filterObject = {
                condition: {
                    id: id
                }
            }
            sails.dataProcess.findOne(Notify, filterObject).then((result) => {
                if (result) {
                    let updateObject = { title, text, type, isShow }
                    if (langLib !== undefined) updateObject.langLib = sails.Ultils.normalizeLangLib(langLib, sails.Ultils.langLibFields('notify'));
                    sails.dataProcess.updateDocument(Notify, {
                        condition: { id },
                        updateObject: updateObject
                    }).then((result) => {
                        exits.successRequest({
                            messageNode: 'GlobalNotifications',
                            message: 'success'
                        });
                    }).catch((err) => {
                        console.log(err)
                        sails.checkErrorOutput(err, exits);
                    });
                } else {
                    exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'error'
                    });
                }
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

















    // ===== Integrate Services =====



    getSupportInfo: ({
        inputs: sails.config.inputs.Admin.System.getSupportInfo || {},
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                // Fetch SystemSettings document with ID "222222222222222222222222"
                const supportData = await sails.dataProcess.findOne(SystemSettings, {
                    condition: { id: '222222222222222222222222' }
                });

                if (!supportData) {
                    return sails.checkErrorOutput({
                        success: false,
                        message: 'Support info not found'
                    }, exits);
                }

                // Extract only the support info fields (exclude _id and timestamps)
                const fieldExclusions = ['id', '_id', 'createdAt', 'updatedAt', 'isDeleted'];
                const supportInfo = {};

                for (const [key, value] of Object.entries(supportData)) {
                    if (!fieldExclusions.includes(key) && value !== null && value !== undefined) {
                        supportInfo[key] = value;
                    }
                }

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: supportInfo
                });
            } catch (err) {
                console.error('Error fetching support info:', err);
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    updateSupportInfo: ({
        inputs: sails.config.inputs.Admin.System.updateSupportInfo || {},
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                // Parse JSON string from input
                let supportInfoData = inputs.supportInfo;

                // Update SystemSettings document with ID "222222222222222222222222"
                const updateInfo = {
                    condition: { id: '222222222222222222222222' },
                    updateObject: supportInfoData
                };

                const result = await sails.dataProcess.updateDocument(SystemSettings, updateInfo);

                if (!result) {
                    return sails.checkErrorOutput({
                        success: false,
                        message: 'Failed to update support info'
                    }, exits);
                }

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: supportInfoData
                });
            } catch (err) {
                console.error('Error updating support info:', err);
                sails.checkErrorOutput(err, exits);
            }
        }
    }),
};
