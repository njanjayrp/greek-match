// Checks that a reading text stays inside words.json. Greek inflects, so a
// word counts as known when it shares a long enough stem with a dictionary
// entry; anything else has to be on the BASICS list below, which holds the
// grammar words no dictionary of content words would carry.

export const BASICS = `
ο η το οι τα του της των τον την τους τις στο στη στην στον στους στις στα σε
ένας μια μία ένα έναν μιας ενός και κι ή αλλά όμως γιατί επειδή ότι πως που
να θα δεν δε μη μην ας για με χωρίς από προς κατά μετά πριν ως όπως σαν
είμαι είσαι είναι είμαστε είστε ήταν ήμουν ήσουν ήμασταν ήσασταν
έχω έχεις έχει έχουμε έχετε έχουν είχα είχες είχε είχαμε είχατε είχαν
εγώ εσύ αυτός αυτή αυτό εμείς εσείς αυτοί αυτές αυτά
μου σου του της μας σας τους με σε τον την το τα μένα σένα
κάτι τίποτα κανείς κανένας κανέναν καμία κάποιος κάποια κάποιο κάποιοι κάποιες
όλος όλη όλο όλοι όλες όλα άλλος άλλη άλλο άλλοι άλλες άλλα
εδώ εκεί τώρα τότε πάντα ποτέ συχνά ξανά ακόμα πια μόνο πολύ λίγο πιο πως
ναι όχι πολλή πολλοί πολλές πολλά περισσότερο
ένα δύο τρία τρεις τέσσερα τέσσερις πέντε έξι εφτά οχτώ εννιά δέκα
δεκαπέντε είκοσι τριάντα σαράντα πενήντα ενενήντα εκατό χίλια χρόνια
λέω λέει λένε είπε είπα έλεγε λέγεται
κάνω κάνει κάνουν έκανε έκανα κάναμε κάνουμε κάνεις
πάω πάει πάμε πήγε πήγα πήγαν πηγαίνει πηγαίνουν
έτσι λοιπόν ωστόσο επίσης μάλλον σχεδόν ίσως μπορεί μπορούμε μπορώ μπορείς
ευρώ ώρα ώρες φορά φορές μέρα μέρες χρόνο χρόνος καιρό
όταν αν τη ώσπου όπου μαζί ήδη ακόμη έξω μέσα πάνω κάτω μπροστά πίσω γύρω
χθες σήμερα αύριο απόψε φέτος πέρυσι πρώτα τελικά αρχή κάθε μερικές μερικοί
τόσο όσο πόσο ποιος τι πού πώς καθόλου λοιπόν σιγά μισή μισό νύχτα βράδυ πρωί
σπίτι σπιτιού πόλη πόλης πόλεις δουλειά δουλειάς άνθρωπος άνθρωποι ανθρώπους
οικογένεια οικογένειας νερό ψωμί φαγητό πόρτα πόρτας τραπέζι κρασί
ξέρω ξέρει ξέρεις ξέραμε ήξερα περιμένω περιμένει περίμενε περίμεναν περιμένουν
αρέσει άρεσε αρέσουν λείπω λείπεις λείπει έλειπε φαίνεται φαινόταν
μακριά απόγευμα απογεύματα καινούριο καινούρια καινούριος
ζω ζει ζούσε ζούμε εργάζομαι εργάζεται δρόμος δρόμοι δρόμους θάλασσα θάλασσας
αρχίζω αρχίζει άρχισε νιώθω νιώθει ένιωθε ένιωσα διαλέγω διάλεξε
κοιμάμαι κοιμήθηκε καληνύχτα καλημέρα ευχαριστώ παρακαλώ
μένω μένει μείνει μείνουμε μείναμε έμεινε δουλεύω δουλεύει δούλευε
γίνομαι γίνεται έγινε γίνονται χρειάζομαι χρειάζεται χρειαζόταν
τεσσάρων τριών ίντερνετ τέλος ξανά
Νίκος Νίκο Άννα Κώστας Κώστα Μαρία Μαρίας Ελένη Παρασκευή Σάββατο Κυριακή
ήξερε συχνότερα φωτογραφία φωτογραφίες γιαγιά γάμο γάμος λόγια αιώνα αιώνας
`.trim().split(/\s+/);

export function unaccent(s) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
            .replace(/ς/g, "σ");
}

// Every form the dictionary vouches for, reduced to a comparable stem.
export function knownStems(words) {
    const stems = new Set();
    const add = tok => {
        const t = unaccent(tok).replace(/[^α-ωa-z]/g, "");
        if (t.length >= 3) stems.add(t);
    };
    for (const w of words) {
        for (const piece of w.greek.split(/[\s/()]+/)) add(piece);
    }
    return stems;
}

// A past tense may carry the ε- augment the lemma has not got (έβαψα ← βάψω).
function candidates(word) {
    const w = unaccent(word).replace(/[^α-ωa-z]/g, "");
    const out = [w];
    if (/^ε/.test(w) && w.length > 4) out.push(w.slice(1));
    return out;
}

function commonPrefix(a, b) {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return i;
}

// Two words count as the same word when they agree on a stem and only endings
// differ: ψήσαμε and ψήσω share ψησ, κόσμο and κοστίζω only κοσ but then run
// apart for four more letters, which is a different word.
function sharesStem(word, stems) {
    for (const form of candidates(word)) {
        if (form.length < 3) continue;
        for (const s of stems) {
            const p = commonPrefix(form, s);
            if (p >= 3 && s.length - p <= 3 && form.length - p <= 6) return true;
        }
    }
    return false;
}

export function unknownWords(text, words) {
    const stems  = knownStems(words);
    const basics = new Set(BASICS.map(unaccent));
    const seen   = new Map();
    const plain  = text.replace(/<[^>]+>/g, " ");
    for (const raw of plain.split(/[^Ͱ-Ͽἀ-῿']+/)) {
        if (!raw) continue;
        const key = unaccent(raw);
        if (!key || basics.has(key)) continue;
        if (sharesStem(raw, stems)) continue;
        seen.set(key, (seen.get(key) || 0) + 1);
    }
    return [...seen.keys()].sort();
}
