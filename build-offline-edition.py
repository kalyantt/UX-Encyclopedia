#!/usr/bin/env python3
"""Package the podcast course as a file://-friendly offline website."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZIP_STORED, ZipFile


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT.parent / "UX-Encyclopedia-Offline-V7.zip"
PREFIX = "UX-Encyclopedia-Offline/"


def source(name: str) -> str:
    return (ROOT / name).read_text(encoding="utf-8")


def replace_once(value: str, old: str, new: str, label: str) -> str:
    if value.count(old) != 1:
        raise ValueError(f"Expected one {label}, found {value.count(old)}")
    return value.replace(old, new)


def scripts() -> dict[str, str]:
    search = source("pet-search.mjs").replace("export function ", "function ")
    search += "\nwindow.petSearch={words,plain,createIndex,findPassages};\n"

    pet = source("reading-pet.mjs")
    pet = replace_once(
        pet,
        "import {createIndex,findPassages,plain} from './pet-search.mjs?v=20261001b';",
        "const {createIndex,findPassages,plain}=window.petSearch;",
        "pet import",
    )
    pet = pet.replace("export function mountPet", "function mountPet")
    pet += "\nwindow.mountPet=mountPet;\n"

    versions = source("podcast-versions.mjs").replace(
        "export const podcastVersions", "const podcastVersions"
    )
    versions += "\nwindow.podcastVersions=podcastVersions;\n"
    editorial = source("editorial-podcast-versions.mjs").replace(
        "export const editorialPodcastVersions", "const editorialPodcastVersions"
    )
    editorial += "\nwindow.editorialPodcastVersions=editorialPodcastVersions;\n"
    previews = source("conversation-previews.mjs").replace(
        "export const conversationPreviewIds", "const conversationPreviewIds"
    )
    previews += "\nwindow.conversationPreviewIds=conversationPreviewIds;\n"

    audio = source("lesson-audio.mjs")
    audio = replace_once(
        audio,
        "import {podcastVersions} from './podcast-versions.mjs?v=20261011f';",
        "const {podcastVersions}=window;",
        "audio versions import",
    )
    audio = replace_once(
        audio,
        "const {editorialPodcastVersions}=await import(`./editorial-podcast-versions.mjs?v=${Date.now()}`);",
        "const {editorialPodcastVersions}=window;",
        "editorial audio import",
    )
    audio = replace_once(
        audio,
        "import {conversationPreviewIds} from './conversation-previews.mjs';",
        "const {conversationPreviewIds}=window;",
        "audio previews import",
    )
    audio = audio.replace("export function mountAudio", "function mountAudio")
    audio += "\nwindow.mountAudio=mountAudio;\n"

    reader = source("course-reader.js")
    reader = re.sub(
        r"import\('\./lesson-audio\.mjs\?v=editorial17'\)\.then\(\(\{mountAudio\}\)=>\{window\.lessonAudio=mountAudio\(library\);window\.lessonAudio\.sync\(currentId\)\}\)\.catch\(error=>console\.warn\('Lesson audio unavailable',error\)\);",
        "try{window.lessonAudio=window.mountAudio(library);window.lessonAudio.sync(currentId)}catch(error){console.warn('Lesson audio unavailable',error)}",
        reader,
        count=1,
    )
    reader = re.sub(
        r"import\('\./reading-pet\.mjs\?v=20261021v6'\)\.then\(\(\{mountPet\}\)=>mountPet\(library,\(\)=>currentId\)\)\.catch\(error=>console\.warn\('Reading companion unavailable',error\)\)",
        "try{window.mountPet(library,()=>currentId)}catch(error){console.warn('Reading companion unavailable',error)}",
        reader,
        count=1,
    )
    if "import(" in reader or "export " in audio or "import " in audio:
        raise ValueError("Offline JavaScript still contains module loading")

    return {
        "offline-pet-search.js": search,
        "offline-reading-pet.js": pet,
        "offline-podcast-versions.js": versions,
        "offline-editorial-podcast-versions.js": editorial,
        "offline-conversation-previews.js": previews,
        "offline-lesson-audio.js": audio,
        "offline-course-reader.js": reader,
    }


def page() -> str:
    html = source("course-podcast-v1.html")
    ordered = (
        "offline-pet-search.js",
        "offline-podcast-versions.js",
        "offline-editorial-podcast-versions.js",
        "offline-conversation-previews.js",
        "offline-lesson-audio.js",
        "offline-reading-pet.js",
    )
    tags = "".join(f'<script src="{name}"></script>' for name in ordered)
    html = replace_once(
        html,
        '<script src="course-reader.js?v=editorial-all13"></script>',
        tags + '<script src="offline-course-reader.js"></script>',
        "course reader script",
    )
    html = replace_once(
        html,
        '<div class="rail-footer"><a href="course.html">← Earlier course</a></div>',
        '<div class="rail-footer"><span>Offline edition · all lessons and audio included</span></div>',
        "course footer",
    )
    return html


def main() -> int:
    generated = scripts()
    html = page()
    editorial = source("editorial-podcast-versions.mjs")
    audio = set(re.findall(r'"src": "(assets/audio/[^"]+\.m4a)"', editorial))
    if len(audio) != 204:
        raise ValueError(f"Expected 204 lesson recordings; found {len(audio)}")
    for number in range(1, 205):
        audio.add(f"assets/audio/outros/UX-{number:03d}-outro.m4a")
    missing = [name for name in sorted(audio) if not (ROOT / name).is_file()]
    if missing:
        raise FileNotFoundError(f"Missing {len(missing)} audio files: {missing[:5]}")

    readme = """UX Encyclopedia — offline podcast edition

