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
  sheetName: 'Filtered Transactions',

  // Your email address to receive the daily update
  recipientEmail: 'christophermanueldyer@gmail.com,amandastephaniedyer@gmail.com,finance.dyerclaw@gmail.com',

  // Budget configuration - cell reference for your monthly variable budget
  // Example: 'Budget!B5' means cell B5 in the 'Budget' sheet tab
  variableBudgetCell: 'Variable Budget for Email!B17',

  // Cash balance tracking
  cashBalanceCell: 'Balances!D9',  // Current total cash balance
  cashHistorySheet: 'Cash Balance Trend',  // Sheet to log daily balances and MTD spending

  // Investment account tracking
  balancesSheet: 'Balances',  // Sheet name containing account balances
  balancesAccountNameColumn: 'B',  // Column containing account names with numbers like "Stock Plan (ROKU) -9940 (9940)"
  balancesBalanceColumn: 'D',  // Column containing balance values
  balancesStartRow: 10,  // First row to start searching for accounts
  investmentAccounts: [
    { name: 'Stock Plan (ROKU)', accountNumber: '9940' },
    { name: 'SoFi Robo', accountNumber: '5831' },
    { name: 'Vested Stock', nameSearch: 'Vested Stock' },
    { name: 'Cash (4649)', accountNumber: '4649', display: false }
  ],
  investmentHistorySheet: 'Investment Balance Trend',  // Sheet to log daily investment balances

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
    // Log today's balances first
    logDailyCashBalance();
    logDailyInvestmentBalances();

    const variableBudget = getVariableBudget();
    const data = getTransactionData();
    const summary = calculateFinancialSummary(data, variableBudget);

    // Log today's MTD spending for tomorrow's comparison
    logDailySpending(summary.mtd.actualSpending);

    const cashHistory = getCashBalanceHistory();
    const investmentBalances = getInvestmentBalances();
    const emailBody = formatEmailBody(summary, cashHistory, investmentBalances);

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
 * Find account balance in the Balances sheet.
 * Supports two lookup modes:
 *   - accountNumber: searches for "(XXXX)" pattern in account name column
 *   - nameSearch: searches for a substring in account name column
 */
function getAccountBalance(ss, account) {
  const balancesSheet = ss.getSheetByName(CONFIG.balancesSheet);
  if (!balancesSheet) {
    throw new Error(`Balances sheet "${CONFIG.balancesSheet}" not found`);
  }

  const dataRange = balancesSheet.getDataRange();
  const values = dataRange.getValues();

  const searchPattern = account.accountNumber
    ? `(${account.accountNumber})`
    : account.nameSearch;

  const accountNameCol = CONFIG.balancesAccountNameColumn.charCodeAt(0) - 65;
  const balanceCol = CONFIG.balancesBalanceColumn.charCodeAt(0) - 65;

  for (let i = CONFIG.balancesStartRow - 1; i < values.length; i++) {
    const cellAccountName = String(values[i][accountNameCol]).trim();

    if (cellAccountName.includes(searchPattern)) {
      const balance = parseFloat(values[i][balanceCol]);
      return isNaN(balance) ? 0 : balance;
    }
  }

  Logger.log(`Warning: Account "${searchPattern}" not found in Balances sheet`);
  return 0;
}

/**
 * Log today's cash balance to the history sheet
 */
