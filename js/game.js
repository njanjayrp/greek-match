// Words loaded from words.json
let allWords = [];
// Sentences loaded from sentences.json (lazy)
let allSentences = [];

// ── Touch drag state ────────────────────────────────────────────────────────
let touchDragChip   = null;
let touchDragSource = null;
let touchClone      = null;
let touchTarget     = null;

function initApp(words) {
    allWords = words;
    // On-demand drills (js/compare.js and friends) build their sentences out of
    // the dictionary, so they need it reachable without being wired into boot.
    window.WORDS = words;

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    // Resolve URL params / localStorage for mode and lang
    const urlParams = new URLSearchParams(location.search);
    const urlMode   = urlParams.get("mode");
    const urlLang   = urlParams.get("lang") || localStorage.getItem("greek_lang");
    // The last mode is remembered, so a refresh stays where you were instead of
    // going back to whatever a "New Round" click last baked into the URL. The
    // list of modes comes from SECTIONS, so a new tab cannot be left out of it.
    let wanted = urlMode || localStorage.getItem("greek_mode");
    if (LEGACY_MODE[wanted]) {
        if (LEGACY_TOPIC[wanted]) { try { localStorage.setItem("greek_topic", LEGACY_TOPIC[wanted]); } catch (e) { /* private mode */ } }
        wanted = LEGACY_MODE[wanted];
    }
    if (Object.values(SECTIONS).some(tabs => tabs.some(([id]) => id === wanted))) mode = wanted;
    if (urlLang === "english") lang = "english";

    // Build the dropdowns from the data
    window.PRACTICE.setSentences(allSentences);
    lesson = localStorage.getItem("greek_lesson") || "__all__";
    if (lesson !== "__all__" && !window.LESSONS.has(lesson)) lesson = "__all__";
    window.PRACTICE.setLesson(lesson);
    populateLessonSelect();
    populateGroupSelect();
    group = resolveGroup();
    document.getElementById("group-select").value = group;

    round = selectRound();

    // Event listeners
    document.getElementById("btn-check").addEventListener("click", dispatchCheck);
    document.getElementById("btn-retry").addEventListener("click", dispatchRetry);
    document.getElementById("btn-new").addEventListener("click", () => {
        const url = new URL(location.href);
        url.searchParams.set("mode", mode);
        url.searchParams.set("lang", lang);
        location.href = url.toString();
    });
    for (const btn of document.querySelectorAll("#sections .section")) {
        btn.addEventListener("click", () => switchSection(btn.dataset.section));
    }
    document.getElementById("group-select").addEventListener("change", e => switchGroup(e.target.value));
    document.getElementById("lesson-select").addEventListener("change", e => switchLesson(e.target.value));
    // One click from reading the rule to drilling it — the topic is already shared.
    document.getElementById("btn-practise").addEventListener("click", () => switchSection("practice"));
    document.getElementById("typing-form").addEventListener("submit", submitTypingAnswer);
    document.getElementById("conj-form").addEventListener("submit", submitConjAnswer);
    document.getElementById("lang-gr").addEventListener("click", () => setLang("greek"));
    document.getElementById("lang-en").addEventListener("click", () => setLang("english"));

    if (lang === "english") {
        document.getElementById("lang-gr").classList.remove("active");
        document.getElementById("lang-en").classList.add("active");
    }
    section = sectionOf(mode);
    BrowseMode.init(allWords);
    applyMode();
    // grammar drills load on demand; redraw once they are in
    window.GRAMMAR.load().then(() => { if (section === "grammar" || section === "practice") { populateGroupSelect(); applyMode(); } });
    window.ReadingMode.load().then(() => { if (mode === "read") { refreshReading(); } });
}

// The texts arrive after boot, so whatever is on screen is redrawn once they do.
function refreshReading() {
    populateGroupSelect();
    group = localStorage.getItem("greek_topic_read") || defaultGroup();
    if (!groupExists(group)) group = defaultGroup();
    document.getElementById("group-select").value = group;
    applyMode();
}

const MARKED = "__marked__";

const SECTIONS = {
    words:    [["match", "Match"], ["type", "Type"], ["browse", "Browse"]],
    grammar:  [["manual", "Manual"]],
    practice: [["mixed", "Mixed"], ["choose", "Choose"], ["write", "Type"]],
    reading:  [["read", "Reading"]]
};

// Grammar holds the explanations, Practice the exercises, and both are indexed
// by the same list of topics. The old doors — Fill, Conjugate, Choose, Dates,
// Drill — were formats pretending to be topics; a remembered mode or a
// bookmarked ?mode= still lands on what it meant.
const LEGACY_MODE  = { fill: "mixed", drill: "choose", dates: "choose", pick: "choose", conj: "write" };
const LEGACY_TOPIC = { dates: "time-dates" };

function isPractice(m) { return sectionOf(m) === "practice"; }

function sectionOf(m) {
    return Object.keys(SECTIONS).find(s => SECTIONS[s].some(([id]) => id === m)) || "words";
}

function renderTabs() {
    const bar = document.getElementById("tabs");
    bar.innerHTML = "";
    // One tab is not a choice — Grammar and Reading show no row at all.
    if (bar.parentElement) bar.parentElement.style.display = SECTIONS[section].length > 1 ? "" : "none";
    const offered = section === "practice" ? window.PRACTICE.formatsFor(group) : null;
    for (const [id, label] of SECTIONS[section]) {
        const b = document.createElement("button");
        const off = offered && !offered.includes(id);
        b.className = "tab" + (id === mode ? " active" : "") + (off ? " off" : "");
        b.textContent = label;
        b.disabled = !!off;
        if (!off) b.addEventListener("click", () => switchMode(id));
        bar.appendChild(b);
    }
    for (const btn of document.querySelectorAll("#sections .section")) {
        btn.classList.toggle("active", btn.dataset.section === section);
    }
}

function switchSection(target) {
    if (target === section) return;
    section = target;
    if (section === "grammar") {
        window.GRAMMAR.load().then(() => { populateGroupSelect(); applyMode(); });
    }
    switchMode(SECTIONS[section][0][0]);
}

// Manual and Reading have no "All" entry, so they fall back to their first one.
function defaultGroup() {
    if (mode === "manual") return (topicsInLesson()[0] || window.GRAMMAR.TOPICS[0]).id;
    if (mode === "read") {
        const only = lessonTexts();
        const texts = window.ReadingMode.TEXTS().filter(t => !only || only.includes(t.id));
        return (texts[0] || window.ReadingMode.TEXTS()[0] || {}).id || "__all__";
    }
    return "__all__";
}

