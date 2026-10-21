import { assert, assertEquals } from "jsr:@std/assert@1";
import { ROOT, bootApp } from "./helpers.js";

const texts = JSON.parse(Deno.readTextFileSync(ROOT + "reading.json"));

Deno.test("every text has a title, an id and paragraphs", () => {
    assert(texts.length >= 6, "only " + texts.length + " texts");
    const ids = new Set();
    for (const t of texts) {
        assert(t.id && !ids.has(t.id), "missing or repeated id: " + t.id);
        ids.add(t.id);
        assert(t.title && t.title.length > 3, "no title: " + t.id);
        assert(t.parts.length, t.title + " has no parts");
        for (const p of t.parts) {
            if (p.heading) continue;
            assert(p.gr && p.gr.length, t.title + ": a part with no Greek");
            for (const line of [...(p.gr || []), ...(p.en || [])])
                assert(line.trim(), t.title + ": an empty line");
        }
    }
});

Deno.test("the Greek is Greek and the translation is not", () => {
    const greek = /[Ͱ-Ͽ]/;
    for (const t of texts)
        for (const p of t.parts) {
            for (const line of p.gr || [])
                if (!/^—?\s*["«]/.test(line))
                    assert(greek.test(line), t.title + ": not Greek — " + line.slice(0, 40));
            for (const line of p.en || [])
                assert(!greek.test(line.replace(/<[^>]+>/g, "")) || /Kiki|Όλυμπο/.test(line),
                       t.title + ": Greek in the translation — " + line.slice(0, 40));
        }
});

Deno.test("no markdown survived the conversion", () => {
    for (const t of texts)
        for (const p of t.parts)
            for (const line of [...(p.gr || []), ...(p.en || []), p.heading || ""])
                assert(!/\*\*|^>|^#/.test(line), t.title + ": raw markdown — " + line.slice(0, 40));
});

Deno.test("Reading is a Practice tab that opens a text", async () => {
    const app = await bootApp();
    app.switchMode("read");
    await new Promise(r => setTimeout(r, 0));
    assertEquals(app.state().section, "practice");
    const box = app.el("reading-container");
    assert(box.children.length > 2, "nothing was rendered");
    assertEquals(box.children[0].textContent, texts[0].title);
});

Deno.test("each text can be picked from the dropdown", async () => {
    const app = await bootApp();
    app.switchMode("read");
    await new Promise(r => setTimeout(r, 0));
    for (const t of texts) {
        app.switchGroup(t.id);
        assertEquals(app.el("reading-container").children[0].textContent, t.title);
    }
});
