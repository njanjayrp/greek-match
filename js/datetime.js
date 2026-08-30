// Greek time / date / age / duration drill.
// Everything is generated from number tables, so each round is different.
// Exposes window.DATETIME = { TOPICS, buildRound(topic, n) }.

(function () {

// ── Numbers ─────────────────────────────────────────────────────────────────
// Greek 1, 3, 4 (and their compounds) change form with gender, and the
// genitive is needed for ages (… χρονών).

const UNITS = {
    neut: ["μηδέν","ένα","δύο","τρία","τέσσερα","πέντε","έξι","εφτά","οχτώ","εννιά","δέκα","έντεκα","δώδεκα"],
    fem:  ["μηδέν","μία","δύο","τρεις","τέσσερις","πέντε","έξι","εφτά","οχτώ","εννιά","δέκα","έντεκα","δώδεκα"],
    masc: ["μηδέν","ένας","δύο","τρεις","τέσσερις","πέντε","έξι","εφτά","οχτώ","εννιά","δέκα","έντεκα","δώδεκα"],
    gen:  ["μηδέν","ενός","δύο","τριών","τεσσάρων","πέντε","έξι","εφτά","οχτώ","εννιά","δέκα","έντεκα","δώδεκα"]
};
const TEENS_VAR = {
    neut: { 13: "δεκατρία",  14: "δεκατέσσερα" },
    fem:  { 13: "δεκατρείς", 14: "δεκατέσσερις" },
    masc: { 13: "δεκατρείς", 14: "δεκατέσσερις" },
    gen:  { 13: "δεκατριών", 14: "δεκατεσσάρων" }
};
const TEENS_FIXED = { 15:"δεκαπέντε", 16:"δεκαέξι", 17:"δεκαεφτά", 18:"δεκαοχτώ", 19:"δεκαεννιά" };
const TENS = { 20:"είκοσι", 30:"τριάντα", 40:"σαράντα", 50:"πενήντα", 60:"εξήντα", 70:"εβδομήντα", 80:"ογδόντα", 90:"ενενήντα" };
const HUNDREDS = { 100:"εκατό", 200:"διακόσια", 300:"τριακόσια", 400:"τετρακόσια", 500:"πεντακόσια", 600:"εξακόσια", 700:"εφτακόσια", 800:"οχτακόσια", 900:"εννιακόσια" };

function num(n, g) {
    g = g || "neut";
    if (n <= 12) return UNITS[g][n];
    if (n < 20)  return TEENS_VAR[g][n] || TEENS_FIXED[n];
    const t = Math.floor(n / 10) * 10, u = n % 10;
    return u === 0 ? TENS[t] : TENS[t] + " " + num(u, g);
}

function yearWords(y) {
    if (y >= 2000) {
        const rest = y - 2000;
        return "δύο χιλιάδες" + (rest ? " " + num(rest, "neut") : "");
    }
    const h = Math.floor((y % 1000) / 100) * 100;
    const rest = y % 100;
    let s = "χίλια";
    if (h)    s += " " + HUNDREDS[h];
    if (rest) s += " " + num(rest, "neut");
    return s;
}

// ── Calendar ────────────────────────────────────────────────────────────────

const MONTHS = [
    { nom:"Ιανουάριος",  gen:"Ιανουαρίου",  acc:"Ιανουάριο",  en:"January"   },
    { nom:"Φεβρουάριος", gen:"Φεβρουαρίου", acc:"Φεβρουάριο", en:"February"  },
    { nom:"Μάρτιος",     gen:"Μαρτίου",     acc:"Μάρτιο",     en:"March"     },
    { nom:"Απρίλιος",    gen:"Απριλίου",    acc:"Απρίλιο",    en:"April"     },
    { nom:"Μάιος",       gen:"Μαΐου",       acc:"Μάιο",       en:"May"       },
    { nom:"Ιούνιος",     gen:"Ιουνίου",     acc:"Ιούνιο",     en:"June"      },
    { nom:"Ιούλιος",     gen:"Ιουλίου",     acc:"Ιούλιο",     en:"July"      },
    { nom:"Αύγουστος",   gen:"Αυγούστου",   acc:"Αύγουστο",   en:"August"    },
    { nom:"Σεπτέμβριος", gen:"Σεπτεμβρίου", acc:"Σεπτέμβριο", en:"September" },
    { nom:"Οκτώβριος",   gen:"Οκτωβρίου",   acc:"Οκτώβριο",   en:"October"   },
    { nom:"Νοέμβριος",   gen:"Νοεμβρίου",   acc:"Νοέμβριο",   en:"November"  },
    { nom:"Δεκέμβριος",  gen:"Δεκεμβρίου",  acc:"Δεκέμβριο",  en:"December"  }
];

const DAYS = [
    { gr:"Δευτέρα",    art:"τη",  en:"Monday"    },
    { gr:"Τρίτη",      art:"την", en:"Tuesday"   },
    { gr:"Τετάρτη",    art:"την", en:"Wednesday" },
    { gr:"Πέμπτη",     art:"την", en:"Thursday"  },
    { gr:"Παρασκευή",  art:"την", en:"Friday"    },
    { gr:"Σάββατο",    art:"το",  en:"Saturday"  },
    { gr:"Κυριακή",    art:"την", en:"Sunday"    }
];

// ── Clock ───────────────────────────────────────────────────────────────────

const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function minutePhrase(m) {
    if (m === 15) return "και τέταρτο";
    if (m === 30) return "και μισή";
    if (m === 45) return "παρά τέταρτο";
    if (m < 30)   return "και " + num(m, "neut");
    return "παρά " + num(60 - m, "neut");
}

// 9:45 is spoken as "δέκα παρά τέταρτο" — past the half hour, Greek counts down
// from the NEXT hour.
function timeWords(h, m) {
    const hh = m > 30 ? (h % 12) + 1 : h;
    const hourWord = UNITS.fem[hh];
    return m === 0 ? hourWord + " η ώρα" : hourWord + " " + minutePhrase(m);
}

function atHour(h) { return h === 1 ? "στη μία" : "στις " + UNITS.fem[h]; }

function fmtClock(h, m) { return h + ":" + String(m).padStart(2, "0"); }

// ── Durations ───────────────────────────────────────────────────────────────

const DUR_UNITS = [
    { one:"ένα λεπτό",   pl:"λεπτά",     plg:"neut", en:"minute", ens:"minutes" },
    { one:"μία ώρα",     pl:"ώρες",      plg:"fem",  en:"hour",   ens:"hours"   },
    { one:"μία μέρα",    pl:"μέρες",     plg:"fem",  en:"day",    ens:"days"    },
    { one:"μία βδομάδα", pl:"βδομάδες",  plg:"fem",  en:"week",   ens:"weeks"   },
    { one:"έναν μήνα",   pl:"μήνες",     plg:"masc", en:"month",  ens:"months"  },
    { one:"έναν χρόνο",  pl:"χρόνια",    plg:"neut", en:"year",   ens:"years"   }
];

function durPhrase(n, u) {
    return n === 1 ? u.one : num(n, u.plg) + " " + u.pl;
}
function durEnglish(n, u) {
    return n + " " + (n === 1 ? u.en : u.ens);
}

// Half-hour durations use contracted forms that have to be learned as units.
const HALF_HOURS = [
    { gr:"μισή ώρα",          en:"half an hour" },
    { gr:"μιάμιση ώρα",       en:"1.5 hours"    },
    { gr:"δυόμισι ώρες",      en:"2.5 hours"    },
    { gr:"τρεισήμισι ώρες",   en:"3.5 hours"    },
    { gr:"τεσσερισήμισι ώρες",en:"4.5 hours"    }
];

// ── When ────────────────────────────────────────────────────────────────────

const WHEN_ADV = [
    ["χτες", "yesterday"],
    ["προχτές", "the day before yesterday"],
    ["σήμερα", "today"],
    ["αύριο", "tomorrow"],
    ["μεθαύριο", "the day after tomorrow"],
    ["πέρσι", "last year"],
    ["φέτος", "this year"],
    ["του χρόνου", "next year"],
    ["την περασμένη βδομάδα", "last week"],
    ["την επόμενη βδομάδα", "next week"],
    ["τον περασμένο μήνα", "last month"],
    ["τον επόμενο μήνα", "next month"],
    ["το περασμένο Σαββατοκύριακο", "last weekend"],
    ["κάθε μέρα", "every day"],
    ["κάθε βδομάδα", "every week"],
    ["το πρωί", "in the morning"],
    ["το μεσημέρι", "at midday"],
    ["το απόγευμα", "in the afternoon"],
    ["το βράδυ", "in the evening"],
    ["τα μεσάνυχτα", "at midnight"],
    ["τη νύχτα", "at night"],
    ["νωρίς", "early"],
    ["αργά", "late"],
    ["μόλις", "just now"],
    ["σε λίγο", "in a little while"],
    ["αμέσως", "right away"],
    ["ακόμα", "still"],
    ["από τότε", "since then"]
];

const QUESTION_WORDS = [
    ["Τι ώρα είναι;", "What time is it?"],
    ["Πόσων χρονών είσαι;", "How old are you?"],
    ["Πόση ώρα κάνει;", "How long does it take?"],
    ["Πότε γεννήθηκες;", "When were you born?"],
    ["Τι μέρα είναι σήμερα;", "What day is it today?"],
    ["Πόσο καιρό μένεις εδώ;", "How long have you lived here?"],
    ["Κάθε πότε πηγαίνεις;", "How often do you go?"]
];

const PEOPLE = [
    { name:"Ο Νίκος",  he:"He"  },
    { name:"Η Μαρία",  he:"She" },
    { name:"Ο Γιώργος",he:"He"  },
    { name:"Η Ελένη",  he:"She" },
    { name:"Ο Κώστας", he:"He"  },
    { name:"Η Άννα",   he:"She" }
];

const DUR_FRAMES = [
    "Η ταινία κρατάει ",
    "Το μάθημα διαρκεί ",
    "Το ταξίδι κρατάει ",
    "Η συναυλία διαρκεί "
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

// k distinct members of arr other than x
function others(arr, x, k) { return shuffle(arr.filter(v => v !== x)).slice(0, k); }

// Two neighbouring counts that are never equal to n or to each other
function nearCounts(n) { return n === 1 ? [2, 3] : [n - 1, n + 1]; }

// Build a question, padding the option list to 4 distinct entries.
function q(topic, sub, prompt, answer, distractors) {
    const opts = [answer];
    for (const d of shuffle(distractors)) {
        if (opts.length >= 4) break;
        if (d != null && !opts.includes(d)) opts.push(d);
    }
    return { topic, sub, prompt, answer, options: shuffle(opts) };
}

// Pull 3 wrong English glosses from a [gr, en] table.
function otherGlosses(table, correct, field) {
    return table.filter(r => r[field] !== correct).map(r => r[field]);
}

// ── Generators: Time ────────────────────────────────────────────────────────

function timeAlternatives(h, m) {
    return [
        [(h % 12) + 1, m],
        [h === 1 ? 12 : h - 1, m],
        [h, (60 - m) % 60],                            // και ⇄ παρά confusion
        [h, pick(MINUTES.filter(x => x !== m))],
        [h, pick(MINUTES.filter(x => x !== m))],
        [(h % 12) + 1, pick(MINUTES.filter(x => x !== m))]
    ];
}

function genTimeRead() {
    const h = randInt(1, 12), m = pick(MINUTES);
    return q("Time", "Τι ώρα είναι;", "Είναι " + timeWords(h, m) + ".",
        fmtClock(h, m), timeAlternatives(h, m).map(a => fmtClock(a[0], a[1])));
}

function genTimeSay() {
    const h = randInt(1, 12), m = pick(MINUTES);
    return q("Time", "Πώς το λέμε στα ελληνικά;", fmtClock(h, m),
        timeWords(h, m), timeAlternatives(h, m).map(a => timeWords(a[0], a[1])));
}

function genTimeAt() {
    const h = randInt(1, 11);
    const dp = pick([["το πρωί","a.m."], ["το απόγευμα","p.m."], ["το βράδυ","p.m."]]);
    const per = dp[1], other = per === "a.m." ? "p.m." : "a.m.";
    return q("Time", "Πότε;", atHour(h) + " " + dp[0], h + " " + per,
        [h + " " + other, (h % 12 + 1) + " " + per, (h === 1 ? 12 : h - 1) + " " + per, (h % 12 + 1) + " " + other]);
}

function genTimeRange() {
    const a = randInt(1, 6), b = a + randInt(1, 4);
    const gr = "από " + (a === 1 ? "τη μία" : "τις " + UNITS.fem[a]) +
               " μέχρι " + (b === 1 ? "τη μία" : "τις " + UNITS.fem[b]);
    return q("Time", "Από πότε μέχρι πότε;", gr, "from " + a + " to " + b,
        ["from " + b + " to " + a, "from " + a + " to " + (b + 1), "from " + (a + 1) + " to " + b, "at " + a + " for " + b + " hours"]);
}

// ── Generators: Dates ───────────────────────────────────────────────────────

// The 1st of the month is the one ordinal Greek keeps: την πρώτη Μαΐου.
function dayOfMonth(d) { return d === 1 ? "πρώτη" : num(d, "fem"); }
function datePhrase(d, mo) { return (d === 1 ? "την " : "στις ") + dayOfMonth(d) + " " + mo.gen; }

function genDateRead() {
    const d = randInt(1, 28), mo = pick(MONTHS), om = others(MONTHS, mo, 3);
    const d2 = d === 28 ? d - 1 : d + 1, d3 = d <= 2 ? d + 10 : d - 1;
    return q("Dates", "Ποια ημερομηνία;", datePhrase(d, mo), d + " " + mo.en,
        [ d2 + " " + mo.en, d3 + " " + mo.en,
          d + " " + om[0].en, d + " " + om[1].en, d2 + " " + om[2].en ]);
}

function genDateSay() {
    const d = randInt(1, 28), mo = pick(MONTHS), om = others(MONTHS, mo, 3);
    const d2 = d === 28 ? d - 1 : d + 1, d3 = d <= 2 ? d + 10 : d - 1;
    return q("Dates", "Πώς το λέμε στα ελληνικά;", d + " " + mo.en, datePhrase(d, mo),
        [ datePhrase(d2, mo), datePhrase(d3, mo),
          datePhrase(d, om[0]), datePhrase(d, om[1]), datePhrase(d2, om[2]) ]);
}

function genYearRead() {
    const y = pick([randInt(1900, 1999), randInt(2000, 2030)]);
    return q("Dates", "Ποια χρονιά;", "το " + yearWords(y), String(y),
        [String(y + 1), String(y - 1), String(y + 10), String(y - 10), String(y + 100 > 2100 ? y - 100 : y + 100)]);
}

function genYearSay() {
    const y = pick([randInt(1900, 1999), randInt(2000, 2030)]);
    return q("Dates", "Πώς το λέμε στα ελληνικά;", "το " + y,
        yearWords(y), [yearWords(y + 1), yearWords(y - 1), yearWords(y + 10), yearWords(y - 10)]);
}

function genMonthVocab() {
    const mo = pick(MONTHS);
    if (Math.random() < 0.5) {
        return q("Dates", "Ποιος μήνας;", mo.nom, mo.en, otherGlosses(MONTHS, mo.en, "en"));
    }
    return q("Dates", "Πότε;", "τον " + mo.acc, "in " + mo.en,
        MONTHS.filter(x => x !== mo).map(x => "in " + x.en));
}

function genDayVocab() {
    const d = pick(DAYS);
    if (Math.random() < 0.5) {
        return q("Dates", "Ποια μέρα;", d.gr, d.en, otherGlosses(DAYS, d.en, "en"));
    }
    return q("Dates", "Πότε;", d.art + " " + d.gr, "on " + d.en,
        DAYS.filter(x => x !== d).map(x => "on " + x.en));
}

// ── Generators: Age ─────────────────────────────────────────────────────────

function ageDistractors(n) {
    return [n + 1, n - 1, n + 10, n - 10, n + 2, n - 2].filter(x => x > 0 && x !== n);
}

function genAgeRead() {
    const n = randInt(2, 79), p = pick(PEOPLE);
    return q("Age", "Πόσων χρονών;", p.name + " είναι " + num(n, "gen") + " χρονών.",
        n + " years old", ageDistractors(n).map(x => x + " years old"));
}

function genAgeSay() {
    const n = randInt(2, 79), p = pick(PEOPLE);
    return q("Age", "Πώς το λέμε στα ελληνικά;", p.he + " is " + n + ".",
        num(n, "gen") + " χρονών", ageDistractors(n).map(x => num(x, "gen") + " χρονών"));
}

function genBornIn() {
    const y = randInt(1950, 2015);
    return q("Age", "Πότε;", "Γεννήθηκα το " + yearWords(y) + ".", "I was born in " + y,
        ["I was born in " + (y + 1), "I was born in " + (y - 1), "I was born in " + (y + 10), "I am " + y + " years old"]);
}

function genAgeTurns() {
    const n = randInt(6, 60), p = pick(PEOPLE);
    return q("Age", "Πόσων χρονών;", p.name + " κλείνει τα " + num(n, "neut") + " τον " + pick(MONTHS).acc + ".",
        "turns " + n, ageDistractors(n).map(x => "turns " + x).concat(["is " + n + " already"]));
}

// ── Generators: Duration ────────────────────────────────────────────────────

function genDurRead() {
    if (Math.random() < 0.25) {
        const h = pick(HALF_HOURS);
        return q("Duration", "Πόση ώρα;", pick(DUR_FRAMES) + h.gr + ".", h.en,
            otherGlosses(HALF_HOURS, h.en, "en").concat(["2 hours", "3 hours"]));
    }
    const u = pick(DUR_UNITS), n = randInt(1, 11);
    const [a, b] = nearCounts(n), ou = others(DUR_UNITS, u, 2);
    return q("Duration", "Πόσο κρατάει;", pick(DUR_FRAMES) + durPhrase(n, u) + ".",
        durEnglish(n, u),
        [ durEnglish(a, u), durEnglish(b, u), durEnglish(n, ou[0]), durEnglish(n, ou[1]) ]);
}

function genDurSay() {
    const u = pick(DUR_UNITS), n = randInt(1, 11);
    const [a, b] = nearCounts(n), ou = others(DUR_UNITS, u, 2);
    return q("Duration", "Πώς το λέμε στα ελληνικά;", durEnglish(n, u), durPhrase(n, u),
        [ durPhrase(a, u), durPhrase(b, u), durPhrase(n, ou[0]), durPhrase(n, ou[1]) ]);
}

function genDurSince() {
    const u = pick(DUR_UNITS.slice(2)), n = randInt(2, 9), ou = others(DUR_UNITS, u, 1);
    return q("Duration", "Πόσο καιρό;", "Μένω στην Αθήνα εδώ και " + durPhrase(n, u) + ".",
        "I have lived in Athens for " + durEnglish(n, u),
        [ "I will live in Athens for " + durEnglish(n, u),
          "I lived in Athens " + durEnglish(n, u) + " ago",
          "I have lived in Athens for " + durEnglish(n + 1, u),
          "I have lived in Athens for " + durEnglish(n, ou[0]) ]);
}

// ── Generators: When ────────────────────────────────────────────────────────

function genWhenRead() {
    const a = pick(WHEN_ADV);
    return q("When", "Τι σημαίνει;", a[0], a[1], WHEN_ADV.filter(x => x !== a).map(x => x[1]));
}

function genWhenSay() {
    const a = pick(WHEN_ADV);
    return q("When", "Πώς το λέμε στα ελληνικά;", a[1], a[0], WHEN_ADV.filter(x => x !== a).map(x => x[0]));
}

function genAgo() {
    const u = pick(DUR_UNITS), n = randInt(2, 9), ou = others(DUR_UNITS, u, 1);
    return q("When", "Πότε;", "πριν από " + durPhrase(n, u), durEnglish(n, u) + " ago",
        [ "in " + durEnglish(n, u),
          "for " + durEnglish(n, u),
          durEnglish(n + 1, u) + " ago",
          durEnglish(n, ou[0]) + " ago" ]);
}

function genIn() {
    const u = pick(DUR_UNITS), n = randInt(2, 9), ou = others(DUR_UNITS, u, 1);
    return q("When", "Πότε;", "σε " + durPhrase(n, u), "in " + durEnglish(n, u),
        [ durEnglish(n, u) + " ago",
          "for " + durEnglish(n, u),
          "in " + durEnglish(n + 1, u),
          "in " + durEnglish(n, ou[0]) ]);
}

function genQuestionWord() {
    const w = pick(QUESTION_WORDS);
    return q("When", "Τι ρωτάει;", w[0], w[1], QUESTION_WORDS.filter(x => x !== w).map(x => x[1]));
}

// ── Round assembly ──────────────────────────────────────────────────────────

const GENERATORS = {
    Time:     [genTimeRead, genTimeRead, genTimeSay, genTimeAt, genTimeRange],
    Dates:    [genDateRead, genDateSay, genYearRead, genYearSay, genMonthVocab, genDayVocab],
    Age:      [genAgeRead, genAgeSay, genBornIn, genAgeTurns],
    Duration: [genDurRead, genDurRead, genDurSay, genDurSince],
    When:     [genWhenRead, genWhenSay, genAgo, genIn, genQuestionWord]
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

window.DATETIME = { TOPICS, buildRound, timeWords, yearWords, num };

})();
