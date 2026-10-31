// The grammar library: one entry per topic, each with the written-out manual
// and, where there is one, the drill that practises it.
//
// Adding a topic means adding an entry here — a title, the manual markup, and
// optionally `drill: { src, global }` naming a script shaped like
// compare.js / datetime.js ({ TOPICS, buildRound(topic, n) }). The script is
// pulled in on demand, so a new topic needs no <script> tag, no service-worker
// entry and no cache-busting: one entry here and the file itself.

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
    <p class="manual-note">These are ordinary <b>-ος / -η / -ο</b> adjectives and the accent never
    moves, so every gender and number comes off the same stem:
    περισσότερ<b>ος</b> · περισσότερ<b>η</b> · περισσότερ<b>ο</b> ·
    περισσότερ<b>οι</b> · περισσότερ<b>ες</b> · περισσότερ<b>α</b>.
    Only <b>πολύς</b> is irregular in the positive: πολύς / πολλή / πολύ, πολλοί / πολλές / πολλά.</p>
    <p class="manual-note manual-warn">Never both at once: <s>πιο καλύτερος</s> → <b>καλύτερος</b>.
    And for <b>καλός</b> and <b>κακός</b> the one-word form is the normal one — πιο καλός
    is heard, but καλύτερος is what you write. <b>Μεγάλος</b> and <b>μικρός</b> take either.</p>

    <h3>6. Λάθη που κοστίζουν</h3>
    <ul class="manual-examples manual-bad">
        <li><s>Η Κρήτη είναι πιο μεγάλος από την Κέρκυρα.</s> → πιο <b>μεγάλη</b> (η Κρήτη is feminine)</li>
        <li><s>Ο Ηλίας δεν είναι τόσο ψηλός από τον Χρήστο.</s> → τόσο ψηλός <b>όσο ο Χρήστος</b></li>
        <li><s>Είναι πιο ψηλός από ο Ηλίας.</s> → από <b>τον Ηλία</b></li>
    </ul>
