# 🎙️ Podcast Summarizer

An AI-powered web application that automatically generates summaries of podcasts from YouTube and Spotify URLs. Get key takeaways, detailed breakdowns, and important quotes from your favorite podcasts in seconds.

## ✨ Features

- **Multi-Platform Support**: Works with YouTube and Spotify podcast URLs
- **Automatic Transcript Extraction**: Fetches transcripts from YouTube (with Spotify fallback)
- **8 Summary Styles**: Choose from different focus areas (Business, Politics, Fitness, etc.)
- **Speaker Identification**: Automatically identifies and attributes quotes to speakers
- **Beautiful Web Interface**: Easy-to-use Streamlit interface
- **Download Summaries**: Export as Markdown or Text files
- **Customizable Prompts**: Edit summary styles via `config/prompts.json`

## 🎯 Summary Styles

1. **Business Strategy** - Market insights, business models, revenue strategies
2. **Leadership & Management** - Team building, decision-making, organizational culture
3. **Political Analysis** - Policy positions, political arguments, societal implications
4. **Cultural Commentary** - Cultural trends, social issues, philosophical perspectives
5. **Health & Fitness** - Exercise techniques, nutrition advice, wellness practices
6. **Science & Research** - Studies cited, research findings, evidence-based conclusions
7. **Personal Development** - Self-improvement, habits, mindset, motivation
8. **Quick Overview** - Balanced summary of all major points

## 📋 Prerequisites

- **Python 3.9+** installed on your computer
- **OpenAI API Key** (required) - See setup instructions below
- **YouTube Data API Key** (optional but recommended) - Improves Spotify fallback

### Getting Your API Keys

#### OpenAI API Key (Required)

⚠️ **Important**: ChatGPT Plus subscription does NOT include API access. You need a separate API account.

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in (separate from chat.openai.com)
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (it starts with `sk-...`)
6. **Pricing**: Pay-as-you-go, typically $0.01-0.03 per podcast summary
7. **Free Credit**: New accounts get $5 free credit

#### YouTube Data API Key (Optional)

This improves Spotify podcast support by enabling automatic YouTube search.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable **YouTube Data API v3**
4. Navigate to **Credentials**
5. Click **Create Credentials** → **API Key**
6. Copy the API key
7. **Pricing**: 100% FREE (10,000 queries/day quota)

## 🚀 Installation & Setup

### Step 1: Download the Project

If you haven't already, download or clone this repository to your computer.

### Step 2: Install Python

1. Check if Python is installed:
   ```bash
   python --version
   ```
   or
   ```bash
   python3 --version
   ```

