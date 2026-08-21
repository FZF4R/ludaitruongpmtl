/**
 * healthCheckMonitor.js
 *
 * Script độc lập (không phụ thuộc thư viện ngoài) để kiểm tra API health server
 * mỗi 20 phút một lần. Gọi POST /v1/public/healthserver với key trong body.
 * Nếu kết quả trả về LỖI (không gọi được / HTTP != 200 / status != healthy),
 * script sẽ gửi cảnh báo tới 1 group Telegram.
 *
 * Cách chạy:
 *   node healthCheckMonitor.js
 *
 * Có thể cấu hình qua biến môi trường (không bắt buộc):
 *   HEALTH_URL              URL đầy đủ của API (mặc định http://localhost:1338/v1/public/healthserver)
 *   HEALTH_KEY              Key gửi trong body   (mặc định 11111111)
 *   HEALTH_INTERVAL_MINUTES Chu kỳ kiểm tra phút (mặc định 20)
 *   HEALTH_TIMEOUT_MS       Timeout mỗi request  (mặc định 10000)
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// ===== Cấu hình health check =====
const HEALTH_URL = process.env.HEALTH_URL || 'http://localhost:1338/v1/public/healthserver';
const HEALTH_KEY = process.env.HEALTH_KEY || '11111111';
const INTERVAL_MINUTES = Number(process.env.HEALTH_INTERVAL_MINUTES) || 20;
const TIMEOUT_MS = Number(process.env.HEALTH_TIMEOUT_MS) || 10000;
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

// ===== Cấu hình Telegram (ĐIỀN TRỰC TIẾP VÀO ĐÂY) =====
// Token bot lấy từ @BotFather, ví dụ: '123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxx'
const TELEGRAM_BOT_TOKEN = 'DIEN_BOT_TOKEN_VAO_DAY';
// ID của group/chat nhận cảnh báo. Group thường có dạng số âm, ví dụ: '-1001234567890'
const TELEGRAM_CHAT_ID = 'DIEN_CHAT_ID_VAO_DAY';

// Nhãn tên server hiển thị trong tin nhắn cảnh báo
const SERVER_LABEL = process.env.HEALTH_LABEL || HEALTH_URL;

// Ghi log kèm mốc thời gian cho dễ theo dõi
function log(level, message) {
    let time = new Date().toISOString();
    console.log(`[${time}] [${level}] ${message}`);
}

// Kiểm tra đã cấu hình Telegram chưa (tránh gọi khi còn để giá trị placeholder)
function isTelegramConfigured() {
    return TELEGRAM_BOT_TOKEN &&
        TELEGRAM_CHAT_ID &&
        !TELEGRAM_BOT_TOKEN.startsWith('DIEN_') &&
        !String(TELEGRAM_CHAT_ID).startsWith('DIEN_');
}

// Gửi tin nhắn tới group Telegram qua Bot API (không cần thư viện ngoài)
function sendTelegram(text) {
    return new Promise((resolve) => {
        if (!isTelegramConfigured()) {
            log('WARN', 'Chưa cấu hình TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID, bỏ qua gửi Telegram.');
            return resolve();
        }

        let payload = JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: text,
            disable_web_page_preview: true
        });

        let options = {
            method: 'POST',
            hostname: 'api.telegram.org',
            path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            },
            timeout: TIMEOUT_MS
        };

        let req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    log('INFO', 'Đã gửi cảnh báo Telegram.');
                } else {
                    log('ERROR', `Gửi Telegram thất bại HTTP ${res.statusCode}: ${body}`);
                }
                resolve();
            });
        });

        req.on('timeout', () => {
            log('ERROR', `Gửi Telegram timeout sau ${TIMEOUT_MS}ms`);
            req.destroy();
        });
        req.on('error', (err) => {
            log('ERROR', `Lỗi gửi Telegram: ${err.message}`);
            resolve();
        });

        req.write(payload);
        req.end();
    });
}

// Gọi API health 1 lần, luôn resolve về { ok, detail } (không reject để vòng lặp không bị chặn)
function checkHealth() {
    return new Promise((resolve) => {
        let target;
        try {
            target = new URL(HEALTH_URL);
        } catch (err) {
            return resolve({ ok: false, detail: `HEALTH_URL không hợp lệ: ${HEALTH_URL}` });
        }

        let payload = JSON.stringify({ key: HEALTH_KEY });
        let client = target.protocol === 'https:' ? https : http;
        let startedAt = Date.now();

        let options = {
            method: 'POST',
            hostname: target.hostname,
            port: target.port || (target.protocol === 'https:' ? 443 : 80),
            path: target.pathname + target.search,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            },
            timeout: TIMEOUT_MS
        };

        let req = client.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                let latency = Date.now() - startedAt;

                if (res.statusCode !== 200) {
                    return resolve({ ok: false, detail: `HTTP ${res.statusCode} (${latency}ms): ${body}` });
                }

                let parsed;
                try {
                    parsed = JSON.parse(body);
                } catch (err) {
                    return resolve({ ok: false, detail: `Không parse được JSON (${latency}ms): ${body}` });
                }

                let data = parsed.data || {};
                if (data.status === 'healthy') {
                    return resolve({ ok: true, detail: `db=${data.database} | uptime=${data.uptime}s | ${latency}ms` });
                }
                return resolve({ ok: false, detail: `status=${data.status || 'unknown'} | db=${data.database} | ${latency}ms` });
            });
        });

        req.on('timeout', () => {
            log('ERROR', `Request timeout sau ${TIMEOUT_MS}ms`);
            req.destroy();
        });
        req.on('error', (err) => {
            let latency = Date.now() - startedAt;
            resolve({ ok: false, detail: `Không gọi được API (${latency}ms): ${err.message}` });
        });

        req.write(payload);
        req.end();
    });
}

async function runCheck() {
    let result = await checkHealth();
    let now = new Date().toISOString();

    if (result.ok) {
        log('OK', `Server healthy | ${result.detail}`);
    } else {
        // Chỉ thông báo tới Telegram khi có lỗi xảy ra (mỗi lần check lỗi đều gửi)
        log('ERROR', `Health check LỖI | ${result.detail}`);
        await sendTelegram(`🔴 [CẢNH BÁO] Health server gặp lỗi\n🖥️ ${SERVER_LABEL}\n❌ ${result.detail}\n🕒 ${now}`);
    }
}

// ===== Khởi động =====
log('INFO', `Bắt đầu giám sát health: ${HEALTH_URL} | mỗi ${INTERVAL_MINUTES} phút`);
if (!isTelegramConfigured()) {
    log('WARN', 'Telegram chưa được cấu hình. Hãy điền TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID trong file.');
}

// Chạy ngay 1 lần rồi lặp theo chu kỳ
runCheck();
let timer = setInterval(runCheck, INTERVAL_MS);

// Dừng gọn gàng khi nhận tín hiệu thoát
function shutdown(signal) {
    log('INFO', `Nhận ${signal}, dừng giám sát.`);
    clearInterval(timer);
    process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
