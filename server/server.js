const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');

const Payment = require('./models/Payment');
const ProjectSettings = require('./models/ProjectSettings');
const CashSource = require('./models/CashSource');
const FundSource = require('./models/FundSource');
const { uploadImageToDrive, deleteFileFromDrive } = require('./services/googleDriveService');
const { generateAuthUrl, exchangeCodeForTokens, isOAuthReady } = require('./services/googleOAuthService');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer Memory Storage Configuration (keeps buffer in RAM for streaming directly to Drive)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, etc.) are allowed for payment proof.'));
    }
  }
});

// Helper: Ensure default settings exist
async function getOrCreateSettings() {
  let settings = await ProjectSettings.findOne();
  if (!settings) {
    settings = await ProjectSettings.create({
      builderName: 'Sri Krishna Builders',
      builderContractAmount: 3500000,
      totalBuildingCost: 5000000,
      totalHomeLoan: 3000000,
      loanCashReceived: 1200000,
      ownCashInitialBalance: 130000,
      homeLoanInitialBalance: 3000000
    });
  }
  return settings;
}

// Helper: Ensure fund sources ("Own Cash" & "Home Loan") exist
async function getOrCreateFundSources(settings) {
  let ownCash = await FundSource.findOne({ name: 'Own Cash' });
  if (!ownCash) {
    ownCash = await FundSource.create({
      name: 'Own Cash',
      initialBalance: settings?.ownCashInitialBalance !== undefined ? settings.ownCashInitialBalance : 130000,
      description: 'Personal savings & own cash funds'
    });
  }

  let homeLoan = await FundSource.findOne({ name: 'Home Loan' });
  if (!homeLoan) {
    homeLoan = await FundSource.create({
      name: 'Home Loan',
      initialBalance: settings?.homeLoanInitialBalance !== undefined ? settings.homeLoanInitialBalance : (settings?.totalHomeLoan || 3000000),
      description: 'Sanctioned home loan funds'
    });
  }

  return { ownCash, homeLoan };
}

// Migration: Ensure existing payments and settings conform to new fund sources schema
async function migrateExistingData() {
  try {
    const settings = await getOrCreateSettings();
    if (settings.ownCashInitialBalance === undefined || settings.ownCashInitialBalance === null) {
      settings.ownCashInitialBalance = 130000;
      await settings.save();
    }
    if (settings.homeLoanInitialBalance === undefined || settings.homeLoanInitialBalance === null) {
      settings.homeLoanInitialBalance = settings.totalHomeLoan || 3000000;
      await settings.save();
    }

    const { ownCash, homeLoan } = await getOrCreateFundSources(settings);
    if (settings.ownCashInitialBalance !== undefined && ownCash.initialBalance === 0 && settings.ownCashInitialBalance > 0) {
      ownCash.initialBalance = settings.ownCashInitialBalance;
      await ownCash.save();
    }
    if (settings.homeLoanInitialBalance !== undefined && homeLoan.initialBalance === 0 && settings.homeLoanInitialBalance > 0) {
      homeLoan.initialBalance = settings.homeLoanInitialBalance;
      await homeLoan.save();
    }

    // Migrate payments: populate paymentSource if missing or if category was Loan Cash
    const payments = await Payment.find();
    for (const p of payments) {
      let changed = false;
      if (!p.paymentSource) {
        p.paymentSource = (p.category === 'Loan Cash' || p.category === 'Home Loan') ? 'Home Loan' : 'Own Cash';
        changed = true;
      }
      if (p.category === 'Loan Cash') {
        p.category = 'Home Loan';
        changed = true;
      }
      if (changed) {
        await p.save();
      }
    }
    console.log('[Migration] Database schemas and fund sources initialized successfully.');
  } catch (err) {
    console.error('[Migration Error]:', err.message);
  }
}

