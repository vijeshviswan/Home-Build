const mongoose = require('mongoose');

const loanInstallmentSchema = new mongoose.Schema({
  stage: {
    type: String,
    required: [true, 'Stage/Installment name is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [1, 'Amount must be greater than zero']
  },
  disbursementDate: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  referenceNumber: {
    type: String,
    trim: true,
    default: ''
  },
  bankName: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LoanInstallment', loanInstallmentSchema);
