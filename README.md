
## Tests

```
deno test --allow-read tests/
```

The suite loads the real `js/*.js` against a stub DOM, so it covers the data
(`words.json` shape, group sizes, no duplicates), the conjugator (derived forms
checked against every hand-written table), the Dates generators in both
directions, and the app itself (boot, every mode, ★ Marked, Browse search).

## Adding a grammar topic

Everything grammar-related hangs off one list, `TOPICS` in
[js/grammar.js](js/grammar.js). A new topic is one entry:

```js
{
    id: "pronouns",                   // unique, also the dropdown value
    title: "Αντωνυμίες",              // shown in the Manual dropdown
    blurb: "Weak pronouns and where they sit",
    manual: `<article class="manual"> … </article>`,
    drill: () => window.PRONOUNS || null   // optional
}
```

- The **Manual** tab's dropdown lists every topic and renders `manual`.
- The **Drill** tab's dropdown groups each topic's sub-topics under its title,
  so a second topic simply adds a second group; "All topics" mixes them.
- `drill` returns a module shaped like `js/compare.js` or `js/datetime.js`:
  `{ TOPICS: [...], buildRound(topic, n) }` where each question is
  `{ topic, sub, prompt, answer, options }`. Drop the file in `js/`, add it to
  `index.html` and to `ASSETS` in `sw.js`, and bump the `?v=` query string.

`tests/grammar_test.js` holds the registry to this contract, so a topic that
forgets its manual or ships a malformed drill fails the suite.
