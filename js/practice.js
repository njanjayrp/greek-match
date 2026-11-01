// Practice rounds: one grammar topic, one answer format, ten questions.
//
// A round can draw from two kinds of source — the generated drills registered
// in js/grammar.js (Παραθετικά, the clock, the verb tenses) and the written
// sentences in sentences.json — and Mixed interleaves them. Everything here is
// pure: give it the sentences with setSentences() and it needs no DOM, which is
// how tests/practice_test.js exercises it.
//
// Item kinds, which is what tells the renderer which container to show:
//   { kind: "choose", topic, sub, prompt, gloss, answer, options }
//   { kind: "write",  topic, sub, prompt, gloss, answer }
//   { kind: "fill",   topic, en, template, blanks }

window.PRACTICE = (function () {

const FORMATS = [["mixed", "Mixed"], ["choose", "Choose"], ["write", "Type"]];

let sentences = [];
let lesson    = null;          // null = every lesson

function setSentences(list) { sentences = Array.isArray(list) ? list : []; }

// Narrow every round to one Μάθημα. Exercises carry their lesson; a generated
// drill belongs to a lesson through the topic that owns it.
function setLesson(n) { lesson = (n && n !== "__all__") ? String(n) : null; }

function topicInLesson(topicId) {
    if (!lesson) return true;
    const ids = window.LESSONS.topicsOf(lesson) || [];
    return ids.includes(topicId);
}

function G() { return window.GRAMMAR; }

// A practice value is either a topic id or one of its sub-drills, "id::sub" —
// which is how you practise only the clock, or only the aorist of a verb.
function split(value) {
    const s = String(value == null ? "" : value);
    const i = s.indexOf("::");
    return i < 0 ? { id: s, sub: null } : { id: s.slice(0, i), sub: s.slice(i + 2) };
}

// The sentences.json topics a grammar topic owns. No topic id means every
// sentence, which is what "All topics" practises.
function sentencesFor(value) {
    const { id: topicId, sub } = split(value);
    if (sub) return [];                 // a sub-drill is generated, never written
    if (!sentences.length) return [];
    let pool = sentences;
    if (lesson) pool = pool.filter(s => String(s.lesson) === lesson);
    if (!topicId || topicId === "__all__") return pool.slice();
    const t = G().TOPICS.find(x => x.id === topicId);
    const owned = (t && t.sentences) || [];
    if (!owned.length) return [];
    return pool.filter(s => owned.includes(s.topic));
}

// Declaration-driven and synchronous: the tab row has to know what a topic
// offers before the drill scripts have finished loading.
function formatsFor(value) {
    const { id: topicId, sub } = split(value);
    if (topicId && topicId !== "__all__" && !topicInLesson(topicId)) return [];
    if (sub) {
        const formats = G().streams(topicId, null).filter(s => s.sub === sub).map(s => s.format);
        if (!formats.length) return [];
        const only = ["mixed"];
        if (formats.includes("choose")) only.push("choose");
        if (formats.includes("write"))  only.push("write");
        return only;
    }
    let generated = G().formatsFor(topicId && topicId !== "__all__" ? topicId : null);
    // Under a lesson, only that lesson's topics can generate anything
    if (lesson && (!topicId || topicId === "__all__")) {
        const ids = window.LESSONS.topicsOf(lesson) || [];
        generated = ids.some(id => G().formatsFor(id).length)
            ? [...new Set(ids.flatMap(id => G().formatsFor(id)))] : [];
    }
    const hasFill   = sentencesFor(value).length > 0;
    if (!generated.length && !hasFill) return [];   // a topic with a manual and no exercises yet
    const out = ["mixed"];
    if (generated.includes("choose") || hasFill) out.push("choose");
    if (generated.includes("write")) out.push("write");
    return out;
}

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// One dealable source, generated or written, behind the same next() call.
function sourcesFor(value, format) {
    const { id: topicId, sub: only } = split(value);
    const id = (topicId && topicId !== "__all__") ? topicId : null;
    const out = [];

    if (format !== "write") {
        const pool = shuffle(sentencesFor(value));
        let i = 0;
        if (pool.length) out.push({
            kind: "fill",
            next: () => (i < pool.length ? Object.assign({ kind: "fill" }, pool[i++]) : null)
        });
    }
    for (const s of G().streams(id, format === "mixed" ? null : format)) {
        if (!topicInLesson(s.topicId)) continue;
        if (only && s.sub !== only) continue;
        out.push({
            kind: s.format,
            next: () => {
                const [q] = s.source.buildRound(s.sub, 1);
                return q ? Object.assign({ kind: s.format, topicId: s.topicId }, q) : null;
            }
        });
    }
    return out;
}

// Deals round-robin from a reshuffled queue of sources, so a topic with four
// generators and a sentence set spreads a round over all five instead of
// emptying whichever one answers first.
function buildRound(value, format, n) {
    n = n || 10;
    format = format || "mixed";
    let sources = sourcesFor(value, format);
    if (!sources.length) return [];

    const round = [], seen = new Set();
    let queue = [];
    for (let guard = 0; guard < n * 8 && round.length < n && sources.length; guard++) {
        if (!queue.length) queue = shuffle(sources);
        const s = queue.shift();
        if (!sources.includes(s)) continue;
        const item = s.next();
        if (!item) {                       // a finite source ran dry
            sources = sources.filter(x => x !== s);
            queue = queue.filter(x => x !== s);
            continue;
        }
        const key = item.kind === "fill" ? item.id : item.prompt + "|" + item.answer;
        if (seen.has(key)) continue;
        seen.add(key);
        round.push(item);
    }
    return round;
}

// What one item is worth, so a mixed round's score adds up: a sentence with two
// blanks counts for two, a tap or a typed form counts for one.
function weightOf(item) {
    return item && item.kind === "fill" ? item.blanks.length : 1;
}

return { FORMATS, setSentences, setLesson, sentencesFor, formatsFor, buildRound, weightOf, split };

})();
