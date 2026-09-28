const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const Payment = require('./models/Payment');
const ProjectSettings = require('./models/ProjectSettings');
const CashSource = require('./models/CashSource');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/house_payment_tracker';

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `proof-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
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
      loanCashReceived: 1200000
    });
  }
  return settings;
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

// 1. DASHBOARD SUMMARY
app.get('/api/dashboard', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    // Total Amount Paid from all payments
    const totalPaymentsResult = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalAmountPaid = totalPaymentsResult.length > 0 ? totalPaymentsResult[0].total : 0;

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
      homeLoan: {
        totalHomeLoan,
        loanCashReceived,
        loanBalance
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
    const { category, search, date, isBuilder } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
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

// 3. CREATE PAYMENT
app.post('/api/payments', upload.single('proofImage'), async (req, res) => {
  try {
    const { date, category, paymentMethod, amount, description, isBuilderPayment } = req.body;

    if (!amount || !description || !category || !paymentMethod) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    let proofImagePath = '';
    if (req.file) {
      proofImagePath = `/uploads/${req.file.filename}`;
    }

    const newPayment = await Payment.create({
      date: date ? new Date(date) : new Date(),
      category,
      paymentMethod,
      amount: parseFloat(amount),
      description: description.trim(),
      proofImage: proofImagePath,
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

// 5. DELETE PAYMENT
app.delete('/api/payments/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Optional: remove file if exists
    if (payment.proofImage) {
      const filePath = path.join(__dirname, payment.proofImage);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Could not delete image file:', e);
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
    const { builderName, builderContractAmount, totalBuildingCost, totalHomeLoan, loanCashReceived } = req.body;

    if (builderName !== undefined) settings.builderName = builderName;
    if (builderContractAmount !== undefined) settings.builderContractAmount = parseFloat(builderContractAmount);
    if (totalBuildingCost !== undefined) settings.totalBuildingCost = parseFloat(totalBuildingCost);
    if (totalHomeLoan !== undefined) settings.totalHomeLoan = parseFloat(totalHomeLoan);
    if (loanCashReceived !== undefined) settings.loanCashReceived = parseFloat(loanCashReceived);
    settings.updatedAt = new Date();

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
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

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB successfully.');
    await getOrCreateSettings();
    await seedInitialData();
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
