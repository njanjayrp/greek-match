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

// The texts written from the marked list must stay inside the dictionary.
import { unknownWords } from "./vocab_check.js";
const words = JSON.parse(Deno.readTextFileSync(ROOT + "words.json"));

Deno.test("the marked-word texts use no word outside the dictionary", () => {
    const written = texts.filter(t => t.group === "Your marked words");
    assert(written.length >= 5, "only " + written.length + " marked-word texts");
    for (const t of written) {
        const greek = t.parts.flatMap(p => p.gr || []).join(" ");
        const outside = unknownWords(greek, words);
        assertEquals(outside, [], t.title + " uses: " + outside.join(", "));
    }
});

Deno.test("between them they reach every marked word", () => {
    const greek = texts.filter(t => t.group === "Your marked words")
        .flatMap(t => t.parts.flatMap(p => p.gr || [])).join(" ");
    // ό,τι is one word with a comma in the middle, so commas go before splitting
    const strip = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                        .toLowerCase().replace(/\u03c2/g, "\u03c3").replace(/,/g, "");
    const inText = strip(greek).split(/[^α-ωa-z]+/).filter(Boolean)
        .flatMap(w => (/^ε/.test(w) && w.length > 4) ? [w, w.slice(1)] : [w]);
    const close = (w, f) => {
        let i = 0;
        while (i < w.length && i < f.length && w[i] === f[i]) i++;
        return i >= 3 && f.length - i <= 3 && w.length - i <= 6;
    };
    const missed = words.filter(x => x.marked).filter(x => {
        const forms = x.greek.replace(/^(ο \/ η |η |ο |το |τα )/, "").split(/[()/]/)
            .map(f => strip(f.trim()).split(" ")[0]).filter(f => f.length > 2);
        return !forms.some(f => inText.some(w => close(w, f)));
    });
    assertEquals(missed.map(m => m.greek), [], "never used in any text");
});
