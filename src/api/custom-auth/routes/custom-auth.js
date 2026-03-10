'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/custom-auth/provider-login',
      handler: 'custom-auth.providerLogin',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/custom-auth/provider-callback',
      handler: 'custom-auth.providerCallback',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/custom-auth/register',
      handler: 'custom-auth.register',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/custom-auth/login',
      handler: 'custom-auth.login',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/custom-auth/send-otp',
      handler: 'custom-auth.sendOTP',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/custom-auth/verify-otp',
      handler: 'custom-auth.verifyOTP',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/custom-auth/reset-password',
      handler: 'custom-auth.resetPassword',
      config: { auth: false },
    },
  ],
};
