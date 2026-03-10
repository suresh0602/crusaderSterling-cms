const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./.tmp/data.db');

const actions = [
  'api::role-permission.role-permission.find',
  'api::role-permission.role-permission.findOne',
  'api::role-permission.role-permission.create',
  'api::role-permission.role-permission.update',
  'api::role-permission.role-permission.delete',
  'api::workflow-config.workflow-config.find',
  'api::workflow-config.workflow-config.findOne',
  'api::workflow-config.workflow-config.create',
  'api::workflow-config.workflow-config.update',
  'api::workflow-config.workflow-config.delete'
];

db.serialize(() => {
  actions.forEach(action => {
    db.run("INSERT INTO up_permissions (action, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))", [action], function(err) {
      if (err) {
        // Likely already exists, we will just try to link it. We should actually query the id first but for simplicity let's do a SELECT/INSERT combo.
        // We'll ignore unique constraints on up_permissions mostly.
      }
      
      const permIdQuery = "SELECT id FROM up_permissions WHERE action = ?";
      db.get(permIdQuery, [action], (err, row) => {
        if (err || !row) return;
        const permId = row.id;

        // Roles: 1 Authenticated, 2 Public
        [1, 2].forEach(roleId => {
          db.run("INSERT INTO up_permissions_role_links (permission_id, role_id) VALUES (?, ?)", [permId, roleId], function(err) {
             // Ignore duplicate link constraints
          });
        });
      });
    });
  });
});

setTimeout(() => {
    db.close(() => console.log('Permissions injected v3.'));
}, 1000);
