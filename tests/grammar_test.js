import { assert, assertEquals } from "jsr:@std/assert@1";
import { loadLibs } from "./helpers.js";

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

Deno.test("a topic's drill, if it has one, is shaped like the other drills", () => {
    for (const t of GRAMMAR.TOPICS) {
        if (!t.drill) continue;
        const source = t.drill();
        assert(source, t.id + ": drill() returned nothing");
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
