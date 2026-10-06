
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
    drill: { src: "js/pronouns.js", global: "PRONOUNS" }   // optional
}
```

- The **Manual** tab's dropdown lists every topic and renders `manual`.
- The **Drill** tab's dropdown groups each topic's sub-topics under its title,
  so a second topic simply adds a second group; "All topics" mixes them.
- `drill` names a script and the global it defines; the app pulls it in the
  first time the Grammar section opens. The script is shaped like
  `js/compare.js` or `js/datetime.js`: `{ TOPICS: [...], buildRound(topic, n) }`
  with questions `{ topic, sub, prompt, answer, options }`. Drop the file in
  `js/` — there is no `<script>` tag to add, no service-worker list to extend
  and no version to bump: the worker is network-first and caches whatever it
  serves.

`tests/grammar_test.js` holds the registry to this contract, so a topic that
forgets its manual or ships a malformed drill fails the suite.
