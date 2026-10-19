import { assert, assertEquals } from "jsr:@std/assert@1";
import { loadLibs } from "./helpers.js";

const { CONJCHOICE, CONJUGATIONS } = loadLibs();
const TENSE_OF = { "Ενεστώτας":"present", "Παρατατικός":"imperfect",
                   "Αόριστος":"aorist", "Μέλλοντας":"future" };
const byLemma = Object.fromEntries(CONJUGATIONS.map(v => [v.lemma, v]));

Deno.test("every tense fills a round of ten", () => {
    for (const t of [null, ...CONJCHOICE.TOPICS]) {
        const round = CONJCHOICE.buildRound(t, 10);
        assertEquals(round.length, 10, String(t));
        for (const q of round) {
            assert(q.options.includes(q.answer), "answer not offered: " + q.prompt);
            assertEquals(new Set(q.options).size, q.options.length, "duplicate options");
            assert(q.options.length >= 3 && q.options.length <= 4, "option count");
            assert(q.gloss, "no English for " + q.prompt);
        }
    }
});

Deno.test("the answer is that verb's form for the tense and person asked", () => {
    for (let r = 0; r < 60; r++)
        for (const q of CONJCHOICE.buildRound(null, 10)) {
            const v = byLemma[q.prompt];
            assert(v, "unknown verb " + q.prompt);
            const tense = TENSE_OF[q.topic];
            const person = ["εγώ","εσύ","αυτός / αυτή","εμείς","εσείς","αυτοί / αυτές"]
                .indexOf(q.sub.split(" — ")[0]);
            assert(person >= 0, "unreadable person: " + q.sub);
            assertEquals(q.answer, CONJCHOICE.form(v, tense, person),
                         `${q.prompt} ${tense} ${person}`);
        }
});

Deno.test("the wrong options are real forms of the same verb", () => {
    for (let r = 0; r < 60; r++)
        for (const q of CONJCHOICE.buildRound(null, 10)) {
            const v = byLemma[q.prompt];
            const all = new Set();
            for (const t of Object.values(TENSE_OF))
                for (let p = 0; p < 6; p++) {
                    const f = CONJCHOICE.form(v, t, p);
                    if (f) all.add(f);
                }
            for (const o of q.options)
                assert(all.has(o), `${o} is not a form of ${q.prompt}`);
        }
});

Deno.test("picking a tense asks only that tense", () => {
    for (const t of CONJCHOICE.TOPICS)
        for (const q of CONJCHOICE.buildRound(t, 10))
            assertEquals(q.topic, t);
});

Deno.test("the present is never asked in the 1sg it already prints", () => {
    for (let r = 0; r < 100; r++)
        for (const q of CONJCHOICE.buildRound(null, 10))
            assert(!(q.topic === "Ενεστώτας" && q.answer === q.prompt),
                   "asked for the lemma it had just shown: " + q.prompt);
});

Deno.test("every verb comes up before any verb comes up twice", () => {
    const lib = loadLibs();
    const verbs = lib.CONJUGATIONS.filter(v =>
        ["present","imperfect","aorist","future"].filter(t => v[t]).length > 1);
    const seen = [];
    while (seen.length < verbs.length)
        for (const q of lib.CONJCHOICE.buildRound(null, 10)) seen.push(q.prompt);
    const firstPass = seen.slice(0, verbs.length);
    assertEquals(new Set(firstPass).size, verbs.length,
                 "a verb repeated before the pool was exhausted");
});