// Grammar and Practice share one topic, so reading a rule and drilling it are
// the same place seen twice; Words keeps its own word-group filter.
function topicKeyFor(m) {
    if (m === "read") return "greek_topic_read";
    if (m === "manual" || isPractice(m)) return "greek_topic";
    return "greek_group";
}

function resolveGroup() {
    let g = null;
    try { g = localStorage.getItem(topicKeyFor(mode)); } catch (e) { g = null; }
    return (g && groupExists(g)) ? g : defaultGroup();
}

// The grammar topics, grouped by area — the same markup for both dropdowns.
function appendTopicOptions(select) {
    const visible = topicsInLesson();
    for (const area of window.GRAMMAR.areas()) {
        const inArea = visible.filter(x => x.area === area);
        if (!inArea.length) continue;
        const parent = document.createElement("optgroup");
        parent.label = window.GRAMMAR.areaLabel(area);
        for (const t of inArea) {
            const opt = document.createElement("option");
            opt.value = t.id;
            opt.textContent = window.GRAMMAR.topicLabel(t);
            parent.appendChild(opt);
        }
        select.appendChild(parent);
    }
}

function populateLessonSelect() {
    const select = document.getElementById("lesson-select");
    select.innerHTML = "";
    const all = document.createElement("option");
    all.value = "__all__";
    all.textContent = "All lessons";
    select.appendChild(all);
    for (const l of window.LESSONS.all()) {
        const opt = document.createElement("option");
        opt.value = String(l.n);
        opt.textContent = "Μάθημα " + l.n + " — " + l.gr + " · " + l.en;
        select.appendChild(opt);
    }
    select.value = lesson;
}

// Picking a Μάθημα narrows every section at once; "All lessons" restores them.
function switchLesson(target) {
    lesson = target || "__all__";
    try { localStorage.setItem("greek_lesson", lesson); } catch (e) { /* private mode */ }
    window.PRACTICE.setLesson(lesson);
    populateGroupSelect();
    if (!groupExists(group)) group = defaultGroup();
    document.getElementById("group-select").value = group;
    if (isPractice(mode) && !window.PRACTICE.formatsFor(group).includes(mode)) {
        const offered = window.PRACTICE.formatsFor(group);
        if (offered.length) { mode = offered[0]; rememberMode(); }
    }
    round = selectRound();
    applyMode();
}

// The topics, texts and word groups this lesson taught — null means no filter.
function lessonTopics() { return lesson === "__all__" ? null : (window.LESSONS.topicsOf(lesson) || []); }
function lessonTexts()  { return lesson === "__all__" ? null : (window.LESSONS.textsOf(lesson)  || []); }
function lessonWords()  { return lesson === "__all__" ? null : (window.LESSONS.wordsOf(lesson)  || []); }

function topicsInLesson() {
    const only = lessonTopics();
    return window.GRAMMAR.TOPICS.filter(t => !only || only.includes(t.id));
}

function populateGroupSelect() {
    const select = document.getElementById("group-select");
    select.innerHTML = "";
    if (mode === "manual") {
        appendTopicOptions(select);
        return;
    }
    if (isPractice(mode)) {
        const allOpt = document.createElement("option");
        allOpt.value = "__all__";
        allOpt.textContent = "All topics";
        select.appendChild(allOpt);
        appendTopicOptions(select);
        return;
    }
    if (mode === "read") {
        // Grouped, so the list stays short to scan as more texts arrive
        const onlyTexts = lessonTexts();
        let current = null, parent = select;
        for (const t of window.ReadingMode.TEXTS().filter(t => !onlyTexts || onlyTexts.includes(t.id))) {
            if (t.group && t.group !== current) {
                current = t.group;
                parent = document.createElement("optgroup");
                parent.label = t.group;
                select.appendChild(parent);
            }
            const opt = document.createElement("option");
            opt.value = t.id;
            opt.textContent = t.title;
            (t.group ? parent : select).appendChild(opt);
        }
        return;
    }
    const allOpt = document.createElement("option");
    allOpt.value = "__all__";
    allOpt.textContent = "All groups";
    select.appendChild(allOpt);

    if (allWords.some(w => w.marked)) {
        const marked = document.createElement("option");
        marked.value = MARKED;
        marked.textContent = "\u2605 Marked";
        select.appendChild(marked);
    }

    const onlyWords = lessonWords();
    const items = [...new Set(allWords.map(w => w.group).filter(Boolean))]
        .filter(g => !onlyWords || onlyWords.includes(g)).sort();
    for (const g of items) {
        const opt = document.createElement("option");
        opt.value = g;
        opt.textContent = g;
        select.appendChild(opt);
    }
}

// Generated questions and written sentences are the same kind of question over
// different sources, so one renderer per answer format serves all of them.

function groupExists(g) {
    if (g === "__all__") return mode !== "manual" && mode !== "read";
    if (g === MARKED) return !isPractice(mode) && mode !== "manual" && allWords.some(w => w.marked);
    if (mode === "manual" || isPractice(mode)) return topicsInLesson().some(t => t.id === g);
    if (mode === "read") {
        const only = lessonTexts();
        return window.ReadingMode.TEXTS().some(t => t.id === g) && (!only || only.includes(g));
    }
    const onlyWords = lessonWords();
    return allWords.some(w => w.group === g) && (!onlyWords || onlyWords.includes(g));
}

// ── Data ─────────────────────────────────────────────────────────────────────

function modePool() {
    const onlyWords = lessonWords();
    const base = onlyWords ? allWords.filter(w => onlyWords.includes(w.group)) : allWords;
    if (group === MARKED) return base.filter(w => w.marked);
    if (group === "__all__") return base;
    return base.filter(w => w.group === group);
}

function selectRound() {
    if (isPractice(mode) || mode === "manual" || mode === "read") return [];
    return selectWordRound();
}

