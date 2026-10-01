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
