# Mobile-First House Construction Payment Tracker

A lightweight, personal mobile-first web app built on the **MERN** stack (React, Node.js, Express, MongoDB, Mongoose) to track house construction payments, loan disbursements, and builder contract balances effortlessly from your phone.

---

## 📱 Features

- **Dashboard (6-Tile Grid)**:
  - **Total Cost**: Total Estimated Building Cost & Total Amount Paid (budget & payment history).
  - **Home Loan**: Total Home Loan, Loan Cash Received, and Loan Balance (`Total - Received`).
  - **Builder Details**: Builder Name, Contract Amount, Amount Paid, and Remaining Balance / Extra Paid.
  - **Source of Cash**: Track borrowed funds from friends, gold loan, chitty, family with auto-calculated total.
  - **Search**: Real-time keyword, category, and date filtering.
  - **Print**: Monthly construction finance statement with PDF/print generation.
- **Source of Cash**:
  - Automatically calculates **Total Cash Received**.
  - Simple mobile form to log source name, amount, date, and optional notes.
  - Clean card list showing Source, Amount, and Date.
  - Detail modal with full info and delete option.
- **Print Monthly Statement**:
  - Month/Year selector (e.g. September 2026).
  - Clean breakdown: Monthly Summary, Money Received, Payments Made (Builder & Other).
  - Native browser print dialog (`window.print()`) formatted cleanly for A4 / PDF export with zero clutter.
- **New Payment**:
  - Mobile date picker (defaults to today).
  - Category dropdown (`Own Cash` / `Loan Cash`).
  - Payment Method dropdown (`Online` / `Cheque` / `Cash`).
  - Conditional photo/file upload for Cheque copy or Online screenshot.
  - Amount input with large clear numbers.
  - Description input (e.g., "Cement purchase", "Builder advance").
  - "Paid to Builder" toggle linking payments to the contractor.
- **Payment List**:
  - Clean personal-finance cards showing Amount, Description, Category, Method, and Date.
  - Tapping opens payment details modal with full receipt image and delete option.
  - Category filter pills (`All`, `Own Cash`, `Loan Cash`).
- **Search Page**:
  - Real-time search by description / keyword.
  - Category dropdown filter.
  - Date filter.
- **Builder Page**:
  - Contractor summary: Contract, Total Paid, Balance, and any Extra Paid.
  - Dedicated contractor payment history list.
  - Quick "Pay Builder" action.
- **Settings Modal**:
  - Easily adjust Total Building Cost, Total Home Loan, Loan Received, and Builder Contract without database commands.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** running locally on default port `27017`

### 2. Installation
From the root directory:
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 3. Run Application
From the root directory, start both the Express API and Vite React client:
```bash
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5001](http://localhost:5001)
