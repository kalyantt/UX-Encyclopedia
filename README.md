# UX Encyclopedia static site

This is the GitHub Pages publish folder for the UX Encyclopedia.

## Entry points

- `index.html` - public home page
- `course.html` - connected 204-lesson course player with the full chapter library
- `case.html` - the 17-stage CarePath project that connects all 204 lessons
- `assets/carepath-journey-hero.png` - original editorial illustration for the continuing case
- `assets/module-*.jpg` - 17 original editorial illustrations, one for each module
- `course-204-data.js` - authoritative compressed module, lesson, and chapter library
- `lesson-data.js` - source-grounded lesson metadata
- `build-course-data.mjs` - rebuilds the public lesson payload from the 204 Markdown source lessons
- `audit-course.mjs` - checks lesson identity, teaching structure, CarePath continuity, depth signals, and references
- `verify-render.mjs` - runs the actual site renderer across every lesson and checks for missing or leaked content

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
