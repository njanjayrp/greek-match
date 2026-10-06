// Παραθετικά — comparing things. Same question shape as the Dates drill
// ({ topic, sub, prompt, answer, options }), so the two share a renderer.

window.COMPARE = (function () {

// Adjectives with their three genders; `syn` is the one-word comparative where
// Greek prefers it (καλός → καλύτερος) over the πιο + adjective form.
const ADJ = [
    { m:"μεγάλος",  f:"μεγάλη",  n:"μεγάλο",  en:"big",          syn:"μεγαλύτερος" },
    { m:"μικρός",   f:"μικρή",   n:"μικρό",   en:"small",        syn:"μικρότερος" },
    { m:"καλός",    f:"καλή",    n:"καλό",    en:"good",         syn:"καλύτερος" },
    { m:"κακός",    f:"κακή",    n:"κακό",    en:"bad",          syn:"χειρότερος" },
    { m:"ψηλός",    f:"ψηλή",    n:"ψηλό",    en:"tall" },
    { m:"κοντός",   f:"κοντή",   n:"κοντό",   en:"short" },
    { m:"φτηνός",   f:"φτηνή",   n:"φτηνό",   en:"cheap" },
    { m:"ακριβός",  f:"ακριβή",  n:"ακριβό",  en:"expensive" },
    { m:"γρήγορος", f:"γρήγορη", n:"γρήγορο", en:"fast" },
    { m:"αργός",    f:"αργή",    n:"αργό",    en:"slow" },
    { m:"όμορφος",  f:"όμορφη",  n:"όμορφο",  en:"good-looking" },
    { m:"ωραίος",   f:"ωραία",   n:"ωραίο",   en:"lovely" },
    { m:"νόστιμος", f:"νόστιμη", n:"νόστιμο", en:"tasty" },
    { m:"παλιός",   f:"παλιά",   n:"παλιό",   en:"old" },
    { m:"δύσκολος", f:"δύσκολη", n:"δύσκολο", en:"difficult" },
    { m:"αυστηρός", f:"αυστηρή", n:"αυστηρό", en:"strict" }
];

// Each pair carries the nominative of the first noun and the accusative of the
// second, because "από" takes the accusative: από τον Κώστα, από την Κέρκυρα.
const PAIRS = [
    { g:"f",  a:"Η Κρήτη",            b:"την Κέρκυρα",         adj:["μεγάλος","μικρός","όμορφος","ωραίος"] },
    { g:"f",  a:"Η μαύρη μπλούζα",    b:"την κόκκινη μπλούζα", adj:["φτηνός","ακριβός","όμορφος","ωραίος","παλιός"] },
    { g:"f",  a:"Η ορειβασία",        b:"την πεζοπορία",       adj:["δύσκολος","ωραίος"] },
    { g:"f",  a:"Η τσάντα μου",       b:"την τσάντα σου",      adj:["παλιός","ακριβός","φτηνός","όμορφος","μεγάλος","μικρός"] },
    { g:"m",  a:"Ο Χρήστος",          b:"τον Ηλία",            adj:["ψηλός","κοντός","γρήγορος","όμορφος","καλός"] },
    { g:"m",  a:"Ο κύριος Νίκος",     b:"τον κύριο Τάκη",      adj:["αυστηρός","καλός","κακός","ψηλός"] },
    { g:"m",  a:"Ο Δημήτρης",         b:"τον Αντώνη",          adj:["όμορφος","ψηλός","καλός","γρήγορος"] },
    { g:"n",  a:"Το αεροπλάνο",       b:"το πλοίο",            adj:["γρήγορος","αργός","ακριβός","φτηνός"] },
    { g:"n",  a:"Το ποδήλατο",        b:"το αυτοκίνητο",       adj:["αργός","γρήγορος","φτηνός","ακριβός","μικρός"] },
    { g:"n",  a:"Το δίκλινο δωμάτιο", b:"το τρίκλινο δωμάτιο", adj:["φτηνός","ακριβός","μεγάλος","μικρός"] },
    { g:"n",  a:"Το παγωτό σοκολάτα", b:"το παγωτό βανίλια",   adj:["νόστιμος","ωραίος","ακριβός"] },
    { g:"pn", a:"Τα θαλασσινά",       b:"τα ψάρια",            adj:["νόστιμος","ακριβός","φτηνός"] }
];

// Superlatives need a noun to agree with: "η πιο μεγάλη παρέα στο νησί".
const FRAMES = [
    { g:"f",  subject:"Η παρέα μας",           tail:"στο νησί",                  adj:["μεγάλος","ωραίος"] },
    { g:"pf", subject:"Η Άννα και η Εύη",      tail:"κοπέλες στην παρέα",        adj:["όμορφος","ωραίος"] },
    { g:"pm", subject:"Ο Χρήστος και ο Νίκος", tail:"φίλοι μου",                 adj:["καλός","ψηλός"] },
    { g:"n",  subject:"Το χωριό μου",          tail:"σε όλη την Ελλάδα",         adj:["ωραίος","όμορφος","μικρός"] },
    { g:"n",  subject:"Το σπίτι τους",         tail:"στη γειτονιά",              adj:["ακριβός","μεγάλος","παλιός"] },
    { g:"n",  subject:"Το αυτοκίνητό του",     tail:"από όλα",                   adj:["γρήγορος","ακριβός"] },
    { g:"m",  subject:"Ο Χρήστος",             tail:"από όλους τους φίλους του", adj:["ψηλός","καλός"] },
    { g:"f",  subject:"Η μαύρη μπλούζα",       tail:"από όλες",                  adj:["φτηνός","ωραίος"] },
    { g:"n",  subject:"Το ποδήλατο",           tail:"από όλα τα μέσα μεταφοράς", adj:["αργός","φτηνός"] }
];

const FORM_OF = {
    m:  a => a.m,
    f:  a => a.f,
    n:  a => a.n,
    pm: a => a.m.replace(/ός$/, "οί").replace(/ος$/, "οι"),
    pf: a => a.f.replace(/[ήά]$/, "ές").replace(/[ηα]$/, "ες"),
    pn: a => a.n.replace(/ό$/, "ά").replace(/ο$/, "α")
};
const ARTICLE = { m:"ο", f:"η", n:"το", pm:"οι", pf:"οι", pn:"τα" };
const OTHER_GENDERS = { m:["f","n"], f:["m","n"], n:["m","f"],
                        pm:["pf","pn"], pf:["pm","pn"], pn:["pm","pf"] };

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function q(topic, sub, prompt, answer, distractors) {
    const opts = [answer];
    for (const d of shuffle(distractors)) {
        if (opts.length >= 4) break;
        if (d && !opts.includes(d)) opts.push(d);
    }
    return { topic, sub, prompt, answer, options: shuffle(opts) };
}
function others(arr, x, k) { return shuffle(arr.filter(v => v !== x)).slice(0, k); }

// Only adjectives that make sense for this subject — no "tall ice cream".
function adjFor(item) { return pick(ADJ.filter(a => item.adj.includes(a.m))); }

// ── Συγκριτικός: πιο + adjective + από + accusative ──────────────────────────

function genComparative() {
    const p = pick(PAIRS), a = adjFor(p);
    const right = `${p.a} είναι πιο ${FORM_OF[p.g](a)} από ${p.b}.`;
    const wrongGender = OTHER_GENDERS[p.g].map(g => `${p.a} είναι πιο ${FORM_OF[g](a)} από ${p.b}.`);
    return q("Συγκριτικός", "Φτιάξε τη σύγκριση", `${p.a} / ${a.m} / ${p.b}`, right,
        wrongGender.concat([`${p.a} είναι ${FORM_OF[p.g](a)} από ${p.b}.`]));
}

function genDegreeWord() {
    const p = pick(PAIRS), a = adjFor(p);
    const word = pick(["λίγο", "πολύ"]);
    const form = FORM_OF[p.g](a);
    const right = `${p.a} είναι ${word} πιο ${form} από ${p.b}.`;
    return q("Συγκριτικός", "Πού μπαίνει το λίγο / πολύ;",
        `${p.a} / ${word} / ${a.m} / ${p.b}`, right,
        [`${p.a} είναι πιο ${word} ${form} από ${p.b}.`,
         `${p.a} είναι ${word} ${form} πιο από ${p.b}.`,
         `${p.a} είναι ${word} ${form} από ${p.b}.`]);
}

// ── Υπερθετικός: article + πιο + adjective ───────────────────────────────────

function genSuperlative() {
    const f = pick(FRAMES), a = adjFor(f);
    const art = ARTICLE[f.g];
    const right = `${art} πιο ${FORM_OF[f.g](a)}`;
    const wrong = OTHER_GENDERS[f.g].map(g => `${ARTICLE[g]} πιο ${FORM_OF[g](a)}`);
    return q("Υπερθετικός", "Βάλε τον υπερθετικό",
        `${f.subject} είναι ______ ${f.tail}.  (${a.m})`, right,
        wrong.concat([`πιο ${FORM_OF[f.g](a)}`, `${art} ${FORM_OF[f.g](a)}`]));
}

// ── Ίδιο και λιγότερο: τόσο… όσο, λιγότερο ───────────────────────────────────

function genEquality() {
    const p = pick(PAIRS), a = adjFor(p);
    const form = FORM_OF[p.g](a);
    const bNom = p.b.replace(/^την /, "η ").replace(/^τον /, "ο ")
                    .replace(/^το /, "το ").replace(/^τα /, "τα ");
    const subject = p.b.charAt(0).toUpperCase() + p.b.slice(1);
    const right = `τόσο ${form} όσο ${p.a.toLowerCase()}`;
    return q("Ίδιο & λιγότερο", "Γράψ' το με τόσο… όσο",
        `${p.a} είναι πιο ${form} από ${p.b}.\n${bNom.charAt(0).toUpperCase() + bNom.slice(1)} δεν είναι ______`,
        right,
        [`τόσο ${form} από ${p.a.toLowerCase()}`,
         `πιο ${form} όσο ${p.a.toLowerCase()}`,
         `λιγότερο ${form} όσο ${p.a.toLowerCase()}`]);
}

function genLess() {
    const p = pick(PAIRS), a = adjFor(p);
    const form = FORM_OF[p.g](a);
    const bNom = p.b.replace(/^την /, "Η ").replace(/^τον /, "Ο ").replace(/^το /, "Το ").replace(/^τα /, "Τα ");
    const aAcc = p.a.replace(/^Η /, "την ").replace(/^Ο /, "τον ").replace(/^Το /, "το ").replace(/^Τα /, "τα ");
    const right = `${bNom} είναι λιγότερο ${form} από ${aAcc}.`;
    return q("Ίδιο & λιγότερο", "Πες το ανάποδα, με λιγότερο",
        `${p.a} είναι πιο ${form} από ${p.b}.`, right,
        [`${bNom} είναι πιο ${form} από ${aAcc}.`,
         `${bNom} είναι λιγότερο ${form} όσο ${aAcc}.`,
         `${bNom} δεν είναι τόσο ${form} από ${aAcc}.`]);
}

// ── Μονολεκτικά: καλός → καλύτερος ───────────────────────────────────────────

const SYN = ADJ.filter(a => a.syn);

function genSynthetic() {
    const a = pick(SYN);
    return q("Μονολεκτικά", "Ο μονολεκτικός συγκριτικός", a.m, a.syn,
        others(SYN, a, 3).map(x => x.syn).concat(["πιο " + a.m]));
}

function genSyntheticUse() {
    const p = pick(PAIRS.filter(x => ["m","f","n"].includes(x.g) && x.adj.some(m => SYN.some(s => s.m === m))));
    const a = pick(SYN.filter(s => p.adj.includes(s.m)));
    const g = p.g;
    const synForm = g === "m" ? a.syn
                  : g === "f" ? a.syn.replace(/ος$/, "η")
                  : a.syn.replace(/ος$/, "ο");
    const right = `${p.a} είναι ${synForm} από ${p.b}.`;
    return q("Μονολεκτικά", "Με τον μονολεκτικό τύπο", `${p.a} / ${a.syn} / ${p.b}`, right,
        OTHER_GENDERS[g].map(x => {
            const alt = x === "m" ? a.syn : x === "f" ? a.syn.replace(/ος$/, "η") : a.syn.replace(/ος$/, "ο");
            return `${p.a} είναι ${alt} από ${p.b}.`;
        }).concat([`${p.a} είναι πιο ${synForm} από ${p.b}.`]));
}

// ── Round assembly ───────────────────────────────────────────────────────────

const GENERATORS = {
    "Συγκριτικός":    [genComparative, genComparative, genDegreeWord],
    "Υπερθετικός":    [genSuperlative],
    "Ίδιο & λιγότερο":[genEquality, genLess],
    "Μονολεκτικά":    [genSynthetic, genSyntheticUse]
};

const TOPICS = Object.keys(GENERATORS);

function buildRound(topic, n) {
    n = n || 10;
    const gens = (topic && GENERATORS[topic])
        ? GENERATORS[topic]
        : TOPICS.reduce((acc, t) => acc.concat(GENERATORS[t]), []);
    const round = [], seen = new Set();
    let attempts = 0;
    while (round.length < n && attempts < 400) {
        attempts++;
        const item = pick(gens)();
        if (!item || item.options.length < 2) continue;
        if (seen.has(item.prompt)) continue;
        seen.add(item.prompt);
        round.push(item);
    }
    return round;
}

return { TOPICS, buildRound, ADJ, FORM_OF };

})();