2. If not installed, download from [python.org](https://www.python.org/downloads/)
   - **Windows**: Download the installer and check "Add Python to PATH"
   - **Mac**: Use the installer or `brew install python`
   - **Linux**: Usually pre-installed, or use `sudo apt install python3`

### Step 3: Set Up Virtual Environment

Open Terminal (Mac/Linux) or Command Prompt (Windows) and navigate to the project directory:

```bash
cd path/to/podcast-summarizer
```

Create a virtual environment:

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

You should see `(venv)` appear in your terminal prompt.

### Step 4: Install Dependencies

With the virtual environment activated, install required packages:

```bash
pip install -r requirements.txt
```

This will install:
- Streamlit (web interface)
- OpenAI (AI summarization)
- YouTube Transcript API (transcript fetching)
- Google API Client (YouTube search)
- And other dependencies

### Step 5: Configure API Keys

1. Copy the example environment file:

   **Mac/Linux:**
   ```bash
   cp .env.example .env
   ```

   **Windows:**
   ```bash
   copy .env.example .env
   ```

2. Open the `.env` file in a text editor (Notepad, TextEdit, VS Code, etc.)

3. Add your API keys:

   ```env
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   YOUTUBE_API_KEY=your-youtube-api-key-here
   ```

4. Save the file

⚠️ **Important**: Never share your `.env` file or commit it to GitHub. It's already in `.gitignore`.

## 🎬 Running the Application

1. Make sure your virtual environment is activated (you should see `(venv)` in terminal)

2. Run the Streamlit app:

   ```bash
   streamlit run app.py
   ```

3. Your default web browser will automatically open to `http://localhost:8501`

4. If it doesn't open automatically, navigate to the URL shown in the terminal

## 📖 How to Use

1. **Enter a Podcast URL**
   - YouTube: `https://youtube.com/watch?v=xxxxx`
   - Spotify: `https://open.spotify.com/episode/xxxxx`

2. **Select a Summary Style**
   - Choose from the 8 available styles based on podcast content

3. **Click "Generate Summary"**
   - The app will:
     - Fetch the transcript (or search YouTube if Spotify)
     - Identify speakers
     - Generate AI summary
     - Display results

4. **Download Your Summary**
   - Click "Download Markdown" or "Download Text"
   - Summary is saved to your Downloads folder

## 🎨 Customizing Summary Styles

You can customize how summaries are generated by editing `config/prompts.json`.

1. Open `config/prompts.json` in a text editor
2. Modify the `system_prompt` for any style
3. Save the file
4. Restart the application
5. Your changes will be applied immediately

Example:
```json
{
  "business_strategy": {
    "name": "Business Strategy",
    "system_prompt": "You are an expert business analyst... [your custom instructions]",
    "emphasis": ["business models", "revenue strategies"]
  }
}
```

## 🔧 Troubleshooting

### "OpenAI API Key not found"
- Make sure you've created a `.env` file (not `.env.example`)
- Check that your API key is correctly pasted
- Ensure there are no extra spaces or quotes around the key

### "Could not fetch transcript from YouTube"
- The video may not have captions/subtitles enabled
- Try a different episode with captions
- Check if the URL is correct

### "Could not find episode on YouTube"
- Add a YouTube API key to enable better search
- Or manually search YouTube and use that URL instead
- Some Spotify exclusives may not be on YouTube

### "Invalid or expired OpenAI API key"
- Verify your key at [platform.openai.com](https://platform.openai.com)
- Check if you have billing enabled
- Make sure you have API credits available

### "Module not found" errors
- Make sure your virtual environment is activated
- Run `pip install -r requirements.txt` again

## 💰 Cost Estimates

### OpenAI API
- Model used: GPT-4o-mini (cost-efficient)
- Average cost per summary: **$0.01 - 0.03**
- For a 1-hour podcast: typically **~$0.02**
- $5 free credit = approximately 150-500 summaries

### YouTube Data API
- **100% FREE**
- 10,000 queries/day quota (more than enough)

## 📝 Example Output

```markdown
# The Tim Ferriss Show - Episode #123
**Duration:** 1h 45m | **Style:** Business Strategy

## 🎯 Key Takeaways
- Focus on high-leverage activities that drive 80% of results
- Build systems, not just goals, for sustainable growth
- Validate ideas quickly with minimum viable products
- Leverage other people's audiences through partnerships

## 📝 Detailed Summary

### Section 1: The 80/20 Principle in Business

**Summary:** The conversation explores how the Pareto Principle applies
to modern entrepreneurship, with specific examples from bootstrapped
startups that achieved rapid growth.

**Key Quote:**
> "Most entrepreneurs confuse motion with progress. Focus on the vital
few activities that actually move the needle." - Tim Ferriss

**Main Points:**
- Tim Ferriss emphasizes identifying the 20% of activities that drive 80% of revenue
- Guest shares case study of cutting 50% of product line to increase profits by 40%
- Discussion of how to ruthlessly prioritize in the early stages

...
```

## 🚀 V2 Future Enhancements

Planned features for future versions:
- Manual transcript upload
- Whisper integration for local transcription
- Summary history with database
- Export to PDF format
- Batch processing multiple podcasts
- Cloud deployment guide
- Multiple language support
- Custom timestamp extraction
- Podcast RSS feed support

## 🤝 Contributing

This is a personal project, but suggestions are welcome! If you encounter bugs or have feature requests, please create an issue.

## 📄 License

This project is open source and available for personal use.

## 🙏 Acknowledgments

Built with:
- [Streamlit](https://streamlit.io) - Web framework
- [OpenAI](https://openai.com) - AI summarization
- [YouTube Transcript API](https://github.com/jdepoix/youtube-transcript-api) - Transcript extraction
- [Google YouTube Data API](https://developers.google.com/youtube/v3) - Video search

---

**Need Help?** Check the troubleshooting section above or review the error messages in the app carefully.

**Enjoy your podcast summaries! 🎉**
