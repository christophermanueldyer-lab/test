"""OpenAI integration for podcast summarization."""
import json
import os
from typing import Dict, Optional
from openai import OpenAI


class PodcastSummarizer:
    """Generate podcast summaries using OpenAI API."""

    def __init__(self, api_key: str, prompts_file: str = "config/prompts.json"):
        """
        Initialize the summarizer.

        Args:
            api_key: OpenAI API key
            prompts_file: Path to prompts configuration file
        """
        self.client = OpenAI(api_key=api_key)
        self.prompts = self._load_prompts(prompts_file)

    def _load_prompts(self, prompts_file: str) -> Dict:
        """Load summary style prompts from JSON file."""
        try:
            with open(prompts_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading prompts: {e}")
            return {}

    def generate_summary(
        self,
        transcript: str,
        title: str,
        description: str,
        style: str,
        speakers_info: str,
        duration: int = 0
    ) -> tuple[bool, Optional[str], Optional[str]]:
        """
        Generate a summary of the podcast.

        Args:
            transcript: Full transcript text
            title: Podcast title
            description: Podcast description
            style: Summary style key (e.g., 'business_strategy')
            speakers_info: Formatted speaker information
            duration: Duration in seconds

        Returns:
            Tuple of (success, summary_text, error_message)
        """
        try:
            # Get prompt configuration
            if style not in self.prompts:
                return False, None, f"Invalid style: {style}"

            prompt_config = self.prompts[style]
            system_prompt = prompt_config['system_prompt']

            # Format duration
            duration_str = self._format_duration(duration)

            # Build user prompt
            user_prompt = f"""
Please summarize the following podcast episode.

**Podcast Title:** {title}
**Duration:** {duration_str}
**Description:** {description}

**Speakers:** {speakers_info}

**Instructions:**
1. Create 4-6 bullet points highlighting the KEY TAKEAWAYS at the top
2. Break down the conversation into major sections/topics
3. For each section:
   - Provide a clear section title and approximate timestamp if possible
   - Write a 2-3 sentence summary
   - Include 1-2 key quotes that underscore important points
   - Clearly attribute all points and quotes to the specific speaker who made them
4. Use markdown formatting for readability

**Output Format:**
```
# [Podcast Title]
**Duration:** [duration] | **Style:** {prompt_config['name']}

## 🎯 Key Takeaways
- [Takeaway 1]
- [Takeaway 2]
...

## 📝 Detailed Summary

### Section 1: [Topic Name]
**Summary:** [2-3 sentence overview]

**Key Quote:**
> "[Quote]" - [Speaker Name]

**Main Points:**
- [Point by Speaker]
- [Point by Speaker]

---

[Continue for each section...]
```

**Transcript:**
{transcript[:15000]}
"""

            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Using GPT-4o-mini for cost efficiency
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=2500
            )

            summary = response.choices[0].message.content

            return True, summary, None

        except Exception as e:
            error_msg = f"""
            ❌ Error generating summary.

            Error: {str(e)}

            Possible reasons:
            • Invalid or expired OpenAI API key
            • API rate limit reached
            • Network connection issue

            Please check your API key and try again.
            """
            return False, None, error_msg

    def _format_duration(self, seconds: int) -> str:
        """Format duration in seconds to human-readable string."""
        if seconds == 0:
            return "Unknown"

        hours = seconds // 3600
        minutes = (seconds % 3600) // 60

        if hours > 0:
            return f"{hours}h {minutes}m"
        else:
            return f"{minutes}m"

    def get_available_styles(self) -> Dict[str, str]:
        """
        Get available summary styles.

        Returns:
            Dictionary mapping style keys to display names
        """
        return {
            key: config['name']
            for key, config in self.prompts.items()
        }
