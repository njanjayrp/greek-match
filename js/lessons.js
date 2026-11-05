// The lessons of Ταξίδι στην Ελλάδα 1 (Α1 & Α2), which is the book these
// grammar topics, exercises, texts and words were harvested from.
//
// This is the second axis of the app: a topic answers "what is this rule",
// a lesson answers "what do I have to know for Μάθημα 17". Picking one
// narrows every section at once — Grammar to its rules, Practice to its
// exercises, Reading to its text, Words to the vocabulary it taught.
//
// Only lessons whose pages have actually been read are listed. A topic, a
// sentence or a text with no lesson is not hidden — it lives under
// "All lessons", which is how the app behaves when nothing is selected.

window.LESSONS = (function () {

const BOOK = "Ταξίδι στην Ελλάδα 1";

const LIST = [
    {
        n: 11,
        gr: "Στην υγειά μας!",
        en: "Eating out",
        topics: ["future", "diminutives"],
        words:  ["Kitchen & cooking"],
        texts:  []
    },
    {
        n: 12,
        gr: "Σινεμά ή θέατρο;",
        en: "Cinema or theatre?",
        topics: ["future"],
        words:  ["Free time, film & arts"],
        texts:  []
    },
    {
        n: 13,
        gr: "Μουσεία, αρχαιολογικοί χώροι, φεστιβάλ",
        en: "Museums, sites, festivals",
        topics: ["subjunctive"],
        words:  [],
        texts:  ["t7"]
    },
    {
        n: 15,
        gr: "Αναμνήσεις…",
        en: "Memories",
        topics: ["aorist"],
        words:  [],
        texts:  []
    },
    {
        n: 16,
        gr: "Καλές διακοπές!",
        en: "Happy holidays!",
        topics: ["adverbs", "comparatives"],
        words:  ["Beach & summer", "Mountains & winter"],
        texts:  ["t9"]
    },
    {
        n: 17,
        gr: "Υγεία, υπηρεσίες, εκπαίδευση",
        en: "Health, services, education",
        topics: ["imperative"],
        words:  ["At the doctor", "Doctors & specialists", "Bank & money"],
        texts:  ["m6"]
    },
    {
        n: 19,
        gr: "Χρόνια Πολλά!",
        en: "Feasts and holidays",
        topics: [],                       // this lesson teaches no new grammar
        words:  [],
        texts:  ["t8"]
    }
];

function all() { return LIST; }
function byN(n) { return LIST.find(l => String(l.n) === String(n)) || null; }
function label(n) {
    const l = byN(n);
    return l ? "Μάθημα " + l.n + " — " + l.en : "All lessons";
}
function has(n) { return !!byN(n); }

// Everything one lesson owns, for the filters in game.js
function topicsOf(n) { const l = byN(n); return l ? l.topics.slice() : null; }
function wordsOf(n)  { const l = byN(n); return l ? l.words.slice()  : null; }
function textsOf(n)  { const l = byN(n); return l ? l.texts.slice()  : null; }

return { BOOK, all, byN, label, has, topicsOf, wordsOf, textsOf };

})();