function selectWordRound() {
    const weights  = JSON.parse(localStorage.getItem("greek_weights")  || "{}");
    const streaks  = JSON.parse(localStorage.getItem("greek_streaks")  || "{}");
    const mastered = new Set(JSON.parse(localStorage.getItem("greek_mastered") || "[]"));
    const seen2    = JSON.parse(localStorage.getItem("greek_seen")     || "[]");
    const exposure = JSON.parse(localStorage.getItem("greek_exposure") || "{}");

    const pool     = modePool();
    // In Marked mode, user explicitly chose what to review — don't filter out "mastered"
    // (after enough repetitions, the entire marked pool was getting excluded and only ~15
    // recently-marked words kept cycling).
    let active     = group === MARKED ? pool.slice() : pool.filter(w => !mastered.has(w.greek));
    if (active.length < 6) active = pool.slice();

    // Hold back as many past rounds as the pool can afford, instead of a fixed
    // 2–4 round window: with 70 marked words that window still brought the same
    // handful back every few rounds. Stop once too few words would be left.
    let recent = new Set();
    for (const past of seen2) {
        const trial = new Set(recent);
        for (const g of past) trial.add(g);
        if (active.filter(w => !trial.has(w.greek)).length < 12) break;
        recent = trial;
    }

    const eligible = active.filter(w => !recent.has(w.greek));
    const fallback = active.filter(w =>  recent.has(w.greek));

    // Boost recently-added vocab: only words within the last 60 entries of words.json
    // that also have no prior state. Older unseen words fall back to baseline so they
    // don't crowd the bonus pool.
    const allCount = allWords.length;
    const idxByGreek = new Map(allWords.map((w, i) => [w.greek, i]));
    function newnessBonus(w) {
        // In Marked mode the user has explicitly chosen the pool — no position-based boost
        if (group === MARKED) return 1;
        if (weights[w.greek] || streaks[w.greek]) return 1;
        const fromEnd = allCount - 1 - (idxByGreek.get(w.greek) ?? 0);
        if (fromEnd >= 60) return 1;
        const exp = exposure[w.greek] || 0;
        return exp >= 5 ? 1 : 1 + (1 - exp / 5) * 7;
    }
    function effectiveWeight(w) {
        return (weights[w.greek] || 1) * newnessBonus(w);
    }

    function weightedPick(pool, exclude) {
        const avail = pool.filter(w => !exclude.has(w.greek));
        if (!avail.length) return null;
        const total = avail.reduce((s, w) => s + effectiveWeight(w), 0);
        let r = Math.random() * total;
        for (const w of avail) { r -= effectiveWeight(w); if (r <= 0) return w; }
        return avail[avail.length - 1];
    }
    function randomPick(pool, exclude) {
        const avail = pool.filter(w => !exclude.has(w.greek));
        return avail.length ? avail[Math.floor(Math.random() * avail.length)] : null;
    }

    const picked = new Set();
    const round  = [];
    const weightedCount = group === MARKED ? 0 : 6;
    for (let i = 0; i < weightedCount; i++) {
        const w = weightedPick(eligible, picked) || weightedPick(fallback, picked);
        if (w) { round.push(w); picked.add(w.greek); }
    }
    for (let i = round.length; i < 6; i++) {
        const w = randomPick(eligible, picked) || randomPick(fallback, picked);
        if (w) { round.push(w); picked.add(w.greek); }
    }
    return round;
}

let mode    = "match";
let section = "words";
let lesson  = "__all__";      // which Μάθημα the whole app is narrowed to
let group   = "__all__";
let lang    = "greek";
let checked = false;
let round   = [];

function setLang(l) {
    lang = l;
    localStorage.setItem("greek_lang", l);
    document.getElementById("lang-gr").classList.toggle("active", l === "greek");
    document.getElementById("lang-en").classList.toggle("active", l === "english");
    updateSubtitle();
    if (mode === "type") buildTyping();
    else if (isPractice(mode)) buildPractice();
    else buildMatch();
}

function updateSubtitle() {
    const subtitles = {
        match:  { greek: "Tap or drag the Greek word to its English meaning",        english: "Tap or drag the English word to its Greek meaning" },
        type:   { greek: "Type the Greek translation",                               english: "Type the English translation" },
        mixed:  { greek: "Everything this topic has \u2014 tap or type",                 english: "Everything this topic has \u2014 tap or type" },
        choose: { greek: "Tap the right form",                                       english: "Tap the right form" },
        write:  { greek: "Write the form",                                           english: "Write the form" },
        browse: { greek: "Look a word up \u2014 verbs show how they change",           english: "Look a word up \u2014 verbs show how they change" },
        manual: { greek: "Read the rule, then practise it",                          english: "Read the rule, then practise it" },
        read:   { greek: "Read the text \u2014 the English sits under each paragraph",   english: "Read the text \u2014 the English sits under each paragraph" }
    };
    // A topic names itself in the subtitle, so the dropdown is not the only clue
    const topic = (mode === "manual" || isPractice(mode)) && group !== "__all__"
        ? window.GRAMMAR.TOPICS.find(t => t.id === group) : null;
    const base = subtitles[mode][lang];
    const line = topic ? topic.title + " \u2014 " + topic.blurb : base;
    document.getElementById("subtitle").textContent =
        lesson === "__all__" ? line : window.LESSONS.label(lesson) + " \u00b7 " + line;
}

// ── Match game ──────────────────────────────────────────────────────────────

let draggedChip  = null;
let dragSource   = null;
let selectedChip = null;

function buildMatch() {
    const pairs = document.getElementById("pairs");
    const bank  = document.getElementById("bank");
    pairs.innerHTML = "";
    bank.innerHTML  = "";
    checked = false;
    if (selectedChip) { selectedChip.classList.remove("selected"); selectedChip = null; }

    document.getElementById("score-banner").style.display = "none";
    document.getElementById("btn-check").style.display    = "";
    document.getElementById("btn-retry").style.display    = "none";
    document.getElementById("btn-new").style.display      = "";

    const roundGreek = new Set(round.map(w => w.greek));
    let decoyPool = modePool().filter(w => !roundGreek.has(w.greek));
    const decoys = decoyPool
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);

    const allPairs = [
        ...round.map((item, i) => ({ item, realIndex: i })),
        ...decoys.map(item    => ({ item, realIndex: null }))
    ].sort(() => Math.random() - 0.5);

    allPairs.forEach(({ item, realIndex }) => {
        const pair  = document.createElement("div");
        pair.className = "pair";
        const label = document.createElement("div");
        label.className = "english";
        label.textContent = lang === "greek" ? item.english : item.greek;
        const zone  = document.createElement("div");
        zone.className = "dropzone empty-hint";
        if (realIndex !== null) zone.dataset.realIndex = realIndex;
        else                    zone.dataset.decoy = "true";
        addDropTarget(zone);
        const inner = document.createElement("div");
        inner.className = "dropzone-inner";
        zone.appendChild(inner);
        pair.appendChild(label);
        pair.appendChild(zone);
        pairs.appendChild(pair);
    });

    [...round].sort(() => Math.random() - 0.5).forEach(item => bank.appendChild(makeChip(item)));
    addDropTarget(bank);
}

