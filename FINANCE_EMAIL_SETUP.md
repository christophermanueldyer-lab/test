# 💰 Daily Finance Email Tool - Setup Guide

This Google Apps Script tool automatically sends you a daily email with your financial summary, including Month-to-Date (MTD) and Year-to-Date (YTD) cash flow from your Google Sheets transaction data.

## 📋 Prerequisites

- A Google Sheet with your transaction data
- Gmail account (same as your Google Sheet)
- Transaction data with at least: Date, Amount, and Type columns

## 📊 Google Sheet Format

Your Google Sheet should have a tab with transaction data. The expected columns are:

| Date       | Description        | Amount  | Income Or Expense |
|------------|--------------------|---------|-------------------|
| 2025-01-15 | Salary             | 5000.00 | Income            |
| 2025-01-16 | Groceries          | -150.00 | Expense           |
| 2025-01-17 | Gas Station        | -45.50  | Expense           |
| 2025-01-18 | Amazon Refund      | 25.00   | Expense           |
| 2025-01-19 | Freelance work     | 200.00  | Income            |

### Important Notes:
- **Date Column**: Any date format recognized by Google Sheets
- **Amount Column**: Numeric values (positive for income, negative for expenses)
- **Income Or Expense Column**: Should contain "Income" or "Expense" (case insensitive)
- **Description Column**: Used for smart refund detection (detects keywords like "refund", "return", "reversal")
- **Refund Handling**: Refunds are automatically classified as expenses (not income) even if the amount is positive
- Column names can be customized in the script configuration
- Other columns (Category, Account, etc.) are ignored but won't cause issues

## 🚀 Installation Steps

### Step 1: Open Apps Script Editor

1. Open your Google Sheet with transaction data
2. Click on **Extensions** → **Apps Script**
3. This will open the Apps Script editor in a new tab

### Step 2: Add the Script

1. Delete any existing code in the editor (default `function myFunction() {}`)
2. Open the `DailyFinanceEmail.gs` file from this repository
3. Copy **all the code**
4. Paste it into the Apps Script editor
5. Click the **Save** icon (or Ctrl+S / Cmd+S)
6. Name your project (e.g., "Daily Finance Email")

### Step 3: Configure Settings

In the script, update the `CONFIG` section at the top with your settings:

```javascript
const CONFIG = {
  // REQUIRED: Update this to match your sheet tab name
  sheetName: 'Transactions',  // Change to your actual tab name

  // REQUIRED: Update with your email address
  recipientEmail: 'your-email@gmail.com',

  // Update these if your columns have different names
  columns: {
    date: 'Date',
    amount: 'Amount',
    incomeOrExpense: 'Income Or Expense',
    description: 'Description'
  },

  // Keywords to detect refunds (treated as expenses, not income)
  refundKeywords: [
    'refund',
    'return',
    'reversal',
    'credit adjustment',
    'chargeback',
    'reimbursement'
  ],

  // Set your preferred email time (24-hour format)
  emailTime: {
    hour: 9,    // 9 AM
    minute: 0   // 0 minutes
  }
};
```

### Step 4: Save Your Changes

Click the **Save** icon again after updating the configuration.

### Step 5: Run Initial Setup

1. In the Apps Script editor, find the function dropdown at the top (it says "Select function")
2. Select **`setup`** from the dropdown
3. Click the **Run** button (▶️ play icon)
4. **Important**: You'll see an authorization dialog:
   - Click **Review Permissions**
   - Choose your Google account
   - Click **Advanced** → **Go to [Your Project Name] (unsafe)**
   - Click **Allow**

This authorization allows the script to:
- Read your Google Sheet data
- Send emails on your behalf

### Step 6: Verify Setup

After running `setup`:
1. Check the **Execution log** (View → Logs or Ctrl+Enter)
2. You should see: "Daily trigger created successfully"
3. Check your email - you should receive a test email immediately
4. Go to **Triggers** (clock icon on left sidebar) - you should see a daily trigger

## ✅ Testing

### Send a Test Email Manually

1. In the function dropdown, select **`testEmail`**
2. Click **Run** (▶️)
3. Check your inbox for the finance summary email

### Verify Daily Trigger

1. Click the **Triggers** icon (clock icon) in the left sidebar
2. You should see a trigger for `sendDailyFinanceEmail`
3. It should run daily at your configured time

## 📧 Email Output

You'll receive a beautifully formatted, mobile-friendly HTML email daily with a clean table layout:

### Email Format
The email displays your financial data in a table with:
- **Columns**: MTD (Month to Date) and YTD (Year to Date)
- **Rows**:
  - **Cash Flow** (highlighted at top) - Your net position
  - **Income** - Total money in (with transaction count)
  - **Expenses** - Total money out (with transaction count)

### Color Coding
- **Cash Flow**: Green if positive, Red if negative
- **Income**: Always green
- **Expenses**: Always red
- Transaction counts displayed in small gray text under each amount

