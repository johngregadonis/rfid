const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// PostgreSQL configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost', // or your database server's IP/URL
  database: 'rfid',
  password: 'adonis69',
  port: 5432, // Default PostgreSQL port
});

// API route for registration
app.post('/register', async (req, res) => {
  const { name, contact, address, bodyNumber, password, confirmPassword } = req.body;

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  try {
    // Insert the data into the database without hashing the password
    const query = `
      INSERT INTO vehicle_operators (name, contact, address, body_number, password)
      VALUES ($1, $2, $3, $4, $5) RETURNING id;
    `;
    const values = [name, contact, address, bodyNumber, password];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: 'Registration successful!',
      userId: result.rows[0].id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error registering user.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