function makeChip(item) {
    const chip = document.createElement("div");
    const weights = JSON.parse(localStorage.getItem("greek_weights") || "{}");
    chip.className = "chip" + ((weights[item.greek] || 1) > 1 ? " repeat" : "");
    chip.draggable = true;
    chip.dataset.greek = item.greek;
    chip.textContent = lang === "greek" ? item.greek : item.english;

    // Desktop drag
    chip.addEventListener("dragstart", () => {
        draggedChip = chip;
        dragSource  = chip.parentElement;
        setTimeout(() => chip.classList.add("dragging"), 0);
    });
    chip.addEventListener("dragend", () => {
        chip.classList.remove("dragging");
        updateEmptyHints();
    });

    // Touch drag
    chip.addEventListener("touchstart", handleTouchStart, { passive: false });
    chip.addEventListener("touchmove",  handleTouchMove,  { passive: false });
    chip.addEventListener("touchend",   handleTouchEnd,   { passive: false });

    // Tap to select
    chip.addEventListener("click", e => {
        e.stopPropagation();
        if (checked) return;
        if (selectedChip === chip) {
            chip.classList.remove("selected");
            selectedChip = null;
        } else {
            if (selectedChip) selectedChip.classList.remove("selected");
            selectedChip = chip;
            chip.classList.add("selected");
        }
    });
    return chip;
}

// ── Touch drag handlers ─────────────────────────────────────────────────────

function handleTouchStart(e) {
    if (checked) return;
    const chip = e.currentTarget;
    const touch = e.touches[0];

    // Start a drag after a brief hold — distinguish from tap
    touchDragChip   = chip;
    touchDragSource = chip.parentElement;

    // Create a floating clone
    touchClone = chip.cloneNode(true);
    touchClone.className = "chip touch-dragging";
    const rect = chip.getBoundingClientRect();
    touchClone.style.width  = rect.width + "px";
    touchClone.style.left   = (touch.clientX - rect.width / 2) + "px";
    touchClone.style.top    = (touch.clientY - rect.height / 2) + "px";
    document.body.appendChild(touchClone);

    chip.style.opacity = "0.3";
    e.preventDefault();
}

function handleTouchMove(e) {
    if (!touchClone) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect  = touchClone.getBoundingClientRect();
    touchClone.style.left = (touch.clientX - rect.width / 2) + "px";
    touchClone.style.top  = (touch.clientY - rect.height / 2) + "px";

    // Highlight the drop target under the finger
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const zone = el ? (el.closest(".dropzone") || (el.closest("#bank") ? document.getElementById("bank") : null)) : null;

    // Clear previous highlights
    document.querySelectorAll(".dropzone.over, #bank.over").forEach(z => z.classList.remove("over"));
    if (zone) zone.classList.add("over");
    touchTarget = zone;
}

function handleTouchEnd(e) {
    if (!touchClone) return;
    e.preventDefault();

    // Clean up clone
    touchClone.remove();
    touchClone = null;
    touchDragChip.style.opacity = "";

    // Clear highlights
    document.querySelectorAll(".dropzone.over, #bank.over").forEach(z => z.classList.remove("over"));

    if (touchTarget && touchDragChip) {
        const el     = touchTarget;
        const isZone = el.classList.contains("dropzone");
        const inner  = isZone ? el.querySelector(".dropzone-inner") : null;
        const existing = isZone ? inner.querySelector(".chip") : null;

        if (existing && existing !== touchDragChip) {
            (touchDragSource.querySelector(".dropzone-inner") || touchDragSource).appendChild(existing);
        }
        (isZone ? inner : el).appendChild(touchDragChip);
    }

    touchDragChip   = null;
    touchDragSource = null;
    touchTarget     = null;
    updateEmptyHints();
}

function addDropTarget(el) {
    el.addEventListener("dragover", e => { e.preventDefault(); el.classList.add("over"); });
    el.addEventListener("dragleave", () => el.classList.remove("over"));
    el.addEventListener("drop", e => {
        e.preventDefault();
        el.classList.remove("over");
        if (!draggedChip) return;
        const isZone   = el.classList.contains("dropzone");
        const inner    = isZone ? el.querySelector(".dropzone-inner") : null;
        const existing = isZone ? inner.querySelector(".chip") : null;
        if (existing && existing !== draggedChip) {
            (dragSource.querySelector?.(".dropzone-inner") || dragSource).appendChild(existing);
        }
        (isZone ? inner : el).appendChild(draggedChip);
        draggedChip = null;
        dragSource  = null;
        updateEmptyHints();
    });
    el.addEventListener("click", () => {
        if (checked || !selectedChip) return;
        const isZone   = el.classList.contains("dropzone");
        const inner    = isZone ? el.querySelector(".dropzone-inner") : null;
        const existing = isZone ? inner?.querySelector(".chip") : null;
        if (existing && existing !== selectedChip) {
            document.getElementById("bank").appendChild(existing);
        }
        (isZone ? inner : el).appendChild(selectedChip);
        selectedChip.classList.remove("selected");
        selectedChip = null;
        updateEmptyHints();
    });
}

function updateEmptyHints() {
    document.querySelectorAll(".dropzone").forEach(zone => {
        zone.classList.toggle("empty-hint", !zone.querySelector(".dropzone-inner .chip"));
    });
}

