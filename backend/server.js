const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Email SMTP Transporter
const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Enable CORS for frontend requests
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Local JSON File Database Fallback Path
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'registrations.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
}

// Helper to read local JSON db
function readLocalDb() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper to write local JSON db
function writeLocalDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing to local fallback DB:', err);
  }
}

// SQL Server Config Check
const isSqlConfigured = !!(
  process.env.DB_SERVER &&
  (process.env.DB_DATABASE || process.env.DB_NAME) &&
  process.env.DB_USER
);

let dbPool = null;

// Initialize MS SQL Connection Pool
async function connectDatabase() {
  if (!isSqlConfigured) {
    console.log('⚠️ [Database] SQL Server environment variables are empty.');
    console.log('📁 [Database] Running in Local JSON fallback mode. Data will be saved in data/registrations.json');
    return null;
  }

  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE || process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true' || true,
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' || true,
      enableArithAbort: true
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };

  try {
    const pool = await sql.connect(config);
    console.log(`✅ [Database] Connected successfully to Microsoft SQL Server: ${config.server}`);
    return pool;
  } catch (error) {
    console.error('❌ [Database] SQL Server connection failed:', error.message);
    console.log('📁 [Database] Switching to Local JSON fallback mode.');
    return null;
  }
}

// Start database connection
connectDatabase().then(pool => {
  dbPool = pool;
});

// Helper to send registration welcome email
async function sendWelcomeEmail(toEmail, name, promoCode, promoAmount) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️ [Email] SMTP credentials are not configured. Skipping email.');
    return;
  }

  const hasPromo = promoCode && promoCode.trim() !== '';

  const mailOptions = {
    from: `"LIT" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Welcome to LIT - Registration Successful!',
    html: `
      <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 0; border-radius: 14px; background-color: #0b0c10; color: #f3f4f6; box-shadow: 0 15px 35px rgba(0,0,0,0.7); overflow: hidden; border: 2px solid #1f2833;">
        <!-- Top Neon Accent line -->
        <div style="height: 5px; background: linear-gradient(90deg, #ff007f, #00f0ff, #ffbc00);"></div>
        
        <!-- Mass Header -->
        <div style="background: #0f111a; padding: 25px 15px; text-align: center; border-bottom: 1px solid #1f2833;">
          <h1 style="color: #ff007f; margin: 0; font-size: 38px; font-weight: 900; text-transform: uppercase; letter-spacing: 4px; text-shadow: 0 0 10px #ff007f, 0 0 20px #ff007f;">LIT</h1>
          <p style="color: #00f0ff; margin: 5px 0 0 0; font-size: 13px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; text-shadow: 0 0 8px rgba(0,240,255,0.6);">Little India Twist</p>
        </div>
        
        <!-- Content (Tighter Space) -->
        <div style="padding: 25px 20px; text-align: center;">
          <p style="font-size: 18px; line-height: 1.4; margin: 0 0 12px 0; font-weight: 800; color: #ffffff;">Hello <span style="color: #00f0ff;">${name}</span>,</p>
          
          <p style="font-size: 14px; line-height: 1.5; color: #c5c6c7; margin: 0 0 20px 0;">
            Thank you for registering with <strong>LIT</strong>! We are excited to welcome you to our rewards program.
          </p>

          ${hasPromo ? `
          <!-- Mass Neon Promo Ticket -->
          <div style="background: #111424; border: 2px solid #ffbc00; border-radius: 12px; padding: 20px 15px; margin: 20px 0; box-shadow: 0 0 15px rgba(255,188,0,0.25);">
            <p style="margin: 0 0 8px 0; color: #ff007f; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800;">YOUR PROMO CODE</p>
            <div style="display: inline-block; background-color: #0b0c10; border: 2px dashed #00f0ff; padding: 10px 25px; border-radius: 8px; margin-bottom: 10px; box-shadow: inset 0 0 8px rgba(0,240,255,0.2);">
              <span style="color: #ffd700; font-size: 32px; letter-spacing: 3px; font-weight: 900; font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif; text-shadow: 0 0 8px rgba(255,215,0,0.5);">${promoCode}</span>
            </div>
            <p style="margin: 5px 0 0 0; color: #00ff66; font-size: 20px; font-weight: 900; letter-spacing: 0.5px; text-shadow: 0 0 10px rgba(0,255,102,0.4);">Discount Value: $${parseFloat(promoAmount).toFixed(2)}</p>
          </div>

          <p style="font-size: 13px; line-height: 1.5; color: #9ca3af; margin: 0;">
            Simply present your registered mobile number or show this email to our staff during your next visit to redeem your reward discount!
          </p>
          ` : `
          <!-- Premium Welcome Box (No Promo) -->
          <div style="background: linear-gradient(135deg, #111424 0%, #0d0f12 100%); border: 2px solid #00f0ff; border-radius: 12px; padding: 20px 15px; margin: 20px 0; box-shadow: 0 0 15px rgba(0,240,255,0.2);">
            <p style="margin: 0; color: #ffd700; font-size: 15px; font-weight: bold; line-height: 1.6; text-shadow: 0 0 5px rgba(255,215,0,0.3);">
              We look forward to serving you the best authentic dishes. See you soon at LIT!
            </p>
          </div>

          <p style="font-size: 13px; line-height: 1.5; color: #9ca3af; margin: 0;">
            Simply present your registered mobile number or show this email to our staff during your next visit.
          </p>
          `}
        </div>

        <!-- Footer -->
        <div style="background-color: #07080d; padding: 15px 10px; border-top: 1px solid #1f2833; text-align: center; font-size: 11px; color: #666666; line-height: 1.4;">
          <p style="margin: 0 0 3px 0; color: #888888; font-weight: bold;">© 2026 UNIPRO . All rights reserved.</p>
          <p style="margin: 0;">This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    `
  };

  try {
    await mailTransporter.sendMail(mailOptions);
    console.log(`✉️ [Email] Registration welcome email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error('❌ [Email] Failed to send email:', error.message);
  }
}

