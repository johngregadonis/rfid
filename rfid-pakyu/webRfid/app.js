const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Create a PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres', // Replace with your PostgreSQL username
  host: 'localhost',
  database: 'rfid', // Replace with your PostgreSQL database name
  password: 'adonis69', // Replace with your PostgreSQL password
  port: 5432,
});

// Create an Express app
const app = express();
const port = 1000;

// Middleware to parse incoming JSON and form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Endpoint to handle registration
app.post('/register', async (req, res) => {
  const { fullname, username, email, number, password, confirmPassword, gender } = req.body;

  // Check if password and confirm password match
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user data into the PostgreSQL table
    const query = `
      INSERT INTO users (fullname, username, email, phone_number, password, gender)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`;
    
    const result = await pool.query(query, [fullname, username, email, number, hashedPassword, gender]);

    // Respond with the saved user data (excluding password)
    const savedUser = result.rows[0];
    delete savedUser.password; // Remove password from response for security

    res.status(201).json({ message: 'User registered successfully', user: savedUser });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to handle login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user by username
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Remove the password from the response
    delete user.password;

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
