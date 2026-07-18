const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sql = require('mssql');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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

  if (!mobile || !/^[0-9]{10}$/.test(mobile.trim())) {
    return res.status(400).json({ success: false, message: 'Mobile number must be exactly 10 digits.' });
  }

  if (email && email.trim() !== '') {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailPattern.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
  }

  if (!promoCode || promoCode.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Promo code is required.' });
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
  res.send('Vandi Kadai QR Scan API Server is running.');
});

// Server Start
app.listen(PORT, () => {
  console.log(`🚀 [Server] Backend running on port ${PORT}`);
});
