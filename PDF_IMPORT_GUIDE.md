# PDF Import Guide - ICICI Bank Statement

## Overview
The PDF parser has been updated to correctly handle ICICI bank statement format. The parser now:
- Correctly identifies transaction dates, descriptions, and amounts
- Distinguishes between deposits (credit) and withdrawals (debit)
- Handles multi-line transaction descriptions
- Extracts balance information

## How to Import Your PDF

### Step 1: Navigate to Transactions Page
1. Open the Budgety app at http://localhost:3001/Budgety/
2. Click on the "Transactions" button in the sidebar

### Step 2: Upload PDF
1. Scroll down to the "Import Bank Statement" section
2. Click on the upload area or drag and drop your PDF file
3. Supported file: `OpTransactionHistory15-02-2026.pdf`

### Step 3: Review Parsed Transactions
The system will automatically:
- Parse all transactions from the PDF
- Detect transaction types (income/expense)
- Auto-categorize transactions based on description
- Show a preview of all transactions

### Step 4: Adjust Categories (Optional)
- Review the auto-detected categories
- Change any categories as needed using the dropdown
- The system uses keywords in descriptions to auto-categorize

### Step 5: Import
- Click the "Import X Transaction(s)" button
- The system will:
  - Check for duplicates (skip if already imported)
  - Add unique transactions to your database
  - Show success message with count

## Transaction Type Detection

### Deposits (Income/Credit)
Detected by keywords:
- "Payment fr" - Incoming UPI payment
- "BIL/INFT" - Internal fund transfer (deposit)

### Withdrawals (Expense/Debit)
Detected by keywords:
- "Paid via" - Outgoing UPI payment
- "payment on" - Payment to merchant

## Expected Results for Your PDF

Based on the PDF content, you should see **22 transactions**:
- Dates: 08.02.2026 to 13.02.2026
- Mix of deposits and withdrawals
- Various UPI transactions, internal transfers, etc.

## Sample Transactions from Your PDF

1. **BIL/INFT/FBC0279486/ AZAD ANSARI** - ₹100.00 (Deposit)
2. **BIL/INFT/FBC0291285/ AZAD ANSARI** - ₹50,000.00 (Deposit)
3. **UPI/AZAD ANSAR/Payment fr/ICICI Bank** - ₹54,900.00 (Deposit)
4. **UPI/CRED Club/payment on/AXIS BANK** - ₹44,157.00 (Withdrawal)
5. **UPI/MEHTA OPTI/Paid via C/YES BANK** - ₹85.00 (Withdrawal)

## Troubleshooting

### If transactions are not parsed correctly:
1. Check the browser console (F12) for any errors
2. Verify the PDF is readable (not scanned/image-based)
3. Ensure the PDF follows ICICI bank statement format

### If categories are incorrect:
- You can manually adjust categories before importing
- Categories are auto-detected but can be changed

### If duplicates are detected:
- The system automatically skips duplicate transactions
- Duplicates are detected by matching: date, description, and amount

## Technical Details

### Parser Logic
- Identifies transactions by serial number and date pattern: `\d+ \d{2}.\d{2}.\d{4}`
- Reads multi-line descriptions until amounts are found
- Extracts two amounts: transaction amount and balance
- Determines type based on keywords in description

### Date Format
- Input: DD.MM.YYYY (e.g., 08.02.2026)
- Stored as: YYYY-MM-DD (ISO format)

### Amount Format
- Input: Comma-separated with 2 decimals (e.g., 50,000.00)
- Stored as: Number without commas

## Next Steps After Import

Once imported, your transactions will be:
1. Visible in the Transactions list
2. Included in Dashboard statistics
3. Used for Budget tracking
4. Available in Reports and Charts
5. Persisted in localStorage (survives page refresh)

## Cleanup

If you need to remove all imported transactions:
- Click the "Cleanup Imported Data" button in the Import section
- This will remove ONLY transactions marked as "imported"
- Manual transactions will not be affected
