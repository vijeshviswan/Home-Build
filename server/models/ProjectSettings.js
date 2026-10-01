const mongoose = require('mongoose');

const projectSettingsSchema = new mongoose.Schema({
  builderName: {
    type: String,
    default: 'Sri Krishna Builders',
    trim: true
  },
  builderContractAmount: {
    type: Number,
    default: 3500000 // e.g. 35 Lakhs
  },
  totalBuildingCost: {
    type: Number,
    default: 5000000 // e.g. 50 Lakhs
  },
  totalHomeLoan: {
    type: Number,
    default: 3000000 // e.g. 30 Lakhs
  },
  loanCashReceived: {
    type: Number,
    default: 1200000 // e.g. 12 Lakhs
  },
  ownCashInitialBalance: {
    type: Number,
    default: 130000 // Initial Own Cash funds
  },
  homeLoanInitialBalance: {
    type: Number,
    default: 3000000 // Initial Home Loan sanctioned funds
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ProjectSettings', projectSettingsSchema);
