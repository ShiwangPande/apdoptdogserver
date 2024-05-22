import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mysql from 'mysql';
import { config } from 'dotenv';

config({ path: "./config/config.env" });
const app = express();


// Create a MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());

// Create the 'pets' table if it doesn't exist
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }

    connection.query(`
    CREATE TABLE IF NOT EXISTS pets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name TEXT,
      pic BLOB,
      gender TEXT,
      breed TEXT,
      age INT,
      weight INT,
      location TEXT,
      description TEXT,
      diseases TEXT
    )`, (error, results, fields) => {
        connection.release(); // Release the connection
        if (error) {
            console.error('Error creating pets table:', error);
        } else {
            console.log('Pets table created successfully');
        }
    });
});
app.get('/', (req, res) => {
    return res.json({ message: "Hello from backend server" });
});

// Route to handle POST requests to add data to the database
app.post('/api/pets', (req, res) => {
    const { name, pic, gender, breed, age, weight, location, description, diseases } = req.body;
    const query = `INSERT INTO pets (name, pic, gender, breed, age, weight, location, description, diseases) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    pool.query(query, [name, pic, gender, breed, age, weight, location, description, diseases], (err, results) => {
        if (err) {
            return res.status(400).json('Error: ' + err.message);
        }
        res.json({ id: results.insertId, ...req.body });
    });
});

// Route to fetch data from the database
app.get('/api/pets', (req, res) => {
    const query = `SELECT * FROM pets`;

    pool.query(query, (err, rows) => {
        if (err) {
            return res.status(400).json('Error: ' + err.message);
        }
        res.json(rows);
    });
});

// Route to handle PUT requests to update pet information
app.put('/api/pets/:id', (req, res) => {
    const { id } = req.params;
    const { name, pic, gender, breed, age, weight, location, description, diseases } = req.body;

    const query = `
    UPDATE pets 
    SET 
      name = ?, 
      pic = ?, 
      gender = ?, 
      breed = ?, 
      age = ?, 
      weight = ?, 
      location = ?, 
      description = ?, 
      diseases = ? 
    WHERE 
      id = ?
  `;

    pool.query(query, [name, pic, gender, breed, age, weight, location, description, diseases, id], (err, results) => {
        if (err) {
            return res.status(400).json('Error: ' + err.message);
        }
        res.json({ id: id, message: 'Pet info updated successfully' });
    });
});

// Route to handle DELETE requests to delete pet information
app.delete('/api/pets/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM pets WHERE id = ?`;

    pool.query(query, [id], (err, results) => {
        if (err) {
            return res.status(400).json('Error: ' + err.message);
        }
        res.json({ deletedID: id });
    });
});

// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
