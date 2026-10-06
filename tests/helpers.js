// Test rig: the app ships as plain <script> files, so the tests load the real
// sources into one scope with a stub DOM instead of mocking the game logic.

export const ROOT = new URL("../", import.meta.url).pathname;

export function readWords() {
    return JSON.parse(Deno.readTextFileSync(ROOT + "words.json"));
}

export function readSrc(name) {
    return Deno.readTextFileSync(ROOT + "js/" + name);
}

// conjugations.js / conjugator.js / datetime.js only touch `window`.
export function loadLibs() {
    const win = {};
    for (const f of ["conjugations.js", "conjugator.js", "datetime.js", "compare.js"]) {
        new Function("window", readSrc(f))(win);
    }
    return win;
}

function makeEl() {
    const el = {
        children: [], style: {}, dataset: {}, value: "", textContent: "", innerHTML: "",
        disabled: false, lang: "", placeholder: "",
        classList: {
            _s: new Set(),
            add(...c) { c.forEach(x => this._s.add(x)); },
            remove(...c) { c.forEach(x => this._s.delete(x)); },
            toggle(c, on) { on === undefined ? (this._s.has(c) ? this._s.delete(c) : this._s.add(c))
                                             : (on ? this._s.add(c) : this._s.delete(c)); },
            contains(c) { return this._s.has(c); },
        },
        addEventListener(type, fn) { (this._on ||= {})[type] = fn; },
        removeEventListener() {},
        appendChild(c) { this.children.push(c); return c; },
        insertBefore(c) { this.children.push(c); return c; },
        querySelector() { return makeEl(); },
        querySelectorAll() { return []; },
        focus() {}, blur() {}, remove() {}, setAttribute() {}, getAttribute() { return null; },
        closest() { return null; },
        getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 }; },
    };
    return el;
}

// Boots the real app against a stub DOM and hands back its internals.
export async function bootApp() {
    const els = new Map();
    const store = {};
    const win = {};
    const doc = {
        getElementById(id) { if (!els.has(id)) els.set(id, makeEl()); return els.get(id); },
        createElement: makeEl,
        createTextNode: t => ({ nodeValue: t, textContent: t }),
        querySelector: () => makeEl(),
        querySelectorAll: () => [],
        addEventListener() {},
        body: makeEl(),
    };
    const localStorage = {
        getItem: k => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: k => { delete store[k]; },
    };
    const fetch = async (url) => ({
        json: async () => JSON.parse(Deno.readTextFileSync(ROOT + url.replace("./", ""))),
    });

    const src = ["conjugations.js", "conjugator.js", "datetime.js", "compare.js", "game.js", "browse.js"]
        .map(readSrc).join("\n");
    const api = new Function(
        "window", "document", "localStorage", "fetch", "navigator", "location", "setTimeout",
        src + `
        return {
            switchMode, switchGroup, selectRound, modePool, setLang,
            state: () => ({ mode, section, group, round, lang, words: allWords.length }),
            el: id => document.getElementById(id),
        };`
    )(win, doc, localStorage, fetch, {}, { search: "", href: "http://test/" }, setTimeout);

    await new Promise(r => setTimeout(r, 0));   // let the boot fetch resolve
    return { ...api, win, store };
}
