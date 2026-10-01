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
const FundAddition = require('./models/FundAddition');
const LoanInstallment = require('./models/LoanInstallment');
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

    // Migrate payments: populate paymentSource and expenseCategory if missing
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
      if (!p.expenseCategory) {
        p.expenseCategory = p.isBuilderPayment ? 'Builder / Contractor' : 'Others';
        changed = true;
      }
      if (changed) {
        await p.save();
      }
    }
    console.log('[Migration] Database schemas, fund sources, and payment categories initialized successfully.');
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

    // Additional Own Cash additions
    const ownCashAdditionsAgg = await FundAddition.aggregate([
      { $match: { fundSource: 'Own Cash' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const ownCashAddedFunds = ownCashAdditionsAgg.length > 0 ? ownCashAdditionsAgg[0].total : 0;
    const ownCashAdditionsCount = ownCashAdditionsAgg.length > 0 ? ownCashAdditionsAgg[0].count : 0;

    const ownCashInitial = fundSourcesDocs.ownCash.initialBalance || 0;
    const ownCashTotalAdded = ownCashInitial + ownCashAddedFunds;
    const ownCashRemaining = ownCashTotalAdded - ownCashSpent;

    // Loan Installments (Stage-by-stage Disbursements)
    const loanInstallmentsAgg = await LoanInstallment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const totalLoanDisbursed = loanInstallmentsAgg.length > 0 
      ? loanInstallmentsAgg[0].total 
      : (settings.loanCashReceived || 0);
    const loanInstallmentsCount = loanInstallmentsAgg.length > 0 ? loanInstallmentsAgg[0].count : 0;

    const totalHomeLoan = settings.totalHomeLoan || 0;
    const homeLoanRemaining = totalLoanDisbursed - homeLoanSpent;
    const undisbursedAmount = Math.max(0, totalHomeLoan - totalLoanDisbursed);

    // Builder Payments
    const builderPaymentsResult = await Payment.aggregate([
      { $match: { isBuilderPayment: true } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const builderPaid = builderPaymentsResult.length > 0 ? builderPaymentsResult[0].total : 0;

    const builderContract = settings.builderContractAmount || 0;
    const builderBalance = Math.max(0, builderContract - builderPaid);
    const builderExtraPaid = Math.max(0, builderPaid - builderContract);

    // Category Breakdown by expenseCategory
    const categoryBreakdownAgg = await Payment.aggregate([
      { $group: { _id: '$expenseCategory', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);
    const categoryBreakdown = categoryBreakdownAgg.map(c => ({
      category: c._id || 'Others',
      totalSpent: c.total,
      count: c.count,
      percentage: totalAmountPaid > 0 ? Math.round((c.total / totalAmountPaid) * 100) : 0
    }));

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
          additionalFunds: ownCashAddedFunds,
          totalAdded: ownCashTotalAdded,
          totalSpent: ownCashSpent,
          remainingBalance: ownCashRemaining,
          additionsCount: ownCashAdditionsCount
        },
        homeLoan: {
          name: 'Home Loan',
          sanctionedAmount: totalHomeLoan,
          totalDisbursed: totalLoanDisbursed,
          initialBalance: totalLoanDisbursed > 0 ? totalLoanDisbursed : (fundSourcesDocs.homeLoan.initialBalance || totalHomeLoan),
          totalSpent: homeLoanSpent,
          remainingBalance: homeLoanRemaining,
          undisbursedAmount,
          installmentsCount: loanInstallmentsCount
        },
        totalInitial: ownCashTotalAdded + totalLoanDisbursed,
        totalSpent: totalAmountPaid,
        totalRemaining: ownCashRemaining + homeLoanRemaining
      },
      homeLoan: {
        totalHomeLoan,
        sanctionedAmount: totalHomeLoan,
        totalDisbursed: totalLoanDisbursed,
        loanCashReceived: totalLoanDisbursed,
        loanBalance: undisbursedAmount,
        undisbursedAmount,
        initialBalance: totalLoanDisbursed > 0 ? totalLoanDisbursed : (fundSourcesDocs.homeLoan.initialBalance || totalHomeLoan),
        totalSpent: homeLoanSpent,
        remainingBalance: homeLoanRemaining,
        installmentsCount: loanInstallmentsCount
      },
      builder: {
        builderName: settings.builderName,
        contractAmount: builderContract,
        amountPaid: builderPaid,
        balanceAmount: builderBalance,
        extraPaid: builderExtraPaid
      },
      categoryBreakdown,
      categories: Payment.EXPENSE_CATEGORIES,
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
    const { category, paymentSource, expenseCategory, search, date, isBuilder } = req.query;
    const filter = {};

    if (expenseCategory && expenseCategory !== 'All') {
      filter.expenseCategory = expenseCategory;
    }

    if (paymentSource && paymentSource !== 'All') {
      filter.paymentSource = paymentSource;
    }

    if (category && category !== 'All' && !paymentSource && !expenseCategory) {
      if (category === 'Own Cash') {
        filter.$or = [{ paymentSource: 'Own Cash' }, { category: 'Own Cash' }];
      } else if (category === 'Home Loan' || category === 'Loan Cash') {
        filter.$or = [
          { paymentSource: 'Home Loan' },
          { category: 'Home Loan' },
          { category: 'Loan Cash' }
        ];
      } else {
        filter.expenseCategory = category;
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

// 2b. GET PAYMENT CATEGORIES
app.get('/api/payments/categories', (req, res) => {
  res.json({ categories: Payment.EXPENSE_CATEGORIES });
});

// 3. CREATE PAYMENT (Google Drive Upload)
app.post('/api/payments', upload.single('proofImage'), async (req, res) => {
  try {
    const { date, category, paymentSource, expenseCategory, paymentMethod, amount, description, isBuilderPayment } = req.body;

    const sourceVal = paymentSource || category;
    if (!amount || !description || !sourceVal || !paymentMethod) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const normalizedSource = (sourceVal === 'Loan Cash' || sourceVal === 'Home Loan') ? 'Home Loan' : 'Own Cash';
    const isBuilder = expenseCategory === 'Builder / Contractor' || isBuilderPayment === 'true' || isBuilderPayment === true;
    const resolvedExpenseCategory = expenseCategory || (isBuilder ? 'Builder / Contractor' : 'Others');

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
      expenseCategory: resolvedExpenseCategory,
      category: normalizedSource,
      paymentMethod,
      amount: parseFloat(amount),
      description: description.trim(),
      proofImage: proofUrl, // keep in sync for seamless backward compatibility
      proofFileId,
      proofUrl,
      isBuilderPayment: isBuilder
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

    const { date, category, paymentSource, expenseCategory, paymentMethod, amount, description, isBuilderPayment } = req.body;

    if (amount !== undefined) payment.amount = parseFloat(amount);
    if (description !== undefined) payment.description = description.trim();
    if (date !== undefined) payment.date = new Date(date);
    if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;

    if (expenseCategory !== undefined) {
      payment.expenseCategory = expenseCategory;
      if (expenseCategory === 'Builder / Contractor') {
        payment.isBuilderPayment = true;
      } else if (isBuilderPayment === undefined) {
        payment.isBuilderPayment = false;
      }
    }

    if (isBuilderPayment !== undefined) {
      payment.isBuilderPayment = isBuilderPayment === 'true' || isBuilderPayment === true;
      if (payment.isBuilderPayment && (!payment.expenseCategory || payment.expenseCategory === 'Others')) {
        payment.expenseCategory = 'Builder / Contractor';
      }
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

    // Additional Own Cash additions
    const ownCashAdditionsAgg = await FundAddition.aggregate([
      { $match: { fundSource: 'Own Cash' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const ownCashAddedFunds = ownCashAdditionsAgg.length > 0 ? ownCashAdditionsAgg[0].total : 0;
    const ownCashInitial = fundSourcesDocs.ownCash.initialBalance || 0;
    const ownCashTotalAdded = ownCashInitial + ownCashAddedFunds;

    // Loan Installments
    const loanInstallmentsAgg = await LoanInstallment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const totalLoanDisbursed = loanInstallmentsAgg.length > 0 
      ? loanInstallmentsAgg[0].total 
      : (settings.loanCashReceived || 0);

    const sources = [
      {
        _id: fundSourcesDocs.ownCash._id,
        name: 'Own Cash',
        initialBalance: ownCashInitial,
        additionalFunds: ownCashAddedFunds,
        totalAdded: ownCashTotalAdded,
        totalSpent: ownCashSpent,
        remainingBalance: ownCashTotalAdded - ownCashSpent,
        description: fundSourcesDocs.ownCash.description
      },
      {
        _id: fundSourcesDocs.homeLoan._id,
        name: 'Home Loan',
        initialBalance: totalLoanDisbursed > 0 ? totalLoanDisbursed : (fundSourcesDocs.homeLoan.initialBalance || settings.totalHomeLoan || 0),
        sanctionedAmount: settings.totalHomeLoan || 0,
        totalDisbursed: totalLoanDisbursed,
        totalSpent: homeLoanSpent,
        remainingBalance: totalLoanDisbursed - homeLoanSpent,
        undisbursedAmount: Math.max(0, (settings.totalHomeLoan || 0) - totalLoanDisbursed),
        description: fundSourcesDocs.homeLoan.description
      }
    ];

    res.json({
      sources,
      totalInitial: ownCashTotalAdded + totalLoanDisbursed,
      totalSpent: ownCashSpent + homeLoanSpent,
      totalRemaining: (ownCashTotalAdded - ownCashSpent) + (totalLoanDisbursed - homeLoanSpent)
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

// 10. FUND ADDITIONS (OWN CASH FUNDS)
app.get('/api/fund-additions', async (req, res) => {
  try {
    const { fundSource = 'Own Cash' } = req.query;
    const additions = await FundAddition.find({ fundSource }).sort({ date: -1, createdAt: -1 });
    const totalAdded = additions.reduce((sum, item) => sum + (item.amount || 0), 0);
    res.json({ additions, totalAdded });
  } catch (error) {
    console.error('Error fetching fund additions:', error);
    res.status(500).json({ error: 'Failed to fetch fund additions' });
  }
});

app.post('/api/fund-additions', async (req, res) => {
  try {
    const { amount, date, sourceName, description, fundSource = 'Own Cash' } = req.body;
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Please enter a valid fund amount greater than zero' });
    }
    const newAddition = await FundAddition.create({
      fundSource,
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      sourceName: sourceName ? sourceName.trim() : 'Personal Savings',
      description: description ? description.trim() : ''
    });
    res.status(201).json(newAddition);
  } catch (error) {
    console.error('Error adding fund:', error);
    res.status(500).json({ error: error.message || 'Failed to add fund' });
  }
});

app.delete('/api/fund-additions/:id', async (req, res) => {
  try {
    const item = await FundAddition.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Fund addition not found' });
    }
    res.json({ message: 'Fund addition deleted successfully' });
  } catch (error) {
    console.error('Error deleting fund addition:', error);
    res.status(500).json({ error: 'Failed to delete fund addition' });
  }
});

// 11. LOAN INSTALLMENTS (STAGE-BY-STAGE DISBURSEMENTS)
app.get('/api/loan-installments', async (req, res) => {
  try {
    const installments = await LoanInstallment.find().sort({ disbursementDate: 1, createdAt: 1 });
    const totalDisbursed = installments.reduce((sum, item) => sum + (item.amount || 0), 0);
    res.json({ installments, totalDisbursed });
  } catch (error) {
    console.error('Error fetching loan installments:', error);
    res.status(500).json({ error: 'Failed to fetch loan installments' });
  }
});

app.post('/api/loan-installments', async (req, res) => {
  try {
    const { stage, amount, disbursementDate, description, referenceNumber, bankName } = req.body;
    if (!stage || !stage.trim()) {
      return res.status(400).json({ error: 'Stage/installment name is required' });
    }
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Please enter a valid disbursement amount greater than zero' });
    }
    const newInstallment = await LoanInstallment.create({
      stage: stage.trim(),
      amount: parseFloat(amount),
      disbursementDate: disbursementDate ? new Date(disbursementDate) : new Date(),
      description: description ? description.trim() : '',
      referenceNumber: referenceNumber ? referenceNumber.trim() : '',
      bankName: bankName ? bankName.trim() : ''
    });

    // Update settings.loanCashReceived with total disbursed
    const allInstallments = await LoanInstallment.find();
    const totalDisbursed = allInstallments.reduce((sum, item) => sum + (item.amount || 0), 0);
    const settings = await getOrCreateSettings();
    settings.loanCashReceived = totalDisbursed;
    await settings.save();

    res.status(201).json(newInstallment);
  } catch (error) {
    console.error('Error adding loan installment:', error);
    res.status(500).json({ error: error.message || 'Failed to add loan installment' });
  }
});

app.put('/api/loan-installments/:id', async (req, res) => {
  try {
    const { stage, amount, disbursementDate, description, referenceNumber, bankName } = req.body;
    const installment = await LoanInstallment.findById(req.params.id);
    if (!installment) {
      return res.status(404).json({ error: 'Loan installment not found' });
    }

    if (stage !== undefined) installment.stage = stage.trim();
    if (amount !== undefined) installment.amount = parseFloat(amount);
    if (disbursementDate !== undefined) installment.disbursementDate = new Date(disbursementDate);
    if (description !== undefined) installment.description = description.trim();
    if (referenceNumber !== undefined) installment.referenceNumber = referenceNumber.trim();
    if (bankName !== undefined) installment.bankName = bankName.trim();
    await installment.save();

    // Re-sync settings
    const allInstallments = await LoanInstallment.find();
    const totalDisbursed = allInstallments.reduce((sum, item) => sum + (item.amount || 0), 0);
    const settings = await getOrCreateSettings();
    settings.loanCashReceived = totalDisbursed;
    await settings.save();

    res.json(installment);
  } catch (error) {
    console.error('Error updating loan installment:', error);
    res.status(500).json({ error: 'Failed to update loan installment' });
  }
});

app.delete('/api/loan-installments/:id', async (req, res) => {
  try {
    const item = await LoanInstallment.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Loan installment not found' });
    }

    // Re-sync settings
    const allInstallments = await LoanInstallment.find();
    const totalDisbursed = allInstallments.reduce((sum, item) => sum + (item.amount || 0), 0);
    const settings = await getOrCreateSettings();
    settings.loanCashReceived = totalDisbursed;
    await settings.save();

    res.json({ message: 'Loan installment deleted successfully' });
  } catch (error) {
    console.error('Error deleting loan installment:', error);
    res.status(500).json({ error: 'Failed to delete loan installment' });
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
