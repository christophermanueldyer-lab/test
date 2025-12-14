# 🧪 Testing Guide

This guide helps you test the email filter before going live with automated triggers.

## Pre-Deployment Testing

### 1. Test the Classifier Function

First, verify that Claude API integration works:

```javascript
// In Apps Script, select this function and click "Run"
testClassifier()
```

**Expected Output** (in Logs):
```
Test 1 (Promo): {"shouldFilter":true,"category":"Promotional Email","confidence":0.95,"rationale":"Marketing email with sale language"}
Test 2 (Receipt): {"shouldFilter":true,"category":"Receipt","confidence":0.98,"rationale":"Order confirmation email"}
Test 3 (Summary - Read): {"shouldFilter":true,"category":"Summary Email (Already Read)","confidence":0.90,"rationale":"Automation summary that has been read"}
Test 4 (Summary - Unread): {"shouldFilter":false,"category":null,"confidence":0.85,"rationale":"Summary email but not yet read"}
```

**If it fails:**
- Check that `ANTHROPIC_API_KEY` is set in Script Properties
- Verify your API key is valid at console.anthropic.com
- Check logs for specific error messages

### 2. Test with Real Emails (Safe Mode)

Create a **test version** of the main function that doesn't actually move emails:

1. Copy this test function into `Code.gs`:

```javascript
/**
 * TEST VERSION - Logs actions but doesn't move emails
 */
function testFilterEmails() {
  Logger.log('=== TEST MODE - No emails will be moved ===');

  const threads = GmailApp.search('is:unread in:inbox', 0, 10); // Only 10 emails
  Logger.log(`Found ${threads.length} unread emails`);

  for (const thread of threads) {
    const messages = thread.getMessages();

    for (const message of messages) {
      if (message.isUnread()) {
        const sender = message.getFrom();
        const subject = message.getSubject();
        const body = message.getPlainBody();
        const preview = body.substring(0, 500);

        Logger.log(`\n--- Testing: ${subject} ---`);

        const classification = classifyEmail(sender, subject, preview, message.isRead());

        if (classification) {
          Logger.log(`Classification: ${JSON.stringify(classification)}`);
          Logger.log(`Would filter: ${classification.shouldFilter}`);
          if (classification.shouldFilter) {
            Logger.log(`Would move to: ${classification.category}`);
          }
        } else {
          Logger.log('Classification failed!');
        }

        break; // Only process first unread message
      }
    }
  }

  Logger.log('\n=== TEST COMPLETE - No emails were moved ===');
}
```

2. Run `testFilterEmails` and review logs
3. Verify classifications match your expectations
4. Check that the right emails would be filtered

### 3. Manual Single-Email Test

Test on ONE real email:

```javascript
/**
 * Process exactly ONE email manually
 */
function testSingleEmail() {
  // Replace with a specific search that finds one email
  const threads = GmailApp.search('from:nike.com is:unread', 0, 1);

  if (threads.length === 0) {
    Logger.log('No emails found matching search');
    return;
  }

  const results = {
    filtered: [],
    notFiltered: [],
    errors: []
  };

  const message = threads[0].getMessages()[0];
  processEmail(message, results);

  Logger.log('Results: ' + JSON.stringify(results, null, 2));

  // Send test summary
  sendSummaryEmail(results);
}
```

**This will actually move the email**, so choose a test email you don't mind moving!

### 4. Verify Labels Exist

Check that Gmail labels will be created properly:

```javascript
function checkLabels() {
  const labelNames = ['Promos', 'Receipts', 'Automations'];

  labelNames.forEach(name => {
    let label = GmailApp.getUserLabelByName(name);
    if (label) {
      Logger.log(`✓ Label exists: ${name}`);
    } else {
      Logger.log(`✗ Label missing: ${name} (will be created automatically)`);
    }
  });
}
```

## Post-Deployment Testing

### 1. Run First Manual Execution

After setting up triggers, run the full function manually first:

```javascript
// Select this function and click "Run"
filterEmails()
```

**What to check:**
- ✅ No errors in logs
- ✅ Emails are classified correctly
- ✅ Labels are applied
- ✅ Summary email arrives in your inbox
- ✅ Summary email format is correct

### 2. Verify Trigger Setup

```javascript
function verifyTriggers() {
  const triggers = ScriptApp.getProjectTriggers();

  Logger.log(`Total triggers: ${triggers.length}`);

  triggers.forEach(trigger => {
    Logger.log(`Function: ${trigger.getHandlerFunction()}`);
    Logger.log(`Trigger ID: ${trigger.getUniqueId()}`);
  });

  if (triggers.length === 10) {
    Logger.log('✓ All 10 hourly triggers are set up correctly');
  } else {
    Logger.log(`⚠ Expected 10 triggers, found ${triggers.length}`);
  }
}
```

### 3. Monitor First 24 Hours

After going live, check these daily:

1. **Apps Script Executions**
   - Click "Executions" in left sidebar
   - Verify scripts are running on schedule
   - Check for any failed executions

