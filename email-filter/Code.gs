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

    const results = {
      filtered: [],
      notFiltered: [],
      errors: []
    };

    // Get unread emails from inbox
    const unreadThreads = GmailApp.search('is:unread in:inbox', 0, 50);
    Logger.log(`Found ${unreadThreads.length} unread emails`);

    // Process unread emails
    for (const thread of unreadThreads) {
      const messages = thread.getMessages();

      // Process only the first unread message in each thread
      for (const message of messages) {
        if (message.isUnread()) {
          processEmail(message, results);
          break; // Only process first unread message per thread
        }
      }
    }

    // Also search for READ automation summary emails still in inbox
    const readSummaryThreads = GmailApp.search('is:read in:inbox subject:"Email Filter Summary"', 0, 20);
    Logger.log(`Found ${readSummaryThreads.length} read automation summaries in inbox`);

    // Process read automation summaries
    for (const thread of readSummaryThreads) {
      const messages = thread.getMessages();

      // Process the most recent message in the thread
      if (messages.length > 0) {
        const message = messages[messages.length - 1];
        if (!message.isUnread()) {
          processEmail(message, results, true); // Pass true to indicate this is a read summary
        }
      }
    }

    // Also search for READ "Daily Finance Update" emails still in inbox
    const readFinanceThreads = GmailApp.search('is:read in:inbox subject:"Daily Finance Update"', 0, 20);
    Logger.log(`Found ${readFinanceThreads.length} read Daily Finance Update emails in inbox`);

    // Process read finance updates
    for (const thread of readFinanceThreads) {
      const messages = thread.getMessages();

      // Process the most recent message in the thread
      if (messages.length > 0) {
        const message = messages[messages.length - 1];
        if (!message.isUnread()) {
          processEmailToAutomations(message, results, 'Daily Finance Update');
        }
      }
    }

    // Also search for READ emails from notifications@yutori.com still in inbox
    const readYutoriThreads = GmailApp.search('is:read in:inbox from:notifications@yutori.com', 0, 20);
    Logger.log(`Found ${readYutoriThreads.length} read Yutori notification emails in inbox`);

    // Process read yutori notifications
    for (const thread of readYutoriThreads) {
      const messages = thread.getMessages();

      // Process the most recent message in the thread
      if (messages.length > 0) {
        const message = messages[messages.length - 1];
        if (!message.isUnread()) {
          processEmailToAutomations(message, results, 'Yutori notification');
        }
      }
    }

    // Send summary email if there's anything to report
    if (results.filtered.length > 0 || results.notFiltered.length > 0 || results.errors.length > 0) {
      sendSummaryEmail(results);
    } else {
      Logger.log('No emails to process');
    }

    Logger.log('Email filter process completed');

  } catch (error) {
    Logger.log('Error in filterEmails: ' + error.toString());
    sendErrorEmail(error);
  }
}

/**
 * Process a single email message
 */
function processEmail(message, results, forceProcess = false) {
  try {
    const sender = message.getFrom();
    const subject = message.getSubject();
    const messageId = message.getId();

    Logger.log(`Processing: ${sender} - ${subject}`);

    // Skip Yutori and Daily Finance Update emails when unread - they're handled separately
    if (!forceProcess && message.isUnread()) {
      if (sender.includes('notifications@yutori.com')) {
        Logger.log(`Skipping unread Yutori email - will process after being read`);
        return;
      }
      if (subject.includes('Daily Finance Update')) {
        Logger.log(`Skipping unread Daily Finance Update - will process after being read`);
        return;
      }
    }

    // Check if this email was previously reported as "not filtered" (unless forcing process)
    if (!forceProcess && wasReportedAsNotFiltered(messageId)) {
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
      // Mark as not filtered and track it (unless forcing process)
      if (!forceProcess) {
        markAsNotFiltered(messageId);

        results.notFiltered.push({
          sender,
          subject
        });

        Logger.log(`Not filtered: ${subject}`);
      }
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
 * Process specific emails directly to Automations folder
 * Used for Daily Finance Update and Yutori notifications
 */
function processEmailToAutomations(message, results, emailType) {
  try {
    const sender = message.getFrom();
    const subject = message.getSubject();

    Logger.log(`Processing ${emailType}: ${sender} - ${subject}`);

    // Apply Automations label and archive
    applyLabel(message, 'Summary Email (Already Read)');
    message.getThread().moveToArchive();

    results.filtered.push({
      sender,
      subject,
      category: 'Summary Email (Already Read)',
      rationale: emailType
    });

    Logger.log(`Filtered ${emailType} to Automations: ${subject}`);

  } catch (error) {
    Logger.log(`Error processing ${emailType}: ${error.toString()}`);
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
