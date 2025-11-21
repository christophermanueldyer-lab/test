"""URL validation utilities for podcast links."""
import re
from typing import Tuple, Optional


def validate_url(url: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validate and identify podcast URL type.

    Args:
        url: The URL to validate

    Returns:
        Tuple of (is_valid, platform, error_message)
        platform can be 'youtube' or 'spotify'
    """
    if not url or not isinstance(url, str):
        return False, None, "Please provide a valid URL"

    url = url.strip()

    # YouTube patterns
    youtube_patterns = [
        r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=[\w-]+',
        r'(?:https?://)?(?:www\.)?youtu\.be/[\w-]+',
        r'(?:https?://)?(?:www\.)?youtube\.com/embed/[\w-]+',
    ]

    for pattern in youtube_patterns:
        if re.match(pattern, url):
            return True, 'youtube', None

    # Spotify patterns
    spotify_patterns = [
        r'(?:https?://)?open\.spotify\.com/episode/[\w-]+',
        r'(?:https?://)?open\.spotify\.com/show/[\w-]+',
    ]

    for pattern in spotify_patterns:
        if re.match(pattern, url):
            return True, 'spotify', None

    # Invalid URL
    error_msg = """
    Invalid URL format. Please provide a valid YouTube or Spotify podcast URL.

    Examples:
    • YouTube: https://youtube.com/watch?v=xxxxx
    • YouTube: https://youtu.be/xxxxx
    • Spotify: https://open.spotify.com/episode/xxxxx
    """
    return False, None, error_msg


def extract_video_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from URL."""
    patterns = [
        r'(?:v=|/)([0-9A-Za-z_-]{11}).*',
        r'youtu\.be/([0-9A-Za-z_-]{11})',
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    return None


def extract_spotify_id(url: str) -> Optional[str]:
    """Extract Spotify episode/show ID from URL."""
    match = re.search(r'/(episode|show)/([a-zA-Z0-9]+)', url)
    if match:
        return match.group(2)
    return None