function logDailyCashBalance() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    // Get current total balance from D9
    const totalBalanceRange = ss.getRange(CONFIG.cashBalanceCell);
    const totalBalance = parseFloat(totalBalanceRange.getValue());

    if (isNaN(totalBalance)) {
      throw new Error(`Cash balance cell "${CONFIG.cashBalanceCell}" does not contain a valid number`);
    }

    // Subtract investment account balances to get cash-only balance
    let cashBalance = totalBalance;
    CONFIG.investmentAccounts.forEach(account => {
      const investmentValue = getAccountBalance(ss, account);
      cashBalance -= investmentValue;
    });

    // Get the history sheet
    const historySheet = ss.getSheetByName(CONFIG.cashHistorySheet);
    if (!historySheet) {
      throw new Error(`History sheet "${CONFIG.cashHistorySheet}" not found`);
    }

    // Get today's date (formatted as date only, no time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if today's date already exists
    const dataRange = historySheet.getDataRange();
    const values = dataRange.getValues();

    // Skip header row, check if today already logged
    for (let i = 1; i < values.length; i++) {
      const rowDate = new Date(values[i][0]);
      rowDate.setHours(0, 0, 0, 0);

      if (rowDate.getTime() === today.getTime()) {
        // Already logged today, update the balance instead of adding new row
        historySheet.getRange(i + 1, 2).setValue(cashBalance);
        Logger.log(`Updated cash balance for ${today.toDateString()}: ${cashBalance}`);
        return;
      }
    }

    // Not logged yet, append new row
    historySheet.appendRow([today, cashBalance]);
    Logger.log(`Logged new cash balance for ${today.toDateString()}: ${cashBalance}`);

  } catch (error) {
    Logger.log('Error logging cash balance: ' + error.toString());
    // Don't throw - we don't want to break the email if logging fails
  }
}

/**
 * Log today's investment balances to the history sheet
 */
function logDailyInvestmentBalances() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    // Get or create the history sheet
    let historySheet = ss.getSheetByName(CONFIG.investmentHistorySheet);
    if (!historySheet) {
      historySheet = ss.insertSheet(CONFIG.investmentHistorySheet);
      // Add headers: Date, then one column per account
      const headers = ['Date'].concat(CONFIG.investmentAccounts.filter(a => a.display !== false).map(a => a.name));
      historySheet.appendRow(headers);
    }

    // Read current balances for each displayed account
    const balances = CONFIG.investmentAccounts.filter(a => a.display !== false).map(account => {
      return getAccountBalance(ss, account);
    });

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if today's date already exists
    const dataRange = historySheet.getDataRange();
    const values = dataRange.getValues();

    for (let i = 1; i < values.length; i++) {
      const rowDate = new Date(values[i][0]);
      rowDate.setHours(0, 0, 0, 0);

      if (rowDate.getTime() === today.getTime()) {
        // Already logged today, update balances
        for (let j = 0; j < balances.length; j++) {
          historySheet.getRange(i + 1, j + 2).setValue(balances[j]);
        }
        Logger.log('Updated investment balances for ' + today.toDateString());
        return;
      }
    }

    // Not logged yet, append new row
    historySheet.appendRow([today].concat(balances));
    Logger.log('Logged new investment balances for ' + today.toDateString());

  } catch (error) {
    Logger.log('Error logging investment balances: ' + error.toString());
  }
}

/**
 * Get current investment balances and day-over-day change
 */
function getInvestmentBalances() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const historySheet = ss.getSheetByName(CONFIG.investmentHistorySheet);

  // Read current balances (only display accounts)
  const accounts = CONFIG.investmentAccounts.filter(a => a.display !== false).map(account => {
    return {
      name: account.name,
      accountNumber: account.accountNumber || account.nameSearch,
      balance: getAccountBalance(ss, account),
      dayOverDayPct: null
    };
  });

  // Calculate day-over-day change from history sheet
  if (historySheet) {
    const dataRange = historySheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length >= 3) {  // Header + at least 2 days of data
      // Get the two most recent rows
      const latestRow = values[values.length - 1];
      const previousRow = values[values.length - 2];

      for (let i = 0; i < accounts.length; i++) {
        const currentVal = parseFloat(latestRow[i + 1]);
        const previousVal = parseFloat(previousRow[i + 1]);

        if (!isNaN(currentVal) && !isNaN(previousVal) && previousVal !== 0) {
          accounts[i].dayOverDayPct = ((currentVal - previousVal) / Math.abs(previousVal)) * 100;
        }
      }
    }
  }

  return accounts;
}