function checkMatchAnswers() {
    if (checked) return;
    checked = true;
    let correct = 0;
    const wrongWords = [];

    document.querySelectorAll(".dropzone[data-real-index]").forEach(zone => {
        const i       = parseInt(zone.dataset.realIndex);
        const inner   = zone.querySelector(".dropzone-inner");
        const chip    = inner?.querySelector(".chip");
        const answer  = round[i].greek;
        const display = lang === "greek" ? round[i].greek : round[i].english;
        const isRight = chip?.dataset.greek === answer;
        inner.querySelectorAll(".answer-hint").forEach(h => h.remove());
        if (isRight) {
            zone.classList.add("correct");
            correct++;
        } else {
            zone.classList.add("wrong");
            wrongWords.push(answer);
            const hint = document.createElement("span");
            hint.className = "answer-hint";
            hint.textContent = "\u2713 " + display;
            inner.appendChild(hint);
        }
    });

    document.querySelectorAll(".dropzone[data-decoy]").forEach(zone => {
        const inner = zone.querySelector(".dropzone-inner");
        const chip  = inner?.querySelector(".chip");
        if (chip) zone.classList.add("wrong");
    });

    updateWeights(wrongWords);
    showScoreBanner(correct, 6);
    document.getElementById("btn-check").style.display = "none";
    document.getElementById("btn-retry").style.display = "";
    document.getElementById("btn-new").style.display   = "";
}

// ── Shared ───────────────────────────────────────────────────────────────────

function showScoreBanner(correct, total) {
    const banner = document.getElementById("score-banner");
    banner.style.display = "";
    if (correct === total) {
        banner.className = "perfect";
        banner.textContent = "Perfect! " + correct + " / " + total;
    } else {
        banner.className = "partial";
        banner.textContent = correct + " / " + total + " correct";
    }
}

function updateWeights(wrongGreekWords) {
    const wrongSet    = new Set(wrongGreekWords);
    const correctKeys = round.map(w => w.greek).filter(g => !wrongSet.has(g));
    const weights     = JSON.parse(localStorage.getItem("greek_weights") || "{}");
    const streaks     = JSON.parse(localStorage.getItem("greek_streaks") || "{}");

    const mastered    = JSON.parse(localStorage.getItem("greek_mastered") || "[]");
    const masteredSet = new Set(mastered);

    wrongGreekWords.forEach(g => {
        weights[g] = Math.min(5, (weights[g] || 1) + 1);
        streaks[g] = 0;
    });
    correctKeys.forEach(g => {
        streaks[g] = (streaks[g] || 0) + 1;
        const w = weights[g] || 1;
        if (w > 1 && streaks[g] >= 3) {
            weights[g] = w - 1;
            streaks[g] = 0;
        } else if (w === 1 && streaks[g] >= 5) {
            masteredSet.add(g);
            delete weights[g];
            delete streaks[g];
        }
    });

    localStorage.setItem("greek_weights",  JSON.stringify(weights));
    localStorage.setItem("greek_streaks",  JSON.stringify(streaks));
    localStorage.setItem("greek_mastered", JSON.stringify([...masteredSet]));

    const seen = JSON.parse(localStorage.getItem("greek_seen") || "[]");
    localStorage.setItem("greek_seen", JSON.stringify([round.map(w => w.greek), ...seen].slice(0, 30)));

    const exposure = JSON.parse(localStorage.getItem("greek_exposure") || "{}");
    round.forEach(w => { exposure[w.greek] = (exposure[w.greek] || 0) + 1; });
    localStorage.setItem("greek_exposure", JSON.stringify(exposure));
}

function renderManual() {
    const topic = window.GRAMMAR.byId(group);
    document.getElementById("manual-container").innerHTML = topic.manual;
}

function applyMode() {
    const isMatchLike = (mode === "match");
    document.getElementById("match-container").style.display  = isMatchLike ? "" : "none";
    document.getElementById("typing-container").style.display = mode === "type" ? "" : "none";
    // The three practice containers are shown one at a time by showPracticeItem
    for (const id of ["fill-container", "conj-container", "dates-container"]) {
        document.getElementById(id).style.display = "none";
    }
    document.getElementById("manual-container").style.display = mode === "manual" ? "" : "none";
    if (mode === "manual") renderManual();
    document.getElementById("reading-container").style.display = mode === "read" ? "" : "none";
    if (mode === "read") window.ReadingMode.show(group);
    document.getElementById("browse-container").style.display = mode === "browse" ? "" : "none";
    document.getElementById("browse-search").style.display    = mode === "browse" ? "" : "none";
    document.querySelector(".actions").style.display =
        (["browse", "manual", "read"].includes(mode)) ? "none" : "";
    document.getElementById("btn-practise").style.display = mode === "manual" ? "" : "none";

    renderTabs();
    // The toggle only means something where a question can be asked either way
    document.querySelector(".lang-toggle").style.display =
        (["match", "type"].includes(mode)) ? "" : "none";
    document.getElementById("group-select").disabled = false;
    updateSubtitle();
    if (mode === "type") buildTyping();
    else if (isPractice(mode)) buildPractice();
    else if (mode === "browse") BrowseMode.show();
    else if (mode === "manual" || mode === "read") { /* nothing to build */ }
    else buildMatch();
}

function switchMode(target) {
    if (target === mode) return;
    const prev = mode;
    mode = target;
    section = sectionOf(mode);
    rememberMode();
    if (mode === "read") window.ReadingMode.load().then(refreshReading);
    // Rebuild dropdown — Fill uses sentence topics, others use word groups
    populateGroupSelect();
    group = resolveGroup();
    document.getElementById("group-select").value = group;
    // Re-pick whenever the shape of the data changed under us
    if (isPractice(mode) || isPractice(prev)) round = selectRound();
    applyMode();
}

// Keep both the URL and localStorage on the current mode, so a refresh, a
// reopened tab and a shared link all land in the same place.
function rememberMode() {
    try { localStorage.setItem("greek_mode", mode); } catch (e) { /* private mode */ }
    if (typeof history === "undefined" || !history.replaceState) return;
    try {
        const url = new URL(location.href);
        url.searchParams.set("mode", mode);
        history.replaceState(null, "", url.toString());
    } catch (e) { /* file:// and friends */ }
}

function switchGroup(target) {
    if (target === group) return;
    group = target;
    try { localStorage.setItem(topicKeyFor(mode), group); } catch (e) { /* private mode */ }
    // A topic may not offer the format you are on; Mixed always works.
    if (isPractice(mode) && !window.PRACTICE.formatsFor(group).includes(mode)) {
        mode = "mixed";
        rememberMode();
    }
    round = selectRound();
    applyMode();
}

// ── Typing (recall) game ────────────────────────────────────────────────────

let typingIndex = 0;
let typingScore = 0;
let typingWrong = [];

