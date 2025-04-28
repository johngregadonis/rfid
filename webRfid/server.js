require('dotenv').config();



const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const WebSocket = require('ws');
const nodemailer = require("nodemailer");
const path = require('path');

const app = express();
const PORT = 2000;
const secretKey = 'your_secret_key';
const wss = new WebSocket.Server({ port: 8082 });

// Serve static files (HTML, CSS, JS) from the correct directory
app.use(express.static(__dirname)); 

// Serve dashboard.html as the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'welcompage.html'));
});

const backendUrl = process.env.BACKEND_URL || 'http://localhost:2000';

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// PostgreSQL configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost', // or your database server's IP/URL
  database: 'rfid',
  password: 'adonis69',
  port: 5432, // Default PostgreSQL port
});

// --- Shared Middleware ---
pool.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the PostgreSQL database');
  }
});

let masterTabId = null;
let masterTabSocket = null;
let masterRole = null;

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'register') {
            const { tabId, role, expectedRole } = data;

            // 🔐 Role mismatch (user trying to access wrong panel)
            if (role !== expectedRole) {
                console.log(`Role mismatch: role=${role}, expected=${expectedRole}`);
                ws.send(JSON.stringify({ error: 'unauthorized' }));
                ws.close();
                return;
            }

            // ✅ First valid tab becomes the master
            if (!masterTabId) {
                masterTabId = tabId;
                masterRole = role;
                masterTabSocket = ws;
                console.log(`Master tab registered: ${masterTabId} with role ${masterRole}`);
                return;
            }

            // ❌ Prevent access if tabId doesn't match master
            if (tabId !== masterTabId) {
                console.log(`Blocked duplicate tab: ${tabId}`);
                ws.send(JSON.stringify({ error: 'Dashboard is already open in another tab or browser.' }));
                ws.close();
                return;
            }

            // ✅ Original tab reconnecting
            masterTabSocket = ws;
            console.log('Master tab reconnected');
        }
    });

    ws.on('close', () => {
        if (ws === masterTabSocket) {
            console.log('Master tab disconnected, waiting for reconnection...');
        }
    });
});

console.log('WebSocket server running on ws://localhost:8081');

// --- Authentication Routes ---

