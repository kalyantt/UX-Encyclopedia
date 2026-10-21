"""Render short offline lesson closings with the established Kokoro narrator."""

import argparse
import base64
import json
import re
import subprocess
from pathlib import Path
from zlib import decompress

import imageio_ffmpeg
import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "assets" / "audio" / "outros"
SOURCE = ROOT / "course-204-data-editorial-preview.js"


def course_data():
    encoded = re.search(r'window\.course204Gzip="([A-Za-z0-9+/=]+)"', SOURCE.read_text()).group(1)
    return json.loads(decompress(base64.b64decode(encoded), 31))


def closing(course, lesson_id, next_lesson, is_chapter_end):
    title = next(title for module in course["index"].values() for lid, title in module["lessons"] if lid == lesson_id)
    if is_chapter_end:
        next_sentence = "Next is the chapter challenge. You'll use these ideas together before moving on."
    elif next_lesson:
        next_title = next(title for module in course["index"].values() for lid, title in module["lessons"] if lid == next_lesson)
        next_sentence = f"In the next lesson, {next_title}, we'll take that idea a step further and see what it changes in a product."
    else:
        next_sentence = "You've reached the end of the course. The final chapter challenge is ready when you are."
    return f"That brings us to the end of {title}. Before you go, there are four questions in this lesson. See what you remember, then check your reasoning. {next_sentence}"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--voices", type=Path, required=True)
    parser.add_argument("--start-id", default="UX-001")
    parser.add_argument("--end-id", default="UX-999")
    parser.add_argument("--threads", type=int, default=0)
    args = parser.parse_args()
    course = course_data()
    options = ort.SessionOptions()
    if args.threads:
        options.intra_op_num_threads = args.threads
        options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(args.model), sess_options=options, providers=["CPUExecutionProvider"])
    model = Kokoro.from_session(session, str(args.voices))
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for module in course["index"].values():
        lessons = module["lessons"]
        for index, (lesson_id, _) in enumerate(lessons):
            if not args.start_id <= lesson_id <= args.end_id:
                continue
            target = OUTPUT / f"{lesson_id}-outro.m4a"
            if target.exists() and target.stat().st_size > 5000:
                print(f"skipped {lesson_id}", flush=True)
                continue
            text = closing(course, lesson_id, lessons[index + 1][0] if index + 1 < len(lessons) else None, index + 1 == len(lessons))
            samples, sample_rate = model.create(text, voice="af_heart", speed=0.90, lang="en-us")
            samples = np.concatenate([np.zeros(int(sample_rate * .25), dtype=np.float32), samples, np.zeros(int(sample_rate * .5), dtype=np.float32)])
            temp = OUTPUT / f"{lesson_id}-outro.wav"
            sf.write(temp, samples, sample_rate, subtype="PCM_16")
            subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(temp), "-c:a", "aac", "-b:a", "48k", str(target)], check=True)
            temp.unlink()
            print(f"rendered {lesson_id}: {target.stat().st_size:,} bytes", flush=True)


if __name__ == "__main__":
    main()
