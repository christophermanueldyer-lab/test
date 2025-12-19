/**
 * Daily Finance Email Tool
 *
 * This Google Apps Script automatically sends a daily email with:
 * - Month-to-Date (MTD) actual cash flow
 * - Year-to-Date (YTD) actual cash flow
 *
 * Setup Instructions:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire script
 * 4. Update the CONFIG section below with your settings
 * 5. Save the project
 * 6. Run 'setup' function once to authorize
 * 7. The script will automatically send daily emails at your specified time
 */

// ============================================================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================================================

const CONFIG = {
  // The name of the sheet tab containing your transaction data
  sheetName: 'Transactions',

  // Your email address to receive the daily update
  recipientEmail: 'your-email@gmail.com',

  // Budget configuration - cell reference for your monthly variable budget
  // Example: 'Budget!B5' means cell B5 in the 'Budget' sheet tab
  variableBudgetCell: 'Budget!B5',  // UPDATE THIS with your actual cell reference

  // Column names in your Google Sheet
  // Note: Column K should contain either "Income" or "Expense"
  columns: {
    date: 'Date',
    description: 'Description',
    amount: 'Amount',
    account: 'Account',
    accountNumber: 'Account #',
    incomeOrExpense: 'Income Or Expense'  // Column K in your sheet
  },

  // Time to send daily email (24-hour format)
  emailTime: {
    hour: 9,    // 9 AM
    minute: 0   // 0 minutes
  }
};

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Send the daily finance email
 * This is the main function that runs on a daily trigger
 */
function sendDailyFinanceEmail() {
  try {
    const variableBudget = getVariableBudget();
    const data = getTransactionData();
    const summary = calculateFinancialSummary(data, variableBudget);
    const emailBody = formatEmailBody(summary);

    MailApp.sendEmail({
      to: CONFIG.recipientEmail,
      subject: `Daily Finance Update - ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMM dd, yyyy')}`,
      htmlBody: emailBody
    });

    Logger.log('Daily finance email sent successfully');
  } catch (error) {
    Logger.log('Error sending daily finance email: ' + error.toString());
    // Send error notification email
    MailApp.sendEmail({
      to: CONFIG.recipientEmail,
      subject: 'Error: Daily Finance Email Failed',
      body: 'There was an error generating your daily finance email:\n\n' + error.toString()
    });
  }
}

/**
 * One-time setup function
 * Run this once to set up the daily trigger
 */
function setup() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  // Create new daily trigger
  ScriptApp.newTrigger('sendDailyFinanceEmail')
    .timeBased()
    .atHour(CONFIG.emailTime.hour)
    .nearMinute(CONFIG.emailTime.minute)
    .everyDays(1)
    .create();

  Logger.log('Daily trigger created successfully');

  // Send a test email to confirm setup
  sendDailyFinanceEmail();
}

/**
 * Manual test function
 * Run this to test the email without waiting for the trigger
 */
function testEmail() {
  sendDailyFinanceEmail();
}

// ============================================================================
// DATA PROCESSING FUNCTIONS
// ============================================================================

/**
 * Get the monthly variable budget from the specified cell
 */
function getVariableBudget() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    const range = ss.getRange(CONFIG.variableBudgetCell);
    const value = range.getValue();
    const budget = parseFloat(value);

    if (isNaN(budget)) {
      throw new Error(`Variable budget cell "${CONFIG.variableBudgetCell}" does not contain a valid number`);
    }

    return budget;
  } catch (error) {
    throw new Error(`Failed to read variable budget from cell "${CONFIG.variableBudgetCell}": ${error.message}`);
  }
}

/**
 * Get transaction data from the Google Sheet
 */
function getTransactionData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheetName);

  if (!sheet) {
    throw new Error(`Sheet named "${CONFIG.sheetName}" not found. Please update CONFIG.sheetName`);
  }

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  if (values.length < 2) {
    throw new Error('No transaction data found in the sheet');
  }

  // Get header row to find column indices
  const headers = values[0];
  const dateCol = headers.indexOf(CONFIG.columns.date);
  const descCol = headers.indexOf(CONFIG.columns.description);
  const amountCol = headers.indexOf(CONFIG.columns.amount);
  const accountCol = headers.indexOf(CONFIG.columns.account);
  const accountNumCol = headers.indexOf(CONFIG.columns.accountNumber);
  const typeCol = headers.indexOf(CONFIG.columns.incomeOrExpense);

  if (dateCol === -1 || amountCol === -1 || typeCol === -1) {
    throw new Error('Required columns (Date, Amount, Income Or Expense) not found. Please check CONFIG.columns settings');
  }

  // Parse transactions (skip header row)
  const transactions = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const date = new Date(row[dateCol]);
    const description = descCol !== -1 ? String(row[descCol]).trim() : '';
    const amount = parseFloat(row[amountCol]);
    const account = accountCol !== -1 ? String(row[accountCol]).trim() : '';
    const accountNumber = accountNumCol !== -1 ? String(row[accountNumCol]).trim() : '';
    const type = String(row[typeCol]).trim().toLowerCase();

    // Skip invalid rows
    if (isNaN(date.getTime()) || isNaN(amount)) {
      continue;
    }

    // Skip rows without a valid type
    if (!type || (type !== 'income' && type !== 'expense')) {
      continue;
    }

    transactions.push({
      date: date,
      description: description,
      amount: amount,
      account: account,
      accountNumber: accountNumber,
      type: type
    });
  }

  return transactions;
}

