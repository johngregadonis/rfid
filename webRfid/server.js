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

  

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  }

  try {
    const query = `
      INSERT INTO vehicle_operators (name, contact, address, body_number, password, uid, balance)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;`;
    const values = [name, contact, address, bodyNumber, password, uid, balance];

    await pool.query(query, values);

    res.status(200).json({ success: true, message: 'Registration successful!' });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

// --- RFID Routes to reduce balance ---
app.post('/rfid', async (req, res) => {
  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'UID is required' });
  }

  try {
    // Step 1: Find the matching UID in the vehicle_operators table
    const findQuery = 'SELECT id, balance FROM vehicle_operators WHERE uid = $1';
    const findResult = await pool.query(findQuery, [uid]);

    if (findResult.rows.length === 0) {
      return res.status(404).json({ error: 'UID not found in the database.' });
    }

    const vehicleOperatorId = findResult.rows[0].id;
    const currentBalance = parseFloat(findResult.rows[0].balance);

    // Step 2: Deduct 5 pesos regardless of balance
    const updateQuery = `
      UPDATE vehicle_operators
      SET balance = balance - 5
      WHERE uid = $1
      RETURNING balance;
    `;
    const updateResult = await pool.query(updateQuery, [uid]);

    const newBalance = updateResult.rows[0].balance;

    // Step 3: Determine the message based on the new balance
    let message = null;
    if (newBalance < 0) {
      message = 'You violated the ticketing regulation, visit the terminal operator.';
    } else if (currentBalance >= 5) {
      message = '₱5.00 was deducted from your balance.';
    }

    // Step 4: Insert the message into the deduct_messages table if there is a message
    if (message) {
      const insertMessageQuery = `
        INSERT INTO deduct_messages (vehicle_operator_id, deduct_message)
        VALUES ($1, $2);
      `;
      await pool.query(insertMessageQuery, [vehicleOperatorId, message]);
      console.log(`Message inserted for UID ${uid}: "${message}"`);
    }

    // Prepare the response
    const response = {
      uid,
      newBalance,
    };

    if (message) {
      response.message = message;
    }

    res.status(200).json(response);
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
    const result = await pool.query('SELECT name, body_number, uid, balance FROM vehicle_operators ORDER BY id DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch vehicle operators' });
  }
});

// Endpoint to fetch from balance_change_log
app.get('/get-balance-change', async (req, res) => {
  try {
    const { bodyNumber } = req.query; // Retrieve bodyNumber from query params
    if (!bodyNumber) {
      return res.status(400).json({ error: 'bodyNumber is required' });
    }

    const result = await pool.query(
      `SELECT 
         (bcl.date_arrival + INTERVAL '1 day') AS date_arrival,
         bcl.time_arrival,
         bcl.balance 
       FROM balance_change_log bcl 
       INNER JOIN vehicle_operators vo 
       ON bcl.vehicle_operator_id = vo.id 
       WHERE vo.body_number = $1
       ORDER BY bcl.id DESC`,
      [bodyNumber]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch balance change logs' });
  }
});



// Add balance and log history
app.post('/update-balance', async (req, res) => {
  const { bodyNumber, amount } = req.body;

  // Validate input
  if (!bodyNumber || typeof amount !== 'number' || amount <= 0) {
      console.log('Invalid input:', req.body);
      return res.status(400).json({ success: false, message: 'Invalid input.' });
  }

  try {
      // Step 1: Update the balance in the vehicle_operators table
      const updateQuery = `
          UPDATE vehicle_operators 
          SET balance = balance + $1
          WHERE body_number = $2
          RETURNING id, balance;
      `;
      const values = [amount, bodyNumber];
      const result = await pool.query(updateQuery, values);

      if (result.rows.length === 0) {
          console.log('Body number not found:', bodyNumber);
          return res.status(404).json({ success: false, message: 'Body number not found.' });
      }

      const vehicleOperatorId = result.rows[0].id; // Get the vehicle operator ID
      const newBalance = parseFloat(result.rows[0].balance); // Convert to a number
      console.log('Updated balance:', newBalance);

      // Step 2: Insert a success message into the vehicle_operator_messages table
      const successMessage = `You've successfully added ${amount} pesos to the balance.`;
      const insertMessageQuery = `
          INSERT INTO vehicle_operator_messages (vehicle_operator_id, message)
          VALUES ($1, $2);
      `;
      await pool.query(insertMessageQuery, [vehicleOperatorId, successMessage]);

      // Step 3: Log the transaction in the load_history table
      const insertHistoryQuery = `
          INSERT INTO load_history (body_number, amount, transaction_date, remarks)
          VALUES ($1, $2, NOW(), $3);
      `;
      const remarks = 'Balance updated via UI';
      await pool.query(insertHistoryQuery, [bodyNumber, amount, remarks]);

      // Send the response back to the client
      const response = { success: true, newBalance, message: successMessage };
      console.log('Response to frontend:', response);
      res.status(200).json(response);
  } catch (err) {
      console.error('Error updating balance:', err);
      res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});


// Endpoint to fetch load history (body_number, amount, transaction_date, remarks)
app.get('/get-load-history', async (req, res) => {
try {
  // Query to fetch load history data
  const result = await pool.query('SELECT body_number, amount, transaction_date, remarks FROM load_history ORDER BY transaction_date DESC');

  // Update remarks for each record
  const updatedRecords = result.rows.map(record => {
    // Check if the remarks need to be updated
    if (record.remarks === 'Balance updated via UI') {
      record.remarks = 'Added successfully';  // Update remarks
    }
    return record;
  });

  res.status(200).json(updatedRecords);  // Send the updated result as JSON
} catch (err) {
  console.error('Database error:', err);
  res.status(500).json({ error: 'Failed to fetch load history' });
}
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://192.168.1.8:${port}`);
});