function buildTyping() {
    typingIndex = 0;
    typingScore = 0;
    typingWrong = [];
    checked    = false;
    document.getElementById("score-banner").style.display = "none";
    document.getElementById("btn-check").style.display    = "none";
    document.getElementById("btn-retry").style.display    = "none";
    document.getElementById("btn-new").style.display      = "none";
    document.getElementById("typing-history").innerHTML   = "";
    showTypingQuestion();
}

function showTypingQuestion() {
    const item  = round[typingIndex];
    const input = document.getElementById("typing-input");
    const feedback = document.getElementById("typing-feedback");
    document.getElementById("typing-progress").textContent = (typingIndex + 1) + " / 6";
    document.getElementById("typing-word").textContent     = lang === "greek" ? item.english : item.greek;
    input.value       = "";
    input.disabled    = false;
    input.lang        = lang === "greek" ? "el" : "en";
    input.placeholder = lang === "greek" ? "\u03b3\u03c1\u03ac\u03c8\u03b5 \u03c3\u03c4\u03b1 \u03b5\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac\u2026" : "type in English\u2026";
    feedback.textContent = "";
    feedback.className   = "";
    input.focus();
}

function stripAccents(s) {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC");
}

function normalizeAnswer(s, isGreek) {
    s = (s || "").toLowerCase().trim();
    s = s.replace(/\([^)]*\)/g, " ").trim();
    if (isGreek) s = s.replace(/^(ο|η|το|οι|τα|τον|την|τους|τις|του|της|των)\s+/, "");
    return s.replace(/\s+/g, " ").trim();
}

function answerVariants(raw, isGreek) {
    return raw.split(/\s*[\/\u2192]\s*/).map(s => normalizeAnswer(s, isGreek)).filter(Boolean);
}

function checkTypedAnswer(typed, correctRaw, isGreek) {
    const t = normalizeAnswer(typed, isGreek);
    const variants = answerVariants(correctRaw, isGreek);
    if (isGreek) {
        const tNoAcc = stripAccents(t);
        return variants.map(stripAccents).includes(tNoAcc) ? "correct" : "wrong";
    }
    return variants.includes(t) ? "correct" : "wrong";
}

function submitTypingAnswer(e) {
    if (e) e.preventDefault();
    const item  = round[typingIndex];
    const input = document.getElementById("typing-input");
    const submit = document.getElementById("typing-submit");
    if (input.disabled) {
        // Second press: advance
        advanceTyping();
        return;
    }
    const isGreekAnswer = lang === "greek";
    const correctRaw    = isGreekAnswer ? item.greek : item.english;
    const result        = checkTypedAnswer(input.value, correctRaw, isGreekAnswer);
    const feedback      = document.getElementById("typing-feedback");
    input.disabled      = true;

    const typedValue = input.value.trim();
    if (result === "correct") {
        feedback.textContent = "\u2713 " + correctRaw;
        feedback.className   = "correct";
        typingScore++;
        appendTypingHistory(result, correctRaw, typedValue);
        setTimeout(advanceTyping, 900);
    } else {
        feedback.textContent = "\u2717 " + correctRaw;
        feedback.className   = "wrong";
        typingWrong.push(item.greek);
        appendTypingHistory(result, correctRaw, typedValue);
        submit.textContent = "Next";
    }
}

function appendTypingHistory(result, correctRaw, typed) {
    const li = document.createElement("li");
    li.className = "typing-history-" + result;
    const symbol = result === "correct" ? "\u2713" : "\u2717";
    const mark   = document.createElement("span");
    mark.className = "mark";
    mark.textContent = symbol;
    const word   = document.createElement("span");
    word.className = "word";
    word.textContent = correctRaw;
    li.appendChild(mark);
    li.appendChild(word);
    if (result !== "correct" && typed) {
        const typedSpan = document.createElement("span");
        typedSpan.className = "typed";
        typedSpan.textContent = "\u2190 " + typed;
        li.appendChild(typedSpan);
    }
    document.getElementById("typing-history").appendChild(li);
}

function advanceTyping() {
    document.getElementById("typing-submit").textContent = "Check";
    typingIndex++;
    if (typingIndex < 6) showTypingQuestion();
    else finishTyping();
}

function finishTyping() {
    updateWeights(typingWrong);
    showScoreBanner(typingScore, 6);
    document.getElementById("btn-retry").style.display = "";
    document.getElementById("btn-new").style.display   = "";
    document.getElementById("typing-input").disabled   = true;
}

// ── Fill (sentence-blank) game ──────────────────────────────────────────────

let fillIndex   = 0;
let fillScore   = 0;
let fillTotal   = 0;
let fillChecked = false;
let fillState   = []; // per-blank: { selected: string|null }

function showFillQuestion() {
    const item = round[fillIndex];
    fillChecked = false;
    fillState   = item.blanks.map(() => ({ selected: null }));

    document.getElementById("fill-progress").textContent = (fillIndex + 1) + " / " + round.length;
    document.getElementById("fill-topic").textContent    = item.topic || "";
    document.getElementById("fill-prompt").textContent   = item.en;

    renderFillSentence();
    renderFillBlanks();
    document.getElementById("btn-check").textContent = "Check";
    document.getElementById("btn-check").style.display = "";
}

function renderFillSentence() {
    const item    = round[fillIndex];
    const sentEl  = document.getElementById("fill-sentence");
    sentEl.innerHTML = "";

    // Split template on placeholders {0}, {1}, ... and render slots inline
    const parts = item.template.split(/(\{\d+\})/);
    parts.forEach(part => {
        const m = part.match(/^\{(\d+)\}$/);
        if (m) {
            const idx = parseInt(m[1], 10);
            const slot = document.createElement("span");
            slot.className = "fill-slot";
            slot.dataset.idx = idx;
            const sel = fillState[idx] && fillState[idx].selected;
            const correctVal = item.blanks[idx].answer;
            if (sel) {
                slot.textContent = sel;
                slot.classList.add("filled");
                if (fillChecked) {
                    slot.classList.add(sel === correctVal ? "correct" : "wrong");
                    if (sel !== correctVal) {
                        const fix = document.createElement("span");
                        fix.className = "fill-fix";
                        fix.textContent = correctVal;
                        slot.appendChild(fix);
                    }
                }
            } else if (fillChecked) {
                // Empty slot after check: show correct answer in green, no strikethrough placeholder
                slot.textContent = correctVal;
                slot.classList.add("missed");
            } else {
                slot.textContent = "___";
            }
            sentEl.appendChild(slot);
        } else if (part) {
            sentEl.appendChild(document.createTextNode(part));
        }
    });
}

