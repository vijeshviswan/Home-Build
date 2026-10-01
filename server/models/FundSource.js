const mongoose = require('mongoose');

const fundSourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Fund source name is required'],
    unique: true,
    trim: true,
    enum: ['Own Cash', 'Home Loan']
  },
  initialBalance: {
    type: Number,
    required: [true, 'Initial balance is required'],
    default: 0,
    min: [0, 'Initial balance cannot be negative']
  },
  accountNumber: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FundSource', fundSourceSchema);
