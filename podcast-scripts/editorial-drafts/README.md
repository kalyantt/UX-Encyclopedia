# Character-free podcast drafts

These scripts adapt the revised 204-lesson editorial preview into two voices, using
the offline Kokoro `af_heart` and `am_michael` voices. They are generated first
passes, not approved conversational scripts. UX-007 has a separately authored
episode at `../UX-007-editorial-v1.json`.

Each draft begins with its lesson title and ends with a product observation.
Before a recording is treated as final, check the dialogue against its lesson,
listen for pronunciation and pacing, and replace generic prompts with real
questions or reactions where needed. Keep approved versions immutable.

Audio is rendered locally, compressed to M4A, and served as static files. No
browser/system text-to-speech or per-play TTS API is involved.
