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
        en: "comparison",
        blurb: "Comparing things: πιο, ο πιο, τόσο… όσο",
        area: "Ονόματα & αντωνυμίες",
        sentences: ["Σύγκριση"],
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
        drills: [{ format: "choose", src: "js/compare.js", global: "COMPARE" }]
    },
    {
        id: "imperative",
        title: "Προστακτική",
        en: "commands",
        blurb: "Telling someone to do something: γράψε, γράψτε, μη γράψεις",
        area: "Ρήματα",
        sentences: ["Προστακτική"],
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
        en: "adverbs",
        blurb: "From adjective to adverb: καλός → καλά, and πιο καλά → καλύτερα",
        area: "Ονόματα & αντωνυμίες",
        sentences: ["Επιρρήματα"],
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
    },
    {
        id: "aorist",
        title: "Αόριστος",
        en: "simple past",
        blurb: "The simple past: one finished action — έγραψα, μίλησα, ήρθα",
        area: "Ρήματα",
        sentences: ["Αόριστος"],
        manual: `<article class="manual">
    <h2>Αόριστος — the simple past</h2>
    <p class="manual-lead">One action, finished, seen as a whole: <b>χτες έγραψα ένα γράμμα</b>.
    If you mean “I was writing” or “I used to write”, that is the Παρατατικός, a different tense.
    The Αόριστος is built on the <b>same stem as the future</b>, so if you know θα γράψω you already
    know έγραψα.</p>

    <h3>1. Τύπος Α: από τον μέλλοντα στον αόριστο</h3>
    <p>Take <b>θα</b> + verb, drop the -ω, and add the past endings:
    <b>γράφω → θα γράψω → έγραψα</b>. The consonant before the ending is what changes:</p>
    <table class="manual-table">
        <thead><tr><th>ενεστώτας</th><th>γίνεται</th><th>αόριστος</th></tr></thead>
        <tbody>
            <tr><td>-ν-, -ζ-, -θ- (πληρώνω, διαβάζω, νιώθω)</td><td><b>-σ-</b></td><td>πλήρω<b>σ</b>α, διάβα<b>σ</b>α, ένιω<b>σ</b>α</td></tr>
            <tr><td>-κ-, -σκ-, -γ-, -γγ-, -χ-, -χν- (μπλέκω, ανοίγω, προσέχω, φτιάχνω)</td><td><b>-ξ-</b></td><td>έμπλε<b>ξ</b>α, άνοι<b>ξ</b>α, πρόσε<b>ξ</b>α, έφτια<b>ξ</b>α</td></tr>
            <tr><td>-π-, -πτ-, -β-, -φ- (λείπω, ανακαλύπτω, ράβω, βάφω)</td><td><b>-ψ-</b></td><td>έλει<b>ψ</b>α, ανακάλυ<b>ψ</b>α, έρα<b>ψ</b>α, έβα<b>ψ</b>α</td></tr>
            <tr><td>-εύω (ταξιδεύω)</td><td><b>-εψ-</b></td><td>ταξίδε<b>ψ</b>α</td></tr>
            <tr><td>-αύω (παύω)</td><td><b>-αψ-</b></td><td>έπα<b>ψ</b>α</td></tr>
        </tbody>
    </table>
    <p class="manual-note manual-warn">A small group in <b>-άζω</b> takes <b>-ξ-</b>, not -σ-:
    αλλάζω → άλλαξα, παίζω → έπαιξα, φωνάζω → φώναξα, κοιτάζω → κοίταξα, τρομάζω → τρόμαξα,
    νυστάζω → νύσταξα, πειράζω → πείραξα, σφυρίζω → σφύριξα. Learn them with the list, not the rule.</p>

    <h3>2. Καταλήξεις, τόνος, αύξηση</h3>
    <table class="manual-table">
        <thead><tr><th></th><th>διαβάζω</th><th>γράφω</th></tr></thead>
        <tbody>
            <tr><th>εγώ</th><td>διάβασ<b>α</b></td><td>έγραψ<b>α</b></td></tr>
            <tr><th>εσύ</th><td>διάβασ<b>ες</b></td><td>έγραψ<b>ες</b></td></tr>
            <tr><th>αυτός</th><td>διάβασ<b>ε</b></td><td>έγραψ<b>ε</b></td></tr>
            <tr><th>εμείς</th><td>διαβάσ<b>αμε</b></td><td>γράψ<b>αμε</b></td></tr>
            <tr><th>εσείς</th><td>διαβάσ<b>ατε</b></td><td>γράψ<b>ατε</b></td></tr>
            <tr><th>αυτοί</th><td>διάβασ<b>αν</b> / διαβάσ<b>ανε</b></td><td>έγραψ<b>αν</b> / γράψ<b>ανε</b></td></tr>
        </tbody>
    </table>
    <p class="manual-note">The accent always sits on the <b>third syllable from the end</b>. That is the
    whole reason for the <b>έ-</b> in έγραψα: γραψ-α has only two syllables, so the verb borrows one to
    carry the accent. Once the ending is long enough the borrowed syllable goes away again —
    <b>έ</b>γραψα but <b>γρά</b>ψαμε, <b>ά</b>νοιξα but <b>α</b>νοίξαμε.</p>

    <h3>3. είμαι και έχω</h3>
    <table class="manual-table">
        <thead><tr><th></th><th>είμαι</th><th>έχω</th></tr></thead>
        <tbody>
            <tr><th>εγώ</th><td>ήμουν(α)</td><td>είχα</td></tr>
            <tr><th>εσύ</th><td>ήσουν(α)</td><td>είχες</td></tr>
            <tr><th>αυτός</th><td>ήταν(ε)</td><td>είχε</td></tr>
            <tr><th>εμείς</th><td>ήμασταν</td><td>είχαμε</td></tr>
            <tr><th>εσείς</th><td>ήσασταν</td><td>είχατε</td></tr>
            <tr><th>αυτοί</th><td>ήταν(ε)</td><td>είχαν(ε)</td></tr>
        </tbody>
    </table>
    <p class="manual-note">These two have no separate simple past — the forms above cover both
    “I was / I used to be” and “I had”.</p>

    <h3>4. Ανώμαλα</h3>
    <table class="manual-table">
        <thead><tr><th>ενεστώτας</th><th>μέλλοντας</th><th>αόριστος</th></tr></thead>
        <tbody>
            <tr><td>κάνω</td><td>θα κάνω</td><td>έκανα</td></tr>
            <tr><td>μένω</td><td>θα μείνω</td><td>έμεινα</td></tr>
            <tr><td>στέλνω</td><td>θα στείλω</td><td>έστειλα</td></tr>
            <tr><td>πλένω</td><td>θα πλύνω</td><td>έπλυνα</td></tr>
            <tr><td>φεύγω</td><td>θα φύγω</td><td>έφυγα</td></tr>
            <tr><td>παίρνω</td><td>θα πάρω</td><td>πήρα</td></tr>
            <tr><td>φέρνω</td><td>θα φέρω</td><td>έφερα</td></tr>
            <tr><td>δίνω</td><td>θα δώσω</td><td>έδωσα</td></tr>
            <tr><td>βάζω</td><td>θα βάλω</td><td>έβαλα</td></tr>
            <tr><td>βγάζω</td><td>θα βγάλω</td><td>έβγαλα</td></tr>
            <tr><td>πέφτω</td><td>θα πέσω</td><td>έπεσα</td></tr>
            <tr><td>μαθαίνω</td><td>θα μάθω</td><td>έμαθα</td></tr>
            <tr><td>καταλαβαίνω</td><td>θα καταλάβω</td><td>κατάλαβα</td></tr>
            <tr><td>ανεβαίνω</td><td>θα ανέβω</td><td>ανέβηκα</td></tr>
            <tr><td>κατεβαίνω</td><td>θα κατέβω</td><td>κατέβηκα</td></tr>
            <tr><td>μπαίνω</td><td>θα μπω</td><td>μπήκα</td></tr>
            <tr><td>βγαίνω</td><td>θα βγω</td><td>βγήκα</td></tr>
            <tr><td>βρίσκω</td><td>θα βρω</td><td>βρήκα</td></tr>
            <tr><td>λέω</td><td>θα πω</td><td>είπα</td></tr>
            <tr><td>πίνω</td><td>θα πιω</td><td>ήπια</td></tr>
            <tr><td>βλέπω</td><td>θα δω</td><td>είδα</td></tr>
            <tr><td>πηγαίνω / πάω</td><td>θα πάω</td><td>πήγα</td></tr>
            <tr><td>τρώω</td><td>θα φάω</td><td>έφαγα</td></tr>
            <tr><td>ακούω</td><td>θα ακούσω</td><td>άκουσα</td></tr>
            <tr><td>κλαίω</td><td>θα κλάψω</td><td>έκλαψα</td></tr>
        </tbody>
    </table>

    <h3>5. Τύπος Β1 και Β2: τα -άω / -ώ</h3>
    <table class="manual-table">
        <thead><tr><th>ενεστώτας</th><th>κατάληξη</th><th>αόριστος</th></tr></thead>
        <tbody>
            <tr><td>μιλάω</td><td><b>-ησα</b></td><td>μίλησα, μίλησες, μίλησε, μιλήσαμε, μιλήσατε, μίλησαν</td></tr>
            <tr><td>φοράω</td><td><b>-εσα</b></td><td>φόρεσα, φόρεσες, φόρεσε, φορέσαμε…</td></tr>
            <tr><td>πεινάω</td><td><b>-ασα</b></td><td>πείνασα, πείνασες, πείνασε, πεινάσαμε…</td></tr>
            <tr><td>τραβάω</td><td><b>-ηξα</b></td><td>τράβηξα, τράβηξες, τράβηξε, τραβήξαμε…</td></tr>
            <tr><td>πετάω</td><td><b>-αξα</b></td><td>πέταξα, πέταξες, πέταξε, πετάξαμε…</td></tr>
        </tbody>
    </table>
    <p class="manual-note">Most of them take <b>-ησα</b>: αγαπάω, ρωτάω, ζητάω, βοηθάω, ξυπνάω,
    περπατάω, συναντάω, τραγουδάω, οδηγώ, μπορώ, προσπαθώ, τηλεφωνώ. These verbs <b>never</b> take an
    <b>ε-</b> at the front, and the accent is still on the third syllable from the end.</p>
    <p class="manual-note manual-warn">Two to memorise: <b>ζω → έζησα</b> and <b>μεθάω → μέθυσα</b>.</p>

    <h3>6. Τύπος Γ: τα -ομαι / -άμαι</h3>
    <table class="manual-table">
        <tbody>
            <tr><th>έρχομαι</th><td>ήρθα, ήρθες, ήρθε, ήρθαμε, ήρθατε, ήρθαν(ε)</td></tr>
            <tr><th>κάθομαι</th><td>κάθισα, κάθισες, κάθισε, καθίσαμε, καθίσατε, κάθισαν</td></tr>
            <tr><th>κοιμάμαι</th><td>κοιμήθηκα, κοιμήθηκες, κοιμήθηκε, κοιμηθήκαμε, κοιμηθήκατε, κοιμήθηκαν</td></tr>
        </tbody>
    </table>
    <p class="manual-note"><b>φοβάμαι, θυμάμαι, λυπάμαι</b> follow κοιμάμαι: φοβήθηκα, θυμήθηκα, λυπήθηκα.</p>

    <h3>7. Λέξεις που ζητούν Αόριστο</h3>
    <ul class="manual-examples">
        <li><b>χτες</b>, <b>προχτές</b>, <b>πέρυσι</b>, <b>πρόπερσι</b></li>
        <li><b>πριν από</b> δύο μέρες / τρεις εβδομάδες / λίγους μήνες / πολλά χρόνια</li>
        <li><b>την περασμένη</b> εβδομάδα, <b>τον περασμένο</b> μήνα, <b>τον περασμένο</b> χρόνο</li>
    </ul>

    <h3>8. Λάθη που κοστίζουν</h3>
    <ul class="manual-examples manual-bad">
        <li><s>Χτες εγράψαμε ένα γράμμα.</s> → <b>γράψαμε</b> (the ε- goes only where the accent needs it)</li>
        <li><s>Μίλησα με τον γιατρό εχθές και εμίλησα πάλι σήμερα.</s> → <b>μίλησα</b> (Β verbs never take ε-)</li>
        <li><s>Τι ώρα φύγατε; — Εφύγαμε στις οχτώ.</s> → <b>Φύγαμε</b> στις οχτώ</li>
        <li><s>Πήγα στο σινεμά και έβλεπα μια ταινία.</s> → <b>είδα</b> μια ταινία (one finished action)</li>
        <li><s>Ήπιασα πολύ.</s> → <b>Ήπια</b> πολύ</li>
    </ul>
</article>`,
        drills: [{ format: "choose", src: "js/conjchoice.js", global: "CONJCHOICE", subs: ["Αόριστος — past"] },
                  { format: "write",  src: "js/conjtype.js",   global: "CONJTYPE",   subs: ["Αόριστος — past"] }]
    },
    {
        id: "future",
        title: "Μέλλοντας",
        en: "future",
        blurb: "θα + the same stem as the aorist: θα γράψω, θα μιλήσω, θα πάω",
        area: "Ρήματα",
        sentences: ["Μέλλοντας"],
        manual: `<article class="manual">
    <h2>Απλός Μέλλοντας — what will happen once</h2>
    <p class="manual-lead">One word of grammar and one changed stem: <b>θα</b> + the aorist stem with
    present endings. <b>γράφω → θα γράψω</b>. If you know έγραψα you already know θα γράψω, and the
    other way round — it is the same stem learnt once and used in three places (μέλλοντας, αόριστος,
    υποτακτική).</p>

    <h3>1. Τύπος Α: το σύμφωνο αλλάζει</h3>
    <table class="manual-table">
        <thead><tr><th>ενεστώτας</th><th>γίνεται</th><th>μέλλοντας</th></tr></thead>
        <tbody>
            <tr><td>-ν-, -θ-, -ζ- (ψήνω, νιώθω, ετοιμάζω)</td><td><b>-σ-</b></td><td>θα ψή<b>σ</b>ω, θα νιώ<b>σ</b>ω, θα ετοιμά<b>σ</b>ω</td></tr>
            <tr><td>-κ-, -σκ-, -γ-, -γγ-, -χ-, -χν- (πλέκω, διδάσκω, ανοίγω, σφίγγω, τρέχω, φτιάχνω)</td><td><b>-ξ-</b></td><td>θα πλέ<b>ξ</b>ω, θα διδά<b>ξ</b>ω, θα ανοί<b>ξ</b>ω, θα τρέ<b>ξ</b>ω</td></tr>
            <tr><td>-π-, -πτ-, -β-, -φ- (λείπω, ανακαλύπτω, κόβω, γράφω)</td><td><b>-ψ-</b></td><td>θα λεί<b>ψ</b>ω, θα ανακαλύ<b>ψ</b>ω, θα κό<b>ψ</b>ω, θα γρά<b>ψ</b>ω</td></tr>
            <tr><td>-εύω (μαγειρεύω)</td><td><b>-έψω</b></td><td>θα μαγειρέ<b>ψ</b>ω</td></tr>
            <tr><td>-αύω (παύω)</td><td><b>-άψω</b></td><td>θα πά<b>ψ</b>ω</td></tr>
        </tbody>
    </table>
    <p class="manual-note manual-warn">The same -άζω / -ίζω group that broke the rule in the aorist takes
    <b>-ξω</b> here: αγγίζω → θα αγγίξω, αλλάζω → θα αλλάξω, κοιτάζω → θα κοιτάξω, νυστάζω → θα νυστάξω,
    ουρλιάζω → θα ουρλιάξω, παίζω → θα παίξω, πειράζω → θα πειράξω, σφυρίζω → θα σφυρίξω,
    τρομάζω → θα τρομάξω, φωνάζω → θα φωνάξω.</p>

    <h3>2. Καταλήξεις</h3>
    <table class="manual-table">
        <tbody>
            <tr><th>εγώ</th><td>θα μαγειρέψ<b>ω</b></td><th>εμείς</th><td>θα μαγειρέψ<b>ουμε</b></td></tr>
            <tr><th>εσύ</th><td>θα μαγειρέψ<b>εις</b></td><th>εσείς</th><td>θα μαγειρέψ<b>ετε</b></td></tr>
            <tr><th>αυτός</th><td>θα μαγειρέψ<b>ει</b></td><th>αυτοί</th><td>θα μαγειρέψ<b>ουν(ε)</b></td></tr>
        </tbody>
    </table>
    <p class="manual-note">The endings are the present endings — only the stem moved. Negative is
    <b>δε(ν)</b> before θα: δεν θα μαγειρέψω.</p>

    <h3>3. Έξι που δεν αλλάζουν καθόλου</h3>
    <ul class="manual-examples">
        <li>είμαι → <b>θα είμαι</b> · έχω → <b>θα έχω</b> · κάνω → <b>θα κάνω</b></li>
        <li>ξέρω → <b>θα ξέρω</b> · πάω / πηγαίνω → <b>θα πάω</b> · περιμένω → <b>θα περιμένω</b></li>
    </ul>

    <h3>4. Ανώμαλα</h3>
    <table class="manual-table">
        <thead><tr><th>ενεστώτας</th><th>μέλλοντας</th><th>ενεστώτας</th><th>μέλλοντας</th></tr></thead>
        <tbody>
            <tr><td>μένω</td><td>θα μείνω</td><td>μπαίνω</td><td>θα μπω</td></tr>
            <tr><td>στέλνω</td><td>θα στείλω</td><td>βγαίνω</td><td>θα βγω</td></tr>
            <tr><td>παραγγέλνω</td><td>θα παραγγείλω</td><td>ανεβαίνω</td><td>θα ανεβώ</td></tr>
            <tr><td>πλένω</td><td>θα πλύνω</td><td>κατεβαίνω</td><td>θα κατεβώ</td></tr>
            <tr><td>φεύγω</td><td>θα φύγω</td><td>λέω</td><td>θα πω</td></tr>
            <tr><td>παίρνω</td><td>θα πάρω</td><td>πίνω</td><td>θα πιω</td></tr>
            <tr><td>φέρνω</td><td>θα φέρω</td><td>βλέπω</td><td>θα δω</td></tr>
            <tr><td>δίνω</td><td>θα δώσω</td><td>βρίσκω</td><td>θα βρω</td></tr>
            <tr><td>βάζω</td><td>θα βάλω</td><td>τρώω</td><td>θα φάω</td></tr>
            <tr><td>βγάζω</td><td>θα βγάλω</td><td>φταίω</td><td>θα φταίξω</td></tr>
            <tr><td>πέφτω</td><td>θα πέσω</td><td>καίω</td><td>θα κάψω</td></tr>
            <tr><td>μαθαίνω</td><td>θα μάθω</td><td>κλαίω</td><td>θα κλάψω</td></tr>
            <tr><td>καταλαβαίνω</td><td>θα καταλάβω</td><td>ακούω</td><td>θα ακούσω</td></tr>
        </tbody>
    </table>
    <p class="manual-note">Three of them take their own endings. <b>θα μείνω</b> is ordinary
    (μείνω, μείνεις, μείνει, μείνουμε, μείνετε, μείνουν). <b>θα βγω</b> is stressed on the ending:
    βγω, βγεις, βγει, βγούμε, βγείτε, βγουν. <b>θα πάω</b> keeps the -άω verb's own set:
    πάω, πας, πάει, πάμε, πάτε, πάνε.</p>

    <h3>5. Τύπος Β1 και Β2</h3>
    <table class="manual-table">
        <thead><tr><th>κατάληξη</th><th>παράδειγμα</th><th>και ακόμα</th></tr></thead>
        <tbody>
            <tr><td><b>-ήσω</b></td><td>μιλάω → θα μιλήσω</td><td>αγαπάω, ρωτάω, ζητάω, βοηθάω, ξυπνάω, συναντάω, τραγουδάω, περπατάω, οδηγώ, τηλεφωνώ, προσπαθώ, ζω → θα ζήσω</td></tr>
            <tr><td><b>-έσω</b></td><td>μπορώ → θα μπορέσω</td><td>φοράω, πονάω, χωράω, παρακαλώ, προσκαλώ, διαρκώ</td></tr>
            <tr><td><b>-άσω</b></td><td>περνάω → θα περάσω</td><td>γελάω, πεινάω, διψάω, κρεμάω</td></tr>
        </tbody>
    </table>
    <p class="manual-note manual-warn">Two short lists to memorise. <b>-άξω</b>: πετάω → θα πετάξω,
    κοιτάω → θα κοιτάξω, φυλάω → θα φυλάξω. <b>-ήξω</b>: τραβάω → θα τραβήξω, βουτάω → θα βουτήξω,
    πηδάω → θα πηδήξω, φυσάω → θα φυσήξω. And four in <b>-άσω</b> that look like they should not be:
    ξεχνάω → θα ξεχάσω, κερνάω → θα κεράσω, περνάω → θα περάσω, γερνάω → θα γεράσω.</p>

    <h3>6. Τύπος Γ</h3>
    <table class="manual-table">
        <tbody>
            <tr><th>έρχομαι</th><td>θα έρθω, θα έρθεις, θα έρθει, θα έρθουμε, θα έρθετε, θα έρθουν(ε)</td></tr>
            <tr><th>κοιμάμαι</th><td>θα κοιμηθώ, θα κοιμηθείς, θα κοιμηθεί, θα κοιμηθούμε, θα κοιμηθείτε, θα κοιμηθούν(ε)</td></tr>
        </tbody>
    </table>

    <h3>7. Λέξεις που ζητούν Μέλλοντα</h3>
    <ul class="manual-examples">
        <li><b>σήμερα, απόψε, αύριο, μεθαύριο, (ε)φέτος, του χρόνου</b></li>
        <li><b>την Κυριακή</b>, αυτή την εβδομάδα, αυτόν τον μήνα</li>
        <li><b>την επόμενη / την άλλη</b> εβδομάδα, τον επόμενο / τον άλλο μήνα</li>
        <li><b>σε</b> λίγες μέρες, σε τρεις εβδομάδες, σε τέσσερις μήνες, σε δύο χρόνια</li>
    </ul>

    <h3>8. Λάθη που κοστίζουν</h3>
    <ul class="manual-examples manual-bad">
        <li><s>Αύριο θα γράφω ένα γράμμα.</s> → θα <b>γράψω</b> (one action; θα γράφω means “I will be writing, regularly”)</li>
        <li><s>Θα πάρω τηλέφωνο και θα λέω.</s> → και θα <b>πω</b></li>
        <li><s>Θα μιλήσεις ελληνικά; Ναι, θα μιλέσω.</s> → θα <b>μιλήσω</b></li>
        <li><s>Θα βγούμε έξω; — Ναι, θα βγάλουμε.</s> → θα <b>βγούμε</b> (βγάζω is “take out”, βγαίνω is “go out”)</li>
    </ul>
</article>`,
        drills: [{ format: "choose", src: "js/conjchoice.js", global: "CONJCHOICE", subs: ["Μέλλοντας — future"] },
                  { format: "write",  src: "js/conjtype.js",   global: "CONJTYPE",   subs: ["Μέλλοντας — future"] }]
    },
    {
        id: "subjunctive",
        title: "Υποτακτική",
        en: "the να-form",
        blurb: "να + the same stem, after θέλω, πρέπει, μπορώ",
        area: "Ρήματα",
        sentences: ["Υποτακτική"],
        manual: `<article class="manual">
    <h2>Απλή Υποτακτική — the να-form</h2>
    <p class="manual-lead">Same stem again, different little word in front: <b>γράφω → θα γράψω →
    να γράψω</b>. Greek has no infinitive, so wherever English says “to do”, Greek says <b>να</b> + a
    verb that still agrees with its subject: <b>θέλω να πάω</b>, θέλει <b>να πάει</b>.</p>

    <h3>1. Μετά από ρήμα</h3>
    <table class="manual-table">
        <tbody>
            <tr><th>μπορώ</th><td>Τα παιδιά δεν <b>μπορούν να πάνε</b> στο σχολείο σήμερα.</td></tr>
            <tr><th>θέλω</th><td>Η Μαρία <b>θέλει να σπουδάσει</b> Αγγλική Φιλολογία.</td></tr>
            <tr><th>πάω</th><td>— Πού πας; — <b>Πάω να στείλω</b> μέιλ στους φίλους μου.</td></tr>
            <tr><th>προσπαθώ</th><td>Η Μαρίνα <b>προσπαθεί να μάθει</b> την Υποτακτική!</td></tr>
            <tr><th>σκέφτομαι</th><td><b>Σκεφτόμαστε</b> φέτος <b>να πάμε</b> διακοπές στη Ρόδο.</td></tr>
            <tr><th>προτιμώ</th><td><b>Προτιμάς να φας</b> τώρα ή αργότερα;</td></tr>
        </tbody>
    </table>
    <p class="manual-note">Both verbs carry the person, and they usually match: θέλω να <b>πάω</b>,
    θέλεις να <b>πας</b>. They differ only when the two subjects differ:
    <b>θέλω να πας</b> εσύ = I want <i>you</i> to go.</p>

    <h3>2. Μετά από απρόσωπη έκφραση</h3>
    <table class="manual-table">
        <tbody>
            <tr><th>πρέπει</th><td><b>Πρέπει να φύγεις</b> από τώρα;</td></tr>
            <tr><th>μπορεί</th><td>Την Κυριακή <b>μπορεί να πάμε</b> για φαγητό έξω.</td></tr>
            <tr><th>χρειάζεται</th><td>Στις εξετάσεις <b>χρειάζεται να έχετε</b> μαζί σας ταυτότητα.</td></tr>
            <tr><th>είναι ανάγκη<br>είναι απαραίτητο</th><td>Δεν <b>είναι απαραίτητο να με πάρεις</b> τηλέφωνο.</td></tr>
        </tbody>
    </table>
    <p class="manual-note">These never change for person — it is always <b>πρέπει</b>, <b>μπορεί</b>,
    <b>χρειάζεται</b>. The person lives in the second verb: πρέπει <b>να φύγω</b> / <b>να φύγεις</b> /
    <b>να φύγουμε</b>.</p>

    <h3>3. Άρνηση: να μην</h3>
    <ul class="manual-examples">
        <li>Προτιμώ <b>να μην</b> πάω απόψε.</li>
        <li>Πρέπει <b>να μην</b> ξεχάσεις τα εισιτήρια.</li>
    </ul>
    <p class="manual-note">The <b>μην</b> goes between να and the verb, never before να.</p>

    <h3>4. Δύο εκφράσεις</h3>
    <table class="manual-table">
        <tbody>
            <tr><th>έχω να</th><td>Δε θα βγω απόψε γιατί <b>έχω να διαβάσω</b> για το τεστ.<span>= πρέπει να διαβάσω</span></td></tr>
            <tr><th>λέω να</th><td><b>Λέω να φύγω</b> νωρίς.<span>= σκέφτομαι να φύγω νωρίς</span></td></tr>
        </tbody>
    </table>

    <h3>5. Απλή ή εξακολουθητική;</h3>
    <table class="manual-table">
        <tbody>
            <tr><th>να γράψω</th><td>once — Θέλω <b>να γράψω</b> ένα γράμμα.</td></tr>
            <tr><th>να γράφω</th><td>repeatedly — Μου αρέσει <b>να γράφω</b> γράμματα.</td></tr>
        </tbody>
    </table>

    <h3>6. Λάθη που κοστίζουν</h3>
    <ul class="manual-examples manual-bad">
        <li><s>Θέλω πάω στην Ελλάδα.</s> → Θέλω <b>να πάω</b> (there is no “to go”)</li>
        <li><s>Πρέπουμε να φύγουμε.</s> → <b>Πρέπει</b> να φύγουμε (πρέπει never changes)</li>
        <li><s>Προτιμώ μην πάω.</s> → Προτιμώ <b>να μην</b> πάω</li>
        <li><s>Μπορείς να παίρνεις τηλέφωνο τώρα;</s> → να <b>πάρεις</b> (one call, not a habit)</li>
    </ul>
</article>`
    },
    {
        id: "diminutives",
        title: "Υποκοριστικά",
        en: "diminutives",
        blurb: "The friendly -άκι: ουζάκι, μπιρίτσα, ταβερνούλα, Γιωργάκης",
        area: "Λεξιλόγιο",
        sentences: ["Υποκοριστικά"],
        manual: `<article class="manual">
    <h2>Υποκοριστικά — the small, friendly form</h2>
    <p class="manual-lead">Greek shrinks a word to make it smaller, but far more often to make it
    <i>warmer</i>. <b>Ένα ουζάκι</b> is not a small ouzo, it is a nice ouzo among friends. You will hear
    these constantly in a taverna and in people's names.</p>

    <h3>1. Οι καταλήξεις</h3>
    <table class="manual-table">
        <thead><tr><th>κατάληξη</th><th>από</th><th>γίνεται</th></tr></thead>
        <tbody>
            <tr><td><b>-άκι</b> (το)</td><td>το ούζο, το κρασί, ο καφές, η ταβέρνα, η Μαρία</td><td>το ουζ<b>άκι</b>, το κρασ<b>άκι</b>, το καφεδ<b>άκι</b>, το ταβερν<b>άκι</b>, το Μαρ<b>άκι</b></td></tr>
            <tr><td><b>-ίτσα</b> (η)</td><td>η μπίρα, η ταβέρνα</td><td>η μπιρ<b>ίτσα</b>, η ταβερν<b>ίτσα</b></td></tr>
            <tr><td><b>-ούλα</b> (η)</td><td>η σαλάτα, η ταβέρνα</td><td>η σαλατ<b>ούλα</b>, η ταβερν<b>ούλα</b></td></tr>
            <tr><td><b>-άκης</b> (ο)</td><td>ο Γιώργος</td><td>ο Γιωργ<b>άκης</b></td></tr>
        </tbody>
    </table>
    <p class="manual-note manual-warn"><b>-άκι is always neuter</b>, whatever the original was:
    ο καφές is masculine but <b>το</b> καφεδάκι, η ταβέρνα is feminine but <b>το</b> ταβερνάκι.
    That changes the article and every adjective with it: ένα ωραί<b>ο</b> καφεδάκι.</p>

    <h3>2. Πότε τα χρησιμοποιώ</h3>
    <ul class="manual-examples">
        <li>Παραγγελία: Θα πιούμε ένα <b>κρασάκι</b> και θα φάμε ένα <b>σουβλακάκι</b>.</li>
        <li>Τρυφερά: Έλα, <b>Λαουράκι</b>! · Καλό <b>ταξιδάκι</b>!</li>
        <li>Λίγο: Θα μείνω ένα <b>λεπτάκι</b> ακόμα.</li>
    </ul>
    <p class="manual-note">A diminutive in a formal letter or an exam essay reads as childish — it belongs
    in speech, in a taverna, between friends.</p>

    <h3>3. Λάθη που κοστίζουν</h3>
    <ul class="manual-examples manual-bad">
        <li><s>Μία ωραία καφεδάκι.</s> → <b>Ένα ωραίο</b> καφεδάκι (-άκι is neuter)</li>
        <li><s>Θα ήθελα ένα μπιράκι.</s> → μία <b>μπιρίτσα</b> (η μπίρα takes -ίτσα)</li>
    </ul>
</article>`
    },
    {
        id: "present",
        title: "Ενεστώτας",
        en: "present",
        blurb: "What is happening now and what happens as a rule.",
        area: "Ρήματα",
        sentences: [],
        todo: true,
        manual: `<article class="manual">
    <h2>Ενεστώτας — the present</h2>
    <p class="manual-lead">What is happening now and what happens as a rule.</p>
    <p class="manual-note">Το μάθημα δεν είναι γραμμένο ακόμα. Οι ασκήσεις δουλεύουν κανονικά —
    διάλεξε <b>Practice</b> για αυτό το θέμα.</p>
</article>`,
        drills: [{ format: "choose", src: "js/conjchoice.js", global: "CONJCHOICE", subs: ["Ενεστώτας — present"] },
                  { format: "write", src: "js/conjtype.js", global: "CONJTYPE", subs: ["Ενεστώτας — present"] }]
    },
    {
        id: "imperfect",
        title: "Παρατατικός",
        en: "imperfect",
        blurb: "Was doing, used to do — the past seen as it ran, not as it finished.",
        area: "Ρήματα",
        sentences: ["Παρατατικός"],
        todo: true,
        manual: `<article class="manual">
    <h2>Παρατατικός — the past that lasted</h2>
    <p class="manual-lead">Was doing, used to do — the past seen as it ran, not as it finished.</p>
    <p class="manual-note">Το μάθημα δεν είναι γραμμένο ακόμα. Οι ασκήσεις δουλεύουν κανονικά —
    διάλεξε <b>Practice</b> για αυτό το θέμα.</p>
</article>`,
        drills: [{ format: "choose", src: "js/conjchoice.js", global: "CONJCHOICE", subs: ["Παρατατικός — imperfect"] },
                  { format: "write", src: "js/conjtype.js", global: "CONJTYPE", subs: ["Παρατατικός — imperfect"] }]
    },
    {
        id: "passive",
        title: "Παθητική Φωνή",
        en: "passive voice",
        blurb: "πλένομαι, χτενίζομαι, γράφτηκε — when the subject is on the receiving end.",
        area: "Ρήματα",
        sentences: ["Παθητική Φωνή"],
        todo: true,
        manual: `<article class="manual">
    <h2>Παθητική Φωνή — the passive voice</h2>
    <p class="manual-lead">πλένομαι, χτενίζομαι, γράφτηκε — when the subject is on the receiving end.</p>
    <p class="manual-note">Το μάθημα δεν είναι γραμμένο ακόμα. Οι ασκήσεις δουλεύουν κανονικά —
    διάλεξε <b>Practice</b> για αυτό το θέμα.</p>
</article>`
    },
    {
        id: "genitive",
        title: "Γενική",
        en: "genitive",
        blurb: "Whose, of what — the case that links two nouns.",
        area: "Ονόματα & αντωνυμίες",
        sentences: ["Γενική"],
        todo: true,
        manual: `<article class="manual">
    <h2>Γενική — the genitive</h2>
    <p class="manual-lead">Whose, of what — the case that links two nouns.</p>
    <p class="manual-note">Το μάθημα δεν είναι γραμμένο ακόμα. Οι ασκήσεις δουλεύουν κανονικά —
    διάλεξε <b>Practice</b> για αυτό το θέμα.</p>
</article>`
    },
    {
        id: "weak-pronouns",
        title: "Κλιτικά",
        en: "weak pronouns",
        blurb: "μου, σου, του, τον, την, το — the little words that stand in for a noun.",
        area: "Ονόματα & αντωνυμίες",
        sentences: ["Κλιτικά"],
        todo: true,
        manual: `<article class="manual">
    <h2>Κλιτικά — the weak pronouns</h2>
    <p class="manual-lead">μου, σου, του, τον, την, το — the little words that stand in for a noun.</p>
    <p class="manual-note">Το μάθημα δεν είναι γραμμένο ακόμα. Οι ασκήσεις δουλεύουν κανονικά —
    διάλεξε <b>Practice</b> για αυτό το θέμα.</p>
</article>`
    },
    {
        id: "prepositions",
        title: "Προθέσεις",
        en: "prepositions",
        blurb: "σε, από, με, για, προς, μέχρι — and the accusative that follows them.",
        area: "Προτάσεις & σύνδεση",
        sentences: ["Prep: Airport"],
        todo: true,
        manual: `<article class="manual">
    <h2>Προθέσεις — prepositions and their case</h2>
    <p class="manual-lead">σε, από, με, για, προς, μέχρι — and the accusative that follows them.</p>
    <p class="manual-note">Το μάθημα δεν είναι γραμμένο ακόμα. Οι ασκήσεις δουλεύουν κανονικά —
    διάλεξε <b>Practice</b> για αυτό το θέμα.</p>
</article>`
    },
    {
        id: "conjunctions",
        title: "Σύνδεσμοι",
        en: "linking words",
        blurb: "ότι, να, που, αν, ώστε, επειδή — which linker belongs where.",
        area: "Προτάσεις & σύνδεση",
        sentences: ["Σύνδεσμοι"],
        todo: true,
        manual: `<article class="manual">
    <h2>Σύνδεσμοι — linking two clauses</h2>
    <p class="manual-lead">ότι, να, που, αν, ώστε, επειδή — which linker belongs where.</p>
    <p class="manual-note">Το μάθημα δεν είναι γραμμένο ακόμα. Οι ασκήσεις δουλεύουν κανονικά —
    διάλεξε <b>Practice</b> για αυτό το θέμα.</p>
</article>`
    },
    {
        id: "relative-clauses",
        title: "Αναφορικές Προτάσεις",
        en: "relative clauses",
        blurb: "που and ο οποίος — the clause that describes a noun.",
        area: "Προτάσεις & σύνδεση",
        sentences: ["Αναφορικές Προτάσεις"],
        todo: true,
        manual: `<article class="manual">
    <h2>Αναφορικές Προτάσεις — relative clauses</h2>
    <p class="manual-lead">που and ο οποίος — the clause that describes a noun.</p>
    <p class="manual-note">Το μάθημα δεν είναι γραμμένο ακόμα. Οι ασκήσεις δουλεύουν κανονικά —
    διάλεξε <b>Practice</b> για αυτό το θέμα.</p>
</article>`
    },
    {
        id: "conditionals",
        title: "Υποθετικός Λόγος",
        en: "if-sentences",
        blurb: "αν + what follows, from the real to the impossible.",
        area: "Προτάσεις & σύνδεση",
        sentences: ["Υποθετικός Λόγος"],
        todo: true,
        manual: `<article class="manual">
    <h2>Υποθετικός Λόγος — if-sentences</h2>
    <p class="manual-lead">αν + what follows, from the real to the impossible.</p>
    <p class="manual-note">Το μάθημα δεν είναι γραμμένο ακόμα. Οι ασκήσεις δουλεύουν κανονικά —
    διάλεξε <b>Practice</b> για αυτό το θέμα.</p>
</article>`
    },
    {
        id: "reported-speech",
        title: "Πλάγιος Λόγος",
        en: "reported speech",
        blurb: "Turning what someone said into what you report they said.",
        area: "Προτάσεις & σύνδεση",
        sentences: ["Πλάγιος Λόγος"],
        todo: true,
        manual: `<article class="manual">
    <h2>Πλάγιος Λόγος — reported speech</h2>
    <p class="manual-lead">Turning what someone said into what you report they said.</p>
    <p class="manual-note">Το μάθημα δεν είναι γραμμένο ακόμα. Οι ασκήσεις δουλεύουν κανονικά —
    διάλεξε <b>Practice</b> για αυτό το θέμα.</p>
</article>`
    },
    {
        id: "word-formation",
        title: "Παραγωγή Λέξεων",
        en: "word building",
        blurb: "Endings that turn one word into another: -ση, -τής, -ικός, -άκι.",
        area: "Λεξιλόγιο",
        sentences: ["Παραγωγή Λέξεων"],
        todo: true,
        manual: `<article class="manual">
    <h2>Παραγωγή Λέξεων — building words</h2>
    <p class="manual-lead">Endings that turn one word into another: -ση, -τής, -ικός, -άκι.</p>
    <p class="manual-note">Το μάθημα δεν είναι γραμμένο ακόμα. Οι ασκήσεις δουλεύουν κανονικά —
    διάλεξε <b>Practice</b> για αυτό το θέμα.</p>
</article>`
    },
    {
        id: "idioms",
        title: "Ιδιωματισμοί",
        en: "idioms",
        blurb: "Phrases that do not add up from their words.",
        area: "Λεξιλόγιο",
        sentences: ["Ιδιωματισμοί"],
        todo: true,
        manual: `<article class="manual">
    <h2>Ιδιωματισμοί — idioms</h2>
    <p class="manual-lead">Phrases that do not add up from their words.</p>
    <p class="manual-note">Το μάθημα δεν είναι γραμμένο ακόμα. Οι ασκήσεις δουλεύουν κανονικά —
    διάλεξε <b>Practice</b> για αυτό το θέμα.</p>
</article>`
    },
    {
        id: "time-dates",
        title: "Ώρα & ημερομηνίες",
        en: "time & dates",
        blurb: "Telling the time, saying a date, an age, how long something lasts.",
        area: "Χρόνος",
        sentences: [],
        todo: true,
        manual: `<article class="manual">
    <h2>Ώρα & ημερομηνίες — clock, dates and numbers</h2>
    <p class="manual-lead">Telling the time, saying a date, an age, how long something lasts.</p>
    <p class="manual-note">Το μάθημα δεν είναι γραμμένο ακόμα. Οι ασκήσεις δουλεύουν κανονικά —
    διάλεξε <b>Practice</b> για αυτό το θέμα.</p>
</article>`,
        drills: [{ format: "choose", src: "js/datetime.js", global: "DATETIME" }]
    }
];

