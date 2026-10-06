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

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    // Resolve URL params / localStorage for mode and lang
    const urlParams = new URLSearchParams(location.search);
    const urlMode   = urlParams.get("mode");
    const urlLang   = urlParams.get("lang") || localStorage.getItem("greek_lang");
    if (["match", "type", "browse", "fill", "conj", "dates", "manual", "drill"].includes(urlMode)) mode = urlMode;
    if (urlLang === "english") lang = "english";

    // Build the group dropdown from the data
    populateGroupSelect();
    group = localStorage.getItem("greek_group") || "__all__";
    if (!groupExists(group)) group = mode === "manual" ? window.GRAMMAR.TOPICS[0].id : "__all__";
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
    window.GRAMMAR.load().then(() => { if (section === "grammar") { populateGroupSelect(); applyMode(); } });
}

const MARKED = "__marked__";

const SECTIONS = {
    words:    [["match", "Match"], ["type", "Type"], ["browse", "Browse"]],
    practice: [["fill", "Fill"], ["conj", "Conjugate"], ["dates", "Dates"]],
    grammar:  [["manual", "Manual"], ["drill", "Drill"]]
};

function sectionOf(m) {
    return Object.keys(SECTIONS).find(s => SECTIONS[s].some(([id]) => id === m)) || "words";
}

