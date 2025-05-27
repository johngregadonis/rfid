const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors'); // Import CORS
const { Client } = require('pg');
const WebSocket = require('ws');
const nodemailer = require('nodemailer');
const axios = require("axios");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');




// Initialize Express App
const app = express();
const port = 3001;
const PAYMONGO_SECRET_KEY = "sk_test_C7Cst5F2UDAxJjWiCtgtLzsr"; // Replace with sk_live_xxx in production
const OWNER_GCASH_NUMBER = ""; // Replace with App Owner’s GCash number


// Enable CORS
app.use(cors());

// PostgreSQL Connection Pool
const pool = new Pool({
  user: 'postgres',       // Replace with your PostgreSQL username
  host: 'localhost',      // Database host
  database: 'rfid',       // Database name
  password: 'adonis69',      // Database password
  port: 5432,             // Default PostgreSQL port
});


const SECRET_KEY = '102702'; // Replace with a secure key


const otpStorage = {}
let verifiedEmail = null;
// PostgreSQL connection for listening to notifications
const pgClient = new Client({
  connectionString: 'postgres://postgres:adonis69@localhost:5432/rfid', // Replace with your details
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


app.post('/login', async (req, res) => {
  const { bodyNumber, password } = req.body;

  console.log("Received login request:", { bodyNumber, password }); // Debug log

  try {
    const client = await pool.connect();

    // Query user by body number
    const result = await client.query(
      'SELECT id, name, body_number, password FROM vehicle_operators WHERE body_number = $1',
      [bodyNumber]
    );

    console.log("Query result:", result.rows); // Debug log

    if (result.rows.length === 0) {
      console.log("User not found."); // Debug log
      client.release();
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    // ✅ Check for direct match (for old plaintext passwords)
    let isMatch = password === user.password;

    // ✅ If no direct match, try bcrypt (for hashed passwords)
    if (!isMatch) {
      try {
        isMatch = await bcrypt.compare(password, user.password);
      } catch (bcryptErr) {
        console.error("Error comparing password with bcrypt:", bcryptErr);
      }
    }

    if (!isMatch) {
      console.log("Invalid password."); // Debug log
      client.release();
      return res.status(401).json({ message: 'Invalid password' });
    }

    // ✅ Generate JWT token
    const token = jwt.sign({ user_id: user.id }, SECRET_KEY, { expiresIn: '7d' });

    // ✅ Save session
    await pool.query(
      'INSERT INTO sessions (user_id, token) VALUES ($1, $2)',
      [user.id, token]
    );

    console.log("Login successful for:", user); // Debug log

    // ✅ Send token along with user details
    res.status(200).json({
      name: user.name,
      bodyNumber: user.body_number,
      token: token
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

         console.log(`📌 Received request to change password`);

         // ✅ Find the user by checking each password (not recommended to match by plaintext password)
         const result = await pool.query(
             "SELECT id, password FROM vehicle_operators"
         );

         let userId = null;

         // 🔍 Search for matching user by comparing hashed password
         for (const row of result.rows) {
             const match = await bcrypt.compare(oldPassword, row.password);
             if (match) {
                 userId = row.id;
                 break;
             }
         }

         if (!userId) {
             console.log("❌ User not found or incorrect old password");
             return res.status(404).json({ error: "User not found or incorrect old password" });
         }

         // ✅ Hash the new password
         const saltRounds = 10;
         const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

         // ✅ Update the password
         await pool.query("UPDATE vehicle_operators SET password = $1 WHERE id = $2",
             [hashedNewPassword, userId]);

         console.log(`✅ Password updated successfully for user ID: ${userId}`);
         res.json({ message: "Password changed successfully" });

     } catch (error) {
         console.error("❌ Error changing password:", error);
         res.status(500).json({ error: "Internal server error" });
     }
 });

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "smart.transit69@gmail.com", // Use environment variables in production
        pass: "wcuqfnnsvehxykss",
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

        // ✅ Hash the new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(new_password, saltRounds);

        // ✅ Update hashed password in the database
        const updateQuery = `UPDATE vehicle_operators SET password = $1 WHERE email_address = $2`;
        const result = await pool.query(updateQuery, [hashedPassword, verifiedEmail]);

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


// 📌 ✅ Process Payment & Redirect to GCash
app.post("/process-payment", async (req, res) => {
    const { amount, bodyNumber } = req.body;
    const amountCentavos = parseInt(amount) * 100;

    if (amountCentavos < 2000) {
        return res.status(400).json({ error: "Amount must be at least PHP 20.00 (2000 centavos)." });
    }

    try {
        const sourceResponse = await axios.post(
            "https://api.paymongo.com/v1/sources",
            {
                data: {
                    attributes: {
                        amount: amountCentavos,
                        currency: "PHP",
                        type: "gcash",
                        metadata: { bodyNumber }, // ✅ Store bodyNumber in metadata
                        redirect: {
                            success: "https://yourdomain.com/payment-success",
                            failed: "https://yourdomain.com/payment-failed",
                        },
                    },
                },
            },
            {
                headers: {
                    Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString("base64")}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const gcashUrl = sourceResponse.data.data.attributes.redirect.checkout_url;
        res.json({ gcash_url: gcashUrl });

    } catch (error) {
        console.error("❌ Error processing payment:", error.response?.data || error.message);
        res.status(500).json({ error: "Payment processing failed" });
    }
});

// 📌 ✅ Webhook: Update Balance After Payment Success
app.post("/paymongo-webhook", async (req, res) => {
    console.log("🔔 Webhook Triggered: ", JSON.stringify(req.body, null, 2));

    const event = req.body;

    if (!event.data || !event.data.attributes) {
        console.error("❌ Invalid webhook payload:", event);
        return res.status(400).json({ error: "Invalid webhook data" });
    }

    // ✅ Check if the payment was successful
    if (event.data.attributes.status === "paid") {
        const amount = event.data.attributes.amount / 100; // Convert centavos to PHP
        const bodyNumber = event.data.attributes.metadata?.bodyNumber; // Extract body number

        if (!bodyNumber) {
            console.error("❌ Missing bodyNumber in webhook metadata.");
            return res.status(400).json({ error: "Missing bodyNumber" });
        }

        try {
            // 🔍 Check if bodyNumber exists in the database
            const checkQuery = "SELECT balance FROM vehicle_operators WHERE body_number = $1";
            const result = await pool.query(checkQuery, [bodyNumber]);

            if (result.rows.length === 0) {
                console.error(`❌ body_number '${bodyNumber}' not found.`);
                return res.status(404).json({ error: "body_number not found" });
            }

            console.log(`ℹ️ Current balance for ${bodyNumber}: ${result.rows[0].balance}`);

            // ✅ Update balance
            const updateQuery = "UPDATE vehicle_operators SET balance = balance + $1 WHERE body_number = $2 RETURNING balance";
            const updateResult = await pool.query(updateQuery, [amount, bodyNumber]);

            console.log(`✅ Updated balance for ${bodyNumber}: ${updateResult.rows[0].balance}`);
            return res.json({ message: "Balance updated successfully!", new_balance: updateResult.rows[0].balance });

        } catch (error) {
            console.error("❌ Database update error:", error);
            return res.status(500).json({ error: "Failed to update balance." });
        }
    }

    res.status(200).json({ message: "Webhook received but not 'paid' status" });
});

// 📌 ✅ Manual Test API to Update Balance (For Debugging)
app.post("/test-update-balance", async (req, res) => {
    const { amount, bodyNumber } = req.body;

    try {
        const updateQuery = "UPDATE vehicle_operators SET balance = balance + $1 WHERE body_number = $2 RETURNING balance";
        const updateResult = await pool.query(updateQuery, [amount, bodyNumber]);

        if (updateResult.rowCount === 0) {
            return res.status(404).json({ error: "Body number not found" });
        }

        return res.json({ message: "Balance updated!", new_balance: updateResult.rows[0].balance });
    } catch (error) {
        console.error("❌ Update error:", error);
        return res.status(500).json({ error: "Failed to update balance." });
    }
});

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const result = await pool.query(
      'SELECT * FROM sessions WHERE user_id = $1 AND token = $2',
      [decoded.user_id, token]
    );
    if (result.rowCount === 0) return res.status(401).json({ error: 'Token invalidated' });

    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};


app.post('/logout-all', authenticate, async (req, res) => {
  const userId = req.user.user_id;
  try {
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    res.json({ message: 'Logged out from all devices.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to logout' });
  }
});

/**
 * PROTECTED ROUTE EXAMPLE
 */
app.get('/profile', authenticate, (req, res) => {
  res.json({ message: 'Access granted to profile' });
});

/**
 * CHECK TOKEN VALIDITY
 */
app.get('/check-token-validity', async (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    // Check if token still exists in the sessions table
    const result = await pool.query(
      'SELECT * FROM sessions WHERE user_id = $1 AND token = $2',
      [decoded.user_id, token]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'Token has been invalidated' });
    }

    res.status(200).json({ message: 'Token is valid' });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});


// Start Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
//old code