function renderFillBlanks() {
    const item     = round[fillIndex];
    const wrap     = document.getElementById("fill-blanks");
    wrap.innerHTML = "";

    item.blanks.forEach((b, idx) => {
        const group = document.createElement("div");
        group.className = "fill-blank-group";

        const hint = document.createElement("div");
        hint.className = "fill-hint";
        hint.textContent = "▸ " + b.hint;
        group.appendChild(hint);

        const opts = document.createElement("div");
        opts.className = "fill-options";
        b.options.forEach(opt => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "fill-opt";
            btn.textContent = opt;
            if (fillState[idx].selected === opt) btn.classList.add("selected");
            if (fillChecked) {
                btn.disabled = true;
                if (opt === b.answer) btn.classList.add("correct");
                else if (opt === fillState[idx].selected) btn.classList.add("wrong");
            } else {
                btn.addEventListener("click", () => {
                    // No toggle-off: clicking the same option is a no-op.
                    // To change choice, click a different option.
                    if (fillState[idx].selected === opt) return;
                    fillState[idx].selected = opt;
                    renderFillSentence();
                    renderFillBlanks();
                });
            }
            opts.appendChild(btn);
        });
        group.appendChild(opts);
        wrap.appendChild(group);
    });
}

function checkFillAnswers() {
    if (fillChecked) { advanceFill(); return; }
    const item = round[fillIndex];
    let correct = 0;
    item.blanks.forEach((b, idx) => {
        if (fillState[idx].selected === b.answer) correct++;
    });
    fillScore += correct;
    fillTotal += item.blanks.length;
    fillChecked = true;
    renderFillSentence();
    renderFillBlanks();
    document.getElementById("btn-check").textContent =
        fillIndex < round.length - 1 ? "Next" : "Finish";
}

function advanceFill() {
    fillIndex++;
    if (fillIndex < round.length) {
        showFillQuestion();
    } else {
        finishFill();
    }
}

function finishFill() {
    if (isPractice(mode)) {
        practiceScore += fillScore;
        practiceTotal += fillTotal;
        advancePractice();
        return;
    }
    showScoreBanner(fillScore, fillTotal);
    document.getElementById("btn-check").style.display = "none";
    document.getElementById("btn-retry").style.display = "";
    document.getElementById("btn-new").style.display   = "";
}

// Wire Check/Retry buttons for Fill mode too
function dispatchCheck() {
    const item = currentItem();
    if (isPractice(mode) && item && item.kind === "fill") checkFillAnswers();
    else checkMatchAnswers();
}
function dispatchRetry() {
    if (mode === "type") buildTyping();
    else if (isPractice(mode)) buildPractice();
    else buildMatch();
}

// ── Conjugation Drill mode ──────────────────────────────────────────────────

let conjRound   = [];   // array of {lemma, english, tense, person, answer}
let conjIndex   = 0;
let conjScore   = 0;
let conjWrong   = 0;

const TENSE_LABELS = {
    present:   "present",
    imperfect: "imperfect (was V-ing / used to V)",
    aorist:    "aorist (past, one-time)",
    future:    "future (θα V)"
};
const PERSON_LABELS = ["1sg (I)", "2sg (you)", "3sg (he/she/it)", "1pl (we)", "2pl (you all)", "3pl (they)"];

function showConjQuestion() {
    const q = conjRound[conjIndex];
    const input = document.getElementById("conj-input");
    document.getElementById("conj-progress").textContent = (conjIndex + 1) + " / " + conjRound.length;
    document.getElementById("conj-prompt").innerHTML =
        `<span class="verb">${q.lemma} <span class="verb-en">(${q.english})</span></span>` +
        `<span class="target">${TENSE_LABELS[q.tense]} — ${PERSON_LABELS[q.person]}</span>`;
    input.value = "";
    input.disabled = false;
    input.lang = "el";
    input.placeholder = "γράψε τη μορφή…";
    const fb = document.getElementById("conj-feedback");
    fb.textContent = ""; fb.className = "";
    document.getElementById("conj-submit").textContent = "Check";
    input.focus();
}

function submitConjAnswer(e) {
    if (e) e.preventDefault();
    const q = conjRound[conjIndex];
    const input = document.getElementById("conj-input");
    const submit = document.getElementById("conj-submit");
    if (input.disabled) { advanceConj(); return; }
    const typed = (input.value || "").trim();
    const result = checkTypedAnswer(typed, q.answer, true);
    const fb = document.getElementById("conj-feedback");
    input.disabled = true;
    if (result === "correct") {
        fb.textContent = "✓ " + q.answer;
        fb.className = "correct";
        conjScore++;
        appendConjHistory("correct", q, typed);
        setTimeout(advanceConj, 900);
    } else {
        fb.textContent = "✗ " + q.answer;
        fb.className = "wrong";
        conjWrong++;
        appendConjHistory("wrong", q, typed);
        submit.textContent = "Next";
    }
}

function appendConjHistory(result, q, typed) {
    const li = document.createElement("li");
    li.className = "typing-history-" + result;
    const mark = document.createElement("span");
    mark.className = "mark"; mark.textContent = result === "correct" ? "✓" : "✗";
    const word = document.createElement("span");
    word.className = "word"; word.textContent = `${q.answer}  (${q.lemma}, ${q.tense} ${PERSON_LABELS[q.person].split(' ')[0]})`;
    li.appendChild(mark); li.appendChild(word);
    if (result !== "correct" && typed) {
        const t = document.createElement("span");
        t.className = "typed"; t.textContent = "← " + typed;
        li.appendChild(t);
    }
    document.getElementById("conj-history").appendChild(li);
}

function advanceConj() {
    document.getElementById("conj-submit").textContent = "Check";
    conjIndex++;
    if (conjIndex < conjRound.length) showConjQuestion();
    else finishConj();
}

function finishConj() {
    if (isPractice(mode)) {
        practiceScore += conjScore;
        practiceTotal += 1;
        advancePractice();
        return;
    }
    showScoreBanner(conjScore, conjRound.length);
    document.getElementById("btn-retry").style.display = "";
    document.getElementById("btn-new").style.display   = "";
    document.getElementById("conj-input").disabled     = true;
}

