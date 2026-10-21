// Reading: the texts from reading.json, Greek first. Each paragraph keeps its
// English behind a tap, so the first pass is a real read and the translation is
// there when a sentence will not come apart.

window.ReadingMode = (function () {

let texts   = [];
let loading = null;

function load() {
    if (texts.length) return Promise.resolve(texts);
    if (!loading) {
        loading = fetch("./reading.json")
            .then(r => r.json())
            .then(t => { texts = t; return texts; })
            .catch(() => { texts = []; return texts; });
    }
    return loading;
}

function TEXTS() { return texts; }

function byId(id) { return texts.find(t => t.id === id) || texts[0] || null; }

function paragraph(html_, cls) {
    const p = document.createElement("p");
    p.className = cls;
    p.innerHTML = html_;
    return p;
}

// One block of Greek, with its translation folded away underneath it.
function renderPart(part, box) {
    if (part.heading) {
        const h = document.createElement("h3");
        h.className = "read-heading";
        h.innerHTML = part.heading;
        box.appendChild(h);
        return;
    }
    const block = document.createElement("div");
    block.className = "read-block";
    for (const line of part.gr || []) block.appendChild(paragraph(line, "read-gr"));

    if (part.en && part.en.length) {
        const en = document.createElement("div");
        en.className = "read-en";
        en.hidden = false;          // the translation is there to be read, not hunted for
        for (const line of part.en) en.appendChild(paragraph(line, ""));

        const toggle = document.createElement("button");
        toggle.className = "read-toggle";
        toggle.type = "button";
        toggle.textContent = "Hide";
        toggle.setAttribute("aria-expanded", "true");
        toggle.addEventListener("click", () => {
            en.hidden = !en.hidden;
            toggle.textContent = en.hidden ? "English" : "Hide";
            toggle.setAttribute("aria-expanded", String(!en.hidden));
        });
        block.appendChild(toggle);
        block.appendChild(en);
    }
    box.appendChild(block);
}

function show(id) {
    const box = document.getElementById("reading-container");
    box.innerHTML = "";
    const text = byId(id);
    if (!text) {
        box.appendChild(paragraph("No texts loaded.", "read-gr"));
        return;
    }
    const h = document.createElement("h2");
    h.className = "read-title";
    h.textContent = text.title;
    box.appendChild(h);

    const all = document.createElement("button");
    all.className = "read-all";
    all.type = "button";
    all.textContent = "Hide every translation";
    all.addEventListener("click", () => {
        const hiding = [...box.querySelectorAll(".read-en")].some(e => e.hidden);
        for (const e of box.querySelectorAll(".read-en")) e.hidden = !hiding;
        for (const t of box.querySelectorAll(".read-toggle")) {
            t.textContent = hiding ? "Hide" : "English";
            t.setAttribute("aria-expanded", String(hiding));
        }
        all.textContent = hiding ? "Hide every translation" : "Show every translation";
    });
    box.appendChild(all);

    // A story brings a handful of words the dictionary has no reason to hold.
    if (text.glossary) {
        const g = document.createElement("p");
        g.className = "read-glossary";
        g.textContent = text.glossary;
        box.appendChild(g);
    }

    for (const part of text.parts) renderPart(part, box);
    if (typeof window.scrollTo === "function") window.scrollTo(0, 0);
}

return { load, TEXTS, byId, show };

})();
