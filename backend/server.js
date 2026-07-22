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
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; background-color: #dce3e1; border-radius: 8px;">
        <!-- Email Header -->
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #1e3a5f; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">LIT</h1>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Little India Twist</p>
        </div>

        <!-- Greeting -->
        <div style="background-color: #ffffff; padding: 20px 25px; border-radius: 8px 8px 0 0; border-bottom: 1px solid #f1f5f9;">
          <p style="font-size: 16px; line-height: 1.5; color: #1e293b; margin: 0;">
            Hello <strong>${name}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 6px 0 0 0;">
            Thank you for registering with <strong>LIT</strong>! We are excited to welcome you to our rewards program.
          </p>
        </div>

        <!-- Ticket Voucher Section -->
        <div style="position: relative; background-color: #1e355e; border-radius: 12px; box-shadow: 0 10px 25px rgba(30, 53, 94, 0.15); overflow: hidden; display: block; margin: 0;">
          
          <!-- Top & Bottom Cutout Notches -->
          <div style="position: absolute; top: -10px; right: 110px; width: 20px; height: 20px; background-color: #ffffff; border-radius: 50%; z-index: 10;"></div>
          <div style="position: absolute; bottom: -10px; right: 110px; width: 20px; height: 20px; background-color: #ffffff; border-radius: 50%; z-index: 10;"></div>

          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <!-- Left Column: Food Graphic -->
              <td width="38%" style="vertical-align: middle; padding: 0; background-color: #162a4d; line-height: 0;">
                <img src="cid:foodImage" alt="LIT Specialty" style="width: 100%; height: 180px; object-fit: cover; display: block;" />
              </td>

              <!-- Middle Column: Voucher Details -->
              <td style="padding: 25px 20px; vertical-align: middle; text-align: left;">
                <div style="font-family: Georgia, serif; font-size: 18px; font-style: italic; color: #93c5fd; margin-bottom: 2px;">Discount</div>
                <h2 style="font-size: 26px; font-weight: 800; color: #ffffff; margin: 0 0 10px 0; letter-spacing: 1px; text-transform: uppercase;">VOUCHER</h2>
                
                ${hasPromo ? `
                <p style="font-size: 11px; line-height: 1.4; color: #cbd5e1; margin: 0 0 15px 0;">
                  Show this code at the counter to redeem your reward.
                </p>
                <div style="margin-bottom: 5px;">
                  <span style="display: inline-block; background-color: rgba(255,255,255,0.1); border: 1.5px dashed #93c5fd; padding: 6px 16px; border-radius: 4px; font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">
                    ${promoCode}
                  </span>
                </div>
                <div style="font-size: 22px; font-weight: 800; color: #38bdf8; margin-top: 10px;">
                  $${parseFloat(promoAmount).toFixed(2)} OFF
                </div>
                ` : `
                <p style="font-size: 13px; line-height: 1.5; color: #cbd5e1; margin: 0 0 10px 0;">
                  We look forward to serving you the best authentic dishes.
                </p>
                <div style="font-size: 18px; font-weight: 800; color: #38bdf8;">
                  See you soon at LIT!
                </div>
                `}
              </td>

              <!-- Separator Dashed line -->
              <td width="1" style="border-left: 2px dashed rgba(255, 255, 255, 0.25); padding: 0;"></td>

              <!-- Right Column: Ticket Stub -->
              <td width="110" style="vertical-align: middle; text-align: center; padding: 15px 10px; background-color: #182c4f;">
                <div style="writing-mode: vertical-rl; transform: rotate(180deg); font-size: 11px; text-transform: uppercase; color: #93c5fd; font-weight: bold; letter-spacing: 2px; white-space: nowrap; display: inline-block;">
                  WELCOME REWARD
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Instructions bottom block -->
        <div style="background-color: #ffffff; padding: 20px 25px; border-radius: 0 0 8px 8px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 0;">
            Simply present your registered mobile number or show this email to our staff during your next visit to redeem your reward discount!
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 25px; font-size: 11px; color: #94a3b8; line-height: 1.4;">
          <p style="margin: 0 0 4px 0; font-weight: bold;">© 2026 UNIPRO . All rights reserved.</p>
          <p style="margin: 0;">This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: 'food.png',
        path: path.join(__dirname, 'assets', 'food.png'),
        cid: 'foodImage'
      }
    ]
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
