'use strict';

module.exports = {
  apis: {
    providerLogin: `http://${process.env.STRAPI_URL || 'localhost:1337'}/api/custom-auth/provider-login`,
    providerCallback: `http://${process.env.STRAPI_URL || 'localhost:1337'}/api/custom-auth/provider-callback`,
    sendOTP: `http://${process.env.STRAPI_URL || 'localhost:1337'}/api/custom-auth/send-otp`,
    verifyOTP: `http://${process.env.STRAPI_URL || 'localhost:1337'}/api/custom-auth/verify-otp`,
    resetPassword: `http://${process.env.STRAPI_URL || 'localhost:1337'}/api/custom-auth/reset-password`,
  }
};
