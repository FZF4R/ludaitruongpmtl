module.exports.env = {
    // Google reCAPTCHA v2 secret key (cặp với VITE_RECAPTCHA_SITE_KEY của FrontEnd).
    // Lấy tại https://www.google.com/recaptcha/admin -> chọn reCAPTCHA v2 "I'm not a robot".
    // Ưu tiên dùng biến môi trường RECAPTCHA_SECRET_KEY; để trống cả hai = bỏ qua verify captcha (dev).
    recaptchaSecretKey: '6Leyt4ItAAAAAE3vDxWv3jhCHGGHXcr0eXmwuq8D',
    jwtEncryptSetting: {
        key: '#!92832332334@!!!us@@@@mlocal',
        algorithm: 'aes-256-cbc',
        // Cac key cu: chi dung de GIAI MA token da phat hanh truoc day.
        // Token moi luon ky bang `key` o tren. Xoa bot sau khi token cu het han (180d).
        fallbackKeys: [
            '2323334@#!9283!!!@@@@_HVBKITITZZZZ1239'
        ]
    },
    cloneEncrypt: {
        ENCRYPTION_KEY: 'Must256bytes(32characters)secret',
        IV_LENGTH: 16,
        SALT: 'mlocalZZZusZ123!!V@#$!!!@@$!@#!@VCX@#$C',
        NONCE_LENGTH: 5,
        algorithm: 'aes-256-cbc'
    }
}
