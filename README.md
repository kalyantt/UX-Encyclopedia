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

Challenges use 816 multiple-choice questions across `quiz-bank.mjs` and `quiz-checks.mjs`: one scenario and three two-claim comparisons per lesson. Each chapter reviews six questions from its lessons. Feedback and retries keep the first-attempt score separate from current correct answers. `node verify-quizzes.mjs` checks coverage and answer-key structure. Practice progress is saved locally, not synced to an account. Earlier written notes remain in browser storage but are no longer part of the challenge interface. Clearing browser storage removes local progress.

## Pip, the course companion

`reading-pet.mjs` and `reading-pet.css` implement Pip, a small interactive SVG companion with a keyboard-operable leaf game. `pet-search.mjs` retrieves published course passages locally; it is not an LLM or a full-book search engine. It uses a conservative lexical match and abstains when no strong match exists. Results are labelled as passages, link to their lessons, and expose lesson-level references rather than claiming page-level book citations. The source books and their private extracts are not shipped. Questions are not sent to a third party or persisted. Run `node verify-pet.mjs` for retrieval and abstention checks.

Accordion motion uses one interruptible animation loop for height, opacity, and scroll anchoring. Wheel or touch interaction releases the anchor. Reduced-motion users receive immediate state changes.

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
