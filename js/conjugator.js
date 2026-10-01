// Builds a conjugation table for any dictionary verb, so Dictionary mode can
// show "how it changes" for every verb — not only the handful drilled in
// Conjugate mode.
//
// Входът е the words.json spelling: "ρωτάω (ρωτήσω)" — lemma plus the aorist
// subjunctive (the "να …" stem), which is exactly what the regular forms are
// built from. Verbs whose past is irregular (πήρα, είδα) can't be derived, so
// they come from window.CONJUGATIONS or the IRREGULAR table below.

window.CONJUGATOR = (function () {

const ACCENT = { "α":"ά","ε":"έ","η":"ή","ι":"ί","ο":"ό","υ":"ύ","ω":"ώ" };
const PLAIN  = { "ά":"α","έ":"ε","ή":"η","ί":"ι","ό":"ο","ύ":"υ","ώ":"ω","ΐ":"ϊ","ΰ":"ϋ" };
const VOWELS = "αεηιουωάέήίόύώϊϋΐΰ";
const DIGRAPHS = ["αι","ει","οι","υι","ου","αυ","ευ","ηυ"];

function unaccent(s) { return s.replace(/[άέήίόύώΐΰ]/g, c => PLAIN[c]); }

// Vowel groups, left to right: [start, end) indexes into the word.
function nuclei(word) {
    const out = [];
    for (let i = 0; i < word.length; i++) {
        if (!VOWELS.includes(word[i])) continue;
        let end = i + 1;
        const pair = unaccent(word.slice(i, i + 2));
        // a digraph only counts as one vowel while it carries no accent of its own
        if (word.length > i + 1 && DIGRAPHS.includes(pair) && !PLAIN[word[i]]) end = i + 2;
        // unaccented ι/υ before another vowel glides into it: ή-πια, κα-θό-μα-στε
        else if ("ιυ".includes(word[i]) && VOWELS.includes(word[i + 1] || "")) end = i + 2;
        out.push([i, end]);
        i = end - 1;
    }
    return out;
}

// Accent the n-th vowel group counted from the end (1 = last).
function accentFromEnd(word, n) {
    const bare = unaccent(word);
    const ns = nuclei(bare);
    if (ns.length < n) n = ns.length;
    const [s, e] = ns[ns.length - n];
    const at = e - 1;                       // digraphs take the accent on the second letter
    return bare.slice(0, at) + ACCENT[bare[at]] + bare.slice(at + 1);
}

function syllables(word) { return nuclei(unaccent(word)).length; }

// Past tenses sit on the antepenult, and grow an ε- when the word is too short.
function pastForm(stem, ending) {
    let w = stem + ending;
    if (syllables(w) < 3) w = "ε" + unaccent(w);
    return accentFromEnd(w, 3);
}

// έγραψαν / γράψανε — the past variant drops the augment and moves the accent.
function pastSet(stem, endings) {
    const f = endings.map(e => pastForm(stem, e));
    f[5] = f[5] + " / " + accentFromEnd(unaccent(stem) + "ανε", 3);
    return f;
}

const PAST_ACTIVE  = ["α","ες","ε","αμε","ατε","αν"];
const PRES_PLAIN   = ["ω","εις","ει","ουμε","ετε","ουν"];
const PRES_AO      = ["άω","άς","άει","άμε","άτε","άνε"];
const PRES_O       = ["ώ","είς","εί","ούμε","είτε","ούν"];
const PRES_MP      = ["ομαι","εσαι","εται","όμαστε","εστε","ονται"];
const MP_ENDINGS   = ["όμουν","όσουν","όταν","όμασταν","όσασταν","όνταν"];

// γράφουν / γράφουνε — the present keeps its accent where it is.
function plural3(forms) {
    if (!forms || forms.length < 6) return forms || [];
    const f = forms.slice();
    if (f[5].endsWith("ν") && f[5] !== f[2]) f[5] = f[5] + " / " + f[5] + "ε";
    return f;
}

// Keep the lemma's own accent while swapping endings (γράφω → γράφουμε).
function presentFrom(stem, endings, accented) {
    return endings.map(e => accented ? stem + e : accentFromEnd(stem + e, 3));
}

// Greek never accents a one-syllable word: λές → λες, θα πάς → θα πας.
function dropLoneAccent(form) {
    return form.split(" ").map(w => syllables(w) === 1 ? unaccent(w) : w).join(" ");
}
function normalize(forms) { return (forms || []).map(dropLoneAccent); }

function split(entry) {
    const m = /^([^\s(]+)(?:\s*\(([^)]+)\))?$/.exec(entry.trim());
    if (!m) return null;
    return { lemma: m[1], dep: m[2] || null };
}

function isVerbLemma(l) {
    return /(ω|ώ|ομαι|ούμαι|άμαι|ιέμαι)$/.test(l);
}

function futureFrom(dep) {
    if (/ώ$/.test(dep)) {                                   // πλυθώ, βρεθώ
        const st = dep.slice(0, -1);
        return ["ώ","είς","εί","ούμε","είτε","ούν"].map(e => "θα " + st + e);
    }
    const st = dep.slice(0, -1);
    if (syllables(dep) === 1) {                             // βρω, πω, δω, μπω
        return ["ω","εις","ει","ούμε","είτε","ουν"].map(e => "θα " + st + e);
    }
    if (/[αεηιουωάέήίόύώ]$/.test(st)) {                     // φάω, πάω
        return ["ω","ς","ει","με","τε","νε"].map(e => "θα " + st + e);
    }
    return PRES_PLAIN.map(e => "θα " + st + e);
}

// [singular stem, plural stem] — πήρα/πήραμε, παρέλαβα/παραλάβαμε
const IRREGULAR_AORIST = {
    "λέω":["είπ","είπ"], "πάω":["πήγ","πήγ"], "πηγαίνω":["πήγ","πήγ"],
    "βλέπω":["είδ","είδ"], "τρώω":["έφαγ","φάγ"], "πίνω":["ήπι","ήπι"],
    "παίρνω":["πήρ","πήρ"], "έρχομαι":["ήρθ","ήρθ"], "βρίσκω":["βρήκ","βρήκ"],
    "μπαίνω":["μπήκ","μπήκ"], "βγαίνω":["βγήκ","βγήκ"],
    "ανεβαίνω":["ανέβηκ","ανεβήκ"], "κατεβαίνω":["κατέβηκ","κατεβήκ"],
    "παραλαμβάνω":["παρέλαβ","παραλάβ"], "παραδίδω":["παρέδωσ","παραδώσ"],
    "παραγγέλνω":["παρήγγειλ","παραγγείλ"], "αποφεύγω":["απέφυγ","αποφύγ"],
    "λαμβάνω":["έλαβ","λάβ"], "αφήνω":["άφησ","αφήσ"],
};

function irregularAorist(lemma) {
    const p = IRREGULAR_AORIST[lemma];
    if (!p) return null;
    const [sg, pl] = p;
    return [sg+"α", sg+"ες", sg+"ε", pl+"αμε", pl+"ατε",
            sg+"αν / " + accentFromEnd(unaccent(pl) + "ανε", 3)];
}

function futureAlt(forms) {
    const f = forms.slice();
    const last = f[5];
    if (!last.endsWith("ν")) return f;
    const word = last.replace(/^θα /, "");
    const alt = unaccent(word) === word ? accentFromEnd(word + "ε", 2) : word + "ε";
    f[5] = last + " / θα " + alt;
    return f;
}

function aoristFrom(dep) {
    if (/ώ$/.test(dep)) {                                   // mediopassive: πλυθώ → πλύθηκα
        const st = dep.slice(0, -1) + "ηκ";
        return pastSet(st, PAST_ACTIVE);
    }
    const st = unaccent(dep.slice(0, -1));
    if (syllables(dep) === 1) {                             // βρω → *έβρα is wrong; skip
        return null;
    }
    return pastSet(st, PAST_ACTIVE);
}

function build(entry) {
    const parts = split(entry);
    if (!parts || !isVerbLemma(parts.lemma)) return null;
    const { lemma, dep } = parts;
    let present, imperfect;

    if (/ιέμαι$/.test(lemma)) {                             // βαριέμαι
        const st = lemma.slice(0, -5);
        present   = [st+"ιέμαι",st+"ιέσαι",st+"ιέται",st+"ιόμαστε",st+"ιέστε",st+"ιούνται"];
        imperfect = MP_ENDINGS.map(e => st + "ι" + e);
    } else if (/άμαι$/.test(lemma) || /ούμαι$/.test(lemma)) { // κοιμάμαι, θυμάμαι
        const st = lemma.replace(/(άμαι|ούμαι)$/, "");
        present   = [st+"άμαι",st+"άσαι",st+"άται",st+"όμαστε",st+"άστε",st+"ούνται"];
        imperfect = MP_ENDINGS.map(e => st + e);
    } else if (/ομαι$/.test(lemma)) {                       // σκέφτομαι, έρχομαι
        const bare = unaccent(lemma.slice(0, -4));
        const keep = lemma.slice(0, -4);                    // stem with the lemma accent
        present   = [keep+"ομαι",keep+"εσαι",keep+"εται",bare+"όμαστε",keep+"εστε",keep+"ονται"];
        imperfect = [bare+"όμουν",bare+"όσουν",bare+"όταν",bare+"όμασταν",bare+"όσασταν",keep+"ονταν"];
    } else if (/άω$/.test(lemma)) {                         // ρωτάω
        const st = lemma.slice(0, -2);
        present   = PRES_AO.map(e => st + e);
        imperfect = ["ούσα","ούσες","ούσε","ούσαμε","ούσατε","ούσαν"].map(e => st + e);
    } else if (/ώ$/.test(lemma)) {                          // οδηγώ, καλώ
        const st = lemma.slice(0, -1);
        present   = PRES_O.map(e => st + e);
        imperfect = ["ούσα","ούσες","ούσε","ούσαμε","ούσατε","ούσαν"].map(e => st + e);
    } else if (/[αεηιουωάέήίόύώ]ω$/.test(lemma) && !/[αεη]ύω$/.test(lemma)) {  // λέω, κλαίω, τρώω, ακούω
        const st = lemma.slice(0, -1);
        present   = ["ω","ς","ει","με","τε","νε"].map(e => st + e);
        imperfect = pastSet(unaccent(st) + "γ", PAST_ACTIVE);
    } else {                                                // γράφω
        const st = lemma.slice(0, -1);
        present   = PRES_PLAIN.map(e => st + e);
        imperfect = pastSet(unaccent(st), PAST_ACTIVE);
    }

    return {
        lemma, dep,
        present:   normalize(plural3(present)),
        imperfect: normalize(/νται|νταν$/.test(imperfect[5]) || imperfect[5].includes(" / ")
                             ? imperfect : plural3(imperfect)),
        aorist:    normalize(irregularAorist(lemma) || (dep ? aoristFrom(dep) : null) || []),
        future:    normalize(dep ? futureAlt(futureFrom(dep)) : []),
        derived:   true
    };
}

// Hand-written tables win: the drill list first, then these extra irregulars.
function fromDrill(lemma) {
    const t = (window.CONJUGATIONS || []).find(v => v.lemma === lemma);
    if (!t) return null;
    return { lemma, dep: null, present: t.present, imperfect: t.imperfect,
             aorist: t.aorist || [], future: t.future, derived: false };
}

function forms(entry) {
    const parts = split(entry);
    if (!parts || !isVerbLemma(parts.lemma)) return null;
    return fromDrill(parts.lemma) || build(entry);
}

return { forms, isVerb: e => !!forms(e), accentFromEnd, syllables };

})();
