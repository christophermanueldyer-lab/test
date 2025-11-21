"""Extract speaker names from podcast metadata."""
import re
from typing import List, Dict


def extract_speakers(title: str, description: str = "") -> Dict[str, List[str]]:
    """
    Extract host and guest names from podcast title and description.

    Args:
        title: Podcast episode title
        description: Podcast episode description

    Returns:
        Dictionary with 'hosts' and 'guests' lists
    """
    speakers = {
        'hosts': [],
        'guests': []
    }

    combined_text = f"{title} {description}"

    # Patterns for hosts
    host_patterns = [
        r'(?:hosted by|host:|with host)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        r'(?:ft\.|featuring|with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
    ]

    # Patterns for guests
    guest_patterns = [
        r'(?:guest|featuring|ft\.|with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:joins|discusses|talks about)',
        r'(?:interview with|conversation with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
    ]

    # Extract hosts
    for pattern in host_patterns:
        matches = re.findall(pattern, combined_text, re.IGNORECASE)
        for match in matches:
            name = match.strip()
            if name and len(name) > 2 and name not in speakers['hosts']:
                speakers['hosts'].append(name)

    # Extract guests
    for pattern in guest_patterns:
        matches = re.findall(pattern, combined_text, re.IGNORECASE)
        for match in matches:
            name = match.strip()
            if name and len(name) > 2 and name not in speakers['guests'] and name not in speakers['hosts']:
                speakers['guests'].append(name)

    return speakers


def format_speakers_for_prompt(speakers: Dict[str, List[str]]) -> str:
    """
    Format speaker information for inclusion in summarization prompt.

    Args:
        speakers: Dictionary with hosts and guests

    Returns:
        Formatted string describing speakers
    """
    parts = []

    if speakers['hosts']:
        hosts = ", ".join(speakers['hosts'])
        parts.append(f"Host(s): {hosts}")

    if speakers['guests']:
        guests = ", ".join(speakers['guests'])
        parts.append(f"Guest(s): {guests}")

    if parts:
        return "Identified speakers - " + " | ".join(parts)
    else:
        return "Speakers could not be identified from metadata. Use 'Speaker 1', 'Speaker 2', etc."


def get_speaker_labels(speakers: Dict[str, List[str]]) -> List[str]:
    """
    Get list of speaker labels to use in summary.

    Args:
        speakers: Dictionary with hosts and guests

    Returns:
        List of speaker names/labels
    """
    labels = []

    # Add hosts
    for host in speakers['hosts']:
        labels.append(f"{host} (Host)")

    # Add guests
    for guest in speakers['guests']:
        labels.append(guest)

    # Fallback to generic labels
    if not labels:
        labels = ["Speaker 1", "Speaker 2", "Speaker 3"]

    return labels
