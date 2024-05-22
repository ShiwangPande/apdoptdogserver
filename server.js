// backend/server.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
const app = express();
const PORT = 5000;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());

app.post('/api/pets', (req, res) => {
    const { name, pic, gender, breed, age, weight, location, description, diseases } = req.body;
    const query = `INSERT INTO pets (name, pic, gender, breed, age, weight, location, description, diseases) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [name, pic, gender, breed, age, weight, location, description, diseases], function (err) {
        if (err) {
            return res.status(400).json('Error: ' + err.message);
        }
        res.json({ id: this.lastID, ...req.body });
    });
});

app.get('/api/pets', (req, res) => {
    const query = `SELECT * FROM pets`;

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(400).json('Error: ' + err.message);
        }
        res.json(rows);
    });
});

// Handle PUT request to update pet information
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

    db.run(query, [name, pic, gender, breed, age, weight, location, description, diseases, id], function (err) {
        if (err) {
            return res.status(400).json('Error: ' + err.message);
        }
        res.json({ id: id, message: 'Pet info updated successfully' });
    });
});

app.delete('/api/pets/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM pets WHERE id = ?`;

    db.run(query, id, function (err) {
        if (err) {
            return res.status(400).json('Error: ' + err.message);
        }
        res.json({ deletedID: id });
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
