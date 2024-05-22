// backend/db.js

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./pets.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    pic TEXT,
    gender TEXT,
    breed TEXT,
    age INTEGER,
    weight TEXT,
    location TEXT,
    description TEXT,
    diseases TEXT
  )`);
});

module.exports = db;
