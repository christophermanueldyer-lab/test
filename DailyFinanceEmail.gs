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

  // Column names in your Google Sheet (update if your columns are named differently)
  columns: {
    date: 'Date',           // Column with transaction date
    amount: 'Amount',       // Column with transaction amount
    type: 'Type',           // Column indicating 'Income' or 'Expense'
    description: 'Description' // Optional: transaction description
  },

  // Time to send daily email (24-hour format)
  emailTime: {
    hour: 8,    // 8 AM
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
  const typeCol = headers.indexOf(CONFIG.columns.type);

  if (dateCol === -1 || amountCol === -1 || typeCol === -1) {
    throw new Error('Required columns not found. Please check CONFIG.columns settings');
  }

  // Parse transactions (skip header row)
  const transactions = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const date = new Date(row[dateCol]);
    const amount = parseFloat(row[amountCol]);
    const type = String(row[typeCol]).trim().toLowerCase();

    // Skip invalid rows
    if (isNaN(date.getTime()) || isNaN(amount)) {
      continue;
    }

    transactions.push({
      date: date,
      amount: amount,
      type: type,
      isIncome: type === 'income' || amount > 0,
      isExpense: type === 'expense' || amount < 0
    });
  }

  return transactions;
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
    const absAmount = Math.abs(t.amount);

    // Determine if income or expense
    const isIncome = t.isIncome || (t.type.includes('income') || t.type.includes('deposit'));

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
 * Format the email body with financial summary
 */
function formatEmailBody(summary) {
  const now = new Date();
  const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'EEEE, MMMM dd, yyyy');
  const monthName = Utilities.formatDate(now, Session.getScriptTimeZone(), 'MMMM yyyy');
  const yearName = now.getFullYear();

  const formatCurrency = (amount) => {
    return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const getColorStyle = (amount) => {
    if (amount > 0) return 'color: #059669; font-weight: bold;'; // Green
    if (amount < 0) return 'color: #DC2626; font-weight: bold;'; // Red
    return 'color: #6B7280;'; // Gray
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          line-height: 1.6;
          color: #1F2937;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
          color: white;
          padding: 30px 20px;
          border-radius: 12px 12px 0 0;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 5px 0 0 0;
          opacity: 0.9;
          font-size: 14px;
        }
        .content {
          background: #FFFFFF;
          padding: 30px 20px;
          border: 1px solid #E5E7EB;
          border-top: none;
        }
        .section {
          margin-bottom: 35px;
        }
        .section:last-child {
          margin-bottom: 0;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #E5E7EB;
        }
        .metric-grid {
          display: table;
          width: 100%;
          border-collapse: collapse;
        }
        .metric-row {
          display: table-row;
        }
        .metric-label {
          display: table-cell;
          padding: 12px 0;
          font-size: 14px;
          color: #6B7280;
          width: 50%;
        }
        .metric-value {
          display: table-cell;
          padding: 12px 0;
          text-align: right;
          font-size: 18px;
          font-weight: 600;
        }
        .divider {
          height: 1px;
          background: #E5E7EB;
          margin: 15px 0;
        }
        .net-cash-flow {
          background: #F9FAFB;
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
        }
        .footer {
          background: #F9FAFB;
          padding: 20px;
          border-radius: 0 0 12px 12px;
          border: 1px solid #E5E7EB;
          border-top: none;
          text-align: center;
          font-size: 12px;
          color: #6B7280;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>💰 Daily Finance Update</h1>
        <p>${dateStr}</p>
      </div>

      <div class="content">
        <!-- MONTH TO DATE -->
        <div class="section">
          <div class="section-title">📊 Month to Date (${monthName})</div>
          <div class="metric-grid">
            <div class="metric-row">
              <div class="metric-label">Income</div>
              <div class="metric-value" style="color: #059669;">
                ${formatCurrency(summary.mtd.income)}
              </div>
            </div>
            <div class="metric-row">
              <div class="metric-label">
                <span style="color: #9CA3AF; font-size: 12px;">
                  (${summary.transactionCount.mtd.income} transactions)
                </span>
              </div>
              <div class="metric-value"></div>
            </div>
            <div class="metric-row">
              <div class="metric-label">Expenses</div>
              <div class="metric-value" style="color: #DC2626;">
                ${formatCurrency(summary.mtd.expenses)}
              </div>
            </div>
            <div class="metric-row">
              <div class="metric-label">
                <span style="color: #9CA3AF; font-size: 12px;">
                  (${summary.transactionCount.mtd.expenses} transactions)
                </span>
              </div>
              <div class="metric-value"></div>
            </div>
          </div>

          <div class="net-cash-flow">
            <div class="metric-grid">
              <div class="metric-row">
                <div class="metric-label" style="font-weight: 600; color: #374151;">
                  Net Cash Flow
                </div>
                <div class="metric-value" style="${getColorStyle(summary.mtd.netCashFlow)} font-size: 22px;">
                  ${formatCurrency(summary.mtd.netCashFlow)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <!-- YEAR TO DATE -->
        <div class="section">
          <div class="section-title">📈 Year to Date (${yearName})</div>
          <div class="metric-grid">
            <div class="metric-row">
              <div class="metric-label">Income</div>
              <div class="metric-value" style="color: #059669;">
                ${formatCurrency(summary.ytd.income)}
              </div>
            </div>
            <div class="metric-row">
              <div class="metric-label">
                <span style="color: #9CA3AF; font-size: 12px;">
                  (${summary.transactionCount.ytd.income} transactions)
                </span>
              </div>
              <div class="metric-value"></div>
            </div>
            <div class="metric-row">
              <div class="metric-label">Expenses</div>
              <div class="metric-value" style="color: #DC2626;">
                ${formatCurrency(summary.ytd.expenses)}
              </div>
            </div>
            <div class="metric-row">
              <div class="metric-label">
                <span style="color: #9CA3AF; font-size: 12px;">
                  (${summary.transactionCount.ytd.expenses} transactions)
                </span>
              </div>
              <div class="metric-value"></div>
            </div>
          </div>

          <div class="net-cash-flow">
            <div class="metric-grid">
              <div class="metric-row">
                <div class="metric-label" style="font-weight: 600; color: #374151;">
                  Net Cash Flow
                </div>
                <div class="metric-value" style="${getColorStyle(summary.ytd.netCashFlow)} font-size: 22px;">
                  ${formatCurrency(summary.ytd.netCashFlow)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>This is an automated daily finance summary from your Google Sheets transaction data.</p>
        <p style="margin-top: 5px;">Generated on ${dateStr}</p>
      </div>
    </body>
    </html>
  `;

  return html;
}
