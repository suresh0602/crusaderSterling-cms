const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./.tmp/data.db');

db.serialize(() => {
  // We need to inject the permissions for both api::role-permission.role-permission and api::workflow-config.workflow-config
  // into the up_permissions table.
  // The role_id for Public is usually 2, Authenticated is usually 1. 
  
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

  actions.forEach(action => {
    // Add to Public role (role_id 2)
    db.run("INSERT INTO up_permissions (action, role_id, created_at, updated_at) VALUES (?, 2, datetime('now'), datetime('now'))", [action], function(err) {
      if (err) console.error(err.message);
    });
    // Add to Authenticated role (role_id 1)
    db.run("INSERT INTO up_permissions (action, role_id, created_at, updated_at) VALUES (?, 1, datetime('now'), datetime('now'))", [action], function(err) {
      if (err) console.error(err.message);
    });
  });
});

db.close(() => console.log('Permissions injected.'));
