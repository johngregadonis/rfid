const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize the express app
const app = express();
const secretKey = 'your_secret_key'; // Secret key for signing JWT

// Middleware
app.use(bodyParser.json());
app.use(cors());

// PostgreSQL setup
const pool = new Pool({
  user: 'postgres',        // Replace with your PostgreSQL user
  host: 'localhost',
  database: 'rfid',         // Replace with your database name
  password: '12345', // Replace with your database password
  port: 5432,
});

// Connect to the PostgreSQL database
pool.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the PostgreSQL database');
  }
});

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Query the database to find the user by username
  const query = 'SELECT * FROM users WHERE username = $1';
  pool.query(query, [username], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const user = result.rows[0];

    // Compare the password with the hashed password stored in the database
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error comparing passwords' });
      }

      if (isMatch) {
        // Generate JWT token
        const token = jwt.sign({ id: user.id, username: user.username }, secretKey, {
          expiresIn: '1h', // Token expires in 1 hour
        });

        // Send token in response
        res.status(200).json({
          success: true,
          message: 'Login successful',
          token: token,
        });
      } else {
        res.status(401).json({ success: false, message: 'Invalid username or password' });
      }
    });
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
