#!/usr/bin/env python3
"""Generate a single MP3 of golf warmup audio cues from routine.json."""

import json
import math
import struct
import subprocess
import sys
import tarfile
import tempfile
import urllib.request
import wave
from pathlib import Path

SAMPLE_RATE = 16000
SAMPLE_WIDTH = 2
CHANNELS = 1

HERE = Path(__file__).resolve().parent
ROUTINE = HERE / "routine.json"
OUT_WAV = HERE / "warmup.wav"
OUT_MP3 = HERE / "warmup.mp3"
VOICE_MODEL = HERE / "voices" / "en-us-lessac-medium.onnx"
VOICE_URL = (
    "https://github.com/rhasspy/piper/releases/download/v0.0.2/"
    "voice-en-us-lessac-medium.tar.gz"
)


def ensure_voice() -> None:
    """Download and extract the Piper voice model if it's not already present."""
    if VOICE_MODEL.exists() and VOICE_MODEL.with_suffix(".onnx.json").exists():
        return
    VOICE_MODEL.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading voice model (~60 MB) from {VOICE_URL}...", flush=True)
    with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as tmp:
        tar_path = tmp.name
    try:
        urllib.request.urlretrieve(VOICE_URL, tar_path)
        with tarfile.open(tar_path, "r:gz") as tar:
            tar.extractall(VOICE_MODEL.parent)
    finally:
        Path(tar_path).unlink(missing_ok=True)


def synth_speech(text: str) -> bytes:
    """Render `text` to PCM bytes using Piper neural TTS at our target format."""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        path = tmp.name
    try:
        subprocess.run(
            ["piper", "--model", str(VOICE_MODEL), "--output_file", path],
            input=text,
            text=True,
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        with wave.open(path, "rb") as wf:
            assert wf.getframerate() == SAMPLE_RATE, f"got {wf.getframerate()}"
            assert wf.getsampwidth() == SAMPLE_WIDTH
            assert wf.getnchannels() == CHANNELS
            return wf.readframes(wf.getnframes())
    finally:
        Path(path).unlink(missing_ok=True)


def make_chime(freq: float = 880.0, duration_s: float = 0.35) -> bytes:
    """Soft sine-wave chime with quick attack and exponential decay."""
    n = int(duration_s * SAMPLE_RATE)
    attack = int(0.01 * SAMPLE_RATE)
    out = bytearray()
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.exp(-4.0 * t / duration_s)
        if i < attack:
            env *= i / attack
        val = math.sin(2 * math.pi * freq * t) * env * 0.55
        out += struct.pack("<h", int(val * 32767))
    return bytes(out)


def silence(duration_s: float) -> bytes:
    n = max(0, int(duration_s * SAMPLE_RATE))
    return b"\x00\x00" * n


def samples_to_seconds(b: bytes) -> float:
    return (len(b) / SAMPLE_WIDTH) / SAMPLE_RATE


def build_interval(ex: dict) -> bytes:
    """Build one fixed-length interval: announce -> [switch] -> countdown ending exactly at duration."""
    duration_samples = int(ex["duration"] * SAMPLE_RATE)
    parts: list[bytes] = []
    pos = 0  # in samples

    ann = synth_speech(ex["announce"])
    parts.append(ann)
    pos += len(ann) // SAMPLE_WIDTH

    if "switch_at" in ex:
        switch_samples = int(ex["switch_at"] * SAMPLE_RATE)
        if pos < switch_samples:
            gap = switch_samples - pos
            parts.append(b"\x00\x00" * gap)
            pos = switch_samples
        sw = synth_speech("Switch sides.")
        parts.append(sw)
        pos += len(sw) // SAMPLE_WIDTH

    countdown = synth_speech("Three. Two. One.")
    cd_samples = len(countdown) // SAMPLE_WIDTH
    cd_start = duration_samples - cd_samples
    if pos < cd_start:
        gap = cd_start - pos
        parts.append(b"\x00\x00" * gap)
        pos = cd_start
    parts.append(countdown)
    pos += cd_samples

    if pos < duration_samples:
        parts.append(b"\x00\x00" * (duration_samples - pos))
    elif pos > duration_samples:
        # Trim PCM to exact length (frames are 2 bytes each, mono).
        joined = b"".join(parts)[: duration_samples * SAMPLE_WIDTH]
        return joined

    return b"".join(parts)


def build() -> bytes:
    routine = json.loads(ROUTINE.read_text())
    chime = make_chime()

    pieces: list[bytes] = []

    pieces.append(synth_speech(routine["intro"]))
    pieces.append(silence(0.3))
    pieces.append(chime)
    pieces.append(silence(0.4))

    for i, ex in enumerate(routine["exercises"]):
        if i > 0:
            pieces.append(chime)
            pieces.append(silence(0.2))
        pieces.append(build_interval(ex))

    pieces.append(chime)
    pieces.append(silence(0.3))
    pieces.append(synth_speech(routine["outro"]))

    return b"".join(pieces)


def write_wav(pcm: bytes, path: Path) -> None:
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(SAMPLE_WIDTH)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm)


def encode_mp3(wav_path: Path, mp3_path: Path) -> None:
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(wav_path),
            "-codec:a", "libmp3lame",
            "-b:a", "64k",
            "-ac", "1",
            str(mp3_path),
        ],
        check=True,
    )


def main() -> int:
    ensure_voice()
    print("Synthesizing cues...", flush=True)
    pcm = build()
    duration_s = samples_to_seconds(pcm)
    mins, secs = divmod(int(round(duration_s)), 60)
    print(f"Total audio: {mins}:{secs:02d} ({duration_s:.1f}s)")

    write_wav(pcm, OUT_WAV)
    print(f"Wrote {OUT_WAV} ({OUT_WAV.stat().st_size / 1024:.0f} KB)")

    encode_mp3(OUT_WAV, OUT_MP3)
    print(f"Wrote {OUT_MP3} ({OUT_MP3.stat().st_size / 1024:.0f} KB)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
