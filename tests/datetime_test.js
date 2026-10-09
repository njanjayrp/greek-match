import { assert, assertEquals } from "jsr:@std/assert@1";
import { loadLibs } from "./helpers.js";

const { DATETIME } = loadLibs();
const GREEK = /[Ͱ-Ͽἀ-῿]/;

Deno.test("every topic fills a round in both directions", () => {
    for (const topic of DATETIME.TOPICS) {
        for (const dir of ["gr", "en"]) {
            const round = DATETIME.buildRound(topic, 10, dir);
            assertEquals(round.length, 10, `${topic} ${dir}`);
            for (const q of round) {
                assert(q.prompt && q.answer, `${topic} ${dir}: empty question`);
                assert(q.options.includes(q.answer), `${topic} ${dir}: answer not offered`);
                assertEquals(new Set(q.options).size, q.options.length, "duplicate options");
                assert(q.options.length >= 2 && q.options.length <= 4, "option count");
            }
        }
    }
});

Deno.test("the default direction asks for the Greek", () => {
    for (const topic of DATETIME.TOPICS) {
        for (const q of DATETIME.buildRound(topic, 10)) {
            assert(GREEK.test(q.answer), `${topic}: answer is not Greek — ${q.prompt} => ${q.answer}`);
        }
    }
});

Deno.test("an all-topics round mixes without repeating a prompt", () => {
    const round = DATETIME.buildRound(null, 10, "gr");
    assertEquals(round.length, 10);
    assertEquals(new Set(round.map(q => q.prompt)).size, 10);
});

Deno.test("Ordinals is one of the topics and drills 1-10", () => {
    assert(DATETIME.TOPICS.includes("Ordinals"));
    const seen = new Set();
    for (let i = 0; i < 40; i++) {
        for (const q of DATETIME.buildRound("Ordinals", 10, "gr")) seen.add(q.answer);
    }
    for (const o of ["πρώτος", "δέκατος"]) {
        assert([...seen].some(a => a.includes(o)), "never drilled " + o);
    }
});

Deno.test("numbers and years read out correctly", () => {
    assertEquals(DATETIME.num(3, "fem"), "τρεις");
    assertEquals(DATETIME.num(24, "neut"), "είκοσι τέσσερα");
    assertEquals(DATETIME.yearWords(1985), "χίλια εννιακόσια ογδόντα πέντε");
    assertEquals(DATETIME.yearWords(2024), "δύο χιλιάδες είκοσι τέσσερα");
    assertEquals(DATETIME.timeWords(9, 45), "δέκα παρά τέταρτο");
});

// 9 p.m. is το βράδυ, never το απόγευμα: the part of the day follows the clock.
const PART_OF = {
    "a.m.": h => (h <= 4 ? "τη νύχτα" : "το πρωί"),
    "p.m.": h => (h <= 3 ? "το μεσημέρι" : h <= 7 ? "το απόγευμα" : "το βράδυ")
};

Deno.test("the part of the day matches the hour, and only one option does", () => {
    const seen = new Set();
    for (let i = 0; i < 3000; i++)
        for (const q of DATETIME.buildRound("Time", 1)) {
            const m = /^(\d+) (a\.m\.|p\.m\.)$/.exec(q.prompt);
            if (!m) continue;
            const [, h, half] = m;
            seen.add(q.prompt);
            const want = PART_OF[half](+h);
            assert(q.answer.endsWith(" " + want),
                   `${q.prompt} answered "${q.answer}", wanted ${want}`);
            // A distractor may reuse the part with another hour; what it must
            // never do is pair this hour with a part that also fits it.
            const hour = q.answer.slice(0, q.answer.lastIndexOf(" " + want));
            const alsoRight = q.options.filter(o => o !== q.answer && o.startsWith(hour + " "));
            assertEquals(alsoRight.filter(o => o.endsWith(" " + want)).length, 0,
                         `${q.prompt} offers two right answers: ${q.options.join(" / ")}`);
        }
    assert(seen.size >= 20, "only " + seen.size + " distinct hours came up");
});

Deno.test("reading a Greek hour back gives one unambiguous time of day", () => {
    for (let i = 0; i < 2000; i++)
        for (const q of DATETIME.buildRound("Time", 1, "en")) {
            if (q.sub !== "Πότε;") continue;
            const m = /(\d+) (a\.m\.|p\.m\.)$/.exec(q.answer);
            assert(m, q.answer);
            const want = PART_OF[m[2]](+m[1]);
            assert(q.prompt.endsWith(want), `"${q.prompt}" answered ${q.answer}`);
        }
});
