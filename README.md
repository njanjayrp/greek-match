
## Tests

```
deno test --allow-read tests/
```

The suite loads the real `js/*.js` against a stub DOM, so it covers the data
(`words.json` shape, group sizes, no duplicates), the conjugator (derived forms
checked against every hand-written table), the Dates generators in both
directions, and the app itself (boot, every mode, ★ Marked, Browse search).
