'use strict';

/**
 * workflow-config service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::workflow-config.workflow-config');
