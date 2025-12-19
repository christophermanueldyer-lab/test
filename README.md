# Gmail Email Filter with Claude AI

An intelligent email filtering system that automatically organizes your Gmail inbox using Claude AI. No more rules-based filtering - let AI understand your emails and categorize them intelligently.

## 📁 Project Structure

This repository contains a Google Apps Script project for automated email filtering.

All source files are in the `email-filter/` directory:

```
email-filter/
├── Code.gs              # Main Gmail integration & orchestration
├── Classifier.gs        # Claude API email classification
├── EmailTracker.gs      # Tracks "not filtered" emails
├── HelperFunctions.gs   # Utility functions
├── appsscript.json      # Apps Script manifest
├── README.md            # Complete setup guide
├── QUICKSTART.md        # 10-minute setup guide
├── TESTING.md           # Testing procedures
└── EXAMPLE_OUTPUT.md    # Sample email outputs
```

## ✨ Features

- **AI-Powered Classification** - Uses Claude 3.5 Haiku for fast, accurate email categorization
- **Automatic Filtering** - Filters promotional emails, receipts, and automation summaries
- **Smart Tracking** - Avoids reporting the same "not filtered" emails multiple times
- **Daily Summaries** - Sends you a clean summary of what was filtered
- **Self-Cleaning** - Auto-files its own summary emails after you read them
- **Cost-Effective** - ~$0.015/day for 50 emails (~1.5 cents!)
- **Cloud-Based** - Runs entirely in Google Apps Script (no server needed!)

## 🚀 Quick Start

See `email-filter/QUICKSTART.md` for a 10-minute setup guide.

**TL;DR:**
1. Create a Google Apps Script project
2. Copy the 4 `.gs` files and `appsscript.json`
3. Add your Anthropic API key to Script Properties
4. Run `setupTriggers()` function
5. Done! Runs automatically every hour from 7am-4pm Pacific

## 📖 Documentation

- **[QUICKSTART.md](email-filter/QUICKSTART.md)** - Get running in 10 minutes
- **[README.md](email-filter/README.md)** - Complete feature list, setup, customization
- **[TESTING.md](email-filter/TESTING.md)** - Comprehensive testing procedures
- **[EXAMPLE_OUTPUT.md](email-filter/EXAMPLE_OUTPUT.md)** - Sample summary emails

## 💰 Cost

With 50 emails/day using Claude 3.5 Haiku:
- **Daily:** ~$0.015 (~1.5 cents)
- **Monthly:** ~$0.45
- **New accounts get $5 free credit** (covers ~330 days!)

## 📧 How It Works

1. **Hourly scan** - Checks your inbox for unread emails
2. **AI Classification** - Sends each email to Claude for intelligent categorization
3. **Auto-Organization** - Moves emails to appropriate folders:
   - **Promotional emails** → `Promos` label + archived
   - **Receipts** → `Receipts` label + archived
   - **Read automation summaries** → `Automations` label + archived
4. **Summary Email** - Sends you a formatted summary of actions taken

## 🎯 What Gets Filtered

✅ **Promotional Emails** - Marketing, sales, deals from brands/retailers

✅ **Receipts** - Purchase confirmations, order receipts

✅ **Read Automation Summaries** - Only the "Email Filter Summary" emails this script creates

❌ **NOT Filtered** - Content newsletters (Morning Brew, Lenny's Newsletter, etc.), personal emails, important work emails

## 🛠️ Technology

- **Google Apps Script** - Cloud automation platform
- **Claude 3.5 Haiku API** - AI email classification
- **Gmail API** - Email access and manipulation

## 📄 License

Open source and free to use for personal purposes.

---

**Made with ❤️ for inbox zero enthusiasts**

Enjoy your clean inbox! ✨
