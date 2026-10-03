/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For more information on configuration, check out:
 * https://sailsjs.com/config/http
 */

module.exports.http = {

  /****************************************************************************
  *                                                                           *
  * Sails/Express middleware to run for every HTTP request.                   *
  * (Only applies to HTTP requests -- not virtual WebSocket requests.)        *
  *                                                                           *
  * https://sailsjs.com/documentation/concepts/middleware                     *
  *                                                                           *
  ****************************************************************************/

  middleware: {

    /***************************************************************************
    *                                                                          *
    * Clear sails.sid cookie if present (since using JWT auth instead)         *
    * This completely removes the cookie from browser                          *
    *                                                                          *
    ***************************************************************************/
    // clearSailsSessionCookie: function(req, res, next) {
    //   // Completely remove the sails.sid cookie from browser
    //   res.clearCookie('sails.sid', {
    //     path: '/',
    //     httpOnly: true,
    //     secure: true,
    //     sameSite: 'strict',
    //     maxAge: 0,
    //     expires: new Date(0)
    //   });
    //   return next();
    // },

    /***************************************************************************
    *                                                                          *
    * The order in which middleware should be run for HTTP requests.           *
    * (This Sails app's routes are handled by the "router" middleware below.)  *
    *                                                                          *
    ***************************************************************************/

    // order: [
    //   // 'clearSailsSessionCookie',
    //   'cookieParser',
    //   'bodyParser',
    //   'compress',
    //   'poweredBy',
    //   'router',
    //   'www',
    //   'favicon',
    // ],


    /***************************************************************************
    *                                                                          *
    * The body parser that will handle incoming multipart HTTP requests.       *
    *                                                                          *
    * https://sailsjs.com/config/http#?customizing-the-body-parser             *
    *                                                                          *
    ***************************************************************************/

    // Nâng giới hạn JSON từ 1mb (mặc định của skipper) lên 8mb: ảnh trang chủ
    // (HeroImage) và avatar gửi lên dạng base64 trong JSON. Trình duyệt đã tự
    // thu nhỏ ảnh trước khi gửi, nên 8mb là trần an toàn chứ không phải kích
    // thước thường gặp; controller vẫn tự chặn ảnh quá lớn.
    bodyParser: (function _configureBodyParser(){
      var skipper = require('skipper');
      return skipper({ strict: true, limit: '8mb' });
    })(),

  },

};
