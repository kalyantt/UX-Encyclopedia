"""Render offline two-voice editorial podcast drafts without a playback API.

Draft audio is kept separate from approved episode versions. Re-running skips
valid outputs, so a long course render can resume after interruption.
"""

import argparse
import json
import os
import re
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro

SPEED = {"quiet": 0.90, "warm": 0.94, "clear": 0.98, "curious": 1.00,
         "thinking": 0.94, "surprised": 1.02, "concerned": 0.91, "hopeful": 0.97}


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


ROOT = Path(__file__).resolve().parent
SCRIPTS = ROOT / "podcast-scripts" / "editorial-drafts"
OUTPUT = ROOT / "assets" / "audio" / "editorial-drafts"
WAV = ROOT.parent.parent / "work" / f"podcast-render-{os.getpid()}.wav"


def render(model, script_path, ffmpeg):
    script = json.loads(script_path.read_text())
    lesson = script["lesson"]
    target = OUTPUT / f"{lesson}-editorial-draft.m4a"
    if target.exists() and target.stat().st_size > 10_000:
        return "skipped", target
    samples = []
    sample_rate = 24_000
    previous_act = None
    for turn in script["turns"]:
        if previous_act and turn.get("act") and turn["act"] != previous_act:
            samples.append(np.zeros(int(sample_rate * 0.7), dtype=np.float32))
        previous_act = turn.get("act") or previous_act
        voice = script["voices"][turn["speaker"]]
        pieces = list(chunks(turn["text"]))
        for position, piece in enumerate(pieces):
            audio, sample_rate = model.create(
                piece,
                voice=voice,
                speed=SPEED.get(turn.get("mood", "warm"), 0.94),
                lang="en-us",
            )
            samples.append(audio)
            samples.append(np.zeros(int(sample_rate * (0.12 if position < len(pieces) - 1 else 0.34)), dtype=np.float32))
    WAV.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    sf.write(WAV, np.concatenate(samples), sample_rate, subtype="PCM_16")
    subprocess.run([
        ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(WAV), "-c:a", "aac", "-b:a", "48k", str(target),
    ], check=True)
    return "rendered", target


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--voices", type=Path, required=True)
    parser.add_argument("--start-id", default="UX-001")
    parser.add_argument("--end-id", default="UX-999")
    parser.add_argument("--threads", type=int, default=0)
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()
    files = [path for path in sorted(SCRIPTS.glob("UX-*-editorial-draft.json")) if args.start_id <= path.name[:6] <= args.end_id]
    if args.limit:
        files = files[:args.limit]
    options = ort.SessionOptions()
    if args.threads:
        options.intra_op_num_threads = args.threads
        options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(args.model), sess_options=options, providers=["CPUExecutionProvider"])
    model = Kokoro.from_session(session, str(args.voices))
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    for number, path in enumerate(files, 1):
        try:
            action, target = render(model, path, ffmpeg)
            print(f"[{number}/{len(files)}] {action}: {target.name} ({target.stat().st_size:,} bytes)", flush=True)
        except Exception as error:
            print(f"[{number}/{len(files)}] ERROR: {path.name}: {error}", flush=True)
            raise


if __name__ == "__main__":
    main()
