const request = require('request-promise');
const TelegramBot = require('node-telegram-bot-api');
const ordersBotToken = '8260243895:AAFH6ilJfORyl1WMeLCe-c1chLH7iVFeEPs';
const balanceBotToken = '7386999360:AAEU4DRnn7KQIWvvkSIEIaKS56AoTOZ8QFM';
const registerBotToken = '8182326620:AAGJQPdbeEkKVNrzLkK-W-X6vXM5EtywWMc';
const secretaryToken = '8417576423:AAGKmp1AKAvxZ9MYRPaMrJdcG1iPLECfsmw';

// const ordersBot = new TelegramBot(ordersBotToken, { polling: false });
// const balanceBot = new TelegramBot(balanceBotToken, { polling: false });
// const registerBot = new TelegramBot(registerBotToken, { polling: false });
// const secretaryBot = new TelegramBot(secretaryToken, { polling: true });

const GROUP_ORDERS_ID = -1003097158903;
const GROUP_BALANCE_PARTNER_ID = -1003006052181;
const GROUP_REGISTER_ID = -1003098983539;
const GROUP_SUPPORT_ID = -5253521232;
const ADMIN_TELE_ID = 5037710293;
// Chỉ cảnh báo số dư tài khoản đối tác khi tụt xuống dưới mức này
const LOW_BALANCE_THRESHOLD = 300000;
module.exports = class Ultils {
    _request({ url, payload, options }) {
        return new Promise((resolve, reject) => {
            if (!payload) {
                payload = {}
            }
            let params = {
                method: Object.keys(payload).length ? "POST" : "GET",
                url: url,
                json: true,
                followAllRedirects: true,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
                    'sec-fetch-site': 'same-origin',
                    'sec-fetch-user': '?1',
                    'upgrade-insecure-requests': 1,
                    'cache-control': 'max-age=0'
                },
            };
            if (options) {
                let { headers, json, cookie, jar, fullRes, proxy, authorization } = options
                if (headers) {
                    params.headers = headers
                }
                if (authorization) {
                    params.headers.authorization = authorization
                }
                if (json) {
                    params.json = json
                }
                if (cookie) {
                    params.headers = Object.assign(params.headers, { cookie: cookie })
                }
                if (jar) {
                    params.jar = jar
                }
                if (fullRes) {
                    params.resolveWithFullResponse = true
                }
                if (proxy) {
                    params.proxy = proxy
                }
            }
            if (params.method == 'POST') {
                params.form = payload
            }
            request(params).then(result => {
                resolve(result)
            }).catch(err => {

                reject(err)
            });
        });
    }

    _getHttpResponse({ url, payload, options }) {
        return new Promise((resolve, reject) => {
            if (!payload) {
                payload = {}
            }
            let params = {
                method: Object.keys(payload).length ? "POST" : "GET",
                url: url,
                resolveWithFullResponse: true,
                json: true,
                followAllRedirects: true,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
                    'sec-fetch-site': 'same-origin',
                    'sec-fetch-user': '?1',
                    'upgrade-insecure-requests': 1,
                    'cache-control': 'max-age=0'
                },
            };
            if (options) {
                let { headers, json, cookie, jar, fullRes, proxy, socks5 } = options
                if (headers) {
                    params.headers = headers
                }
                if (json) {
                    params.json = json
                }
                if (cookie) {
                    params.headers = Object.assign(params.headers, { cookie: cookie })
                }
                if (jar) {
                    params.jar = jar
                }
                if (fullRes) {
                    params.resolveWithFullResponse = true
                }
                if (proxy) {
                    params.proxy = proxy
                }
            }

            if (params.method == 'POST') {
                params.body = payload
            }
            request(params).then(result => {
                resolve(result);
            }).catch(err => {
                resolve({ code: 500 });
            });
        });
    }

    _request_body({ url, payload, options }) {
        return new Promise((resolve, reject) => {
            if (!payload) {
                payload = {}
            }
            let params = {
                method: Object.keys(payload).length ? "POST" : "GET",
                url: url,
                json: true,
                followAllRedirects: true,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
                    'sec-fetch-site': 'same-origin',
                    'sec-fetch-user': '?1',
                    'upgrade-insecure-requests': 1,
                    'cache-control': 'max-age=0'
                },
            };
            if (options) {
                let { headers, json, cookie, jar, fullRes, proxy, socks5 } = options
                if (headers) {
                    params.headers = headers
                }
                if (json) {
                    params.json = json
                }
                if (cookie) {
                    params.headers = Object.assign(params.headers, { cookie: cookie })
                }
                if (jar) {
                    params.jar = jar
                }
                if (fullRes) {
                    params.resolveWithFullResponse = true
                }
                if (proxy) {
                    params.proxy = proxy
                }
            }

            if (params.method == 'POST') {
                params.body = payload
            }
            request(params).then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
        });
    }

    getBW(text, Start, End) {
        var ret = text.split(Start);
        if (ret[1]) {
            ret = ret[1].split(End);
            return ret[0];
        };
        return 0;
    }

    supportedLocales() {
        return (typeof sails !== 'undefined' && sails.config && sails.config.custom && sails.config.custom.supportedLocales) || ['en', 'zh', 'ru', 'vi', 'th', 'fil'];
    }

    resolveLang(req) {
        const allowed = this.supportedLocales();
        const fallback = (typeof sails !== 'undefined' && sails.config && sails.config.custom && sails.config.custom.defaultLocale) || 'en';
        if (!req) return fallback;

        const candidates = [];
        if (req.headers) {
            candidates.push(req.headers['x-language']);
            const acceptLanguage = req.headers['accept-language'];
            if (acceptLanguage) candidates.push(String(acceptLanguage).split(',')[0].split('-')[0]);
        }
        if (req.query) candidates.push(req.query.lang, req.query.language);
        if (req.body) candidates.push(req.body.lang, req.body.language);

        for (const raw of candidates) {
            const lang = String(raw || '').trim().toLowerCase();
            if (allowed.includes(lang)) return lang;
        }
        return fallback;
    }

    langLibValue(record, lang, field) {
        if (!record || !lang) return null;
        const list = record.langLib;
        if (!Array.isArray(list)) return null;

        const entry = list.find(item => item && String(item.lang || '').toLowerCase() === String(lang).toLowerCase());
        const value = entry && entry[field];
        return typeof value === 'string' && value.trim() ? value.trim() : null;
    }

    normalizeLangLib(list, fields = ['name', 'note', 'description']) {
        if (typeof list === 'string') {
            try {
                list = JSON.parse(list);
            } catch (err) {
                return [];
            }
        }
        if (!Array.isArray(list)) return [];

        const allowed = (typeof sails !== 'undefined' && sails.config && sails.config.custom && sails.config.custom.supportedLocales) || ['en', 'zh', 'ru', 'vi', 'th', 'fil'];
        const merged = new Map();

        for (const raw of list) {
            if (!raw || typeof raw !== 'object') continue;
            const lang = String(raw.lang || raw.locale || raw.code || '').trim().toLowerCase();
            if (!allowed.includes(lang)) continue;

            const entry = merged.get(lang) || { lang };
            for (const field of fields) {
                const value = typeof raw[field] === 'string' ? raw[field].trim() : '';
                if (value) entry[field] = value;
            }
            merged.set(lang, entry);
        }

        return allowed
            .map(lang => merged.get(lang))
            .filter(entry => entry && fields.some(field => entry[field]));
    }

    langLibFields(kind) {
        const sets = {
            notify: ['title', 'text'],
            tutShare: ['title', 'description', 'content'],
            systemSettings: ['title', 'notify', 'note', 'mainWarning', 'mainPolicy'],
        };
        return sets[kind] || ['name', 'note', 'description'];
    }

    applyLangLib(record, lang, fields) {
        if (!record || !Array.isArray(fields)) return record;

        const plain = typeof record.toJSON === 'function' ? record.toJSON() : Object.assign({}, record);
        const source = {};
        for (const field of fields) {
            source[field] = plain[field];
            const value = this.langLibValue(plain, lang, field);
            if (value) plain[field] = value;
        }
        plain.source = source;

        return plain;
    }

    getDepositHashCode(input){
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let hashCode = '';
      for (let i = 0; i < 15; i++) {
        hashCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return hashCode;
    }

    removeInvalidChar(fileName) {
        try {
            var invalidChars = ['\\', '\/', ':', '$', '*', '?', '"', '<', , '|', '@', '%', '+', '#', '^', '~', '=', '&'];
            var filenameParts = fileName.split('.');
            filenameParts[filenameParts.length - 1] = `.${filenameParts[filenameParts.length - 1]}`;
            fileName = filenameParts.join('');

            var newFileName = '';

            for (let index = 0; index < fileName.length; index++) {
                if (invalidChars.indexOf(fileName[index]) >= 0) continue;
                newFileName = `${newFileName}${fileName[index]}`;
            }
            return newFileName;
        } catch (error) {
            return fileName;
        }
    }

    async getBalanceBMVipAccount(config){
      try {
        var response = await this._request({url: `${config.Domain}/api/v1/balance`, payload: {api_key: config.DomainApiKey}});
        if (!response || !response.status) {
          return "Lỗi hiển thị tài khoản"
        } else {
          return (response && response.balance) ? response.balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 0;
        }
      } catch(error) {
        return 0
       }
    }

    async getBalanceRegCloneAccount(config){
      try {
        var response = await this._request({url: `${config.Domain}/api/BResource.php?username=${config.username}&password=${config.password}`});
        if (!response) {
          return "Lỗi hiển thị tài khoản"
        } else {
          return response;
        }
      } catch(error) {
        return "0";
      }
    }

    async getBalanceCloneTutAccount(config){
      try {
        var response = await this._request({url: `${config.Domain}/api/profile.php?api_key=${config.DomainApiKey}`, payload: {api_key: config.DomainApiKey}});
        if (!response || !response.data) {
          return "Lỗi hiển thị tài khoản"
        } else {
          return (response && response.data && response.data.money) ? response.data.money.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 0;
        }
      } catch(error) {
        return 0
       }
    }

    async getBalanceNguyenlieuMMOAccount(config){
      return "9,999,999 đ";
    }

    async getBalanceMlocalAccount(config){
      return "9,999,999 đ";
    }

    async getBalanceConbosoBot(config){
      try {
        var response = await this._request({url: `${config.Domain}/api/telegram-buyer/balance?key=${config.DomainApiKey}`});
        if (!response || !response.success) {
          return "Lỗi hiển thị tài khoản"
        } else {
          return (response.balanceVnd.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
          // return `${response.balanceText} đ`
        }
      } catch(error) {
        return 0
       }
    }

    /**
     * getBalanceAccount trả về chuỗi đã format ("9,999,999 đ", "1.234.567"),
     * số 0, "Lỗi hiển thị tài khoản" hoặc undefined -> đổi về number để so sánh.
     * Trả về null khi không đọc được số dư.
     */
    parseBalanceNumber(balance){
      if (typeof balance === 'number') return isFinite(balance) ? balance : null;
      if (typeof balance !== 'string') return null;

      var text = balance.replace(/[^\d.,-]/g, ''); // bỏ chữ, đơn vị "đ", khoảng trắng
      if (!/\d/.test(text)) return null;

      var separatorPos = Math.max(text.lastIndexOf(','), text.lastIndexOf('.'));
      var tailPart = separatorPos >= 0 ? text.slice(separatorPos + 1) : '';
      if (separatorPos >= 0 && /^\d{1,2}$/.test(tailPart)) {
        // 1-2 chữ số cuối là phần thập phân ("150000.00"), còn lại là phân cách nghìn
        text = `${text.slice(0, separatorPos).replace(/[.,]/g, '')}.${tailPart}`;
      } else {
        text = text.replace(/[.,]/g, '');
      }

      var value = parseFloat(text);
      return isFinite(value) ? value : null;
    }

    async getBalanceAccount(grInfo, configSettings){
      var webConfig = configSettings.websiteConfigs.find(x=>x.DomainType == grInfo.type && x.Domain == grInfo.baseDomain)
      webConfig.intType = parseInt(webConfig.type);
      switch (webConfig.intType) {
        case 4:
          return (await this.getBalanceBMVipAccount(webConfig));
          break;
        case 5:
          return (await this.getBalanceRegCloneAccount(webConfig));
          break;
        case 6:
          return (await this.getBalanceBMVipAccount(webConfig));
          break;
        case 7:
          return (await this.getBalanceMlocalAccount(webConfig));
          break;
        case 8:
          return (await this.getBalanceBMVipAccount(webConfig));
          break;
        case 9:
          return (await this.getBalanceCloneTutAccount(webConfig));
          break;
        case 10:
          return (await this.getBalanceCloneTutAccount(webConfig));
          break;
        case 11:
          return (await this.getBalanceConbosoBot(webConfig));
          break;
        default:
          break;
      }
    }

    async sendRegisterMessage(userInfo){
      let message = `🔊🔊 ShopClone--- Đăng ký mới 🔊🔊
✅  Tài khoản: ${userInfo.username}
🌟  Email: ${userInfo.email}
💰  Mã nạp tiền: ${userInfo.depositHash}`;
      registerBot.sendMessage(GROUP_REGISTER_ID, message);
    }

    async sendUsdtDepositMessage(userInfo, depositAmount, txHash, network, screenshotBase64 = null) {
      try {
        let message = `💎💎💎 USDT Deposit Request 💎💎💎
👤 Tài khoản: ${userInfo.username}
💰 Số lượng: ${depositAmount} USDT
🌐 Network: ${network}
🔗 TxHash: ${txHash}
⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`;

        if (ordersBot) {
          // Send text message first
          // await ordersBot.sendMessage(GROUP_ORDERS_ID, message);

          // Send screenshot as media if available
          if (screenshotBase64) {
            try {
              // Convert base64 data URL to Buffer
              // Format: "data:image/png;base64,iVBORw0KG..."
              const base64Data = screenshotBase64.replace(/^data:image\/[a-z]+;base64,/, '');
              const imageBuffer = Buffer.from(base64Data, 'base64');

              // Send photo to Telegram
              await ordersBot.sendPhoto(GROUP_ORDERS_ID, imageBuffer, {
                caption: message
              });
            } catch (mediaError) {
              console.error('Error sending screenshot to Telegram:', mediaError);
              // Send text notification about screenshot if media send fails
              await ordersBot.sendMessage(GROUP_ORDERS_ID, '⚠️ Không thể gửi ảnh screenshot (lỗi xử lý media)');
            }
          }
        }
      } catch (error) {
        console.error('Error sending USDT deposit message to Telegram:', error);
      }
    }


    async sendMessageToGroup(userInfo, grInfo, totalProduct, amount, payBalance, soldProduct, isAPISell /* Mua qua API Partner của web*/, configSettings) {
        try {
//           setTimeout(async () => {
//             totalProduct = await Product.count({ categoryId: grInfo.id, isSell: false, isDie: false });
//             soldProduct = await Product.count({ categoryId: grInfo.id, isSell: true });
//             var dieProduct = await Product.count({ categoryId: grInfo.id, isDie: true });
//             const domainAction = grInfo.baseDomain ? grInfo.baseDomain : 'https://mlocal.us';
//             grInfo.importPrice = grInfo.importPrice ? grInfo.importPrice : (grInfo.impPrice ? grInfo.impPrice : 0);
//             const profit = (((Math.round(grInfo.price * (100 - (userInfo.ref ? userInfo.ref : 0))/100) - grInfo.importPrice) * amount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

//             // Gửi thông báo đơn hàng
//             let viewPayBalance = payBalance ? payBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 0
//             let coinLeft = userInfo.coin - payBalance;
//             coinLeft = coinLeft.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
//             let message = `🔵🔵ShopClone--- Mua hàng ${isAPISell ? "qua API CTV" : ""}🔵🔵
// 🔊  ${userInfo.ref > 0 ? 'CTV' : ''} ${userInfo.username} - ${coinLeft}đ
// 🌟  ${domainAction} - ${grInfo.name.toUpperCase()}
// 🔥  Mua ${amount}
// ✅  Còn lại: ${totalProduct} VIA - ${dieProduct} CP
// 💰  Tổng tiền: ${viewPayBalance} đ`;
//             ordersBot.sendMessage(GROUP_ORDERS_ID, message);

//             // Gửi thông báo số dư còn lại - chỉ cảnh báo khi số dư dưới LOW_BALANCE_THRESHOLD
//             if (grInfo.baseDomain)
//               setTimeout(async () => {
//                 try {
//                   const balanceLeft = await this.getBalanceAccount(grInfo, configSettings);
//                   const balanceValue = this.parseBalanceNumber(balanceLeft);
//                   // Số dư còn dư dả -> không cần làm phiền group
//                   if (balanceValue !== null && balanceValue >= LOW_BALANCE_THRESHOLD) return;

//                   const viewThreshold = LOW_BALANCE_THRESHOLD.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
//                   // Không đọc được số dư cũng phải báo, im lặng là mất luôn cảnh báo
//                   let messageBalance = balanceValue === null
//                     ? `⚠️⚠️⚠️ Tài khoản ${domainAction} ⚠️⚠️⚠️
// ❓  Không đọc được số dư: ${balanceLeft}`
//                     : `🔥🔥🔥 Tài khoản ${domainAction} 🔥🔥🔥
// ⚠️  Số dư còn lại: ${balanceLeft}đ`;
//                   setTimeout(() => {
//                     balanceBot.sendMessage(GROUP_BALANCE_PARTNER_ID, messageBalance);
//                   }, 500);
//                 } catch (error) {
//                   console.log('Loi kiem tra so du tai khoan doi tac:', error);
//                 }
//               }, 300);
//           }, 1200);

        } catch (error) {
            console.log(error);
        }
    }

    initSecretaryTeleBot(){
      try {
        secretaryBot.sendMessage(ADMIN_TELE_ID, "Chào sếp... 😎");
        secretaryBot.on('message', async (msg, match) => {
          const text = msg.text;
          if (msg.chat.id == GROUP_SUPPORT_ID && msg.from.id == ADMIN_TELE_ID) {
            try {
              var responseData = await sails.BotTelegramService.sendRequest(text, msg, secretaryBot);
              // secretaryBot.sendMessage(ADMIN_TELE_ID, responseData);
              if (responseData) secretaryBot.sendMessage(GROUP_SUPPORT_ID, responseData);
            } catch (err) {
              secretaryBot.sendMessage(ADMIN_TELE_ID, `❌ Lỗi:\n${err.message}`);
            }
          } else {
            if (msg.from.id == ADMIN_TELE_ID) {
              if (text == 'hdsd') {
                setTimeout(() => {
                  secretaryBot.sendMessage(msg.from.id, `🔥🔥🔥HDSD🔥🔥🔥

👉 /start {minutes} - Tạo phiên thực hiện

👉 /cf {username}|{AuthCode} - Xác thực tạo phiên

👉 /end - Kết thúc phiên

👉 /info2 hungvu21 - Lấy thông tin tài khoản

👉 /deposit XKAJ12A|500000 - Nạp tiền cho tài khoản theo Mã

👉 /deposit2 hungvu|5000 - Nạp tiền cho tài khoản

✅ /help dp/...`);
                }, 200);
              } else {
                setTimeout(() => {
                  secretaryBot.sendMessage(msg.from.id, `Gửi nhầm Group rồi sếp ơi... :v `);
                }, 200);
              }

            } else {
              secretaryBot.sendMessage(msg.from.id, `Gửi cc. Fuk u`);
            }
          }
        });
      } catch(error) {
        console.log("Init Bot Fail");
        console.log(error);
      }
    }
}
