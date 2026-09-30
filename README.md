# UX Encyclopedia static site

This is the GitHub Pages publish folder for the UX Encyclopedia.

## Entry points

- `index.html` - public home page
- `course.html` - connected 204-lesson course player with the full chapter library
- `case.html` - the 17-stage CarePath project that connects all 204 lessons
- `assets/carepath-journey-hero.png` - original editorial illustration for the continuing case
- `assets/module-*.jpg` - archived module illustrations, not displayed in lessons
- `course-204-data.js` - authoritative compressed module, lesson, and chapter library
- `lesson-data.js` - source-grounded lesson metadata
- `build-course-data.mjs` - rebuilds the public lesson payload from the 204 Markdown source lessons
- `audit-course.mjs` - checks lesson identity, teaching structure, CarePath continuity, depth signals, and references
- `verify-render.mjs` - runs the actual site renderer across every lesson and checks for missing or leaked content
- `course-reader.js` and `course-reader.css` - responsive reader, single-open sections, and local practice notes
- `learning-design.mjs` - narrative openings, reading structure, and 17 chapter challenges
- `recall-prompts.mjs` - 204 lesson-specific recall questions

Challenges use 204 authored multiple-choice questions in `quiz-bank.mjs`. Each chapter reviews three questions from its lessons. Answers include explanatory feedback and retry controls. `node verify-quizzes.mjs` checks coverage and answer-key structure. Practice progress is saved locally, not synced to an account. Earlier written notes remain in browser storage but are no longer part of the challenge interface. Clearing browser storage removes local progress.

## Rebuild and verification

From the repository's parent project folder, run:

```text
node outputs/ux-encyclopedia-site/audit-course.mjs
node outputs/ux-encyclopedia-site/build-course-data.mjs
node outputs/ux-encyclopedia-site/verify-render.mjs
```

The generated `course-204-data.js` is committed so GitHub Pages can remain a static site with no server-side build.

## GitHub Pages publishing

1. Create an empty GitHub repository, for example `ux-encyclopedia`.
2. Upload the contents of this folder to the repository root.
3. In GitHub, open **Settings → Pages**.
4. Select **Deploy from a branch**, then select `main` and `/ (root)`.
5. Save. GitHub will show the public site URL after the deployment completes.

The site has no build step and does not require a server.
