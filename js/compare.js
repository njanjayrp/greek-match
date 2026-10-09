// Παραθετικά — comparing things. Same question shape as the Dates drill
// ({ topic, sub, prompt, answer, options }), so the two share a renderer.
//
// Nothing here is a hand-written sentence: the nouns come out of words.json, so
// every word added to the dictionary widens the drill on its own. An adjective
// declares what kinds of thing it may describe and a noun is typed by what you
// can say about it, which is what keeps "ψηλό παγωτό" out.

window.COMPARE = (function () {

// ── Adjectives ───────────────────────────────────────────────────────────────
// [masculine, English, kinds it may describe, one-word comparative if any]

const ADJ_SRC = [
    ["μεγάλος",      "big",           "thing place vehicle clothes food person body", "μεγαλύτερος"],
    ["μικρός",       "small",         "thing place vehicle clothes food person body", "μικρότερος"],
    ["καλός",        "good",          "thing place vehicle clothes food activity person abstract", "καλύτερος"],
    ["κακός",        "bad",           "thing place vehicle clothes food activity person abstract", "χειρότερος"],
    ["πολύς",        "much",          "mass", "περισσότερος"],
    ["ωραίος",       "lovely",        "thing place clothes food activity person"],
    ["όμορφος",      "good-looking",  "person place clothes thing"],
    ["άσχημος",      "ugly",          "person place clothes thing"],
    ["υπέροχος",     "wonderful",     "place food activity thing"],
    ["εντυπωσιακός", "impressive",    "place thing activity"],
    ["εξαιρετικός",  "exceptional",   "food thing activity"],
    ["ακριβός",      "expensive",     "thing clothes food vehicle activity place"],
    ["φτηνός",       "cheap",         "thing clothes food vehicle activity place"],
    ["γρήγορος",     "fast",          "vehicle person"],
    ["αργός",        "slow",          "vehicle person"],
    ["δύσκολος",     "difficult",     "activity abstract"],
    ["εύκολος",      "easy",          "activity abstract"],
    ["νόστιμος",     "tasty",         "food"],
    ["γλυκός",       "sweet",         "sweet"],
    ["αλμυρός",      "salty",         "savoury"],
    ["ζεστός",       "warm",          "food clothes"],
    ["κρύος",        "cold",          "food"],
    ["φρέσκος",      "fresh",         "food"],
    ["παλιός",       "old",           "thing clothes vehicle place"],
    ["καινούργιος",  "new",           "thing clothes vehicle"],
    ["μοντέρνος",    "modern",        "thing clothes place"],
    ["παραδοσιακός", "traditional",   "food place thing"],
    ["άνετος",       "comfortable",   "clothes vehicle place"],
    ["ευρύχωρος",    "spacious",      "place vehicle"],
    ["φωτεινός",     "bright",        "place"],
    ["ήσυχος",       "quiet",         "place person"],
    ["ήρεμος",       "calm",          "place person"],
    ["καθαρός",      "clean",         "place clothes thing"],
    ["βρόμικος",     "dirty",         "place clothes thing"],
    ["ψηλός",        "tall",          "person"],
    ["κοντός",       "short",         "person"],
    ["λεπτός",       "slim",          "person"],
    ["αδύνατος",     "skinny",        "person"],
    ["παχύς",        "fat",           "person"],
    ["αυστηρός",     "strict",        "person"],
    ["ευγενικός",    "polite",        "person"],
    ["φιλικός",      "friendly",      "person"],
    ["χαρούμενος",   "happy",         "person"],
    ["λυπημένος",    "sad",           "person"],
    ["νέος",         "young",         "person"],
    ["κουρασμένος",  "tired",         "person"],
    ["έξυπνος",      "clever",        "person"],
    ["σημαντικός",   "important",     "abstract activity"],
    ["μακρύς",       "long",          "body"],
    ["γεμάτος",      "full",          "place vehicle"],
    ["σκούρος",      "dark",          "clothes"],
    ["μαλακός",      "soft",          "clothes food"],
    ["βαρύς",        "heavy",         "thing clothes food"],
    ["δυνατός",      "strong",        "person"],
    ["χρήσιμος",     "useful",        "thing abstract"],
    ["επικίνδυνος",  "dangerous",     "place activity"],
    ["κουραστικός",  "tiring",        "activity"],
    ["διασκεδαστικός", "fun",         "activity place"]
];

// Greek derives the other five forms, so only the masculine is listed above.
// A vowel before the ending takes -α (νέος → νέα, παλιός → παλιά); otherwise
// -ός → -ή and -ος → -η. The loanwords that break that are spelled out.
const IRREG = {
    "πολύς":     { f:"πολλή",    n:"πολύ",     pm:"πολλοί",    pf:"πολλές",    pn:"πολλά" },
    "σκούρος":   { f:"σκούρα",   n:"σκούρο",   pm:"σκούροι",   pf:"σκούρες",   pn:"σκούρα" },
    "μοντέρνος": { f:"μοντέρνα", n:"μοντέρνο", pm:"μοντέρνοι", pf:"μοντέρνες", pn:"μοντέρνα" },
    "φρέσκος":   { f:"φρέσκια",  n:"φρέσκο",   pm:"φρέσκοι",   pf:"φρέσκες",   pn:"φρέσκα" }
};
const VOWEL = "αεηιουωάέήίόύώϊϋΐΰ";

function genders(m) {
    if (IRREG[m]) return { m, ...IRREG[m] };
    const vowelStem = VOWEL.includes(m.slice(-3, -2));
    const f = /ύς$/.test(m) ? m.slice(0, -2) + "ιά"
            : vowelStem     ? m.slice(0, -2) + (/ός$/.test(m) ? "ά" : "α")
            : /ός$/.test(m) ? m.slice(0, -2) + "ή"
            :                 m.slice(0, -2) + "η";
    const n = m.slice(0, -1);
    return {
        m, f, n,
        pm: m.replace(/ύς$/, "ιοί").replace(/ός$/, "οί").replace(/ος$/, "οι"),
        pf: f.replace(/ά$/, "ές").replace(/ή$/, "ές").replace(/[αη]$/, "ες"),
        pn: n.replace(/ύ$/, "ιά").replace(/ό$/, "ά").replace(/ο$/, "α")
    };
}

const ADJ = ADJ_SRC.map(([m, en, kinds, syn]) => {
    const a = genders(m);
    a.en = en;
    a.kinds = kinds.split(" ");
    if (syn) a.syn = syn;
    return a;
});

const SYN = ADJ.filter(a => a.syn);

// For the English gloss under each question. Anything not listed takes "more X".
const EN_CMP = {
    good:"better", bad:"worse", much:"more", big:"bigger", small:"smaller",
    tall:"taller", short:"shorter", slim:"slimmer", skinny:"skinnier", fat:"fatter",
    strict:"stricter", happy:"happier", sad:"sadder", young:"younger",
    clever:"cleverer", long:"longer", full:"fuller", soft:"softer", heavy:"heavier",
    strong:"stronger", cheap:"cheaper", fast:"faster", slow:"slower", tasty:"tastier",
    sweet:"sweeter", salty:"saltier", warm:"warmer", cold:"colder", fresh:"fresher",
    old:"older", new:"newer", easy:"easier", quiet:"quieter", calm:"calmer", clean:"cleaner",
    dirty:"dirtier", ugly:"uglier", dark:"darker", lovely:"lovelier",
    friendly:"friendlier", polite:"politer"
};
const EN_SUP = { better:"best", worse:"worst", more:"most" };

function cmpEn(a) { return EN_CMP[a.en] || "more " + a.en; }
function supEn(a) {
    const c = cmpEn(a);
    if (c.startsWith("more ")) return "most " + c.slice(5);
    return EN_SUP[c] || c.replace(/er$/, "est");
}
function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
// Greek number decides, except where the English word is plural on its own.
const EN_PLURAL = /\b(trousers|jeans|shorts|glasses|sunglasses|clothes|scissors|pyjamas|holidays|exams|offers|parents|chips|grapes|snacks|subtitles|boots|gloves)$/;
function isAre(g, en) {
    return g[0] === "p" || (en && EN_PLURAL.test(en)) ? "are" : "is";
}

// "country / holiday house" shares its head word, so the shortest alternative is
// usually the broken one — take the wordiest, and drop "(female)" and friends.
function englishOf(text) {
    const parts = text.replace(/\s*\(.*?\)/g, "").split(" / ").map(t => t.trim()).filter(Boolean);
    const best = parts.reduce((b, t) =>
        t.split(" ").length > b.split(" ").length ? t : b, parts[0] || text);
    return best.replace(/^(the|a|an) /i, "");   // a few entries carry their own article
}

// One-word comparatives are plain -ος/-η/-ο adjectives with a fixed accent, so
// every gender and number comes off the same stem: περισσότερ-ος/-η/-ο/-οι…
const SYN_ENDING = { m:"ος", f:"η", n:"ο", pm:"οι", pf:"ες", pn:"α" };
function synOf(a, g) { return a.syn.replace(/ος$/, SYN_ENDING[g]); }

const FORM_OF = {
    m:  a => a.m,
    f:  a => a.f,
    n:  a => a.n,
    pm: a => a.pm,
    pf: a => a.pf,
    pn: a => a.pn
};
const ARTICLE       = { m:"ο",     f:"η",    n:"το",  pm:"οι",    pf:"οι",   pn:"τα" };
const ALL_OF        = { m:"όλους", f:"όλες", n:"όλα", pm:"όλους", pf:"όλες", pn:"όλα" };
const OTHER_GENDERS = { m:["f","n"], f:["m","n"], n:["m","f"],
                        pm:["pf","pn"], pf:["pm","pn"], pn:["pm","pf"] };

// ── Nouns, read out of words.json ────────────────────────────────────────────
// A group gives its entries a default kind; the lists below promote the ones
// that are really a place, a vehicle, food, something you do or someone. A noun
// named in a list keeps only the kinds that list gives it, so "το κουδούνι"
// stays a thing and never becomes somewhere you can be.

const GROUP_DEFAULT = {
    "Home, buildings & rooms":    "thing",
    "Wardrobe & colors":          "clothes thing",
    "Commerce & shopping":        "thing",
    "Kitchen & cooking":          "thing",
    "City transport":             "thing",
    "Travel & airport":           "thing",
    "Beach & summer":             "thing",
    "Mountains & winter":         "thing",
    "Nature, weather & outdoors": "nature",
    "Free time, film & arts":     "thing",
    "People & relationships":     "person",
    "Body & health":              "body",
    "Feelings & emotions":        "abstract",
    "Social & communication":     "abstract",
    "Time & frequency":           "abstract",
    "Orders & delivery":          "abstract"
};

const KINDS = {
    place: `το οικόπεδο, η οικοδομή, η πολυκατοικία, η μονοκατοικία, ο ουρανοξύστης,
        η σοφίτα, το υπνοδωμάτιο, το σαλόνι, το καθιστικό, η τραπεζαρία, το μπάνιο,
        η τουαλέτα, ο διάδρομος, το μπαλκόνι, η βεράντα, το γκαράζ, η αποθήκη,
        ο κήπος, η αυλή, η πισίνα, η κρεβατοκάμαρα, το ξενοδοχείο, το νοσοκομείο,
        το νησί, το παραθαλάσσιο μέρος, η παραλία, η ακρογιαλιά, η αμμουδιά, η ακτή,
        το βουνό, το ορεινό χωριό, το δάσος, το ποτάμι, το καταφύγιο,
        το χιονοδρομικό κέντρο, η φύση, το γυμναστήριο, ο κινηματογράφος,
        η αίθουσα προβολής, το κυλικείο, το κατάστημα, το περίπτερο, η λαϊκή,
        το ανθοπωλείο, το ψιλικατζίδικο, η κουζίνα, η λίμνη, η πλατεία, η περιοχή,
        ο τόπος, η γέφυρα, το γεφύρι, το χωριό, η εξοχή, η γειτονιά, το αεροδρόμιο,
        το τελωνείο, ο σταθμός, η στάση, η αποβάθρα, η αφετηρία`,

    "place indoors": `το διαμέρισμα, το οροφοδιαμέρισμα, το εξοχικό σπίτι,
        η γκαρσονιέρα, το δυάρι, το τριάρι, η μεζονέτα, το ρετιρέ,
        το δίκλινο δωμάτιο, το τρίκλινο δωμάτιο, η σκηνή`,

    vehicle: `το μετρό, το τρόλεϊ, ο προαστιακός, ο ηλεκτρικός, το αυτοκίνητο,
        το ποδήλατο, η μηχανή, το βαγόνι, το αεροπλάνο, το πλοίο, το καράβι,
        η βάρκα, η ιστιοσανίδα, το καγιάκ`,

    food: `το ποτό, το αναψυκτικό, το αλεύρι`,
    "food sweet": `το αχλάδι, το βερίκοκο, ο λωτός, η καρύδα, το κουλούρι,
        το παγωτό, τα σταφύλια`,
    "food savoury": `τα αλμυρά, τα πατατάκια, τα θαλασσινά`,

    activity: `η ηλιοθεραπεία, το κολύμπι, το θαλάσσιο σκι, το ελεύθερο κάμπινγκ,
        το οργανωμένο κάμπινγκ, η πεζοπορία, η ορειβασία, το σκι, ο χορός, η ταινία,
        η γιορτή, το χόμπι, τα γενέθλια, η ξεκούραση, η έκθεση, το έργο, η κωμωδία,
        η εκδρομή, η κρουαζιέρα, η άσκηση, οι εξετάσεις, το ταξίδι, η πτήση,
        τα ψώνια, η μετακίνηση, οι καλοκαιρινές διακοπές, οι χειμερινές διακοπές`,

    person: `ο οικοδόμος, ο μανάβης, η πωλήτρια, ο κολυμβητής, ο καλλιτέχνης,
        ο ηθοποιός, η καθηγήτρια, η συμμαθήτρια, ο επιβάτης, ο ελεγκτής,
        η αεροσυνοδός, ο πιλότος, ο υπάλληλος, ο αλκοολικός, η παρέα, η κολλητή,
        η ξαδέλφη, οι γονείς`,

    abstract: `η θέρμανση, το ενοίκιο, η εταιρεία, η συμπεριφορά, η φιλία, η εμπειρία,
        η σχέση, η κουλτούρα, η γνωριμία, η καθημερινότητα, το αποτέλεσμα, η τιμή,
        η αξία, η έκπτωση, η θερμίδα, η υπηρεσία, η σειρά, η ουρά, η απεργία,
        η καθυστέρηση, η διαδρομή, η σκηνοθεσία, το σενάριο, ο πονοκέφαλος,
        ο πυρετός, το εξάμηνο, το πτυχίο, η πλάτη, η φαλάκρα, η θέση,
        η επιβίβαση, η αναχώρηση, η ανακοίνωση, ο έλεγχος ασφαλείας, η στάση,
        η άνοιξη, το καλοκαίρι, το φθινόπωρο, ο χειμώνας,
        ο βορράς, ο νότος, η ανατολή, η δύση`,

    // Nature's group also holds benches and grass; only living things stay "nature".
    thing: `το παγκάκι, το γρασίδι, το κύμα, το κοχύλι`,

    // πολύς compares an amount. Being plural is not enough — there is no "more
    // eyes than yesterday" — so each of these is here because it can grow.
    mass: `η κίνηση, η φασαρία, ο ύπνος, το άγχος, το ενδιαφέρον, η ξεκούραση,
        η θέρμανση, η αγωνία, τα σύννεφα, τα ψώνια, οι εξετάσεις, οι προσφορές,
        οι αποσκευές, τα σταφύλια, τα αλμυρά, τα πατατάκια, τα θαλασσινά`
};

// Colour names and units are nouns in the dictionary, but nothing is "a cheaper beige".
const NOT_A_THING = /^(το|ο|τα) (καφέ|μπλε|ροζ|μπορντό|μουσταρδί|λαχανί|γκρι|μπεζ|εκρού|κρεμ|μοβ|πορτοκαλί|πετρόλ|λαδί|χακί|τιρκουάζ|φούξια|χρυσός|αγαπημένο|νούμερο|γραμμάριο|κιλό|ύψος|βήμα|άρθρα|ουσιαστικά|ψιλά|εκδοτήριο|τέρμα)$/;

const KIND_INDEX = (() => {
    const index = {};
    for (const [kinds, list] of Object.entries(KINDS))
        for (const word of list.split(",").map(w => w.replace(/\s+/g, " ").trim()))
            index[word] = (index[word] || []).concat(kinds.split(" "));
    return index;
})();

function slotOf(art, rest) {
    if (art === "ο")  return "m";
    if (art === "η")  return "f";
    if (art === "το") return "n";
    if (art === "τα") return "pn";
    if (/είς$/.test(rest) || /ο[ίι]$/.test(rest)) return "pm";
    if (/[εέ]ις$/.test(rest) || /[εέ]ς$/.test(rest)) return "pf";
    return null;
}

// την keeps its -ν before a vowel and before κ π τ, γκ μπ ντ, τσ τζ, ξ ψ.
const KEEPS_NU = /^([αάεέηήιίοόυύωώΑΆΕΈΗΉΙΊΟΌΥΎΩΏκπτξψΚΠΤΞΨ]|γκ|μπ|ντ|τσ|τζ)/;

// "από" takes the accusative: ο καφές → τον καφέ, οι φίλοι → τους φίλους.
function accOf(art, rest, slot) {
    const parts = rest.split(" ");
    const head = parts[0], tail = parts.slice(1).join(" ");
    const join = h => (tail ? h + " " + tail : h);
    switch (slot) {
        case "m":  return "τον " + join(head.replace(/ς$/, ""));
        case "f":  return (KEEPS_NU.test(rest) ? "την " : "τη ") + rest;
        case "n":  return "το " + rest;
        case "pm": return "τους " + join(head.replace(/οί$/, "ούς").replace(/οι$/, "ους"));
        case "pf": return "τις " + rest;
        default:   return "τα " + rest;
    }
}

let NOUNS = null;

function buildNouns() {
    const out = [];
    for (const w of (window.WORDS || [])) {
        const greek = w.greek.trim();
        if (greek.includes("/")) continue;          // "η βροχή / βρέχει" — two headwords
        if (NOT_A_THING.test(greek)) continue;
        const m = /^(ο|η|το|οι|τα) (.+)$/.exec(greek);
        if (!m) continue;
        const slot = slotOf(m[1], m[2]);
        if (!slot) continue;
        const named = KIND_INDEX[greek];
        const kinds = named ? named.slice()
                            : (GROUP_DEFAULT[w.group] || "").split(" ").filter(Boolean);
        if (!kinds.length) continue;
        out.push({
            nom: greek.charAt(0).toUpperCase() + greek.slice(1),
            acc: accOf(m[1], m[2], slot),
            g: slot, kinds, group: w.group,
            en: "the " + englishOf(w.english)
        });
    }
    return out;
}

// Names are not dictionary vocabulary, but person comparisons need subjects.
const PEOPLE = [
    { nom:"Ο Χρήστος", acc:"τον Χρήστο", g:"m", en:"Christos" },
    { nom:"Ο Νίκος", acc:"τον Νίκο", g:"m", en:"Nikos" },
    { nom:"Ο Δημήτρης", acc:"τον Δημήτρη", g:"m", en:"Dimitris" },
    { nom:"Ο Ηλίας", acc:"τον Ηλία", g:"m", en:"Ilias" },
    { nom:"Ο Κώστας", acc:"τον Κώστα", g:"m", en:"Kostas" },
    { nom:"Ο Αντώνης", acc:"τον Αντώνη", g:"m", en:"Antonis" },
    { nom:"Ο αδερφός μου", acc:"τον αδερφό μου", g:"m", en:"my brother" },
    { nom:"Ο γείτονάς μου", acc:"τον γείτονά μου", g:"m", en:"my neighbour" },
    { nom:"Ο φίλος μου", acc:"τον φίλο μου", g:"m", en:"my friend" },
    { nom:"Η Άννα", acc:"την Άννα", g:"f", en:"Anna" },
    { nom:"Η Μαρία", acc:"τη Μαρία", g:"f", en:"Maria" },
    { nom:"Η Ελένη", acc:"την Ελένη", g:"f", en:"Eleni" },
    { nom:"Η Εύη", acc:"την Εύη", g:"f", en:"Evi" },
    { nom:"Η Σοφία", acc:"τη Σοφία", g:"f", en:"Sofia" },
    { nom:"Η Κατερίνα", acc:"την Κατερίνα", g:"f", en:"Katerina" },
    { nom:"Η αδερφή μου", acc:"την αδερφή μου", g:"f", en:"my sister" },
    { nom:"Η φίλη μου", acc:"τη φίλη μου", g:"f", en:"my friend" },
    { nom:"Η γειτόνισσά μου", acc:"τη γειτόνισσά μου", g:"f", en:"my neighbour" },
    { nom:"Ο Χρήστος και ο Νίκος", acc:"τον Χρήστο και τον Νίκο", g:"pm", en:"Christos and Nikos" },
    { nom:"Οι φίλοι μου", acc:"τους φίλους μου", g:"pm", en:"my friends" },
    { nom:"Οι γείτονές μου", acc:"τους γείτονές μου", g:"pm", en:"my neighbours" },
    { nom:"Η Άννα και η Εύη", acc:"την Άννα και την Εύη", g:"pf", en:"Anna and Evi" },
    { nom:"Οι φίλες μου", acc:"τις φίλες μου", g:"pf", en:"my friends" },
    { nom:"Οι ξαδέλφες μου", acc:"τις ξαδέλφες μου", g:"pf", en:"my cousins" },
    { nom:"Τα αδέρφια μου", acc:"τα αδέρφια μου", g:"pn", en:"my siblings" },
    { nom:"Τα ξαδέρφια μου", acc:"τα ξαδέρφια μου", g:"pn", en:"my cousins" },
    { nom:"Τα παιδιά τους", acc:"τα παιδιά τους", g:"pn", en:"their children" }
].map(p => ({ ...p, kinds:["person"], group:"People & relationships" }));

function nouns() {
    // Never cache an empty pool: the dictionary may not have landed yet.
    if (!NOUNS) {
        const built = buildNouns();
        if (!built.length) return PEOPLE;
        NOUNS = built.concat(PEOPLE);
    }
    return NOUNS;
}

// ── Picking a subject an adjective can honestly describe ─────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function q(topic, sub, prompt, answer, distractors, gloss) {
    const opts = [answer];
    for (const d of shuffle(distractors)) {
        if (opts.length >= 4) break;
        if (d && !opts.includes(d)) opts.push(d);
    }
    return { topic, sub, prompt, answer, options: shuffle(opts), gloss: gloss || "" };
}
function others(arr, x, k) { return shuffle(arr.filter(v => v !== x)).slice(0, k); }

// One adjective and two nouns that are the same kind of thing, the same gender
// and from the same group, so the comparison is about something: two beaches,
// two jackets, two friends — never a neighbourhood against a duck.
function subject(adjPool) {
    for (let i = 0; i < 80; i++) {
        const a = pick(adjPool);
        const kind = pick(a.kinds);
        const pool = nouns().filter(n => n.kinds.includes(kind));
        if (pool.length < 2) continue;
        const first = pick(pool);
        // "Τα πατατάκια είναι πιο αλμυρά από τα αλμυρά" compares a thing with its
        // own adjective, so a noun named after the adjective is no comparand.
        const ok = n => !n.en.includes(a.en) && !a.en.includes(n.en.replace(/^the /, ""));
        if (!ok(first)) continue;
        const rest = pool.filter(n => n !== first && n.g === first.g && n.group === first.group && ok(n));
        if (!rest.length) continue;
        return { a, g: first.g, first, second: pick(rest) };
    }
    return null;
}

function single(adjPool) {
    for (let i = 0; i < 80; i++) {
        const a = pick(adjPool);
        const pool = nouns().filter(n => n.kinds.includes(pick(a.kinds)));
        if (pool.length) { const n = pick(pool); return { a, g: n.g, n }; }
    }
    return null;
}

const PLAIN = ADJ.filter(a => a.m !== "πολύς");
const SYN_PLAIN = SYN.filter(a => a.m !== "πολύς");
// Greek insists on the one-word form for these four, so πιο never asks for them.
const PERIPHRASTIC = ADJ.filter(a => !a.syn);
// πιο μεγάλος is ordinary speech, but πιο καλός / πιο κακός is not: those two
// only ever take the one-word form.
const PIO = ADJ.filter(a => !["καλός", "κακός", "πολύς"].includes(a.m));

// ── Συγκριτικός: πιο + adjective + από + accusative ──────────────────────────

function genComparative() {
    const s = subject(PIO);
    if (!s) return null;
    const form = FORM_OF[s.g](s.a);
    const right = `${s.first.nom} είναι πιο ${form} από ${s.second.acc}.`;
    return q("Συγκριτικός", "Φτιάξε τη σύγκριση",
        `${s.first.nom} / ${s.a.m} / ${s.second.acc}`, right,
        OTHER_GENDERS[s.g].map(g => `${s.first.nom} είναι πιο ${FORM_OF[g](s.a)} από ${s.second.acc}.`)
            .concat([`${s.first.nom} είναι ${form} από ${s.second.acc}.`]),
        `${cap(s.first.en)} ${isAre(s.g, s.first.en)} ${cmpEn(s.a)} than ${s.second.en}.`);
}

function genDegreeWord() {
    const s = subject(PIO);
    if (!s) return null;
    const word = pick(["λίγο", "πολύ"]);
    const form = FORM_OF[s.g](s.a);
    const right = `${s.first.nom} είναι ${word} πιο ${form} από ${s.second.acc}.`;
    return q("Συγκριτικός", "Πού μπαίνει το λίγο / πολύ;",
        `${s.first.nom} / ${word} / ${s.a.m} / ${s.second.acc}`, right,
        [`${s.first.nom} είναι πιο ${word} ${form} από ${s.second.acc}.`,
         `${s.first.nom} είναι ${word} ${form} πιο από ${s.second.acc}.`,
         `${s.first.nom} είναι ${word} ${form} από ${s.second.acc}.`],
        `${cap(s.first.en)} ${isAre(s.g, s.first.en)} ${word === "λίγο" ? "a little" : "much"} ${cmpEn(s.a)} than ${s.second.en}.`);
}

// ── Υπερθετικός: article + πιο + adjective ───────────────────────────────────

function genSuperlative() {
    const s = single(PERIPHRASTIC);
    if (!s) return null;
    const art = ARTICLE[s.g];
    const right = `${art} πιο ${FORM_OF[s.g](s.a)}`;
    return q("Υπερθετικός", "Βάλε τον υπερθετικό",
        `${s.n.nom} είναι ______ από ${ALL_OF[s.g]}.`, right,
        OTHER_GENDERS[s.g].map(g => `${ARTICLE[g]} πιο ${FORM_OF[g](s.a)}`)
            .concat([`πιο ${FORM_OF[s.g](s.a)}`, `${art} ${FORM_OF[s.g](s.a)}`]),
        `${cap(s.n.en)} ${isAre(s.g, s.n.en)} the ${supEn(s.a)} of all.`);
}

// The one-word superlative is the same form with the article in front:
// ο καλύτερος, η μεγαλύτερη, τα περισσότερα.
function genSynthSuperlative() {
    const s = single(SYN_PLAIN);
    if (!s) return null;
    const art = ARTICLE[s.g];
    return q("Υπερθετικός", "Ο μονολεκτικός υπερθετικός",
        `${s.n.nom} είναι ______ από ${ALL_OF[s.g]}.`,
        `${art} ${synOf(s.a, s.g)}`,
        OTHER_GENDERS[s.g].map(g => `${ARTICLE[g]} ${synOf(s.a, g)}`)
            .concat([synOf(s.a, s.g), `${art} πιο ${synOf(s.a, s.g)}`]),
        `${cap(s.n.en)} ${isAre(s.g, s.n.en)} the ${supEn(s.a)} of all.`);
}

// ── Ίδιο και λιγότερο: τόσο… όσο, λιγότερο ───────────────────────────────────

function genEquality() {
    const s = subject(PIO);
    if (!s) return null;
    const form = FORM_OF[s.g](s.a);
    const asNom = s.first.nom.charAt(0).toLowerCase() + s.first.nom.slice(1);
    return q("Ίδιο & λιγότερο", "Γράψ' το με τόσο… όσο",
        `${s.first.nom} είναι πιο ${form} από ${s.second.acc}.\n${s.second.nom} δεν είναι ______`,
        `τόσο ${form} όσο ${asNom}`,
        [`τόσο ${form} από ${s.first.acc}`,
         `πιο ${form} όσο ${asNom}`,
         `λιγότερο ${form} όσο ${asNom}`],
        `${cap(s.first.en)} ${isAre(s.g, s.first.en)} ${cmpEn(s.a)} than ${s.second.en}.`);
}

function genLess() {
    const s = subject(PIO);
    if (!s) return null;
    const form = FORM_OF[s.g](s.a);
    return q("Ίδιο & λιγότερο", "Πες το ανάποδα, με λιγότερο",
        `${s.first.nom} είναι πιο ${form} από ${s.second.acc}.`,
        `${s.second.nom} είναι λιγότερο ${form} από ${s.first.acc}.`,
        [`${s.second.nom} είναι πιο ${form} από ${s.first.acc}.`,
         `${s.second.nom} είναι λιγότερο ${form} όσο ${s.first.acc}.`,
         `${s.second.nom} δεν είναι τόσο ${form} από ${s.first.acc}.`],
        `${cap(s.first.en)} ${isAre(s.g, s.first.en)} ${cmpEn(s.a)} than ${s.second.en}.`);
}

// ── Μονολεκτικά: καλός → καλύτερος ───────────────────────────────────────────
// Note: from here on the prompt no longer names the adjective — the English
// gloss under the sentence does, so the drill asks for the form, not the word.

function genSynthetic() {
    const a = pick(SYN);
    return q("Μονολεκτικά", "Ο μονολεκτικός συγκριτικός", a.m, a.syn,
        others(SYN, a, 3).map(x => x.syn).concat(["πιο " + a.m]), a.en);
}

function genSyntheticUse() {
    const s = subject(SYN_PLAIN);
    if (!s) return null;
    const right = `${s.first.nom} είναι ${synOf(s.a, s.g)} από ${s.second.acc}.`;
    return q("Μονολεκτικά", "Με τον μονολεκτικό τύπο",
        `${s.first.nom} / ${s.a.m} / ${s.second.acc}`, right,
        OTHER_GENDERS[s.g].map(g => `${s.first.nom} είναι ${synOf(s.a, g)} από ${s.second.acc}.`)
            .concat([`${s.first.nom} είναι πιο ${synOf(s.a, s.g)} από ${s.second.acc}.`]),
        `${cap(s.first.en)} ${isAre(s.g, s.first.en)} ${cmpEn(s.a)} than ${s.second.en}.`);
}

// Pure agreement: the sentence is given, only the ending is in question.
function genSyntheticAgree() {
    const s = subject(SYN_PLAIN);
    if (!s) return null;
    return q("Μονολεκτικά", "Ταίριαξε την κατάληξη",
        `${s.first.nom} είναι ______ από ${s.second.acc}.`, synOf(s.a, s.g),
        OTHER_GENDERS[s.g].map(g => synOf(s.a, g))
            .concat([FORM_OF[s.g](s.a), "πιο " + synOf(s.a, s.g)]),
        `${cap(s.first.en)} ${isAre(s.g, s.first.en)} ${cmpEn(s.a)} than ${s.second.en}.`);
}

// πολύς compares amounts, not single things, so it gets its own frame.
const MORE_TAILS = ["από πέρυσι", "από χθες", "από ό,τι περίμενα", "από πριν"];
const EN_TAIL = { "από πέρυσι":"last year", "από χθες":"yesterday",
                  "από ό,τι περίμενα":"I expected", "από πριν":"before" };

function genMore() {
    const polys = SYN.find(a => a.m === "πολύς");
    const pool = nouns().filter(n => n.kinds.includes("mass"));
    if (!pool.length) return null;
    const n = pick(pool), tail = pick(MORE_TAILS);
    return q("Μονολεκτικά", "Περισσότερος ή περισσότερα;",
        `${n.nom} είναι ______ ${tail}.`, synOf(polys, n.g),
        OTHER_GENDERS[n.g].map(g => synOf(polys, g))
            .concat([FORM_OF[n.g](polys), "πιο " + synOf(polys, n.g)]),
        `More ${n.en.replace(/^the /, "")} than ${EN_TAIL[tail]}.`);
}

// ── Round assembly ───────────────────────────────────────────────────────────

const GENERATORS = {
    "Συγκριτικός":    [genComparative, genComparative, genDegreeWord],
    "Υπερθετικός":    [genSuperlative, genSynthSuperlative],
    "Ίδιο & λιγότερο":[genEquality, genLess],
    "Μονολεκτικά":    [genSynthetic, genSyntheticUse, genSyntheticAgree, genMore]
};

const TOPICS = Object.keys(GENERATORS);

function buildRound(topic, n) {
    n = n || 10;
    // Without a topic, draw the topic first and the question shape second —
    // flattening the generators would hand the drill with the most shapes
    // nearly half the round.
    const gens = (topic && GENERATORS[topic])
        ? GENERATORS[topic]
        : null;
    const round = [], seen = new Set();
    let attempts = 0;
    while (round.length < n && attempts < 600) {
        attempts++;
        const item = pick(gens || GENERATORS[pick(TOPICS)])();
        if (!item || item.options.length < 2) continue;
        if (seen.has(item.prompt)) continue;
        seen.add(item.prompt);
        round.push(item);
    }
    return round;
}

return { TOPICS, buildRound, ADJ, SYN, FORM_OF, synOf, genders, nouns, accOf, slotOf, KIND_INDEX };

})();
