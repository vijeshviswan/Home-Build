const mongoose = require('mongoose');

const cashSourceSchema = new mongoose.Schema({
  source: {
    type: String,
    required: [true, 'Source name is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [1, 'Amount must be greater than zero']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  details: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CashSource', cashSourceSchema);