// Seed initial sample data if database is empty
async function seedInitialData() {
  const count = await Payment.countDocuments();
  if (count === 0) {
    console.log('Seeding initial payment records...');
    const today = new Date();
    const d1 = new Date(today);
    d1.setDate(today.getDate() - 5);
    const d2 = new Date(today);
    d2.setDate(today.getDate() - 3);
    const d3 = new Date(today);
    d3.setDate(today.getDate() - 1);

    await Payment.create([
      {
        date: d1,
        category: 'Own Cash',
        paymentMethod: 'Cheque',
        amount: 500000,
        description: 'Builder 1st Stage Advance (Foundation)',
        isBuilderPayment: true
      },
      {
        date: d2,
        category: 'Own Cash',
        paymentMethod: 'Online',
        amount: 45000,
        description: 'Cement Purchase (Ultratech 100 bags)',
        isBuilderPayment: false
      },
      {
        date: d3,
        category: 'Loan Cash',
        paymentMethod: 'Online',
        amount: 250000,
        description: 'Steel reinforcement bars & binding wire',
        isBuilderPayment: false
      }
    ]);
  }

  const cashSourcesCount = await CashSource.countDocuments();
  if (cashSourcesCount === 0) {
    console.log('Seeding initial cash source records...');
    const today = new Date();
    const cs1 = new Date(today);
    cs1.setDate(today.getDate() - 1);
    const cs2 = new Date(today);
    cs2.setDate(today.getDate() - 4);
    const cs3 = new Date(today);
    cs3.setDate(today.getDate() - 9);

    await CashSource.create([
      {
        source: 'Friend - Rahul',
        amount: 50000,
        date: cs1,
        details: 'Personal loan for plastering & plumbing advance'
      },
      {
        source: 'Gold Loan',
        amount: 200000,
        date: cs2,
        details: 'Muthoot gold loan pledged for slab casting'
      },
      {
        source: 'Chitty',
        amount: 100000,
        date: cs3,
        details: 'KSFE Chitty auction amount'
      }
    ]);
  }
}

// ==================== ROUTES ==================== //

// 0. GOOGLE OAUTH 2.0 ROUTES
app.get('/api/auth/google/status', (req, res) => {
  const isReady = isOAuthReady();
  res.json({
    authenticated: isReady,
    account: 'vijeshviswanv@gmail.com',
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
    authMode: isReady ? 'OAuth2 (Personal Drive)' : 'Not Connected'
  });
});

