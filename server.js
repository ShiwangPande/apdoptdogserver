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
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = ['https://adoptdog.vercel.app'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

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
        pic LONGTEXT,
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

// Update the 'pic' column type to LONGTEXT if it already exists
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }

    connection.query(`
    ALTER TABLE pets MODIFY pic LONGTEXT`, (error, results, fields) => {
        connection.release(); // Release the connection
        if (error) {
            console.error('Error modifying pic column:', error);
        } else {
            console.log('Pic column modified to LONGTEXT successfully');
        }
    });
});

// API endpoints
app.get('/', (req, res) => {
    res.json({ message: "Hello from backend server" });
});

app.post('/api/pets', (req, res) => {
    const { name, pic, gender, breed, age, weight, location, description, diseases } = req.body;

    // Base64 encoded image data
    const imageData = req.body.pic;

    const sql = 'INSERT INTO pets (name, pic, gender, breed, age, weight, location, description, diseases) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [name, imageData, gender, breed, age, weight, location, description, diseases];

    pool.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error executing query: ', err);
            res.status(500).json({ error: 'Error executing query', details: err.message });
            return;
        }

        console.log('Pet added successfully');
        res.status(200).json({ message: 'Pet added successfully' });
    });
});

app.get('/api/pets', (req, res) => {
    const query = `SELECT * FROM pets`;

    pool.query(query, (err, rows) => {
        if (err) {
            return res.status(400).json('Error: ' + err.message);
        }
        res.json(rows);
    });
});

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
