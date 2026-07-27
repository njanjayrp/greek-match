# Serbian Match

A small offline vocabulary game for practicing Serbian. Just a folder of static files — no install, no server, no account.

## How to open it

Double-click **`index.html`**. It opens in your default browser and runs entirely on your computer.

If the page loads blank in **Chrome**, that's a known Chrome restriction on files loaded via `file://`. Two easy fixes:

- **Open with Safari or Firefox instead** (both work fine with `file://`).
- **Or run a tiny local server.** From this folder in Terminal:

  ```
  python3 -m http.server 8000
  ```

  Then open `http://localhost:8000` in any browser. Press `Ctrl+C` in Terminal to stop.

## The four game modes

Pick a mode from the top-left dropdown.

- **Match** — drag/tap chips into the correct slots. There are extra decoy answers to make it harder.
- **Quiz** — multiple choice with a timer.
- **Type** — recall practice; type the translation. Diacritics (č, ć, š, ž) are optional — "sto" will match "što".
- **Marked** — same as Match, but only shows words you've *marked* for extra practice (see below).

Toggle the flag buttons (🇷🇸 / 🇬🇧) to switch which direction you're guessing.

## How to add or edit words

Open **`words.js`** in any text editor (VS Code, TextEdit in plain mode, Notepad, etc.).

Each word is one line inside `window.WORDS = [...]`:

```js
{ "serbian": "kuća", "english": "house", "group": "Places", "marked": false },
```

- **serbian** — the Serbian word (base/dictionary form).
- **english** — the English meaning. Slash-separated variants both count as correct: `"to love / to like"`.
- **group** — a category name for the group filter dropdown. Reuse an existing group name to add to it, or invent a new one to create a new group.
- **marked** — `true` to include it in **Marked** mode, `false` otherwise. You can also flip this while playing (planned) or just edit here.

To add a word, copy an existing line, paste it below, and edit. Save the file. **Refresh the browser tab** (Cmd/Ctrl + R) and it's in.

To remove a word, delete its line and refresh.

**A note on Serbian formatting:**

- Nouns: use nominative singular (`kuća`, not `kuće`).
- Verbs: use infinitive (`raditi`, not `radim`).
- Adjectives: masculine singular (`dobar`, not `dobra`).
- Gender is not marked in `serbian`; if useful, add it to `english`: `"house (f)"`.

## Progress tracking

The app remembers what you've practiced and what you got wrong (stored in your browser). Words you keep missing show up more often; words you keep getting right eventually stop cycling in.

To reset, open browser DevTools → Application → Local Storage → delete the `serbian_*` entries. Or just use a different browser profile.

## File layout

```
├── index.html          # open this
├── words.js            # edit this to add/remove words
├── css/game.css        # styling (probably don't touch)
├── js/game.js          # game logic (probably don't touch)
├── manifest.json       # PWA metadata
└── icons/              # app icons
```

## Feedback / bugs

Tell Nemanja. Or just edit the files — the whole thing is ~1200 lines of JS and one CSS file.
