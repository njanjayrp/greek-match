import { assert, assertEquals } from "jsr:@std/assert@1";
import { loadLibs, ROOT } from "./helpers.js";

const { GRAMMAR } = loadLibs();

// These are the rules a new grammar topic has to satisfy; they are what keeps
// adding one to js/grammar.js from touching anything else.
Deno.test("every topic has an id, a title and a manual", () => {
    assert(GRAMMAR.TOPICS.length >= 1);
    const ids = new Set();
    for (const t of GRAMMAR.TOPICS) {
        assert(t.id && !ids.has(t.id), "missing or duplicate id: " + t.id);
        ids.add(t.id);
        assert(t.title && t.title.trim(), t.id + " needs a title");
        assert(typeof t.manual === "string" && t.manual.includes("<article"),
               t.id + " needs manual markup");
        assert(t.manual.includes(t.title), t.id + "'s manual should name the topic");
    }
});

Deno.test("a declared drill names a script that exists and a global it defines", () => {
    for (const t of GRAMMAR.TOPICS) {
        if (!t.drill) continue;
        assert(t.drill.src && t.drill.global, t.id + ": drill needs { src, global }");
        const stat = Deno.statSync(ROOT + t.drill.src);   // throws if the file is missing
        assert(stat.isFile, t.id + ": " + t.drill.src + " is not a file");
        const src = Deno.readTextFileSync(ROOT + t.drill.src);
        assert(src.includes("window." + t.drill.global),
               t.drill.src + " never assigns window." + t.drill.global);
    }
});

Deno.test("a loaded drill is shaped like the other drills", () => {
    for (const t of GRAMMAR.TOPICS) {
        if (!t.drill) continue;
        const source = GRAMMAR.sourceOf(t);
        assert(source, t.id + ": drill script did not define its global");
        assert(Array.isArray(source.TOPICS) && source.TOPICS.length, t.id + ": no sub-topics");
        assertEquals(typeof source.buildRound, "function", t.id + ": no buildRound");
    }
});

Deno.test("byId falls back to the first topic", () => {
    assertEquals(GRAMMAR.byId("comparatives").id, "comparatives");
    assertEquals(GRAMMAR.byId("nope").id, GRAMMAR.TOPICS[0].id);
});

Deno.test("every advertised drill resolves and builds a round", () => {
    const ds = GRAMMAR.drills();
    assert(ds.length >= 1);
    for (const d of ds) {
        const value = d.topicId + "::" + d.sub;
        assert(GRAMMAR.resolve(value), "cannot resolve " + value);
        const round = GRAMMAR.buildRound(value, 10);
        assertEquals(round.length, 10, value);
        for (const q of round) assert(q.options.includes(q.answer), value);
    }
});

Deno.test("All topics mixes the grammar drills", () => {
    const round = GRAMMAR.buildRound("__all__", 10);
    assertEquals(round.length, 10);
    assertEquals(new Set(round.map(q => q.prompt)).size, 10);
});

Deno.test("All topics spreads a round over the sub-topics", () => {
    const G = loadLibs().GRAMMAR;
    const subs = G.drills().map(d => d.sub);
    const count = {};
    for (let r = 0; r < 40; r++)
        for (const q of G.buildRound("__all__", 10))
            count[q.topic] = (count[q.topic] || 0) + 1;
    const total = Object.values(count).reduce((a, b) => a + b, 0);
    const fair = total / subs.length;
    for (const sub of subs) {
        assert(count[sub], sub + " never came up in 400 questions");
        assert(count[sub] > fair * 0.5 && count[sub] < fair * 1.6,
               sub + " got " + count[sub] + " of " + total + " (fair share " + Math.round(fair) + ")");
    }
});
