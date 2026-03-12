'use strict';

const CALLBACK_URL = process.env.PROVIDER_CALLBACK_URL || `http://${process.env.STRAPI_URL || 'localhost:1337'}/api/custom-auth/provider-callback`;

module.exports = {
  apis: {
    providerLogin: `http://${process.env.STRAPI_URL || 'localhost:1337'}/api/custom-auth/provider-login`,
    providerCallback: CALLBACK_URL,
    sendOTP: `http://${process.env.STRAPI_URL || 'localhost:1337'}/api/custom-auth/send-otp`,
    verifyOTP: `http://${process.env.STRAPI_URL || 'localhost:1337'}/api/custom-auth/verify-otp`,
    resetPassword: `http://${process.env.STRAPI_URL || 'localhost:1337'}/api/custom-auth/reset-password`,
  }
};