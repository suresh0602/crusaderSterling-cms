'use strict';

/**
 * notification api
 */

const { createCoreApi } = require('@strapi/strapi').factories;

module.exports = createCoreApi('api::notification.notification');
