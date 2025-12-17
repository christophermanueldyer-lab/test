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

  // Column names in your Google Sheet
  columns: {
    date: 'Date',
    amount: 'Amount',
    incomeOrExpense: 'Income Or Expense',
    description: 'Description'
  },

  // Keywords to detect refunds (which should be treated as expenses, not income)
  refundKeywords: [
    'refund',
    'return',
    'reversal',
    'credit adjustment',
    'chargeback',
    'reimbursement'
  ],

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
    const data = getTransactionData();
    const summary = calculateFinancialSummary(data);
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
  const amountCol = headers.indexOf(CONFIG.columns.amount);
  const typeCol = headers.indexOf(CONFIG.columns.incomeOrExpense);
  const descCol = headers.indexOf(CONFIG.columns.description);

  if (dateCol === -1 || amountCol === -1) {
    throw new Error('Required columns (Date, Amount) not found. Please check CONFIG.columns settings');
  }

  // Parse transactions (skip header row)
  const transactions = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const date = new Date(row[dateCol]);
    const amount = parseFloat(row[amountCol]);
    const type = typeCol !== -1 ? String(row[typeCol]).trim().toLowerCase() : '';
    const description = descCol !== -1 ? String(row[descCol]).trim().toLowerCase() : '';

    // Skip invalid rows
    if (isNaN(date.getTime()) || isNaN(amount)) {
      continue;
    }

    transactions.push({
      date: date,
      amount: amount,
      type: type,
      description: description
    });
  }

  return transactions;
}

/**
 * Detect if a transaction is a refund based on description
 */
function isRefund(description) {
  const lowerDesc = description.toLowerCase();
  return CONFIG.refundKeywords.some(keyword => lowerDesc.includes(keyword));
}

/**
 * Calculate MTD and YTD financial summary
 */
function calculateFinancialSummary(transactions) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Start of current month
  const monthStart = new Date(currentYear, currentMonth, 1);

  // Start of current year
  const yearStart = new Date(currentYear, 0, 1);

  const summary = {
    mtd: { income: 0, expenses: 0, netCashFlow: 0 },
    ytd: { income: 0, expenses: 0, netCashFlow: 0 },
    transactionCount: {
      mtd: { income: 0, expenses: 0 },
      ytd: { income: 0, expenses: 0 }
    }
  };

  transactions.forEach(t => {
    // Determine if income or expense with improved refund detection
    let isIncome;

    // Check if it's a refund first (overrides positive amount)
    if (isRefund(t.description)) {
      // Refunds are expenses (returning money) even if positive amount
      isIncome = false;
    } else if (t.type) {
      // Use the Income Or Expense column if available
      isIncome = t.type.includes('income');
    } else {
      // Fallback to amount sign
      isIncome = t.amount > 0;
    }

    const absAmount = Math.abs(t.amount);

    // Year-to-Date calculations
    if (t.date >= yearStart) {
      if (isIncome) {
        summary.ytd.income += absAmount;
        summary.transactionCount.ytd.income++;
      } else {
        summary.ytd.expenses += absAmount;
        summary.transactionCount.ytd.expenses++;
      }
    }

    // Month-to-Date calculations
    if (t.date >= monthStart) {
      if (isIncome) {
        summary.mtd.income += absAmount;
        summary.transactionCount.mtd.income++;
      } else {
        summary.mtd.expenses += absAmount;
        summary.transactionCount.mtd.expenses++;
      }
    }
  });

  // Calculate net cash flow
  summary.mtd.netCashFlow = summary.mtd.income - summary.mtd.expenses;
  summary.ytd.netCashFlow = summary.ytd.income - summary.ytd.expenses;

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

  const getColor = (amount) => {
    if (amount > 0) return '#059669'; // Green
    if (amount < 0) return '#DC2626'; // Red
    return '#6B7280'; // Gray
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
              <tr class="cash-flow-row">
                <td class="row-label">Cash Flow</td>
                <td class="amount" style="color: ${getColor(summary.mtd.netCashFlow)};">
                  ${formatCurrency(summary.mtd.netCashFlow)}
                </td>
                <td class="amount" style="color: ${getColor(summary.ytd.netCashFlow)};">
                  ${formatCurrency(summary.ytd.netCashFlow)}
                </td>
              </tr>
              <tr>
                <td class="row-label">Income</td>
                <td class="amount" style="color: #059669;">
                  ${formatCurrency(summary.mtd.income)}
                  <span class="transaction-count">${summary.transactionCount.mtd.income} transactions</span>
                </td>
                <td class="amount" style="color: #059669;">
                  ${formatCurrency(summary.ytd.income)}
                  <span class="transaction-count">${summary.transactionCount.ytd.income} transactions</span>
                </td>
              </tr>
              <tr>
                <td class="row-label">Expenses</td>
                <td class="amount" style="color: #DC2626;">
                  ${formatCurrency(summary.mtd.expenses)}
                  <span class="transaction-count">${summary.transactionCount.mtd.expenses} transactions</span>
                </td>
                <td class="amount" style="color: #DC2626;">
                  ${formatCurrency(summary.ytd.expenses)}
                  <span class="transaction-count">${summary.transactionCount.ytd.expenses} transactions</span>
                </td>
              </tr>
            </tbody>
          </table>
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
