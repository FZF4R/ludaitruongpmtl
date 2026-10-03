/**
 * Custom configuration
 * (sails.config.custom)
 *
 * One-off settings specific to your application.
 *
 * For more information on custom configuration, visit:
 * https://sailsjs.com/config/custom
 */

module.exports.custom = {

  /***************************************************************************
  *                                                                          *
  * Any other custom config this Sails app should use during development.    *
  *                                                                          *
  ***************************************************************************/
  // sendgridSecret: 'SG.fake.3e0Bn0qSQVnwb1E4qNPz9JZP5vLZYqjh7sn8S93oSHU',
  // stripeSecret: 'sk_test_Zzd814nldl91104qor5911gjald',
  // …

  supportedLocales: ['en', 'zh', 'ru', 'vi', 'th', 'fil'],
  defaultLocale: 'en',

  // Tài khoản DUY NHẤT được đọc / sửa danh sách từ cấm mặc định
  // (data/tu-cam-mac-dinh.txt, API /v1/admin/banned-words/default). Phải là
  // vai trò Admin VÀ đúng email này. Đổi qua biến môi trường nếu cần.
  chuTuCamEmail: String(process.env.TU_CAM_OWNER_EMAIL || 's2nhocvip98@gmail.com').trim().toLowerCase(),

};
