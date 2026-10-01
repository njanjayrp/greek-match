import { assert, assertEquals } from "jsr:@std/assert@1";
import { readWords } from "./helpers.js";

const words = readWords();

Deno.test("every entry has the four fields, filled", () => {
    for (const w of words) {
        assertEquals(Object.keys(w).sort(), ["english", "greek", "group", "marked"]);
        assert(w.greek.trim() && w.english.trim() && w.group.trim(), JSON.stringify(w));
        assertEquals(typeof w.marked, "boolean", w.greek + " marked must be a boolean");
    }
});

Deno.test("no duplicate Greek entries", () => {
    const seen = new Set();
    for (const w of words) {
        assert(!seen.has(w.greek), "duplicate: " + w.greek);
        seen.add(w.greek);
    }
});

// A group you never finish never repeats a word, which is what the drill is for.
Deno.test("no group holds more than 70 words", () => {
    const counts = {};
    for (const w of words) counts[w.group] = (counts[w.group] || 0) + 1;
    const over = Object.entries(counts).filter(([, n]) => n > 70);
    assertEquals(over, [], "groups over 70: " + JSON.stringify(over));
});

Deno.test("there is no catch-all group left", () => {
    assert(!words.some(w => w.group === "General"), "General is back");
    assert(!words.some(w => w.group === "Common verbs"), "Common verbs is back");
});

// ενώ is a conjunction that happens to end like a contract verb
const NOT_VERBS = new Set(["ενώ"]);

Deno.test("verb entries name their aorist subjunctive", () => {
    const verbs = words.filter(w => /(ω|ώ|ομαι|άμαι|ιέμαι)$/.test(w.greek.split(" (")[0])
                                 && !w.greek.includes("→") && !w.greek.includes(" ")
                                 && !NOT_VERBS.has(w.greek));
    const noDep = verbs.filter(w => !/\(.+\)$/.test(w.greek)).map(w => w.greek);
    assertEquals(noDep, [], "verbs without a (…) form: " + noDep.join(", "));
});