// Scripts are fetched once, the first time a topic that needs them is opened.
const loaded = {};
function exercises() {
    const out = [];
    for (const t of TOPICS) for (const d of (t.drills || [])) out.push(d);
    return out;
}
function load() {
    return Promise.all(exercises().map(d => {
        const { src, global } = d;
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

function sourceOf(d) { return d && d.global ? (window[d.global] || null) : null; }

function byId(id) { return TOPICS.find(t => t.id === id) || TOPICS[0]; }

// The areas, in the order the topics declare them — the <optgroup>s of both
// the Grammar and the Practice dropdown come from here, so the two cannot drift.
const AREA_EN = {
    "Ρήματα":                "verbs",
    "Ονόματα & αντωνυμίες":  "nouns & pronouns",
    "Προτάσεις & σύνδεση":   "sentences & linking",
    "Λεξιλόγιο":             "vocabulary",
    "Χρόνος":                "time"
};
function areas() {
    const out = [];
    for (const t of TOPICS) if (t.area && !out.includes(t.area)) out.push(t.area);
    return out;
}
// Both menus print the Greek term with its English, because the Greek term is
// one of the things being learnt, not something to be assumed.
function areaLabel(area) { return AREA_EN[area] ? area + " — " + AREA_EN[area] : area; }
function topicLabel(t)   { return t.en ? t.title + " — " + t.en : t.title; }

// One dealable source of questions: a (module, sub-topic) pair. `subs` on an
// exercise pins a module to part of itself, which is how one conjugation drill
// serves four tense topics.
function streams(topicId, format) {
    const out = [];
    for (const t of TOPICS) {
        if (topicId && t.id !== topicId) continue;
        for (const d of (t.drills || [])) {
            if (format && (d.format || "choose") !== format) continue;
            const source = sourceOf(d);
            if (!source) continue;
            const subs = (d.subs && d.subs.length) ? d.subs : source.TOPICS;
            for (const sub of subs) {
                if (!source.TOPICS.includes(sub)) continue;   // a typo'd sub would silently empty a topic
                out.push({ topicId: t.id, topicTitle: t.title, format: d.format || "choose", sub, source });
            }
        }
    }
    return out;
}

// Which answer formats a topic can offer, from the declaration alone — the tab
// row has to know before the drill scripts have finished loading.
function formatsFor(topicId) {
    const out = new Set();
    const list = topicId ? TOPICS.filter(t => t.id === topicId) : TOPICS;
    for (const t of list) {
        if ((t.sentences || []).length) out.add("choose");
        for (const d of (t.drills || [])) out.add(d.format || "choose");
    }
    return [...out];
}

// "comparatives::Υπερθετικός" → the stream that builds that round. A tense
// label belongs to both a tapping and a typing drill, so the format picks
// between them; without one, the tapping drill answers.
function resolve(value, format) {
    const [topicId, sub] = String(value).split("::");
    const all = streams(null, format);
    return all.find(d => d.topicId === topicId && d.sub === sub) || null;
}

// The deal queue lives here rather than inside buildRound, so consecutive
// rounds continue one shuffled deal instead of re-rolling ten of n every time.
let queue = [];
function dealFrom(all, n, seen) {
    const round = [];
    for (let i = 0; i < n * 5 && round.length < n; i++) {
        if (!queue.length) queue = shuffle(all);
        const d = queue.shift();
        if (!all.includes(d)) continue;
        const [q] = d.source.buildRound(d.sub, 1);
        if (q && !seen.has(q.prompt)) { seen.add(q.prompt); round.push(q); }
    }
    return round;
}

function buildRound(value, n, format) {
    const single = String(value || "").includes("::") ? resolve(value, format) : null;
    if (single) return single.source.buildRound(single.sub, n);
    const topicId = (value && value !== "__all__") ? value : null;
    const all = streams(topicId, format);
    if (!all.length) return [];
    queue = queue.filter(d => all.includes(d));
    return dealFrom(all, n, new Set());
}

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

return { TOPICS, byId, areas, areaLabel, topicLabel, streams, formatsFor, resolve, buildRound, load, sourceOf, shuffle };

})();
