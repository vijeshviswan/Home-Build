const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = [
  'Builder / Contractor',
  'Materials',
  'Electrical & Plumbing',
  'Labor / Workers',
  'Government / Approvals',
  'Others'
];

const paymentSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Payment date is required'],
    default: Date.now
  },
  paymentSource: {
    type: String,
    enum: ['Own Cash', 'Home Loan'],
    default: 'Own Cash',
    required: [true, 'Payment source is required']
  },
  expenseCategory: {
    type: String,
    enum: EXPENSE_CATEGORIES,
    default: 'Others',
    trim: true
  },
  category: {
    type: String,
    enum: ['Own Cash', 'Home Loan', 'Loan Cash'],
    default: 'Own Cash'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Cheque', 'Online'],
    required: [true, 'Payment method is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than zero']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  proofImage: {
    type: String,
    default: ''
  },
  proofFileId: {
    type: String,
    default: ''
  },
  proofUrl: {
    type: String,
    default: ''
  },
  isBuilderPayment: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

paymentSchema.pre('validate', function() {
  if (this.paymentSource) {
    if (this.paymentSource === 'Loan Cash') {
      this.paymentSource = 'Home Loan';
    }
    if (!this.category) {
      this.category = this.paymentSource;
    }
  } else if (this.category) {
    if (this.category === 'Loan Cash' || this.category === 'Home Loan') {
      this.paymentSource = 'Home Loan';
      this.category = 'Home Loan';
    } else {
      this.paymentSource = 'Own Cash';
      this.category = 'Own Cash';
    }
  } else {
    this.paymentSource = 'Own Cash';
    this.category = 'Own Cash';
  }

  // Synchronize expenseCategory and isBuilderPayment
  if (this.expenseCategory === 'Builder / Contractor') {
    this.isBuilderPayment = true;
  } else if (this.isBuilderPayment && (!this.expenseCategory || this.expenseCategory === 'Others')) {
    this.expenseCategory = 'Builder / Contractor';
  } else if (!this.expenseCategory) {
    this.expenseCategory = 'Others';
  }
});

paymentSchema.statics.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;

module.exports = mongoose.model('Payment', paymentSchema);