/**
 * Log today's MTD spending to the Cash Balance Trend sheet (column C)
 */
function logDailySpending(mtdSpending) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    const historySheet = ss.getSheetByName(CONFIG.cashHistorySheet);
    if (!historySheet) {
      throw new Error(`History sheet "${CONFIG.cashHistorySheet}" not found`);
    }

    // Check if we need to add the MTD Spending header in column C
    const headerRange = historySheet.getRange(1, 3);
    if (!headerRange.getValue()) {
      headerRange.setValue('MTD Spending');
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if today's date already exists in column A
    const dataRange = historySheet.getDataRange();
    const values = dataRange.getValues();

    for (let i = 1; i < values.length; i++) {
      const rowDate = new Date(values[i][0]);
      rowDate.setHours(0, 0, 0, 0);

      if (rowDate.getTime() === today.getTime()) {
        // Already logged today, update the spending in column C
        historySheet.getRange(i + 1, 3).setValue(mtdSpending);
        Logger.log('Updated MTD spending for ' + today.toDateString() + ': ' + mtdSpending);
        return;
      }
    }

    Logger.log('Warning: No cash balance entry found for today. MTD spending not logged.');

  } catch (error) {
    Logger.log('Error logging MTD spending: ' + error.toString());
  }
}

/**
 * Get yesterday's MTD spending from Cash Balance Trend sheet (column C)
 */
function getYesterdaySpending() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const historySheet = ss.getSheetByName(CONFIG.cashHistorySheet);

  if (!historySheet) {
    return null;
  }

  const dataRange = historySheet.getDataRange();
  const values = dataRange.getValues();

  if (values.length < 2) {
    return null;
  }

  // Get yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  // Search for yesterday's spending in column C
  for (let i = 1; i < values.length; i++) {
    const rowDate = new Date(values[i][0]);
    rowDate.setHours(0, 0, 0, 0);

    if (rowDate.getTime() === yesterday.getTime()) {
      const spending = parseFloat(values[i][2]);  // Column C (index 2)
      return isNaN(spending) ? null : spending;
    }
  }

  return null;
}

/**
 * Get cash balance history for the last 90 days
 */
