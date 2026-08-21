const request = require('request-promise');

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
}
