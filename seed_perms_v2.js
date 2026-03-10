const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./.tmp/data.db');

db.serialize(() => {
  db.all("PRAGMA table_info(up_permissions);", (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Columns in up_permissions:", rows.map(r => r.name));
  });
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%permission%';", (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Tables containing 'permission':", rows.map(r => r.name));
  });
});

db.close();