</article>`,
        drill: { src: "js/compare.js", global: "COMPARE" }
    },
    {
        id: "imperative",
        title: "Προστακτική",
        blurb: "Telling someone to do something: γράψε, γράψτε, μη γράψεις",
        manual: `<article class="manual">
    <h2>Προστακτική — telling someone to do something</h2>
    <p class="manual-lead">The imperative is built off the <b>future stem</b>, not the present one.
    Take <b>θα</b> + the verb, drop the <b>θα</b> and the ending, and what is left is the stem you
    command with: <b>γράφω → θα γράψω → γραψ-</b> → <b>γράψε</b> (you) / <b>γράψτε</b> (you all).</p>

    <h3>1. Πώς φτιάχνεται</h3>
    <table class="manual-table">
        <thead><tr><th>ενεστώτας</th><th>μέλλοντας</th><th>στέλεχος</th><th>εσύ</th><th>εσείς</th></tr></thead>
        <tbody>
            <tr><td>γράφω</td><td>θα γράψω</td><td>γραψ-</td><td>γράψ<b>ε</b></td><td>γράψ<b>τε</b></td></tr>
            <tr><td>διαβάζω</td><td>θα διαβάσω</td><td>διαβασ-</td><td>διάβασ<b>ε</b></td><td>διαβάσ<b>τε</b></td></tr>
            <tr><td>μιλάω</td><td>θα μιλήσω</td><td>μιλησ-</td><td>μίλησ<b>ε</b></td><td>μιλήσ<b>τε</b></td></tr>
            <tr><td>οδηγώ</td><td>θα οδηγήσω</td><td>οδηγησ-</td><td>οδήγησ<b>ε</b></td><td>οδηγήσ<b>τε</b></td></tr>
        </tbody>
    </table>
    <p class="manual-note">Singular <b>-ε</b>, plural <b>-τε</b>. The accent sits on the third syllable
    from the end in the singular (<b>διά</b>βασε) and moves one step right in the plural
    (δια<b>βά</b>στε), because the word got shorter.</p>

    <h3>2. Το «να» κάνει την ίδια δουλειά</h3>
    <p>Every command has a second, softer form with <b>να</b> + the same stem. The two are
    interchangeable, and the να-form is what you use whenever the imperative sounds too blunt:</p>
    <ul class="manual-examples">
        <li>Αντώνιο, <b>γράψε</b> στον πίνακα! = Αντώνιο, <b>να γράψεις</b> στον πίνακα!</li>
        <li>Παιδιά, <b>γράψτε</b> γρήγορα! = Παιδιά, <b>να γράψετε</b> γρήγορα!</li>
    </ul>

    <h3>3. Άρνηση: πάντα με «να»</h3>
    <p>There is <b>no negative imperative</b> in Greek. To tell someone <i>not</i> to do something you
    drop the imperative form entirely and use <b>μη(ν)</b> + the να-form without the να:</p>
    <table class="manual-table">
        <tbody>
            <tr><th>εσύ</th><td><b>μη γράψεις</b> στον πίνακα</td></tr>
            <tr><th>εσείς</th><td><b>μη γράψετε</b> γρήγορα</td></tr>
        </tbody>
    </table>
    <p class="manual-note"><b>μη</b> becomes <b>μην</b> before a vowel and before κ π τ ξ ψ γκ μπ ντ τσ τζ,
    exactly like τη/την: μη <b>γ</b>ράψεις, but μην <b>ο</b>δηγήσεις, μην <b>π</b>ας.</p>

    <h3>4. Μία φορά ή συνέχεια;</h3>
    <table class="manual-table">
        <thead><tr><th></th><th>μία φορά</th><th>συνέχεια / συνήθεια</th></tr></thead>
        <tbody>
            <tr><th>εσύ</th><td>γράψε (future stem)</td><td>γράφε (present stem)</td></tr>
            <tr><th>άρνηση</th><td>μη γράψεις</td><td>μη γράφεις</td></tr>
        </tbody>
    </table>
    <p class="manual-note">Κλείσε την πόρτα = close it, now. Μη βλέπετε τηλεόραση μέχρι αργά =
    stop making a habit of it. The one-off form is the common one; reach for the present stem only
    when you really mean “keep on” or “as a rule”.</p>

    <h3>5. Ανώμαλα</h3>
    <table class="manual-table">
        <thead><tr><th>ρήμα</th><th>εσύ</th><th>εσείς</th></tr></thead>
        <tbody>
            <tr><td>αφήνω</td><td>άσε</td><td>άστε / αφήστε</td></tr>
            <tr><td>βλέπω</td><td>δες</td><td>δείτε</td></tr>
            <tr><td>βρίσκω</td><td>βρες</td><td>βρείτε</td></tr>
            <tr><td>μπαίνω</td><td>μπες</td><td>μπείτε</td></tr>
            <tr><td>βγαίνω</td><td>βγες</td><td>βγείτε</td></tr>
            <tr><td>δίνω</td><td>δώσε</td><td>δώστε</td></tr>
            <tr><td>λέω</td><td>πες</td><td>πείτε</td></tr>
            <tr><td>πίνω</td><td>πιες</td><td>πιείτε</td></tr>
            <tr><td>παίρνω</td><td>πάρε</td><td>πάρτε</td></tr>
            <tr><td>πηγαίνω</td><td>πήγαινε</td><td>πάτε / πηγαίνετε</td></tr>
            <tr><td>τρώω</td><td>φάε</td><td>φάτε</td></tr>
            <tr><td>ανεβαίνω</td><td>ανέβα</td><td>ανεβείτε</td></tr>
            <tr><td>κατεβαίνω</td><td>κατέβα</td><td>κατεβείτε</td></tr>
            <tr><td>σηκώνομαι</td><td>σήκω</td><td>σηκωθείτε</td></tr>
            <tr><td>έρχομαι</td><td>έλα</td><td>ελάτε</td></tr>
            <tr><td>κάθομαι</td><td>κάτσε / κάθισε</td><td>καθίστε</td></tr>
        </tbody>
    </table>
    <p class="manual-note">These are the ones you hear every day — έλα, πες, δες, πάρε, φάε — so they
    are worth knowing cold. Note that the negative of an irregular is regular again:
    <b>έλα</b> but <b>μην έρθεις</b>, <b>πες</b> but <b>μην πεις</b>.</p>

    <h3>6. Λάθη που κοστίζουν</h3>
    <ul class="manual-examples manual-bad">
        <li><s>Μη γράψε στον πίνακα!</s> → μη <b>γράψεις</b> (the negative never uses the imperative form)</li>
        <li><s>Κύριε, κάτσε εδώ.</s> → <b>Καθίστε</b> εδώ (one stranger, but you address them as εσείς)</li>
        <li><s>Γράφε το γρήγορα!</s> → <b>Γράψε</b> το γρήγορα (one action, so the future stem)</li>
        <li><s>Μη οδηγήσεις γρήγορα!</s> → <b>Μην</b> οδηγήσεις (ν before a vowel)</li>
    </ul>
