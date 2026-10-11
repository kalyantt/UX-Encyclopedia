"""Produce a two-voice episode locally from an editorially reviewed script.

This is intentionally not an automatic lesson-to-dialogue rewriter: each script
needs a meaning-preservation review before generation. Kokoro runs offline.
"""

import argparse
import json
import re
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro


SPEED = {
    "quiet": 0.90,
    "warm": 0.94,
    "clear": 0.98,
    "curious": 1.00,
    "thinking": 0.94,
    "surprised": 1.02,
    "concerned": 0.91,
    "hopeful": 0.97,
}


def chunks(text, limit=270):
    pieces = re.split(r"(?<=[.!?])\s+(?=[A-Z“])", text.strip())
    chunk = ""
    for piece in pieces:
        if len(chunk) + len(piece) + 1 <= limit:
            chunk = f"{chunk} {piece}".strip()
            continue
        if chunk:
            yield chunk
        while len(piece) > limit:
            cut = piece.rfind(" ", 0, limit)
            if cut < 1:
                cut = limit
            yield piece[:cut].strip()
            piece = piece[cut:].strip()
        chunk = piece
    if chunk:
        yield chunk


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("script", type=Path)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--voices", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--max-turns", type=int, default=0)
    args = parser.parse_args()

    episode = json.loads(args.script.read_text())
    turns = episode["turns"][: args.max_turns or None]
    model = Kokoro(str(args.model), str(args.voices))
    samples = []
    sample_rate = None
    last_act = None
    for turn in turns:
        if last_act is not None and turn.get("act") != last_act and turn.get("act"):
            samples.append(np.zeros(int(sample_rate * 0.85), dtype=np.float32))
        last_act = turn.get("act") or last_act
        voice = episode["voices"][turn["speaker"]]
        pieces = list(chunks(turn["text"]))
        for number, piece in enumerate(pieces):
            audio, sample_rate = model.create(piece, voice=voice, speed=SPEED[turn.get("mood", "warm")], lang="en-us")
            samples.append(audio)
            samples.append(np.zeros(int(sample_rate * (0.12 if number < len(pieces) - 1 else 0.38)), dtype=np.float32))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    sf.write(args.output, np.concatenate(samples), sample_rate, subtype="PCM_16")
    print(f"Wrote {args.output} ({len(turns)} turns, {sum(len(t['text'].split()) for t in turns)} words)")


if __name__ == "__main__":
    main()
