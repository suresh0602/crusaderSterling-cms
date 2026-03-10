const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./.tmp/data.db');

const accessKey = crypto.randomBytes(64).toString('hex');
const salt = crypto.randomBytes(16).toString('hex');
crypto.pbkdf2(accessKey, salt, 10000, 64, 'sha512', (err, derivedKey) => {
  if (err) throw err;
  const hash = derivedKey.toString('hex');

  db.serialize(() => {
    // Check if token already exists to avoid dupes
    db.get("SELECT id FROM strapi_api_tokens WHERE name = 'AdminToken'", (err, row) => {
       if (row) {
         db.run("UPDATE strapi_api_tokens SET access_key = ?, salt = ? WHERE id = ?", [hash, salt, row.id], function(err) {
             console.log("Token updated. New access_key to use in API:", accessKey);
         });
       } else {
         const now = new Date().toISOString();
         db.run("INSERT INTO strapi_api_tokens (name, description, type, access_key, salt, created_at, updated_at, created_by_id, updated_by_id) VALUES ('AdminToken', 'For frontend', 'full-access', ?, ?, ?, ?, 1, 1)", [hash, salt, now, now], function(err) {
            console.log("Token created. New access_key to use in API:", accessKey);
         });
       }
    });
  });
  setTimeout(() => db.close(), 1000);
});
