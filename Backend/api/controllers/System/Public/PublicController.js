/**
 * PublicController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const Speakeasy = require("speakeasy")

// Key bắt buộc trong body để được phép chạy health check
const HEALTH_CHECK_KEY = '11111111'

module.exports = {

    // API public kiểm tra tình trạng server, chỉ chạy khi body có key = '11111111'
    checkHealth: ({
        inputs: sails.config.inputs.Public.checkHealth,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            if (inputs.key !== HEALTH_CHECK_KEY) {
                exits.invalidInputParam({
                    messageNode: 'GlobalNotifications',
                    message: 'invalidInputParam'
                });
                return;
            }

            // Kiểm tra kết nối database bằng lệnh ping nhẹ, hỏng thì báo degraded chứ không throw
            let dbStatus = 'ok';
            try {
                await Users.getDatastore().manager.command({ ping: 1 });
            } catch (err) {
                dbStatus = 'error';
            }

            exits.successRequest({
                messageNode: 'GlobalNotifications',
                message: 'success',
                data: {
                    status: dbStatus === 'ok' ? 'healthy' : 'degraded',
                    database: dbStatus,
                    uptime: Math.floor(process.uptime()),
                    timestamp: new Date().toISOString()
                }
            });
        }
    }),

    getNotify: ({
        inputs: sails.config.inputs.Public.notify,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let filterNotify = {
                condition: {
                    isShow: true
                },
                orderBy: [
                    { createdAt: 'DESC' }
                ],
                limit: 10,
                page: 1
            }
            if (inputs.filter) {
                filterNotify.condition = inputs.filter
            }
            const lang = sails.Ultils.resolveLang(this.req)
            const notifyFields = sails.Ultils.langLibFields('notify')
            sails.dataProcess.getListDataFromModel(Notify, filterNotify).then((result) => {
                if (result && Array.isArray(result.data)) {
                    result.data = result.data.map(item => sails.Ultils.applyLangLib(item, lang, notifyFields))
                }
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: result
                });
            }).catch((error) => {
                sails.checkErrorOutput(error, exits);
            })
        }
    }),
    get2FA: ({
        inputs: sails.config.inputs.Public.get2FA,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let code = Speakeasy.totp({
                secret: inputs.secret,
                encoding: "base32"
            })
            exits.successRequest({
                messageNode: 'GlobalNotifications',
                message: 'success',
                data: code
            });
        }
    }),




    getSettings: ({
        inputs: sails.config.inputs.Public.getSettings,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let filterObject = {
                condition: {
                    id: sails.PUBLIC_ID
                }
            }
            let systemSettings = await sails.dataProcess.findOne(SystemSettings, filterObject);

            // Lần chạy đầu trên một CSDL trống: tự dựng bản ghi mẫu rồi trả về
            // luôn, để trang chủ có tiêu đề và thông báo thay vì nhận lỗi 500.
            if (!systemSettings) {
                systemSettings = await sails.config.siteSettings.docHoacTao();
            }

            delete systemSettings.adminSystem
            delete systemSettings.accountSessionUrl
            delete systemSettings.followServiceUrl
            delete systemSettings.jsessionId
            delete systemSettings.loginPageUrl
            delete systemSettings.loginPass
            delete systemSettings.loginUser
            delete systemSettings.pageTK
            delete systemSettings.serviceCommentBuffCost
            delete systemSettings.servisceCommentBuffUrl
            delete systemSettings.serviceShareBuffCost
            delete systemSettings.servisceShareBuffUrl
            delete systemSettings.serviceViewBuffCost
            delete systemSettings.serviceViewBuffUrl
            delete systemSettings.updatedAt
            delete systemSettings.serviceAuthToken
            delete systemSettings.isPublicServiceForAll
            delete systemSettings.serviceToken
            delete systemSettings.id
            // Danh sách từ cấm chỉ để máy lọc bình luận - lộ ra là chỉ đường lách.
            delete systemSettings.bannedWords

            systemSettings.notify = sails.config.siteSettings.chonThongBao(systemSettings.notify);

            const lang = sails.Ultils.resolveLang(this.req)
            const langWarning = sails.Ultils.langLibValue(systemSettings, lang, 'mainWarning')
            systemSettings = sails.Ultils.applyLangLib(systemSettings, lang, sails.Ultils.langLibFields('systemSettings'))
            if (!langWarning && lang !== 'vi' && systemSettings.mainWarningEng) {
                systemSettings.mainWarning = systemSettings.mainWarningEng
            }

            exits.successRequest({
                messageNode: 'GlobalNotifications',
                message: 'success',
                data: systemSettings
            });
        }
    }),

    // Return Warning field from a specific SystemSettings record
    getSystemWarning: ({
        inputs: sails.config.inputs.Public.getSettings,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            try {
                const WARN_ID = sails.SERVICE_ID;
                let filterObject = {
                    condition: {
                        id: WARN_ID
                    }
                };

                let systemSettings = await sails.dataProcess.findOne(SystemSettings, filterObject);

                const warningContent = systemSettings && systemSettings.Warning ? systemSettings.Warning : null;

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { warning: warningContent }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
