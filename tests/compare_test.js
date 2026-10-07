import { assert, assertEquals } from "jsr:@std/assert@1";
import { loadLibs, ROOT } from "./helpers.js";

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

// The answer must carry exactly the form the subject's gender and number ask
// for; the other five forms are what the distractors are made of.
Deno.test("the comparative answer agrees with its subject", () => {
    const byName = {};
    for (const n of COMPARE.nouns()) byName[n.nom] = n;
    for (let i = 0; i < 200; i++) {
        for (const q of COMPARE.buildRound("Συγκριτικός", 4)) {
            assert(/ είναι (λίγο |πολύ )?πιο \S+ από /.test(q.answer), q.answer);
            const subject = q.answer.split(" είναι ")[0];
            const used    = q.answer.match(/πιο (\S+) από/)[1];
            const noun    = byName[subject];
            assert(noun, "subject is not a dictionary noun: " + subject);
            const adj = q.prompt.split(" / ").map(p => COMPARE.ADJ.find(a => a.m === p)).find(Boolean);
            assert(adj, "the prompt names no adjective: " + q.prompt);
            assertEquals(used, COMPARE.FORM_OF[noun.g](adj), subject + " (" + noun.g + ")");
        }
    }
});

// A superlative is the article plus either πιο + adjective or the one-word form.
Deno.test("the superlative answer carries the right article", () => {
    for (let i = 0; i < 200; i++) {
        for (const q of COMPARE.buildRound("Υπερθετικός", 4)) {
            const [art, second] = q.answer.split(" ");
            assert(["ο", "η", "το", "οι", "τα"].includes(art), q.answer);
            if (q.sub.includes("μονολεκτικός"))
                assert(COMPARE.SYN.some(a => ["m","f","n","pm","pf","pn"]
                        .some(g => COMPARE.synOf(a, g) === second)), q.answer);
            else
                assertEquals(second, "πιο", q.answer);
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

Deno.test("the drill builds its sentences out of the dictionary", () => {
    const C = loadLibs().COMPARE;
    assert(C.nouns().length > 250, "only " + C.nouns().length + " nouns reached the drill");
    const groups = new Set(C.nouns().map(n => n.group));
    assert(groups.size > 12, "nouns come from too few groups: " + groups.size);
});

Deno.test("a round of ten repeats neither a sentence nor a noun pair much", () => {
    const C = loadLibs().COMPARE;
    const subjects = new Set(), prompts = new Set();
    for (let r = 0; r < 20; r++)
        for (const q of C.buildRound("Συγκριτικός", 10)) {
            prompts.add(q.prompt);
            subjects.add(q.prompt.split(" / ")[0]);
        }
    assert(prompts.size > 150, "200 questions gave only " + prompts.size + " distinct prompts");
    assert(subjects.size > 60, "only " + subjects.size + " distinct subjects in 200 questions");
});

Deno.test("both sides of a comparison are the same kind of thing", () => {
    const C = loadLibs().COMPARE;
    const byName = {};
    for (const n of C.nouns()) byName[n.nom] = n;
    for (let i = 0; i < 400; i++) {
        const q = C.buildRound("Συγκριτικός", 1)[0];
        const subj = byName[q.prompt.split(" / ")[0]];
        assert(subj, "unknown subject: " + q.prompt);
        const other = C.nouns().filter(n => q.answer.endsWith("από " + n.acc + "."));
        assert(other.length, "no noun matches the comparand in: " + q.answer);
        assert(other.some(n => n.group === subj.group && n.kinds.some(k => subj.kinds.includes(k))),
               "compared across kinds: " + q.answer);
    }
});

Deno.test("the accusative is formed for every gender and number", () => {
    const C = loadLibs().COMPARE;
    const cases = [
        ["ο", "καφές", "τον καφέ"], ["ο", "έλεγχος ασφαλείας", "τον έλεγχο ασφαλείας"],
        ["η", "φούστα", "τη φούστα"], ["η", "πισίνα", "την πισίνα"],
        ["η", "τσάντα πλάτης", "την τσάντα πλάτης"], ["η", "λίμνη", "τη λίμνη"],
        ["το", "δωμάτιο", "το δωμάτιο"], ["τα", "θαλασσινά", "τα θαλασσινά"],
        ["οι", "υπότιτλοι", "τους υπότιτλους"], ["οι", "γονείς", "τους γονείς"],
        ["οι", "μπότες", "τις μπότες"], ["οι", "εξετάσεις", "τις εξετάσεις"]
    ];
    for (const [art, rest, want] of cases)
        assertEquals(C.accOf(art, rest, C.slotOf(art, rest)), want, art + " " + rest);
});

Deno.test("every form of every adjective is derived, accents included", () => {
    const C = loadLibs().COMPARE;
    const want = {
        "παλιός":   ["παλιός", "παλιά", "παλιό", "παλιοί", "παλιές", "παλιά"],
        "κρύος":    ["κρύος", "κρύα", "κρύο", "κρύοι", "κρύες", "κρύα"],
        "ωραίος":   ["ωραίος", "ωραία", "ωραίο", "ωραίοι", "ωραίες", "ωραία"],
        "γρήγορος": ["γρήγορος", "γρήγορη", "γρήγορο", "γρήγοροι", "γρήγορες", "γρήγορα"],
        "ακριβός":  ["ακριβός", "ακριβή", "ακριβό", "ακριβοί", "ακριβές", "ακριβά"],
        "παχύς":    ["παχύς", "παχιά", "παχύ", "παχιοί", "παχιές", "παχιά"],
        "μοντέρνος":["μοντέρνος", "μοντέρνα", "μοντέρνο", "μοντέρνοι", "μοντέρνες", "μοντέρνα"]
    };
    for (const [m, forms] of Object.entries(want)) {
        const a = C.genders(m);
        assertEquals(["m","f","n","pm","pf","pn"].map(g => a[g]), forms, m);
    }
    for (const a of C.ADJ)
        for (const g of ["m","f","n","pm","pf","pn"])
            assert(a[g] && !/[^\u0370-\u03ff\u1f00-\u1fff ]/.test(a[g]), a.m + " has no " + g);
});

Deno.test("the one-word comparative is drilled in all six gender/number slots", () => {
    const C = loadLibs().COMPARE;
    const slots = new Set(["m", "f", "n", "pm", "pf", "pn"]);
    for (let i = 0; i < 600 && slots.size; i++) {
        const q = C.buildRound("Μονολεκτικά", 1)[0];
        for (const g of [...slots])
            if (C.SYN.some(a => q.answer === C.synOf(a, g))) slots.delete(g);
    }
    assertEquals([...slots], [], "these slots never came up");
});

Deno.test("περισσότερος declines off a fixed stem, πολύς does not", () => {
    const C = loadLibs().COMPARE;
    const polys = C.SYN.find(a => a.m === "πολύς");
    assert(polys, "πολύς is missing from the adjective table");
    assertEquals(polys.syn, "περισσότερος");
    assertEquals(["m", "f", "n", "pm", "pf", "pn"].map(g => C.synOf(polys, g)),
                 ["περισσότερος", "περισσότερη", "περισσότερο",
                  "περισσότεροι", "περισσότερες", "περισσότερα"]);
    assertEquals(["pm", "pf", "pn"].map(g => C.FORM_OF[g](polys)),
                 ["πολλοί", "πολλές", "πολλά"]);
});

Deno.test("the agreement question offers one right ending and three wrong ones", () => {
    const C = loadLibs().COMPARE;
    let agree = 0;
    for (let i = 0; i < 300; i++) {
        const q = C.buildRound("Μονολεκτικά", 1)[0];
        if (q.sub !== "Ταίριαξε την κατάληξη") continue;
        agree++;
        assert(q.options.includes(q.answer));
        assertEquals(new Set(q.options).size, q.options.length, "duplicate option: " + q.prompt);
        assert(q.prompt.includes("______"), q.prompt);
        assert(q.options.filter(o => o === q.answer).length === 1);
    }
    assert(agree > 20, "the agreement generator barely fires: " + agree);
});

Deno.test("the drill survives being loaded before the dictionary", () => {
    const win = { WORDS: undefined };
    win.window = win;
    new Function("window", Deno.readTextFileSync(ROOT + "js/compare.js"))(win);
    const round = win.COMPARE.buildRound("Συγκριτικός", 10);
    assert(round.length, "no questions at all without words.json");
    for (const q of round) assert(q.options.includes(q.answer));
});
