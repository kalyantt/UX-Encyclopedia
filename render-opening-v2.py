"""Replace only the two stock opening turns; preserve every original episode.

This renders the old guide and host turns to locate their exact duration,
synthesizes a brief title with the approved host voice, and joins that to the
lesson-specific original guide opening. Outputs live in a separate version.
"""

import argparse
import json
import subprocess
import tempfile
from pathlib import Path

import imageio_ffmpeg
import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent
OLD_SCRIPTS = ROOT / "podcast-scripts" / "editorial-drafts"
NEW_SCRIPTS = ROOT / "podcast-scripts" / "opening-v2"
OLD_AUDIO = ROOT / "assets" / "audio" / "editorial-drafts"
NEW_AUDIO = ROOT / "assets" / "audio" / "opening-v2"


def pieces(text, limit=270):
    import re
    sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z“])", text.strip())
    chunk = ""
    for sentence in sentences:
        if len(chunk) + len(sentence) + 1 <= limit:
            chunk = f"{chunk} {sentence}".strip()
        else:
            if chunk:
                yield chunk
            chunk = sentence
    if chunk:
        yield chunk


def synth_turn(model, turn, voice):
    segments = []
    sample_rate = 24000
    chunks = list(pieces(turn["text"]))
    speed = {"warm": 0.94, "curious": 1.00}.get(turn.get("mood"), 0.94)
    for index, piece in enumerate(chunks):
        sound, sample_rate = model.create(piece, voice=voice, speed=speed, lang="en-us")
        segments.append(sound)
        segments.append(np.zeros(int(sample_rate * (0.12 if index < len(chunks) - 1 else 0.34)), dtype=np.float32))
    return np.concatenate(segments), sample_rate


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--voices", type=Path, required=True)
    parser.add_argument("--start-id", default="UX-001")
    parser.add_argument("--end-id", default="UX-204")
    parser.add_argument("--threads", type=int, default=4)
    args = parser.parse_args()
    options = ort.SessionOptions()
    options.intra_op_num_threads = args.threads
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(args.model), sess_options=options, providers=["CPUExecutionProvider"])
    model = Kokoro.from_session(session, str(args.voices))
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    NEW_AUDIO.mkdir(parents=True, exist_ok=True)
    paths = [p for p in sorted(NEW_SCRIPTS.glob("UX-*-opening-v2.json")) if args.start_id <= p.name[:6] <= args.end_id]
    for index, new_path in enumerate(paths, 1):
        lesson = new_path.name[:6]
        target = NEW_AUDIO / f"{lesson}-opening-v2.m4a"
        if target.exists() and target.stat().st_size > 10000:
            print(f"[{index}/{len(paths)}] skipped {lesson}", flush=True)
            continue
        old_path = OLD_SCRIPTS / f"{lesson}-editorial-draft.json"
        old_audio = OLD_AUDIO / f"{lesson}-editorial-draft.m4a"
        old = json.loads(old_path.read_text())
        new = json.loads(new_path.read_text())
        assert old["turns"][2:] == new["turns"][1:], lesson
        assert old["voices"] == new["voices"], lesson
        old_duration = 0
        for old_turn in old["turns"][:2]:
            voice = old["voices"][old_turn["speaker"]]
            sound, rate = synth_turn(model, old_turn, voice)
            old_duration += len(sound) / rate
        new_voice = new["voices"][new["turns"][0]["speaker"]]
        new_opening, new_rate = synth_turn(model, new["turns"][0], new_voice)
        trim_at = old_duration
        with tempfile.TemporaryDirectory(prefix="ux-opening-") as directory:
            wav = Path(directory) / "intro.wav"
            pending = Path(directory) / "episode.m4a"
            sf.write(wav, new_opening, new_rate, subtype="PCM_16")
            subprocess.run([
                ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
                "-i", str(wav), "-i", str(old_audio),
                "-filter_complex", f"[1:a]atrim=start={trim_at:.6f},asetpts=PTS-STARTPTS[tail];[0:a][tail]concat=n=2:v=0:a=1[a]",
                "-map", "[a]", "-c:a", "aac", "-b:a", "48k", str(pending),
            ], check=True)
            pending.replace(target)
        print(f"[{index}/{len(paths)}] rendered {lesson} ({target.stat().st_size:,} bytes)", flush=True)


if __name__ == "__main__":
    main()
