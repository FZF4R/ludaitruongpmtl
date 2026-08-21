const axios = require('axios')

let envConfig = {}
try {
  envConfig = require('./env').env || {}
} catch (error) {
  envConfig = {}
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || envConfig.googleClientId || ''
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || envConfig.facebookAppId || ''
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || envConfig.facebookAppSecret || ''

const REQUEST_TIMEOUT = 8000
const GOOGLE_TOKENINFO_URL = process.env.GOOGLE_TOKENINFO_URL || 'https://oauth2.googleapis.com/tokeninfo'
const GOOGLE_USERINFO_URL = process.env.GOOGLE_USERINFO_URL || 'https://www.googleapis.com/oauth2/v3/userinfo'
const FACEBOOK_GRAPH_URL = process.env.FACEBOOK_GRAPH_URL || 'https://graph.facebook.com/v19.0'

const failure = errorCode => ({ success: false, profile: null, errorCode: errorCode })

const isTrue = value => value === true || String(value) === 'true'

const verifyGoogleToken = async accessToken => {
  if (!GOOGLE_CLIENT_ID) {
    sails.log.warn('[OAuth][Google] Chua cau hinh GOOGLE_CLIENT_ID -> tu choi dang nhap bang Google.')

    return failure('oauthNotConfigured')
  }

  if (!accessToken) return failure('oauthTokenInvalid')

  try {
    const { data: tokenInfo } = await axios.get(GOOGLE_TOKENINFO_URL, {
      params: { access_token: accessToken },
      timeout: REQUEST_TIMEOUT
    })

    const audience = (tokenInfo && (tokenInfo.aud || tokenInfo.azp)) || ''

    if (audience !== GOOGLE_CLIENT_ID) {
      sails.log.warn('[OAuth][Google] Token phat hanh cho client khac:', audience)

      return failure('oauthTokenInvalid')
    }

    const { data: userInfo } = await axios.get(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: REQUEST_TIMEOUT
    })

    const providerId = (userInfo && userInfo.sub) || tokenInfo.sub

    if (!providerId) return failure('oauthTokenInvalid')

    const emailVerified = userInfo && userInfo.email_verified !== undefined
      ? isTrue(userInfo.email_verified)
      : isTrue(tokenInfo.email_verified)

    return {
      success: true,
      errorCode: '',
      profile: {
        provider: 'google',
        providerId: String(providerId),
        email: (userInfo && userInfo.email) || tokenInfo.email || '',
        emailVerified: emailVerified,
        fullName: (userInfo && userInfo.name) || ''
      }
    }
  } catch (error) {
    sails.log.error('[OAuth][Google] Loi khi xac thuc token:', error.message)

    return failure('oauthTokenInvalid')
  }
}

const verifyFacebookToken = async accessToken => {
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    sails.log.warn('[OAuth][Facebook] Chua cau hinh FACEBOOK_APP_ID/FACEBOOK_APP_SECRET -> tu choi dang nhap bang Facebook.')

    return failure('oauthNotConfigured')
  }

  if (!accessToken) return failure('oauthTokenInvalid')

  try {
    const { data: debugResult } = await axios.get(`${FACEBOOK_GRAPH_URL}/debug_token`, {
      params: {
        input_token: accessToken,
        access_token: `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`
      },
      timeout: REQUEST_TIMEOUT
    })

    const tokenInfo = debugResult && debugResult.data

    if (!tokenInfo || tokenInfo.is_valid !== true || String(tokenInfo.app_id) !== String(FACEBOOK_APP_ID)) {
      sails.log.warn('[OAuth][Facebook] Token khong hop le hoac khong thuoc app nay.')

      return failure('oauthTokenInvalid')
    }

    const { data: userInfo } = await axios.get(`${FACEBOOK_GRAPH_URL}/me`, {
      params: { fields: 'id,name,email', access_token: accessToken },
      timeout: REQUEST_TIMEOUT
    })

    const providerId = (userInfo && userInfo.id) || tokenInfo.user_id

    if (!providerId) return failure('oauthTokenInvalid')

    return {
      success: true,
      errorCode: '',
      profile: {
        provider: 'facebook',
        providerId: String(providerId),
        email: (userInfo && userInfo.email) || '',
        emailVerified: !!(userInfo && userInfo.email),
        fullName: (userInfo && userInfo.name) || ''
      }
    }
  } catch (error) {
    sails.log.error('[OAuth][Facebook] Loi khi xac thuc token:', error.message)

    return failure('oauthTokenInvalid')
  }
}

module.exports.OAuth = {
  verifyGoogleToken,
  verifyFacebookToken,
  isGoogleEnabled: !!GOOGLE_CLIENT_ID,
  isFacebookEnabled: !!(FACEBOOK_APP_ID && FACEBOOK_APP_SECRET)
}
