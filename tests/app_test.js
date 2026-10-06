import { assert, assertEquals } from "jsr:@std/assert@1";
import { bootApp } from "./helpers.js";

const MODES = ["match", "type", "browse", "fill", "conj", "dates", "manual", "compare"];

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
    app.switchMode("conj");
    assertEquals(app.state().section, "practice");
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

Deno.test("Grammar is its own section, with the manual and the drill", async () => {
    const app = await bootApp();
    app.switchMode("manual");
    assertEquals(app.state().section, "grammar");
    app.switchMode("compare");
    assertEquals(app.state().section, "grammar");
    assertEquals(app.el("dates-progress").textContent, "1 / 10");
});

Deno.test("Compare and Dates keep separate topic filters", async () => {
    const app = await bootApp();
    app.switchMode("dates");
    app.switchGroup("Ordinals");
    app.switchMode("compare");
    assertEquals(app.state().group, "__all__");
    app.switchGroup("Υπερθετικός");
    app.switchMode("dates");
    assertEquals(app.state().group, "Ordinals");
});

Deno.test("Conjugate deals ten questions, one per verb", async () => {
    const app = await bootApp();
    app.switchMode("conj");
    const progress = app.el("conj-progress").textContent;
    assertEquals(progress, "1 / 10");
});
