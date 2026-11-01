import { assert, assertEquals } from "jsr:@std/assert@1";
import { ROOT, bootApp, loadLibs } from "./helpers.js";

const words     = JSON.parse(Deno.readTextFileSync(ROOT + "words.json"));
const sentences = JSON.parse(Deno.readTextFileSync(ROOT + "sentences.json"));
const texts     = JSON.parse(Deno.readTextFileSync(ROOT + "reading.json"));

Deno.test("a lesson only names things that exist", () => {
    const { LESSONS, GRAMMAR } = loadLibs();
    const topicIds = new Set(GRAMMAR.TOPICS.map(t => t.id));
    const textIds  = new Set(texts.map(t => t.id));
    const groups   = new Set(words.map(w => w.group));
    const seen = new Set();
    for (const l of LESSONS.all()) {
        assert(Number.isInteger(l.n), "a lesson needs a number");
        assert(!seen.has(l.n), "lesson " + l.n + " is listed twice");
        seen.add(l.n);
        assert(l.gr && l.en, "lesson " + l.n + " needs both titles");
        for (const id of l.topics) assert(topicIds.has(id), l.n + ": no grammar topic " + id);
        for (const id of l.texts)  assert(textIds.has(id),  l.n + ": no reading text " + id);
        for (const g of l.words)   assert(groups.has(g),    l.n + ": no word group " + g);
    }
});

Deno.test("every lesson holds something, and practises what it teaches", () => {
    const { LESSONS, PRACTICE } = loadLibs();
    PRACTICE.setSentences(sentences);
    for (const l of LESSONS.all()) {
        assert(l.topics.length || l.texts.length || l.words.length,
               "Μάθημα " + l.n + " holds nothing");
        PRACTICE.setLesson(l.n);
        const round = PRACTICE.buildRound(null, "mixed", 10);
        if (l.topics.length) {
            assert(round.length, "Μάθημα " + l.n + " teaches grammar but builds no round");
        } else {
            // Μάθημα 19 is vocabulary and reading; it owes a text instead
            assert(l.texts.length || l.words.length,
                   "Μάθημα " + l.n + " teaches no grammar and offers nothing to read");
            assertEquals(round.length, 0, "Μάθημα " + l.n + " should have no round");
        }
    }
    PRACTICE.setLesson(null);
});

Deno.test("a tagged exercise belongs to a lesson that claims its topic", () => {
    const { LESSONS, GRAMMAR } = loadLibs();
    for (const s of sentences) {
        if (s.lesson === undefined) continue;
        const l = LESSONS.byN(s.lesson);
        assert(l, s.id + ": Μάθημα " + s.lesson + " is not in the list");
        const owners = GRAMMAR.TOPICS.filter(t => (t.sentences || []).includes(s.topic)).map(t => t.id);
        assert(owners.some(id => l.topics.includes(id)),
               s.id + ": Μάθημα " + s.lesson + " does not teach " + s.topic);
    }
});

Deno.test("picking a lesson narrows every section", async () => {
    const app = await bootApp();
    app.switchLesson("17");
    assertEquals(app.state().lesson, "17");

    app.switchMode("manual");
    assertEquals(app.state().group, "imperative", "Grammar did not open the lesson's rule");

    app.switchMode("mixed");
    const items = app.practice().items;
    assert(items.length, "no round for the lesson");
    for (const i of items) {
        if (i.kind === "fill") assertEquals(String(i.lesson), "17", i.id + " is not from Μάθημα 17");
    }

    app.switchMode("read");
    assertEquals(app.state().group, "m6", "Reading did not open the lesson's text");

    app.switchMode("match");
    const groups = new Set(app.modePool().map(w => w.group));
    for (const g of groups) {
        assert(["At the doctor", "Doctors & specialists", "Bank & money"].includes(g),
               "Match served " + g + ", which Μάθημα 17 never taught");
    }
});

Deno.test("All lessons gives everything back", async () => {
    const app = await bootApp({ greek_lesson: "17" });
    assertEquals(app.state().lesson, "17");
    app.switchLesson("__all__");
    app.switchMode("match");
    assert(app.modePool().length > 800, "the whole dictionary should be back");
    app.switchMode("manual");
    const app2 = await bootApp();
    assertEquals(app2.state().lesson, "__all__", "a fresh app starts unfiltered");
});
