# 🎙️ Podcast Summarizer - Setup Instructions

**AI-powered podcast summaries with downloadable transcripts**

---

## ⚡ Quick Start (10-15 minutes)

### What You'll Need

1. **Python 3.9+** installed on your computer
2. **Anthropic API key** (Claude AI) - ~$10 credit recommended
3. **YouTube Data API key** (optional, but recommended - 100% FREE)

---

## Step 1: Get API Keys

### Anthropic API Key (Required)

**Cost:** $10 gets you ~500-1000 summaries (~$0.01-0.02 each)

1. Go to **console.anthropic.com**
2. Sign up / log in (this is different from claude.ai)
3. Navigate to **Settings** → **API Keys**
4. Click **Create Key**
5. Copy the key (starts with `sk-ant-...`)
6. **Important:** Add a payment method and purchase credits ($10 minimum recommended)

💡 **Note:** Claude Pro subscription does NOT include API access. You need a separate API account.

---

### YouTube Data API Key (Optional - Recommended)

**Cost:** 100% FREE (10,000 queries/day)

1. Go to **console.cloud.google.com**
2. Create a new project (or select existing)
3. Enable **YouTube Data API v3**
4. Navigate to **Credentials**
5. Click **Create Credentials** → **API Key**
6. Copy the API key (starts with `AIza...`)

💡 **Why you need this:** Improves Spotify podcast support with automatic YouTube search fallback.

---

## Step 2: Download the Code

### Option A: Download ZIP from GitHub

1. Go to your GitHub repository URL
2. Click the green **"Code"** button
3. Click **"Download ZIP"**
4. Extract the ZIP file to a location like:
   - Windows: `C:\Users\[YourName]\Documents\podcast-summarizer`
   - Mac: `~/Documents/podcast-summarizer`

### Option B: Use Git (if installed)

```bash
git clone [your-repository-url]
cd podcast-summarizer
```

---

## Step 3: Install Python

### Check if Python is Already Installed

Open Command Prompt (Windows) or Terminal (Mac/Linux) and run:

```bash
python --version
```

If you see `Python 3.9` or higher, skip to Step 4.

### Install Python

1. Download from **python.org/downloads**
2. Run the installer
3. ⚠️ **CRITICAL (Windows):** Check the box **"Add Python to PATH"** at the bottom of the first screen
4. Click **"Install Now"**
5. After installation, restart your computer
6. Verify by running `python --version` again

---

## Step 4: Set Up the Project

Open **Command Prompt** (Windows) or **Terminal** (Mac/Linux):

### Navigate to the Project Folder

```bash
# Windows example:
cd C:\Users\YourName\Documents\podcast-summarizer

# Mac/Linux example:
cd ~/Documents/podcast-summarizer
```

### Create Virtual Environment

```bash
python -m venv venv
```

Wait for this to complete (takes 30-60 seconds).

### Activate Virtual Environment

**Windows (Command Prompt):**
```bash
venv\Scripts\activate.bat
```

**Windows (PowerShell):**
```bash
venv\Scripts\Activate.ps1
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

You should see `(venv)` appear at the start of your command line.

### Install Dependencies

```bash
pip install streamlit anthropic yt-dlp google-api-python-client python-dotenv requests
```

This will take 1-2 minutes. Wait for it to complete.

---

## Step 5: Configure API Keys

### Create the .env File

**Windows:**
```bash
copy .env.example .env
```

**Mac/Linux:**
```bash
cp .env.example .env
```

### Edit the .env File

Open the `.env` file in Notepad (Windows) or TextEdit (Mac):

**Windows:**
```bash
notepad .env
```

**Mac:**
```bash
open -e .env
```

### Add Your API Keys

Replace the placeholders with your actual keys:

```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
YOUTUBE_API_KEY=AIza-your-actual-key-here
```

**Important:**
- No quotes around the keys
- No spaces before or after the `=`
- Keep each key on its own line

Save the file and close it.

⚠️ **Security:** Never share your `.env` file or commit it to GitHub. It's already in `.gitignore`.

---

## Step 6: Run the App! 🚀

With your virtual environment activated (you should see `(venv)`), run:

```bash
streamlit run app.py
```

Your default web browser will automatically open to `http://localhost:8501`

