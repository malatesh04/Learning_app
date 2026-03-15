const bcrypt = require('bcryptjs');
const db = require('better-sqlite3')('lms.db');

const salt = bcrypt.genSaltSync(10);
const newAdminPassword = bcrypt.hashSync('Malatesh@12', salt);
const newAdminEmail = 'malateshbn179@gmail.com';

db.prepare('UPDATE users SET email = ?, password = ? WHERE role = ?').run(
  newAdminEmail, newAdminPassword, 'admin'
);

console.log('Admin credentials updated successfully in the database!');
