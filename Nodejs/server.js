const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors'); // Import CORS

// Initialize Express App
const app = express();
const port = 3001;

// Enable CORS
app.use(cors());

// PostgreSQL Connection Pool
const pool = new Pool({
  user: 'postgres',       // Replace with your PostgreSQL username
  host: 'localhost',      // Database host
  database: 'rfid',       // Database name
  password: '12345',      // Database password
  port: 5432,             // Default PostgreSQL port
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Registration Endpoint
app.post('/register', async (req, res) => {
  const { name, contact, address, body_number, password } = req.body;

  try {
    const query = `INSERT INTO vehicle_operators (name, contact, address, body_number, password, balance)
                   VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const values = [name, contact, address, body_number, password, 0]; // Default balance is 0
    const result = await pool.query(query, values);

    res.status(200).send({ message: 'Registration successful', data: result.rows[0] });
  } catch (error) {
    res.status(500).send({ message: 'Error registering user', error: error.message });
  }
});

// Fetch All Data Endpoint (Including Balance)
app.get('/operators', async (req, res) => {
  try {
    const result = await pool.query('SELECT name, contact, body_number, address, balance FROM vehicle_operators');
    res.status(200).send(result.rows);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching data', error: error.message });
  }
});

// Fetch Operator Details with Balance Endpoint
app.get('/operatorDetails', async (req, res) => {
  try {
    const bodyNumber = req.query.bodyNumber; // Pass body number as a query parameter

    if (!bodyNumber) {
      return res.status(400).json({ message: 'Body number is required' });
    }

    const query = `
      SELECT name, contact, address, body_number, balance
      FROM vehicle_operators
      WHERE body_number = $1;
    `;
    const result = await pool.query(query, [bodyNumber]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No operator found for the given body number' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching operator details', error: error.message });
  }
});

// Login Endpoint
app.post('/login', async (req, res) => {
  const { bodyNumber, password } = req.body;

  console.log("Received login request:", { bodyNumber, password }); // Debug log

  try {
    const client = await pool.connect();

    // Query user by body number
    const result = await client.query(
      'SELECT name, body_number, password FROM vehicle_operators WHERE body_number = $1',
      [bodyNumber]
    );

    console.log("Query result:", result.rows); // Debug log

    if (result.rows.length === 0) {
      console.log("User not found."); // Debug log
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    // Direct password comparison
    if (password !== user.password) {
      console.log("Invalid password."); // Debug log
      return res.status(401).json({ message: 'Invalid password' });
    }

    console.log("Login successful for:", user); // Debug log

    // Send user details on success (without full details)
    res.status(200).json({
      name: user.name,
      bodyNumber: user.body_number,
    });

    client.release();
  } catch (err) {
    console.error('Error during query', err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Fetch Full User Profile Endpoint (After login)
app.get('/user/:bodyNumber', async (req, res) => {
  const { bodyNumber } = req.params;

  try {
    const result = await pool.query(
      'SELECT name, contact, address, body_number, balance FROM vehicle_operators WHERE body_number = $1',
      [bodyNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).send({ message: 'User not found' });
    }

    res.status(200).send(result.rows[0]);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching user profile', error: error.message });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
//old code