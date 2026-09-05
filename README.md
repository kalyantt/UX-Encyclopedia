# UX Encyclopedia static site

This is the GitHub Pages publish folder for the UX Encyclopedia.

## Entry points

- `index.html` - public home page
- `course.html` - connected 96-lesson course player with the full chapter library
- `course-data.js` - authoritative module and lesson routing
- `lesson-data.js` - source-grounded lesson metadata

## GitHub Pages publishing

1. Create an empty GitHub repository, for example `ux-encyclopedia`.
2. Upload the contents of this folder to the repository root.
3. In GitHub, open **Settings → Pages**.
4. Select **Deploy from a branch**, then select `main` and `/ (root)`.
5. Save. GitHub will show the public site URL after the deployment completes.

The site has no build step and does not require a server.
