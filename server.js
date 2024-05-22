import bodyParser from 'body-parser';
import cors from 'cors';
import mysql from 'mysql';
import express from 'express';
import { config } from 'dotenv';

config({ path: "./config/config.env" });

const app = express();
const PORT = process.env.PORT || 8081;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Function to execute SQL queries
const query = (sql, params, callback) => {
    pool.getConnection((err, connection) => {
        if (err) {
            // Handle connection error
            callback(err, null);
            return;
        }

        connection.query(sql, params, (error, results, fields) => {
            connection.release(); // Release the connection
            callback(error, results);
        });
    });
};

// Create the 'pets' table if it doesn't exist
const createPetsTable = () => {
    const sql = `CREATE TABLE IF NOT EXISTS pets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    pic VARCHAR(255),
    gender ENUM('Male', 'Female'),
    breed VARCHAR(255),
    age INT,
    weight VARCHAR(50),
    location VARCHAR(255),
    description TEXT,
    diseases TEXT
  )`;

    query(sql, [], (error, results) => {
        if (error) {
            console.error('Error creating pets table:', error);
        } else {
            console.log('Pets table created successfully');
        }
    });
};

// Call the function to create the 'pets' table
createPetsTable();

// Routes

app.post('/api/pets', (req, res) => {
    const { name, pic, gender, breed, age, weight, location, description, diseases } = req.body;
    const queryStr = `INSERT INTO pets (name, pic, gender, breed, age, weight, location, description, diseases) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    query(queryStr, [name, pic, gender, breed, age, weight, location, description, diseases], (err, results) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ id: results.insertId, ...req.body });
    });
});

app.get('/api/pets', (req, res) => {
    const queryStr = `SELECT * FROM pets`;

    query(queryStr, [], (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Handle PUT request to update pet information
app.put('/api/pets/:id', (req, res) => {
    const { id } = req.params;
    const { name, pic, gender, breed, age, weight, location, description, diseases } = req.body;

    const queryStr = `
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

    query(queryStr, [name, pic, gender, breed, age, weight, location, description, diseases, id], (err, results) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ id: id, message: 'Pet info updated successfully' });
    });
});

app.delete('/api/pets/:id', (req, res) => {
    const { id } = req.params;
    const queryStr = `DELETE FROM pets WHERE id = ?`;

    query(queryStr, id, (err, results) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ deletedID: id });
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
