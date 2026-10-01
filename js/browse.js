// Browse — the dictionary: every word, searchable, with the conjugation table
// for anything that is a verb.

const BrowseMode = (() => {
    let words = [];
    let query = "";
    const open = new Set();          // greek entries whose table is unfolded

    function init(data) {
        words = data;
        const box = document.getElementById("browse-search");
        box.addEventListener("input", e => {
            query = e.target.value.trim().toLowerCase();
            render();
        });
    }

    function norm(s) {
        return s.normalize("NFD").replace(/[̀-́͂ͅ]/g, "").normalize("NFC").toLowerCase();
    }

    function filtered() {
        let list = words;
        if (group === MARKED)          list = list.filter(w => w.marked);
        else if (group !== "__all__")  list = list.filter(w => w.group === group);
        if (query) {
            const q = norm(query);
            list = list.filter(w => norm(w.greek + " " + w.english + " " + (w.group || "")).includes(q));
        }
        return list;
    }

    const PERSONS = ["εγώ", "εσύ", "αυτός", "εμείς", "εσείς", "αυτοί"];

    function table(forms) {
        const cols = [["present", "ενεστώτας"], ["imperfect", "παρατατικός"],
                      ["aorist", "αόριστος"], ["future", "μέλλοντας"]]
            .filter(([k]) => forms[k] && forms[k].length === 6);
        let html = '<table class="conj-table"><thead><tr><th></th>' +
            cols.map(([, label]) => `<th>${label}</th>`).join("") + "</tr></thead><tbody>";
        for (let i = 0; i < 6; i++) {
            html += `<tr><th>${PERSONS[i]}</th>` +
                cols.map(([k]) => `<td>${esc(forms[k][i])}</td>`).join("") + "</tr>";
        }
        html += "</tbody></table>";
        if (forms.derived) html += '<div class="conj-note">generated from the aorist stem</div>';
        return html;
    }

    function esc(s) {
        return String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
    }

    function render() {
        const list = filtered();
        document.getElementById("browse-count").textContent =
            list.length + (list.length === 1 ? " word" : " words");

        const ul = document.getElementById("browse-list");
        ul.innerHTML = "";
        for (const w of list) {
            const forms = window.CONJUGATOR ? window.CONJUGATOR.forms(w.greek) : null;
            const li = document.createElement("li");
            li.className = "word-row" + (w.marked ? " marked" : "") + (forms ? " is-verb" : "");
            li.innerHTML =
                `<div class="row-top"><span class="row-gr">${esc(w.greek)}</span>` +
                `<span class="row-en">${esc(w.english)}</span></div>` +
                `<div class="row-meta"><span class="row-group">${esc(w.group || "")}</span>` +
                (forms ? '<span class="row-verb">ρήμα</span>' : "") + "</div>" +
                (forms && open.has(w.greek) ? table(forms) : "");
            if (forms) {
                li.addEventListener("click", () => {
                    open.has(w.greek) ? open.delete(w.greek) : open.add(w.greek);
                    render();
                });
            }
            ul.appendChild(li);
        }
    }

    function show() { render(); }

    return { init, show };
})();