2. **Email Summaries**
   - Confirm you're receiving summary emails
   - Verify format matches expectations
   - Check that classifications are accurate

3. **Gmail Labels**
   - Review emails moved to Promos
   - Review emails moved to Receipts
   - Ensure nothing important was filtered incorrectly

4. **API Costs**
   - Check console.anthropic.com for usage
   - Verify costs are as expected (~$0.015/day for 50 emails)

## Common Test Scenarios

### Test Case 1: Promotional Email

Send yourself a test promotional email:

```
To: your-email@gmail.com
Subject: FLASH SALE - 50% Off Everything!
Body: Don't miss our biggest sale of the year. Shop now and save big on all items...
```

**Expected**: Filtered to "Promos"

### Test Case 2: Receipt

Forward yourself an old receipt email or create a test:

```
To: your-email@gmail.com
Subject: Your Order #12345 Confirmation
Body: Thank you for your purchase. Order total: $99.99. Your order has been confirmed...
```

**Expected**: Filtered to "Receipts"

### Test Case 3: Important Personal Email

```
To: your-email@gmail.com
From: friend@gmail.com
Subject: Can we meet tomorrow?
Body: Hey, are you free for coffee tomorrow afternoon?
```

**Expected**: NOT filtered (stays in inbox)

### Test Case 4: Summary Email (Read)

1. Wait for the first automation summary to arrive
2. Mark it as read
3. Wait for next hourly run

**Expected**: Filtered to "Automations"

### Test Case 5: Summary Email (Unread)

1. Let an automation summary stay unread
2. Wait for next hourly run

**Expected**: NOT filtered (stays in inbox until read)

## Debugging Common Issues

### Issue: No summary emails received

**Debug steps:**
1. Check Apps Script Executions - any errors?
2. Check spam folder
3. Run `filterEmails()` manually and check logs
4. Verify `Session.getActiveUser().getEmail()` returns correct email

### Issue: Wrong emails being filtered

**Debug steps:**
1. Check classification results in logs
2. Review the prompt in `Classifier.gs`
3. Adjust confidence thresholds if needed
4. Test with `testClassifier()` on sample emails

### Issue: API errors

**Debug steps:**
1. Check console.anthropic.com - is key valid?
2. Check billing - do you have credits?
3. Review error in logs - rate limit or quota issue?
4. Reduce batch size if hitting rate limits

### Issue: Triggers not running

**Debug steps:**
1. Run `verifyTriggers()` to check trigger count
2. Check timezone is set to "America/Los_Angeles" in `appsscript.json`
3. Verify triggers in UI (clock icon) match expected schedule
4. Check Apps Script quotas - might have hit daily limit

## Performance Testing

### Measure Execution Time

```javascript
function measurePerformance() {
  const start = new Date();

  // Process 10 emails
  const threads = GmailApp.search('is:unread in:inbox', 0, 10);

  let apiCalls = 0;
  threads.forEach(thread => {
    const message = thread.getMessages()[0];
    const sender = message.getFrom();
    const subject = message.getSubject();
    const preview = message.getPlainBody().substring(0, 500);

    classifyEmail(sender, subject, preview, message.isRead());
    apiCalls++;
  });

  const end = new Date();
  const duration = (end - start) / 1000; // seconds

  Logger.log(`Processed ${apiCalls} emails in ${duration.toFixed(2)} seconds`);
  Logger.log(`Average: ${(duration / apiCalls).toFixed(2)} seconds per email`);
  Logger.log(`6-minute limit allows: ~${Math.floor(360 / (duration / apiCalls))} emails`);
}
```

**Expected**: ~2-3 seconds per email, allowing ~120-180 emails within the 6-minute limit.

## Rollback Plan

If something goes wrong, here's how to quickly disable:

### Emergency Stop

```javascript
// Run this immediately to stop all automation
removeTriggers()
```

### Restore Filtered Emails

1. Go to Gmail
2. Search: `label:Promos OR label:Receipts OR label:Automations`
3. Select all
4. Move back to inbox
5. Remove labels

### Clear Tracking Data

```javascript
// Reset the "not filtered" tracking
clearTrackedEmails()
```

## Success Criteria

Before considering the system "production ready":

- ✅ Test classifier works with 100% success rate
- ✅ Manual single-email test correctly filters/doesn't filter
- ✅ Summary email format is correct
- ✅ All 10 triggers are set up and visible
- ✅ First automated run completes without errors
- ✅ No important emails incorrectly filtered in first 24 hours
- ✅ API costs are within expected range (~$0.015/day)
- ✅ Summary emails are readable and useful

## Next Steps After Testing

Once all tests pass:

1. ✅ Let it run for 1 week
2. ✅ Monitor daily for accuracy
3. ✅ Adjust classification prompt if needed
4. ✅ Fine-tune which categories to filter
5. ✅ Enjoy your clean inbox!

---

**Happy Testing! 🧪**
