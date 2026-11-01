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
        for (const d of t.drills || []) {
            assert(d.src && d.global, t.id + ": a drill needs { src, global }");
            assert(["choose", "write"].includes(d.format), t.id + ": odd format " + d.format);
            const stat = Deno.statSync(ROOT + d.src);     // throws if the file is missing
            assert(stat.isFile, t.id + ": " + d.src + " is not a file");
            const src = Deno.readTextFileSync(ROOT + d.src);
            assert(src.includes("window." + d.global), d.src + " never assigns window." + d.global);
        }
    }
});

Deno.test("a loaded drill is shaped like the other drills", () => {
    for (const t of GRAMMAR.TOPICS) {
        for (const d of t.drills || []) {
            const source = GRAMMAR.sourceOf(d);
            assert(source, t.id + ": " + d.src + " did not define its global");
            assert(Array.isArray(source.TOPICS) && source.TOPICS.length, t.id + ": no sub-topics");
            assertEquals(typeof source.buildRound, "function", t.id + ": no buildRound");
            // a typo in `subs` would silently leave the topic with no questions
            for (const sub of d.subs || []) {
                assert(source.TOPICS.includes(sub), t.id + ": " + d.global + " has no sub-topic " + sub);
            }
        }
    }
});

Deno.test("every topic declares an area and a blurb, and claims its sentences", () => {
    const sentences = JSON.parse(Deno.readTextFileSync(ROOT + "sentences.json"));
    const topics = new Set(sentences.map(s => s.topic));
    const claimed = new Map();
    for (const t of GRAMMAR.TOPICS) {
        assert(t.area && t.blurb, t.id + ": needs an area and a blurb");
        for (const name of t.sentences || []) {
            assert(topics.has(name), t.id + ": sentences.json has no topic " + name);
            assert(!claimed.has(name), name + " is claimed by " + claimed.get(name) + " and " + t.id);
            claimed.set(name, t.id);
        }
    }
    for (const name of topics) assert(claimed.has(name), "no topic owns the sentences of " + name);
});

Deno.test("byId falls back to the first topic", () => {
    assertEquals(GRAMMAR.byId("comparatives").id, "comparatives");
    assertEquals(GRAMMAR.byId("nope").id, GRAMMAR.TOPICS[0].id);
});

Deno.test("every advertised drill resolves and builds a round", () => {
    const ds = GRAMMAR.streams();
    assert(ds.length >= 1);
    for (const d of ds) {
        const value = d.topicId + "::" + d.sub;
        assert(GRAMMAR.resolve(value, d.format), "cannot resolve " + value);
        const round = GRAMMAR.buildRound(value, 10, d.format);
        assertEquals(round.length, 10, value);
        for (const q of round) {
            assert(q.answer, value + ": a question with no answer");
            if (d.format === "choose") assert(q.options.includes(q.answer), value);
            else assert(!q.options, value + ": a typed question should offer no options");
        }
    }
});

Deno.test("All topics mixes the grammar drills", () => {
    const round = GRAMMAR.buildRound("__all__", 10);
    assertEquals(round.length, 10);
    assertEquals(new Set(round.map(q => q.prompt)).size, 10);
});

Deno.test("a round spreads over the streams the topic has", () => {
    const G = loadLibs().GRAMMAR;
    // Παραθετικά deals from four generators; forty rounds should visit all four
    // about evenly, because the deal queue carries across rounds.
    const subs = G.streams("comparatives").map(d => d.sub);
    const count = {};
    for (let r = 0; r < 40; r++)
        for (const q of G.buildRound("comparatives", 10, "choose"))
            count[q.topic] = (count[q.topic] || 0) + 1;
    const total = Object.values(count).reduce((a, b) => a + b, 0);
    const fair = total / subs.length;
    for (const sub of subs) {
        assert(count[sub], sub + " never came up in " + total + " questions");
        assert(count[sub] > fair * 0.8 && count[sub] < fair * 1.25,
               sub + " got " + count[sub] + " of " + total + " (fair share " + Math.round(fair) + ")");
    }
});

Deno.test("All topics reaches every topic that has a generator", () => {
    const G = loadLibs().GRAMMAR;
    const want = new Set(G.streams(null, "choose").map(d => d.topicId));
    const seen = new Set();
    for (let r = 0; r < 60; r++)
        for (const q of G.buildRound("__all__", 10, "choose")) if (q.topicId) seen.add(q.topicId);
    // buildRound does not tag the question with its topic, so fall back to the
    // sub-topic label, which is unique per stream.
    const labels = new Set();
    for (let r = 0; r < 60; r++)
        for (const q of G.buildRound("__all__", 10, "choose")) labels.add(q.topic);
    for (const d of G.streams(null, "choose")) {
        assert(labels.has(d.sub), d.topicId + " / " + d.sub + " never came up");
    }
    assert(want.size >= 3);
});
