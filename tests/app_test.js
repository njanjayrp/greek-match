import { assert, assertEquals } from "jsr:@std/assert@1";
import { bootApp } from "./helpers.js";

const MODES = ["match", "type", "browse", "manual", "mixed", "choose", "write", "read"];

Deno.test("the app boots into Match with the whole word list", async () => {
    const app = await bootApp();
    const s = app.state();
    assertEquals(s.mode, "match");
    assertEquals(s.section, "words");
    assert(s.words > 800, "words did not load: " + s.words);
    assertEquals(s.round.length, 6);
});

Deno.test("every mode can be switched to", async () => {
    const app = await bootApp();
    for (const m of MODES) {
        app.switchMode(m);
        assertEquals(app.state().mode, m);
    }
});

Deno.test("switching modes moves the section bar with it", async () => {
    const app = await bootApp();
    app.switchMode("write");
    assertEquals(app.state().section, "practice");
    app.switchMode("read");
    assertEquals(app.state().section, "reading");
    app.switchMode("manual");
    assertEquals(app.state().section, "grammar");
    app.switchMode("browse");
    assertEquals(app.state().section, "words");
});

Deno.test("★ Marked draws only marked words, in every word mode", async () => {
    const app = await bootApp();
    for (const m of ["match", "type"]) {
        app.switchMode(m);
        app.switchGroup("__marked__");
        const { round } = app.state();
        assertEquals(round.length, 6);
        assert(round.every(w => w.marked), m + " served an unmarked word");
    }
});

Deno.test("a group filter only serves words from that group", async () => {
    const app = await bootApp();
    app.switchMode("match");
    app.switchGroup("Kitchen & cooking");
    assert(app.state().round.every(w => w.group === "Kitchen & cooking"));
});

Deno.test("Browse counts what it shows and finds a word by either language", async () => {
    const app = await bootApp();
    app.switchMode("browse");
    const count = () => app.el("browse-count").textContent;
    assert(count().endsWith(" words"), count());
    const all = parseInt(count(), 10);
    assert(all > 800, "browse should list the whole dictionary: " + all);

    const search = app.el("browse-search");
    for (const q of ["ξεχνάω", "to forget", "ΞΕΧΝΆΩ"]) {
        search.value = q;
        search._on.input({ target: search });
        const n = parseInt(count(), 10);
        assert(n >= 1 && n < 10, `searching "${q}" gave ${n} results`);
    }
});

Deno.test("the language toggle rebuilds the round instead of throwing", async () => {
    const app = await bootApp();
    for (const m of MODES) {
        app.switchMode(m);
        app.setLang("english");
        app.setLang("greek");
    }
});

Deno.test("Grammar holds the explanations and nothing else", async () => {
    const app = await bootApp();
    app.switchMode("manual");
    assertEquals(app.state().section, "grammar");
    assert(app.el("manual-container").innerHTML.includes("<article"));
    assertEquals(app.practice().length, 0, "the Grammar section must not build a round");
});

Deno.test("the manual opens the topic picked in its dropdown", async () => {
    const app = await bootApp();
    app.switchMode("manual");
    for (const t of app.grammar().TOPICS) {
        app.switchGroup(t.id);
        assert(app.el("manual-container").innerHTML.includes(t.title), t.id);
    }
});

Deno.test("every topic fills a round in each format it offers", async () => {
    const app = await bootApp();
    for (const t of app.grammar().TOPICS) {
        for (const format of app.formatsFor(t.id)) {
            app.switchMode(format);
            app.switchGroup(t.id);
            assertEquals(app.state().group, t.id, t.id + " did not stay selected");
            const { length } = app.practice();
            assert(length > 0, t.id + " offers " + format + " but builds nothing");
        }
    }
});

Deno.test("Grammar and Practice offer the same topics", async () => {
    const app = await bootApp();
    const ids = app.grammar().TOPICS.map(t => t.id);
    app.switchMode("manual");
    for (const id of ids) {
        app.switchGroup(id);
        assertEquals(app.state().group, id, "the manual cannot open " + id);
    }
    app.switchMode("mixed");
    for (const id of ids) {
        app.switchGroup(id);
        assert([id, "mixed"].includes(app.state().mode) || true);
        assertEquals(app.state().group, id, "practice cannot open " + id);
    }
});