// Registration API Endpoint
app.post('/api/customer/register', async (req, res) => {
  const {
    name,
    mobile,
    email,
    promoCode,
    address
  } = req.body;

  // 1. Server-side Validation
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Full name is required.' });
  }

  const testMobile = mobile ? mobile.trim().replace(/[\s\-\+]/g, '') : '';
  if (!mobile || !/^[0-9]{5,15}$/.test(testMobile)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid mobile number.' });
  }

  if (email && email.trim() !== '') {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailPattern.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
  }

  const cleanName = name.trim();
  const cleanMobile = mobile.trim();
  const cleanEmail = email ? email.trim() : '';
  const cleanPromoCode = promoCode ? promoCode.trim() : '';
  const cleanAddress = address ? address.trim() : '';
  let promoAmount = 0.00;

  try {
    // 2. Promo Code Validation (If promo code is entered)
    if (cleanPromoCode !== '') {
      if (dbPool) {
        // --- SQL SERVER PROMO VALIDATION ---
        const promoResult = await dbPool.request()
          .input('promoCode', sql.NVarChar, cleanPromoCode)
          .query('SELECT DiscountValue, IsActive FROM PromoCodeMaster WHERE PromoCode = @promoCode');

        if (promoResult.recordset.length === 0) {
          return res.status(400).json({ success: false, message: 'Invalid Promo Code' });
        }

        const promoObj = promoResult.recordset[0];
        // Check if active (bit fields are returned as true/false or 1/0)
        if (promoObj.IsActive !== true && promoObj.IsActive !== 1) {
          return res.status(400).json({ success: false, message: 'Invalid Promo Code' });
        }

        promoAmount = parseFloat(promoObj.DiscountValue) || 0.00;
      } else {
        // --- LOCAL JSON PROMO VALIDATION FALLBACK ---
        // Mock PRO123 code from the database screenshot
        if (cleanPromoCode.toUpperCase() === 'PRO123') {
          promoAmount = 1.00;
        } else {
          return res.status(400).json({ success: false, message: 'Invalid Promo Code' });
        }
      }
    }

    // 3. Insert and Duplicate Check Logic
    if (dbPool) {
      // --- SQL SERVER OPERATION ---
      // Check duplicate mobile (comparing suffix to handle country codes safely)
      const duplicateResult = await dbPool.request()
        .input('mobile', sql.NVarChar, cleanMobile)
        .query("SELECT MemberId FROM MemberMaster WHERE Phone = @mobile OR Phone LIKE '%' + @mobile");

      if (duplicateResult.recordset.length > 0) {
        return res.status(400).json({ success: false, message: 'This mobile number is already registered.' });
      }

      // Insert record into MemberMaster
      await dbPool.request()
        .input('name', sql.NVarChar, cleanName)
        .input('phone', sql.NVarChar, cleanMobile)
        .input('email', sql.NVarChar, cleanEmail || null)
        .input('address', sql.VarChar, cleanAddress || null)
        .input('promocode', sql.NVarChar, cleanPromoCode || null)
        .input('promoamount', sql.Decimal(18, 2), promoAmount)
        .query(`
          INSERT INTO MemberMaster 
          (MemberId, Name, Phone, Email, Address, Promocode, Promoamount, CreditLimit, IsActive, Balance, CurrentBalance, LowBalanceAlertSent, RewardCredit, CreatedAt)
          VALUES 
          (NEWID(), @name, @phone, @email, @address, @promocode, @promoamount, 0.00, 1, 0.00, 0.00, 0, 0.00, GETDATE())
        `);

      console.log(`👤 Member Registered in SQL: ${cleanName} (${cleanMobile}) [Promo: ${cleanPromoCode || 'None'}, Amt: ${promoAmount}]`);
    } else {
      // --- LOCAL JSON FALLBACK OPERATION ---
      const localData = readLocalDb();

      // Check duplicate mobile
      const isDuplicate = localData.some(cust => cust.phone === cleanMobile || cust.phone.endsWith(cleanMobile));
      if (isDuplicate) {
        return res.status(400).json({ success: false, message: 'This mobile number is already registered.' });
      }

      // Append new member
      const newMember = {
        MemberId: 'local-guid-' + Math.random().toString(36).substr(2, 9),
        Name: cleanName,
        Phone: cleanMobile,
        Email: cleanEmail,
        Address: cleanAddress,
        Promocode: cleanPromoCode,
        Promoamount: promoAmount,
        CreditLimit: 0.00,
        IsActive: 1,
        Balance: 0.00,
        CurrentBalance: 0.00,
        AvailableCredit: 0.00,
        LowBalanceAlertSent: 0,
        RewardCredit: 0.00,
        CreatedAt: new Date().toISOString()
      };

      localData.push(newMember);
      writeLocalDb(localData);

      console.log(`👤 Member Registered in JSON: ${cleanName} (${cleanMobile}) [Promo: ${cleanPromoCode || 'None'}, Amt: ${promoAmount}]`);
    }

    // Send email asynchronously if email is provided
    if (cleanEmail !== '') {
      sendWelcomeEmail(cleanEmail, cleanName, cleanPromoCode, promoAmount);
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Customer Registered Successfully'
    });

  } catch (error) {
    console.error('❌ Server error during registration:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Failed to save registration details.'
    });
  }
});

// Root check route
app.get('/', (req, res) => {
  res.send('LIT QR Scan API Server is running.');
});

// Server Start
app.listen(PORT, () => {
  console.log(`🚀 [Server] Backend running on port ${PORT}`);
});
