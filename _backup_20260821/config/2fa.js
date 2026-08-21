const qrcode = require('qrcode')
const otplib = require('otplib')
const { authenticator } = otplib


const generateUniqueSecret = () => {
  return authenticator.generateSecret()
}


const generateOTPToken = (userid, serviceName, secret) => {
  return authenticator.keyuri(userid, serviceName, secret)
}

const verifyOTPToken = (token, secret) => {
  return authenticator.verify({ token, secret })
}

const generateQRCode = async (otpAuth) => {
  try {
    const QRCodeImageUrl = await qrcode.toDataURL(otpAuth)
    return `${QRCodeImageUrl}`
  } catch (error) {
    console.log('Could not generate QR code', error)
    return
  }
}

module.exports.TwoFA = {
  generateUniqueSecret,
  verifyOTPToken,
  generateOTPToken,
  generateQRCode,
}