</article>`
    },
    {
        id: "adverbs",
        title: "Επιρρήματα",
        blurb: "From adjective to adverb: καλός → καλά, and πιο καλά → καλύτερα",
        manual: `<article class="manual">
    <h2>Επιρρήματα — how something is done</h2>
    <p class="manual-lead">An adjective describes a <i>thing</i> and changes with it; an adverb describes
    the <i>verb</i> and never changes at all. Greek builds the adverb by swapping the adjective's ending
    for <b>-α</b>: <b>γρήγορος → γρήγορα</b>, <b>καλός → καλά</b>.</p>

    <h3>1. Από το επίθετο στο επίρρημα</h3>
    <table class="manual-table">
        <thead><tr><th>επίθετο</th><th>επίρρημα</th><th></th></tr></thead>
        <tbody>
            <tr><td>καλ<b>ός</b></td><td>καλ<b>ά</b></td><td>well</td></tr>
            <tr><td>ωραί<b>ος</b></td><td>ωραί<b>α</b></td><td>nicely</td></tr>
            <tr><td>γρήγορ<b>ος</b></td><td>γρήγορ<b>α</b></td><td>fast</td></tr>
            <tr><td>αργ<b>ός</b></td><td>αργ<b>ά</b></td><td>slowly, late</td></tr>
            <tr><td>ήσυχ<b>ος</b></td><td>ήσυχ<b>α</b></td><td>quietly</td></tr>
            <tr><td>προσεκτικ<b>ός</b></td><td>προσεκτικ<b>ά</b></td><td>carefully</td></tr>
            <tr><td>συχν<b>ός</b></td><td>συχν<b>ά</b></td><td>often</td></tr>
        </tbody>
    </table>
    <p class="manual-note">The adverb is the same shape as the <b>neuter plural</b> of the adjective, and
    that is the whole trick: τα ωραία παιδιά (adjective) vs περάσαμε ωραία (adverb). It never agrees with
    anything, because there is nothing for it to agree with.</p>

    <h3>2. Δύο που δεν ακολουθούν</h3>
    <table class="manual-table">
        <tbody>
            <tr><th>λίγος</th><td>λίγ<b>ο</b> — Τρώει λίγο. <s>λίγα</s></td></tr>
            <tr><th>πολύς</th><td>πολ<b>ύ</b> — Δουλεύει πολύ. <s>πολλά</s></td></tr>
        </tbody>
    </table>

    <h3>3. Παραθετικά: πιο + επίρρημα</h3>
    <table class="manual-table">
        <thead><tr><th>θετικός</th><th>συγκριτικός</th></tr></thead>
        <tbody>
            <tr><td>αργά</td><td><b>πιο</b> αργά</td></tr>
            <tr><td>ωραία</td><td><b>πιο</b> ωραία</td></tr>
            <tr><td>προσεκτικά</td><td><b>πιο</b> προσεκτικά</td></tr>
        </tbody>
    </table>
    <ul class="manual-examples">
        <li>Οδηγώ <b>πιο προσεκτικά από</b> την αδερφή μου.</li>
        <li>Τα αεροπλάνα πετάνε <b>πιο ψηλά από</b> τα πουλιά.</li>
    </ul>
    <p class="manual-note">What you compare against still goes in the <b>accusative</b> after <b>από</b>,
    exactly as with adjectives.</p>

    <h3>4. Μονολεκτικά</h3>
    <table class="manual-table">
        <thead><tr><th>θετικός</th><th>συγκριτικός</th></tr></thead>
        <tbody>
            <tr><td>καλά</td><td>καλύτερα</td></tr>
            <tr><td>άσχημα</td><td>χειρότερα</td></tr>
            <tr><td>πολύ</td><td>περισσότερο</td></tr>
            <tr><td>λίγο</td><td>λιγότερο</td></tr>
        </tbody>
    </table>
    <p class="manual-note">These end in <b>-ο</b> or <b>-α</b> and never change. They are the adverbs of
    καλύτερος, χειρότερος, περισσότερος, λιγότερος — same four one-word forms you already know from
    <b>Παραθετικά</b>.</p>

    <h3>5. -α ή -ως;</h3>
    <p>A few adjectives give two adverbs, and they do not mean the same thing:</p>
    <table class="manual-table">
        <tbody>
            <tr><th>ακριβός</th><td><b>ακριβά</b> = expensively · <b>ακριβώς</b> = exactly</td></tr>
            <tr><th>τέλειος</th><td><b>τέλεια</b> = perfectly · <b>τελείως</b> = completely</td></tr>
        </tbody>
    </table>
    <p class="manual-note">At this level <b>-α</b> is the form you build; the handful of <b>-ως</b> adverbs
    are learnt one by one as separate words.</p>

    <h3>6. Λάθη που κοστίζουν</h3>
    <ul class="manual-examples manual-bad">
        <li><s>Ο Γιάννης οδηγεί γρήγορος.</s> → οδηγεί <b>γρήγορα</b> (it describes the driving, not Γιάννης)</li>
        <li><s>Περάσαμε ωραίοι!</s> → Περάσαμε <b>ωραία</b></li>
        <li><s>Τρώει λίγα.</s> → Τρώει <b>λίγο</b></li>
        <li><s>Μαγειρεύει πιο καλύτερα.</s> → Μαγειρεύει <b>καλύτερα</b> (never πιο with a one-word form)</li>
        <li><s>Το αγόρασε πιο ακριβώς.</s> → πιο <b>ακριβά</b> (ακριβώς means “exactly”)</li>
    </ul>
