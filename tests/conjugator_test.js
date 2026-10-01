import { assert, assertEquals } from "jsr:@std/assert@1";
import { loadLibs, readWords } from "./helpers.js";

const win = loadLibs();
const { CONJUGATOR } = win;
const words = readWords();

const deps = {};
for (const w of words) {
    const m = /^([^\s(]+)\s*\(([^)]+)\)$/.exec(w.greek);
    if (m) deps[m[1]] = m[2];
}

// forms() prefers the hand-written table; these tests want the rules themselves.
function derived(entry) {
    const saved = win.CONJUGATIONS;
    win.CONJUGATIONS = [];
    try { return CONJUGATOR.forms(entry); } finally { win.CONJUGATIONS = saved; }
}

Deno.test("derived forms agree with the hand-written tables", () => {
    let cells = 0;
    const diffs = [];
    for (const v of win.CONJUGATIONS) {
        if (!deps[v.lemma]) continue;
        const d = derived(v.lemma + " (" + deps[v.lemma] + ")");
        for (const t of ["present", "imperfect", "aorist", "future"]) {
            const hand = v[t] || [], gen = d[t] || [];
            if (!hand.length || !gen.length) continue;
            for (let i = 0; i < 6; i++) {
                cells++;
                if (hand[i] !== gen[i]) diffs.push(`${v.lemma} ${t}[${i}]: ${hand[i]} vs ${gen[i]}`);
            }
        }
    }
    assert(cells > 500, "expected to compare the whole drill list, got " + cells);
    // The leftovers are colloquial variants (έλεγανε / λέγανε), not wrong forms.
    assert(diffs.length <= 7, "new disagreements:\n" + diffs.join("\n"));
});

Deno.test("hand-written tables win over the rules", () => {
    const f = CONJUGATOR.forms("παίρνω (πάρω)");
    assertEquals(f.derived, false);
    assertEquals(f.aorist[0], "πήρα");
});

Deno.test("regular verbs come out right", () => {
    const f = derived("αγοράζω (αγοράσω)");
    assertEquals(f.present.slice(0, 3), ["αγοράζω", "αγοράζεις", "αγοράζει"]);
    assertEquals(f.imperfect[0], "αγόραζα");
    assertEquals(f.aorist.slice(0, 4), ["αγόρασα", "αγόρασες", "αγόρασε", "αγοράσαμε"]);
    assertEquals(f.future[0], "θα αγοράσω");
});

Deno.test("contract, mediopassive and vowel-stem verbs each follow their own pattern", () => {
    assertEquals(derived("ρωτάω (ρωτήσω)").present[1], "ρωτάς");
    assertEquals(derived("οδηγώ (οδηγήσω)").present[1], "οδηγείς");
    assertEquals(derived("σηκώνομαι (σηκωθώ)").imperfect[0], "σηκωνόμουν");
    assertEquals(derived("σηκώνομαι (σηκωθώ)").aorist[0], "σηκώθηκα");
    assertEquals(derived("λέω (πω)").present[3], "λέμε");
    assertEquals(derived("μαγειρεύω (μαγειρέψω)").present[1], "μαγειρεύεις");   // not a vowel stem
});

Deno.test("one-syllable forms carry no accent", () => {
    assertEquals(derived("λέω (πω)").present[1], "λες");
    assertEquals(derived("κλαίω (κλάψω)").present[1], "κλαις");
    assertEquals(derived("τρώω (φάω)").future[1], "θα φας");
});

Deno.test("compound verbs take the augment inside", () => {
    assertEquals(derived("παραλαμβάνω (παραλάβω)").aorist[0], "παρέλαβα");
    assertEquals(derived("ανεβαίνω (ανέβω)").aorist[0], "ανέβηκα");
});

Deno.test("nouns and adjectives get no table", () => {
    for (const e of ["το σπίτι", "η ουρά", "γεμάτος", "αριστερά", "ενώ"]) {
        assertEquals(CONJUGATOR.forms(e), null, e + " should not be a verb");
    }
});

Deno.test("every dictionary verb produces six forms per tense it has", () => {
    let verbs = 0;
    for (const w of words) {
        const f = CONJUGATOR.forms(w.greek);
        if (!f) continue;
        verbs++;
        for (const t of ["present", "imperfect", "aorist", "future"]) {
            if (!f[t] || !f[t].length) continue;
            assertEquals(f[t].length, 6, `${w.greek} ${t}`);
            for (const cell of f[t]) assert(cell.trim().length, `${w.greek} ${t} empty cell`);
        }
    }
    assert(verbs > 150, "expected the dictionary to be full of verbs, found " + verbs);
});
