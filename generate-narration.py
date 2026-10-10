"""Render a lesson with the local Kokoro model. No text leaves this computer.

Example:
  python generate-narration.py UX-001 --voice af_heart --max-words 95 \
    --model /path/kokoro-v1.0.onnx --voices /path/voices-v1.0.bin \
    --output /path/sample.wav
"""

import argparse
import base64
import gzip
import json
import re
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro


def lesson_text(lesson_id):
    source = (Path(__file__).parent / "course-204-data.js").read_text()
    encoded = re.search(r'course204Gzip="([A-Za-z0-9+/=]+)"', source)
    if not encoded:
        raise ValueError("Course data is missing")
    data = json.loads(gzip.decompress(base64.b64decode(encoded.group(1))))
    lesson = data["reading"].get(lesson_id)
    if not lesson:
        raise ValueError(f"Unknown lesson: {lesson_id}")
    title = next(title for module in data["index"].values() for key, title in module["lessons"] if key == lesson_id)
    sections = [(title, lesson["opening"])] + [(section["label"], section["body"]) for section in lesson["sections"]]
    for heading, body in sections:
        body = re.sub(r"\[([^]]+)\]\([^)]+\)", r"\1", body)
        body = re.sub(r"(?m)^\s*\|.*$", "", body)
        body = re.sub(r"(?m)^\s*#{1,3}\s*", "", body)
        body = re.sub(r"(?m)^\s*[-*]\s+", "", body)
        body = re.sub(r"[*_`>]", "", body)
        body = re.sub(r"\s+", " ", body).strip()
        yield f"{heading}. {body}"


def sentences(text, limit=280):
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z“])", text)
    chunk = ""
    for part in parts:
        if len(chunk) + len(part) + 1 <= limit:
            chunk = f"{chunk} {part}".strip()
            continue
        if chunk:
            yield chunk
        while len(part) > limit:
            cut = part.rfind(" ", 0, limit)
            if cut < 1:
                cut = limit
            yield part[:cut].strip()
            part = part[cut:].strip()
        chunk = part
    if chunk:
        yield chunk


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("lesson")
    parser.add_argument("--voice", default="af_heart")
    parser.add_argument("--max-words", type=int, default=0, help="Limit a preview; 0 renders the full lesson")
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--voices", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    script = " ".join(lesson_text(args.lesson))
    if args.max_words:
        script = " ".join(script.split()[: args.max_words])
        script = re.sub(r"\s+\S*$", "", script).rstrip(" ,;:") + "."

    model = Kokoro(str(args.model), str(args.voices))
    audio = []
    sample_rate = None
    for part in sentences(script):
        piece, sample_rate = model.create(part, voice=args.voice, speed=0.94, lang="en-us")
        audio.append(piece)
        audio.append(np.zeros(int(sample_rate * 0.25), dtype=np.float32))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    sf.write(args.output, np.concatenate(audio), sample_rate, subtype="PCM_16")
    print(f"Wrote {args.output} ({len(script.split())} words, {len(audio) // 2} chunks)")


if __name__ == "__main__":
    main()
