const mongoose = require('mongoose');

const fundAdditionSchema = new mongoose.Schema({
  fundSource: {
    type: String,
    default: 'Own Cash',
    enum: ['Own Cash']
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
  sourceName: {
    type: String,
    trim: true,
    default: 'Personal Savings'
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FundAddition', fundAdditionSchema);
