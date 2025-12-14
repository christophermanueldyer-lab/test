# ⚡ Quick Start Guide

Get your email filter running in 10 minutes!

## 🎯 What You'll Build

An AI-powered Gmail filter that:
- Runs every hour from 7am-4pm Pacific
- Filters promos, receipts, and read summaries
- Sends you a clean summary email
- Costs ~$0.015/day (~1.5 cents!)

## 📋 Prerequisites

- Gmail account
- Anthropic API account ([console.anthropic.com](https://console.anthropic.com))
- 10 minutes of setup time

## 🚀 Setup Steps

### 1. Create Apps Script Project (2 min)

1. Go to [script.google.com](https://script.google.com)
2. Click **"New project"**
3. Name it **"Gmail Email Filter"**

### 2. Add Code Files (3 min)

Copy these 4 files from this repo to Apps Script:

| File | What to do |
|------|-----------|
| `Code.gs` | Replace default Code.gs content |
| `Classifier.gs` | Click "+" → Script → Name it "Classifier" |
| `EmailTracker.gs` | Click "+" → Script → Name it "EmailTracker" |
| `appsscript.json` | Enable in settings, then replace content |

**Enable appsscript.json:**
1. Click gear icon (Project Settings)
2. Check "Show 'appsscript.json' manifest file"
3. Now you can edit it in the files list

### 3. Get Anthropic API Key (2 min)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up (separate from claude.ai)
3. Go to Settings → API Keys
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-...`)

**Note**: New accounts get $5 free credit (330+ days of use!)

### 4. Add API Key to Apps Script (1 min)

1. In Apps Script, click gear icon (Project Settings)
2. Scroll to "Script Properties"
3. Click "Add script property"
4. Enter:
   - **Property**: `ANTHROPIC_API_KEY`
   - **Value**: Your API key
5. Click "Save script property"

### 5. Test It! (1 min)

1. Select `testClassifier` from function dropdown
2. Click "Run"
3. Grant permissions when prompted
4. Check logs (View → Logs) - should see test results

**Successful output:**
```
Test 1 (Promo): {"shouldFilter":true,"category":"Promotional Email"...}
Test 2 (Receipt): {"shouldFilter":true,"category":"Receipt"...}
```

### 6. Set Up Hourly Triggers (1 min)

1. Select `setupTriggers` from function dropdown
2. Click "Run"
3. Check logs - should see "Triggers created successfully"
4. Click clock icon (left sidebar) - you should see 10 triggers

### 7. Done! 🎉

Your filter is now live! It will:
- Run every hour from 7am-4pm Pacific
- Process unread emails in your inbox
- Send you summary emails with results

## 🧪 Optional: Test with Real Emails

Before the first automated run, test manually:

1. Make sure you have some unread emails
2. Select `filterEmails` from dropdown
3. Click "Run"
4. Check your inbox for summary email
5. Verify filtered emails went to correct labels

## 📊 What to Expect

### First Hour
- Script runs on schedule
- Processes unread emails
- Sends summary email

### Summary Email Format
```
FILTERED EMAILS (3 emails moved: 2 to Promos, 1 to Receipts):
======================================================================

1. Sender: Nike <promo@nike.com>
   Subject: Flash Sale - 40% Off
   Rationale: Promotional Email

...

NOT FILTERED EMAILS (1 emails remained in inbox):
======================================================================

1. Sender: boss@company.com
   Subject: Important meeting
```

### Cost
- ~$0.015/day for 50 emails
- ~$0.45/month
- Well under your $1/day budget!

## 🛠️ Customization

### Change Schedule

Edit `setupTriggers` function to change hours:

```javascript
// Every 2 hours instead of every hour
for (let hour = 7; hour <= 16; hour += 2) {
  // ...
}
```

### Adjust Filtering

Edit `buildClassificationPrompt` in `Classifier.gs` to tune Claude's behavior.

### Different Labels

Edit `applyLabel` function in `Code.gs` to use different Gmail label names.

## 🐛 Troubleshooting

**No summary emails?**
- Check spam folder
- Review Apps Script executions (click "Executions")
- Run `filterEmails` manually and check logs

**API key errors?**
- Verify key at console.anthropic.com
- Check Script Properties has `ANTHROPIC_API_KEY` set
- Ensure billing is enabled and you have credits

**Triggers not running?**
- Click clock icon - should see 10 triggers
- Check timezone in appsscript.json is "America/Los_Angeles"
- Review execution history

## 📚 More Resources

- **Full Setup**: See [README.md](README.md)
- **Testing Guide**: See [TESTING.md](TESTING.md)
- **Example Outputs**: See [EXAMPLE_OUTPUT.md](EXAMPLE_OUTPUT.md)

## 🆘 Need Help?

1. Check [TESTING.md](TESTING.md) for debugging steps
2. Review Apps Script logs and executions
3. Verify API key and billing at console.anthropic.com

## ⏸️ Stop the Automation

Run `removeTriggers` function to stop all automated filtering.

---

**Enjoy your clean inbox! ✨**

Total setup time: ~10 minutes
Daily cost: ~$0.015 (1.5 cents)
Time saved: Priceless 🎯
