/**
 * Generate a spending breakdown by category for March and April
 * Run this function in Apps Script to see the results in the logs
 */
function generateCategoryBreakdown() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Filtered Transactions');

  if (!sheet) {
    Logger.log('Error: "Filtered Transactions" sheet not found');
    return;
  }

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  if (values.length < 2) {
    Logger.log('Error: No transaction data found');
    return;
  }

  // Find column indices
  const headers = values[0];
  const dateCol = headers.indexOf('Date');
  const amountCol = headers.indexOf('Amount');
  const categoryCol = headers.indexOf(headers[15]); // Column P is index 15
  const typeCol = headers.indexOf('Income Or Expense');

  Logger.log('Category column header: ' + headers[15]);

  if (dateCol === -1 || amountCol === -1 || categoryCol === -1 || typeCol === -1) {
    Logger.log('Error: Required columns not found');
    Logger.log('Date col: ' + dateCol + ', Amount col: ' + amountCol + ', Category col: ' + categoryCol + ', Type col: ' + typeCol);
    return;
  }

  // Initialize breakdown object
  const breakdown = {
    march: {},
    april: {}
  };

  // Process transactions
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const date = new Date(row[dateCol]);
    const amount = parseFloat(row[amountCol]);
    const category = String(row[categoryCol] || 'Uncategorized').trim();
    const type = String(row[typeCol]).trim().toLowerCase();

    // Skip invalid rows or income
    if (isNaN(date.getTime()) || isNaN(amount) || type !== 'expense') {
      continue;
    }

    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed

    // Only process March (month 2) and April (month 3) of 2026
    if (year === 2026) {
      let monthKey = null;
      if (month === 2) monthKey = 'march';
      if (month === 3) monthKey = 'april';

      if (monthKey) {
        if (!breakdown[monthKey][category]) {
          breakdown[monthKey][category] = 0;
        }
        breakdown[monthKey][category] += Math.abs(amount);
      }
    }
  }

  // Get all unique categories
  const allCategories = new Set([
    ...Object.keys(breakdown.march),
    ...Object.keys(breakdown.april)
  ]);

  // Sort categories alphabetically
  const sortedCategories = Array.from(allCategories).sort();

  // Generate table output
  Logger.log('\n=== SPENDING BREAKDOWN BY CATEGORY ===\n');
  Logger.log(padRight('Category', 30) + padLeft('March', 15) + padLeft('April', 15));
  Logger.log('-'.repeat(60));

  let marchTotal = 0;
  let aprilTotal = 0;

  for (const category of sortedCategories) {
    const marchAmount = breakdown.march[category] || 0;
    const aprilAmount = breakdown.april[category] || 0;

    marchTotal += marchAmount;
    aprilTotal += aprilAmount;

    Logger.log(
      padRight(category, 30) +
      padLeft(formatCurrency(marchAmount), 15) +
      padLeft(formatCurrency(aprilAmount), 15)
    );
  }

  Logger.log('-'.repeat(60));
  Logger.log(
    padRight('TOTAL', 30) +
    padLeft(formatCurrency(marchTotal), 15) +
    padLeft(formatCurrency(aprilTotal), 15)
  );

  Logger.log('\n');
}

/**
 * Helper function to format currency
 */
function formatCurrency(amount) {
  if (amount === 0) return '$0.00';
  return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Helper function to pad string to the right
 */
function padRight(str, length) {
  str = String(str);
  while (str.length < length) {
    str += ' ';
  }
  return str;
}

/**
 * Helper function to pad string to the left
 */
function padLeft(str, length) {
  str = String(str);
  while (str.length < length) {
    str = ' ' + str;
  }
  return str;
}
