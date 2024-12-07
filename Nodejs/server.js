const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');


const app = express();
const port = 3001;

// PostgreSQL connection setup
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'rfid',
    password: 'adonis69',
    port: 5432,
});

// Middleware
app.use(bodyParser.json());

// Login endpoint
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

    // Send user details on success
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



// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
