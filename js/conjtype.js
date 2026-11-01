// Conjugation by typing. The same four tense labels as js/conjchoice.js, so a
// grammar topic can pin both to itself ("Αόριστος — past" for Choose and for
// Type), and the same question fields minus `options` — typing has none.
//
// Its own queue key, kept from when this lived inside game.js, so the verbs you
// have already been asked carry over.

window.CONJTYPE = (function () {

const TENSES = [
    ["Ενεστώτας — present",     "present",   "now"],
    ["Παρατατικός — imperfect", "imperfect", "was …-ing / used to"],
    ["Αόριστος — past",         "aorist",    "did it once"],
    ["Μέλλοντας — future",      "future",    "will (θα)"]
];
const TENSE_OF = Object.fromEntries(TENSES.map(([gr, t]) => [gr, t]));
const HINT_OF  = Object.fromEntries(TENSES.map(([, t, hint]) => [t, hint]));
const TOPICS   = TENSES.map(([gr]) => gr);

const PRONOUNS  = ["εγώ", "εσύ", "αυτός / αυτή", "εμείς", "εσείς", "αυτοί / αυτές"];
const PERSON_EN = ["I", "you", "he / she", "we", "you all", "they"];

const QUEUE_KEY = "greek_conj_queue";

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function tensesOf(v) { return TENSES.map(([, t]) => t).filter(t => v[t]); }

// Verbs are dealt from a shuffled queue that survives reloads, so every verb
// comes up once before any verb comes up twice.
function takeFromQueue(verbs, size) {
    const byLemma = new Map(verbs.map(v => [v.lemma, v]));
    let queue = [];
    try { queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch (e) { queue = []; }
    queue = queue.filter(l => byLemma.has(l));

    const taken = [];
    while (taken.length < size) {
        if (!queue.length) {
            const fresh = shuffle(verbs.map(v => v.lemma).filter(l => !taken.includes(l)));
            if (!fresh.length) break;
            queue = fresh;
        }
        taken.push(queue.shift());
    }
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch (e) { /* private mode */ }
    return taken.map(l => byLemma.get(l));
}

function buildRound(topic, n) {
    const verbs = window.CONJUGATIONS || [];
    if (!verbs.length) return [];
    n = n || 10;

    const wanted = topic && TENSE_OF[topic] ? TENSE_OF[topic] : null;
    const pool = wanted ? verbs.filter(v => v[wanted]) : verbs;
    if (!pool.length) return [];

    const order = takeFromQueue(pool, Math.min(n, pool.length));
    const round = [];
    let deck = [];

    for (const v of order) {
        let tense = wanted;
        if (!tense) {
            if (!deck.length) deck = shuffle(tensesOf(v));
            let i = deck.findIndex(t => v[t]);
            if (i === -1) { deck = shuffle(tensesOf(v)); i = deck.findIndex(t => v[t]); }
            if (i === -1) continue;
            tense = deck.splice(i, 1)[0];
        }
        // present 1sg is skipped — it is the lemma already printed above
        const person = shuffle([0, 1, 2, 3, 4, 5])
            .find(p => v[tense][p] && !(tense === "present" && p === 0));
        if (person === undefined) continue;

        round.push({
            topic:  TENSES.find(([, t]) => t === tense)[0],
            sub:    PRONOUNS[person] + " (" + PERSON_EN[person] + ") · " + HINT_OF[tense],
            prompt:  v.lemma,
            gloss:   v.english,
            english: v.english,            // the typed renderer prints it beside the lemma
            answer: v[tense][person],       // may be "κάθισαν / καθίσανε"; the checker splits it
            lemma:  v.lemma,
            tense, person
        });
    }
    return shuffle(round);
}

return { TOPICS, buildRound, takeFromQueue, QUEUE_KEY };

})();
