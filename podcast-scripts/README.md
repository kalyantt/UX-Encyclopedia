# Podcast opening rule

Every episode starts with a short `Before we begin` act. The speakers must say the lesson or chapter title, what the listener will learn, and which example or problem they will use. Keep it conversational and brief; then move into the story. The introduction should orient the listener without giving away the entire lesson.

The rest of the episode can vary in structure. Preserve the written lesson's claims, examples, cautions, and connections to neighboring lessons. The audio is an adaptation, not a new research source, and the written lesson and challenges remain available on the page.

## Character continuity

Alex is the designer learning through the course. Maya is the person seeking care in the CarePath teaching case. Do not swap their roles or use either name as a generic stand-in for the other. Every script should declare its named characters and be checked against the corresponding written lesson before audio is rendered. If a later lesson changes the case or introduces another person, document that explicitly rather than silently changing who Alex or Maya is.

## Version rule

Never overwrite an approved audio version. Give each new render a new `vN` ID, a separate audio file, a matching transcript, and an entry in `podcast-versions.mjs`. Keep the prior version playable. Make a new version the default only after review. UX-001 Version 1 is the complete, calmer episode; Version 2 is a faster 32-second experiment and is not the default. Git commits preserve the corresponding site changes.

## Chapter 1 voice continuity

UX-001 Version 1 uses local Kokoro voices `af_heart` for the guide and `am_michael` for Alex. The original UX-002 to UX-006 and UX-097 to UX-098 previews used a different model; their Version 1 files are retained for comparison. Version 2 of those seven lessons uses the same Kokoro model and voice IDs as UX-001 Version 1, and is the default. These are all eight lessons in published Chapter 1 navigation. The seven newer recordings remain short previews, not full-lesson adaptations. Their transcripts and the complete written lessons remain available.