/**
 * Calculate MTD and YTD budget tracking summary
 */
function calculateFinancialSummary(transactions, monthlyVariableBudget) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();  // 0-indexed (0 = January)
  const currentDay = now.getDate();

  // Start of current month
  const monthStart = new Date(currentYear, currentMonth, 1);

  // Start of current year
  const yearStart = new Date(currentYear, 0, 1);

  // Yesterday (calendar day, not last 24 hours)
  const yesterday = new Date(currentYear, currentMonth, currentDay - 1);
  const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);

  // Days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const summary = {
    mtd: {
      variableBudget: monthlyVariableBudget,
      actualSpending: 0,
      pace: 0
    },
    ytd: {
      variableBudget: monthlyVariableBudget * (currentMonth + 1),  // Month number (1-12)
      actualSpending: 0,
      pace: 0
    },
    largeExpenses: {
      yesterday: [],  // Expenses > $100 from yesterday
      thisMonth: []   // Expenses > $1000 from this month
    }
  };

  transactions.forEach(t => {
    // Use the Income Or Expense column (column K) to determine type
    const isIncome = t.type === 'income';

    // Year-to-Date actual spending (all expenses)
    if (t.date >= yearStart && !isIncome) {
      summary.ytd.actualSpending += t.amount;  // Sum raw amounts (negative expenses, positive refunds)
    }

    // Month-to-Date actual spending (all expenses)
    if (t.date >= monthStart && !isIncome) {
      summary.mtd.actualSpending += t.amount;  // Sum raw amounts (negative expenses, positive refunds)

      // Track large expenses from this month (> $1000)
      const absAmount = Math.abs(t.amount);
      if (absAmount > 1000) {
        summary.largeExpenses.thisMonth.push({
          date: t.date,
          description: t.description,
          amount: absAmount,
          account: t.account,
          accountNumber: t.accountNumber
        });
      }
    }

    // Track large expenses from yesterday (> $100)
    if (!isIncome && t.date >= yesterdayStart && t.date < yesterdayEnd) {
      const absAmount = Math.abs(t.amount);
      if (absAmount > 100) {
        summary.largeExpenses.yesterday.push({
          date: t.date,
          description: t.description,
          amount: absAmount,
          account: t.account,
          accountNumber: t.accountNumber
        });
      }
    }
  });

  // Convert actual spending to positive for display
  summary.mtd.actualSpending = Math.abs(summary.mtd.actualSpending);
  summary.ytd.actualSpending = Math.abs(summary.ytd.actualSpending);

  // Calculate MTD % Budget Spent: (Actual / Budget) × 100
  summary.mtd.pace = summary.mtd.variableBudget > 0 ? (summary.mtd.actualSpending / summary.mtd.variableBudget) * 100 : 0;

  // Calculate YTD % Budget Spent: (Actual / Budget) × 100
  summary.ytd.pace = summary.ytd.variableBudget > 0 ? (summary.ytd.actualSpending / summary.ytd.variableBudget) * 100 : 0;

  return summary;
}

/**
 * Format the email body with financial summary as a mobile-friendly table
 */