app.get('/api/auth/google/url', (req, res) => {
  try {
    const redirectUri = req.query.redirect_uri || 
      process.env.GOOGLE_REDIRECT_URI || 
      `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    const authUrl = generateAuthUrl(redirectUri);

    if (req.query.redirect === 'true' || req.headers.accept?.includes('text/html')) {
      return res.redirect(authUrl);
    }
    res.json({ authUrl, redirectUri });
  } catch (err) {
    console.error('Error generating Google Auth URL:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send(`
      <div style="font-family: -apple-system, sans-serif; text-align: center; padding: 50px 20px;">
        <h2 style="color: #ef4444;">Google Authorization Denied</h2>
        <p>${error}</p>
        <a href="http://localhost:3000" style="display: inline-block; margin-top: 15px; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">Return to App</a>
      </div>
    `);
  }

  if (!code) {
    return res.status(400).send('<h3>Missing authorization code from Google</h3>');
  }

  try {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    await exchangeCodeForTokens(code, redirectUri);
    console.log('[Google OAuth] Successfully authenticated and saved refresh token to .env');

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Drive Connected - House Finance</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: white; border-radius: 24px; padding: 40px 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0; }
          .badge { width: 64px; height: 64px; background: #ecfdf5; color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; font-size: 28px; }
          h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px 0; color: #0f172a; }
          p { font-size: 15px; color: #64748b; line-height: 1.5; margin: 0 0 24px 0; }
          .highlight { background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-family: monospace; font-size: 13px; color: #334155; }
          .btn { display: inline-block; width: 100%; box-sizing: border-box; background: #4f46e5; color: white; padding: 14px 24px; border-radius: 12px; font-weight: 600; text-decoration: none; transition: background 0.2s; }
          .btn:hover { background: #4338ca; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">✓</div>
          <h1>Google Drive Connected!</h1>
          <p>
            Account <strong>vijeshviswanv@gmail.com</strong> is authorized. 
            The refresh token has been written into <span class="highlight">.env</span>.
            Payment proofs will now upload directly into your Google Drive folder without storage quota errors.
          </p>
          <a href="http://localhost:3000" class="btn">Return to House Finance</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Error exchanging Google authorization code:', err.message);
    res.status(500).send(`
      <div style="font-family: -apple-system, sans-serif; text-align: center; padding: 50px 20px; color: #1e293b;">
        <h2 style="color: #ef4444;">Token Exchange Failed</h2>
        <p style="color: #64748b;">${err.message}</p>
        <p style="font-size: 14px; color: #94a3b8; max-width: 460px; margin: 15px auto;">
          If you see a redirect_uri_mismatch error, ensure the exact redirect URI is configured in your Google Cloud Console Credentials.
        </p>
        <a href="http://localhost:3000" style="display: inline-block; margin-top: 15px; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">Back to App</a>
      </div>
    `);
  }
});

// 1. DASHBOARD SUMMARY
app.get('/api/dashboard', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const fundSourcesDocs = await getOrCreateFundSources(settings);

    // Payments grouped by fund source
    const ownCashPayments = await Payment.aggregate([
      { $match: { $or: [{ paymentSource: 'Own Cash' }, { category: 'Own Cash' }] } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const ownCashSpent = ownCashPayments.length > 0 ? ownCashPayments[0].total : 0;

    const homeLoanPayments = await Payment.aggregate([
      { $match: { $or: [{ paymentSource: 'Home Loan' }, { category: 'Home Loan' }, { category: 'Loan Cash' }] } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const homeLoanSpent = homeLoanPayments.length > 0 ? homeLoanPayments[0].total : 0;

    const totalAmountPaid = ownCashSpent + homeLoanSpent;

    const ownCashInitial = fundSourcesDocs.ownCash.initialBalance || 0;
    const homeLoanInitial = fundSourcesDocs.homeLoan.initialBalance || 0;

    const ownCashRemaining = ownCashInitial - ownCashSpent;
    const homeLoanRemaining = homeLoanInitial - homeLoanSpent;

    // Builder Payments
    const builderPaymentsResult = await Payment.aggregate([
      { $match: { isBuilderPayment: true } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const builderPaid = builderPaymentsResult.length > 0 ? builderPaymentsResult[0].total : 0;

    const builderContract = settings.builderContractAmount || 0;
    const builderBalance = Math.max(0, builderContract - builderPaid);
    const builderExtraPaid = Math.max(0, builderPaid - builderContract);

    // Home Loan calculation
    const totalHomeLoan = settings.totalHomeLoan || 0;
    const loanCashReceived = settings.loanCashReceived || 0;
    const loanBalance = Math.max(0, totalHomeLoan - loanCashReceived);

    // Recent payments (last 5)
    const recentPayments = await Payment.find()
      .sort({ date: -1, createdAt: -1 })
      .limit(5);

    res.json({
      totalBuildingCost: settings.totalBuildingCost,
      totalAmountPaid,
      totalSpent: totalAmountPaid,
      fundSources: {
        ownCash: {
          name: 'Own Cash',
          initialBalance: ownCashInitial,
          totalSpent: ownCashSpent,
          remainingBalance: ownCashRemaining
        },
        homeLoan: {
          name: 'Home Loan',
          initialBalance: homeLoanInitial,
          totalSpent: homeLoanSpent,
          remainingBalance: homeLoanRemaining
        },
        totalInitial: ownCashInitial + homeLoanInitial,
        totalSpent: totalAmountPaid,
        totalRemaining: ownCashRemaining + homeLoanRemaining
      },
      homeLoan: {
        totalHomeLoan,
        loanCashReceived,
        loanBalance,
        initialBalance: homeLoanInitial,
        totalSpent: homeLoanSpent,
        remainingBalance: homeLoanRemaining
      },
      builder: {
        builderName: settings.builderName,
        contractAmount: builderContract,
        amountPaid: builderPaid,
        balanceAmount: builderBalance,
        extraPaid: builderExtraPaid
      },
      recentPayments
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// 2. GET PAYMENTS (with search & filter)
app.get('/api/payments', async (req, res) => {
  try {
    const { category, paymentSource, search, date, isBuilder } = req.query;
    const filter = {};

    const sourceFilter = paymentSource || category;
    if (sourceFilter && sourceFilter !== 'All') {
      if (sourceFilter === 'Own Cash') {
        filter.$or = [{ paymentSource: 'Own Cash' }, { category: 'Own Cash' }];
      } else if (sourceFilter === 'Home Loan' || sourceFilter === 'Loan Cash') {
        filter.$or = [
          { paymentSource: 'Home Loan' },
          { category: 'Home Loan' },
          { category: 'Loan Cash' }
        ];
      } else {
        filter.category = sourceFilter;
      }
    }

    if (search && search.trim() !== '') {
      filter.description = { $regex: search.trim(), $options: 'i' };
    }

    if (date) {
      const selectedDate = new Date(date);
      if (!isNaN(selectedDate.getTime())) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        filter.date = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    if (isBuilder === 'true') {
      filter.isBuilderPayment = true;
    } else if (isBuilder === 'false') {
      filter.isBuilderPayment = false;
    }

    const payments = await Payment.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// 3. CREATE PAYMENT (Google Drive Upload)
app.post('/api/payments', upload.single('proofImage'), async (req, res) => {
  try {
    const { date, category, paymentSource, paymentMethod, amount, description, isBuilderPayment } = req.body;

    const sourceVal = paymentSource || category;
    if (!amount || !description || !sourceVal || !paymentMethod) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const normalizedSource = (sourceVal === 'Loan Cash' || sourceVal === 'Home Loan') ? 'Home Loan' : 'Own Cash';

    let proofFileId = '';
    let proofUrl = '';

    // Handle image upload directly to Google Drive if a file was attached
    if (req.file) {
      try {
        const driveResult = await uploadImageToDrive(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        proofFileId = driveResult.fileId;
        proofUrl = driveResult.proofUrl || driveResult.webViewLink;
        console.log(`Successfully uploaded proof image to Google Drive. File ID: ${proofFileId}`);
      } catch (driveErr) {
        console.error('Google Drive upload failed:', driveErr.message);
        return res.status(502).json({
          error: `Google Drive upload failed: ${driveErr.message}`
        });
      }
    }

    const newPayment = await Payment.create({
      date: date ? new Date(date) : new Date(),
      paymentSource: normalizedSource,
      category: normalizedSource,
      paymentMethod,
      amount: parseFloat(amount),
      description: description.trim(),
      proofImage: proofUrl, // keep in sync for seamless backward compatibility
      proofFileId,
      proofUrl,
      isBuilderPayment: isBuilderPayment === 'true' || isBuilderPayment === true
    });

    res.status(201).json(newPayment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: error.message || 'Failed to save payment' });
  }
});

// 4. GET SINGLE PAYMENT
app.get('/api/payments/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// 4b. EDIT / UPDATE PAYMENT
app.put('/api/payments/:id', upload.single('proofImage'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const { date, category, paymentSource, paymentMethod, amount, description, isBuilderPayment } = req.body;

    if (amount !== undefined) payment.amount = parseFloat(amount);
    if (description !== undefined) payment.description = description.trim();
    if (date !== undefined) payment.date = new Date(date);
    if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;
    if (isBuilderPayment !== undefined) {
      payment.isBuilderPayment = isBuilderPayment === 'true' || isBuilderPayment === true;
    }

    const sourceVal = paymentSource || category;
    if (sourceVal) {
      const normalizedSource = (sourceVal === 'Loan Cash' || sourceVal === 'Home Loan') ? 'Home Loan' : 'Own Cash';
      payment.paymentSource = normalizedSource;
      payment.category = normalizedSource;
    }

    // Handle replacement proof file upload if provided
    if (req.file) {
      try {
        const driveResult = await uploadImageToDrive(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        // Clean up previous file from Drive
        if (payment.proofFileId) {
          try {
            await deleteFileFromDrive(payment.proofFileId);
          } catch (e) {
            console.warn('Could not delete old proof image from Drive:', e.message);
          }
        }
        payment.proofFileId = driveResult.fileId;
        payment.proofUrl = driveResult.proofUrl || driveResult.webViewLink;
        payment.proofImage = payment.proofUrl;
      } catch (driveErr) {
        console.error('Google Drive update upload failed:', driveErr.message);
        return res.status(502).json({ error: `Google Drive upload failed: ${driveErr.message}` });
      }
    }

    await payment.save();
    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: error.message || 'Failed to update payment' });
  }
});

// 5. DELETE PAYMENT
app.delete('/api/payments/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Delete file from Google Drive if proofFileId exists
    if (payment.proofFileId) {
      await deleteFileFromDrive(payment.proofFileId);
    }

    // Delete local fallback file if exists
    if (payment.proofImage && payment.proofImage.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, payment.proofImage);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Could not delete local image file:', e);
        }
      }
    }

    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

// 6. BUILDER DETAILS & HISTORY
app.get('/api/builder', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const payments = await Payment.find({ isBuilderPayment: true }).sort({ date: -1, createdAt: -1 });

    const totalPaid = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const contract = settings.builderContractAmount || 0;
    const balance = Math.max(0, contract - totalPaid);
    const extraPaid = Math.max(0, totalPaid - contract);

    res.json({
      builderName: settings.builderName,
      contractAmount: contract,
      totalPaid,
      balance,
      extraPaid,
      payments
    });
  } catch (error) {
    console.error('Error fetching builder details:', error);
    res.status(500).json({ error: 'Failed to fetch builder details' });
  }
});

// 7. GET SETTINGS
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// 8. UPDATE SETTINGS
app.put('/api/settings', async (req, res) => {
  try {
    let settings = await getOrCreateSettings();
    const fundSourcesDocs = await getOrCreateFundSources(settings);
    const { 
      builderName, 
      builderContractAmount, 
      totalBuildingCost, 
      totalHomeLoan, 
      loanCashReceived,
      ownCashInitialBalance,
      homeLoanInitialBalance
    } = req.body;

    if (builderName !== undefined) settings.builderName = builderName;
    if (builderContractAmount !== undefined) settings.builderContractAmount = parseFloat(builderContractAmount);
    if (totalBuildingCost !== undefined) settings.totalBuildingCost = parseFloat(totalBuildingCost);
    if (totalHomeLoan !== undefined) settings.totalHomeLoan = parseFloat(totalHomeLoan);
    if (loanCashReceived !== undefined) settings.loanCashReceived = parseFloat(loanCashReceived);

    if (ownCashInitialBalance !== undefined) {
      const val = parseFloat(ownCashInitialBalance) || 0;
      settings.ownCashInitialBalance = val;
      fundSourcesDocs.ownCash.initialBalance = val;
      fundSourcesDocs.ownCash.updatedAt = new Date();
      await fundSourcesDocs.ownCash.save();
    }

    if (homeLoanInitialBalance !== undefined) {
      const val = parseFloat(homeLoanInitialBalance) || 0;
      settings.homeLoanInitialBalance = val;
      fundSourcesDocs.homeLoan.initialBalance = val;
      fundSourcesDocs.homeLoan.updatedAt = new Date();
      await fundSourcesDocs.homeLoan.save();
    }

    settings.updatedAt = new Date();
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// 8b. FUND SOURCES ROUTES
app.get('/api/fund-sources', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const fundSourcesDocs = await getOrCreateFundSources(settings);

    const ownCashPayments = await Payment.aggregate([
      { $match: { $or: [{ paymentSource: 'Own Cash' }, { category: 'Own Cash' }] } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const ownCashSpent = ownCashPayments.length > 0 ? ownCashPayments[0].total : 0;

    const homeLoanPayments = await Payment.aggregate([
      { $match: { $or: [{ paymentSource: 'Home Loan' }, { category: 'Home Loan' }, { category: 'Loan Cash' }] } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const homeLoanSpent = homeLoanPayments.length > 0 ? homeLoanPayments[0].total : 0;

    const ownCashInitial = fundSourcesDocs.ownCash.initialBalance || 0;
    const homeLoanInitial = fundSourcesDocs.homeLoan.initialBalance || 0;

    const sources = [
      {
        _id: fundSourcesDocs.ownCash._id,
        name: 'Own Cash',
        initialBalance: ownCashInitial,
        totalSpent: ownCashSpent,
        remainingBalance: ownCashInitial - ownCashSpent,
        description: fundSourcesDocs.ownCash.description
      },
      {
        _id: fundSourcesDocs.homeLoan._id,
        name: 'Home Loan',
        initialBalance: homeLoanInitial,
        totalSpent: homeLoanSpent,
        remainingBalance: homeLoanInitial - homeLoanSpent,
        description: fundSourcesDocs.homeLoan.description
      }
    ];

    res.json({
      sources,
      totalInitial: ownCashInitial + homeLoanInitial,
      totalSpent: ownCashSpent + homeLoanSpent,
      totalRemaining: (ownCashInitial - ownCashSpent) + (homeLoanInitial - homeLoanSpent)
    });
  } catch (error) {
    console.error('Error fetching fund sources:', error);
    res.status(500).json({ error: 'Failed to fetch fund sources' });
  }
});

app.put('/api/fund-sources', async (req, res) => {
  try {
    const { ownCashInitialBalance, homeLoanInitialBalance } = req.body;
    const settings = await getOrCreateSettings();
    const fundSourcesDocs = await getOrCreateFundSources(settings);

    if (ownCashInitialBalance !== undefined) {
      const val = parseFloat(ownCashInitialBalance) || 0;
      fundSourcesDocs.ownCash.initialBalance = val;
      fundSourcesDocs.ownCash.updatedAt = new Date();
      await fundSourcesDocs.ownCash.save();
      settings.ownCashInitialBalance = val;
    }

    if (homeLoanInitialBalance !== undefined) {
      const val = parseFloat(homeLoanInitialBalance) || 0;
      fundSourcesDocs.homeLoan.initialBalance = val;
      fundSourcesDocs.homeLoan.updatedAt = new Date();
      await fundSourcesDocs.homeLoan.save();
      settings.homeLoanInitialBalance = val;
    }

    await settings.save();
    res.json({ message: 'Fund sources updated successfully', fundSources: fundSourcesDocs });
  } catch (error) {
    console.error('Error updating fund sources:', error);
    res.status(500).json({ error: 'Failed to update fund sources' });
  }
});

// 9. CASH SOURCES ROUTES
app.get('/api/cash-sources', async (req, res) => {
  try {
    const cashSources = await CashSource.find().sort({ date: -1, createdAt: -1 });
    const totalCashReceived = cashSources.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    res.json({ cashSources, totalCashReceived });
  } catch (error) {
    console.error('Error fetching cash sources:', error);
    res.status(500).json({ error: 'Failed to fetch cash sources' });
  }
});

app.post('/api/cash-sources', async (req, res) => {
  try {
    const { source, amount, date, details } = req.body;
    if (!source || !amount) {
      return res.status(400).json({ error: 'Source name and amount are required' });
    }
    const newEntry = await CashSource.create({
      source: source.trim(),
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      details: details ? details.trim() : ''
    });
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error creating cash source:', error);
    res.status(500).json({ error: error.message || 'Failed to save cash source' });
  }
});

app.delete('/api/cash-sources/:id', async (req, res) => {
  try {
    const item = await CashSource.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Cash source not found' });
    }
    res.json({ message: 'Cash source deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete cash source' });
  }
});

// Unmatched API requests return 404 JSON instead of falling through to HTML
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ==========================================
// SERVE STATIC FRONTEND (PRODUCTION)
// ==========================================

// Determine absolute path to the client build directory
const possibleDistPaths = [
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, 'client/dist'),
  path.resolve(__dirname, 'dist'),
  path.resolve(process.cwd(), 'dist')
];

const clientDistPath = possibleDistPaths.find(p => fs.existsSync(path.join(p, 'index.html'))) || path.resolve(__dirname, '../client/dist');
const indexPath = path.join(clientDistPath, 'index.html');

console.log(`[Static Serving] Absolute dist path: ${clientDistPath} (index.html exists: ${fs.existsSync(indexPath)})`);

// Serve static files from the client build directory in production
app.use(express.static(clientDistPath));
app.use('/assets', express.static(path.join(clientDistPath, 'assets')));

// Catch-all route to return React index.html for SPA routing
try {
  app.get('*', (req, res) => {
    res.sendFile(indexPath);
  });
} catch (e) {
  // Express 5 path-to-regexp wildcard syntax support
  app.get('{*path}', (req, res) => {
    res.sendFile(indexPath);
  });
}

// Global error handler (handles multer limits and fileFilter errors)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds the 15MB limit.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message || 'An error occurred during request processing.' });
  }
  next();
});

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB successfully.');
    await getOrCreateSettings();
    await migrateExistingData();
    await seedInitialData();
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
