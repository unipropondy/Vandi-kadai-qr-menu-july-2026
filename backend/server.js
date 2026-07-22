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
      <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 0; border-radius: 16px; background-color: #0d0f12; color: #f3f4f6; box-shadow: 0 20px 40px rgba(0,0,0,0.6); overflow: hidden; border: 1px solid #1f2937;">
        
        <!-- Header with brand accent gradient -->
        <div style="background: linear-gradient(180deg, #1a1f26 0%, #0d0f12 100%); padding: 35px 20px; text-align: center; border-bottom: 1px solid #1f2937; position: relative;">
          <!-- Top Accent Gold Line -->
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #ffd700, #ff8c00, #ffd700);"></div>
          
          <h1 style="color: #ffd700; margin: 0; font-size: 32px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">LIT</h1>
          <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 14px; font-style: italic; letter-spacing: 2px; text-transform: uppercase;">Little India Twist</p>
        </div>
        
        <!-- Main Content Area -->
        <div style="padding: 40px 30px;">
          <p style="font-size: 18px; line-height: 1.6; margin-top: 0; font-weight: 600; color: #ffffff;">Hello <strong>${name}</strong>,</p>
          
          <p style="font-size: 15px; line-height: 1.7; color: #cbd5e1; margin-bottom: 30px;">
            Thank you for registering with <strong>LIT</strong>! We are absolutely thrilled to welcome you to our exclusive rewards program.
          </p>

          ${hasPromo ? `
          <!-- Premium Ticket/Voucher Box -->
          <div style="background: linear-gradient(135deg, #18130c 0%, #0f0b06 100%); border: 1px solid rgba(253, 224, 71, 0.2); border-radius: 14px; padding: 30px 20px; text-align: center; margin: 35px 0; box-shadow: inset 0 1px 1px rgba(255,255,255,0.05), 0 10px 20px rgba(0,0,0,0.3); position: relative; overflow: hidden;">
            <!-- Inner Glowing Border -->
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border: 1px solid rgba(253, 224, 71, 0.05); border-radius: 13px; pointer-events: none;"></div>
            
            <p style="margin: 0 0 12px 0; color: #ffd700; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Your Promo Code</p>
            <div style="display: inline-block; background-color: #221c0f; border: 2px dashed #ffd700; padding: 12px 30px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
              <span style="color: #ffffff; font-size: 32px; letter-spacing: 4px; font-weight: 800; font-family: 'Courier New', Courier, monospace;">${promoCode}</span>
            </div>
            <p style="margin: 8px 0 0 0; color: #10b981; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">Discount Value: $${parseFloat(promoAmount).toFixed(2)}</p>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #9ca3af; text-align: center; margin-bottom: 0;">
            Simply present your registered mobile number or show this email to our friendly staff during your next visit to redeem your reward!
          </p>
          ` : `
          <!-- Premium Welcome Box (No Promo) -->
          <div style="background: linear-gradient(135deg, #161e2e 0%, #0f131a 100%); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 14px; padding: 30px 25px; text-align: center; margin: 35px 0; box-shadow: 0 10px 20px rgba(0,0,0,0.3);">
            <p style="margin: 0; color: #ffd700; font-size: 16px; font-weight: 700; line-height: 1.7; letter-spacing: 0.5px;">
              We look forward to serving you the best authentic dishes. See you soon at LIT!
            </p>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #9ca3af; text-align: center; margin-bottom: 0;">
            Simply present your registered mobile number or show this email to our staff during your next visit.
          </p>
          `}
        </div>

        <!-- Footer -->
        <div style="background-color: #090b0e; padding: 25px 20px; border-top: 1px solid #1f2937; text-align: center; font-size: 12px; color: #6b7280; line-height: 1.5;">
          <p style="margin: 0 0 5px 0; color: #9ca3af; font-weight: 500;">© 2026 UNIPRO . All rights reserved.</p>
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