function formatEmailBody(summary) {
  const now = new Date();
  const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'EEEE, MMMM dd, yyyy');

  const formatCurrency = (amount) => {
    return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const getPaceColor = (pace) => {
    if (pace > 100) return '#DC2626'; // Red - over budget
    return '#374151'; // Black - at or under budget
  };

  const formatPace = (pace) => {
    return pace.toFixed(0) + '%';
  };

  const formatDate = (date) => {
    return Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMM dd');
  };

  const formatLargeExpensesList = (expenses) => {
    if (expenses.length === 0) {
      return '<p style="color: #9CA3AF; font-style: italic; margin: 0;">None</p>';
    }

    // Sort by amount descending
    const sorted = expenses.sort((a, b) => b.amount - a.amount);

    return sorted.map(exp => {
      const accountInfo = exp.account || exp.accountNumber
        ? `${exp.account || ''}${exp.account && exp.accountNumber ? ' - ' : ''}${exp.accountNumber || ''}`
        : '';

      return `
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
          <div style="flex: 1;">
            <div style="font-weight: 500; color: #374151;">${exp.description || 'No description'}</div>
            <div style="font-size: 12px; color: #9CA3AF; margin-top: 2px;">
              ${formatDate(exp.date)}${accountInfo ? ' • ' + accountInfo : ''}
            </div>
          </div>
          <div style="font-weight: 600; color: #374151; font-size: 16px; white-space: nowrap; margin-left: 16px;">
            ${formatCurrency(exp.amount)}
          </div>
        </div>
      `;
    }).join('');
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          line-height: 1.6;
          color: #1F2937;
          margin: 0;
          padding: 0;
          background-color: #F3F4F6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #FFFFFF;
        }
        .header {
          background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
          color: white;
          padding: 24px 16px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .header p {
          margin: 8px 0 0 0;
          opacity: 0.95;
          font-size: 13px;
        }
        .content {
          padding: 24px 16px;
        }
        .finance-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0;
          background: #FFFFFF;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .finance-table th {
          background-color: #F9FAFB;
          padding: 16px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #E5E7EB;
        }
        .finance-table td {
          padding: 16px 12px;
          border-bottom: 1px solid #F3F4F6;
          font-size: 15px;
        }
        .finance-table tr:last-child td {
          border-bottom: none;
        }
        .row-label {
          font-weight: 500;
          color: #374151;
        }
        .budget-explanation {
          font-size: 11px;
          color: #9CA3AF;
          font-weight: 400;
          margin-top: 4px;
          line-height: 1.4;
        }
        .budget-explanation a {
          color: #667EEA;
          text-decoration: none;
        }
        .budget-explanation a:hover {
          text-decoration: underline;
        }
        .cash-flow-row {
          background-color: #F0F9FF;
          font-weight: 600;
        }
        .cash-flow-row td {
          padding: 18px 12px;
          font-size: 16px;
        }
        .amount {
          text-align: right;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }
        .transaction-count {
          font-size: 11px;
          color: #9CA3AF;
          font-weight: 400;
          display: block;
          margin-top: 4px;
        }
        .large-expenses-section {
          padding: 24px 16px;
          border-top: 1px solid #E5E7EB;
        }
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 16px 0;
        }
        .expense-list {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 0 12px;
        }
        .footer {
          background: #F9FAFB;
          padding: 16px;
          text-align: center;
          font-size: 11px;
          color: #6B7280;
          border-top: 1px solid #E5E7EB;
        }
        @media only screen and (max-width: 480px) {
          .header h1 {
            font-size: 20px;
          }
          .header p {
            font-size: 12px;
          }
          .content {
            padding: 16px 12px;
          }
          .finance-table th,
          .finance-table td {
            padding: 12px 8px;
            font-size: 14px;
          }
          .cash-flow-row td {
            padding: 14px 8px;
            font-size: 15px;
          }
          .transaction-count {
            font-size: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Daily Finance Update</h1>
          <p>${dateStr}</p>
        </div>

        <div class="content">
          <table class="finance-table">
            <thead>
              <tr>
                <th style="width: 35%;">&nbsp;</th>
                <th style="width: 32.5%; text-align: right;">MTD</th>
                <th style="width: 32.5%; text-align: right;">YTD</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="row-label">
                  Variable Budget
                  <div class="budget-explanation">
                    Discretionary budget after mortgage, nanny & other fixed costs (<a href="https://docs.google.com/spreadsheets/d/1rlEQXvB_AkeS9jCTgS-kzkXLkKHP7ZsCwxeOlSlekIY/edit?gid=2132143676#gid=2132143676" target="_blank">view all</a>)
                  </div>
                </td>
                <td class="amount" style="color: #374151;">
                  ${formatCurrency(summary.mtd.variableBudget)}
                </td>
                <td class="amount" style="color: #374151;">
                  ${formatCurrency(summary.ytd.variableBudget)}
                </td>
              </tr>
              <tr>
                <td class="row-label">Actual Spending</td>
                <td class="amount" style="color: #374151;">
                  ${formatCurrency(summary.mtd.actualSpending)}
                </td>
                <td class="amount" style="color: #374151;">
                  ${formatCurrency(summary.ytd.actualSpending)}
                </td>
              </tr>
              <tr>
                <td class="row-label">% Budget Spent</td>
                <td class="amount" style="color: ${getPaceColor(summary.mtd.pace)};">
                  ${formatPace(summary.mtd.pace)}
                </td>
                <td class="amount" style="color: ${getPaceColor(summary.ytd.pace)};">
                  ${formatPace(summary.ytd.pace)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Large Expenses from Yesterday -->
        <div class="large-expenses-section">
          <h2 class="section-title">💸 Large Expenses from Yesterday (> $100)</h2>
          <div class="expense-list">
            ${formatLargeExpensesList(summary.largeExpenses.yesterday)}
          </div>
        </div>

        <!-- Large Expenses from This Month -->
        <div class="large-expenses-section">
          <h2 class="section-title">🔴 Large Expenses This Month (> $1,000)</h2>
          <div class="expense-list">
            ${formatLargeExpensesList(summary.largeExpenses.thisMonth)}
          </div>
        </div>

        <div class="footer">
          <p>Automated daily finance summary from your Google Sheets transaction data</p>
          <p style="margin-top: 4px;">Generated ${dateStr}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}