//user login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT id, username, password FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = result.rows[0];

    // Verify password using crypt() function
    const passwordCheck = await pool.query('SELECT crypt($1, $2) AS hashed', [password, user.password]);

    if (passwordCheck.rows[0].hashed !== user.password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      
    );

    // Respond with only the token
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Signup route
app.post('/signup', async (req, res) => {
  const { fullname, username, email, number, password, confirmPassword } = req.body;

  console.log('Phone Number Received:', number); // Debug log

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (fullname, username, email, phone_number, password)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`;
    const result = await pool.query(query, [fullname, username, email, number, hashedPassword]);

    const savedUser = result.rows[0];
    delete savedUser.password;

    res.status(201).json({ message: 'User registered successfully', user: savedUser });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// --- RFID and Vehicle Operator Routes ---

// --- Registration Routes ---
app.post('/register', async (req, res) => {
  const { name, bodyNumber, password, balance, confirmPassword, uid, barangay, address } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  }

  try {
    // Step 1: Insert into vehicle_operators table
    const query = `
      INSERT INTO vehicle_operators (name, body_number, password, balance, uid, barangay, address)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;
    `;
    const values = [name, bodyNumber, password, balance, uid, barangay, address];
    const result = await pool.query(query, values);
    const vehicleOperatorId = result.rows[0].id;

    // Step 2: Insert into load_history table
    const loadHistoryQuery = `
      INSERT INTO load_history (body_number, amount, transaction_date, remarks)
      VALUES ($1, $2, NOW(), $3);
    `;
    const remarks = 'Initial balance added';
    const loadHistoryValues = [bodyNumber, balance, remarks];
    await pool.query(loadHistoryQuery, loadHistoryValues);

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
    // Step 1: Find the matching UID in the vehicle_operators table and check last_update
    const findQuery = `
      SELECT id, balance, body_number, last_update
      FROM vehicle_operators
      WHERE uid = $1
      ORDER BY last_update DESC
      LIMIT 1;
    `;
    const findResult = await pool.query(findQuery, [uid]);

    if (findResult.rows.length === 0) {
      return res.status(404).json({ error: 'UID not found in the database.' });
    }

    const vehicleOperatorId = findResult.rows[0].id;
    const currentBalance = parseFloat(findResult.rows[0].balance);
    const bodyNumber = findResult.rows[0].body_number;
    const lastUpdate = findResult.rows[0].last_update;

    // Step 2: Check if the last deduction already used this last_update
    const checkDeductionQuery = `
      SELECT last_update_used FROM balance_deductions WHERE vehicle_operator_id = $1
      ORDER BY last_update_used DESC
      LIMIT 1;
    `;
    const checkDeductionResult = await pool.query(checkDeductionQuery, [vehicleOperatorId]);

    if (checkDeductionResult.rows.length > 0) {
      const lastUpdateUsed = checkDeductionResult.rows[0].last_update_used;
      
      if (lastUpdateUsed && lastUpdateUsed.toISOString() === lastUpdate.toISOString()) {
        return res.status(400).json({ error: 'Balance deduction already made for this update. Update required before next deduction.' });
      }
    }

    // Step 3: Deduct 5 pesos regardless of balance
    const updateQuery = `
      UPDATE vehicle_operators
      SET balance = balance - 5
      WHERE uid = $1
      RETURNING balance;
    `;
    const updateResult = await pool.query(updateQuery, [uid]);

    const newBalance = updateResult.rows[0].balance;

    // Step 4: Record this last_update as used in balance_deductions
    const recordDeductionQuery = `
      INSERT INTO balance_deductions (vehicle_operator_id, last_update_used)
      VALUES ($1, $2);
    `;
    await pool.query(recordDeductionQuery, [vehicleOperatorId, lastUpdate]);

    // Step 5: Determine the message based on the new balance
    let message = null;
    if (newBalance < 0) {
      message = 'You violated the ticketing regulation, visit the terminal operator.';
    } else if (currentBalance >= 5) {
      message = '₱5.00 was deducted from your balance.';
    }

    // Step 6: Insert the message into the deduct_messages table if there is a message
    if (message) {
      const insertMessageQuery = `
        INSERT INTO deduct_messages (vehicle_operator_id, deduct_message)
        VALUES ($1, $2);
      `;
      await pool.query(insertMessageQuery, [vehicleOperatorId, message]);
      console.log(`Message inserted for UID ${uid}: "${message}"`);
    }

    // Step 7: Insert detection data into detected_uid table
    const now = new Date();
    const timeDetected = now.toTimeString().split(' ')[0]; // Get HH:MM:SS
    const dateDetected = now.toISOString().split('T')[0];  // Get YYYY-MM-DD

    // Check if UID was detected before
    const checkDetectionQuery = `
      SELECT times_detected FROM detected_uid WHERE uid = $1 AND date_detected = $2;
    `;
    const detectionResult = await pool.query(checkDetectionQuery, [uid, dateDetected]);

    if (detectionResult.rows.length > 0) {
      // Update existing detection count
      const updatedTimesDetected = detectionResult.rows[0].times_detected + 1;
      const updateDetectionQuery = `
        UPDATE detected_uid 
        SET times_detected = $1, time_detected = $2
        WHERE uid = $3 AND date_detected = $4;
      `;
      await pool.query(updateDetectionQuery, [updatedTimesDetected, timeDetected, uid, dateDetected]);
    } else {
      // Insert new detection record
      const insertDetectionQuery = `
        INSERT INTO detected_uid (vehicle_operator_id, uid, body_number, time_detected, date_detected, times_detected)
        VALUES ($1, $2, $3, $4, $5, $6);
      `;
      await pool.query(insertDetectionQuery, [vehicleOperatorId, uid, bodyNumber, timeDetected, dateDetected, 1]);
    }

    // Prepare the response
    const response = {
      uid,
      newBalance,
      bodyNumber, // Include body number in the response
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


app.get('/get-detected-vehicle', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT body_number, uid, balance 
       FROM vehicle_operators 
       WHERE updated_at >= NOW() - INTERVAL '24 hour' 
       ORDER BY updated_at DESC 
       LIMIT 1`
    );

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ message: "No detected vehicle found" });
    }
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch detected vehicle' });
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
//old


// Add balance and log history
app.post('/update-balance', async (req, res) => {
  const { bodyNumber, amount } = req.body;

  // Validate input
  if (!bodyNumber || typeof amount !== 'number' || amount <= 0) {
    console.log('Invalid input:', req.body);
    return res.status(400).json({ success: false, message: 'Invalid input.' });
  }

  try {
    // Disable triggers temporarily to avoid logging into balance_change_log
    await pool.query('SET session_replication_role = replica;');

    // Step 1: Update the balance in the vehicle_operators table
    const updateQuery = `
      UPDATE vehicle_operators 
      SET balance = balance + $1
      WHERE body_number = $2
      RETURNING id, balance;
    `;
    const values = [amount, bodyNumber];
    const result = await pool.query(updateQuery, values);

    // Enable triggers back after the update
    await pool.query('SET session_replication_role = DEFAULT;');

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
    const remarks = 'Reloaded Successfully';
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
    if (record.remarks === 'Reloaded Successfully') {
       // Update remarks
    }
    return record;
  });

  res.status(200).json(updatedRecords);  // Send the updated result as JSON
} catch (err) {
  console.error('Database error:', err);
  res.status(500).json({ error: 'Failed to fetch load history' });
}
});