// ── Practice: one topic, one answer format, ten questions ───────────────────
// The round can hold three kinds of item and each has its own renderer below;
// this layer owns the cursor and the score so a mixed round counts as one.

let practiceRound = [], practiceIndex = 0, practiceScore = 0, practiceTotal = 0;

function currentItem() { return practiceRound[practiceIndex] || null; }

function buildPractice() {
    clearTimeout(datesTimer);
    clearDatesContinue();
    practiceRound = window.PRACTICE.buildRound(group === "__all__" ? null : group, mode, 10);
    practiceIndex = 0;
    practiceScore = 0;
    practiceTotal = 0;
    checked = false;
    document.getElementById("score-banner").style.display = "none";
    for (const id of ["btn-check", "btn-retry", "btn-new"]) {
        document.getElementById(id).style.display = "none";
    }
    if (!practiceRound.length) {
        showPracticeContainer("choose");
        document.getElementById("dates-progress").textContent = "";
        document.getElementById("dates-topic").textContent    = "";
        document.getElementById("dates-sub").textContent      = "";
        document.getElementById("dates-prompt-text").textContent =
            "No exercises for this topic yet \u2014 read it in Grammar.";
        document.getElementById("dates-gloss").textContent  = "";
        document.getElementById("dates-options").innerHTML  = "";
        return;
    }
    showPracticeItem();
}

function showPracticeContainer(kind) {
    const map = { fill: "fill-container", write: "conj-container", choose: "dates-container" };
    for (const [k, id] of Object.entries(map)) {
        document.getElementById(id).style.display = (k === kind) ? "" : "none";
    }
}

function practiceProgress() { return (practiceIndex + 1) + " / " + practiceRound.length; }

function showPracticeItem() {
    const item = currentItem();
    // A Continue button left in a container we are about to hide would still
    // answer to Enter, so the previous question is torn down first.
    clearDatesContinue();
    clearTimeout(datesTimer);
    if (item.kind !== "choose") document.getElementById("dates-options").innerHTML = "";
    showPracticeContainer(item.kind);
    document.getElementById("btn-check").style.display = item.kind === "fill" ? "" : "none";

    if (item.kind === "fill") {
        round = [item]; fillIndex = 0; fillScore = 0; fillTotal = 0;
        showFillQuestion();
        document.getElementById("fill-progress").textContent = practiceProgress();
    } else if (item.kind === "write") {
        conjRound = [item]; conjIndex = 0; conjScore = 0; conjWrong = 0;
        showConjQuestion();
        document.getElementById("conj-progress").textContent = practiceProgress();
    } else {
        datesRound = [item]; datesIndex = 0; datesScore = 0;
        showDatesQuestion();
        document.getElementById("dates-progress").textContent = practiceProgress();
    }
}

function advancePractice() {
    practiceIndex++;
    if (practiceIndex < practiceRound.length) showPracticeItem();
    else finishPractice();
}

function finishPractice() {
    showScoreBanner(practiceScore, practiceTotal);
    document.getElementById("btn-check").style.display = "none";
    document.getElementById("btn-retry").style.display = "";
    document.getElementById("btn-new").style.display   = "";
}

// ── Dates / time drill ──────────────────────────────────────────────────────
// Questions are generated in js/datetime.js — nothing here comes from words.json.

let datesRound = [];
let datesIndex = 0;
let datesScore = 0;
let datesTimer = null;

function showDatesQuestion() {
    const q = datesRound[datesIndex];
    document.getElementById("dates-progress").textContent = (datesIndex + 1) + " / " + datesRound.length;
    document.getElementById("dates-topic").textContent    = q.topic;
    document.getElementById("dates-sub").textContent      = q.sub;
    document.getElementById("dates-prompt-text").textContent = q.prompt;
    document.getElementById("dates-gloss").textContent       = q.gloss || "";

    const box = document.getElementById("dates-options");
    box.innerHTML = "";
    // Long options (spelled-out Greek) need the full width to stay readable
    box.classList.toggle("wide", q.options.some(o => o.length > 18));
    q.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className   = "quiz-opt";
        btn.textContent = opt;
        btn.addEventListener("click", () => answerDates(btn, opt));
        box.appendChild(btn);
    });
}

function answerDates(btn, chosen) {
    const q = datesRound[datesIndex];
    const buttons = [...document.querySelectorAll("#dates-options .quiz-opt")];
    buttons.forEach(b => {
        b.disabled = true;
        if (b.textContent === q.answer) b.classList.add("correct");
    });
    if (chosen === q.answer) {
        datesScore++;
        datesTimer = setTimeout(advanceDates, 700);
        return;
    }
    btn.classList.add("wrong");
    // A mistake never auto-advances: the answer stays on screen until you move on
    waitForDatesContinue();
}

// Holds the teardown for the "Continue" state, so a new round can cancel it
let datesContinue = null;

function waitForDatesContinue() {
    clearDatesContinue();
    const next = document.createElement("button");
    next.className   = "quiz-next";
    next.textContent = "Continue \u2192";
    document.getElementById("dates-options").appendChild(next);

    let used = false;
    const goOn = () => {
        if (used) return;
        used = true;
        clearDatesContinue();
        advanceDates();
    };
    const onKey = e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goOn(); }
    };
    next.addEventListener("click", goOn);
    document.addEventListener("keydown", onKey);
    datesContinue = () => document.removeEventListener("keydown", onKey);
    next.focus();
}

function clearDatesContinue() {
    if (datesContinue) { datesContinue(); datesContinue = null; }
}

function advanceDates() {
    datesIndex++;
    if (datesIndex < datesRound.length) showDatesQuestion();
    else finishDates();
}

function finishDates() {
    if (isPractice(mode)) {
        practiceScore += datesScore;
        practiceTotal += 1;
        advancePractice();
        return;
    }
    showScoreBanner(datesScore, datesRound.length);
    document.getElementById("btn-retry").style.display = "";
    document.getElementById("btn-new").style.display   = "";
}

// ── Boot ─────────────────────────────────────────────────────────────────────
Promise.all([
    fetch('./words.json').then(r => r.json()),
    fetch('./sentences.json').then(r => r.json()).catch(() => [])
])
    .then(([words, sentences]) => {
        allSentences = sentences;
        initApp(words);
    })
    .catch(err => {
        document.body.innerHTML = '<h1>Failed to load words</h1><p>' + err.message + '</p>';
    });
