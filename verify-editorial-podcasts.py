"""Check coverage, freshness, and decodability of offline podcast recordings."""

import argparse
import json
import subprocess
from pathlib import Path

import imageio_ffmpeg


ROOT = Path(__file__).resolve().parent
SCRIPTS = ROOT / "podcast-scripts" / "editorial-drafts"
AUDIO = ROOT / "assets" / "audio" / "editorial-drafts"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--opening-v2", action="store_true")
    args = parser.parse_args()
    missing = []
    stale = []
    broken = []
    total_bytes = 0
    for number in range(1, 205):
        lesson = f"UX-{number:03d}"
        if lesson == "UX-007":
            script = ROOT / "podcast-scripts" / "UX-007-editorial-v1.json"
            audio = ROOT / "assets" / "audio" / "UX-007-editorial-v1.m4a"
        elif args.opening_v2:
            script = ROOT / "podcast-scripts" / "opening-v2" / f"{lesson}-opening-v2.json"
            audio = ROOT / "assets" / "audio" / "opening-v2" / f"{lesson}-opening-v2.m4a"
        else:
            script = SCRIPTS / f"{lesson}-editorial-draft.json"
            audio = AUDIO / f"{lesson}-editorial-draft.m4a"
        if not script.is_file():
            broken.append(f"{lesson}: missing script")
            continue
        data = json.loads(script.read_text())
        if data.get("lesson") != lesson or not data.get("turns"):
            broken.append(f"{lesson}: invalid script")
        if not audio.is_file():
            missing.append(lesson)
            continue
        total_bytes += audio.stat().st_size
        if audio.stat().st_mtime < script.stat().st_mtime:
            stale.append(lesson)
        probe = subprocess.run([FFMPEG, "-v", "error", "-i", str(audio), "-f", "null", "-"], capture_output=True, text=True)
        if probe.returncode:
            broken.append(f"{lesson}: audio decode failed: {probe.stderr.strip()[:150]}")
    summary = {"recorded": 204 - len(missing), "missing": len(missing), "stale": stale, "broken": broken,
               "audio_megabytes": round(total_bytes / 1_000_000, 1)}
    print(json.dumps(summary, indent=2))
    if missing:
        print("First missing:", ", ".join(missing[:12]))
    return 0 if not (missing or stale or broken) else 1


if __name__ == "__main__":
    raise SystemExit(main())
