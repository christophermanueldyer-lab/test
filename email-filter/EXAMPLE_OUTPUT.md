# 📧 Example Summary Email Output

This document shows examples of what the summary emails will look like.

## Example 1: Mixed Filtering (Typical Day)

```
Subject: Email Filter Summary - Dec 14, 2024 9:00 AM PST

FILTERED EMAILS (12 emails moved: 8 to Promos, 3 to Receipts, 1 to Automations):
======================================================================

1. Sender: Rhoback <bunker@rhoback.com>
   Subject: New: The Twig & The Ski Lodge
   Rationale: Promotional Email

2. Sender: Nike <promo@nike.com>
   Subject: Just Dropped: Air Max 2024
   Rationale: Promotional Email

3. Sender: Marine Layer <absurdlysoft@marinelayer.com>
   Subject: 25% OFF IS WRAPPING UP
   Rationale: Promotional Email

4. Sender: Patagonia <news@patagonia.com>
   Subject: New Arrivals for Winter
   Rationale: Promotional Email

5. Sender: Amazon <shipment-tracking@amazon.com>
   Subject: Your package has shipped
   Rationale: Promotional Email

6. Sender: Substack <digest@substack.com>
   Subject: Your weekly reading digest
   Rationale: Promotional Email

7. Sender: Notion <team@notion.so>
   Subject: You're missing out on these features
   Rationale: Promotional Email

8. Sender: LinkedIn <messages-noreply@linkedin.com>
   Subject: Weekly job recommendations
   Rationale: Promotional Email

9. Sender: Uber <uber.us@uber.com>
   Subject: Your receipt for your trip on Dec 13
   Rationale: Receipt

10. Sender: DoorDash <no-reply@doordash.com>
    Subject: Your DoorDash receipt
    Rationale: Receipt

11. Sender: Apple <no_reply@email.apple.com>
    Subject: Your receipt from Apple
    Rationale: Receipt

12. Sender: Gmail <noreply@gmail.com>
    Subject: Email Filter Summary - Dec 13, 2024 4:00 PM PST
    Rationale: Summary Email (Already Read)

NOT FILTERED EMAILS (3 emails remained in inbox):
======================================================================

1. Sender: John Doe <john@company.com>
   Subject: Q4 Budget Review

2. Sender: Sarah Smith <sarah@example.com>
   Subject: Can you review this proposal?

3. Sender: GitHub <notifications@github.com>
   Subject: [your-repo] Pull request #123 needs review
```

---

## Example 2: All Filtered (Clean Sweep)

```
Subject: Email Filter Summary - Dec 14, 2024 10:00 AM PST

FILTERED EMAILS (5 emails moved: 4 to Promos, 1 to Receipts):
======================================================================

1. Sender: REI <news@rei.com>
   Subject: Cyber Week Continues: Extra 20% Off
   Rationale: Promotional Email

2. Sender: Airbnb <automated@airbnb.com>
   Subject: Trending destinations for your next trip
   Rationale: Promotional Email

3. Sender: Spotify <no-reply@spotify.com>
   Subject: Your 2024 Wrapped is here!
   Rationale: Promotional Email

4. Sender: Medium <noreply@medium.com>
   Subject: Daily Digest: Top stories for you
   Rationale: Promotional Email

5. Sender: Target <guest@target.com>
   Subject: Thanks for your order! (Order #12345)
   Rationale: Receipt
```

---

## Example 3: Nothing Filtered (All Important)

```
Subject: Email Filter Summary - Dec 14, 2024 11:00 AM PST

NOT FILTERED EMAILS (4 emails remained in inbox):
======================================================================

1. Sender: boss@company.com
   Subject: Urgent: Client meeting moved to 2pm

2. Sender: mom@family.com
   Subject: Dinner this Sunday?

3. Sender: accountant@taxfirm.com
   Subject: Your 2024 tax documents are ready

4. Sender: doctor@clinic.com
   Subject: Appointment reminder for Dec 20
```

---

## Example 4: Only Receipts

```
Subject: Email Filter Summary - Dec 14, 2024 1:00 PM PST

FILTERED EMAILS (3 emails moved: 3 to Receipts):
======================================================================

1. Sender: Stripe <receipts@stripe.com>
   Subject: Receipt for your Stripe payment
   Rationale: Receipt

2. Sender: PayPal <service@paypal.com>
   Subject: You sent a payment of $50.00
   Rationale: Receipt

3. Sender: Square <receipts@messaging.squareup.com>
   Subject: Your Square receipt from Coffee Shop
   Rationale: Receipt
```

---

## Example 5: With Errors (Rare)

```
Subject: Email Filter Summary - Dec 14, 2024 2:00 PM PST

FILTERED EMAILS (2 emails moved: 2 to Promos):
======================================================================

1. Sender: Groupon <noreply@r.groupon.com>
   Subject: Deals near you - up to 70% off!
   Rationale: Promotional Email

2. Sender: Yelp <yelp@yelp.com>
   Subject: Top-rated restaurants in your area
   Rationale: Promotional Email

NOT FILTERED EMAILS (1 emails remained in inbox):
======================================================================

1. Sender: colleague@work.com
   Subject: Project update

ERRORS (1 emails had processing errors):
======================================================================

1. Sender: unknown@example.com
   Subject: [No subject]
   Error: Classification failed
```

---

## Example 6: Self-Cleaning (After You Read Summary)

```
Subject: Email Filter Summary - Dec 14, 2024 3:00 PM PST

FILTERED EMAILS (1 emails moved: 1 to Automations):
======================================================================

1. Sender: Gmail <your-email@gmail.com>
   Subject: Email Filter Summary - Dec 14, 2024 2:00 PM PST
   Rationale: Summary Email (Already Read)
```

This shows the **self-cleaning feature** - after you read a summary email, the next run automatically files it to "Automations"!

---

## Example 7: No Activity (Empty)

If there are no unread emails during a run, **no summary email is sent**. The script simply logs "No emails to report" and exits silently.

---

## Understanding the Format

### Header
```
FILTERED EMAILS (X emails moved: Y to Promos, Z to Receipts, W to Automations):
```
- **X** = total filtered
- **Y, Z, W** = breakdown by category

### Each Entry
```
1. Sender: Full Name <email@domain.com>
   Subject: The email subject line
   Rationale: Why it was filtered (Claude's explanation)
```

### Not Filtered Section
```
NOT FILTERED EMAILS (X emails remained in inbox):
```
- Shows emails Claude decided to keep
- Will **NOT** appear in future summaries (tracked to avoid duplicates)

### Errors Section (Rare)
```
ERRORS (X emails had processing errors):
```
- Only appears if API calls fail
- Usually due to network issues or API errors
- These emails remain unprocessed

---

## Reading Your Summary

### ✅ Good Signs:
- Promotional emails correctly identified
- Receipts caught and filed
- Important emails stayed in inbox
- Old summaries auto-filed to Automations

### ⚠️ Watch For:
- Important emails incorrectly filtered (check Promos/Receipts labels)
- Promotional emails not caught (might need prompt tuning)
- Too many errors (API or network issues)

### 🎯 Perfect Run:
- All promotional emails filtered
- All receipts filed
- All important emails in NOT FILTERED section
- Zero errors

---

## Summary Email Itself

The summary email has these properties:

- **From**: Your Gmail address (sent to yourself)
- **Subject**: `Email Filter Summary - [Date] [Time] [Timezone]`
- **Label**: None initially (you can manually label it or let it auto-file after reading)
- **Format**: Plain text, monospace-friendly
- **Frequency**: Only sent when there are emails to report

---

**This summary format keeps you informed without cluttering your inbox!**
