// Conjugate by choosing instead of typing. Same question shape as the Dates
// and Παραθετικά drills ({ topic, sub, prompt, answer, options }), so all three
// share one renderer — only the questions come from js/conjugations.js.
//
// The distractors are the verb's own forms: another person in the same tense,
// or the same person in another tense. Picking the right one therefore means
// hearing the ending, not recognising a word.

window.CONJCHOICE = (function () {

const TENSES = [
    ["Ενεστώτας",   "present"],
    ["Παρατατικός", "imperfect"],
    ["Αόριστος",    "aorist"],
    ["Μέλλοντας",   "future"]
];
const TENSE_OF = Object.fromEntries(TENSES);
const TOPICS   = TENSES.map(([gr]) => gr);

const PRONOUNS = [
    "εγώ", "εσύ", "αυτός / αυτή", "εμείς", "εσείς", "αυτοί / αυτές"
];
const PERSON_EN = ["I", "you", "he / she", "we", "you all", "they"];

const QUEUE_KEY = "greek_pick_queue";

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// conjugations.js writes colloquial alternatives as "κάθισαν / καθίσανε"; an
// option has to be one form, so the drill offers the first and accepts it.
function form(v, tense, person) {
    const cell = v[tense] && v[tense][person];
    return cell ? cell.split(" / ")[0].trim() : null;
}

// Verbs are dealt from a shuffled queue that survives reloads, so every verb
// comes up once before any verb comes up twice. Its own key, so choosing and
// typing do not eat each other's turns.
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

function tensesOf(v) { return TENSES.map(([, t]) => t).filter(t => v[t]); }

// Wrong answers come from the same verb: first its other persons in this
// tense, then this person in its other tenses.
function distractors(v, tense, person, answer) {
    const sameTense = shuffle([0, 1, 2, 3, 4, 5].filter(p => p !== person))
        .map(p => form(v, tense, p));
    const otherTenses = shuffle(tensesOf(v).filter(t => t !== tense))
        .map(t => form(v, t, person));
    const out = [];
    for (const f of [...sameTense.slice(0, 2), ...otherTenses, ...sameTense.slice(2)]) {
        if (f && f !== answer && !out.includes(f)) out.push(f);
        if (out.length >= 3) break;
    }
    return out;
}

function question(v, tense, person) {
    const answer = form(v, tense, person);
    if (!answer) return null;
    const wrong = distractors(v, tense, person, answer);
    if (wrong.length < 2) return null;          // too few distinct forms to choose from
    const options = shuffle([answer, ...wrong.slice(0, 3)]);
    return {
        topic:   TENSES.find(([, t]) => t === tense)[0],
        sub:     PRONOUNS[person] + " — " + PERSON_EN[person],
        prompt:  v.lemma,
        gloss:   v.english,
        answer, options
    };
}

function buildRound(topic, n) {
    const verbs = (window.CONJUGATIONS || []).filter(v => tensesOf(v).length > 1);
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
            // Deal tenses from a shuffled deck so four questions cover all four
            // tenses instead of a round coming out all-present by chance.
            if (!deck.length) deck = shuffle(tensesOf(v));
            let i = deck.findIndex(t => v[t]);
            if (i === -1) { deck = shuffle(tensesOf(v)); i = deck.findIndex(t => v[t]); }
            if (i === -1) continue;
            tense = deck.splice(i, 1)[0];
        }
        // present 1sg is skipped — it is the lemma already printed above
        const person = shuffle([0, 1, 2, 3, 4, 5])
            .find(p => form(v, tense, p) && !(tense === "present" && p === 0));
        if (person === undefined) continue;
        const q = question(v, tense, person);
        if (q) round.push(q);
    }
    return shuffle(round);
}

return { TOPICS, buildRound, form, takeFromQueue, QUEUE_KEY };

})();
