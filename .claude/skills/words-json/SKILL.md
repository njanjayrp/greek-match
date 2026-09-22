---
name: words-json
description: Rules for editing words.json (the vocabulary list) and the drill data. Use for ANY request to add, remove, mark, unmark, rename or list words — including "remove X", "skini X", "unmark X", "dodaj X", "koje reci bi dodao".
---

# Editing words.json

## Never delete an entry

"remove X", "skini X", "izbaci X", "makni X" → set `"marked": false`. Nothing else.

Deleting an entry is destructive and is NOT what these words mean here. Delete ONLY when the user
writes an explicit kill instruction for that specific entry — "obriši skroz", "remove completely",
"delete it permanently". If you are even slightly unsure: unmark, and ask in one line.

This rule outranks any reading of the sentence that sounds like deletion. A screenshot of a word,
a duplicate, a wrong gloss, a "formal" tag — none of it authorizes deletion.

## A list request means list only

"koje reči bi dodao", "izlistaj", "which words would you add" → print the list and stop.
No file write, no commit. Wait for the user to pick. A terse reply ("lista", "ok") is not
approval to apply a whole proposed list.

## Adding

- Only words the user explicitly picked. Never bulk-add vocabulary on your own initiative.
- One distinctive meaning per entry, not slash-joined synonyms.
- Verbs: `λήμμα (aorist subjunctive)` — e.g. `προσέχω (προσέξω)`.
- Check the word is not already present (search both the Greek and the English side) before adding.
- `marked` follows what the user said; if they did not say, ask in the same line you report the add.

## Mechanics

Edit with a small Python script: `json.load` → mutate → `json.dump(..., ensure_ascii=False, indent=4)`
plus a trailing newline. Assert the intended number of entries changed (`assert n == 1`) so a typo
fails loudly instead of silently matching nothing or everything.

Report the resulting counts: total words and marked count.

## Cached assets

`index.html` loads the JS with `?v=N` query strings and `sw.js` pins `CACHE_NAME`. If you change
`js/*.js`, bump that file's `?v=` and bump `CACHE_NAME`, or the user keeps running the old code.