If it doesn't open automatically, manually navigate to that URL.

---

## 🎯 How to Use the Podcast Summarizer

### Step-by-Step

1. **Find a YouTube podcast**
   - The video must have captions/subtitles enabled (look for the CC button)
   - Copy the URL from your browser's address bar

2. **Paste the URL** into the "Podcast URL" text box

3. **Select a Summary Style** from the dropdown:
   - Business Strategy
   - Leadership & Management
   - Political Analysis
   - Cultural Commentary
   - Health & Fitness
   - Science & Research
   - Personal Development
   - Quick Overview

4. **Click "📊 Generate Summary"**

5. **Wait 20-40 seconds** while it:
   - Fetches the YouTube transcript
   - Identifies speakers
   - Generates AI summary

6. **Download your files:**
   - ⬇️ Download Summary (MD) - Markdown format
   - ⬇️ Download Summary (TXT) - Plain text
   - ⬇️ Download Transcript - Raw transcript

---

## 🎨 Summary Style Details

### Business Strategy
Focus on market insights, business models, revenue strategies, and competitive analysis.

### Leadership & Management
Focus on team building, decision-making frameworks, organizational culture, and management techniques.

### Political Analysis
Focus on policy positions, political arguments, governance issues, and societal implications.

### Cultural Commentary
Focus on cultural trends, social issues, philosophical perspectives, and modern life observations.

### Health & Fitness
Focus on exercise techniques, training protocols, nutrition advice, recovery methods, and wellness practices.

### Science & Research
Focus on studies cited, research findings, scientific methodology, and evidence-based conclusions.

### Personal Development
Focus on self-improvement strategies, habit formation, mindset shifts, and actionable steps.

### Quick Overview
Balanced summary covering all major topics briefly for busy listeners.

---

## 💰 Cost Breakdown

### Anthropic Claude API
- **Model:** Claude 3 Haiku
- **Cost per summary:** ~$0.01-0.02
- **1-hour podcast:** typically ~$0.015
- **$10 credit:** approximately 500-1000 summaries

