import { assert, assertEquals } from "jsr:@std/assert@1";
import { loadLibs } from "./helpers.js";

const { CONJUGATIONS } = loadLibs();
const TENSES = ["present", "imperfect", "aorist", "future"];

Deno.test("every drilled verb has a lemma, a gloss and six forms per tense", () => {
    for (const v of CONJUGATIONS) {
        assert(v.lemma && v.english, "missing lemma/english: " + JSON.stringify(v));
        for (const t of TENSES) {
            assert(t in v, `${v.lemma} has no ${t}`);
            if (v[t] === null) continue;
            assertEquals(v[t].length, 6, `${v.lemma} ${t} should have 6 persons`);
            for (const f of v[t]) assert(f.trim().length, `${v.lemma} ${t} has an empty cell`);
        }
    }
});

Deno.test("no verb is listed twice", () => {
    const seen = new Set();
    for (const v of CONJUGATIONS) {
        assert(!seen.has(v.lemma), "duplicate verb: " + v.lemma);
        seen.add(v.lemma);
    }
});

Deno.test("only είμαι lacks an aorist", () => {
    const without = CONJUGATIONS.filter(v => !v.aorist).map(v => v.lemma);
    assertEquals(without, ["είμαι"]);
});

Deno.test("future forms all carry θα", () => {
    for (const v of CONJUGATIONS) {
        for (const f of v.future) assert(f.startsWith("θα "), `${v.lemma}: ${f}`);
    }
});
