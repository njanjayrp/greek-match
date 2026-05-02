// Words loaded from words.json
let allWords = [];

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
    if (["quiz", "xmatch", "type"].includes(urlMode)) mode = urlMode;
    if (urlLang === "english") lang = "english";

    round = selectRound();

    // Event listeners
    document.getElementById("btn-check").addEventListener("click", checkMatchAnswers);
    document.getElementById("btn-retry").addEventListener("click", () => {
        if (mode === "quiz") buildQuiz();
        else if (mode === "type") buildTyping();
        else buildMatch();
    });
    document.getElementById("btn-new").addEventListener("click", () => {
        const url = new URL(location.href);
        url.searchParams.set("mode", mode);
        url.searchParams.set("lang", lang);
        location.href = url.toString();
    });
    document.getElementById("mode-select").addEventListener("change", e => switchMode(e.target.value));
    document.getElementById("typing-form").addEventListener("submit", submitTypingAnswer);
    document.getElementById("lang-gr").addEventListener("click", () => setLang("greek"));
    document.getElementById("lang-en").addEventListener("click", () => setLang("english"));

    if (lang === "english") {
        document.getElementById("lang-gr").classList.remove("active");
        document.getElementById("lang-en").classList.add("active");
    }
    document.getElementById("mode-select").value = mode;
    applyMode();
}

// ── Data ─────────────────────────────────────────────────────────────────────

function modePool() {
    return mode === "xmatch" ? allWords.filter(w => w.marked) : allWords;
}

function selectRound() {
    const weights  = JSON.parse(localStorage.getItem("greek_weights")  || "{}");
    const mastered = new Set(JSON.parse(localStorage.getItem("greek_mastered") || "[]"));
    const seen2    = JSON.parse(localStorage.getItem("greek_seen")     || "[]");
    const recent   = new Set(seen2.flat());

    const pool     = modePool();
    let active     = pool.filter(w => !mastered.has(w.greek));
    // If too few non-mastered words remain, recycle mastered words back in
    if (active.length < 6) active = pool.slice();
    const eligible = active.filter(w => !recent.has(w.greek));
    const fallback = active.filter(w =>  recent.has(w.greek));

    const allCount = allWords.length;
    const idxByGreek = new Map(allWords.map((w, i) => [w.greek, i]));
    function effectiveWeight(w) {
        const base = weights[w.greek] || 1;
        const fromEnd = allCount - 1 - (idxByGreek.get(w.greek) ?? 0);
        const bonus = fromEnd < 40 ? 1 + (1 - fromEnd / 40) * 1.5 : 1;
        return base * bonus;
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
    for (let i = 0; i < 4; i++) {
        const w = weightedPick(eligible, picked) || weightedPick(fallback, picked);
        if (w) { round.push(w); picked.add(w.greek); }
    }
    for (let i = 0; i < 2; i++) {
        const w = randomPick(eligible, picked) || randomPick(fallback, picked);
        if (w) { round.push(w); picked.add(w.greek); }
    }
    return round;
}

let mode    = "match";
let lang    = "greek";
let checked = false;
let round   = [];

function setLang(l) {
    lang = l;
    localStorage.setItem("greek_lang", l);
    document.getElementById("lang-gr").classList.toggle("active", l === "greek");
    document.getElementById("lang-en").classList.toggle("active", l === "english");
    updateSubtitle();
    if (mode === "quiz") buildQuiz();
    else if (mode === "type") buildTyping();
    else buildMatch();
}

function updateSubtitle() {
    const subtitles = {
        match:  { greek: "Tap or drag the Greek word to its English meaning",        english: "Tap or drag the English word to its Greek meaning" },
        quiz:   { greek: "Choose the correct Greek word",                            english: "Choose the correct English word" },
        type:   { greek: "Type the Greek translation",                               english: "Type the English translation" },
        xmatch: { greek: "Marked words only \u2014 drag the Greek to its English meaning", english: "Marked words only \u2014 drag the English to its Greek meaning" }
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

// ── Quiz game ────────────────────────────────────────────────────────────────

let quizIndex    = 0;
let quizScore    = 0;
let quizWrong    = [];
let quizTimer    = null;
let quizSeconds  = 10;
const QUIZ_TIME  = 15;

function buildQuiz() {
    quizIndex  = 0;
    quizScore  = 0;
    quizWrong  = [];
    checked    = false;
    document.getElementById("score-banner").style.display = "none";
    document.getElementById("btn-check").style.display    = "none";
    document.getElementById("btn-retry").style.display    = "none";
    document.getElementById("btn-new").style.display      = "none";
    showQuizQuestion();
}

function showQuizQuestion() {
    clearInterval(quizTimer);
    const item = round[quizIndex];

    document.getElementById("quiz-progress").textContent   = (quizIndex + 1) + " / 6";
    document.getElementById("quiz-word").textContent       = lang === "greek" ? item.english : item.greek;
    document.getElementById("quiz-timer-text").textContent = QUIZ_TIME;

    const answerKey  = lang === "greek" ? "greek" : "english";
    const correctOpt = item[answerKey];
    const distractors = allWords
        .filter(w => w.greek !== item.greek && !round.some(r => r.greek === w.greek))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w[answerKey]);
    const options = [correctOpt, ...distractors].sort(() => Math.random() - 0.5);

    const container = document.getElementById("quiz-options");
    container.innerHTML = "";
    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "quiz-opt";
        btn.textContent = opt;
        btn.addEventListener("click", () => answerQuiz(opt));
        container.appendChild(btn);
    });

    quizSeconds = QUIZ_TIME;
    const fill = document.getElementById("quiz-timer-fill");
    fill.style.background = "#4a6cf7";
    fill.style.width = "100%";

    quizTimer = setInterval(() => {
        quizSeconds -= 0.1;
        const pct = Math.max(0, (quizSeconds / QUIZ_TIME) * 100);
        fill.style.width = pct + "%";
        const secs = Math.ceil(quizSeconds);
        document.getElementById("quiz-timer-text").textContent = secs;
        if (quizSeconds <= 3) fill.style.background = "#ef4444";
        if (quizSeconds <= 0) answerQuiz(null);
    }, 100);
}