### YouTube Data API
- **Cost:** 100% FREE
- **Quota:** 10,000 queries/day (more than you'll ever need)

### Example Costs
- 10 podcasts: ~$0.15
- 50 podcasts: ~$0.75
- 100 podcasts: ~$1.50
- 500 podcasts: ~$7.50

---

## 🔧 Troubleshooting

### "Python not found" or "python is not recognized"

**Solution:**
1. Make sure you checked "Add Python to PATH" during installation
2. Restart your computer after installing Python
3. Try `python3` instead of `python`
4. Reinstall Python and ensure "Add to PATH" is checked

---

### "Anthropic API Key not found"

**Solutions:**
1. Verify your `.env` file exists (not `.env.example`)
2. Check that your API key is correct (no extra spaces or quotes)
3. Make sure the file is named exactly `.env` (not `.env.txt`)
4. Restart the Streamlit app after adding the key

---

### "Could not fetch transcript from YouTube"

**Reasons & Solutions:**
- ❌ Video doesn't have captions → Try a different video with CC enabled
- ❌ Captions are disabled by creator → Find another episode
- ❌ Invalid URL → Check the URL is copied correctly

**How to verify captions exist:**
1. Open the video on YouTube
2. Look for the "CC" button in the video player
3. If CC is available, the video should work

---

### "Error code: 404 - model not found"

**Solution:**
Your API key might not have access to the required model. Contact support or check your Anthropic account settings.

---

### "Module not found" errors

**Solutions:**
1. Make sure your virtual environment is activated (you see `(venv)`)
2. Run the pip install command again:
   ```bash
   pip install streamlit anthropic yt-dlp google-api-python-client python-dotenv requests
   ```
3. If using Windows PowerShell, try Command Prompt instead

---

### Virtual environment activation fails on Windows PowerShell

**Solution:**
Run this command in PowerShell as Administrator:
```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try activating again, or use Command Prompt instead.

---

## ✅ Running the App (Every Time)

Each time you want to use the podcast summarizer:

### Windows (Command Prompt)
```bash
cd C:\Users\YourName\Documents\podcast-summarizer
venv\Scripts\activate.bat
streamlit run app.py
```

### Mac/Linux
```bash
cd ~/Documents/podcast-summarizer
source venv/bin/activate
streamlit run app.py
```

### Stopping the App
Press `Ctrl+C` in the terminal to stop the app.

---

## 📝 Example Podcast URLs That Work

These are known to have captions:

- Lex Fridman Podcast: `https://youtube.com/watch?v=cdiD-9MMpb0`
- Tim Ferriss Show: Look for any episode on YouTube
- Joe Rogan Experience: Most episodes have auto-generated captions
- Huberman Lab: All episodes have captions

---

## 🎓 Tips & Best Practices

### For Best Results

1. **Choose the right summary style** for the podcast content
2. **Use podcasts with manual captions** (better quality than auto-generated)
3. **Download the transcript** if you want to reference exact quotes later
4. **Shorter podcasts (< 1 hour)** work faster and cost less

### Customizing Summary Styles

You can edit the summary prompts by modifying `config/prompts.json`:

1. Open `config/prompts.json` in a text editor
2. Modify the `system_prompt` for any style
3. Save the file
4. Restart the application

Your changes will be applied immediately.

---

## 📂 Project Structure

```
podcast-summarizer/
├── app.py                      # Main Streamlit application
├── requirements.txt            # Python dependencies
├── .env                        # Your API keys (DO NOT SHARE)
├── .env.example               # Template for API keys
├── .gitignore                 # Git ignore rules
├── README.md                  # Full documentation
├── SETUP_GUIDE.md             # This file
├── config/
│   └── prompts.json           # Summary style prompts (editable)
└── utils/
    ├── validators.py          # URL validation
    ├── transcript_fetcher.py  # YouTube/Spotify handling
    ├── speaker_parser.py      # Speaker identification
    └── summarizer.py          # Claude API integration
```

---

## 🔐 Security Best Practices

1. **Never share your `.env` file** - it contains your API keys
2. **Never commit `.env` to Git** - it's already in `.gitignore`
3. **Keep your API keys private** - treat them like passwords
4. **Rotate keys if compromised** - generate new ones immediately
5. **Set up spending limits** on your Anthropic account to control costs

---

## 🆘 Getting Help

### Resources

- **Full Documentation:** See `README.md` in the project folder
- **Anthropic Docs:** docs.anthropic.com
- **YouTube API Docs:** developers.google.com/youtube/v3
- **Streamlit Docs:** docs.streamlit.io

### Common Questions

**Q: Can I use this with Spotify podcasts?**
A: Yes, but it requires the YouTube API key to automatically find the YouTube version. Direct Spotify transcript access isn't available.

**Q: How long does it take to generate a summary?**
A: Typically 20-40 seconds for a 1-hour podcast.

**Q: Can I process multiple podcasts at once?**
A: Not in the current version. Process them one at a time.

**Q: Does this work offline?**
A: No, you need an internet connection to fetch transcripts and generate summaries.

**Q: What if I run out of API credits?**
A: Purchase more credits at console.anthropic.com. The app will show an error when credits run low.

---

## 🎉 You're All Set!

Congratulations! You now have a working podcast summarizer.

**Enjoy turning hours of podcasts into quick, actionable summaries!** 🚀

---

## 📊 Feature Checklist

✅ YouTube podcast support
✅ Spotify podcast support (with YouTube fallback)
✅ 8 customizable summary styles
✅ Automatic speaker identification
✅ Download summaries (Markdown & Text)
✅ Download full transcripts
✅ Beautiful web interface
✅ Cost-efficient Claude 3 Haiku model

---

## 🔮 Future Enhancements (Not Yet Available)

These features are planned for future versions:

- Manual transcript upload
- Whisper integration for local transcription
- Summary history with database
- PDF export
- Batch processing multiple podcasts
- Cloud deployment
- Multi-language support
- Custom timestamp extraction
- RSS feed support

---

**Version:** 1.0
**Last Updated:** January 2026
**Model:** Claude 3 Haiku

---

*Made with ❤️ using Streamlit, Anthropic Claude, and yt-dlp*