1. Extract the entire ZIP to a folder. Do not open files inside the ZIP preview.
2. Open index.html in a current Chrome, Edge, or Safari browser.
3. Read, navigate, answer questions, and play the lesson recordings without internet.

Keep the assets folder alongside the HTML files. All 204 lesson recordings and
their closing announcements are included. Some linked external references
require internet, but the course lessons and recordings do not.

This is an offline copy of the current editorial preview, not a hand-reviewed
final publication. Browser-local practice progress may not transfer between
devices or browsers. No original source books are included.
"""
    home = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UX Encyclopedia — Offline Edition</title><style>body{font:20px/1.6 Georgia,serif;background:#f5f3ed;color:#243a30;max-width:700px;margin:12vh auto;padding:24px}h1{font-size:clamp(40px,7vw,70px);line-height:1.05}a{display:inline-block;background:#2d493d;color:white;padding:14px 24px;border-radius:8px;text-decoration:none}small{display:block;margin-top:24px;color:#5a6b61}</style></head><body><p>204 lessons · 17 chapters · audio included</p><h1>The UX Encyclopedia</h1><p>Read and listen offline. Everything you need is in this folder.</p><a href="course-podcast-v1.html#UX-001">Open the course →</a><small>Keep this folder together after extracting it.</small></body></html>"""
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(OUTPUT, "w", allowZip64=True) as archive:
        archive.writestr(PREFIX + "README.txt", readme, compress_type=ZIP_DEFLATED)
        archive.writestr(PREFIX + "index.html", home, compress_type=ZIP_DEFLATED)
        archive.writestr(PREFIX + "course-podcast-v1.html", html, compress_type=ZIP_DEFLATED)
        for name, content in generated.items():
            archive.writestr(PREFIX + name, content, compress_type=ZIP_DEFLATED)
        for name in (
            "course-reader.css",
            "reading-pet.css",
            "course-204-data-editorial-preview.js",
        ):
            archive.write(ROOT / name, PREFIX + name, compress_type=ZIP_DEFLATED)
        for name in sorted(audio):
            archive.write(ROOT / name, PREFIX + name, compress_type=ZIP_STORED)
    print(f"Created {OUTPUT} ({OUTPUT.stat().st_size / 1024**2:.1f} MiB; {len(audio)} audio files)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
