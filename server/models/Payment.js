const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Payment date is required'],
    default: Date.now
  },
  category: {
    type: String,
    enum: ['Own Cash', 'Loan Cash'],
    required: [true, 'Category is required']
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
  isBuilderPayment: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
