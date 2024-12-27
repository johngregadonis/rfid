const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 5000;

// Middleware to parse form data and handle CORS
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// PostgreSQL configuration (shared between both parts of the server)
const pool = new Pool({
  user: 'postgres',
  host: 'localhost', // or your database server's IP/URL
  database: 'rfid',
  password: 'adonis69',
  port: 5432, // Default PostgreSQL port
});

// --- Registration Routes ---
app.post('/register', async (req, res) => {
  const { name, contact, address, bodyNumber, password, confirmPassword, uid, balance } = req.body;

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  try {
    // Insert the data into the database without hashing the password
    const query = 
      `INSERT INTO vehicle_operators (name, contact, address, body_number, password, uid, balance)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;`;
    const values = [name, contact, address, bodyNumber, password, uid, balance];

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

// --- RFID Routes ---
app.post('/rfid', async (req, res) => {
  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'UID is required' });
  }

  try {
    // Find the matching UID in the vehicle_operators table
    const findQuery = 'SELECT balance FROM vehicle_operators WHERE uid = $1';
    const findResult = await pool.query(findQuery, [uid]);

    if (findResult.rows.length === 0) {
      return res.status(404).json({ error: 'UID not found in the database.' });
    }

    const currentBalance = parseFloat(findResult.rows[0].balance);
    if (currentBalance < 5) {
      return res.status(400).json({ error: 'Insufficient balance.' });
    }

    // Deduct 5 pesos
    const updateQuery = `
      UPDATE vehicle_operators
      SET balance = balance - 5
      WHERE uid = $1
      RETURNING balance;
    `;
    const updateResult = await pool.query(updateQuery, [uid]);

    const newBalance = updateResult.rows[0].balance;

    // Log the RFID detection
    await pool.query('INSERT INTO rfid_logs (uid, timestamp) VALUES ($1, NOW())', [uid]);

    console.log(`Balance updated for UID ${uid}: ₱${newBalance}`);
    res.status(200).json({
      message: 'Balance updated successfully.',
      uid,
      newBalance,
    });
  } catch (err) {
    console.error('Error processing UID:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// Endpoint to fetch recent RFID logs
app.get('/get-rfid-logs', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.uid, l.timestamp
       FROM rfid_logs l
       ORDER BY l.timestamp DESC LIMIT 10`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch RFID logs' });
  }
});



// Endpoint to fetch body number, uid, and balance from vehicle_operators
app.get('/get-vehicle-operators', async (req, res) => {
  try {
    const result = await pool.query('SELECT body_number, uid, balance FROM vehicle_operators ORDER BY id DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch vehicle operators' });
  }
});

app.post('/update-balance', async (req, res) => {
  const { bodyNumber, amount } = req.body;

  if (!bodyNumber || typeof amount !== 'number') {
    console.log('Invalid input:', req.body);
    return res.status(400).json({ success: false, message: 'Invalid input.' });
  }

  try {
    const updateQuery = 
      `UPDATE vehicle_operators 
      SET balance = balance + $1 
      WHERE body_number = $2
      RETURNING balance;`;
    const values = [amount, bodyNumber];
    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      console.log('Body number not found:', bodyNumber);
      return res.status(404).json({ success: false, message: 'Body number not found.' });
    }

    const newBalance = parseFloat(result.rows[0].balance); // Convert to a number
    console.log('Updated balance:', newBalance);

    const response = { success: true, newBalance };
    console.log('Response to frontend:', response);
    res.status(200).json(response);
  } catch (err) {
    console.error('Error updating balance:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://192.168.1.7:${port}`);
});