function renderTabs() {
    const bar = document.getElementById("tabs");
    bar.innerHTML = "";
    for (const [id, label] of SECTIONS[section]) {
        const b = document.createElement("button");
        b.className = "tab" + (id === mode ? " active" : "");
        b.textContent = label;
        b.addEventListener("click", () => switchMode(id));
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

function populateGroupSelect() {
    const select = document.getElementById("group-select");
    select.innerHTML = "";
    if (mode === "manual") {
        for (const t of window.GRAMMAR.TOPICS) {
            const opt = document.createElement("option");
            opt.value = t.id;
            opt.textContent = t.title;
            select.appendChild(opt);
        }
        return;
    }
    const allOpt = document.createElement("option");
    allOpt.value = "__all__";
    allOpt.textContent = (mode === "fill" || quizSource()) ? "All topics" : "All groups";
    select.appendChild(allOpt);

    if (!quizSource() && mode !== "fill" && allWords.some(w => w.marked)) {
        const marked = document.createElement("option");
        marked.value = MARKED;
        marked.textContent = "\u2605 Marked";
        select.appendChild(marked);
    }

    if (mode === "drill") {
        // grouped by grammar topic, so a second topic just adds its own group
        let current = null, parent = select;
        for (const d of window.GRAMMAR.drills()) {
            if (d.topicId !== current) {
                current = d.topicId;
                parent = document.createElement("optgroup");
                parent.label = d.topicTitle;
                select.appendChild(parent);
            }
            const opt = document.createElement("option");
            opt.value = d.topicId + "::" + d.sub;
            opt.textContent = d.sub;
            parent.appendChild(opt);
        }
        return;
    }

    const items = quizSource()
        ? quizSource().TOPICS
        : mode === "fill"
            ? [...new Set(allSentences.map(s => s.topic).filter(Boolean))].sort()
            : [...new Set(allWords.map(w => w.group).filter(Boolean))].sort();
    for (const g of items) {
        const opt = document.createElement("option");
        opt.value = g;
        opt.textContent = g;
        select.appendChild(opt);
    }
}

// Dates and Compare are the same kind of drill over different generators.
function quizSource() {
    if (mode === "dates")   return window.DATETIME || null;
    if (mode === "drill")   return window.GRAMMAR || null;
    return null;
}

function groupExists(g) {
    if (g === "__all__") return true;
    if (g === MARKED) return !quizSource() && mode !== "fill" && allWords.some(w => w.marked);
    if (mode === "manual") return window.GRAMMAR.TOPICS.some(t => t.id === g);
    if (mode === "drill")  return !!window.GRAMMAR.resolve(g);
    if (quizSource()) return quizSource().TOPICS.includes(g);
    if (mode === "fill") return allSentences.some(s => s.topic === g);
    return allWords.some(w => w.group === g);
}

// ── Data ─────────────────────────────────────────────────────────────────────

function modePool() {
    if (mode === "fill") {
        return group === "__all__" ? allSentences : allSentences.filter(s => s.topic === group);
    }
    if (group === MARKED) return allWords.filter(w => w.marked);
    if (group === "__all__") return allWords;
    return allWords.filter(w => w.group === group);
}

function selectRound() {
    if (quizSource() || mode === "manual") return [];
    if (mode === "fill") {
        const pool = modePool().slice();
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool.slice(0, Math.min(10, pool.length));
    }
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
    else if (mode === "fill") buildFill();
    else if (mode === "conj") buildConj();
    else if (mode === "dates") buildDates();
    else buildMatch();
}

function updateSubtitle() {
    const subtitles = {
        match:  { greek: "Tap or drag the Greek word to its English meaning",        english: "Tap or drag the English word to its Greek meaning" },
        type:   { greek: "Type the Greek translation",                               english: "Type the English translation" },
        fill:   { greek: "Fill the blanks with the correct form",                    english: "Fill the blanks with the correct form" },
        conj:   { greek: "Type the verb in the requested tense and person",           english: "Type the verb in the requested tense and person" },
        dates:  { greek: "Say the clock, date, age or duration in Greek",            english: "Read the clock, date, age or duration" },
        browse: { greek: "Look a word up \u2014 verbs show how they change",           english: "Look a word up \u2014 verbs show how they change" },
        manual: { greek: "\u03a0\u03b1\u03c1\u03b1\u03b8\u03b5\u03c4\u03b9\u03ba\u03ac \u2014 how Greek compares things",            english: "\u03a0\u03b1\u03c1\u03b1\u03b8\u03b5\u03c4\u03b9\u03ba\u03ac \u2014 how Greek compares things" },
        drill:  { greek: "Practise the grammar topic",                               english: "Practise the grammar topic" }
    };
    document.getElementById("subtitle").textContent = subtitles[mode][lang];
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
    document.getElementById("fill-container").style.display   = mode === "fill" ? "" : "none";
    document.getElementById("conj-container").style.display   = mode === "conj" ? "" : "none";
    document.getElementById("dates-container").style.display  = quizSource() ? "" : "none";
    document.getElementById("manual-container").style.display = mode === "manual" ? "" : "none";
    if (mode === "manual") renderManual();
    document.getElementById("browse-container").style.display = mode === "browse" ? "" : "none";
    document.getElementById("browse-search").style.display    = mode === "browse" ? "" : "none";
    document.querySelector(".actions").style.display =
        (mode === "browse" || mode === "manual") ? "none" : "";

    renderTabs();
    // Lang toggle has no role in Fill or Browse mode
    document.querySelector(".lang-toggle").style.display =
        (mode === "fill" || mode === "browse" || mode === "drill") ? "none" : "";
    // Conjugate drills its own verb list — the group filter has nothing to say there
    document.getElementById("group-select").disabled = (mode === "conj");
    updateSubtitle();
    if (mode === "type") buildTyping();
    else if (mode === "fill") buildFill();
    else if (mode === "conj") buildConj();
    else if (quizSource()) buildDates();
    else if (mode === "browse") BrowseMode.show();

    else buildMatch();
}

function switchMode(target) {
    if (target === mode) return;
    const prev = mode;
    mode = target;
    section = sectionOf(mode);
    // Rebuild dropdown — Fill uses sentence topics, others use word groups
    populateGroupSelect();
    if (mode === "fill") {
        group = localStorage.getItem("greek_topic") || "__all__";
    } else if (quizSource() || mode === "manual") {
        group = localStorage.getItem("greek_topic_" + mode) || "__all__";
    } else {
        group = localStorage.getItem("greek_group") || "__all__";
    }
    if (!groupExists(group)) group = mode === "manual" ? window.GRAMMAR.TOPICS[0].id : "__all__";
    document.getElementById("group-select").value = group;
    // Always re-pick the round when entering or leaving a mode with a different data shape
    if (mode === "fill" || prev === "fill" || quizSource() || ["dates", "drill"].includes(prev)) {
        round = selectRound();
    }
    applyMode();
}

function switchGroup(target) {
    if (target === group) return;
    group = target;
    if (mode === "fill") {
        localStorage.setItem("greek_topic", group);
    } else if (quizSource() || mode === "manual") {
        localStorage.setItem("greek_topic_" + mode, group);
    } else {
        localStorage.setItem("greek_group", group);
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

function buildFill() {
    fillIndex = 0;
    fillScore = 0;
    fillTotal = 0;
    document.getElementById("score-banner").style.display = "none";
    document.getElementById("btn-check").style.display    = "";
    document.getElementById("btn-retry").style.display    = "none";
    document.getElementById("btn-new").style.display      = "none";
    if (!round.length) {
        document.getElementById("fill-prompt").textContent   = "No sentences for this topic.";
        document.getElementById("fill-sentence").innerHTML   = "";
        document.getElementById("fill-blanks").innerHTML     = "";
        document.getElementById("btn-check").style.display   = "none";
        return;
    }
    showFillQuestion();
}

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
    showScoreBanner(fillScore, fillTotal);
    document.getElementById("btn-check").style.display = "none";
    document.getElementById("btn-retry").style.display = "";
    document.getElementById("btn-new").style.display   = "";
}

// Wire Check/Retry buttons for Fill mode too
function dispatchCheck() {
    if (mode === "fill") checkFillAnswers();
    else checkMatchAnswers();
}
function dispatchRetry() {
    if (mode === "type") buildTyping();
    else if (mode === "fill") { round = selectRound(); buildFill(); }
    else if (mode === "conj") buildConj();
    else if (mode === "dates") buildDates();
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

const CONJ_TENSES = ["present", "imperfect", "aorist", "future"];
const CONJ_QUEUE_KEY = "greek_conj_queue";

function shuffleArr(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Verbs are dealt from a shuffled queue that survives page reloads, so every
// verb comes up once before any verb comes up twice.
function takeFromConjQueue(verbs, size) {
    const byLemma = new Map(verbs.map(v => [v.lemma, v]));
    let queue = [];
    try { queue = JSON.parse(localStorage.getItem(CONJ_QUEUE_KEY) || "[]"); } catch (e) { queue = []; }
    queue = queue.filter(l => byLemma.has(l));

    const taken = [];
    while (taken.length < size) {
        if (!queue.length) {
            // Reshuffle the whole list, keeping the verbs just drilled to the back.
            const fresh = shuffleArr(verbs.map(v => v.lemma).filter(l => !taken.includes(l)));
            if (!fresh.length) break;
            queue = fresh;
        }
        taken.push(queue.shift());
    }
    try { localStorage.setItem(CONJ_QUEUE_KEY, JSON.stringify(queue)); } catch (e) { /* private mode */ }
    return taken.map(l => byLemma.get(l));
}

function buildConjRound() {
    const verbs = window.CONJUGATIONS || [];
    if (!verbs.length) return [];
    const size = Math.min(10, verbs.length);
    const order = takeFromConjQueue(verbs, size);

    // Deal tenses from a shuffled deck so every four questions cover all four
    // tenses, instead of a round coming out all-present by chance.
    let deck = [];
    const round = [];
    for (const v of order) {
        if (!deck.length) deck = shuffleArr(CONJ_TENSES);
        let ti = deck.findIndex(t => v[t]);
        if (ti === -1) { deck = shuffleArr(CONJ_TENSES); ti = deck.findIndex(t => v[t]); }
        if (ti === -1) continue;                       // verb has no usable tense
        const tense = deck.splice(ti, 1)[0];

        // present 1sg is skipped — it is identical to the lemma being shown
        const person = shuffleArr([0, 1, 2, 3, 4, 5])
            .find(p => v[tense][p] && !(tense === "present" && p === 0));
        if (person === undefined) continue;

        round.push({ lemma: v.lemma, english: v.english, tense, person, answer: v[tense][person] });
    }
    return shuffleArr(round);
}

function buildConj() {
    conjRound  = buildConjRound();
    conjIndex  = 0;
    conjScore  = 0;
    conjWrong  = 0;
    document.getElementById("score-banner").style.display = "none";
    document.getElementById("btn-check").style.display    = "none";
    document.getElementById("btn-retry").style.display    = "none";
    document.getElementById("btn-new").style.display      = "none";
    document.getElementById("conj-history").innerHTML     = "";
    if (!conjRound.length) {
        document.getElementById("conj-prompt").textContent = "No verbs loaded.";
        return;
    }
    showConjQuestion();
}

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
    showScoreBanner(conjScore, conjRound.length);
    document.getElementById("btn-retry").style.display = "";
    document.getElementById("btn-new").style.display   = "";
    document.getElementById("conj-input").disabled     = true;
}

// ── Dates / time drill ──────────────────────────────────────────────────────
// Questions are generated in js/datetime.js — nothing here comes from words.json.

let datesRound = [];
let datesIndex = 0;
let datesScore = 0;
let datesTimer = null;

function buildDates() {
    // Drop any answer-reveal timer still pending from the round being replaced
    clearTimeout(datesTimer);
    const source = quizSource();
    datesRound = source
        ? source.buildRound(group === "__all__" ? null : group, 10,
                            lang === "english" ? "en" : "gr")
        : [];
    datesIndex = 0;
    datesScore = 0;
    checked    = false;
    document.getElementById("score-banner").style.display = "none";
    document.getElementById("btn-check").style.display    = "none";
    document.getElementById("btn-retry").style.display    = "none";
    document.getElementById("btn-new").style.display      = "none";
    if (!datesRound.length) {
        document.getElementById("dates-prompt").textContent = "No questions available.";
        document.getElementById("dates-options").innerHTML  = "";
        return;
    }
    showDatesQuestion();
}

function showDatesQuestion() {
    const q = datesRound[datesIndex];
    document.getElementById("dates-progress").textContent = (datesIndex + 1) + " / " + datesRound.length;
    document.getElementById("dates-topic").textContent    = q.topic;
    document.getElementById("dates-sub").textContent      = q.sub;
    document.getElementById("dates-prompt").textContent   = q.prompt;

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
    if (chosen === q.answer) datesScore++;
    else btn.classList.add("wrong");
    datesTimer = setTimeout(advanceDates, chosen === q.answer ? 700 : 1600);
}

function advanceDates() {
    datesIndex++;
    if (datesIndex < datesRound.length) showDatesQuestion();
    else finishDates();
}

function finishDates() {
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