// Save fine payment endpoint
app.post('/save-fine-payment', async (req, res) => {
  const { bodyNumber, amount } = req.body;

  if (!bodyNumber || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid input data.' });
  }

  try {
    const vehicleOperator = await pool.query(
      'SELECT id FROM vehicle_operators WHERE body_number = $1',
      [bodyNumber]
    );

    if (vehicleOperator.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle operator not found.' });
    }

    const vehicleOperatorId = vehicleOperator.rows[0].id;

    const now = new Date();
    const datePaid = now.toISOString().split('T')[0];
    const timePaid = now.toTimeString().split(' ')[0];

    await pool.query(
      `INSERT INTO fine_payment (vehicle_operator_id, body_number, date_paid, time_paid, amount)
       VALUES ($1, $2, $3, $4, $5)`,
      [vehicleOperatorId, bodyNumber, datePaid, timePaid, amount]
    );

    res.status(200).json({ success: true, message: 'Fine payment saved successfully.' });
  } catch (error) {
    console.error('Error saving fine payment:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Endpoint to fetch fine_payment data
app.get('/fine-payments', async (req, res) => {
  try {
    const query = 'SELECT body_number, date_paid, time_paid, amount FROM fine_payment';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching fine_payment data:', error);
    res.status(500).send('An error occurred while fetching the data.');
  }
});

app.get('/detected-tricycles', async (req, res) => {
  try {
    console.log('Fetching detected tricycles...');
    
    const query = `
      SELECT body_number, time_detected, date_detected, times_detected 
      FROM detected_uid 
      ORDER BY date_detected DESC, time_detected DESC
    `;
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      console.log('No detected tricycles found.');
    } else {
      console.log('Data retrieved:', result.rows);
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching detected tricycles:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/api/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Fetch user's fullname from the database
    const result = await pool.query('SELECT fullname FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ fullname: result.rows[0].fullname });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(403).json({ message: 'Invalid or expired token' });
  }
});

app.post('/api/change-password', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Check if new password and confirm password match
      if (newPassword !== confirmPassword) {
          return res.status(400).json({ message: 'New password and confirm password do not match' });
      }

      // Get the user's stored password from the database
      const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);

      if (userResult.rows.length === 0) {
          return res.status(404).json({ message: 'User not found' });
      }

      const storedPassword = userResult.rows[0].password;

      // Verify current password using crypt()
      const passwordCheck = await pool.query(
          'SELECT crypt($1, password) = password AS is_valid FROM users WHERE id = $2',
          [currentPassword, userId]
      );

      if (!passwordCheck.rows[0].is_valid) {
          return res.status(401).json({ message: 'Current password is incorrect' });
      }

      // Encrypt the new password using crypt()
      const newEncryptedPasswordResult = await pool.query(
          'SELECT crypt($1, gen_salt(\'bf\')) AS encrypted_password',
          [newPassword]
      );

      const newEncryptedPassword = newEncryptedPasswordResult.rows[0].encrypted_password;

      // Update the password in the database
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newEncryptedPassword, userId]);

      res.json({ message: 'Password changed successfully' });
  } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

const otpStorage = {}; // Store OTPs temporarily

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS  // Your email password or App Password
    }
});

// Generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Forgot Password Endpoint
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
      return res.status(400).json({ error: "Email is required" });
  }

  try {
      // Check if email exists in the "users" table
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

      if (result.rows.length === 0) {
          return res.status(404).json({ error: "Email not found in the database" });
      }

      // Generate OTP and store it temporarily
      const otp = generateOTP();
      otpStorage[email] = otp;

      // Send OTP via Email
      await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Your OTP for Password Reset",
          text: `Your OTP for resetting your password is: ${otp}. It is valid for 5 minutes.`
      });

      res.json({ message: "OTP sent to your email" });

  } catch (error) {
      console.error("Error processing forgot password request:", error);
      res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
  }

  // Check if OTP exists and matches
  if (otpStorage[email] && otpStorage[email] === otp) {
      delete otpStorage[email]; // Remove OTP after successful verification
      res.json({ message: "OTP verified successfully! Proceed to reset password." });
  } else {
      res.status(400).json({ error: "Invalid or expired OTP" });
  }
});

app.post("/reset-password", async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ error: "Invalid request" });
    }
 
    try {
        // Check if email exists
        const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "Email not found" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in the database
        await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, email]);

        res.json({ message: "Password reset successfully! You can now log in with your new password." });

    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/get-detected-tricycle', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT body_number, uid, balance 
       FROM vehicle_operators 
       WHERE last_update >= NOW() - INTERVAL '24 hour' 
       ORDER BY last_update DESC 
       LIMIT 1`
    );

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ message: "No detected vehicle found" });
    }
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch detected vehicle' });
  }
});

app.get('/get-detection-details', async (req, res) => {
  try {
    const { bodyNumber } = req.query;
    if (!bodyNumber) {
      return res.status(400).json({ error: 'Body number is required' });
    }

    // Fetch all detection details for the given body number, adding 1 day to the date
    const detectionQuery = `
      SELECT 
        (date_detected + INTERVAL '1 day') AS date_detected, 
        time_detected 
      FROM detected_vehicles 
      WHERE body_number = $1 
      ORDER BY date_detected DESC, time_detected DESC;
    `;
    const detectionResult = await pool.query(detectionQuery, [bodyNumber]);

    if (detectionResult.rows.length === 0) {
      return res.json([]); // Return an empty array if no data is found
    }

    res.json(detectionResult.rows);
  } catch (error) {
    console.error('Error fetching detection details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/get-backend-url', (req, res) => {
  res.json({ backendUrl: process.env.BACKEND_URL || 'http://localhost:2000' });
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server running on ${backendUrl}`);
});
