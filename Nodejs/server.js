const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors'); // Import CORS
const { Client } = require('pg');
const WebSocket = require('ws');
const nodemailer = require('nodemailer');


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

const otpStorage = {}
let verifiedEmail = null;
// PostgreSQL connection for listening to notifications
const pgClient = new Client({
  connectionString: 'postgres://postgres:12345@localhost:5432/rfid', // Replace with your details
});

pgClient.connect();

// Listen for PostgreSQL notifications (balance_update)
pgClient.query('LISTEN balance_update');


// Middleware for body parsing
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

// Fetch Operator Details with Barangay Instead of Contact
app.get('/operatorDetails', async (req, res) => {
  try {
    const bodyNumber = req.query.bodyNumber; // Pass body number as a query parameter

    if (!bodyNumber) {
      return res.status(400).json({ message: 'Body number is required' });
    }

    const query = `
      SELECT name, barangay, address, body_number, balance
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

// Fetch messages for a specific user based on body_number from request headers
app.get('/messages', async (req, res) => {
  const bodyNumber = req.headers['body_number'];  // Extract the body_number from the header

  if (!bodyNumber) {
    return res.status(400).json({ message: 'Body number is required in the request header' });
  }

  try {
    // Fetch the user's details from the vehicle_operators table
    const userQuery = `
      SELECT id, name, body_number
      FROM vehicle_operators
      WHERE body_number = $1
    `;
    const userResult = await pool.query(userQuery, [bodyNumber]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found for the given body number' });
    }

    const userId = userResult.rows[0].id;

    // Fetch the messages for the user from the vehicle_operator_messages table
    const messagesQuery = `
      SELECT message, timestamp
      FROM vehicle_operator_messages
      WHERE vehicle_operator_id = $1
      ORDER BY timestamp DESC
    `;
    const messagesResult = await pool.query(messagesQuery, [userId]);

    if (messagesResult.rows.length === 0) {
      console.log('No messages found');
    }

    // Return the user details along with the fetched messages
    res.status(200).json({
      user: {
        name: userResult.rows[0].name,
        bodyNumber: userResult.rows[0].body_number,
      },
      messages: messagesResult.rows,  // Send the messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});
///old



 app.get('/deduct-messages', async (req, res) => {
   const bodyNumber = req.headers['body_number'];  // Extract the body_number from the header

   if (!bodyNumber) {
     return res.status(400).json({ message: 'Body number is required in the request header' });
   }

   try {
     // Fetch the user's details from the vehicle_operators table
     const userQuery = `
       SELECT id, name, body_number
       FROM vehicle_operators
       WHERE body_number = $1
     `;
     const userResult = await pool.query(userQuery, [bodyNumber]);

     if (userResult.rows.length === 0) {
       return res.status(404).json({ message: 'User not found for the given body number' });
     }

     const userId = userResult.rows[0].id;

     // Fetch the deduct messages for the user from the new deduct_messages table
     const messagesQuery = `
       SELECT deduct_message, created_at
       FROM deduct_messages
       WHERE vehicle_operator_id = $1
       ORDER BY created_at DESC
     `;
     const messagesResult = await pool.query(messagesQuery, [userId]);

     if (messagesResult.rows.length === 0) {
       return res.status(200).json({
         user: {
           name: userResult.rows[0].name,
           bodyNumber: userResult.rows[0].body_number,
         },
         messages: [],  // Return an empty array if no messages are found
       });
     }

     // Return the user details along with the fetched messages
     res.status(200).json({
       user: {
         name: userResult.rows[0].name,
         bodyNumber: userResult.rows[0].body_number,
       },
       messages: messagesResult.rows,  // Send the messages
     });
   } catch (error) {
     console.error('Error fetching messages:', error);
     res.status(500).json({ message: 'Error fetching messages', error: error.message });
   }
 });


 app.post("/change-password", async (req, res) => {
     try {
         const { oldPassword, newPassword } = req.body;

         console.log(`📌 Received request to change password for user with old password: ${oldPassword}`);

         // Hanapin ang user gamit ang old password
         const result = await pool.query(
             "SELECT id FROM vehicle_operators WHERE password = $1",
             [oldPassword]
         );

         if (result.rows.length === 0) {
             console.log("❌ User not found or incorrect old password");
             return res.status(404).json({ error: "User not found or incorrect old password" });
         }

         const userId = result.rows[0].id; // Kunin ang ID ng user na may old password

         // **Update ang password**
         await pool.query("UPDATE vehicle_operators SET password = $1 WHERE id = $2",
             [newPassword, userId]);

         console.log(`✅ Password updated successfully for user ID: ${userId}`);
         res.json({ message: "Password changed successfully" });

     } catch (error) {
         console.error("❌ Error changing password:", error);
         res.status(500).json({ error: "Internal server error" });
     }
 });
///old change password


const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "doncerasronald34@gmail.com", // Use environment variables in production
        pass: "texoswakqdigecnw",
    },
});

// --- Send OTP Route ---
app.get("/send-otp", async (req, res) => {
  const email = req.query.email;

  try {
    // Step 1: Check if the email exists in the database (using LIMIT 1 for efficiency)
    const checkEmailQuery = `SELECT email_address FROM vehicle_operators WHERE email_address = $1 LIMIT 1`;
    const checkEmail = await pool.query(checkEmailQuery, [email]);

    if (checkEmail.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Email does not exist" });
    }

    // Step 2: Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Step 3: Store OTP in memory (expires after 10 minutes)
    otpStorage[email] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };

    // Step 4: Respond immediately before sending email
    res.json({ success: true, message: "OTP is being sent" });

    // Step 5: Send OTP via Email asynchronously
    const mailOptions = {
      from: "doncerasronald34@gmail.com",
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
    };

    transporter.sendMail(mailOptions)
      .then(() => console.log(`OTP sent successfully to ${email}`))
      .catch(error => console.error("Error sending OTP:", error));

  } catch (error) {
    console.error("Error processing OTP request:", error);
    res.status(500).json({ success: false, message: "Server error, please try again" });
  }
});


// ✅ Verify OTP and store email
app.post("/verify-otp", (req, res) => {
    const { email, otp } = req.body;

    if (!otpStorage[email]) {
        return res.status(400).json({ success: false, message: "OTP expired or invalid" });
    }

    if (otpStorage[email].otp == otp) {
        verifiedEmail = email; // Store verified email
        delete otpStorage[email];

        return res.json({ success: true, message: "OTP verified successfully" });
    } else {
        return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }
});

app.post('/reset-password', async (req, res) => {
    try {
        const { new_password } = req.body;

        // Ensure the user has verified their email
        if (!verifiedEmail) {
            return res.status(401).json({ success: false, message: "Unauthorized: Email not verified." });
        }

        if (!new_password) {
            return res.status(400).json({ success: false, message: "Missing new password." });
        }

        // Update password in the database
        const updateQuery = `UPDATE vehicle_operators SET password = $1 WHERE email_address = $2`;
        const result = await pool.query(updateQuery, [new_password, verifiedEmail]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Email not found." });
        }

        // Clear verified email after reset
        verifiedEmail = null;

        res.json({ success: true, message: "Password updated successfully." });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

//working code


// Start Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
//old code