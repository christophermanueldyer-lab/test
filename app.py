"""Podcast Summarizer - Streamlit Web Application."""
import os
import streamlit as st
from dotenv import load_dotenv

from utils.validators import validate_url, extract_video_id, extract_spotify_id
from utils.transcript_fetcher import TranscriptFetcher
from utils.speaker_parser import extract_speakers, format_speakers_for_prompt
from utils.summarizer import PodcastSummarizer

# Load environment variables
load_dotenv()

# Page configuration
st.set_page_config(
    page_title="Podcast Summarizer",
    page_icon="🎙️",
    layout="wide"
)

# Custom CSS for better styling
st.markdown("""
    <style>
    .main-header {
        font-size: 3rem;
        font-weight: bold;
        text-align: center;
        margin-bottom: 0.5rem;
    }
    .sub-header {
        text-align: center;
        color: #666;
        margin-bottom: 2rem;
    }
    .stButton>button {
        width: 100%;
        background-color: #FF4B4B;
        color: white;
        font-weight: bold;
        padding: 0.75rem;
        border-radius: 0.5rem;
    }
    .summary-container {
        background-color: #f0f2f6;
        padding: 2rem;
        border-radius: 1rem;
        margin-top: 2rem;
    }
    </style>
""", unsafe_allow_html=True)


def main():
    """Main application function."""

    # Header
    st.markdown('<div class="main-header">🎙️ Podcast Summarizer</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="sub-header">Get AI-powered summaries of your favorite podcasts</div>',
        unsafe_allow_html=True
    )

    # Check for API keys
    anthropic_key = os.getenv('ANTHROPIC_API_KEY')
    youtube_key = os.getenv('YOUTUBE_API_KEY')

    if not anthropic_key:
        st.error("""
        ⚠️ **Anthropic API Key not found!**

        Please:
        1. Copy `.env.example` to `.env`
        2. Add your Anthropic API key to the `.env` file
        3. Restart the application

        Get your API key at: https://console.anthropic.com/settings/keys
        """)
        return

    # Initialize session state
    if 'summary' not in st.session_state:
        st.session_state.summary = None
    if 'podcast_title' not in st.session_state:
        st.session_state.podcast_title = None

    # Create two columns for input
    col1, col2 = st.columns([2, 1])

    with col1:
        podcast_url = st.text_input(
            "Podcast URL",
            placeholder="https://youtube.com/watch?v=... or https://open.spotify.com/episode/...",
            help="Enter a YouTube or Spotify podcast URL"
        )

    with col2:
        # Get available styles
        summarizer = PodcastSummarizer(anthropic_key)
        styles = summarizer.get_available_styles()

        # Create mapping for dropdown
        style_options = list(styles.values())
        style_keys = list(styles.keys())

        selected_style_name = st.selectbox(
            "Summary Style",
            options=style_options,
            help="Choose the focus area for your summary"
        )

        # Get the key for the selected style
        selected_style = style_keys[style_options.index(selected_style_name)]

    # Generate button
    if st.button("📊 Generate Summary", type="primary"):
        if not podcast_url:
            st.warning("⚠️ Please enter a podcast URL")
            return

        # Validate URL
        is_valid, platform, error = validate_url(podcast_url)

        if not is_valid:
            st.error(error)
            return

        # Show progress
        with st.spinner("Processing your podcast..."):
            try:
                # Initialize fetcher
                fetcher = TranscriptFetcher(youtube_api_key=youtube_key)

                # Fetch transcript based on platform
                if platform == 'youtube':
                    video_id = extract_video_id(podcast_url)
                    if not video_id:
                        st.error("❌ Could not extract video ID from URL")
                        return

                    st.info("📥 Fetching YouTube transcript...")
                    success, data, error_msg = fetcher.fetch_youtube_transcript(video_id)

                elif platform == 'spotify':
                    episode_id = extract_spotify_id(podcast_url)
                    if not episode_id:
                        st.error("❌ Could not extract episode ID from URL")
                        return

                    st.info("🔍 Spotify detected. Searching for YouTube version...")
                    success, data, error_msg = fetcher.fetch_from_spotify_with_fallback(episode_id)

                    if success:
                        st.success(f"✅ Found on YouTube! Using transcript from video.")

                else:
                    st.error("❌ Unsupported platform")
                    return

                # Check if fetch was successful
                if not success:
                    st.error(error_msg)
                    return

                # Extract speakers
                st.info("🎭 Identifying speakers...")
                speakers = extract_speakers(data['title'], data['description'])
                speakers_info = format_speakers_for_prompt(speakers)

                # Generate summary
                st.info(f"✨ Generating {selected_style_name} summary...")
                success, summary, error_msg = summarizer.generate_summary(
                    transcript=data['transcript'],
                    title=data['title'],
                    description=data['description'],
                    style=selected_style,
                    speakers_info=speakers_info,
                    duration=data.get('duration', 0)
                )

                if not success:
                    st.error(error_msg)
                    return

                # Store in session state
                st.session_state.summary = summary
                st.session_state.podcast_title = data['title']

                st.success("✅ Summary generated successfully!")

            except Exception as e:
                st.error(f"❌ An error occurred: {str(e)}")
                return

    # Display summary if available
    if st.session_state.summary:
        st.markdown("---")

        # Create columns for download buttons
        col1, col2, col3 = st.columns([1, 1, 2])

        with col1:
            # Download as markdown
            st.download_button(
                label="⬇️ Download Markdown",
                data=st.session_state.summary,
                file_name=f"{st.session_state.podcast_title[:50]}_summary.md",
                mime="text/markdown"
            )

        with col2:
            # Download as text
            st.download_button(
                label="⬇️ Download Text",
                data=st.session_state.summary,
                file_name=f"{st.session_state.podcast_title[:50]}_summary.txt",
                mime="text/plain"
            )

        # Display the summary
        st.markdown('<div class="summary-container">', unsafe_allow_html=True)
        st.markdown(st.session_state.summary)
        st.markdown('</div>', unsafe_allow_html=True)

    # Footer
    st.markdown("---")
    st.markdown("""
    <div style="text-align: center; color: #666; font-size: 0.9rem;">
        Made with ❤️ using Streamlit and OpenAI |
        <a href="https://github.com" target="_blank">View on GitHub</a>
    </div>
    """, unsafe_allow_html=True)


if __name__ == "__main__":
    main()
