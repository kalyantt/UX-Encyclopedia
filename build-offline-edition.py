#!/usr/bin/env python3
"""Package the podcast course as a file://-friendly offline website."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZIP_STORED, ZipFile


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT.parent / "UX-Encyclopedia-Offline-V7.3.zip"
PREFIX = "UX-Encyclopedia-Offline-V7.3/"


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
    audio = replace_once(
        audio,
        r"/(?:course-editorial-preview|course-podcast-v1)\.html$/",
        r"/\.html$/",
        "offline lesson-page detection",
    )
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

    generated = {
        "offline-pet-search.js": search,
        "offline-reading-pet.js": pet,
        "offline-podcast-versions.js": versions,
        "offline-editorial-podcast-versions.js": editorial,
        "offline-conversation-previews.js": previews,
        "offline-lesson-audio.js": audio,
        "offline-course-reader.js": reader,
    }
    # Classic scripts share a global lexical scope under file://. Keep each
    # transformed module private and communicate only through explicit window
    # exports, avoiding duplicate top-level const declarations.
    return {name: f"(()=>{{\n{content}\n}})();\n" for name, content in generated.items()}


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
    tags = "".join(f'<script src="assets/{name}"></script>' for name in ordered)
    html = replace_once(
        html,
        '<script src="course-reader.js?v=editorial-all13"></script>',
        tags + '<script src="assets/offline-course-reader.js"></script>',
        "course reader script",
    )
    html = replace_once(
        html,
        '<div class="rail-footer"><a href="course.html">← Earlier course</a></div>',
        '<div class="rail-footer"><span>Offline edition · all lessons and audio included</span></div>',
        "course footer",
    )
    html = html.replace('href="index.html"', 'href="#UX-001"')
    html = html.replace('href="course-reader.css?v=20261024v11"', 'href="assets/course-reader.css"')
    html = html.replace('href="reading-pet.css?v=20261021v6"', 'href="assets/reading-pet.css"')
    html = html.replace(
        'src="course-204-data-editorial-preview.js?v=editorial-all1"',
        'src="assets/course-204-data-editorial-preview.js"',
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
2. Double-click "Open UX Encyclopedia.html" in a current Chrome, Edge, or Safari browser.
3. Read, navigate, answer questions, and play the lesson recordings without internet.

Keep the assets folder alongside the HTML files. All 204 lesson recordings and
their closing announcements are included. Some linked external references
require internet, but the course lessons and recordings do not.

This is an offline copy of the current editorial preview, not a hand-reviewed
final publication. Browser-local practice progress may not transfer between
devices or browsers. No original source books are included.
"""
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(OUTPUT, "w", allowZip64=True) as archive:
        archive.writestr(PREFIX + "assets/README.txt", readme, compress_type=ZIP_DEFLATED)
        archive.writestr(PREFIX + "Open UX Encyclopedia.html", html, compress_type=ZIP_DEFLATED)
        for name, content in generated.items():
            archive.writestr(PREFIX + "assets/" + name, content, compress_type=ZIP_DEFLATED)
        for name in (
            "course-reader.css",
            "reading-pet.css",
            "course-204-data-editorial-preview.js",
        ):
            archive.write(ROOT / name, PREFIX + "assets/" + name, compress_type=ZIP_DEFLATED)
        for name in sorted(audio):
            archive.write(ROOT / name, PREFIX + name, compress_type=ZIP_STORED)
    print(f"Created {OUTPUT} ({OUTPUT.stat().st_size / 1024**2:.1f} MiB; {len(audio)} audio files)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
