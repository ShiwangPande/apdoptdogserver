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

const allowedOrigins = ['https://littlepaw.vercel.app', 'http://localhost:3000'];
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

// Create the 'timeline_events' table if it doesn't exist
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }

    connection.query(`
    CREATE TABLE IF NOT EXISTS timeline_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE,
        title VARCHAR(255),
        description TEXT
    )`, (error, results, fields) => {
        connection.release(); // Release the connection
        if (error) {
            console.error('Error creating timeline_events table:', error);
        } else {
            console.log('Timeline events table created successfully');
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

// Create the 'annual_figures' table if it doesn't exist
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }

    connection.query(`
    CREATE TABLE IF NOT EXISTS annual_figures (
        id INT AUTO_INCREMENT PRIMARY KEY,
        species VARCHAR(255),
        jan INT,
        feb INT,
        mar INT,
        apr INT,
        may INT,
        jun INT,
        jul INT,
        aug INT,
        sep INT,
        oct INT,
        nov INT,
        \`dec\` INT,
        total INT
    )`, (error, results, fields) => {
        connection.release(); // Release the connection
        if (error) {
            console.error('Error creating annual_figures table:', error);
        } else {
            console.log('Annual figures table created successfully');
        }
    });
});

// API endpoints
app.get('/', (req, res) => {
    res.json({ message: "Hello from backend server" });
});

// Pets endpoints
app.post('/api/pets', (req, res) => {
    const { name, pic, gender, breed, age, weight, location, description, diseases } = req.body;

    const sql = 'INSERT INTO pets (name, pic, gender, breed, age, weight, location, description, diseases) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [name, pic, gender, breed, age, weight, location, description, diseases];

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

// Annual figures endpoints
app.get('/api/annual-figures', (req, res) => {
    const query = `SELECT * FROM annual_figures`;

    pool.query(query, (err, rows) => {
        if (err) {
            return res.status(400).json('Error: ' + err.message);
        }
        res.json(rows);
    });
});

app.post('/api/annual-figures', (req, res) => {
    console.log('Request body:', req.body); // Log the request body
    const { species, jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec } = req.body;
    //
    const total = jan + feb + mar + apr + may + jun + jul + aug + sep + oct + nov + dec;

    const sql = 'INSERT INTO annual_figures (species, jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, `dec`, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [species, jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec, total];

    pool.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error executing query: ', err);
            res.status(500).json({ error: 'Error executing query', details: err.message });
            return;
        }

        console.log('Annual figure added successfully');
        res.status(200).json({ message: 'Annual figure added successfully' });
    });
});

app.put('/api/annual-figures/:id', (req, res) => {
    const { id } = req.params;
    const { species, jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec } = req.body;
    const total = jan + feb + mar + apr + may + jun + jul + aug + sep + oct + nov + dec;

    const query = `
        UPDATE annual_figures 
        SET 
            species = ?, 
            jan = ?, 
            feb = ?, 
            mar = ?, 
            apr = ?, 
            may = ?, 
            jun = ?, 
            jul = ?, 
            aug = ?, 
            sep = ?, 
            oct = ?, 
            nov = ?, 
            \`dec\` = ?, 
            total = ?
        WHERE 
            id = ?
    `;

    pool.query(query, [species, jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec, total, id], (err, results) => {
        if (err) {
            return res.status(400).json('Error: ' + err.message);
        }
        res.json({ id: id, message: 'Annual figure updated successfully' });
    });
});

app.delete('/api/annual-figures/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM annual_figures WHERE id = ?`;

    pool.query(query, [id], (err, results) => {
        if (err) {
            return res.status(400).json('Error: ' + err.message);
        }
        res.json({ deletedID: id });
    });
});

app.post('/api/timeline-events', (req, res) => {
    const { date, title, description } = req.body;

    const sql = 'INSERT INTO timeline_events (date, title, description) VALUES (?, ?, ?)';
    const values = [date, title, description];

    pool.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error executing query: ', err);
            res.status(500).json({ error: 'Error executing query', details: err.message });
            return;
        }

        console.log('Timeline event added successfully');
        res.status(200).json({ message: 'Timeline event added successfully' });
    });
});

// Get all timeline events
app.get('/api/timeline-events', (req, res) => {
    const query = `SELECT * FROM timeline_events`;

    pool.query(query, (err, rows) => {
        if (err) {
            return res.status(400).json('Error: ' + err.message);
        }
        res.json(rows);
    });
});

app.put('/api/timeline-events/:id', (req, res) => {
    const { id } = req.params;
    const { date, title, description } = req.body;

    const sql = `
        UPDATE timeline_events 
        SET 
            date = ?, 
            title = ?, 
            description = ? 
        WHERE 
            id = ?
    `;
    const values = [date, title, description, id];

    pool.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error executing query: ', err);
            res.status(500).json({ error: 'Error executing query', details: err.message });
            return;
        }

        console.log('Timeline event updated successfully');
        res.status(200).json({ message: 'Timeline event updated successfully' });
    });
});

// Delete a timeline event
app.delete('/api/timeline-events/:id', (req, res) => {
    const { id } = req.params;

    const sql = `DELETE FROM timeline_events WHERE id = ?`;

    pool.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error executing query: ', err);
            res.status(500).json({ error: 'Error executing query', details: err.message });
            return;
        }

        console.log('Timeline event deleted successfully');
        res.status(200).json({ message: 'Timeline event deleted successfully' });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
