/**
 * Gmail Email Filter with Claude AI
 *
 * Automatically filters promotional emails, receipts, and automation summaries
 * using Claude AI for intelligent classification.
 */

/**
 * Main function - Called by time-based trigger
 * Runs every hour from 7am to 4pm Pacific
 */
function filterEmails() {
  try {
    Logger.log('Starting email filter process...');

    // Get unread emails from inbox
    const threads = GmailApp.search('is:unread in:inbox', 0, 50);
    Logger.log(`Found ${threads.length} unread emails`);

    if (threads.length === 0) {
      Logger.log('No unread emails to process');
      return;
    }

    const results = {
      filtered: [],
      notFiltered: [],
      errors: []
    };

    // Process each thread
    for (const thread of threads) {
      const messages = thread.getMessages();

      // Process only the first unread message in each thread
      for (const message of messages) {
        if (message.isUnread()) {
          processEmail(message, results);
          break; // Only process first unread message per thread
        }
      }
    }

    // Send summary email
    sendSummaryEmail(results);

    Logger.log('Email filter process completed');

  } catch (error) {
    Logger.log('Error in filterEmails: ' + error.toString());
    sendErrorEmail(error);
  }
}

/**
 * Process a single email message
 */
function processEmail(message, results) {
  try {
    const sender = message.getFrom();
    const subject = message.getSubject();
    const messageId = message.getId();

    Logger.log(`Processing: ${sender} - ${subject}`);

    // Check if this email was previously reported as "not filtered"
    if (wasReportedAsNotFiltered(messageId)) {
      Logger.log(`Skipping - already reported as not filtered: ${messageId}`);
      return;
    }

    // Get email preview (first 500 characters of body)
    const body = message.getPlainBody();
    const preview = body.substring(0, 500);

    // Classify with Claude
    const classification = classifyEmail(sender, subject, preview, !message.isUnread());

    if (!classification) {
      results.errors.push({ sender, subject, error: 'Classification failed' });
      return;
    }

    // Apply classification
    if (classification.shouldFilter) {
      applyLabel(message, classification.category);
      message.getThread().moveToArchive();

      results.filtered.push({
        sender,
        subject,
        category: classification.category,
        rationale: classification.rationale
      });

      Logger.log(`Filtered to ${classification.category}: ${subject}`);

    } else {
      // Mark as not filtered and track it
      markAsNotFiltered(messageId);

      results.notFiltered.push({
        sender,
        subject
      });

      Logger.log(`Not filtered: ${subject}`);
    }

  } catch (error) {
    Logger.log(`Error processing email: ${error.toString()}`);
    results.errors.push({
      sender: message.getFrom(),
      subject: message.getSubject(),
      error: error.toString()
    });
  }
}

/**
 * Apply Gmail label based on category
 */
function applyLabel(message, category) {
  let labelName;

  switch (category) {
    case 'Promotional Email':
      labelName = 'Promos';
      break;
    case 'Receipt':
      labelName = 'Receipts';
      break;
    case 'Summary Email (Already Read)':
      labelName = 'Automations';
      break;
    default:
      Logger.log(`Unknown category: ${category}`);
      return;
  }

  // Get or create label
  let label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    label = GmailApp.createLabel(labelName);
    Logger.log(`Created new label: ${labelName}`);
  }

  // Apply label to thread
  message.getThread().addLabel(label);
}

/**
 * Send summary email with results
 */
function sendSummaryEmail(results) {
  const { filtered, notFiltered, errors } = results;

  // Don't send email if nothing to report
  if (filtered.length === 0 && notFiltered.length === 0 && errors.length === 0) {
    Logger.log('No emails to report');
    return;
  }

  let emailBody = '';

  // Filtered emails section
  if (filtered.length > 0) {
    // Group by category
    const promos = filtered.filter(e => e.category === 'Promotional Email');
    const receipts = filtered.filter(e => e.category === 'Receipt');
    const summaries = filtered.filter(e => e.category === 'Summary Email (Already Read)');

    let filterSummary = '';
    const parts = [];

    if (promos.length > 0) parts.push(`${promos.length} to Promos`);
    if (receipts.length > 0) parts.push(`${receipts.length} to Receipts`);
    if (summaries.length > 0) parts.push(`${summaries.length} to Automations`);

    filterSummary = parts.join(', ');

    emailBody += `FILTERED EMAILS (${filtered.length} emails moved: ${filterSummary}):\n`;
    emailBody += '======================================================================\n\n';

    filtered.forEach((email, index) => {
      emailBody += `${index + 1}. Sender: ${email.sender}\n`;
      emailBody += `   Subject: ${email.subject}\n`;
      emailBody += `   Folder: ${getFolderName(email.category)}\n`;
      emailBody += `   Rationale: ${email.rationale}\n\n`;
    });
  }

  // Not filtered emails section
  if (notFiltered.length > 0) {
    if (emailBody) emailBody += '\n';

    emailBody += `NOT FILTERED EMAILS (${notFiltered.length} emails remained in inbox):\n`;
    emailBody += '======================================================================\n\n';

    notFiltered.forEach((email, index) => {
      emailBody += `${index + 1}. Sender: ${email.sender}\n`;
      emailBody += `   Subject: ${email.subject}\n\n`;
    });
  }

  // Errors section (if any)
  if (errors.length > 0) {
    if (emailBody) emailBody += '\n';

    emailBody += `ERRORS (${errors.length} emails had processing errors):\n`;
    emailBody += '======================================================================\n\n';

    errors.forEach((email, index) => {
      emailBody += `${index + 1}. Sender: ${email.sender}\n`;
      emailBody += `   Subject: ${email.subject}\n`;
      emailBody += `   Error: ${email.error}\n\n`;
    });
  }

  // Get current timestamp in Pacific time
  const now = new Date();
  const pacificTime = Utilities.formatDate(now, 'America/Los_Angeles', 'MMM dd, yyyy h:mm a z');

  // Send email to self
  const userEmail = Session.getActiveUser().getEmail();
  GmailApp.sendEmail(
    userEmail,
    `Email Filter Summary - ${pacificTime}`,
    emailBody
  );

  Logger.log('Summary email sent');
}

/**
 * Send error notification email
 */
function sendErrorEmail(error) {
  const userEmail = Session.getActiveUser().getEmail();
  const errorMessage = `
Error in Email Filter Script
==============================

Time: ${new Date()}
Error: ${error.toString()}
Stack: ${error.stack || 'N/A'}

Please check the Apps Script logs for more details.
`;

  GmailApp.sendEmail(
    userEmail,
    'Email Filter Script Error',
    errorMessage
  );
}

/**
 * Setup function - Run once to create triggers
 */
function setupTriggers() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  // Create hourly triggers from 7am to 4pm Pacific
  for (let hour = 7; hour <= 16; hour++) {
    ScriptApp.newTrigger('filterEmails')
      .timeBased()
      .atHour(hour)
      .everyDays(1)
      .inTimezone('America/Los_Angeles')
      .create();
  }

  Logger.log('Triggers created successfully');
  Logger.log('Email filter will run every hour from 7am to 4pm Pacific time');
}

/**
 * Remove all triggers - Run this to stop the automation
 */
function removeTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  Logger.log('All triggers removed');
}
