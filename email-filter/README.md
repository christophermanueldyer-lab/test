# 📧 Gmail Email Filter with Claude AI

An intelligent email filtering system that automatically organizes your Gmail inbox using Claude AI. No more rules-based filtering - let AI understand your emails and categorize them intelligently.

## ✨ Features

- **AI-Powered Classification** - Uses Claude 3.5 Haiku for fast, accurate email categorization
- **Automatic Filtering** - Filters promotional emails, receipts, and automation summaries
- **Smart Tracking** - Avoids reporting the same "not filtered" emails multiple times
- **Daily Summaries** - Sends you a clean summary of what was filtered
- **Cloud-Based** - Runs entirely in Google Apps Script (no server needed!)
- **Cost-Effective** - ~$0.015/day for 50 emails (~1.5 cents!)
- **Scheduled Execution** - Runs every hour from 7am to 4pm Pacific

## 📋 How It Works

1. **Hourly scan** - Checks your inbox for unread emails
2. **AI Classification** - Sends each email to Claude for intelligent categorization
3. **Auto-Organization** - Moves emails to appropriate folders:
   - **Promotional emails** → `Promos` label + archived
   - **Receipts** → `Receipts` label + archived
   - **Read automation summaries** → `Automations` label + archived
4. **Summary Email** - Sends you a formatted summary of actions taken

### Special Features

- **Self-Cleaning**: The automation summaries it creates will auto-file themselves to "Automations" once you've read them
- **No Duplicates**: Won't report the same "not filtered" email twice
- **Intelligent**: Uses LLM reasoning instead of rigid rules

## 🚀 Setup Instructions

### Step 1: Create a New Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click **"New project"**
3. Name it **"Gmail Email Filter"**

### Step 2: Add the Code Files

You need to create 4 code files in Apps Script:

#### File 1: `Code.gs`
1. In the Apps Script editor, you'll see a default `Code.gs` file
2. Copy the entire contents of `Code.gs` from this repository
3. Paste it into the Apps Script editor

#### File 2: `Classifier.gs`
1. Click the **"+"** next to Files
2. Select **"Script"**
3. Name it `Classifier`
4. Copy the contents of `Classifier.gs` from this repository
5. Paste it into the new file

#### File 3: `EmailTracker.gs`
1. Click the **"+"** next to Files
2. Select **"Script"**
3. Name it `EmailTracker`
4. Copy the contents of `EmailTracker.gs` from this repository
5. Paste it into the new file

#### File 4: `appsscript.json`
1. In the left sidebar, click the **gear icon** (Project Settings)
2. Check **"Show 'appsscript.json' manifest file in editor"**
3. Back in the editor, you'll now see `appsscript.json` in the files list
4. Copy the contents of `appsscript.json` from this repository
5. Paste it, replacing all existing content

### Step 3: Get Your Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in (this is separate from claude.ai)
3. Navigate to **API Keys** in Settings
4. Click **"Create Key"**
5. Copy the API key (starts with `sk-ant-...`)

**Note**: Claude Pro subscription does NOT include API access. You need a separate API account. New accounts get $5 free credit!

### Step 4: Add API Key to Apps Script

1. In your Apps Script project, click the **gear icon** (Project Settings)
2. Scroll to **"Script Properties"**
3. Click **"Add script property"**
4. Enter:
   - **Property**: `ANTHROPIC_API_KEY`
   - **Value**: Your API key (e.g., `sk-ant-api03-...`)
5. Click **"Save script property"**

### Step 5: Test the Classifier (Optional but Recommended)

1. In the Apps Script editor, select `testClassifier` from the function dropdown at the top
2. Click **"Run"**
3. Grant permissions when prompted (review and approve Gmail access)
4. Check **"View" → "Logs"** to see test results

You should see classification results for sample emails.

### Step 6: Set Up Automated Triggers

1. In the Apps Script editor, select `setupTriggers` from the function dropdown
2. Click **"Run"**
3. Check the logs - you should see "Triggers created successfully"

This creates 10 hourly triggers from 7am to 4pm Pacific time.

### Step 7: Verify Triggers Are Active

1. Click the **clock icon** (Triggers) in the left sidebar
2. You should see 10 triggers, each running `filterEmails` at different hours
3. They'll run every day at those times

## 📖 Usage

Once set up, the system runs automatically! Here's what happens:

### Every Hour (7am - 4pm Pacific):
1. Scans your inbox for unread emails
2. Classifies each email with Claude AI
3. Filters promotional emails, receipts, and read summaries
4. Archives filtered emails and applies labels
5. Sends you a summary email

### Summary Email Format:

```
FILTERED EMAILS (3 emails moved: 2 to Promos, 1 to Receipts):
======================================================================

1. Sender: Rhoback <bunker@rhoback.com>
   Subject: New: The Twig & The Ski Lodge
   Rationale: Promotional Email

2. Sender: Nike <promo@nike.com>
   Subject: Flash Sale - 40% Off
   Rationale: Promotional Email

3. Sender: Amazon <auto-confirm@amazon.com>
   Subject: Your Amazon.com order #123-456
   Rationale: Receipt

NOT FILTERED EMAILS (1 emails remained in inbox):
======================================================================

1. Sender: boss@company.com
   Subject: Urgent: Please review Q4 report
```

