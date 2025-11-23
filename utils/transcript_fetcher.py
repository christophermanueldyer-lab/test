"""Fetch transcripts from YouTube and Spotify."""
import os
from typing import Optional, Dict, Tuple
from youtube_transcript_api import YouTubeTranscriptApi
from googleapiclient.discovery import build
import requests
import re


class TranscriptFetcher:
    """Handle transcript fetching from various podcast platforms."""

    def __init__(self, youtube_api_key: Optional[str] = None):
        """
        Initialize the transcript fetcher.

        Args:
            youtube_api_key: Optional YouTube Data API key for better search
        """
        self.youtube_api_key = youtube_api_key

    def fetch_youtube_transcript(self, video_id: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Fetch transcript from YouTube video.

        Args:
            video_id: YouTube video ID

        Returns:
            Tuple of (success, data_dict, error_message)
            data_dict contains: transcript, title, description, duration
        """
        try:
            # Get transcript - try multiple approaches
            transcript_list = None

            # Try to get transcript with language preferences
            try:
                # First try getting any available transcript
                transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'en-US', 'en-GB'])
            except:
                # If that fails, try to get any available transcript
                try:
                    transcript_list_data = YouTubeTranscriptApi.list_transcripts(video_id)
                    # Try to find an English transcript (manual or auto-generated)
                    try:
                        transcript_list = transcript_list_data.find_transcript(['en', 'en-US', 'en-GB']).fetch()
                    except:
                        # Get the first available transcript
                        for transcript in transcript_list_data:
                            transcript_list = transcript.fetch()
                            break
                except Exception as e:
                    raise Exception(f"Could not fetch any transcript: {str(e)}")

            if not transcript_list:
                raise Exception("No transcripts available for this video")

            # Combine transcript text
            transcript_text = " ".join([entry['text'] for entry in transcript_list])

            # Get video metadata using YouTube API if available
            title = "Unknown Title"
            description = ""
            duration = 0

            if self.youtube_api_key:
                try:
                    youtube = build('youtube', 'v3', developerKey=self.youtube_api_key)
                    response = youtube.videos().list(
                        part='snippet,contentDetails',
                        id=video_id
                    ).execute()

                    if response['items']:
                        item = response['items'][0]
                        title = item['snippet']['title']
                        description = item['snippet']['description']

                        # Parse duration (PT1H30M15S format)
                        duration_str = item['contentDetails']['duration']
                        duration = self._parse_duration(duration_str)
                except Exception as e:
                    # Fallback: continue without metadata
                    pass

            return True, {
                'transcript': transcript_text,
                'title': title,
                'description': description,
                'duration': duration,
                'platform': 'youtube',
                'video_id': video_id
            }, None

        except Exception as e:
            error_msg = f"""
            ❌ Could not fetch transcript from YouTube.

            Possible reasons:
            • Video doesn't have captions/subtitles
            • Captions are disabled by the creator
            • Invalid video ID

            Error: {str(e)}

            Suggestions:
            • Check if the video has captions enabled
            • Try a different episode that has subtitles
            """
            return False, None, error_msg

    def fetch_spotify_metadata(self, episode_id: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Fetch metadata from Spotify episode.

        Note: Spotify doesn't provide transcript API, so this just gets metadata
        to help search YouTube.

        Args:
            episode_id: Spotify episode ID

        Returns:
            Tuple of (success, metadata_dict, error_message)
        """
        try:
            # Spotify Web API endpoint (public, no auth needed for basic metadata)
            # Note: This is a simplified approach. For production, use spotipy library with auth
            url = f"https://api.spotify.com/v1/episodes/{episode_id}"

            # Try to get public metadata
            # Note: This may require authentication in practice
            response = requests.get(url, timeout=10)

            if response.status_code == 200:
                data = response.json()
                return True, {
                    'title': data.get('name', 'Unknown'),
                    'description': data.get('description', ''),
                    'show_name': data.get('show', {}).get('name', ''),
                    'duration': data.get('duration_ms', 0) // 1000,  # Convert to seconds
                }, None
            else:
                # Fallback: Extract from embed page
                embed_url = f"https://open.spotify.com/embed/episode/{episode_id}"
                response = requests.get(embed_url, timeout=10)

                if response.status_code == 200:
                    # Try to parse title from HTML
                    title_match = re.search(r'<title>(.*?)</title>', response.text)
                    title = title_match.group(1) if title_match else "Unknown Episode"

                    return True, {
                        'title': title.replace(' - Spotify Podcasts', '').strip(),
                        'description': '',
                        'show_name': '',
                        'duration': 0,
                    }, None

                return False, None, "Could not fetch Spotify metadata"

        except Exception as e:
            return False, None, f"Error fetching Spotify data: {str(e)}"

    def search_youtube_for_episode(self, show_name: str, episode_title: str) -> Optional[str]:
        """
        Search YouTube for a podcast episode.

        Args:
            show_name: Name of the podcast show
            episode_title: Title of the episode

        Returns:
            YouTube video ID if found, None otherwise
        """
        if not self.youtube_api_key:
            return None

        try:
            youtube = build('youtube', 'v3', developerKey=self.youtube_api_key)

            # Construct search query
            query = f"{show_name} {episode_title}"

            # Search for videos
            search_response = youtube.search().list(
                q=query,
                part='id,snippet',
                maxResults=5,
                type='video'
            ).execute()

            # Return first result (best match)
            if search_response['items']:
                video_id = search_response['items'][0]['id']['videoId']
                return video_id

            return None

        except Exception as e:
            print(f"YouTube search error: {e}")
            return None

    def fetch_from_spotify_with_fallback(self, episode_id: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Try to get transcript for Spotify episode by searching YouTube.

        Args:
            episode_id: Spotify episode ID

        Returns:
            Tuple of (success, data_dict, error_message)
        """
        # Step 1: Get Spotify metadata
        success, metadata, error = self.fetch_spotify_metadata(episode_id)

        if not success:
            return False, None, error

        # Step 2: Search YouTube
        if not self.youtube_api_key:
            error_msg = """
            ❌ YouTube API key not configured.

            Spotify doesn't provide transcripts. To automatically find this episode on YouTube,
            please add a YouTube API key to your .env file.

            Alternatively, search YouTube manually for:
            "{}"

            Then use the YouTube URL instead.
            """.format(metadata.get('title', 'this episode'))
            return False, None, error_msg

        show_name = metadata.get('show_name', '')
        episode_title = metadata.get('title', '')

        video_id = self.search_youtube_for_episode(show_name, episode_title)

        if not video_id:
            error_msg = f"""
            ❌ Could not find this episode on YouTube automatically.

            Episode: {episode_title}
            Show: {show_name}

            Please:
            1. Search YouTube manually for this episode
            2. Use the YouTube URL instead
            """
            return False, None, error_msg

        # Step 3: Fetch transcript from YouTube
        success, transcript_data, error = self.fetch_youtube_transcript(video_id)

        if success:
            # Update metadata with Spotify info
            transcript_data['original_platform'] = 'spotify'
            transcript_data['spotify_title'] = episode_title
            transcript_data['show_name'] = show_name

        return success, transcript_data, error

    def _parse_duration(self, duration_str: str) -> int:
        """
        Parse YouTube duration format (PT1H30M15S) to seconds.

        Args:
            duration_str: Duration string from YouTube API

        Returns:
            Duration in seconds
        """
        hours = 0
        minutes = 0
        seconds = 0

        hours_match = re.search(r'(\d+)H', duration_str)
        minutes_match = re.search(r'(\d+)M', duration_str)
        seconds_match = re.search(r'(\d+)S', duration_str)

        if hours_match:
            hours = int(hours_match.group(1))
        if minutes_match:
            minutes = int(minutes_match.group(1))
        if seconds_match:
            seconds = int(seconds_match.group(1))

        return hours * 3600 + minutes * 60 + seconds