### Mobile Responsive
The table automatically adjusts for mobile devices, making it easy to check your finances on the go.

## 🎨 Customization Options

### Change Email Time

Update the `emailTime` in the CONFIG section:

```javascript
emailTime: {
  hour: 18,   // 6 PM
  minute: 30  // 30 minutes
}
```

Then run the `setup` function again to update the trigger.

### Change Column Names

If your sheet uses different column names:

```javascript
columns: {
  date: 'Transaction Date',
  amount: 'Amount ($)',
  incomeOrExpense: 'Type',
  description: 'Notes'
}
```

### Customize Refund Detection

Add or remove keywords to detect refunds in the `refundKeywords` array:

```javascript
refundKeywords: [
  'refund',
  'return',
  'reversal',
  'credit adjustment',
  'chargeback',
  'reimbursement',
  'cashback'  // Add your own keywords
]
```

Any transaction with these keywords in the description will be treated as an expense, even if the amount is positive.

### Multiple Recipients

To send to multiple email addresses, update `sendDailyFinanceEmail()`:

```javascript
MailApp.sendEmail({
  to: 'email1@gmail.com, email2@gmail.com',
  subject: `Daily Finance Update - ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMM dd, yyyy')}`,
  htmlBody: emailBody
});
```

## 🔧 Troubleshooting

### "Sheet named 'Transactions' not found"
- Make sure the `sheetName` in CONFIG matches your actual sheet tab name exactly
- Sheet names are case-sensitive

### "Required columns not found"
- Verify your column names in the CONFIG match your sheet exactly
- Check for extra spaces in column headers

### Email not arriving
- Check your spam folder
- Verify the `recipientEmail` in CONFIG is correct
- Run `testEmail` function to check for errors in the execution log

### No data in email / amounts are $0.00
- Verify your transactions have valid dates
- Check that amounts are numeric (not text)
- Ensure the "Income Or Expense" column contains "Income" or "Expense"
- Check the execution log for error messages

### Refunds showing as income
- Check that your description contains refund keywords (refund, return, reversal, etc.)
- Or manually set the "Income Or Expense" column to "Expense" for refund transactions
- You can customize the `refundKeywords` array to add your own keywords

### Authorization errors
- Go to **Triggers** and delete all existing triggers
- Run the `setup` function again
- Re-authorize when prompted

### Want to stop daily emails?
1. Click the **Triggers** icon (clock icon)
2. Find the `sendDailyFinanceEmail` trigger
3. Click the three dots (⋮) on the right
4. Click **Delete trigger**

## 📊 Understanding Income vs Expense Detection

The script uses an intelligent, multi-layered approach to determine whether a transaction is income or expense:

### Detection Priority (in order):

1. **Refund Detection (First)**: If the description contains refund keywords → Always treated as Expense
   - Keywords: refund, return, reversal, credit adjustment, chargeback, reimbursement
   - This prevents refunds from incorrectly showing as income

2. **Income Or Expense Column**: If available, uses this column to classify the transaction
   - "Income" → Income
   - "Expense" → Expense

3. **Amount Sign (Fallback)**: If no type column exists
   - Positive amounts → Income
   - Negative amounts → Expense

### Why This Matters:
Without refund detection, a $50 refund (positive amount) would incorrectly count as income. With refund detection, it's properly categorized as an expense being reversed.

### Best Practices:
- Fill out the "Income Or Expense" column for all transactions
- Use consistent values: "Income" and "Expense"
- Keep descriptions clear - they help with refund detection
- Review your refund keywords and customize if needed

## 🔐 Privacy & Security

- This script runs entirely within your Google account
- No data is sent to external servers
- Only you can access the script and data
- The script only has access to your Google Sheet and Gmail
- You can review the code at any time to verify what it does

## 📝 Advanced: Modifying the Email Format

The email HTML is generated in the `formatEmailBody()` function. You can customize:

- Colors (search for color hex codes like `#059669`)
- Font sizes
- Layout structure
- Add additional metrics or sections

## 🆘 Getting Help

If you encounter issues:

1. Check the **Execution log** (View → Logs)
2. Run `testEmail` function and check for errors
3. Verify all CONFIG settings match your sheet
4. Review the troubleshooting section above

## 📅 Maintenance

### Updating Transaction Data
- Simply add new rows to your Google Sheet
- The script automatically processes all data each day
- No need to modify the script when adding transactions

### Changing Triggers
- Run the `setup` function again to recreate triggers
- Old triggers are automatically deleted when you run setup

## 🎯 Example Use Cases

- **Daily budget monitoring**: Track if you're staying within spending limits
- **Monthly financial review**: See MTD trends as the month progresses
- **Year-end planning**: Monitor YTD income and expenses for tax planning
- **Financial accountability**: Daily email keeps finances top of mind

---

**Enjoy your automated daily finance updates! 💰📊**

For questions or improvements, feel free to modify the script to fit your specific needs.
