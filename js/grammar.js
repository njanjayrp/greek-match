// The grammar library: one entry per topic, each with the written-out manual
// and, where there is one, the drill that practises it.
//
// Adding a topic means adding an entry here — a title, the manual markup, and
// optionally `drill`, a module shaped like COMPARE/DATETIME
// ({ TOPICS, buildRound(topic, n) }). Everything else (the topic dropdown, the
// drill's sub-topic list, the tests) reads this list.

window.GRAMMAR = (function () {

const TOPICS = [
    {
        id: "comparatives",
        title: "Παραθετικά",
        blurb: "Comparing things: πιο, ο πιο, τόσο… όσο",
        manual: `<article class="manual">
    <h2>Παραθετικά — comparing things</h2>
    <p class="manual-lead">Greek compares with a little word in front of the adjective, not with
    an ending: <b>πιο</b> for “more”, <b>ο/η/το πιο</b> for “the most”. The adjective still has to
    agree with what it describes.</p>

    <h3>1. Οι τρεις βαθμοί</h3>
    <table class="manual-table">
        <thead><tr><th></th><th>ο (m)</th><th>η (f)</th><th>το (n)</th></tr></thead>
        <tbody>
            <tr><th>Θετικός<span>plain</span></th><td>ωραί<b>ος</b></td><td>ωραί<b>α</b></td><td>ωραί<b>ο</b></td></tr>
            <tr><th>Συγκριτικός<span>more …</span></th><td><b>πιο</b> ωραίος</td><td><b>πιο</b> ωραία</td><td><b>πιο</b> ωραίο</td></tr>
            <tr><th>Υπερθετικός<span>the most …</span></th><td><b>ο πιο</b> ωραίος</td><td><b>η πιο</b> ωραία</td><td><b>το πιο</b> ωραίο</td></tr>
        </tbody>
    </table>
    <p class="manual-note">Plural works the same way: οι πιο ωραί<b>οι</b> / οι πιο ωραί<b>ες</b> / τα πιο ωραί<b>α</b>.</p>

    <h3>2. Σύγκριση με «από»</h3>
    <p>The thing you compare against goes in the <b>accusative</b> after <b>από</b>:</p>
    <ul class="manual-examples">
        <li>Ο Χρήστος είναι <b>πιο ψηλός από</b> τ<b>ον</b> Ηλία.</li>
        <li>Η μαύρη μπλούζα είναι <b>πιο φτηνή από</b> τ<b>ην</b> κόκκινη μπλούζα.</li>
        <li>Το ποδήλατο είναι <b>πιο αργό από</b> τ<b>ο</b> αυτοκίνητο.</li>
    </ul>
    <p class="manual-note">How much more? <b>λίγο πιο</b> (a little) / <b>πολύ πιο</b> (far).
    The word goes <i>before</i> πιο: Ο Χρήστος είναι <b>λίγο πιο</b> ψηλός από τον Ηλία.</p>

    <h3>3. Υπερθετικός</h3>
    <ul class="manual-examples">
        <li>Η παρέα μας είναι <b>η πιο μεγάλη</b> στο νησί.</li>
        <li>Η Άννα και η Εύη είναι <b>οι πιο όμορφες</b> κοπέλες στην παρέα.</li>
        <li>Το ποδήλατο είναι <b>το πιο αργό</b> από όλα τα μέσα μεταφοράς.</li>
    </ul>
    <p class="manual-note">The article carries the gender and number, so it changes with the noun —
    not with the adjective.</p>

    <h3>4. Ίδιο, λιγότερο</h3>
    <table class="manual-table">
        <tbody>
            <tr><th>πιο … από</th><td>Ο Χρήστος είναι πιο ψηλός <b>από</b> τον Ηλία.</td></tr>
            <tr><th>τόσο … όσο</th><td>Ο Ηλίας δεν είναι <b>τόσο</b> ψηλός <b>όσο</b> ο Χρήστος.</td></tr>
            <tr><th>λιγότερο … από</th><td>Ο Ηλίας είναι <b>λιγότερο</b> ψηλός <b>από</b> τον Χρήστο.</td></tr>
        </tbody>
    </table>
    <p class="manual-note">After <b>όσο</b> the noun stays in the nominative (ο Χρήστος),
    after <b>από</b> it goes to the accusative (τον Χρήστο).</p>

    <h3>5. Μονολεκτικά — the one-word forms</h3>
    <table class="manual-table">
        <thead><tr><th>θετικός</th><th>συγκριτικός</th><th>υπερθετικός</th></tr></thead>
        <tbody>
            <tr><td>καλός</td><td>καλύτερος</td><td>ο καλύτερος</td></tr>
            <tr><td>κακός</td><td>χειρότερος</td><td>ο χειρότερος</td></tr>
            <tr><td>μεγάλος</td><td>μεγαλύτερος</td><td>ο μεγαλύτερος</td></tr>
            <tr><td>μικρός</td><td>μικρότερος</td><td>ο μικρότερος</td></tr>
            <tr><td>πολύς</td><td>περισσότερος</td><td>ο περισσότερος</td></tr>
        </tbody>
    </table>
    <p class="manual-note manual-warn">Never both at once: <s>πιο καλύτερος</s> → <b>καλύτερος</b>
    or <b>πιο καλός</b>. Both are fine on their own.</p>

    <h3>6. Λάθη που κοστίζουν</h3>
    <ul class="manual-examples manual-bad">
        <li><s>Η Κρήτη είναι πιο μεγάλος από την Κέρκυρα.</s> → πιο <b>μεγάλη</b> (η Κρήτη is feminine)</li>
        <li><s>Ο Ηλίας δεν είναι τόσο ψηλός από τον Χρήστο.</s> → τόσο ψηλός <b>όσο ο Χρήστος</b></li>
        <li><s>Είναι πιο ψηλός από ο Ηλίας.</s> → από <b>τον Ηλία</b></li>
    </ul>
</article>`,
        drill: () => window.COMPARE || null
    }
];

function byId(id) { return TOPICS.find(t => t.id === id) || TOPICS[0]; }

// Every drillable sub-topic across every grammar topic, for the dropdown:
// [{ topicId, topicTitle, sub, source }]
function drills() {
    const out = [];
    for (const t of TOPICS) {
        const source = t.drill && t.drill();
        if (!source) continue;
        for (const sub of source.TOPICS) {
            out.push({ topicId: t.id, topicTitle: t.title, sub, source });
        }
    }
    return out;
}

// "comparatives::Υπερθετικός" → the entry that builds that round
function resolve(value) {
    const [topicId, sub] = String(value).split("::");
    return drills().find(d => d.topicId === topicId && d.sub === sub) || null;
}

function buildRound(value, n) {
    if (value && value !== "__all__") {
        const d = resolve(value);
        return d ? d.source.buildRound(d.sub, n) : [];
    }
    // "All topics" shuffles every grammar drill together
    const sources = [...new Set(drills().map(d => d.source))];
    const round = [];
    for (let i = 0; i < n * 3 && round.length < n; i++) {
        const s = sources[Math.floor(Math.random() * sources.length)];
        const [q] = s.buildRound(null, 1);
        if (q && !round.some(r => r.prompt === q.prompt)) round.push(q);
    }
    return round;
}

return { TOPICS, byId, drills, resolve, buildRound };

})();