### What Gets Filtered:

✅ **Promotional Emails**
- Marketing emails
- Newsletters
- Sales and deals
- Promotional campaigns

✅ **Receipts**
- Purchase confirmations
- Order receipts
- Transaction confirmations

✅ **Summary Emails (Already Read)**
- The automation summary emails this script sends
- Other digest emails you've already read

❌ **NOT Filtered:**
- Personal emails
- Important work emails
- Emails you haven't read yet (unless promotional/receipts)
- Anything Claude isn't confident about

## 🔧 Customization

### Adjust Schedule

To change when the script runs:

1. Run the `removeTriggers` function to clear existing triggers
2. Edit the `setupTriggers` function in `Code.gs`:

```javascript
// Example: Run every 2 hours from 6am to 10pm
for (let hour = 6; hour <= 22; hour += 2) {
  ScriptApp.newTrigger('filterEmails')
    .timeBased()
    .atHour(hour)
    .everyDays(1)
    .inTimezone('America/Los_Angeles')
    .create();
}
```

3. Run `setupTriggers` again to apply changes

### Adjust Classification Prompt

Edit the `buildClassificationPrompt` function in `Classifier.gs` to change how Claude classifies emails.

### Change Label Names

Edit the `applyLabel` function in `Code.gs` to use different Gmail label names.

## 🛠️ Maintenance Functions

### View Tracker Statistics
```javascript
// In Apps Script, run this function
getTrackerStats()
```

Shows how many emails are being tracked as "not filtered" and cleanup status.

### Clear Tracked Emails
```javascript
// In Apps Script, run this function
clearTrackedEmails()
```

Resets the tracking system. All previously "not filtered" emails will be reported again.

### Remove All Triggers
```javascript
// In Apps Script, run this function
removeTriggers()
```

Stops the automation completely. Run `setupTriggers` again to restart.

## 💰 Cost Breakdown

### Claude 3.5 Haiku API
- **Model**: claude-3-5-haiku-20241022
- **Pricing**: $0.25 per 1M input tokens, $1.25 per 1M output tokens
- **Per email**: ~1,000 input tokens + 50 output tokens
- **50 emails/day**: ~$0.015/day (~1.5 cents)
- **Monthly**: ~$0.45/month
- **Free credit**: $5 (covers ~330 days!)

**Well under your $1/day budget!**

## 🐛 Troubleshooting

### "ANTHROPIC_API_KEY not set"
- Make sure you added the API key to Script Properties (Step 4)
- Check that the property name is exactly `ANTHROPIC_API_KEY`
- No extra spaces or quotes

### No summary emails being sent
- Check Apps Script logs: **View → Logs** or **Executions**
- Make sure you have unread emails in your inbox
- Verify triggers are active: Click clock icon to see triggers

### Emails not being filtered
- Check the classification with `testClassifier` function
- Review logs to see Claude's classifications
- Verify Gmail labels exist (`Promos`, `Receipts`, `Automations`)

### "Authorization required" error
- Run any function manually first to grant permissions
- Make sure you approve Gmail access when prompted

### Too many emails being filtered (or not enough)
- Adjust the classification prompt in `Classifier.gs`
- You can make Claude more/less strict about what to filter

### API rate limits or errors
- Check your Anthropic API dashboard for usage
- Ensure you have billing enabled and credits available
- Apps Script has a daily quota (usually sufficient for personal use)

## 📊 Monitoring

### View Script Executions
1. In Apps Script, click **"Executions"** (left sidebar)
2. See all past runs, duration, and any errors
3. Click on an execution to see detailed logs

### Check API Usage
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. View your API usage and costs
3. Monitor daily spending

## 🔒 Privacy & Security

- **Runs in your Google account** - Only you have access
- **API calls to Anthropic** - Email metadata (sender, subject, preview) is sent to Claude for classification
- **No data storage** - Emails are not stored anywhere except Gmail
- **API key security** - Stored securely in Apps Script Properties

## ⚠️ Important Notes

1. **Test first!** - Run on a small batch before going live
2. **Check spam folder** - Make sure summary emails aren't going to spam
3. **Monitor initially** - Watch the first few days to ensure accurate classification
4. **Keep labels** - Don't delete the `Promos`, `Receipts`, or `Automations` labels
5. **Backup important emails** - Always have a backup of critical emails

## 🆘 Support

If something isn't working:

1. **Check the logs** - Most issues show up in Apps Script logs
2. **Review executions** - See if the script is running at all
3. **Test manually** - Run `filterEmails` manually to debug
4. **Check API key** - Verify it's valid at console.anthropic.com

## 📝 License

This project is open source and free to use for personal purposes.

## 🙏 Credits

Built with:
- [Google Apps Script](https://developers.google.com/apps-script) - Cloud automation
- [Anthropic Claude](https://anthropic.com) - AI classification
- Gmail API - Email access

---

**Made with ❤️ for inbox zero enthusiasts**

Enjoy your clean inbox! ✨
