'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    // Initialize Socket.io
    const { Server } = require('socket.io');
    const io = new Server(strapi.server.httpServer, {
      cors: {
        origin: '*', // Adjust to your frontend URL in production
        methods: ['GET', 'POST'],
      },
    });

    strapi.io = io;

    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);
      
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    // Seed Departments
    const departments = [
      'Risk Management',
      'IT & Cybersecurity',
      'Finance & Accounts',
      'Legal & Compliance',
      'Operations',
      'Human Resources',
      'Internal Audits'
    ];

    for (const name of departments) {
      const existing = await strapi.query('api::department.department').findOne({ where: { name } });
      if (!existing) {
        await strapi.query('api::department.department').create({ data: { name, publishedAt: new Date() } });
      }
    }

    // Seed KRIs
    const kris = [
      { title: 'System Uptime', value: '99.9%', trend: 'up', trendValue: '+0.2%', status: 'healthy' },
      { title: 'Open Security Vulnerabilities', value: '12', trend: 'down', trendValue: '-15%', status: 'warning' },
      { title: 'Regulatory Compliance Tasks', value: '94%', trend: 'up', trendValue: '+2%', status: 'healthy' },
      { title: 'Critical Incident Response Time', value: '14m', trend: 'down', trendValue: '-5%', status: 'critical' }
    ];

    for (const kri of kris) {
      const existing = await strapi.query('api::kri.kri').findOne({ where: { title: kri.title } });
      if (!existing) {
        await strapi.query('api::kri.kri').create({ data: { ...kri, publishedAt: new Date() } });
      }
    }

    // Seed Audits
    const audits = [
      { title: 'Q4 Cybersecurity Audit', date: '2025-12-15', status: 'Closed', score: 92 },
      { title: 'Annual Financial Compliance', date: '2026-01-10', status: 'Closed', score: 95 },
      { title: 'Branch Operations Review', date: '2026-02-28', status: 'Ongoing', score: 0 }
    ];

    for (const audit of audits) {
      const existing = await strapi.query('api::audit.audit').findOne({ where: { title: audit.title } });
      if (!existing) {
        await strapi.query('api::audit.audit').create({ data: { ...audit, publishedAt: new Date() } });
      }
    }
  },
};