</article>`
    }
];

// Scripts are fetched once, the first time the Grammar section is opened.
const loaded = {};
function load() {
    return Promise.all(TOPICS.filter(t => t.drill).map(t => {
        const { src, global } = t.drill;
        if (window[global]) return Promise.resolve();
        if (loaded[src]) return loaded[src];
        loaded[src] = new Promise(resolve => {
            const el = document.createElement("script");
            el.src = src;
            el.onload = el.onerror = () => resolve();
            document.head.appendChild(el);
        });
        return loaded[src];
    }));
}

function sourceOf(t) { return t.drill ? (window[t.drill.global] || null) : null; }

function byId(id) { return TOPICS.find(t => t.id === id) || TOPICS[0]; }

// Every drillable sub-topic across every grammar topic, for the dropdown:
// [{ topicId, topicTitle, sub, source }]
function drills() {
    const out = [];
    for (const t of TOPICS) {
        const source = sourceOf(t);
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
    // "All topics" deals the sub-topics round-robin out of a reshuffled queue, so
    // ten questions cover them evenly instead of favouring whichever drill
    // happens to have the most question shapes behind it.
    const all = drills();
    if (!all.length) return [];
    const round = [], seen = new Set();
    let queue = [];
    for (let i = 0; i < n * 5 && round.length < n; i++) {
        if (!queue.length) queue = shuffle(all);
        const d = queue.shift();
        const [q] = d.source.buildRound(d.sub, 1);
        if (q && !seen.has(q.prompt)) { seen.add(q.prompt); round.push(q); }
    }
    return round;
}

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

return { TOPICS, byId, drills, resolve, buildRound, load, sourceOf };

})();
