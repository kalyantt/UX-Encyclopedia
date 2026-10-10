"""Render an editorially reviewed podcast script with local Chatterbox Nano.

Each turn is cached outside the repository, so a failed run can resume without
regenerating completed speech. The website receives only the final audio.
"""

import argparse
import json
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from chatterbox.tts_turbo import ChatterboxTurboTTS


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("script", type=Path)
    parser.add_argument("--references", type=Path, required=True)
    parser.add_argument("--cache", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    episode = json.loads(args.script.read_text())
    turns = episode["turns"]
    if {turn["speaker"] for turn in turns} != {"alex", "guide"}:
        raise ValueError("Episode must contain exactly Alex and Guide")
    args.cache.mkdir(parents=True, exist_ok=True)
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"Loading local voice model on {device}", flush=True)
    model = ChatterboxTurboTTS.from_pretrained(device=device, nano=True)
    audio_parts = []
    previous_act = None
    for number, turn in enumerate(turns, 1):
        path = args.cache / f"{number:03d}-{turn['speaker']}.wav"
        if path.exists():
            audio, rate = sf.read(path, dtype="float32")
        else:
            print(f"Rendering {number}/{len(turns)}: {turn['speaker']}", flush=True)
            generated = model.generate(
                turn["text"],
                audio_prompt_path=str(args.references / f"{turn['speaker']}.wav"),
            )
            audio = generated.squeeze().cpu().numpy().astype("float32")
            rate = model.sr
            sf.write(path, audio, rate, subtype="PCM_16")
        if rate != model.sr:
            raise ValueError(f"Unexpected rate in {path}")
        if turn.get("act") and previous_act is not None:
            audio_parts.append(np.zeros(int(rate * 0.58), dtype=np.float32))
        previous_act = turn.get("act") or previous_act
        audio_parts.append(audio)
        audio_parts.append(np.zeros(int(rate * 0.20), dtype=np.float32))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    sf.write(args.output, np.concatenate(audio_parts), model.sr, subtype="PCM_16")
    print(f"Wrote {args.output}: {len(turns)} turns", flush=True)


if __name__ == "__main__":
    main()
