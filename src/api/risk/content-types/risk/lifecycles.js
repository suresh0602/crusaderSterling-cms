'use strict';

module.exports = {
  async afterCreate(event) {
    const { result, params } = event;

    try {
      const departmentId = params.data.department;
      
      if (departmentId) {
        // Find all HODs in this department
        const hods = await strapi.entityService.findMany('plugin::users-permissions.user', {
          filters: {
            department: { id: departmentId },
            role_type: 'HOD'
          }
        });

        // Create a Notification record for each HOD
        for (const hod of hods) {
          await strapi.entityService.create('api::notification.notification', {
            data: {
              title: 'New Risk Submission',
              message: `A new risk has been submitted: ${result.title}`,
              link: `/risk-management/approve/${result.id}`,
              isRead: false,
              user: hod.id,
              publishedAt: new Date(),
            },
          });
        }

        // Emit socket event for real-time notification
        if (strapi.io) {
          strapi.io.emit('new_risk_submission', {
            id: result.id,
            title: result.title,
            departmentId: departmentId
          });
        }
      }
    } catch (err) {
      console.error('Error in Risk lifecycle afterCreate:', err);
    }
  },
};
