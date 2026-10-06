import { assert, assertEquals } from "jsr:@std/assert@1";
import { loadLibs } from "./helpers.js";

const { COMPARE } = loadLibs();

Deno.test("every topic fills a round", () => {
    for (const t of COMPARE.TOPICS) {
        const round = COMPARE.buildRound(t, 10);
        assertEquals(round.length, 10, t);
        for (const q of round) {
            assert(q.prompt && q.answer, t + ": empty question");
            assert(q.options.includes(q.answer), t + ": answer not offered");
            assertEquals(new Set(q.options).size, q.options.length, t + ": duplicate options");
            assert(q.options.length >= 2 && q.options.length <= 4, t + ": option count");
        }
    }
});

Deno.test("plural forms keep their accent", () => {
    const f = COMPARE.FORM_OF;
    const cheap = COMPARE.ADJ.find(a => a.m === "φτηνός");
    assertEquals([f.pm(cheap), f.pf(cheap), f.pn(cheap)], ["φτηνοί", "φτηνές", "φτηνά"]);
    const big = COMPARE.ADJ.find(a => a.m === "μεγάλος");
    assertEquals([f.pm(big), f.pf(big), f.pn(big)], ["μεγάλοι", "μεγάλες", "μεγάλα"]);
});

// The answer must agree with the subject; the wrong-gender forms are the distractors.
Deno.test("the comparative answer agrees with its subject", () => {
    for (let i = 0; i < 200; i++) {
        for (const q of COMPARE.buildRound("Συγκριτικός", 4)) {
            assert(/ είναι (λίγο |πολύ )?πιο \S+ από /.test(q.answer), q.answer);
            const subject = q.answer.split(" είναι ")[0];
            const adj = q.answer.match(/πιο (\S+) από/)[1];
            if (/^Το /.test(subject)) assert(/[οό]$/.test(adj), subject + " → " + adj);
            if (/^Η /.test(subject))  assert(/[ηήαά]$/.test(adj), subject + " → " + adj);
            if (/^Ο /.test(subject))  assert(/[οό]ς$/.test(adj), subject + " → " + adj);
            if (/^Τα /.test(subject)) assert(/[αά]$/.test(adj), subject + " → " + adj);
        }
    }
});

Deno.test("the superlative answer carries the right article", () => {
    for (let i = 0; i < 200; i++) {
        for (const q of COMPARE.buildRound("Υπερθετικός", 4)) {
            const [art, pio] = q.answer.split(" ");
            assert(["ο", "η", "το", "οι", "τα"].includes(art), q.answer);
            assertEquals(pio, "πιο", q.answer);
        }
    }
});

Deno.test("τόσο pairs with όσο, λιγότερο with από", () => {
    for (let i = 0; i < 200; i++) {
        for (const q of COMPARE.buildRound("Ίδιο & λιγότερο", 4)) {
            if (q.answer.startsWith("τόσο")) assert(q.answer.includes(" όσο "), q.answer);
            else assert(/λιγότερο .+ από /.test(q.answer), q.answer);
        }
    }
});

Deno.test("the one-word comparatives are the real ones", () => {
    const want = { καλός: "καλύτερος", κακός: "χειρότερος",
                   μεγάλος: "μεγαλύτερος", μικρός: "μικρότερος" };
    for (const [plain, comp] of Object.entries(want)) {
        assertEquals(COMPARE.ADJ.find(a => a.m === plain).syn, comp);
    }
    for (let i = 0; i < 100; i++) {
        for (const q of COMPARE.buildRound("Μονολεκτικά", 4)) {
            assert(!/πιο \S*τερ/.test(q.answer), "double comparative: " + q.answer);
        }
    }
});

// "tall ice cream" and friends: every adjective is picked from the subject's own list.
Deno.test("adjectives stay sensible for their subject", () => {
    for (let i = 0; i < 300; i++) {
        for (const q of COMPARE.buildRound(null, 4)) {
            assert(!/παγωτό.*(ψηλ|κοντ|αυστηρ)/.test(q.answer), q.answer);
            assert(!/(αεροπλάνο|ποδήλατο|δωμάτιο).*(αυστηρ|νόστιμ|ψηλ)/.test(q.answer), q.answer);
        }
    }
});