function getCashBalanceHistory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const historySheet = ss.getSheetByName(CONFIG.cashHistorySheet);

  if (!historySheet) {
    Logger.log('Cash balance history sheet not found, skipping chart');
    return null;
  }

  const dataRange = historySheet.getDataRange();
  const values = dataRange.getValues();

  if (values.length < 2) {
    Logger.log('Not enough cash balance history data');
    return null;
  }

  // Parse data (skip header row)
  const history = [];
  for (let i = 1; i < values.length; i++) {
    const date = new Date(values[i][0]);
    const balance = parseFloat(values[i][1]);

    if (!isNaN(date.getTime()) && !isNaN(balance)) {
      history.push({ date: date, balance: balance });
    }
  }

  // Sort by date ascending
  history.sort((a, b) => a.date - b.date);

  // Get last 90 days
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));

  const last90Days = history.filter(item => item.date >= ninetyDaysAgo);

  return last90Days.length > 0 ? last90Days : null;
}

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

  // Last 3 days (72 hours)
  const threeDaysAgo = new Date(currentYear, currentMonth, currentDay - 3);
  const threeDaysAgoStart = new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate());

  // Days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Yesterday's date boundaries (for spending change calculation)
  const yesterday = new Date(currentYear, currentMonth, currentDay - 1);
  const yesterdayDay = yesterday.getDate();

  // Get yesterday's logged MTD spending from history
  const yesterdayMtdSpending = getYesterdaySpending();

  const summary = {
    mtd: {
      variableBudget: monthlyVariableBudget,
      actualSpending: 0,
      yesterdaySpending: yesterdayMtdSpending,  // Yesterday's logged MTD spending from email
      pace: 0,
      pacingTarget: (yesterdayDay / daysInMonth) * 100  // How far through the month we are
    },
    ytd: {
      variableBudget: monthlyVariableBudget * currentMonth + (currentDay / daysInMonth) * monthlyVariableBudget,  // Completed months + prorated current month
      actualSpending: 0,
      pace: 0
    },
    largeExpenses: {
      last3Days: [],  // Expenses > $100 from last 3 days
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

    // Track large expenses from last 3 days (> $100)
    if (!isIncome && t.date >= threeDaysAgoStart) {
      const absAmount = Math.abs(t.amount);
      if (absAmount > 100) {
        summary.largeExpenses.last3Days.push({
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

  // Calculate spending change since yesterday (from logged history)
  if (summary.mtd.yesterdaySpending !== null) {
    summary.mtd.spendingChange = summary.mtd.actualSpending - summary.mtd.yesterdaySpending;
  } else {
    summary.mtd.spendingChange = null;  // No history yet
  }

  // Calculate MTD % Budget Spent: (Actual / Budget) x 100
  summary.mtd.pace = summary.mtd.variableBudget > 0 ? (summary.mtd.actualSpending / summary.mtd.variableBudget) * 100 : 0;

  // Calculate YTD % Budget Spent: (Actual / Budget) x 100
  summary.ytd.pace = summary.ytd.variableBudget > 0 ? (summary.ytd.actualSpending / summary.ytd.variableBudget) * 100 : 0;

  return summary;
}

/**
 * Format the email body with financial summary as a mobile-friendly table
 */
function formatEmailBody(summary, cashHistory, investmentBalances) {
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

  const buildCashBalanceChart = (history) => {
    if (!history || history.length === 0) {
      return '';
    }

    // Find min/max for smart Y-axis range
    const balances = history.map(h => h.balance);
    const minBalance = Math.min(...balances);
    const maxBalance = Math.max(...balances);

    // Round to nearest $5k and add padding
    const yMin = Math.floor(minBalance / 5000) * 5000;
    const yMax = Math.ceil(maxBalance / 5000) * 5000;

    // Format dates and balances for chart
    const labels = history.map(h => Utilities.formatDate(h.date, Session.getScriptTimeZone(), 'M/d'));
    const data = history.map(h => h.balance);

    // Build QuickChart URL
    const chartConfig = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cash Balance',
          data: data,
          borderColor: '#667EEA',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: false
          }
        },
        scales: {
          y: {
            min: yMin,
            max: yMax,
            ticks: {
              stepSize: 5000,
              callback: function(value) {
                return '$' + value.toLocaleString('en-US');
              }
            },
            grid: {
              color: '#E5E7EB'
            }
          },
          x: {
            ticks: {
              maxTicksLimit: 10
            },
            grid: {
              display: false
            }
          }
        }
      }
    };

    const chartUrl = 'https://quickchart.io/chart?c=' + encodeURIComponent(JSON.stringify(chartConfig)) + '&width=500&height=200&devicePixelRatio=1';

    return `
      <div class="chart-section">
        <h2 class="section-title">📈 Cash Balance Trend (Last 90 Days)</h2>
        <div class="chart-container">
          <img src="${chartUrl}" alt="Cash Balance Trend" style="max-width: 100%; height: auto; border-radius: 8px;">
          <div class="chart-caption">
            Current: ${formatCurrency(data[data.length - 1])} - Low: ${formatCurrency(minBalance)} - High: ${formatCurrency(maxBalance)}
          </div>
        </div>
      </div>
    `;
  };

  const buildInvestmentBalancesTable = (investmentBalances) => {
    if (!investmentBalances || investmentBalances.length === 0) {
      return '';
    }

    const rows = investmentBalances.map(account => {
      let changeDisplay = '--';
      let changeColor = '#9CA3AF';

      if (account.dayOverDayPct !== null) {
        const sign = account.dayOverDayPct >= 0 ? '+' : '';
        changeDisplay = sign + account.dayOverDayPct.toFixed(2) + '%';
        changeColor = account.dayOverDayPct >= 0 ? '#059669' : '#DC2626';
      }

      return `
        <tr>
          <td class="row-label">
            ${account.name}
            <div class="budget-explanation">${account.accountNumber}</div>
          </td>
          <td class="amount" style="color: #374151;">
            ${formatCurrency(account.balance)}
          </td>
          <td class="amount" style="color: ${changeColor};">
            ${changeDisplay}
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="chart-section">
        <h2 class="section-title">📊 Investment Balances</h2>
        <table class="finance-table">
          <thead>
            <tr>
              <th style="width: 40%;">Account</th>
              <th style="width: 30%; text-align: right;">Balance</th>
              <th style="width: 30%; text-align: right;">Day / Day</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  };

  const formatLargeExpensesList = (expenses) => {
    if (expenses.length === 0) {
      return '<p style="color: #9CA3AF; font-style: italic; margin: 0;">None</p>';
    }

    // Sort by date descending (most recent first)
    const sorted = expenses.sort((a, b) => b.date - a.date);

    return sorted.map(exp => {
      const accountInfo = exp.account || exp.accountNumber
        ? `${exp.account || ''}${exp.account && exp.accountNumber ? ' - ' : ''}${exp.accountNumber || ''}`
        : '';

      return `
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
          <div style="flex: 1;">
            <div style="font-weight: 500; color: #374151;">${exp.description || 'No description'}</div>
            <div style="font-size: 12px; color: #9CA3AF; margin-top: 2px;">
              ${formatDate(exp.date)}${accountInfo ? ' - ' + accountInfo : ''}
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
        .chart-section {
          padding: 24px 16px;
          border-top: 1px solid #E5E7EB;
        }
        .chart-container {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }
        .chart-caption {
          margin-top: 12px;
          font-size: 12px;
          color: #6B7280;
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
                    Discretionary budget after mortgage, nanny &amp; other fixed costs (<a href="https://docs.google.com/spreadsheets/d/1rlEQXvB_AkeS9jCTgS-kzkXLkKHP7ZsCwxeOlSlekIY/edit?gid=2132143676#gid=2132143676" target="_blank">view all</a>)
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
                <td class="row-label">
                  Actual Spending
                  <div class="budget-explanation">
                    ${summary.mtd.spendingChange !== null ? '+' + formatCurrency(summary.mtd.spendingChange) + ' since yesterday' : 'Building history...'}
                  </div>
                </td>
                <td class="amount" style="color: #374151;">
                  ${formatCurrency(summary.mtd.actualSpending)}
                </td>
                <td class="amount" style="color: #374151;">
                  ${formatCurrency(summary.ytd.actualSpending)}
                </td>
              </tr>
              <tr>
                <td class="row-label">
                  % Budget Spent
                  <div class="budget-explanation">
                    MTD pacing target: ${formatPace(summary.mtd.pacingTarget)}
                  </div>
                </td>
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

        <!-- Cash Balance Chart -->
        ${buildCashBalanceChart(cashHistory)}

        <!-- Investment Balances -->
        ${buildInvestmentBalancesTable(investmentBalances)}

        <!-- Large Expenses from Last 3 Days -->
        <div class="large-expenses-section">
          <h2 class="section-title">💸 Large Expenses from Last 3 Days (&gt; $100)</h2>
          <div class="expense-list">
            ${formatLargeExpensesList(summary.largeExpenses.last3Days)}
          </div>
        </div>

        <!-- Large Expenses from This Month -->
        <div class="large-expenses-section">
          <h2 class="section-title">🔴 Large Expenses This Month (&gt; $1,000)</h2>
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
