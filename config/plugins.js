'use strict';

module.exports = () => ({
  email: {
    config: {
      provider: 'sendgrid',
      providerOptions: {
        apiKey: process.env.SENDGRID_API_KEY,
      },
      settings: {
        defaultFrom: process.env.STRAPI_ADMIN_EMAIL_FROM || 'no-reply@crusadersterling.com',
        defaultReplyTo: process.env.STRAPI_ADMIN_EMAIL_REPLY_TO || 'support@crusadersterling.com',
      },
    },
  },
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '7d',
      },
    },
  },
});
