# 💰 Daily Finance Email Tool - Setup Guide

This Google Apps Script tool automatically sends you a daily email with your variable budget tracking, including Month-to-Date (MTD) and Year-to-Date (YTD) spending analysis from your Google Sheets transaction data.

## 📋 Prerequisites

- A Google Sheet with your transaction data
- A cell in your spreadsheet with your monthly variable budget amount
- Gmail account (same as your Google Sheet)
- Transaction data with: Date, Description, Amount, Account, Account #, and Income Or Expense columns

## 📊 Google Sheet Format

Your Google Sheet should have:

1. **A transactions tab** with these columns:

| Date       | Description | Amount  | Account | Account # | ... | Income Or Expense |
|------------|-------------|---------|---------|-----------|-----|-------------------|
| 2025-12-15 | Groceries   | -150.00 | Chase   | 1234      | ... | Expense           |
| 2025-12-16 | Salary      | 5000.00 | Wells   | 5678      | ... | Income            |
| 2025-12-17 | Gas         | -45.50  | Amex    | 9012      | ... | Expense           |

2. **A cell with your monthly variable budget** (e.g., `Budget!B5` containing `4000`)

### Important Notes:
- **Date**: Any date format recognized by Google Sheets
- **Description**: Transaction description (for large expense tracking)
- **Amount**: Numeric values (negative for expenses, positive for income)
- **Account & Account #**: For tracking which account expenses came from
- **Income Or Expense**: Must contain either "Income" or "Expense" (case insensitive)
- **Variable Budget Cell**: A single cell containing your monthly variable budget as a number

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
  sheetName: 'Transactions',

  // REQUIRED: Update with your email address
  recipientEmail: 'your-email@gmail.com',

  // REQUIRED: Cell reference for your monthly variable budget
  // Example: 'Budget!B5' means cell B5 in the 'Budget' sheet tab
  variableBudgetCell: 'Budget!B5',

  // Column names in your Google Sheet
  columns: {
    date: 'Date',
    description: 'Description',
    amount: 'Amount',
    account: 'Account',
    accountNumber: 'Account #',
    incomeOrExpense: 'Income Or Expense'
  },

  // Set your preferred email time (24-hour format)
  emailTime: {
    hour: 9,    // 9 AM
    minute: 0
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

You'll receive a mobile-friendly HTML email daily with:

### Main Budget Tracking Table
```
┌──────────────────┬─────────┬─────────┐
│                  │   MTD   │   YTD   │
├──────────────────┼─────────┼─────────┤
│ Variable Budget  │ $4,000  │ $48,000 │
│ Actual Spending  │ $2,800  │ $42,000 │
│ % Budget Spent   │   70%   │   88%   │
└──────────────────┴─────────┴─────────┘
```

**What it shows:**
- **Variable Budget**: Your monthly budget (MTD) and year-to-date budget (YTD = monthly × month number)
- **Actual Spending**: Total of all expenses from transactions
- **% Budget Spent**: (Actual / Budget) × 100
  - Black if ≤ 100% (on or under budget)
  - Red if > 100% (over budget)

### Large Expense Sections

**💸 Large Expenses from Yesterday (> $100)**
- Lists all expenses from yesterday exceeding $100
- Shows: Description, Date, Account info, Amount
- Sorted by amount (highest first)

**🔴 Large Expenses This Month (> $1,000)**
- Lists all expenses this month exceeding $1,000
- Shows: Description, Date, Account info, Amount
- Sorted by amount (highest first)

### Mobile Responsive
The email automatically adjusts for mobile devices.

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

If your sheet uses different column names, update the CONFIG:

```javascript
columns: {
  date: 'Transaction Date',
  description: 'Notes',
  amount: 'Amount ($)',
  account: 'Bank',
  accountNumber: 'Last 4',
  incomeOrExpense: 'Type'
}
```

### Change Variable Budget Cell

Point to a different cell with your budget:

```javascript
variableBudgetCell: 'Summary!C10',  // Cell C10 in Summary tab
```

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
- Ensure "Income Or Expense" column contains exactly "Income" or "Expense" for each transaction
- Verify `variableBudgetCell` points to the correct cell
- Check that the budget cell contains a number, not text
- Check the execution log for error messages

### Budget shows $0.00
- Double-check `variableBudgetCell` format: `'SheetName!CellReference'`
- Make sure the cell contains a number (e.g., `4000`), not a formula result stored as text
- Try changing the cell to a plain number

### Large expenses not showing
- Verify yesterday's date and this month's transactions exist
- Check that amounts exceed the thresholds ($100 for yesterday, $1,000 for this month)
- Ensure transactions are marked as "Expense" in the Income Or Expense column

### Authorization errors
- Go to **Triggers** and delete all existing triggers
- Run the `setup` function again
- Re-authorize when prompted

### Want to stop daily emails?
1. Click the **Triggers** icon (clock icon)
2. Find the `sendDailyFinanceEmail` trigger
3. Click the three dots (⋮) on the right
4. Click **Delete trigger**

## 📊 How It Works

### Budget Calculations

**MTD (Month to Date):**
- Variable Budget = Value from your budget cell (constant)
- Actual Spending = Sum of all expenses this month
- % Budget Spent = (Actual / Budget) × 100

**YTD (Year to Date):**
- Variable Budget = Monthly budget × Current month number (January = 1, February = 2, etc.)
- Actual Spending = Sum of all expenses year-to-date
- % Budget Spent = (Actual / Budget) × 100

### Transaction Classification

**Column-based:** The script uses the "Income Or Expense" column to determine transaction type:
- "Income" → Counted as income (ignored in spending calculations)
- "Expense" → Counted as expense
- Any other value → Transaction is skipped

**Amount handling:**
- Expenses are summed as raw amounts (negative values)
- Refunds (positive amounts marked as "Expense") reduce total spending
- Final spending amount is converted to positive for display

### Best Practices:
- Ensure every transaction has either "Income" or "Expense"
- Values are case-insensitive ("income" and "INCOME" both work)
- Use negative amounts for expenses, positive for income
- Refunds should be positive amounts marked as "Expense"

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