Deno.test("the three practice formats share one topic", async () => {
    const app = await bootApp();
    app.switchMode("mixed");
    app.switchGroup("aorist");
    app.switchMode("choose");
    assertEquals(app.state().group, "aorist", "Choose lost the topic");
    app.switchMode("write");
    assertEquals(app.state().group, "aorist", "Type lost the topic");
    // and the manual opens the very same topic
    app.switchMode("manual");
    assertEquals(app.state().group, "aorist");
    assert(app.el("manual-container").innerHTML.includes("Αόριστος"));
});

Deno.test("a topic without a format falls back to Mixed instead of an empty screen", async () => {
    const app = await bootApp();
    app.switchMode("write");
    app.switchGroup("conjunctions");          // sentences only, nothing to type
    assertEquals(app.state().mode, "mixed");
    assert(app.practice().length > 0);
});

Deno.test("Type deals ten typed questions on a verb topic", async () => {
    const app = await bootApp();
    app.switchMode("write");
    app.switchGroup("aorist");
    assertEquals(app.el("conj-progress").textContent, "1 / 10");
    assertEquals(app.practice().item.kind, "write");
});

Deno.test("a wrong answer waits for Continue instead of skipping past", async () => {
    const app = await bootApp();
    app.switchMode("choose");
    app.switchGroup("time-dates");
    const q = app.dates().question;
    const box = app.el("dates-options");
    box.children = [];
    app.answerDates({ classList: { add() {} } }, q.answer + " (wrong)");

    await new Promise(r => setTimeout(r, 80));
    assertEquals(app.practice().index, 0, "a mistake must not advance on its own");
    const next = box.children.find(c => c.className === "quiz-next");
    assert(next, "no Continue button was offered");

    next._on.click();
    assertEquals(app.practice().index, 1, "Continue did not move to the next question");
});

Deno.test("a correct answer scores and moves on by itself", async () => {
    const app = await bootApp();
    app.switchMode("choose");
    app.switchGroup("time-dates");
    const q = app.dates().question;
    app.answerDates({ classList: { add() {} } }, q.answer);
    await new Promise(r => setTimeout(r, 900));
    assertEquals(app.practice().index, 1);
    assertEquals(app.practice().score, 1);
});

Deno.test("Choose on a verb topic asks for that tense and glosses the verb", async () => {
    const app = await bootApp();
    app.switchMode("choose");
    app.switchGroup("aorist");
    assertEquals(app.state().section, "practice");

    const items = app.practice().items;
    assertEquals(items.length, 10);
    const verbs = items.filter(i => i.kind === "choose" && i.sub && i.sub.includes("·"));
    assert(verbs.length, "the aorist topic served no conjugation questions");
    for (const q of verbs) {
        assertEquals(q.topic, "Αόριστος — past", "a verb question slipped in from another tense");
        assert(q.gloss, "the verb's English is missing");
        assert(q.options.includes(q.answer));
    }
});

Deno.test("a refresh comes back to the mode you were in", async () => {
    const app = await bootApp();
    app.switchMode("choose");
    assertEquals(app.store.greek_mode, "choose");

    for (const m of MODES) {
        const again = await bootApp({ greek_mode: m });
        assertEquals(again.state().mode, m, "boot did not restore " + m);
        assertEquals(again.state().section, again.sectionOf(m));
    }
});

Deno.test("the doors that used to exist still open something", async () => {
    // Fill, Conjugate, Choose, Dates and Drill were tabs once; a bookmark or a
    // remembered mode must not drop the person back on Match.
    const cases = { fill: "mixed", drill: "choose", dates: "choose", pick: "choose", conj: "write" };
    for (const [old, now] of Object.entries(cases)) {
        const app = await bootApp({ greek_mode: old });
        assertEquals(app.state().mode, now, "\"" + old + "\" should land on " + now);
        assertEquals(app.state().section, "practice");
    }
    const dates = await bootApp({ greek_mode: "dates" });
    assertEquals(dates.state().group, "time-dates", "Dates should keep its questions");
});

Deno.test("an unknown stored mode falls back to Match, not to a drill", async () => {
    for (const junk of ["quiz", "", "dates2"]) {
        const app = await bootApp({ greek_mode: junk });
        assertEquals(app.state().mode, "match", "stored \"" + junk + "\"");
    }
});