function answerQuiz(chosen) {
    clearInterval(quizTimer);
    const correctDisplay = lang === "greek" ? round[quizIndex].greek : round[quizIndex].english;
    const isRight = chosen === correctDisplay;

    document.querySelectorAll(".quiz-opt").forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correctDisplay) btn.classList.add("correct");
        else if (btn.textContent === chosen)    btn.classList.add("wrong");
    });

    if (!isRight) quizWrong.push(round[quizIndex].greek);
    else quizScore++;

    setTimeout(() => {
        quizIndex++;
        if (quizIndex < 6) showQuizQuestion();
        else finishQuiz();
    }, isRight ? 700 : 1300);
}

function finishQuiz() {
    updateWeights(quizWrong);
    showScoreBanner(quizScore, 6);
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
    localStorage.setItem("greek_seen", JSON.stringify([round.map(w => w.greek), ...seen].slice(0, 2)));
}

function applyMode() {
    const isMatchLike = (mode === "match" || mode === "xmatch");
    document.getElementById("match-container").style.display  = isMatchLike ? "" : "none";
    document.getElementById("quiz-container").style.display   = mode === "quiz" ? "" : "none";
    document.getElementById("typing-container").style.display = mode === "type" ? "" : "none";
    document.getElementById("mode-select").value = mode;
    updateSubtitle();
    if (mode === "quiz") buildQuiz();
    else if (mode === "type") buildTyping();
    else buildMatch();
}

function switchMode(target) {
    if (target === mode) return;
    clearInterval(quizTimer);
    const prev = mode;
    mode = target;
    if ((prev === "xmatch") !== (mode === "xmatch")) round = selectRound();
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

// ── Boot ─────────────────────────────────────────────────────────────────────
fetch('./words.json')
    .then(r => r.json())
    .then(initApp)
    .catch(err => {
        document.body.innerHTML = '<h1>Failed to load words</h1><p>' + err.message + '</p>';
    });
